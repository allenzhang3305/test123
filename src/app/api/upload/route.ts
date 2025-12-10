// app/api/upload/route.ts
import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";
import { Row, DotSku, ProductItem, ProductsListResponse } from "@/types";
import logger from "@/lib/server/logger";
import { BASE_URL } from "@/lib/client/constants/frontend-config";
import { parseProductUrl } from "@/lib/shared/utils/str";

export const runtime = "nodejs"; // ensure Node runtime (not edge)

type ParsedRow = Record<string, string>;

// Helper function to fetch product data (name and URL) from products/list API
async function fetchProductData(skus: string[]): Promise<{
  skuToUrl: Record<string, string>;
  skuToName: Record<string, string>;
}> {
  if (skus.length === 0) return { skuToUrl: {}, skuToName: {} };

  // Call upstream API directly (same as products/list route)
  const payload = JSON.stringify({
    pids: skus,
    fields: "sku,name,url_key",
    page: 1,
    page_size: 100,
  });

  try {
    const response = await fetch(
      `${BASE_URL}/index.php/rest/V1/api/mrl/products/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        redirect: "follow",
      },
    );

    if (!response.ok) {
      logger.warn("Failed to fetch product data", { status: response.status, payload });
      return { skuToUrl: {}, skuToName: {} };
    }

    const json = (await response.json()) as ProductsListResponse[];
    const container = Array.isArray(json) ? json[0] : json;
    const items = (container?.data?.items || []) as ProductItem[];

    const skuToUrl: Record<string, string> = {};
    const skuToName: Record<string, string> = {};

    items.forEach((item: ProductItem) => {
      if (item?.sku) {
        if (item?.url_key) {
          skuToUrl[item.sku] = parseProductUrl(item.url_key);
        }
        if (item?.name) {
          skuToName[item.sku] = item.name;
        }
      }
    });

    return { skuToUrl, skuToName };
  } catch (err) {
    logger.error("Error fetching product data", { err });
    return { skuToUrl: {}, skuToName: {} };
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      logger.warn("no file uploaded under field 'file'");
      return NextResponse.json(
        { error: 'No file uploaded under field "file".' },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const records: ParsedRow[] = parse(csvText, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      // allow common delimiters
      delimiter: [",", "\t", ";"],
    });

    const rows: Row[] = [];

    // Detect format: check if first record has new format columns (export format)
    const firstRecord = records[0] || {};
    const hasConsolidatedFormat = "dot_skus" in firstRecord && "dot_pos" in firstRecord;
    const hasSeparatedFormat = "dot1_sku" in firstRecord || "dot2_sku" in firstRecord || "dot3_sku" in firstRecord || "dot4_sku" in firstRecord;
    const hasNewFormat = "product_sku" in firstRecord || hasSeparatedFormat || hasConsolidatedFormat;
    const hasExportFormat = "img" in firstRecord; // Export format includes img column

    // For new format, collect all product_sku values to fetch product data
    const productSkusToFetch: string[] = [];
    if (hasNewFormat) {
      for (const record of records) {
        const productSku = String(record["product_sku"] ?? "").trim();
        if (productSku) {
          productSkusToFetch.push(productSku);
        }
      }
    }

    // Fetch product data (name and URL) for product SKUs if using new format
    const { skuToUrl, skuToName } =
      hasNewFormat && productSkusToFetch.length > 0
        ? await fetchProductData([...new Set(productSkusToFetch)])
        : {
          skuToUrl: {} as Record<string, string>,
          skuToName: {} as Record<string, string>,
        };

    for (const record of records) {
      let prod_name = "";
      let url = "";
      let skus: DotSku[] = [];
      let product_sku = "";

      if (hasNewFormat) {
        // New format: product_sku, prod_name, url, img, dot1_sku, dot2_sku, etc., dot1_pos, dot2_pos, etc.
        // Or consolidated format: product_sku, prod_name, url, img, dot_skus, dot_pos
        const productSku = String(record["product_sku"] ?? "").trim();
        product_sku = productSku;

        // Get product name and URL - prefer CSV values if available (export format), otherwise fetch from API
        prod_name = productSku ? skuToName[productSku] ?? "" : "";
        url = productSku ? skuToUrl[productSku] ?? "" : "";

        if (hasConsolidatedFormat) {
          // Parse consolidated format: dot_skus and dot_pos are comma-separated
          const dotSkusStr = String(record["dot_skus"] ?? "").trim();
          const dotPosStr = String(record["dot_pos"] ?? "").trim();

          if (dotSkusStr) {
            const dotSkus = dotSkusStr.split(";").map(s => s.trim()).filter(s => s);
            const dotPositions = dotPosStr ? dotPosStr.split(";").map(p => p.trim()) : [];

            dotSkus.forEach((sku, index) => {
              if (sku) {
                const pos = dotPositions[index] || "";
                let top = "";
                let left = "";

                if (pos) {
                  const parts = pos.split(":");
                  if (parts.length === 2) {
                    // Format is "top:left" - preserve % signs if present
                    top = parts[0].trim();
                    left = parts[1].trim();
                  } else if (parts.length === 1 && parts[0]) {
                    // Handle cases like "50:" or ":30"
                    top = parts[0].trim();
                  }
                }

                skus.push({
                  sku: sku,
                  top: top || "",
                  left: left || "",
                });
              }
            });
          }
        } else {
          // Parse separated format: dot1_sku, dot2_sku, etc. and dot1_pos, dot2_pos, etc.
          for (let i = 1; i <= 4; i++) {
            const dotSku = String(record[`dot${i}_sku`] ?? "").trim();
            const dotPos = String(record[`dot${i}_pos`] ?? "").trim();
            if (dotSku) {
              // Parse position: format is "top:left" (e.g., "50%:30%" or "50:30")
              let top = "";
              let left = "";
              if (dotPos) {
                const parts = dotPos.split(":");
                if (parts.length === 2) {
                  // Format is "top:left" - preserve % signs if present
                  top = parts[0].trim();
                  left = parts[1].trim();
                } else if (parts.length === 1 && parts[0]) {
                  // Handle cases like "50:" or ":30"
                  top = parts[0].trim();
                }
              }
              skus.push({
                sku: dotSku,
                top: top || "",
                left: left || "",
              });
            }
          }
        }
      } else {
        // Old format: Chinese column names
        const skus_keys = Object.keys(record).filter((key) =>
          key.includes("白點商品")
        );
        const prod_name_key = Object.keys(record).find((key) =>
          key.includes("需修改品項")
        );
        const url_key = Object.keys(record).find((key) =>
          key.includes("前台連結") && !key.includes("release")
        );

        skus = skus_keys.reduce((acc, key) => {
          const sku = String(record[key] ?? "").trim();
          if (sku) {
            acc.push({
              sku: sku,
              top: "",
              left: "",
            });
          }
          return acc;
        }, [] as DotSku[]);
        prod_name = String(record[prod_name_key ?? ""] ?? "").trim();
        url = String(record[url_key ?? ""] ?? "").trim();
        product_sku = "";
      }

      // Get img from CSV if available (export format includes it)
      let img: string | null = null;
      if (hasNewFormat && hasExportFormat) {
        const csvImg = String(record["img"] ?? "").trim();
        img = csvImg || null;
      }

      rows.push({
        product_sku,
        prod_name: prod_name,
        url: url,
        img: img,
        dot_skus: skus,
      });
    }
    logger.info("csv parsed", { count: rows.length });
    return NextResponse.json({ count: rows.length, rows });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("failed to parse CSV", { err });
    return NextResponse.json(
      { error: `Failed to parse CSV: ${errorMessage}` },
      { status: 500 }
    );
  }
}
