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
          返回編輯組合圖
        </Link>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          設定
        </h1>
        <p className="text-base-content/70 mt-2">
          配置您的 Google Sheets 設定以進行自動更新
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4 flex items-center gap-2">
            <FileSpreadsheetIcon className="w-6 h-6" />
            Google Sheets 配置
          </h2>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">試算表 ID</span>
              <span className="label-text-alt text-base-content/60">必填</span>
            </label>
            <input
              type="text"
              placeholder="輸入從網址取得的試算表 ID"
              value={spreadsheetId}
              onChange={handleSpreadsheetIdChange}
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60 text-wrap">
                在 Google Sheet 網址中找到：{" "}
                <code className="text-xs bg-base-200 px-1 py-0.5 rounded">
                  https://docs.google.com/spreadsheets/d/
                  <span className="text-primary">您的試算表_ID</span>
                  /edit
                </code>
              </span>
            </label>
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-semibold">工作表名稱</span>
              <span className="label-text-alt text-base-content/60">必填</span>
            </label>
            <input
              type="text"
              placeholder="輸入工作表名稱（例如 Sheet1）"
              value={sheetName}
              onChange={handleSheetNameChange}
              className="input input-bordered w-full"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                要更新的工作表分頁名稱（必須完全匹配）
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
              儲存配置
            </button>
          </div>
        </div>
      </div>

      {mounted && config.spreadsheetId && config.sheetName && (
        <div className="alert alert-success mt-6 border-l-4 border-l-success">
          <InfoIcon className="w-6 h-6 shrink-0 text-success" />
          <div className="flex-1">
            <h3 className="font-bold text-success">✓ 配置已啟用</h3>
            <div className="text-sm mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">試算表 ID：</span>
                <code className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-xs font-mono">
                  {config.spreadsheetId}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">工作表名稱：</span>
                <code className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded text-xs font-mono">
                  {config.sheetName}
                </code>
              </div>
              {googleSheetUrl && (
                <p className="mt-2">
                  <strong>Google Sheet 網址：</strong>{" "}
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
            如何找到您的試算表 ID
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>在網頁瀏覽器中開啟您的 Google Sheet</li>
            <li>
              查看網址列中的網址，應該看起來像這樣：
              <br />
              <code className="block bg-base-100 px-2 py-1 rounded mt-1 text-xs">
                https://docs.google.com/spreadsheets/d/
                <span className="text-primary font-bold">abc123xyz456</span>
                /edit#gid=0
              </code>
            </li>
            <li>
              複製 <code className="bg-base-100 px-1 rounded text-xs">/d/</code> 和{" "}
              <code className="bg-base-100 px-1 rounded text-xs">/edit</code> 之間的部分（上方突出顯示的部分）
            </li>
            <li>將其貼到上方的試算表 ID 欄位</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

