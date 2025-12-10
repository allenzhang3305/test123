import { FileCode as FileCodeIcon, Upload as UploadIcon } from "lucide-react";
import { useHtmlUpload } from "@/hooks/useHtmlUpload";

export const HtmlDropZone = () => {
  const {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  } = useHtmlUpload();

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
      aria-label="Drop HTML or TXT file here"
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
            <strong>Drag & drop</strong> your HTML/TXT file here, or <u>click to choose</u>.
          </div>
          <div className="text-xs text-base-content/60 mt-2">
            Format: allRecomComboData array with name, sku, img, dots
          </div>
        </div>
      </label>
    </div>
  );
};

