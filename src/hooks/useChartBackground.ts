import { useEffect, useState } from "react";

export type ChartBackgroundType = "light" | "grid" | "transparent";

export function useChartBackground(): ChartBackgroundType {
  const [background, setBackground] = useState<ChartBackgroundType>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(
      "chart-background"
    ) as ChartBackgroundType | null;
    if (saved) setBackground(saved);
  });

  useEffect(() => {
    const handler = () => {
      const updated = localStorage.getItem(
        "chart-background"
      ) as ChartBackgroundType | null;
      if (updated) setBackground(updated);
    };
    window.addEventListener("chart-background-changed", handler);
    return () =>
      window.removeEventListener("chart-background-changed", handler);
  }, []);

  return background;
}
