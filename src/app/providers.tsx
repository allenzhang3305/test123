"use client";

import type { PropsWithChildren } from "react";
import { ConfigProvider } from "@/lib/client/context/config-context";
import { SidebarProvider } from "@/lib/client/context/sidebar-context";
import { CrosssellProvider } from "@/lib/client/context/crosssell-context";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <ConfigProvider>
        <CrosssellProvider>{children}</CrosssellProvider>
      </ConfigProvider>
    </SidebarProvider>
  );
}


