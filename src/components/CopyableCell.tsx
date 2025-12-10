"use client";

import { Copy as CopyIcon } from "lucide-react";

interface CopyableCellProps {
  text: string;
  id: string;
  onCopy: (text: string, id: string) => void;
  className?: string;
  children?: React.ReactNode;
  hoverBg?: "base-200" | "base-300";
}

export const CopyableCell = ({
  text,
  id,
  onCopy,
  className = "",
  children,
  hoverBg = "base-200",
}: CopyableCellProps) => {
  const hoverClass = hoverBg === "base-300" ? "hover:bg-base-300" : "hover:bg-base-200";
  const baseClasses = `rounded-sm align-top cursor-pointer ${hoverClass} transition-colors duration-100`;

  return (
    <td
      className={`${baseClasses} ${className}`}
      onClick={() => onCopy(text, id)}
      title="Click to copy"
    >
      <div className="flex items-center gap-1">
        {children || text}
        <CopyIcon className="w-3 h-3 opacity-50" />
      </div>
    </td>
  );
};

