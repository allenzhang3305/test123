"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CrossSellItem } from "@/types";

interface SortableCrossSellRowProps {
  item: CrossSellItem;
}

// Sortable row component - prevents rerender of entire table during drag
export const SortableCrossSellRow = ({ item }: SortableCrossSellRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.linked_product_sku,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-move hover:bg-base-200/50">
      <td className="px-4 py-3 text-base-content">{item.linked_product_sku}</td>
      <td className="px-4 py-3 text-base-content/70">{item.linked_product_type}</td>
      <td className="px-4 py-3 text-base-content/70">{item.position}</td>
    </tr>
  );
};



