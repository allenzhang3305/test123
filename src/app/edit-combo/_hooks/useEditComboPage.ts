"use client";

import { useState, useRef, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { useRowsStore } from "@/stores/useRowsStore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Row, DotSku } from "@/types";
import { exportCsv } from "@/lib/client/services/csv-export-service";
import { exportHtmlBlock } from "@/lib/client/services/html-export-service";
import {
  pullFromGoogleSheet,
  pushToGoogleSheet,
  getConfigWithPrompts,
  type GoogleSheetsConfig,
} from "@/lib/client/services/google-sheets-service";
import { importFromText } from "@/lib/client/services/import-service";

/**
 * Custom hook for edit-combo page logic.
 * Extracts all handlers and state management from the page component.
 */
export function useEditComboPage() {
  const {
    rows,
    setRows,
    clearRows,
    csvLoading,
    csvError,
    jsLoading,
    jsError,
    history,
    undo,
    redo,
    lastUndoRedoIndex,
  } = useRowsStore();

  // Modal states
  const [isAddMainProductOpen, setIsAddMainProductOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // Add main product form state
  const [mainProductSku, setMainProductSku] = useState("");
  const [mainProductImage, setMainProductImage] = useState("");
  const [dotSkuInputs, setDotSkuInputs] = useState<string[]>(Array(2).fill(""));

  // Google Sheets config
  const [googleSheetsConfig] = useLocalStorage<GoogleSheetsConfig>(
    "google-sheets-config",
    { spreadsheetId: "", sheetName: "" }
  );
  const updateSheetModalRef = useRef<HTMLDialogElement>(null);
  const [pendingSpreadsheetId, setPendingSpreadsheetId] = useState("");
  const [pendingSheetName, setPendingSheetName] = useState("");

  // Sort state
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ===== Add Main Product Handlers =====
  const handleAddMainProductClick = () => setIsAddMainProductOpen(true);

  const handleCloseAddMainProduct = () => {
    setIsAddMainProductOpen(false);
    setMainProductSku("");
    setMainProductImage("");
    setDotSkuInputs(Array(2).fill(""));
  };

  const handleAddDotSkuInput = () => setDotSkuInputs([...dotSkuInputs, ""]);

  const handleMainProductSkuChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMainProductSku(event.target.value);
  };

  const handleMainProductImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMainProductImage(event.target.value);
  };

  const handleDotSkuChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextDotSkuInputs = [...dotSkuInputs];
    nextDotSkuInputs[index] = event.target.value;
    setDotSkuInputs(nextDotSkuInputs);
  };

  const handleSaveMainProduct = () => {
    const trimmedSku = mainProductSku.trim();
    if (!trimmedSku) {
      toast.error("Please enter a main product SKU.");
      return;
    }

    if (rows.some((row) => row.product_sku === trimmedSku)) {
      toast.error("This SKU already exists in the list.");
      return;
    }

    const newDotSkus: DotSku[] = dotSkuInputs.map((skuValue) => ({
      sku: skuValue.trim(),
      top: "",
      left: "",
    }));

    const newRow: Row = {
      product_sku: trimmedSku,
      prod_name: "",
      url: "",
      img: mainProductImage.trim(),
      dot_skus: newDotSkus,
    };

    const newIndex = rows.length;
    setRows([...rows, newRow], newIndex);
    toast.success("Main product added. Remember to fill in the remaining fields.");
    handleCloseAddMainProduct();
  };

  // ===== Export Handlers =====
  const handleExportCsv = () => {
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportCsv(rows);
    toast.success("CSV file exported successfully!");
  };

  const handleExportHtmlBlock = async () => {
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      await exportHtmlBlock(rows);
      toast.success("HTML block exported successfully!");
    } catch (err) {
      console.error("Error exporting HTML block", err);
      toast.error("Failed to export HTML block");
    }
  };

  // ===== Google Sheets Handlers =====
  const handlePullGoogleSheet = async () => {
    const config = getConfigWithPrompts(googleSheetsConfig);
    if (!config) {
      toast.error("Spreadsheet ID and Sheet name are required. You can configure it in Settings.");
      return;
    }

    toast.loading("Pulling data from Google Sheet...", { id: "pull-sheet" });
    const result = await pullFromGoogleSheet(config);

    if (result.success && result.rows) {
      setRows(result.rows);
      toast.success(`Successfully pulled ${result.count} rows from Google Sheet!`, {
        id: "pull-sheet",
      });
    } else {
      toast.error(result.error || "Failed to pull Google Sheet data", { id: "pull-sheet" });
    }
  };

  const handleUpdateGoogleSheet = () => {
    if (rows.length === 0) {
      toast.error("No data to update");
      return;
    }

    const config = getConfigWithPrompts(googleSheetsConfig);
    if (!config) {
      toast.error("Spreadsheet ID and Sheet name are required. You can configure it in Settings.");
      return;
    }

    setPendingSpreadsheetId(config.spreadsheetId);
    setPendingSheetName(config.sheetName);
    updateSheetModalRef.current?.showModal();
  };

  const confirmUpdateGoogleSheet = async () => {
    updateSheetModalRef.current?.close();

    if (!pendingSpreadsheetId || !pendingSheetName) {
      toast.error("Spreadsheet ID and Sheet name are required.");
      return;
    }

    toast.loading("Updating Google Sheet...", { id: "update-sheet" });
    const result = await pushToGoogleSheet(rows, {
      spreadsheetId: pendingSpreadsheetId,
      sheetName: pendingSheetName,
    });

    if (result.success) {
      toast.success(result.message || "Google Sheet updated successfully!", { id: "update-sheet" });
    } else {
      toast.error(result.error || "Failed to update Google Sheet", { id: "update-sheet" });
    }
  };

  const handleCloseUpdateModal = () => updateSheetModalRef.current?.close();

  // ===== Import Handler =====
  const handleImportFromText = async () => {
    if (!importText.trim()) {
      toast.error("Please enter some text to import");
      return;
    }

    const { setJsLoading, setJsError } = useRowsStore.getState();
    setJsLoading(true);
    setJsError(null);

    const result = await importFromText(importText);

    if (result.success && result.rows) {
      setRows(result.rows);
      toast.success(`Parsed ${result.count} items from text input`);
      setIsImportModalOpen(false);
      setImportText("");
    } else {
      toast.error(result.error || "Text import failed");
    }

    setJsLoading(false);
  };

  return {
    // Store state
    rows,
    setRows,
    clearRows,
    csvLoading,
    csvError,
    jsLoading,
    jsError,
    history,
    undo,
    redo,
    lastUndoRedoIndex,

    // Sort
    sortOrder,
    setSortOrder,

    // Add Main Product Modal
    isAddMainProductOpen,
    setIsAddMainProductOpen,
    mainProductSku,
    mainProductImage,
    dotSkuInputs,
    handleAddMainProductClick,
    handleCloseAddMainProduct,
    handleAddDotSkuInput,
    handleMainProductSkuChange,
    handleMainProductImageChange,
    handleDotSkuChange,
    handleSaveMainProduct,

    // Import Modal
    isImportModalOpen,
    setIsImportModalOpen,
    importText,
    setImportText,
    handleImportFromText,

    // Export
    handleExportCsv,
    handleExportHtmlBlock,

    // Google Sheets
    googleSheetsConfig,
    updateSheetModalRef,
    pendingSpreadsheetId,
    pendingSheetName,
    handlePullGoogleSheet,
    handleUpdateGoogleSheet,
    confirmUpdateGoogleSheet,
    handleCloseUpdateModal,
  };
}
