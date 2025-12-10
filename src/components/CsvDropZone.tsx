import { FileSpreadsheet as FileSpreadsheetIcon, Upload as UploadIcon } from "lucide-react";
import { useCsvUpload } from "@/hooks/useCsvUpload";

export const CsvDropZone = () => {
  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  } = useCsvUpload();

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={prevent}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/10 scale-105 shadow-lg"
          : "border-base-300 bg-base-100 hover:bg-base-300/40"
      }`}
      aria-label="Drop CSV here"
    >
      <label className="block cursor-pointer">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFilePick}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {isDragging ? (
            <UploadIcon className="w-8 h-8 text-primary" />
          ) : (
            <FileSpreadsheetIcon className="w-8 h-8 text-base-content/60" />
          )}
          <div className="text-base">
            <strong>Drag & drop</strong> your CSV here, or <u>click to choose</u>.
          </div>
          <div className="text-xs text-base-content/60 mt-2">
            格式：商品名, 商品SKU, 前台連結, 白點商品1 SKU, 白點商品2 SKU, 白點商品3 SKU, 白點商品4 SKU
          </div>
        </div>
      </label>
    </div>
  );
};

