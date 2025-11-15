// 📁 src/hooks/useAnimationsEnabled.ts
import { useEffect, useState } from "react";

export function useAnimationsEnabled() {
  // 🧠 Direkt beim Mount prüfen, NICHT erst später
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("animations-enabled");
      return saved !== "false"; // Default = true
    }
    return true;
  });

  useEffect(() => {
    const handler = () => {
      const updated = localStorage.getItem("animations-enabled");
      setEnabled(updated !== "false");
    };

    window.addEventListener("animation-setting-changed", handler);
    return () =>
      window.removeEventListener("animation-setting-changed", handler);
  }, []);

  return enabled;
}
