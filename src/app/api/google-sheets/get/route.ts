import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSheetsClient } from "@/lib/server/utils/google";
import { BASE_URL } from "@/lib/client/constants/frontend-config";
import { parseProductUrl } from "@/lib/shared/utils/str";
import logger from "@/lib/server/logger";
import type { ProductItem, ProductsListResponse, Row } from "@/types";

const queryParamsSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
});

/**
 * Parse position string to top and left values
 * Handles formats like "50%:30%", "50:", ":30", etc.
 */
function parsePosition(pos: string): { top: string; left: string } {
  if (!pos || !pos.trim()) {
    return { top: "", left: "" };
  }

  const parts = pos.split(":");
  if (parts.length === 2) {
    return {
      top: parts[0].trim(),
      left: parts[1].trim(),
    };
  } else if (parts.length === 1) {
    // Handle cases like "50:" or ":30"
    if (pos.startsWith(":")) {
      return { top: "", left: parts[0].trim() };
    } else {
      return { top: parts[0].trim(), left: "" };
    }
  }

  return { top: "", left: "" };
}

/**
 * Convert sheet array data to Row format
 * Sheet format: [product_sku, prod_name, url, img, dot_skus, dot_pos]
 * where dot_skus is semicolon-separated SKUs and dot_pos is semicolon-separated positions
 */
function convertSheetDataToRows(sheetData: string[][]): Row[] {
  return sheetData.map((row) => {
    const dotSkus: Array<{ sku: string; top: string; left: string }> = [];

    // Parse consolidated format: dot_skus and dot_pos columns
    const dotSkusStr = row[4]?.trim() || "";
    const dotPosStr = row[5]?.trim() || "";

    if (dotSkusStr) {
      const skus = dotSkusStr.split(";").map(s => s.trim()).filter(s => s);
      const positions = dotPosStr ? dotPosStr.split(";").map(p => p.trim()) : [];

      skus.forEach((sku, index) => {
        if (sku) {
          const pos = positions[index] || "";
          const { top, left } = parsePosition(pos);
          dotSkus.push({
            sku,
            top,
            left,
          });
        }
      });
    }

    return {
      product_sku: row[0]?.trim() || "",
      prod_name: row[1]?.trim() || "",
      url: row[2]?.trim() || "",
      img: row[3]?.trim() || null,
      dot_skus: dotSkus,
    };
  });
}

async function fetchProductData(skus: string[]) {
  if (skus.length === 0) {
    return {
      skuToUrl: {} as Record<string, string>,
      skuToName: {} as Record<string, string>,
    };
  }

  const payload = JSON.stringify({
    pids: skus,
    fields: "sku,name,url_key",
    page: 1,
    page_size: 100,
  });

  try {
    const response = await fetch(`${BASE_URL}/index.php/rest/V1/api/mrl/products/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      redirect: "follow",
    });

    if (!response.ok) {
      logger.warn("Failed to fetch product data for Google Sheet pull", {
        status: response.status,
        payload,
      });
      return {
        skuToUrl: {} as Record<string, string>,
        skuToName: {} as Record<string, string>,
      };
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
    logger.error("Google Sheets pull failed to fetch product data", { err });
    return {
      skuToUrl: {} as Record<string, string>,
      skuToName: {} as Record<string, string>,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      spreadsheetId: searchParams.get("spreadsheetId"),
      sheetName: searchParams.get("sheetName"),
    };

    const { spreadsheetId, sheetName } = queryParamsSchema.parse(queryParams);

    // Escape sheet name if it contains special characters
    const escapedSheetName =
      sheetName.includes(" ") || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    // Get authenticated Sheets client
    const sheets = await getSheetsClient();

    // Get all data from the sheet (using a large bounded range)
    // The API will return only the actual data range, not the full range
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${escapedSheetName}!A1:Z10000`,
    });

    const values = response.data.values || [];

    if (values.length === 0) {
      return NextResponse.json({
        success: true,
        rows: [],
        message: "Sheet is empty",
      });
    }

    // Skip the header row (first row)
    const dataRows = values.slice(1);

    // Convert sheet data to Row format
    const rows = convertSheetDataToRows(dataRows);

    // Fetch product metadata for any SKUs present
    const requestedSkus = Array.from(
      new Set(
        rows
          .map((row) => row.product_sku)
          .filter((sku): sku is string => Boolean(sku))
      )
    );

    const { skuToUrl, skuToName } =
      requestedSkus.length > 0 ? await fetchProductData(requestedSkus) : {
        skuToUrl: {} as Record<string, string>,
        skuToName: {} as Record<string, string>,
      };

    const enrichedRows = rows.map((row) => {
      if (!row.product_sku) {
        return row;
      }

      const name = skuToName[row.product_sku] ?? "";
      const url = skuToUrl[row.product_sku] ?? "";
      return {
        ...row,
        prod_name: name,
        url,
      };
    });

    return NextResponse.json({
      success: true,
      rows: enrichedRows,
      count: enrichedRows.length,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to get Google Sheet data";
    console.error("Google Sheets get error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

