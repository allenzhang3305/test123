import { useState } from "react";
import toast from "react-hot-toast";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Row, DotSku, SimplifiedProduct } from "@/types";
import { parseMediaUrl } from "@/lib/shared/utils/str";

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

// Helper function to parse JS file content
const safeEvalArray = (text: string): any[] => {
  try {
    const sanitized = text
      .replace(/\bexport\s+default\b/g, "")
      .replace(/\bexport\b/g, "");
    const fn1 = new Function(
      `${sanitized}; return (typeof allRecomComboData !== 'undefined' ? allRecomComboData : undefined);`
    );
    const r1 = fn1();
    if (Array.isArray(r1)) return r1;
  } catch {}
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const literal = text.slice(start, end + 1);
      const fn2 = new Function(`return (${literal});`);
      const r2 = fn2();
      if (Array.isArray(r2)) return r2;
    }
  } catch {}
  const fn3 = new Function(`return (${text});`);
  const r3 = fn3();
  if (Array.isArray(r3)) return r3;
  throw new Error("Input did not evaluate to an array");
};

export const useJsUpload = () => {
  const { setRows, setJsLoading, setJsError } = useRowsStore();
  const [isDragging, setIsDragging] = useState(false);

  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    prevent(e);
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    prevent(e);
    // Check if we're actually leaving the drop zone (not just moving to a child element)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const uploadJs = async (file: File) => {
    setJsLoading(true);
    setJsError(null);
    setRows([]);
    try {
      const text = await file.text();
      const arr = safeEvalArray(text);
      
      // Extract all product SKUs to fetch URLs
      const productSkus = arr
        .map((item: any) => String(item?.sku ?? "").trim())
        .filter(Boolean);
      
      // Fetch product data
      const { skuToUrl, skuToName } = await fetchProductData([...new Set(productSkus)]);
      
      // Transform to Row format
      const transformedRows: Row[] = arr.map((item: any) => {
        const productSku = String(item?.sku ?? "").trim();
        const prodName = skuToName[productSku] || String(item?.name ?? "").trim();
        const url = skuToUrl[productSku] || "";
        const img = parseMediaUrl(item?.img) || null;
        
        // Extract dot SKUs with positions from dots array
        const dotSkus: DotSku[] = [];
        if (Array.isArray(item?.dots)) {
          item.dots.forEach((dot: any) => {
            const dotSku = String(dot?.sku ?? "").trim();
            if (dotSku) {
              dotSkus.push({
                sku: dotSku,
                top: String(dot?.top ?? "").trim(),
                left: String(dot?.left ?? "").trim(),
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
      toast.success(`Parsed ${transformedRows.length} items from JS file`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "JS file parse failed";
      setJsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setJsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    prevent(e);
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".js") || f.type === "application/javascript" || f.type === "text/javascript")) {
      uploadJs(f);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadJs(f);
  };

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  };
};

