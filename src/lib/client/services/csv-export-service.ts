import type { Row } from "@/types";

/**
 * Generates CSV content from rows data
 * Extracted from edit-combo/page.tsx handleExportCsv
 */
export function generateCsvContent(rows: Row[]): string {
  const headers = ["product_sku", "prod_name", "url", "img", "dot_skus", "dot_pos"];

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

  // Combine headers and rows
  return [
    headers.join(","),
    ...csvRows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    ),
  ].join("\n");
}

/**
 * Triggers a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports rows data as CSV file
 */
export function exportCsv(rows: Row[]): void {
  const csvContent = generateCsvContent(rows);
  const filename = `combo-data-${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
}
