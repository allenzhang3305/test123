import { useState, useCallback } from "react";
import { useRowsStore } from "@/stores/useRowsStore";
import type { Row } from "@/types";

export const useCsvUpload = () => {
  const { setRows, setCsvLoading, setCsvError } = useRowsStore();
  const [isDragging, setIsDragging] = useState(false);

  const prevent = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    prevent(e);
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, [prevent]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    prevent(e);
    // Check if we're actually leaving the drop zone (not just moving to a child element)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, [prevent]);

  const upload = useCallback(async (file: File) => {
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
  }, [setCsvLoading, setCsvError, setRows]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    prevent(e);
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }, [prevent, upload]);

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
  }, [upload]);

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFilePick,
    prevent,
  };
};

