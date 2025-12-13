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
    <div className="tooltip" data-tip={`依編號排序 (${sortOrder === "asc" ? "小到大" : "大到小"})`}>
      <button
        type="button"
        className="btn btn-sm btn-outline gap-2 hover:bg-base-200"
        onClick={handleSortClick}
        aria-label={`依編號排序 (${sortOrder === "asc" ? "小到大" : "大到小"})`}
      >
        {sortOrder === "asc" ? (
          <>
            <ArrowUpIcon className="w-4 h-4" />
            <span>依 #編號 排序 ↑</span>
          </>
        ) : (
          <>
            <ArrowDownIcon className="w-4 h-4" />
            <span>依#編號 排序 ↓</span>
          </>
        )}
      </button>
    </div>
  );
};

