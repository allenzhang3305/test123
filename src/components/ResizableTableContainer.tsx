"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ResizableTableContainerProps {
  children: ReactNode;
  title?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
}

export const ResizableTableContainer = ({
  children,
  title,
  defaultHeight = 250,
  minHeight = 100,
  maxHeight = 800,
}: ResizableTableContainerProps) => {
  const [tableHeight, setTableHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>("combo-table-collapsed", false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const resizeRafRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleToggleCollapse = (): void => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !tableContainerRef.current) return;

      // Use requestAnimationFrame to throttle updates
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        if (!tableContainerRef.current) return;

        const rect = tableContainerRef.current.getBoundingClientRect();
        // Calculate new height based on mouse position relative to the top of the container
        // We use the stored rect top to avoid recalculating it constantly if possible, 
        // but getting it fresh ensures accuracy if the page scrolls.
        // Actually, for a resize handle at the bottom, the height is simply e.clientY - rect.top
        // However, we need to be careful about rect.top shifting if the document scrolls, 
        // but usually clientY and getBoundingClientRect are in the same viewport coordinate system.

        const currentTop = tableContainerRef.current.getBoundingClientRect().top;
        const newHeight = e.clientY - currentTop;

        // Set min and max height constraints
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          // Direct DOM manipulation for performance
          tableContainerRef.current.style.height = `${newHeight}px`;
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      // Sync state with final DOM height
      if (tableContainerRef.current) {
        const finalHeight = tableContainerRef.current.getBoundingClientRect().height;
        setTableHeight(finalHeight);
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Disable selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ns-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, [isResizing, minHeight, maxHeight]);

  return (
    <div className="mt-6">
      {title && (
        <div className="flex items-center mb-2 gap-2">
          <h2 className="text-sm font-semibold text-base-content/70">{title}</h2>
          <div className="tooltip" data-tip={isCollapsed ? "Expand table" : "Collapse table"}>
            <button
              onClick={handleToggleCollapse}
              className="btn btn-xs btn-ghost gap-1"
              aria-label={isCollapsed ? "Expand table" : "Collapse table"}
            >
              {isCollapsed ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronUpIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
      {!isCollapsed && (
        <div
          ref={tableContainerRef}
          className={`relative border border-base-300 rounded-lg overflow-hidden ${isResizing ? "" : "transition-all duration-300"
            }`}
          style={{ height: `${tableHeight}px` }}
        >
          <div className="overflow-x-auto overflow-y-auto h-full" style={{ scrollbarGutter: "stable" }}>
            {children}
          </div>
          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-base-300 hover:bg-base-content/20 transition-colors ${isResizing ? "bg-base-content/30" : ""
              }`}
            title="Drag to resize table height"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-0.5 bg-base-content/40 rounded"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

