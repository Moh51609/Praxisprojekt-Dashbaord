"use client";

import { useEffect, useState } from "react";

export function useAccentColor() {
  const [accentColor, setAccentColor] = useState("rgb(99,102,241)");

  useEffect(() => {
    const getPrimary = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (!val) return "rgb(99,102,241)";
      const [r, g, b] = val.split(" ").map((v) => parseInt(v));
      return `rgb(${r}, ${g}, ${b})`;
    };

    setAccentColor(getPrimary());

    const observer = new MutationObserver(() => {
      setAccentColor(getPrimary());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent"],
    });
    return () => observer.disconnect();
  });
  return accentColor;
}
