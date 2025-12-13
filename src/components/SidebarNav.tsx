"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home as HomeIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  KeySquare as KeySquareIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

interface NavSection {
  items: NavItem[];
  title?: string;
}

export const SidebarNav = () => {
  const pathname = usePathname();

  const sections = useMemo<NavSection[]>(
    () => [
      {
        // Section 1: Home
        items: [{ href: "/", label: "首頁", Icon: HomeIcon }],
      },
      {
        // Section 2: Combo Tools
        title: "組合圖小工具",
        items: [
          { href: "/edit-combo", label: "編輯組合圖", Icon: EditIcon },
          { href: "/view-production", label: "檢視正式版", Icon: EyeIcon },
          { href: "/settings", label: "組合圖小工具設定", Icon: SettingsIcon },
        ],
      },
      {
        // Section 3: Crosssell Management
        title: "Crosssell",
        items: [
          {
            href: "/crosssell",
            label: "Crosssell管理",
            Icon: ShoppingCartIcon,
          },
          {
            href: "/crosssell/settings",
            label: "Crosssell設定",
            Icon: KeySquareIcon,
          },
        ],
      },
    ],
    []
  );

  const renderNavItem = ({ href, label, Icon }: NavItem) => {
    const isActive = pathname === href;

    return (
      <Link
        key={href}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-content shadow-md"
            : "hover:bg-base-200 hover:shadow-sm"
        }`}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex-1 p-4 space-y-4" aria-label="Sidebar navigation">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          {sectionIndex && sectionIndex < sections.length ? (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-base-300" />
              </div>
              {section.title && (
                <div className="relative flex justify-center">
                  <span className="px-2 bg-base-100 text-xs text-base-content/60 font-medium">
                    {section.title}
                  </span>
                </div>
              )}
            </div>
          ) : null}
          {section.items.map(renderNavItem)}
        </div>
      ))}
    </nav>
  );
};
