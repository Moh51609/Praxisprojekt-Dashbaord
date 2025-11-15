import { useEffect, useState } from "react";

export function useAutoLoadChart() {
  const [autoLoad, setAutoLoad] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("auto-load-charts");
    setAutoLoad(saved !== "false");

    const handler = () => {
      const newVal = localStorage.getItem("auto-load-charts");
      setAutoLoad(newVal !== "false");
    };

    window.addEventListener("auto-load-charts-changed", handler);
    return () =>
      window.removeEventListener("auto-load-charts-changed", handler);
  }, []);

  return autoLoad;
}
