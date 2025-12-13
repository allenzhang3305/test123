"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useCrosssell } from "@/lib/client/context/crosssell-context";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { CrossSellItem } from "@/types";

/**
 * Read a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Extract SKUs from the first column of CSV content
 */
function extractSkusFromCsv(content: string): string[] {
  const trimmedContent = content.trim();
  if (!trimmedContent) return [];

  const lines = trimmedContent.split(/\r?\n/);
  const skus: string[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const delimiter = line.includes(",") ? "," : line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const columns = line.split(delimiter);
    const firstCell = columns[0]?.trim().replace(/^"|"$/g, "");

    if (!firstCell || firstCell.toLowerCase() === "sku") return;

    skus.push(firstCell);
  });

  return Array.from(new Set(skus));
}

/**
 * Custom hook for crosssell page logic
 */
export function useCrosssellPage() {
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
        setErrorMessage("No valid SKUs found in the CSV.");
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
    if (file) handleCsvUpload(file);
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
    if (isOutside) setIsDragging(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleCsvUpload(file);
  };

  return {
    // State
    isDragging,
    isLoading,
    errorMessage,
    crossSellItems,
    setCrossSellItems,
    requestedSkus,
    uploadedFileName,

    // Handlers
    handleFetchDummyData,
    handleCsvUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileChange,
  };
}
