"use client";

import { AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { forwardRef } from "react";

interface UpdateSheetModalProps {
  spreadsheetId: string;
  sheetName: string;
  rowCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UpdateSheetModal = forwardRef<HTMLDialogElement, UpdateSheetModalProps>(
  function UpdateSheetModal(
    { spreadsheetId, sheetName, rowCount, onConfirm, onCancel },
    ref
  ) {
    return (
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-warning" />
            確認更新 Google Sheet
          </h3>
          <div className="py-4 space-y-2">
            <p className="text-base-content/70">
              即將覆寫 Google Sheet 資料：
            </p>
            <div className="bg-base-200 rounded-lg p-3 text-sm space-y-1">
              <div>
                <span className="font-semibold">Spreadsheet ID:</span>{" "}
                <code className="text-xs">{spreadsheetId}</code>
              </div>
              <div>
                <span className="font-semibold">Sheet Name:</span> {sheetName}
              </div>
              <div>
                <span className="font-semibold">Rows to upload:</span> {rowCount}
              </div>
            </div>
            <p className="text-warning text-sm">
              ⚠️ 此操作將覆寫現有資料，無法復原。
            </p>
          </div>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onCancel}>
              取消
            </button>
            <button className="btn btn-warning" onClick={onConfirm}>
              確認更新
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={onCancel}>close</button>
        </form>
      </dialog>
    );
  }
);
