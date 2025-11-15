import { useEffect, useState } from "react";

export function useChartZoom() {
  const [zoomEnabled, setZoomEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chart-zoom");
      return saved !== "false";
    }
    return true;
  });

  useEffect(() => {
    const handleChange = () => {
      const saved = localStorage.getItem("chart-zoom");
      setZoomEnabled(saved !== "false");
    };
    window.addEventListener("chart-zoom-changed", handleChange);
    return () => window.removeEventListener("chart-zoom-changed", handleChange);
  }, []);
  return zoomEnabled;
}
