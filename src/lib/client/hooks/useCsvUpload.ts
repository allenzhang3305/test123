import { useState } from "react";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Row } from "@/types";

export const useCsvUpload = () => {
  const { setRows, setCsvLoading, setCsvError } = useRowsStore();
  const [isDragging, setIsDragging] = useState(false);

  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    prevent(e);
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    prevent(e);
    // Check if we're actually leaving the drop zone (not just moving to a child element)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const upload = async (file: File) => {
    setCsvLoading(true);
    setCsvError(null);
    setRows([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows((data.rows || []) as Row[]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Upload failed";
      setCsvError(errorMessage);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    prevent(e);
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
  };

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  };
};

