"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { DotSku } from "@/types";

interface ProductImageWithDotsProps {
  imageUrl: string | null;
  alt: string;
  dotProducts: DotSku[];
  hoveredDotSku?: string | null;
  onDotHover?: (sku: string | null) => void;
  fullWidth?: boolean;
  placementModeSku?: string | null;
  onImageClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDotClick?: (sku: string) => void;
  onDotPositionUpdate?: (sku: string, top: string, left: string) => void;
  onUpdateImageUrl?: () => void;
}

/**
 * Parse position value to percentage
 * Handles values like "50", "50%", "50.5", "50.5%"
 */
const parsePosition = (value: string | undefined): number => {
  if (!value) return 0;
  const num = parseFloat(value.replace("%", ""));
  return isNaN(num) ? 0 : num;
};

const ProductImageWithDotsComponent = ({
  imageUrl,
  alt,
  dotProducts,
  hoveredDotSku,
  onDotHover,
  fullWidth = false,
  placementModeSku,
  onImageClick,
  onDotClick,
  onDotPositionUpdate,
  onUpdateImageUrl,
}: ProductImageWithDotsProps) => {
  const isPlacementMode = useMemo(() => !!placementModeSku, [placementModeSku]);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [draggedDotSku, setDraggedDotSku] = useState<string | null>(null);
  const [localDotPositions, setLocalDotPositions] = useState<Record<string, { top: number; left: number }>>({});
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Memoize dot hover handlers
  const handleDotHover = useCallback((sku: string) => {
    onDotHover?.(sku);
  }, [onDotHover]);

  const handleDotHoverLeave = useCallback(() => {
    onDotHover?.(null);
  }, [onDotHover]);

  const handleDotClick = useCallback((sku: string, event: React.MouseEvent, hasPosition: boolean) => {
    event.stopPropagation(); // Prevent triggering image click
    
    // Only allow click-to-place for dots without positions
    // Dots with positions should only be draggable, not clickable
    if (!hasPosition) {
      onDotClick?.(sku);
    }
  }, [onDotClick]);

  // Handle dot drag start
  const handleDotMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, sku: string, hasPosition: boolean) => {
    if (isPlacementMode || !hasPosition) return; // Don't allow dragging during placement mode or for dots without positions
    e.preventDefault();
    e.stopPropagation();
    setDraggedDotSku(sku);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  }, [isPlacementMode]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedDotSku || !imageContainerRef.current || !onDotPositionUpdate) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage position
    const topPercent = Math.max(0, Math.min(100, ((y / rect.height) * 100)));
    const leftPercent = Math.max(0, Math.min(100, ((x / rect.width) * 100)));

    // Update local position for smooth dragging (doesn't trigger parent rerender)
    setLocalDotPositions((prev) => ({
      ...prev,
      [draggedDotSku]: { top: topPercent, left: leftPercent },
    }));
  }, [draggedDotSku, onDotPositionUpdate]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggedDotSku || !imageContainerRef.current || !onDotPositionUpdate) return;

    // Check if mouse actually moved (was it a drag or just a click?)
    const startPos = dragStartPosRef.current;
    const dragDistance = startPos 
      ? Math.sqrt(Math.pow(e.clientX - startPos.x, 2) + Math.pow(e.clientY - startPos.y, 2))
      : 0;

    // Only update if mouse moved more than 3 pixels (actual drag, not just click)
    if (dragDistance > 3) {
      // Get final position from local state
      let finalPos = localDotPositions[draggedDotSku];
      
      // If no position in local state (mousemove didn't fire), calculate from current mouse position
      if (!finalPos) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const topPercent = Math.max(0, Math.min(100, ((y / rect.height) * 100)));
        const leftPercent = Math.max(0, Math.min(100, ((x / rect.width) * 100)));
        finalPos = { top: topPercent, left: leftPercent };
      }
      
      // Update parent with final position
      onDotPositionUpdate(
        draggedDotSku,
        `${finalPos.top.toFixed(2)}%`,
        `${finalPos.left.toFixed(2)}%`
      );
    }

    // Clean up
    const currentSku = draggedDotSku;
    setDraggedDotSku(null);
    setLocalDotPositions((prev) => {
      const newPos = { ...prev };
      delete newPos[currentSku];
      return newPos;
    });
    dragStartPosRef.current = null;
  }, [draggedDotSku, localDotPositions, onDotPositionUpdate]);

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (draggedDotSku) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedDotSku, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-80'}`}>
      {imageUrl ? (
        <div 
          ref={imageContainerRef}
          className={`relative w-full ${isPlacementMode ? 'cursor-crosshair' : ''}`}
          onClick={isPlacementMode ? onImageClick : undefined}
        >
          <Image
            src={imageUrl}
            alt={alt}
            width={320}
            height={320}
            className="object-contain rounded w-full h-auto"
            style={{ height: 'auto' }}
            unoptimized
          />
          {isPlacementMode && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-primary text-primary-content px-4 py-2 rounded shadow-lg pointer-events-auto">
                Click on image to set position
              </div>
            </div>
          )}
          {/* Overlay dots for dot products with position data */}
          {dotProducts.length > 0 && (
            <div className="absolute inset-0 z-20">
              {dotProducts.map((dot, index) => {
                const hasPosition = !!(dot.top || dot.left);
                
                // Only render dot if at least one position is provided (check for string existence, not value)
                if (!hasPosition) return null;
                
                // Use local position if dragging, otherwise use original position
                const localPos = localDotPositions[dot.sku];
                const top = localPos ? localPos.top : parsePosition(dot.top);
                const left = localPos ? localPos.left : parsePosition(dot.left);
                
                const isHovered = hoveredDotSku === dot.sku;
                const isInPlacementMode = placementModeSku === dot.sku;
                const isDragging = draggedDotSku === dot.sku;
                
                return (
                  <div
                    key={`${dot.sku}-${index}`}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center ${
                      isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                    }}
                    title={
                      hasPosition
                        ? `${dot.sku} (Top: ${top.toFixed(2)}%, Left: ${left.toFixed(
                            2,
                          )}%) - Drag to move`
                        : `${dot.sku} - Click to set position`
                    }
                    onMouseEnter={() => !isDragging && handleDotHover(dot.sku)}
                    onMouseLeave={() => !isDragging && handleDotHoverLeave()}
                    onMouseDown={(e) => handleDotMouseDown(e, dot.sku, hasPosition)}
                    onClick={(e) => handleDotClick(dot.sku, e, hasPosition)}
                  >
                    {/* Visual dot - smaller size, centered in larger touchable area */}
                    <div
                      className={`w-4 h-4 rounded-full bg-white border-2 shadow-lg transition-all duration-300 ${
                        isDragging
                          ? "scale-125 border-primary shadow-2xl shadow-primary/50 z-30"
                          : isHovered
                          ? "scale-150 border-primary shadow-2xl shadow-primary/50"
                          : isInPlacementMode
                          ? "scale-125 border-accent shadow-2xl shadow-accent/50 animate-pulse"
                          : "border-base-content/20"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-square bg-base-200 rounded flex flex-col items-center justify-center gap-2 p-4">
          <div className="text-xs text-base-content/60">
            No img
          </div>
          {onUpdateImageUrl && (
            <button
              onClick={onUpdateImageUrl}
              className="btn btn-xs btn-outline btn-primary"
              title="Update image URL"
            >
              Update img URL
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary rerenders
export const ProductImageWithDots = memo(ProductImageWithDotsComponent);

