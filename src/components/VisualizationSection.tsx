"use client";

import { useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { SortButton } from "@/components/SortButton";
import { ProductRowCard } from "@/components/ProductRowCard";
import type { Row } from "@/types";

interface RowWithIndex {
  row: Row;
  originalIndex: number;
}

interface VisualizationSectionProps {
  rows: Row[];
  rowsWithIndex?: RowWithIndex[]; // Optional: if provided, use this instead of rows for sorting
  dotProductImages: Record<string, string | null>;
  dotProductNames: Record<string, string>;
  failedDotSkus: Set<string>;
  loadingImages: boolean;
  onUpdateRow: (index: number, updatedRow: Row) => void;
  onDeleteRow: (index: number) => void;
  sortOrder?: "asc" | "desc";
  onSortChange?: (order: "asc" | "desc") => void;
}

export const VisualizationSection = ({
  rows,
  rowsWithIndex,
  dotProductImages,
  dotProductNames,
  failedDotSkus,
  loadingImages,
  onUpdateRow,
  onDeleteRow,
  sortOrder = "asc",
  onSortChange,
}: VisualizationSectionProps) => {
  // Use rowsWithIndex if provided, otherwise create from rows
  const displayRows = rowsWithIndex ?? rows.map((row, index) => ({ row, originalIndex: index }));


  return (
    <div className="mt-8">
      <div className="flex items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold">視覺化區</h2>
        <SortButton sortOrder={sortOrder} onSortChange={onSortChange} />
      </div>
      {loadingImages && (
        <div className="fixed bottom-4 left-4 alert alert-info shadow-lg z-50">
          <span className="loading loading-spinner loading-sm" />
          <span>正在載入商品圖片...</span>
        </div>
      )}
      {displayRows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {displayRows.map(({ row, originalIndex }, displayIndex) => {
            return (
              <ProductRowCard
                key={originalIndex}
                row={row}
                rowIndex={displayIndex}
                originalIndex={originalIndex}
                dotProductImages={dotProductImages}
                dotProductNames={dotProductNames}
                failedDotSkus={failedDotSkus}
                onUpdateRow={onUpdateRow}
                onDeleteRow={onDeleteRow}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

