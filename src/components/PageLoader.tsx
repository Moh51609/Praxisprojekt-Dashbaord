"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeAccentContextType = {
  accent: string;
  setAccent: (color: string) => void;
};

const ThemeAccentContext = createContext<ThemeAccentContextType>({
  accent: "indigo",
  setAccent: () => {},
});

export function ThemeAccentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accent, setAccent] = useState("indigo");

  useEffect(() => {
    const saved = localStorage.getItem("accent-color");
    if (saved) {
      setAccent(saved);
      document.documentElement.setAttribute("data-accent", saved);
    }
  }, []);

  const handleSetAccent = (color: string) => {
    setAccent(color);
    localStorage.setItem("accent-color", color);
    document.documentElement.setAttribute("data-accent", color);
  };

  return (
    <ThemeAccentContext.Provider value={{ accent, setAccent: handleSetAccent }}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ThemeAccentContext.Provider>
  );
}

export const useThemeAccent = () => useContext(ThemeAccentContext);
