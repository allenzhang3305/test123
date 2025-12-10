"use client";

import { useCopyToClipboard } from "usehooks-ts";
import toast from "react-hot-toast";
import { X as XIcon, Plus as PlusIcon, Copy as CopyIcon, Undo as UndoIcon, Redo as RedoIcon, Download as DownloadIcon, Upload as UploadIcon, FileCode as FileCodeIcon, Sparkles as SparklesIcon, Eye as EyeIcon } from "lucide-react";
import { CopyableCell } from "@/components/CopyableCell";
import { ResizableTableContainer } from "@/components/ResizableTableContainer";
import { CsvDropZone } from "@/components/CsvDropZone";
import { HtmlDropZone } from "@/components/HtmlDropZone";
import { VisualizationSection } from "@/components/VisualizationSection";
import { useRowsStore } from "@/stores/useRowsStore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSidebar } from "@/lib/client/context/sidebar-context";
import type { SimplifiedProduct, Row, DotSku } from "@/types";
import { fetchProducts } from "@/lib/client/getProducts";
import { parseMediaUrl } from "@/lib/shared/utils/str";
import { suggestPositionsForProduct } from "@/lib/client/ai-utils";
import pLimit from "p-limit";
import { useEffect, useState, useCallback, useMemo, useRef, ChangeEvent } from "react";

export default function Page() {
  const { 
    rows, setRows, clearRows, csvLoading, csvError, jsLoading, jsError, updateRow, deleteRow,
    history, undo, redo, lastUndoRedoIndex
  } = useRowsStore();
  const { isCollapsed } = useSidebar();
  const [, copyToClipboard] = useCopyToClipboard();
  const [dotProductImages, setDotProductImages] = useState<Record<string, string | null>>({});
  const [dotProductNames, setDotProductNames] = useState<Record<string, string>>({});
  const [failedDotSkus, setFailedDotSkus] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState(false);
  const [isSuggestingAll, setIsSuggestingAll] = useState(false);
  // Manage Add Main Product modal visibility and user input
  const [isAddMainProductOpen, setIsAddMainProductOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [mainProductSku, setMainProductSku] = useState("");
  const [mainProductImage, setMainProductImage] = useState("");
  const [dotSkuInputs, setDotSkuInputs] = useState<string[]>(Array(2).fill(""));
  const [googleSheetsConfig] = useLocalStorage<{
    spreadsheetId: string;
    sheetName: string;
  }>("google-sheets-config", {
    spreadsheetId: "",
    sheetName: "",
  });
  const updateSheetModalRef = useRef<HTMLDialogElement>(null);
  const [pendingSpreadsheetId, setPendingSpreadsheetId] = useState<string>("");
  const [pendingSheetName, setPendingSheetName] = useState<string>("");
  // Sort state: 'asc' = ascending, 'desc' = descending
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Sort rows by index (row number) - returns array with original index preserved
  const sortedRows = useMemo(() => {
    const indexedRows = rows.map((row, index) => ({ row, originalIndex: index }));
    return [...indexedRows].sort((a, b) => {
      return sortOrder === "asc" ? a.originalIndex - b.originalIndex : b.originalIndex - a.originalIndex;
    });
  }, [rows, sortOrder]);



  // Scroll to affected row when undo/redo happens
  useEffect(() => {
    if (lastUndoRedoIndex !== null) {
      const element = document.getElementById(`row-card-${lastUndoRedoIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight effect could be added here
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 1500);
      }
    }
  }, [lastUndoRedoIndex]);

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    toast.success(`Copied ${id} to clipboard!`);
  };

  // Show Add Main Product modal when CTA is clicked
  const handleAddMainProductClick = () => {
    setIsAddMainProductOpen(true);
  };

  // Close Add Main Product modal and reset input
  const handleCloseAddMainProduct = () => {
    setIsAddMainProductOpen(false);
    setMainProductSku("");
    setMainProductImage("");
    setDotSkuInputs(Array(2).fill(""));
  };

  // Add another dot SKU input field
  const handleAddDotSkuInput = () => {
    setDotSkuInputs([...dotSkuInputs, ""]);
  };

  // Keep SKU input in sync with state
  const handleMainProductSkuChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMainProductSku(event.target.value);
  };

  // Track image input changes
  const handleMainProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMainProductImage(event.target.value);
  };

  // Track dot SKU input changes
  const handleDotSkuChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextDotSkuInputs = [...dotSkuInputs];
    nextDotSkuInputs[index] = event.target.value;
    setDotSkuInputs(nextDotSkuInputs);
  };

  // Persist a new row with only the SKU filled so user can enrich later
  const handleSaveMainProduct = () => {
    const trimmedSku = mainProductSku.trim();
    if (!trimmedSku) {
      toast.error("Please enter a main product SKU.");
      return;
    }

    if (rows.some((row) => row.product_sku === trimmedSku)) {
      toast.error("This SKU already exists in the list.");
      return;
    }

    const newDotSkus: DotSku[] = dotSkuInputs.map((skuValue) => ({
      sku: skuValue.trim(),
      top: "",
      left: "",
    }));

    const newRow: Row = {
      product_sku: trimmedSku,
      prod_name: "",
      url: "",
      img: mainProductImage.trim(),
      dot_skus: newDotSkus,
    };

    // Pass index of the new row to setRows for history tracking
    const newIndex = rows.length;
    setRows([...rows, newRow], newIndex);
    toast.success("Main product added. Remember to fill in the remaining fields.");
    handleCloseAddMainProduct();
  };

  const handleExportCsv = () => {
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    // CSV header
    const headers = [
      "product_sku",
      "prod_name",
      "url",
      "img",
      "dot_skus",
      "dot_pos",
    ];

    // Convert rows to CSV format
    const csvRows = rows.map((row) => {
      // Collect all dot SKUs (filter out empty ones)
      const dotSkus = row.dot_skus
        .filter((dot) => dot.sku?.trim())
        .map((dot) => dot.sku.trim());

      // Collect all dot positions
      const dotPositions = row.dot_skus
        .filter((dot) => dot.sku?.trim())
        .map((dot) => {
          if (dot.top && dot.left) {
            return `${dot.top}:${dot.left}`;
          } else if (dot.top) {
            return `${dot.top}:`;
          } else if (dot.left) {
            return `:${dot.left}`;
          }
          return "";
        });

      return [
        row.product_sku || "",
        row.prod_name || "",
        row.url || "",
        row.img || "",
        dotSkus.join(";"),
        dotPositions.join(";"),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `combo-data-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV file exported successfully!");
  };

  const handlePullGoogleSheet = async () => {
    // Use configured spreadsheet ID or prompt for it
    let spreadsheetId = googleSheetsConfig.spreadsheetId?.trim();
    if (!spreadsheetId) {
      spreadsheetId = prompt("Enter Google Sheet ID (from the URL):")?.trim() || "";
      if (!spreadsheetId) {
        toast.error("Spreadsheet ID is required. You can configure it in Settings.");
        return;
      }
    }

    // Use configured sheet name or prompt for it
    let sheetName = googleSheetsConfig.sheetName?.trim();
    if (!sheetName) {
      sheetName = prompt("Enter sheet name (required):")?.trim() || "";
      if (!sheetName) {
        toast.error("Sheet name is required. You can configure it in Settings.");
        return;
      }
    }

    try {
      toast.loading("Pulling data from Google Sheet...", { id: "pull-sheet" });

      const response = await fetch(
        `/api/google-sheets/get?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get Google Sheet data");
      }

      if (!data.rows || data.rows.length === 0) {
        toast.error("No data found in Google Sheet", { id: "pull-sheet" });
        return;
      }

      // Replace current rows with data from Google Sheet
      setRows(data.rows);

      toast.success(`Successfully pulled ${data.count || data.rows.length} rows from Google Sheet!`, {
        id: "pull-sheet",
      });
    } catch (err) {
      console.error("Error pulling Google Sheet", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to pull Google Sheet data";
      toast.error(errorMessage, { id: "pull-sheet" });
    }
  };

  // Show confirmation modal before updating sheet
  const handleUpdateGoogleSheet = () => {
    if (rows.length === 0) {
      toast.error("No data to update");
      return;
    }

    // Use configured spreadsheet ID or prompt for it
    let spreadsheetId = googleSheetsConfig.spreadsheetId?.trim();
    if (!spreadsheetId) {
      spreadsheetId = prompt("Enter Google Sheet ID (from the URL):")?.trim() || "";
      if (!spreadsheetId) {
        toast.error("Spreadsheet ID is required. You can configure it in Settings.");
        return;
      }
    }

    // Use configured sheet name or prompt for it
    let sheetName = googleSheetsConfig.sheetName?.trim();
    if (!sheetName) {
      sheetName = prompt("Enter sheet name (required):")?.trim() || "";
      if (!sheetName) {
        toast.error("Sheet name is required. You can configure it in Settings.");
        return;
      }
    }

    // Store values for confirmation
    setPendingSpreadsheetId(spreadsheetId);
    setPendingSheetName(sheetName);

    // Show confirmation modal
    updateSheetModalRef.current?.showModal();
  };

  // Actually perform the update after confirmation
  const confirmUpdateGoogleSheet = async () => {
    // Close modal first
    updateSheetModalRef.current?.close();

    // Use stored values from modal trigger
    const spreadsheetId = pendingSpreadsheetId.trim();
    const sheetName = pendingSheetName.trim();

    if (!spreadsheetId || !sheetName) {
      toast.error("Spreadsheet ID and Sheet name are required.");
      return;
    }

    try {
      toast.loading("Updating Google Sheet...", { id: "update-sheet" });

      const response = await fetch("/api/google-sheets/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows,
          spreadsheetId,
          sheetName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update Google Sheet");
      }

      toast.success(data.message || "Google Sheet updated successfully!", {
        id: "update-sheet",
      });
    } catch (err) {
      console.error("Error updating Google Sheet", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update Google Sheet";
      toast.error(errorMessage, { id: "update-sheet" });
    }
  };

  // Handle modal close
  const handleCloseUpdateModal = () => {
    updateSheetModalRef.current?.close();
  };

  // Handle import from text input
  const handleImportFromText = async () => {
    if (!importText.trim()) {
      toast.error("Please enter some text to import");
      return;
    }

    try {
      // Use the same logic as HtmlDropZone but with the text input
      const { setRows, setJsLoading, setJsError } = useRowsStore.getState();
      setJsLoading(true);
      setJsError(null);
      setRows([]);

      // Import the safeEvalArray function logic
      const parseText = (text: string): unknown[] => {
        // Extract content from <script> tags
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        const scriptMatches = [];
        let match;
        while ((match = scriptRegex.exec(text)) !== null) {
          scriptMatches.push(match[1].trim());
        }

        // If no script tags found, treat as plain JavaScript
        const jsContent = scriptMatches.length > 0 ? scriptMatches.join('\n') : text;

        try {
          const sanitized = jsContent
            .replace(/\bexport\s+default\b/g, "")
            .replace(/\bexport\b/g, "");
          const fn1 = new Function(
            `${sanitized}; return (typeof allRecomComboData !== 'undefined' ? allRecomComboData : undefined);`
          );
          const r1 = fn1();
          if (Array.isArray(r1)) return r1;
        } catch {}
        try {
          const start = jsContent.indexOf("[");
          const end = jsContent.lastIndexOf("]");
          if (start >= 0 && end > start) {
            const literal = jsContent.slice(start, end + 1);
            const fn2 = new Function(`return (${literal});`);
            const r2 = fn2();
            if (Array.isArray(r2)) return r2;
          }
        } catch {}
        const fn3 = new Function(`return (${jsContent});`);
        const r3 = fn3();
        if (Array.isArray(r3)) return r3;
        throw new Error("Input did not evaluate to an array");
      };

      const arr = parseText(importText);

      // Extract all product SKUs to fetch URLs
      const productSkus = arr
        .map((item: unknown) => {
          const parsedItem = item as any;
          return String(parsedItem?.sku ?? "").trim();
        })
        .filter(Boolean);

      // Fetch product data using the helper function
      const fetchProductData = async (skus: string[]): Promise<{
        skuToUrl: Record<string, string>;
        skuToName: Record<string, string>;
      }> => {
        if (skus.length === 0) return { skuToUrl: {}, skuToName: {} };

        try {
          const response = await fetch("/api/products/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pids: skus }),
          });

          if (!response.ok) {
            return { skuToUrl: {}, skuToName: {} };
          }

          const products = (await response.json()) as SimplifiedProduct[];

          if (!Array.isArray(products)) {
            return { skuToUrl: {}, skuToName: {} };
          }

          const skuToUrl: Record<string, string> = {};
          const skuToName: Record<string, string> = {};

          products.forEach((product: SimplifiedProduct) => {
            if (product?.sku) {
              if (product?.url) {
                skuToUrl[product.sku] = product.url;
              }
              if (product?.name) {
                skuToName[product.sku] = product.name;
              }
            }
          });

          return { skuToUrl, skuToName };
        } catch (err) {
          console.error("Error fetching product data", { err });
          return { skuToUrl: {}, skuToName: {} };
        }
      };

      const { skuToUrl, skuToName } = await fetchProductData([...new Set(productSkus)]);

      // Transform to Row format
      const transformedRows: Row[] = arr.map((item: unknown) => {
        const parsedItem = item as any;
        const productSku = String(parsedItem?.sku ?? "").trim();
        const prodName = skuToName[productSku] ?? "";
        const url = skuToUrl[productSku] ?? "";
        const img = parseMediaUrl(parsedItem?.img) || null;

        // Extract dot SKUs with positions from dots array
        const dotSkus: DotSku[] = [];
        if (Array.isArray(parsedItem?.dots)) {
          parsedItem.dots.forEach((dot: unknown) => {
            const parsedDot = dot as any;
            const dotSku = String(parsedDot?.sku ?? "").trim();
            if (dotSku) {
              dotSkus.push({
                sku: dotSku,
                top: String(parsedDot?.top ?? "").trim(),
                left: String(parsedDot?.left ?? "").trim(),
              });
            }
          });
        }

        return {
          product_sku: productSku,
          prod_name: prodName,
          url: url,
          img: img,
          dot_skus: dotSkus,
        };
      });

      setRows(transformedRows);
      toast.success(`Parsed ${transformedRows.length} items from text input`);
      setIsImportModalOpen(false);
      setImportText("");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Text import failed";
      toast.error(errorMessage);
    } finally {
      const { setJsLoading } = useRowsStore.getState();
      setJsLoading(false);
    }
  };

  const handleExportHtmlBlock = async () => {
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Collect all unique dot product SKUs to fetch URLs
      const allDotSkus = new Set<string>();
      rows.forEach((row) => {
        row.dot_skus.forEach((dot) => {
          if (dot.sku) {
            allDotSkus.add(dot.sku);
          }
        });
      });

      // Fetch URLs for dot products
      const dotSkuToUrl: Record<string, string> = {};
      if (allDotSkus.size > 0) {
        const dotProducts = await fetchProducts(Array.from(allDotSkus));
        dotProducts.forEach((product: SimplifiedProduct) => {
          if (product?.sku && product?.url) {
            dotSkuToUrl[product.sku] = product.url;
          }
        });
      }

      // Convert rows to JS format
      const jsData = rows.map((row) => {
        const dots = row.dot_skus
          .filter((dot) => dot.sku) // Only include dots with SKU
          .map((dot) => {
            const dotUrl = dotSkuToUrl[dot.sku] || "";
            // Format URL as store direct_url if available
            // Extract url_key from full URL (e.g., "https://www.mrliving.com.tw/antony-dresser-oak.html" -> "antony-dresser-oak")
            let formattedUrl = "";
            if (dotUrl) {
              try {
                const urlObj = new URL(dotUrl);
                const pathname = urlObj.pathname;
                // Extract the url_key (remove leading / and trailing .html)
                const urlKey = pathname.replace(/^\//, '').replace(/\.html$/, '');
                if (urlKey) {
                  formattedUrl = `{{store direct_url='${urlKey}.html'}}`;
                }
              } catch {
                // If URL parsing fails, try simple string extraction
                const match = dotUrl.match(/\/([^\/]+)\.html$/);
                if (match && match[1]) {
                  formattedUrl = `{{store direct_url='${match[1]}.html'}}`;
                }
              }
            }
            
            return {
              sku: dot.sku,
              top: dot.top || "",
              left: dot.left || "",
              ...(formattedUrl && { url: formattedUrl }),
            };
          });

        return {
          name: row.prod_name || "",
          sku: row.product_sku || "",
          img: row.img || "",
          dots: dots,
        };
      });

      // Custom JavaScript serializer (no quotes around keys)
      const serializeToJS = (obj: any, indent = 0): string => {
        const spaces = '  '.repeat(indent);
        if (obj === null) return 'null';
        if (obj === undefined) return 'undefined';
        if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
        if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        if (Array.isArray(obj)) {
          if (obj.length === 0) return '[]';
          const items = obj.map(item => serializeToJS(item, indent + 1));
          return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
        }
        if (typeof obj === 'object') {
          const keys = Object.keys(obj);
          if (keys.length === 0) return '{}';
          const items = keys.map(key => `${key}: ${serializeToJS(obj[key], indent + 1)}`);
          return `{\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}}`;
        }
        return String(obj);
      };

      // Format as JavaScript array
      const scriptContent = `const allRecomComboData = ${serializeToJS(jsData)};`;
      const htmlBlock = `<script>\n${scriptContent}\n</script>`;

      // Create blob and download
      const blob = new Blob([htmlBlock], { type: "text/html;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `combo-data-${new Date().toISOString().split("T")[0]}.txt`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("HTML block exported successfully!");
    } catch (err) {
      console.error("Error exporting HTML block", err);
      toast.error("Failed to export HTML block");
    }
  };

  const handleSuggestAllPositions = async () => {
    if (rows.length === 0) {
      toast.error("No rows to process");
      return;
    }

    // Identify rows that need processing:
    // 1. Have main product image
    // 2. Have at least one dot product with missing position (no top/left) AND has an image
    const rowsToProcess = rows.map((row, index) => ({ row, index })).filter(({ row }) => {
      if (!row.img) return false;
      const missingPosDots = row.dot_skus.filter(dot => (!dot.top && !dot.left) && dotProductImages[dot.sku]);
      return missingPosDots.length > 0;
    });

    if (rowsToProcess.length === 0) {
      toast.success("All dot products already have positions!");
      return;
    }

    const confirm = window.confirm(`Found ${rowsToProcess.length} rows with missing positions. Suggest positions for all?`);
    if (!confirm) return;

    setIsSuggestingAll(true);
    const toastId = toast.loading(`Processing 0/${rowsToProcess.length} rows...`);
    
    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Process concurrently with a limit
    const limit = pLimit(5); // Process 5 rows at a time
    const newRows = [...rows];

    try {
      const promises = rowsToProcess.map(({ row, index }) => {
        return limit(async () => {
          try {
            const result = await suggestPositionsForProduct(row, dotProductImages);
            
            if (result.success && result.updatedDotSkus) {
              // Merge results: only update dots that were missing positions
              const mergedDotSkus = row.dot_skus.map(dot => {
                const newDot = result.updatedDotSkus?.find(d => d.sku === dot.sku);
                if (newDot && (!dot.top && !dot.left)) {
                   return newDot;
                }
                return dot;
              });
              
              newRows[index] = { ...row, dot_skus: mergedDotSkus };
              successCount++;
            } else if (result.retryDelay) {
               const failMsg = result.failCount ? ` (${result.failCount} items failed)` : "";
               toast.error(`Rate limit hit${failMsg}. Retry in ${result.retryDelay}`, { id: toastId, duration: 5000 });
               failCount++;
            } else {
               failCount++;
            }
          } catch (err) {
            console.error(`Error processing row ${index}:`, err);
            failCount++;
          } finally {
            processedCount++;
            // Update toast every few items to avoid spamming
            if (processedCount % 1 === 0 || processedCount === rowsToProcess.length) {
                toast.loading(`Processing ${processedCount}/${rowsToProcess.length} rows... \n(Success: ${successCount}, Failed: ${failCount})`, { id: toastId });
            }
          }
        });
      });

      await Promise.all(promises);
      
      setRows(newRows);
      setRows(newRows);
      if (failCount > 0) {
        toast.error(`Completed! Updated ${successCount} rows. \nFailed: ${failCount}. \nDrink some water, retry after one minute.`, { id: toastId, duration: 6000 });
      } else {
        toast.success(`Completed! Updated ${successCount} rows.`, { id: toastId });
      }

    } catch (error) {
      console.error("Error in bulk suggestion:", error);
      toast.error("Failed to complete bulk suggestion", { id: toastId });
    } finally {
      setIsSuggestingAll(false);
    }
  };


  // Extract SKU list from rows (only SKUs, not positions) - memoized to prevent refetch on position changes
  const allSkus = useMemo(() => {
    const skus = new Set<string>();
    rows.forEach((row) => {
      if (row.product_sku) {
        skus.add(row.product_sku);
      }
      row.dot_skus.forEach((dot) => {
        if (dot.sku) {
          skus.add(dot.sku);
        }
      });
    });
    return Array.from(skus).sort().join(',');
  }, [rows]);

  // Fetch images for main products and dot SKUs
  useEffect(() => {
    const fetchProductImages = async () => {
      if (rows.length === 0) return;
      
      // Collect all unique main product SKUs (that don't have images yet)
      const mainProductSkus = new Set<string>();
      rows.forEach((row) => {
        if (row.product_sku && !row.img) {
          mainProductSkus.add(row.product_sku);
        }
      });

      // Collect all unique dot SKUs
      const allDotSkus = new Set<string>();
      rows.forEach((row) => {
        row.dot_skus.forEach((dot) => {
          if (dot.sku) {
            allDotSkus.add(dot.sku);
          }
        });
      });

      // Combine all SKUs to fetch
      const allSkusToFetch = new Set([...mainProductSkus, ...allDotSkus]);

      if (allSkusToFetch.size === 0) return;

      setLoadingImages(true);
      try {
        const products = await fetchProducts(Array.from(allSkusToFetch));

        const skuToImg: Record<string, string | null> = {};
        const skuToName: Record<string, string> = {};
        const fetchedSkus = new Set<string>();
        
        products.forEach((product: SimplifiedProduct) => {
          if (product?.sku) {
            fetchedSkus.add(product.sku);
            if (product?.image) {
              skuToImg[product.sku] = product.image;
            }
            if (product?.name) {
              skuToName[product.sku] = product.name;
            }
          }
        });

        // Update rows with main product images
        // Only fill in images if img is undefined/empty (not null which indicates intentional absence from source)
        const updatedRows = rows.map((row) => {
          if (row.product_sku && row.img === "" && skuToImg[row.product_sku]) {
            return {
              ...row,
              img: skuToImg[row.product_sku],
            };
          }
          return row;
        });

        // Only update if there are changes
        if (updatedRows.some((row, index) => row.img !== rows[index]?.img)) {
          setRows(updatedRows);
        }

        // Set dot product images and names
        setDotProductImages(skuToImg);
        setDotProductNames(skuToName);

        // Track which dot SKUs failed to fetch
        const requestedDotSkus = Array.from(allDotSkus);
        const failed = new Set<string>(
          requestedDotSkus.filter((sku) => !fetchedSkus.has(sku))
        );
        setFailedDotSkus(failed);
      } catch (err) {
        console.error("Error fetching product images", err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProductImages();
    // Only refetch when SKU list changes, not when positions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSkus, setRows]);


  return (
    <main>
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Edit Combo</h1>
          {rows.length > 0 && (
            <button className="btn btn-ghost btn-sm gap-2" onClick={() => clearRows()}>
              <XIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>


        {(csvLoading || jsLoading) && (
          <div className="mt-4 alert alert-info">
            <span className="loading loading-spinner loading-sm" />
            <span>Processing…</span>
          </div>
        )}
        {csvError && (
          <div className="mt-4 alert alert-error">
            <span>{csvError}</span>
          </div>
        )}
        {jsError && (
          <div className="mt-4 alert alert-error">
            <span>{jsError}</span>
          </div>
        )}

        {/* JS-like input moved to /upload-code */}

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Import Data & Replace
          </button>
        </div>

        <ResizableTableContainer title="Combo Data">
            <table className="table table-xs">
              <thead className="sticky top-0 bg-base-100 z-10">
                <tr>
                  {["", "商品名", "商品SKU", "前台連結", "白點商品 SKUs", "白點商品 position"].map(
                    (h, idx) => (
                      <th key={idx} className="whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="align-top">
                      <button
                        onClick={() => {
                          const element = document.getElementById(`row-card-${i}`);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                            element.classList.add("ring-2", "ring-primary", "ring-offset-2");
                            setTimeout(() => {
                              element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                            }, 1500);
                          }
                        }}
                        className="btn btn-xs btn-ghost btn-circle"
                        title="Go to card"
                        aria-label="Go to card"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                    <CopyableCell
                      text={r.prod_name}
                      id={`name-${i}`}
                      onCopy={handleCopy}
                    />
                    <CopyableCell
                      text={r.product_sku}
                      id={`sku-${i}`}
                      onCopy={handleCopy}
                    />
                    <td className="align-top">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="link link-primary break-all">
                          {r.url}
                        </a>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="align-top">
                      <div className="flex flex-col gap-1">
                        {r.dot_skus?.filter(dot => dot.sku?.trim()).map((dot, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-1 rounded-sm hover:bg-base-200 transition-colors duration-100 cursor-pointer p-1"
                            onClick={() => handleCopy(dot.sku.trim(), `dot-sku-${i}-${j}`)}
                            title="Click to copy"
                          >
                            <span className="text-xs">{dot.sku.trim()}</span>
                            <CopyIcon className="w-3 h-3 opacity-50" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="align-top">
                      <div className="flex flex-col gap-1">
                        {r.dot_skus?.filter(dot => dot.sku?.trim()).map((dot, j) => {
                          const posText = dot.top && dot.left
                            ? `${dot.top}:${dot.left}`
                            : dot.top
                            ? `${dot.top}:`
                            : dot.left
                            ? `:${dot.left}`
                            : '';
                          return (
                            <div
                              key={j}
                              className="flex items-center gap-1 rounded-sm hover:bg-base-200 transition-colors duration-100 cursor-pointer p-1"
                              onClick={() => handleCopy(posText, `dot-pos-${i}-${j}`)}
                              title="Click to copy"
                            >
                              <span className="text-xs">{posText}</span>
                              <CopyIcon className="w-3 h-3 opacity-50" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="space-y-4">
                        <div className="text-lg font-semibold text-base-content/70">
                          No combo data yet
                        </div>
                        <div className="text-sm text-base-content/50 max-w-md mx-auto">
                          Get started by importing data from a CSV/HTML file or pull data from your Google Sheet to begin creating product combinations.
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                          <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="btn btn-primary btn-sm gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Import Data
                          </button>
                          <span className="text-xs text-base-content/40 hidden sm:inline">or</span>
                          <button
                            onClick={handlePullGoogleSheet}
                            className="btn btn-outline btn-info btn-sm gap-2"
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Pull Sheet Data
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ResizableTableContainer>

        {/* Visualization Section */}
        <VisualizationSection
          rows={rows}
          rowsWithIndex={sortedRows}
          dotProductImages={dotProductImages}
          dotProductNames={dotProductNames}
          failedDotSkus={failedDotSkus}
          loadingImages={loadingImages}
          onUpdateRow={updateRow}
          onDeleteRow={deleteRow}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />
      </div>

      {/* History Controls - Undo/Redo */}
      <div
        className={`
          fixed bottom-24 -translate-x-1/2 z-50
          transition-all duration-300 ease-out
          ${isCollapsed ? 'left-1/2' : 'left-[calc(50%+8rem)]'}
        `}
      >
        <div className="flex items-center gap-2 bg-base-100 backdrop-blur-md shadow-2xl rounded-2xl border border-base-300 p-1.5">
          {/* Undo Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              ${history.past.length === 0 
                ? 'bg-base-200 text-base-content/30 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-focus text-primary-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
              }
            `}
            onClick={() => undo()}
            disabled={history.past.length === 0}
            aria-label={`Undo ${history.past.length} action${history.past.length !== 1 ? 's' : ''}`}
            title="Undo"
          >
            <UndoIcon className={`w-5 h-5 transition-transform group-hover:-rotate-12 ${history.past.length === 0 ? '' : 'group-active:rotate-45'}`} />
            <span className="hidden sm:inline text-sm">Undo</span>
            {/* History count badge */}
            {history.past.length > 0 ? (
              <span className="hidden md:flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-content/20 text-primary-content">
                {history.past.length}
              </span>
            ) : null}
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-base-300" />

          {/* Redo Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              ${history.future.length === 0 
                ? 'bg-base-200 text-base-content/30 cursor-not-allowed' 
                : 'bg-secondary hover:bg-secondary-focus text-secondary-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
              }
            `}
            onClick={() => redo()}
            disabled={history.future.length === 0}
            aria-label={`Redo ${history.future.length} action${history.future.length !== 1 ? 's' : ''}`}
            title="Redo"
          >
            <span className="hidden sm:inline text-sm">Redo</span>
            <RedoIcon className={`w-5 h-5 transition-transform group-hover:rotate-12 ${history.future.length === 0 ? '' : 'group-active:-rotate-45'}`} />
            {/* History count badge */}
            {history.future.length > 0 ? (
              <span className="hidden md:flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-secondary-content/20 text-secondary-content">
                {history.future.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Sheet Controls - Pull/Update/Export */}
      <div
        className={`
          fixed bottom-6 -translate-x-1/2 z-50
          transition-all duration-300 ease-out
          ${isCollapsed ? 'left-1/2' : 'left-[calc(50%+8rem)]'}
        `}
      >
        <div className="flex items-center gap-2 bg-base-100 backdrop-blur-md shadow-2xl rounded-2xl border border-base-300 p-1.5">
          {/* Suggest All Positions Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              bg-primary hover:bg-primary-focus text-primary-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer
            `}
            onClick={handleSuggestAllPositions}
            disabled={isSuggestingAll}
            title="Suggest missing positions for all rows"
            aria-label="Suggest missing positions for all rows"
          >
            {isSuggestingAll ? (
               <span className="loading loading-spinner loading-xs"></span>
            ) : (
               <SparklesIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            )}
            <span className="hidden sm:inline text-sm">Suggest All</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-base-300" />

          {/* Pull Sheet Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              bg-info hover:bg-info-focus text-info-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer
            `}
            onClick={handlePullGoogleSheet}
            title="Pull data from Google Sheet"
            aria-label="Pull data from Google Sheet"
          >
            <DownloadIcon className="w-5 h-5 transition-transform group-hover:-rotate-12 group-active:rotate-45" />
            <span className="hidden sm:inline text-sm">Pull Sheet</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-base-300" />

          {/* Update Sheet Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              bg-warning hover:bg-warning-focus text-warning-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer
            `}
            onClick={handleUpdateGoogleSheet}
            title="Update Google Sheet"
            aria-label="Update Google Sheet"
          >
            <UploadIcon className="w-5 h-5 transition-transform group-hover:-rotate-12 group-active:rotate-45" />
            <span className="hidden sm:inline text-sm">Update Sheet</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-base-300" />

          {/* Export HTML Button */}
          <button
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
              transition-all duration-200 ease-out
              bg-secondary hover:bg-secondary-focus text-secondary-content hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer
            `}
            onClick={handleExportHtmlBlock}
            title="Export HTML block"
            aria-label="Export HTML block"
          >
            <FileCodeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline text-sm">Export HTML</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button
          onClick={handleAddMainProductClick}
          className="btn btn-lg btn-circle btn-success shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 animate-pulse hover:animate-none"
          title="Add main product by SKU"
          aria-label="Add main product"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Add Main Product Modal */}
      {isAddMainProductOpen && (
        <div
          className="fixed inset-0 bg-base-300/70 backdrop-blur-sm flex items-center justify-center px-4 z-60"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseAddMainProduct}
        >
          <div className="w-full max-w-md rounded-2xl bg-base-100 shadow-2xl flex flex-col max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 pb-0">
              <h3 className="text-xl font-semibold text-center">Add Main Product</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="form-control w-full">
                <span className="label">
                  <span className="label-text font-semibold">Main Product SKU</span>
                  <span className="label-text-alt text-error">*</span>
                </span>
                <input
                  value={mainProductSku}
                  onChange={handleMainProductSkuChange}
                  type="text"
                  placeholder="Enter main product SKU"
                  className="input input-bordered w-full"
                  autoFocus
                />
              </div>
              <div className="form-control w-full mt-6">
                <span className="label">
                  <span className="label-text font-semibold">Main Product Image URL (optional)</span>
                </span>
                <input
                  value={mainProductImage}
                  onChange={handleMainProductImageChange}
                  type="text"
                  placeholder="https://..."
                  className="input input-bordered w-full"
                />
              </div>
              <div className="mt-6">
                <span className="label-text font-semibold mb-3 block">Dot SKUs (optional)</span>
                <div className="grid grid-cols-1 gap-4">
                  {dotSkuInputs.map((dotSku, index) => (
                    <label key={`dot-sku-${index}`} className="form-control w-full">
                      <span className="label">
                        <span className="label-text">Dot SKU {index + 1}</span>
                      </span>
                      <input
                        value={dotSku}
                        onChange={(event) => handleDotSkuChange(index, event)}
                        type="text"
                        placeholder={`Enter dot SKU ${index + 1}`}
                        className="input input-bordered w-full"
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddDotSkuInput}
                  className="btn btn-sm btn-outline btn-primary mt-4"
                  title="Add another dot SKU input"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Dot SKU
                </button>
              </div>
              <p className="mt-6 text-sm text-base-content/70">
                The SKU will be appended to the table so you can enrich product data afterwards.
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="flex justify-end gap-3">
                <button type="button" className="btn btn-ghost" onClick={handleCloseAddMainProduct}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleSaveMainProduct}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Update Sheet */}
      <dialog ref={updateSheetModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Confirm Update Google Sheet</h3>
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to update the Google Sheet? This will replace all existing data in the sheet with the current {rows.length} row{rows.length !== 1 ? "s" : ""}.
            </p>
            {pendingSheetName && (
              <div className="bg-base-200 rounded-lg p-3 text-sm">
                <p><strong>Sheet Name:</strong> {pendingSheetName}</p>
                {pendingSpreadsheetId && (
                  <p className="mt-1"><strong>Spreadsheet ID:</strong> {pendingSpreadsheetId}</p>
                )}
              </div>
            )}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost" onClick={handleCloseUpdateModal}>
                Cancel
              </button>
            </form>
            <button className="btn btn-accent" onClick={confirmUpdateGoogleSheet}>
              Confirm Update
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCloseUpdateModal}>close</button>
        </form>
      </dialog>

      {/* Import Data Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 bg-base-300/70 backdrop-blur-sm flex items-center justify-center px-4 z-60"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-base-100 shadow-2xl flex flex-col max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
            <div className="p-6 pb-0">
              <h3 className="text-xl font-semibold text-center">Import Data & Replace</h3>
              <p className="text-sm text-base-content/70 text-center mt-2">
                Upload CSV or HTML files to replace your current combo data
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CsvDropZone />
                <HtmlDropZone />
              </div>

              <div className="divider my-6">or</div>

              <div className="space-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">Paste HTML/JavaScript Code</span>
                    <span className="label-text-alt text-xs text-base-content/60">
                      Same format as exported HTML
                    </span>
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`<script>
const allRecomComboData = [
  {
    name: "Product Name",
    sku: "12345",
    img: "image.jpg",
    dots: [
      {
        sku: "dot1",
        top: "10",
        left: "20"
      }
    ]
  }
];
</script>`}
                    className="textarea textarea-bordered w-full h-48 font-mono text-sm"
                    spellCheck={false}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleImportFromText}
                    className="btn btn-primary"
                    disabled={!importText.trim()}
                  >
                    Import from Text
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

 

