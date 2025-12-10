"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { CrossSellItem } from "@/types";

interface CrosssellContextValue {
  crossSellItems: CrossSellItem[];
  setCrossSellItems: (items: CrossSellItem[]) => void;
  requestedSkus: string[];
  setRequestedSkus: (skus: string[]) => void;
  uploadedFileName: string | null;
  setUploadedFileName: (fileName: string | null) => void;
  clearCrosssell: () => void;
}

interface CrosssellProviderProps {
  children: React.ReactNode;
}

const CrosssellContext = createContext<CrosssellContextValue | undefined>(undefined);

export const CrosssellProvider = ({ children }: CrosssellProviderProps) => {
  const [crossSellItems, setCrossSellItemsState] = useState<CrossSellItem[]>([]);
  const [requestedSkus, setRequestedSkusState] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileNameState] = useState<string | null>(null);

  const clearCrosssell = useCallback(() => {
    setCrossSellItemsState([]);
    setRequestedSkusState([]);
    setUploadedFileNameState(null);
  }, []);

  const value = useMemo<CrosssellContextValue>(
    () => ({
      crossSellItems,
      setCrossSellItems: setCrossSellItemsState,
      requestedSkus,
      setRequestedSkus: setRequestedSkusState,
      uploadedFileName,
      setUploadedFileName: setUploadedFileNameState,
      clearCrosssell,
    }),
    [crossSellItems, requestedSkus, uploadedFileName, clearCrosssell]
  );

  return <CrosssellContext.Provider value={value}>{children}</CrosssellContext.Provider>;
};

export const useCrosssell = (): CrosssellContextValue => {
  const context = useContext(CrosssellContext);
  if (!context) {
    throw new Error("useCrosssell must be used within CrosssellProvider");
  }
  return context;
};


