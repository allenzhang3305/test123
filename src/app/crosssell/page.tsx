"use client";

// Page to manage crosssell relationships from CSV uploads
import { useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import {
  Upload as UploadIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { CrossSellItem } from "@/types";
import { useCrosssell } from "@/lib/client/context/crosssell-context";
import { SortableCrossSellRow } from "@/components/crosssell/SortableCrossSellRow";

// Helper to read a file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

// Extract SKUs from the first column of the CSV content
const extractSkusFromCsv = (content: string): string[] => {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return [];
  }

  const lines = trimmedContent.split(/\r?\n/);
  const skus: string[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const delimiter = line.includes(",") ? "," : line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const columns = line.split(delimiter);
    const firstCell = columns[0]?.trim().replace(/^"|"$/g, "");

    if (!firstCell || firstCell.toLowerCase() === "sku") {
      return;
    }

    skus.push(firstCell);
  });

  const uniqueSkus = Array.from(new Set(skus));

  return uniqueSkus;
};

const CrosssellPage = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    crossSellItems,
    setCrossSellItems,
    requestedSkus,
    setRequestedSkus,
    uploadedFileName,
    setUploadedFileName,
    clearCrosssell,
  } = useCrosssell();
  const [storedToken] = useLocalStorage<string>("crosssell-token", "");

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group and sort crosssell items by SKU
  const groupedCrossSellItems = useMemo(() => {
    return requestedSkus.reduce<Record<string, CrossSellItem[]>>((accumulator, sku) => {
      const items = crossSellItems.filter((item) => item.sku === sku);
      // Sort items by position in ascending order
      const sortedItems = items.sort((a, b) => a.position - b.position);
      accumulator[sku] = sortedItems;
      return accumulator;
    }, {});
  }, [crossSellItems, requestedSkus]);

  // Handle drag end event - only update data after drag completes
  const handleDragEnd = (event: DragEndEvent, parentSku: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const items = groupedCrossSellItems[parentSku];
    const oldIndex = items.findIndex((item) => item.linked_product_sku === active.id);
    const newIndex = items.findIndex((item) => item.linked_product_sku === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder items
    const reorderedItems = arrayMove(items, oldIndex, newIndex);

    // Update positions based on new order
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

    // Update the global crossSellItems state
    const newCrossSellItems = crossSellItems.map((item) => {
      if (item.sku !== parentSku) {
        return item;
      }
      const updatedItem = updatedItems.find((u) => u.linked_product_sku === item.linked_product_sku);
      return updatedItem || item;
    });

    setCrossSellItems(newCrossSellItems);
  };

  const handleFetchDummyData = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/crosssell/dummy/get");

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to fetch dummy crosssell data.");
      }

      const data = (await response.json()) as CrossSellItem[];
      setCrossSellItems(Array.isArray(data) ? data : []);
      const skuFromData = Array.from(new Set((Array.isArray(data) ? data : []).map((item) => item.sku))).filter(Boolean);
      setRequestedSkus(skuFromData);
      setUploadedFileName(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error occurred.";
      setErrorMessage(message);
      clearCrosssell();
    } finally {
      setIsLoading(false);
      setIsDragging(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setErrorMessage("Please provide a CSV file.");
        setIsLoading(false);
        return;
      }

      const trimmedToken = storedToken.trim();
      if (!trimmedToken) {
        setErrorMessage("Crosssell bearer token is missing. Please set it in Crosssell Settings.");
        setIsLoading(false);
        return;
      }

      const text = await readFileAsText(file);
      const skus = extractSkusFromCsv(text);

      if (skus.length === 0) {
        setErrorMessage("No valid SKUs found in the CSV. Ensure the first column contains SKUs and a header named 'sku'.");
        setIsLoading(false);
        return;
      }

      setUploadedFileName(file.name);
      setRequestedSkus(skus);

      const response = await fetch("/api/crosssell/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skus, token: trimmedToken }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to fetch crosssell data.");
      }

      const data = (await response.json()) as CrossSellItem[];
      setCrossSellItems(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected error occurred.";
      setErrorMessage(message);
      clearCrosssell();
    } finally {
      setIsLoading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleCsvUpload(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isOutside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;

    if (isOutside) {
      setIsDragging(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleCsvUpload(file);
    }
  };

  const renderCrossSellTables = () => {
    if (!requestedSkus.length) {
      return (
        <div className="text-center py-8 text-base-content/60">
          上傳 CSV 以檢視crosssell資料。
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center py-8">
          <span className="flex items-center justify-center gap-2 text-base-content/60">
            <Loader2Icon className="w-5 h-5 animate-spin" />
            正在抓取crosssell資料…
          </span>
        </div>
      );
    }

    return requestedSkus.map((sku) => {
      const items = groupedCrossSellItems[sku] || [];

      if (items.length === 0) {
        return (
          <div key={sku} className="card bg-base-100 shadow mb-6">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">主商品 SKU：{sku}</h3>
              <div className="text-center py-4 text-base-content/60">
                找不到crosssell項目。
              </div>
            </div>
          </div>
        );
      }

      // Each SKU gets its own table with DndContext and SortableContext
      return (
        <div key={sku} className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">主商品 SKU：{sku}</h3>
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, sku)}
              >
                <table className="table">
                  <thead>
                    <tr className="bg-base-200 text-base-content">
                      <th className="px-4 py-2 text-left">Linked SKU</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext items={items.map((item) => item.linked_product_sku)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => (
                        <SortableCrossSellRow key={item.linked_product_sku} item={item} />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </DndContext>
            </div>
          </div>
        </div>
      );
    });
  };

  const dropZoneClasses = [
    "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
    isDragging && "border-primary bg-primary/10 scale-[1.02]",
    !isDragging && "border-base-300 bg-base-100 hover:bg-base-300/40",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Crosssell總覽</h1>
            <p className="text-base text-base-content/70 max-w-2xl">
              上傳包含 <span className="font-semibold">sku, name, crosssell_skus</span> 欄位的 CSV。我們只使用 SKU 欄位從後端 API 或範例資料來源抓取 crosssell連結。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-md btn-outline btn-info gap-2 hover:bg-info hover:text-info-content disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleFetchDummyData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                ) : (
                  <DownloadIcon className="w-5 h-5" />
                )}
                拉取範例資料
              </button>
              <Link href="/crosssell/settings" className="btn btn-md btn-outline btn-neutral gap-2 hover:bg-neutral hover:text-neutral-content">
                <SettingsIcon className="w-5 h-5" />
                Crosssell設定
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <label htmlFor="crosssell-upload" className="block">
            <div
              className={dropZoneClasses}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input id="crosssell-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <div className="flex flex-col items-center gap-3">
                {isDragging ? (
                  <UploadIcon className="w-8 h-8 text-primary" />
                ) : (
                  <FileSpreadsheetIcon className="w-8 h-8 text-base-content/60" />
                )}
                <div className="text-base">
                  <strong>拖放</strong>您的 CSV 檔案到此處，或<u>點擊選擇</u>。
                </div>
                <div className="text-xs text-base-content/60">
                  需要欄位：<code>sku,name,crosssell_skus</code>
                </div>
              </div>
            </div>
          </label>
        </div>

        {uploadedFileName && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-base-content/70">
            <span className="px-3 py-1 rounded-full bg-base-200 text-base-content">File: {uploadedFileName}</span>
            <span className="px-3 py-1 rounded-full bg-base-200 text-base-content">SKUs: {requestedSkus.length}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 alert alert-error">
            <AlertCircleIcon className="w-5 h-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Crosssell結果</h2>
            {isLoading && (
              <span className="flex items-center gap-2 text-sm text-base-content/60">
                <Loader2Icon className="w-4 h-4 animate-spin" /> 抓取中…
              </span>
            )}
          </div>

          <div className="space-y-4">
            {renderCrossSellTables()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default CrosssellPage;
