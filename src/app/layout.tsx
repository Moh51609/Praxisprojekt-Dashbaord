"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import type { ReactNode } from "react";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import HomeRedirect from "./page";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  // 🔹 State für gespeichertes Muster
  const [bgPattern, setBgPattern] = useState<string>("none");

  useEffect(() => {
    // Wenn bereits gesetzt (vom Inline-Script), nicht erneut überschreiben
    const accentFromDom = document.documentElement.getAttribute("data-accent");
    const bgFromDom = document.documentElement.getAttribute("data-bgpattern");

    // Nur wenn nichts gesetzt wurde → aus LocalStorage lesen
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
          <div
            style={{ ["--sidebar" as any]: "clamp(240px, 30vw, 320px)" }}
            className="grid min-h-screen grid-cols-[var(--sidebar)_minmax(0,1fr)]"
          >
            {/* Sidebar */}
            <aside className="hidden bg-white dark:bg-gray-800 md:block">
              <div className="sticky top-0 h-screen overflow-y-auto">
                <Sidebar />
              </div>
            </aside>

            {/* Inhalt */}
            <div className="flex min-w-0 flex-col">
              <main
                className="relative mx-auto w-full flex-1 text-gray-900 dark:text-gray-50"
                style={{
                  backgroundColor: "transparent", // ✅ wichtig
                }}
              >
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
