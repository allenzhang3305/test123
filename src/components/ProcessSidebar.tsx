"use client";

import { useRef } from "react";
import { FileSpreadsheet as FileSpreadsheetIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import toast from "react-hot-toast";
import { CopyableCell } from "@/components/CopyableCell";
import type { Row } from "@/types";

export function ProcessSidebar({
  rows,
  procLoading,
  procError,
  onPick,
  onDrop,
  prevent,
}: {
  rows: Row[];
  procLoading: boolean;
  procError: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  prevent: (e: React.DragEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    toast.success(`Copied to clipboard! \n${text}`);
  };

  return (
    <div className="drawer-side z-40">
      <label htmlFor="process-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <div className="w-80 lg:w-96 bg-base-200 min-h-full p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-3">處理 CSV</h2>
        <div
          onDragEnter={prevent}
          onDragOver={prevent}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-base-300 rounded-xl p-6 text-center cursor-pointer bg-base-100 hover:bg-base-300/40 transition"
          aria-label="拖放 CSV 檔案到此處"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onPick}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheetIcon className="w-8 h-8 text-base-content/60" />
            <div className="text-base">
              <strong>拖放</strong>您的 CSV 檔案到此處，或<u>點擊選擇</u>。
            </div>
            <div className="text-xs text-base-content/60 mt-2">
              我們將抽取：商品名、商品SKU、前台連結、白點商品1/2/3 SKU
            </div>
          </div>
        </div>

        {procLoading && (
          <div className="mt-4 alert alert-info">
            <span className="loading loading-spinner loading-sm" />
            <span>處理中…</span>
          </div>
        )}
        {procError && (
          <div className="mt-4 alert alert-error">
            <span>{procError}</span>
          </div>
        )}

        {!!rows.length && (
          <>
            <p className="mt-4">
              已解析列數：<strong>{rows.length}</strong>
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="table table-xs">
                <thead>
                  <tr>
                    {["商品名", "商品 SKU", "前台連結", "白點商品1 SKU", "白點商品2 SKU", "白點商品3 SKU"].map((h) => (
                      <th key={h} className="whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <CopyableCell
                        text={r.prod_name}
                        id={`name-${i}`}
                        onCopy={handleCopy}
                        hoverBg="base-300"
                      />
                      <CopyableCell
                        text={r.product_sku}
                        id={`sku-${i}`}
                        onCopy={handleCopy}
                        hoverBg="base-300"
                      />
                      <td className="align-top">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noreferrer" className="link link-primary break-all">
                            {r.url}
                          </a>
                        ) : (
                          ""
                        )}
                      </td>
                      {r.dot_skus?.map((dotSku, j) => (
                        <CopyableCell
                          key={j}
                          text={dotSku.sku}
                          id={`dot-${i}-${j}`}
                          onCopy={handleCopy}
                          hoverBg="base-300"
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


