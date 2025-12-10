"use client";

import { ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from "lucide-react";

interface SortButtonProps {
  sortOrder?: "asc" | "desc";
  onSortChange?: (order: "asc" | "desc") => void;
}

export const SortButton = ({ sortOrder, onSortChange }: SortButtonProps) => {
  const handleSortClick = () => {
    if (!onSortChange) return;
    onSortChange(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline gap-2 hover:bg-base-200"
      onClick={handleSortClick}
      title={`Sort by # (${sortOrder === "asc" ? "Ascending" : "Descending"})`}
      aria-label={`Sort by # (${sortOrder === "asc" ? "Ascending" : "Descending"})`}
    >
      {sortOrder === "asc" ? (
        <>
          <ArrowUpIcon className="w-4 h-4" />
          <span>Sort by # ↑</span>
        </>
      ) : (
        <>
          <ArrowDownIcon className="w-4 h-4" />
          <span>Sort by # ↓</span>
        </>
      )}
    </button>
  );
};

