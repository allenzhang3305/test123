import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Row, DotSku } from "@/types";
import { parseMediaUrl } from "@/lib/shared/utils/str";
import { fetchProductData } from "@/lib/client/services/product-service";
import {
  parseComboArray,
  extractString,
  type ParsedComboItem,
  type ParsedComboDot,
} from "@/lib/client/utils/js-parser";

/**
 * Accepted file extensions for file upload
 */
const ACCEPTED_EXTENSIONS = [".html", ".htm", ".txt", ".js"];

/**
 * Check if file has an accepted extension
 */
function isAcceptedFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return (
    ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext)) ||
    file.type === "text/html" ||
    file.type === "text/plain" ||
    file.type === "application/javascript"
  );
}

/**
 * Unified file upload hook for HTML/JS/TXT files containing combo data.
 * Consolidates logic from useHtmlUpload.ts and useJsUpload.ts (which were 99% identical).
 * 
 * Supports:
 * - .html, .htm files with <script> tags
 * - .txt files with JS array literals
 * - .js files with exports
 */
export const useFileUpload = () => {
  const { setRows, setJsLoading, setJsError } = useRowsStore();
  const [isDragging, setIsDragging] = useState(false);

  const prevent = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      prevent(e);
      if (e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    },
    [prevent]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      prevent(e);
      // Check if we're actually leaving the drop zone
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragging(false);
      }
    },
    [prevent]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setJsLoading(true);
      setJsError(null);
      setRows([]);

      try {
        const text = await file.text();
        const arr = parseComboArray(text);

        // Extract all product SKUs to fetch URLs
        const productSkus = arr
          .map((item: unknown) => {
            const parsedItem = item as ParsedComboItem;
            return extractString(parsedItem?.sku);
          })
          .filter(Boolean);

        // Fetch product data
        const { skuToUrl, skuToName } = await fetchProductData([
          ...new Set(productSkus),
        ]);

        // Transform to Row format
        const transformedRows: Row[] = arr.map((item: unknown) => {
          const parsedItem = item as ParsedComboItem;
          const productSku = extractString(parsedItem?.sku);
          const prodName = skuToName[productSku] ?? "";
          const url = skuToUrl[productSku] ?? "";
          const img = parseMediaUrl(parsedItem?.img) || null;

          // Extract dot SKUs with positions from dots array
          const dotSkus: DotSku[] = [];
          if (Array.isArray(parsedItem?.dots)) {
            parsedItem.dots.forEach((dot: unknown) => {
              const parsedDot = dot as ParsedComboDot;
              const dotSku = extractString(parsedDot?.sku);
              if (dotSku) {
                dotSkus.push({
                  sku: dotSku,
                  top: extractString(parsedDot?.top),
                  left: extractString(parsedDot?.left),
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
        toast.success(`Parsed ${transformedRows.length} items from file`);
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "File parse failed";
        setJsError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setJsLoading(false);
      }
    },
    [setJsLoading, setJsError, setRows]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      prevent(e);
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f && isAcceptedFile(f)) {
        uploadFile(f);
      }
    },
    [prevent, uploadFile]
  );

  const handleFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) uploadFile(f);
    },
    [uploadFile]
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
    uploadFile,
  };
};

// Keep backward compatible export name
export { useFileUpload as useHtmlUpload };
