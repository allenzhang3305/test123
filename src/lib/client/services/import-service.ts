import type { Row, DotSku } from "@/types";
import { parseMediaUrl } from "@/lib/shared/utils/str";
import { fetchProductData } from "@/lib/client/services/product-service";
import {
  parseComboArray,
  extractString,
  type ParsedComboItem,
  type ParsedComboDot,
} from "@/lib/client/utils/js-parser";

export interface ImportResult {
  success: boolean;
  rows?: Row[];
  count?: number;
  error?: string;
}

/**
 * Imports combo data from text input (HTML/JS format)
 * Extracted from edit-combo/page.tsx handleImportFromText
 */
export async function importFromText(text: string): Promise<ImportResult> {
  if (!text.trim()) {
    return { success: false, error: "Please enter some text to import" };
  }

  try {
    const arr = parseComboArray(text);

    // Extract all product SKUs to fetch URLs
    const productSkus = arr
      .map((item: unknown) => {
        const parsedItem = item as ParsedComboItem;
        return extractString(parsedItem?.sku);
      })
      .filter(Boolean);

    // Fetch product data
    const { skuToUrl, skuToName } = await fetchProductData([...new Set(productSkus)]);

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
        url,
        img,
        dot_skus: dotSkus,
      };
    });

    return {
      success: true,
      rows: transformedRows,
      count: transformedRows.length,
    };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Text import failed";
    return { success: false, error: errorMessage };
  }
}
