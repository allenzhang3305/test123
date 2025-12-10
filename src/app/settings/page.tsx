"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import toast from "react-hot-toast";
import {
  Save as SaveIcon,
  ArrowLeft as ArrowLeftIcon,
  Info as InfoIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  Settings as SettingsIcon,
  HelpCircle as HelpCircleIcon,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";
import Link from "next/link";

interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
}

const STORAGE_KEY = "google-sheets-config";
const DEFAULT_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: "",
  sheetName: "",
};

export default function SettingsPage() {
  const [config, setConfig] = useLocalStorage<GoogleSheetsConfig>(STORAGE_KEY, DEFAULT_CONFIG);
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_CONFIG.spreadsheetId);
  const [sheetName, setSheetName] = useState(DEFAULT_CONFIG.sheetName);
  const [mounted, setMounted] = useState(false);

  // Only read from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    setSpreadsheetId(config.spreadsheetId);
    setSheetName(config.sheetName);
  }, []);

  // Sync form state with stored config when it changes (after mount)
  useEffect(() => {
    if (mounted) {
      setSpreadsheetId(config.spreadsheetId);
      setSheetName(config.sheetName);
    }
  }, [config, mounted]);

  // Compute Google Sheet URL from spreadsheet ID
  const googleSheetUrl = useMemo(() => {
    if (!config.spreadsheetId) return "";
    return `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`;
  }, [config.spreadsheetId]);

  const handleSave = () => {
    const trimmedSpreadsheetId = spreadsheetId.trim();
    const trimmedSheetName = sheetName.trim();

    if (!trimmedSpreadsheetId) {
      toast.error("Spreadsheet ID is required");
      return;
    }

    if (!trimmedSheetName) {
      toast.error("Sheet name is required");
      return;
    }

    setConfig({
      spreadsheetId: trimmedSpreadsheetId,
      sheetName: trimmedSheetName,
    });

    toast.success("Google Sheets configuration saved!");
  };

  const handleSpreadsheetIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSpreadsheetId(e.target.value);
  };

  const handleSheetNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSheetName(e.target.value);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/edit-combo"
          className="btn btn-ghost btn-sm gap-2 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Edit Combo
        </Link>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-base-content/70 mt-2">
          Configure your Google Sheets settings for automatic updates
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4 flex items-center gap-2">
            <FileSpreadsheetIcon className="w-6 h-6" />
            Google Sheets Configuration
          </h2>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Spreadsheet ID</span>
              <span className="label-text-alt text-base-content/60">Required</span>
            </label>
            <input
              type="text"
              placeholder="Enter Sheet ID from URL"
              value={spreadsheetId}
              onChange={handleSpreadsheetIdChange}
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60 text-wrap">
                Found in the Google Sheet URL:{" "}
                <code className="text-xs bg-base-200 px-1 py-0.5 rounded">
                  https://docs.google.com/spreadsheets/d/
                  <span className="text-primary">YOUR_SHEET_ID</span>
                  /edit
                </code>
              </span>
            </label>
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">Sheet Name</span>
              <span className="label-text-alt text-base-content/60">Required</span>
            </label>
            <input
              type="text"
              placeholder="Enter sheet name (e.g., Sheet1)"
              value={sheetName}
              onChange={handleSheetNameChange}
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                The name of the sheet tab to update (must match exactly)
              </span>
            </label>
          </div>

          <div className="card-actions justify-end">
            <button
              onClick={handleSave}
              className="btn btn-primary gap-2"
              disabled={!spreadsheetId.trim() || !sheetName.trim()}
            >
              <SaveIcon className="w-5 h-5" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {mounted && config.spreadsheetId && config.sheetName && (
        <div className="alert alert-success mt-6 border-l-4 border-l-success">
          <InfoIcon className="w-6 h-6 shrink-0 text-success" />
          <div className="flex-1">
            <h3 className="font-bold text-success">✓ Configuration Active</h3>
            <div className="text-sm mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Spreadsheet ID:</span>
                <code className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-xs font-mono">
                  {config.spreadsheetId}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Sheet Name:</span>
                <code className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-xs font-mono">
                  {config.sheetName}
                </code>
              </div>
              {googleSheetUrl && (
                <p className="mt-2">
                  <strong>Google Sheet URL:</strong>{" "}
                  <a
                    href={googleSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary inline-flex items-center gap-1 text-xs break-all"
                  >
                    {googleSheetUrl}
                    <ExternalLinkIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-200 mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg flex items-center gap-2">
            <HelpCircleIcon className="w-5 h-5" />
            How to Find Your Spreadsheet ID
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open your Google Sheet in a web browser</li>
            <li>
              Look at the URL in the address bar. It should look like:
              <br />
              <code className="block bg-base-100 px-2 py-1 rounded mt-1 text-xs">
                https://docs.google.com/spreadsheets/d/
                <span className="text-primary font-bold">abc123xyz456</span>
                /edit#gid=0
              </code>
            </li>
            <li>
              Copy the part between <code className="bg-base-100 px-1 rounded text-xs">/d/</code> and{" "}
              <code className="bg-base-100 px-1 rounded text-xs">/edit</code> (the highlighted part above)
            </li>
            <li>Paste it into the Spreadsheet ID field above</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

