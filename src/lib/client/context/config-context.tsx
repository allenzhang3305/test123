"use client";

import { createContext, useContext, useMemo, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface VisualizationConfig {
  showDotSku: boolean;
  showDotName: boolean;
  showDotPosition: boolean;
}

interface GlobalConfig {
  visualization: VisualizationConfig;
  setVisualizationConfig: (config: Partial<VisualizationConfig>) => void;
}

interface ConfigProviderProps {
  children: React.ReactNode;
}

const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

const STORAGE_KEY = "combo-tools-config";
const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  showDotSku: false,
  showDotName: false,
  showDotPosition: false,
};

export const ConfigProvider = ({ children }: ConfigProviderProps) => {
  const [storedConfig, setStoredConfig] = useLocalStorage<{ visualization: VisualizationConfig }>(
    STORAGE_KEY,
    { visualization: DEFAULT_VISUALIZATION_CONFIG }
  );

  const visualizationConfig = storedConfig.visualization || DEFAULT_VISUALIZATION_CONFIG;

  const setVisualizationConfig = useCallback(
    (config: Partial<VisualizationConfig>) => {
      setStoredConfig((prev) => ({
        ...prev,
        visualization: {
          ...prev.visualization,
          ...config,
        },
      }));
    },
    [setStoredConfig]
  );

  const value = useMemo<GlobalConfig>(
    () => ({
      visualization: visualizationConfig,
      setVisualizationConfig,
    }),
    [visualizationConfig, setVisualizationConfig]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): GlobalConfig => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return ctx;
};

