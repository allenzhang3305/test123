"use client";

import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { Plus as PlusIcon, X as XIcon, Edit3 as Edit3Icon, Trash2 as TrashIcon, Sparkles as SparklesIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { ProductImageWithDots } from "@/components/ProductImageWithDots";
import { useConfig } from "@/lib/client/context/config-context";
import { suggestPositionsForProduct } from "@/lib/client/ai-utils";
import type { DotSku, Row } from "@/types";

interface MainProductEditForm {
  prodName: string;
  productSku: string;
  url: string;
  img: string;
}

interface DotProductEditForm {
  index: number;
  sku: string;
  top: string;
  left: string;
}

interface ProductRowCardProps {
  row: Row;
  rowIndex: number; // Display index (for hover/placement state)
  originalIndex: number; // Original index in data (for displaying row number)
  dotProductImages: Record<string, string | null>;
  dotProductNames: Record<string, string>;
  failedDotSkus: Set<string>;
  onUpdateRow: (rowIndex: number, updatedRow: Row) => void;
  onDeleteRow: (rowIndex: number) => void;
}

const ProductRowCardComponent = ({
  row,
  rowIndex,
  originalIndex,
  dotProductImages,
  dotProductNames,
  failedDotSkus,
  onUpdateRow,
  onDeleteRow,
}: ProductRowCardProps) => {
  const { visualization } = useConfig();
  const [skuInput, setSkuInput] = useState("");
  const [hoveredDotSku, setHoveredDotSku] = useState<string | null>(null);
  const [placementModeSku, setPlacementModeSku] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const mainEditModalRef = useRef<HTMLDialogElement>(null);
  const dotEditModalRef = useRef<HTMLDialogElement>(null);
  const [mainEditFields, setMainEditFields] = useState<MainProductEditForm>({
    prodName: row.prod_name,
    productSku: row.product_sku,
    url: row.url ?? "",
    img: row.img ?? "",
  });
  const [dotEditFields, setDotEditFields] = useState<DotProductEditForm | null>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Check if all display options are off
  const allDisplayOptionsOff = useMemo(
    () => !visualization.showDotSku && !visualization.showDotName && !visualization.showDotPosition,
    [visualization.showDotSku, visualization.showDotName, visualization.showDotPosition]
  );

  const visibleDotSkus = useMemo(
    () => row.dot_skus.filter((dot) => !!dot.sku?.trim()),
    [row.dot_skus]
  );

  // Handle image click to set position - memoized
  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!placementModeSku || !row.img) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const topPercent = ((y / rect.height) * 100).toFixed(2);
    const leftPercent = ((x / rect.width) * 100).toFixed(2);

    // Update the row with the new position
    const updatedDotSkus = row.dot_skus.map((dot) => {
      if (dot.sku === placementModeSku) {
        return {
          ...dot,
          top: `${topPercent}%`,
          left: `${leftPercent}%`,
        };
      }
      return dot;
    });

    const updatedRow: Row = {
      ...row,
      dot_skus: updatedDotSkus,
    };

    onUpdateRow(originalIndex, updatedRow);
    setPlacementModeSku(null); // Exit placement mode
  }, [placementModeSku, row, originalIndex, onUpdateRow]);

  // Memoize dot hover handlers
  const handleDotHover = useCallback((sku: string) => {
    setHoveredDotSku(sku);
  }, []);

  const handleDotHoverLeave = useCallback(() => {
    setHoveredDotSku(null);
  }, []);

  const handleDotClick = useCallback((sku: string) => {
    // Only allow clicking dot products without positions to enter placement mode
    const dot = row.dot_skus.find((d) => d.sku === sku);
    if (dot && !dot.top && !dot.left) {
      setPlacementModeSku(sku);
    }
  }, [row.dot_skus]);

  // Handle dot position update from dragging
  const handleDotPositionUpdate = useCallback((sku: string, top: string, left: string) => {
    const updatedDotSkus = row.dot_skus.map((dot) => {
      if (dot.sku === sku) {
        return {
          ...dot,
          top,
          left,
        };
      }
      return dot;
    });

    const updatedRow: Row = {
      ...row,
      dot_skus: updatedDotSkus,
    };

    onUpdateRow(originalIndex, updatedRow);
  }, [row, originalIndex, onUpdateRow]);

  // Handle opening modal to add SKU
  const handleOpenAddSkuModal = useCallback(() => {
    setSkuInput("");
    modalRef.current?.showModal();
  }, []);

  // Handle adding SKU to dot_skus
  const handleAddSku = useCallback(() => {
    const trimmedSku = skuInput.trim();
    if (!trimmedSku) {
      return;
    }

    // Check if SKU already exists
    const skuExists = row.dot_skus.some((dot) => dot.sku === trimmedSku);
    if (skuExists) {
      return;
    }

    // Add new SKU to dot_skus
    const updatedDotSkus = [
      ...row.dot_skus,
      {
        sku: trimmedSku,
        top: "",
        left: "",
      },
    ];

    const updatedRow: Row = {
      ...row,
      dot_skus: updatedDotSkus,
    };

    onUpdateRow(originalIndex, updatedRow);
    setSkuInput("");
    modalRef.current?.close();
  }, [skuInput, row, originalIndex, onUpdateRow]);

  // Handle closing modal
  const handleCloseModal = useCallback(() => {
    setSkuInput("");
    modalRef.current?.close();
  }, []);

  // Handle removing a dot SKU
  const handleRemoveDotSku = useCallback((skuToRemove: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering dot click handler
    
    const updatedDotSkus = row.dot_skus.filter((dot) => dot.sku !== skuToRemove);
    
    const updatedRow: Row = {
      ...row,
      dot_skus: updatedDotSkus,
    };

    onUpdateRow(originalIndex, updatedRow);
  }, [row, originalIndex, onUpdateRow]);

  const handleUpdateImageUrl = useCallback(() => {
    const newImageUrl = prompt("Enter new image URL:", row.img || "");
    if (newImageUrl !== null && newImageUrl.trim() !== "") {
      onUpdateRow(originalIndex, {
        ...row,
        img: newImageUrl.trim(),
      });
    }
  }, [row, originalIndex, onUpdateRow]);

  // Sync main edit fields when row data changes and modal is closed
  useEffect(() => {
    const mainModalOpen = mainEditModalRef.current?.open ?? false;
    if (mainModalOpen) {
      return;
    }

    setMainEditFields({
      prodName: row.prod_name,
      productSku: row.product_sku,
      url: row.url ?? "",
      img: row.img ?? "",
    });
  }, [row.product_sku, row.prod_name, row.url, row.img]);

  const handleOpenMainEditModal = useCallback(() => {
    setMainEditFields({
      prodName: row.prod_name,
      productSku: row.product_sku,
      url: row.url ?? "",
      img: row.img ?? "",
    });
    mainEditModalRef.current?.showModal();
  }, [row]);

  const handleMainEditCancel = useCallback(() => {
    setMainEditFields({
      prodName: row.prod_name,
      productSku: row.product_sku,
      url: row.url ?? "",
      img: row.img ?? "",
    });
    mainEditModalRef.current?.close();
  }, [row]);

  const handleSubmitMainEdit = useCallback(() => {
    const trimmedName = mainEditFields.prodName.trim();
    const trimmedSku = mainEditFields.productSku.trim();
    const trimmedUrl = mainEditFields.url.trim();
    const trimmedImg = mainEditFields.img.trim();
    if (!trimmedSku || !trimmedName) {
      return;
    }

    const updatedRow: Row = {
      ...row,
      prod_name: trimmedName,
      product_sku: trimmedSku,
      url: trimmedUrl,
      img: trimmedImg,
    };

    onUpdateRow(originalIndex, updatedRow);
    mainEditModalRef.current?.close();
  }, [mainEditFields, row, originalIndex, onUpdateRow]);

  const handleOpenDotEditModal = useCallback(
    (dot: DotSku, dotIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setDotEditFields({
        index: dotIndex,
        sku: dot.sku ?? "",
        top: dot.top ?? "",
        left: dot.left ?? "",
      });
      dotEditModalRef.current?.showModal();
    },
    []
  );

  const handleDotEditCancel = useCallback(() => {
    setDotEditFields(null);
    dotEditModalRef.current?.close();
  }, []);

  const handleSubmitDotEdit = useCallback(() => {
    if (!dotEditFields) {
      return;
    }

    const trimmedSku = dotEditFields.sku.trim();
    if (!trimmedSku) {
      return;
    }

    const updatedDotSkus = row.dot_skus.map((dot, index) => {
      if (index !== dotEditFields.index) {
        return dot;
      }

      return {
        ...dot,
        sku: trimmedSku,
        top: dotEditFields.top.trim(),
        left: dotEditFields.left.trim(),
      };
    });

    const updatedRow: Row = {
      ...row,
      dot_skus: updatedDotSkus,
    };

    onUpdateRow(originalIndex, updatedRow);
    setDotEditFields(null);
    dotEditModalRef.current?.close();
  }, [dotEditFields, row, originalIndex, onUpdateRow]);

  const handleOpenDeleteModal = useCallback(() => {
    deleteModalRef.current?.showModal();
  }, []);

  const handleCancelDelete = useCallback(() => {
    deleteModalRef.current?.close();
  }, []);

  const handleConfirmDelete = useCallback(() => {
    onDeleteRow(originalIndex);
    deleteModalRef.current?.close();
  }, [onDeleteRow, originalIndex]);

  const handleSuggestPosition = useCallback(async () => {
    if (!row.img) {
      toast.error("Main product image is missing");
      return;
    }

    const dotSkusToProcess = row.dot_skus.filter(dot => dotProductImages[dot.sku]);
    if (dotSkusToProcess.length === 0) {
      toast.error("No dot product images found");
      return;
    }

    setIsSuggesting(true);
    const toastId = toast.loading("Analyzing positions...");

    try {
      const result = await suggestPositionsForProduct(row, dotProductImages);

      if (result.retryDelay) {
        const failMsg = result.failCount ? ` (${result.failCount} items failed)` : "";
        toast.error(`Rate limit hit${failMsg}. Retry in ${result.retryDelay}`, { id: toastId, duration: 5000 });
        setIsSuggesting(false);
        return;
      }

      if (!result.success || !result.updatedDotSkus) {
        throw new Error(result.error || "Failed to analyze positions");
      }

      const updatedRow: Row = {
        ...row,
        dot_skus: result.updatedDotSkus,
      };

      onUpdateRow(originalIndex, updatedRow);
      toast.success("Positions updated!", { id: toastId });

    } catch (error) {
      console.error("Error suggesting positions:", error);
      toast.error(error instanceof Error ? error.message : "Failed to suggest positions", { id: toastId });
    } finally {
      setIsSuggesting(false);
    }
  }, [row, dotProductImages, originalIndex, onUpdateRow]);


  return (
    <div className="card bg-base-100 shadow-xl" id={`row-card-${originalIndex}`}>
      <div className="card-body">
        {/* Row Index Badge */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="badge badge-primary badge-sm">#{originalIndex + 1}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSuggestPosition}
              disabled={isSuggesting}
              className="btn btn-xs btn-ghost p-0.5 w-8 h-8 text-primary"
              title="Suggest positions with AI"
              aria-label="Suggest positions with AI"
            >
              {isSuggesting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleOpenMainEditModal}
              className="btn btn-xs btn-ghost p-0.5 w-8 h-8"
              title="Edit main product"
              aria-label="Edit main product"
            >
              <Edit3Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="btn btn-xs btn-ghost p-0.5 w-8 h-8 text-error"
              title="Delete main product"
              aria-label="Delete main product"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {allDisplayOptionsOff ? (
          // Layout when all display options are off: full-width image, small dot products below
          <div className="flex flex-col gap-4">
            {/* Main Product - Full Width */}
            <div className="flex flex-col items-center gap-2 w-full">
              <ProductImageWithDots
                imageUrl={row.img}
                alt={row.prod_name}
                dotProducts={row.dot_skus}
                hoveredDotSku={hoveredDotSku}
                onDotHover={setHoveredDotSku}
                fullWidth={true}
                placementModeSku={placementModeSku}
                onImageClick={handleImageClick}
                onDotClick={handleDotClick}
                onDotPositionUpdate={handleDotPositionUpdate}
                onUpdateImageUrl={handleUpdateImageUrl}
              />
              <div className="text-center w-full">
                <h3 className="font-semibold text-sm line-clamp-2">{row.prod_name}</h3>
                <p className="text-xs text-base-content/70 mt-1">SKU: {row.product_sku}</p>
                {row.url && (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-0.5 break-all block"
                  >
                    {row.url}
                  </a>
                )}
              </div>
            </div>

            {/* Dot Products - Small fixed size, horizontal layout */}
            <div className="flex flex-wrap gap-4 justify-center items-center">
              {visibleDotSkus.length > 0 && (
                <>
                  {visibleDotSkus.map((dot, j) => {
                  const isHovered = hoveredDotSku === dot.sku;
                  const hasNoPosition = !dot.top && !dot.left;
                  const isInPlacementMode = placementModeSku === dot.sku;
                  return (
                    <div
                      key={j}
                      className={`relative w-16 h-16 rounded transition-all duration-200 cursor-pointer ${
                        isHovered
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : isInPlacementMode
                          ? "ring-2 ring-accent ring-offset-2 animate-pulse"
                          : hasNoPosition
                          ? "ring-2 ring-orange-500 ring-offset-2"
                          : "hover:ring-2 hover:ring-base-content/20"
                      }`}
                      onMouseEnter={() => handleDotHover(dot.sku)}
                      onMouseLeave={handleDotHoverLeave}
                      onClick={() => handleDotClick(dot.sku)}
                      title={hasNoPosition ? "Click to set position on image" : "Click to modify position on image"}
                    >
                      {dotProductImages[dot.sku] ? (
                        <Image
                          src={dotProductImages[dot.sku]!}
                          alt={dot.sku}
                          fill
                          className="object-contain rounded"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-base-300 rounded flex items-center justify-center text-[8px] text-base-content/60">
                          No img
                        </div>
                      )}
                      <button
                        onClick={(e) => handleRemoveDotSku(dot.sku, e)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-100 border border-base-content/30 text-base-content/60 flex items-center justify-center hover:bg-base-200 hover:text-base-content hover:border-base-content/50 transition-all duration-200 hover:scale-110 z-10"
                        title="Remove SKU"
                        aria-label="Remove SKU"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleOpenDotEditModal(dot, j, event)}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-base-100 border border-base-content/30 text-base-content/60 flex items-center justify-center hover:bg-base-200 hover:text-base-content hover:border-base-content/50 transition-all duration-200 hover:scale-110 z-10"
                        title="Edit SKU"
                        aria-label="Edit SKU"
                      >
                        <Edit3Icon className="w-3 h-3" />
                      </button>
                    </div>
                  );
                  })}
                </>
              )}
              <button
                onClick={handleOpenAddSkuModal}
                className="btn btn-sm btn-circle btn-ghost w-16 h-16 border-2 border-dashed border-base-content/30 hover:border-primary"
                title="Add SKU"
                aria-label="Add SKU"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          // Default layout: side-by-side
          <div className="flex gap-4">
            {/* Main Product - Left Side */}
            <div className="shrink-0 w-1/2">
              <div className="flex flex-col items-center gap-2">
                <ProductImageWithDots
                  imageUrl={row.img}
                  alt={row.prod_name}
                  dotProducts={row.dot_skus}
                  hoveredDotSku={hoveredDotSku}
                  onDotHover={setHoveredDotSku}
                  placementModeSku={placementModeSku}
                  onImageClick={handleImageClick}
                  onDotClick={handleDotClick}
                  onDotPositionUpdate={handleDotPositionUpdate}
                  onUpdateImageUrl={handleUpdateImageUrl}
                />
                <div className="text-center w-full">
                  <h3 className="font-semibold text-sm line-clamp-2">{row.prod_name}</h3>
                  <p className="text-xs text-base-content/70 mt-1">SKU: {row.product_sku}</p>
                  {row.url && (
                    <p className="text-xs text-base-content/70 mt-0.5 break-all">{row.url}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dot Products - Right Side */}
            <div className="flex-1 w-1/2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-base-content/70">Dot Products:</h4>
                <button
                  onClick={handleOpenAddSkuModal}
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Add SKU"
                  aria-label="Add SKU"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              {visibleDotSkus.length > 0 ? (
                <div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {visibleDotSkus.map((dot, j) => {
                      const isHovered = hoveredDotSku === dot.sku;
                      const hasNoPosition = !dot.top && !dot.left;
                      const isInPlacementMode = placementModeSku === dot.sku;
                      return (
                        <div
                          key={j}
                          className={`relative flex items-center gap-2 p-2 rounded transition-colors duration-200 cursor-pointer ${
                            isHovered
                              ? "bg-primary/20 border-2 border-primary"
                              : isInPlacementMode
                              ? "bg-accent/20 border-2 border-accent animate-pulse"
                              : hasNoPosition
                              ? "bg-orange-500/10 border-2 border-orange-500"
                              : "bg-base-200 hover:bg-base-300"
                          }`}
                          onMouseEnter={() => handleDotHover(dot.sku)}
                          onMouseLeave={handleDotHoverLeave}
                          onClick={() => handleDotClick(dot.sku)}
                          title={hasNoPosition ? "Click to set position on image" : "Click to modify position on image"}
                        >
                          <div className="relative w-12 h-12 shrink-0">
                            {dotProductImages[dot.sku] ? (
                              <Image
                                src={dotProductImages[dot.sku]!}
                                alt={dot.sku}
                                fill
                                className="object-contain rounded"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-base-300 rounded flex items-center justify-center text-[10px] text-base-content/60">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {visualization.showDotSku && (
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-medium">{dot.sku}</p>
                                {failedDotSkus.has(dot.sku) && (
                                  <span className="text-[10px] text-error font-medium">
                                    (Not found)
                                  </span>
                                )}
                              </div>
                            )}
                            {visualization.showDotName && dotProductNames[dot.sku] && (
                              <p className="text-[10px] text-base-content/60 mt-0.5 line-clamp-1">
                                {dotProductNames[dot.sku]}
                              </p>
                            )}
                            {visualization.showDotPosition && (dot.top || dot.left) && (
                              <p className="text-[10px] text-base-content/60 mt-0.5">
                                {dot.top && `Top: ${dot.top}`} {dot.top && dot.left && " • "} {dot.left && `Left: ${dot.left}`}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleRemoveDotSku(dot.sku, e)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-base-100 border border-base-content/30 text-base-content/60 flex items-center justify-center hover:bg-base-200 hover:text-base-content hover:border-base-content/50 transition-all duration-200 hover:scale-110"
                            title="Remove SKU"
                            aria-label="Remove SKU"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleOpenDotEditModal(dot, j, event)}
                            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-base-100 border border-base-content/30 text-base-content/60 flex items-center justify-center hover:bg-base-200 hover:text-base-content hover:border-base-content/50 transition-all duration-200 hover:scale-110"
                            title="Edit SKU"
                            aria-label="Edit SKU"
                          >
                            <Edit3Icon className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-base-content/60">
                  No dot products
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for adding SKU */}
        <dialog ref={modalRef} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Dot Product SKU</h3>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">SKU</span>
              </label>
              <input
                type="text"
                placeholder="Enter SKU"
                className="input input-bordered w-full"
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddSku();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
              </form>
              <button className="btn btn-primary" onClick={handleAddSku}>
                Add
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseModal}>close</button>
          </form>
        </dialog>
        <dialog ref={mainEditModalRef} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Main Product</h3>
            <div className="space-y-3">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Product name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={mainEditFields.prodName}
                  onChange={(event) =>
                    setMainEditFields((prev) => ({ ...prev, prodName: event.target.value }))
                  }
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">SKU</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={mainEditFields.productSku}
                  onChange={(event) =>
                    setMainEditFields((prev) => ({ ...prev, productSku: event.target.value }))
                  }
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">URL (optional)</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  value={mainEditFields.url}
                  onChange={(event) =>
                    setMainEditFields((prev) => ({ ...prev, url: event.target.value }))
                  }
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Image URL (optional)</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  value={mainEditFields.img}
                  onChange={(event) =>
                    setMainEditFields((prev) => ({ ...prev, img: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost" onClick={handleMainEditCancel}>
                  Cancel
                </button>
              </form>
              <button
                className="btn btn-primary"
                onClick={handleSubmitMainEdit}
                disabled={!mainEditFields.prodName.trim() || !mainEditFields.productSku.trim()}
              >
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleMainEditCancel}>close</button>
          </form>
        </dialog>
        <dialog ref={dotEditModalRef} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Dot Product</h3>
            <div className="space-y-3">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">SKU</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={dotEditFields?.sku ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDotEditFields((prev) => (prev ? { ...prev, sku: value } : prev));
                  }}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Top (e.g., 25%)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={dotEditFields?.top ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDotEditFields((prev) => (prev ? { ...prev, top: value } : prev));
                  }}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Left (e.g., 50%)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={dotEditFields?.left ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDotEditFields((prev) => (prev ? { ...prev, left: value } : prev));
                  }}
                />
              </div>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost" onClick={handleDotEditCancel}>
                  Cancel
                </button>
              </form>
              <button
                className="btn btn-primary"
                onClick={handleSubmitDotEdit}
                disabled={!dotEditFields?.sku.trim()}
              >
                Save
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleDotEditCancel}>close</button>
          </form>
        </dialog>
        <dialog ref={deleteModalRef} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 text-error">Delete main product?</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Removing the main product will drop this entire card and its dot products. This action
              cannot be undone here.
            </p>
            <p className="text-sm text-base-content/60 mb-6">
              <strong className="text-base-content">{row.prod_name || "Untitled product"}</strong> · SKU:{" "}
              <span className="font-mono text-xs">{row.product_sku || "N/A"}</span>
            </p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost" onClick={handleCancelDelete}>
                  Cancel
                </button>
              </form>
              <button className="btn btn-error" onClick={handleConfirmDelete}>
                Confirm delete
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCancelDelete}>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary rerenders
export const ProductRowCard = memo(ProductRowCardComponent);

