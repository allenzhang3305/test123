"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Menu as MenuIcon, X as XIcon } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import { useSidebar } from "@/lib/client/context/sidebar-context";

export const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-base-100 border-r flex flex-col transition-all duration-300 z-40 ${
        isCollapsed ? "w-0 overflow-hidden" : "w-64"
      }`}
      aria-label="Primary sidebar"
      aria-hidden={isCollapsed}
    >
      <div
        className={`p-4 border-b flex items-center justify-between transition-opacity duration-300 ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <Link href="/" className="text-xl font-semibold">
          組合工具
        </Link>
        <div className="tooltip tooltip-bottom" data-tip="收合側邊欄">
          <button
            type="button"
            onClick={toggleSidebar}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="收合側邊欄"
            aria-expanded={!isCollapsed}
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {!isCollapsed && <SidebarNav />}
      <div
        className={`p-4 border-t transition-opacity duration-300 ${
          isCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-sm text-base-content/70">© {currentYear} 組合工具</p>
      </div>

      {isCollapsed && (
        <div className="tooltip tooltip-right fixed top-4 left-4 z-50" data-tip="展開側邊欄">
          <button
            type="button"
            onClick={toggleSidebar}
            className="btn btn-sm btn-circle btn-ghost shadow-lg"
            aria-label="展開側邊欄"
            aria-expanded={!isCollapsed}
          >
            <MenuIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
};

