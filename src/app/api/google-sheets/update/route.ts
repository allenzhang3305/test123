import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Row } from "@/types";
import { getSheetsClient } from "@/lib/server/utils/google";

const requestBodySchema = z.object({
  rows: z.array(z.object({
    product_sku: z.string(),
    prod_name: z.string(),
    url: z.string(),
    img: z.string().nullable(),
    dot_skus: z.array(z.object({
      sku: z.string(),
      top: z.string(),
      left: z.string(),
    })),
  })),
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
});

type RequestBody = z.infer<typeof requestBodySchema>;

/**
 * Convert rows to CSV format (same as export function)
 */
function rowsToCsvData(rows: Row[]): string[][] {
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

  return [headers, ...csvRows];
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const body = requestBodySchema.parse(rawBody);

    if (body.rows.length === 0) {
      return NextResponse.json(
        { error: "No rows data provided" },
        { status: 400 }
      );
    }

    const sheetName = body.sheetName;

    // Escape sheet name if it contains special characters (single quotes for sheet names with spaces/special chars)
    const escapedSheetName =
      sheetName.includes(" ") || sheetName.includes("'")
        ? `'${sheetName.replace(/'/g, "''")}'`
        : sheetName;

    // Get authenticated Sheets client
    const sheets = await getSheetsClient();

    // Convert rows to CSV format
    const csvData = rowsToCsvData(body.rows);

    // Calculate the range dimensions for clearing
    const numRows = csvData.length;

    // Use batchClear to clear the range - this is more reliable than clear
    // Clear a large range to ensure old data is removed
    const clearRange = `${escapedSheetName}!A1:Z${Math.max(
      1000,
      numRows + 100
    )}`;
    await sheets.spreadsheets.values.batchClear({
      spreadsheetId: body.spreadsheetId,
      requestBody: {
        ranges: [clearRange],
      },
    });

    // Update with new data starting from A1
    const updateRange = `${escapedSheetName}!A1`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: body.spreadsheetId,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: csvData,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated Google Sheet with ${body.rows.length} rows`,
      updatedRows: body.rows.length,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update Google Sheet";
    console.error("Google Sheets update error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
