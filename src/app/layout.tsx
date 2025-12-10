import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "@/lib/globals.css";
import Providers from "./providers";
import { Sidebar } from "@/components/Sidebar";
import { MainContent } from "@/components/MainContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Combo Tools",
  description: "Product combo management tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>
          <div className="min-h-screen flex">
            <Sidebar />

            {/* Main Content Area */}
            <MainContent>
              <main className="flex-1 container mx-auto px-4 py-6">
                {children}
              </main>
              <footer className="footer footer-center bg-base-200 text-base-content p-4">
                <aside>
                  <p>© {new Date().getFullYear()} Combo Tools</p>
                </aside>
              </footer>
            </MainContent>
          </div>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
