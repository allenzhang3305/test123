import type { Row, SimplifiedProduct } from "@/types";
import { fetchProducts } from "@/lib/client/getProducts";

/**
 * Serializes a JS object to string without quotes around keys.
 * Used for generating allRecomComboData JS format.
 */
export function serializeToJS(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj === "string") {
    return `"${obj.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => serializeToJS(item, indent + 1));
    return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
  }
  if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    const items = keys.map(
      (key) => `${key}: ${serializeToJS((obj as Record<string, unknown>)[key], indent + 1)}`
    );
    return `{\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}}`;
  }
  return String(obj);
}

/**
 * Converts rows to allRecomComboData JS format
 */
export interface ComboDataItem {
  name: string;
  sku: string;
  img: string;
  dots: Array<{
    sku: string;
    top: string;
    left: string;
    url?: string;
  }>;
}

/**
 * Converts rows to allRecomComboData format, fetching dot product URLs
 */
export async function convertRowsToComboData(rows: Row[]): Promise<ComboDataItem[]> {
  // Collect all unique dot product SKUs
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

  return rows.map((row) => {
    const dots = row.dot_skus
      .filter((dot) => dot.sku)
      .map((dot) => {
        const dotUrl = dotSkuToUrl[dot.sku] || "";
        let formattedUrl = "";

        if (dotUrl) {
          try {
            const urlObj = new URL(dotUrl);
            const pathname = urlObj.pathname;
            const urlKey = pathname.replace(/^\//, "").replace(/\.html$/, "");
            if (urlKey) {
              formattedUrl = `{{store direct_url='${urlKey}.html'}}`;
            }
          } catch {
            const match = dotUrl.match(/\/([^/]+)\.html$/);
            if (match?.[1]) {
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
      dots,
    };
  });
}

/**
 * Generates HTML block with allRecomComboData script
 */
export function generateHtmlBlock(comboData: ComboDataItem[]): string {
  const scriptContent = `const allRecomComboData = ${serializeToJS(comboData)};`;
  return `<script>\n${scriptContent}\n</script>`;
}

/**
 * Exports rows as HTML block file
 */
export async function exportHtmlBlock(rows: Row[]): Promise<void> {
  const comboData = await convertRowsToComboData(rows);
  const htmlContent = generateHtmlBlock(comboData);

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `combo-data-${new Date().toISOString().split("T")[0]}.txt`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
