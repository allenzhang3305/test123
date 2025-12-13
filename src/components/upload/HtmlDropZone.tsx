import { FileCode as FileCodeIcon, Upload as UploadIcon } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

export const HtmlDropZone = () => {
  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  } = useFileUpload();

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
      aria-label="拖放 HTML 或 TXT 檔案到此處"
    >
      <label className="block cursor-pointer">
        <input
          type="file"
          accept=".html,.htm,.txt,text/html,text/plain"
          onChange={handleFilePick}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          {isDragging ? (
            <UploadIcon className="w-8 h-8 text-primary" />
          ) : (
            <FileCodeIcon className="w-8 h-8 text-base-content/60" />
          )}
          <div className="text-base">
            <strong>拖放</strong>您的 HTML/TXT 檔案到此處，或<u>點擊選擇</u>。
          </div>
          <div className="text-xs text-base-content/60 mt-2">
            格式：包含 name、sku、img、dots 的 allRecomComboData 陣列
          </div>
        </div>
      </label>
    </div>
  );
};

