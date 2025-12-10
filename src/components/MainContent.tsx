"use client";

import type { ReactNode } from "react";
import { useSidebar } from "@/lib/client/context/sidebar-context";

interface MainContentProps {
  children: ReactNode;
}

export const MainContent = ({ children }: MainContentProps) => {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isCollapsed ? "ml-0" : "ml-64"
      }`}
    >
      {children}
    </div>
  );
};

