import type { SimplifiedProduct } from "@/types";

/**
 * Result type for product data fetching
 */
export interface ProductDataResult {
  skuToUrl: Record<string, string>;
  skuToName: Record<string, string>;
  skuToImage: Record<string, string | null>;
}

/**
 * Fetches product data (name, URL, image) for given SKUs from products/list API.
 * Consolidates logic previously duplicated across:
 * - useHtmlUpload.ts
 * - useJsUpload.ts  
 * - edit-combo/page.tsx
 * - upload/route.ts (server-side, not affected by this)
 * 
 * @param skus - Array of product SKUs to fetch
 * @returns ProductDataResult with mappings from SKU to url/name/image
 */
export async function fetchProductData(
  skus: string[]
): Promise<ProductDataResult> {
  const emptyResult: ProductDataResult = {
    skuToUrl: {},
    skuToName: {},
    skuToImage: {},
  };

  if (skus.length === 0) return emptyResult;

  try {
    const response = await fetch("/api/products/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pids: skus }),
    });

    if (!response.ok) {
      console.error("Failed to fetch product data", { status: response.status });
      return emptyResult;
    }

    const products = (await response.json()) as SimplifiedProduct[];

    if (!Array.isArray(products)) {
      console.error("Invalid response format from products API");
      return emptyResult;
    }

    const result: ProductDataResult = {
      skuToUrl: {},
      skuToName: {},
      skuToImage: {},
    };

    products.forEach((product: SimplifiedProduct) => {
      if (product?.sku) {
        if (product.url) {
          result.skuToUrl[product.sku] = product.url;
        }
        if (product.name) {
          result.skuToName[product.sku] = product.name;
        }
        if (product.image !== undefined) {
          result.skuToImage[product.sku] = product.image;
        }
      }
    });

    return result;
  } catch (err) {
    console.error("Error fetching product data", { err });
    return emptyResult;
  }
}

/**
 * Fetches product data for a single SKU
 * @param sku - Product SKU to fetch
 * @returns SimplifiedProduct or null if not found
 */
export async function fetchSingleProduct(
  sku: string
): Promise<SimplifiedProduct | null> {
  const result = await fetchProductData([sku]);

  if (result.skuToName[sku]) {
    return {
      sku,
      name: result.skuToName[sku],
      url: result.skuToUrl[sku] || "",
      image: result.skuToImage[sku] ?? null,
    };
  }

  return null;
}
