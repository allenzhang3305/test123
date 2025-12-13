"use client";

import { X as XIcon, Upload as UploadIcon } from "lucide-react";
import { CsvDropZone } from "@/components/upload/CsvDropZone";
import { HtmlDropZone } from "@/components/upload/HtmlDropZone";

interface ImportDataModalProps {
  isOpen: boolean;
  importText: string;
  onClose: () => void;
  onImport: () => void;
  onImportTextChange: (text: string) => void;
}

export function ImportDataModal({
  isOpen,
  importText,
  onClose,
  onImport,
  onImportTextChange,
}: ImportDataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box w-11/12 max-w-3xl">
        <button
          className="btn btn-sm btn-circle absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close modal"
        >
          <XIcon className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-4">Import Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CsvDropZone />
          <HtmlDropZone />
        </div>

        <div className="divider">或直接貼上</div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">貼上 HTML/JS 資料</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-48 font-mono text-sm"
            placeholder="貼上包含 allRecomComboData 的 HTML 或 JS 內容..."
            value={importText}
            onChange={(e) => onImportTextChange(e.target.value)}
          />
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            關閉
          </button>
          <button
            className="btn btn-primary gap-2"
            onClick={onImport}
            disabled={!importText.trim()}
          >
            <UploadIcon className="w-4 h-4" />
            Import & Replace
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
  );
}
