"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import HomeRedirect from "./page";
import SearchOverlay from "@/components/Search/SearchOverlay";
import TreeOverlay from "@/components/TreeComponents/TreeOverlay";
import { ModelProvider } from "@/context/ModelContext";
import { Menu, X } from "lucide-react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  // 🔹 State für gespeichertes Muster
  const [bgPattern, setBgPattern] = useState<string>("none");
  const [treeData, setTreeData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // ✅ NEU

  useEffect(() => {
    fetch("/api/xmi-tree")
      .then((r) => r.json())
      .then((json) => setTreeData(json.tree));
  }, []);

  useEffect(() => {
    const accentFromDom = document.documentElement.getAttribute("data-accent");
    const bgFromDom = document.documentElement.getAttribute("data-bgpattern");

    if (!accentFromDom) {
      const savedAccent = localStorage.getItem("accent-color");
      if (savedAccent) {
        document.documentElement.setAttribute("data-accent", savedAccent);
        console.log("🎨 Accent-Farbe wiederhergestellt (Client):", savedAccent);
      }
    }

    if (!bgFromDom) {
      const savedPattern = localStorage.getItem("bg-pattern") ?? "none";
      setBgPattern(savedPattern);
      document.documentElement.setAttribute("data-bgpattern", savedPattern);
      console.log(
        "🎨 Hintergrundmuster wiederhergestellt (Client):",
        savedPattern
      );
    }
  }, []);

  return (
    <html lang="de" className={montserrat.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // === Accent Color ===
                const accent = localStorage.getItem("accent-color");
                if (accent) {
                  document.documentElement.setAttribute("data-accent", accent);
                }

                // === Hintergrundmuster ===
                const bgPattern = localStorage.getItem("bg-pattern");
                if (bgPattern) {
                  document.documentElement.setAttribute("data-bgpattern", bgPattern);
                }

                // === Theme ===
                const theme = localStorage.getItem("theme");
                if (theme === "dark") {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (e) {
                console.warn("⚠️ Konnte Theme oder Accent nicht wiederherstellen:", e);
              }
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ModelProvider>
            <div className="flex h-screen">
              <aside
                className={[
                  "fixed top-0 left-0 h-screen z-40 w-[300px] bg-white dark:bg-gray-800",
                  "transition-transform duration-300",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full",
                  "md:translate-x-0 md:relative md:block md:transition-none md:transform-none",
                ].join(" ")}
              >
                <div className="h-full overflow-hidden">
                  <Sidebar />
                </div>
              </aside>

              <div className="flex flex-1 flex-col min-w-0">
                {" "}
                <div className="md:hidden flex items-center h-14 px-4 border-b dark:border-gray-700">
                  <button
                    onClick={() => setSidebarOpen((s) => !s)}
                    className="text-gray-700 dark:text-white"
                  >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
                <main className="relative flex-1 w-full overflow-y-auto text-gray-900 dark:text-gray-50">
                  {children}
                </main>
                <SearchOverlay />
                <TreeOverlay tree={treeData} />
              </div>

              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-30 bg-black/40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            </div>
          </ModelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
