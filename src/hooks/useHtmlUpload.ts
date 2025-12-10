import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Row, DotSku, SimplifiedProduct } from "@/types";
import { parseMediaUrl } from "@/lib/shared/utils/str";

// Types for parsed JS data structure
interface ParsedJsItem {
  sku?: unknown;
  name?: unknown;
  img?: unknown;
  dots?: unknown[];
}

interface ParsedJsDot {
  sku?: unknown;
  top?: unknown;
  left?: unknown;
}

// Helper function to fetch product data (name and URL) from products/list API
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

// Helper function to parse HTML file content (extract script content)
const safeEvalArray = (text: string): unknown[] => {
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

export const useHtmlUpload = () => {
  const { setRows, setJsLoading, setJsError } = useRowsStore();
  const [isDragging, setIsDragging] = useState(false);

  const prevent = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    prevent(e);
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, [prevent]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    prevent(e);
    // Check if we're actually leaving the drop zone (not just moving to a child element)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, [prevent]);

  const uploadHtml = useCallback(async (file: File) => {
    setJsLoading(true);
    setJsError(null);
    setRows([]);
    try {
      const text = await file.text();
      const arr = safeEvalArray(text);
      
      // Extract all product SKUs to fetch URLs
      const productSkus = arr
        .map((item: unknown) => {
          const parsedItem = item as ParsedJsItem;
          return String(parsedItem?.sku ?? "").trim();
        })
        .filter(Boolean);
      
      // Fetch product data
      const { skuToUrl, skuToName } = await fetchProductData([...new Set(productSkus)]);
      
      // Transform to Row format
      const transformedRows: Row[] = arr.map((item: unknown) => {
        const parsedItem = item as ParsedJsItem;
        const productSku = String(parsedItem?.sku ?? "").trim();
        const prodName = skuToName[productSku] ?? "";
        const url = skuToUrl[productSku] ?? "";
        const img = parseMediaUrl(parsedItem?.img) || null;

        // Extract dot SKUs with positions from dots array
        const dotSkus: DotSku[] = [];
        if (Array.isArray(parsedItem?.dots)) {
          parsedItem.dots.forEach((dot: unknown) => {
            const parsedDot = dot as ParsedJsDot;
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
      toast.success(`Parsed ${transformedRows.length} items from file`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "File parse failed";
      setJsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setJsLoading(false);
    }
  }, [setJsLoading, setJsError, setRows]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    prevent(e);
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && ((f.name.endsWith(".html") || f.name.endsWith(".htm") || f.name.endsWith(".txt")) || (f.type === "text/html" || f.type === "text/plain"))) {
      uploadHtml(f);
    }
  }, [prevent, uploadHtml]);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadHtml(f);
  }, [uploadHtml]);

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  };
};

