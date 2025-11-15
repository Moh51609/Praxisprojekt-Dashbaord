"use client";

import { useState, useEffect } from "react";

export function useLanguage() {
  const [language, setLanguage] = useState<"de" | "en">("de");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("language") as "de" | "en" | null;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: "de" | "en") => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    window.dispatchEvent(new Event("language-changed"));
  };

  return { language, changeLanguage };
}
