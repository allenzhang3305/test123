"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Row, Dot, ComboItem } from "@/types";

interface Result {
  url: string;
  image: string | null;
  title?: string;
  dots: Dot[];
}

interface RowsContextValue {
  rows: Row[];
  setRows: (rows: Row[]) => void;
  clearRows: () => void;
  codeItems: ComboItem[];
  setCodeItems: (items: ComboItem[]) => void;
  clearCodeItems: () => void;
  results: Result[];
  setResults: (results: Result[]) => void;
  clearResults: () => void;
}

interface RowsProviderProps {
  children: React.ReactNode;
}

const RowsContext = createContext<RowsContextValue | undefined>(undefined);

export const RowsProvider = ({ children }: RowsProviderProps) => {
  const [rows, setRowsState] = useState<Row[]>([]);
  const [results, setResultsState] = useState<Result[]>([]);
  const [codeItems, setCodeItemsState] = useState<ComboItem[]>([]);

  const value = useMemo<RowsContextValue>(
    () => ({
      rows,
      setRows: setRowsState,
      clearRows: () => setRowsState([]),
      codeItems,
      setCodeItems: setCodeItemsState,
      clearCodeItems: () => setCodeItemsState([]),
      results,
      setResults: setResultsState,
      clearResults: () => setResultsState([]),
    }),
    [rows, results, codeItems]
  );

  return <RowsContext.Provider value={value}>{children}</RowsContext.Provider>;
};

export const useRows = (): RowsContextValue => {
  const ctx = useContext(RowsContext);
  if (!ctx) {
    throw new Error("useRows must be used within RowsProvider");
  }
  return ctx;
};
