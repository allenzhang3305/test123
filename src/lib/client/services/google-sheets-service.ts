import type { Row } from "@/types";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
}

export interface GoogleSheetsResult {
  success: boolean;
  rows?: Row[];
  count?: number;
  message?: string;
  error?: string;
}

/**
 * Pull data from Google Sheets
 */
export async function pullFromGoogleSheet(
  config: GoogleSheetsConfig
): Promise<GoogleSheetsResult> {
  const { spreadsheetId, sheetName } = config;

  if (!spreadsheetId || !sheetName) {
    return { success: false, error: "Spreadsheet ID and Sheet name are required" };
  }

  try {
    const response = await fetch(
      `/api/google-sheets/get?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName)}`
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to get Google Sheet data" };
    }

    if (!data.rows || data.rows.length === 0) {
      return { success: false, error: "No data found in Google Sheet" };
    }

    return {
      success: true,
      rows: data.rows,
      count: data.count || data.rows.length,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to pull Google Sheet data";
    return { success: false, error: errorMessage };
  }
}

/**
 * Push data to Google Sheets
 */
export async function pushToGoogleSheet(
  rows: Row[],
  config: GoogleSheetsConfig
): Promise<GoogleSheetsResult> {
  const { spreadsheetId, sheetName } = config;

  if (!spreadsheetId || !sheetName) {
    return { success: false, error: "Spreadsheet ID and Sheet name are required" };
  }

  try {
    const response = await fetch("/api/google-sheets/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, spreadsheetId, sheetName }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to update Google Sheet" };
    }

    return {
      success: true,
      message: data.message || "Google Sheet updated successfully!",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to update Google Sheet";
    return { success: false, error: errorMessage };
  }
}

/**
 * Prompts for config values if not provided
 */
export function getConfigWithPrompts(
  config: GoogleSheetsConfig
): GoogleSheetsConfig | null {
  let { spreadsheetId, sheetName } = config;

  if (!spreadsheetId?.trim()) {
    spreadsheetId = prompt("Enter Google Sheet ID (from the URL):")?.trim() || "";
    if (!spreadsheetId) {
      return null;
    }
  }

  if (!sheetName?.trim()) {
    sheetName = prompt("Enter sheet name (required):")?.trim() || "";
    if (!sheetName) {
      return null;
    }
  }

  return { spreadsheetId, sheetName };
}
