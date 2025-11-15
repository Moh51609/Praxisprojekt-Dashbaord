// 📁 src/hooks/usePageBackground.ts
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function usePageBackground() {
  const { theme } = useTheme();
  const [pattern, setPattern] = useState("none");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bg-pattern") ?? "none";
      setPattern(saved);

      // 🔁 reaktiv bei Änderungen aus Settings
      const handler = () => {
        const updated = localStorage.getItem("bg-pattern") ?? "none";
        setPattern(updated);
      };
      window.addEventListener("bg-pattern-changed", handler);
      return () => window.removeEventListener("bg-pattern-changed", handler);
    }
  }, []);

  // 🎨 passende Stile abhängig von Theme + Pattern
  const backgroundStyle: React.CSSProperties =
    pattern === "none"
      ? {
          backgroundColor: theme === "dark" ? "#111827" : "#f9fafb",
        }
      : pattern === "grid"
      ? {
          backgroundImage: `
            linear-gradient(to right, ${
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
            } 1px, transparent 1px),
            linear-gradient(to bottom, ${
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
            } 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }
      : pattern === "dots"
      ? {
          backgroundImage: `radial-gradient(${
            theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
          } 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }
      : {
          backgroundImage: `
            repeating-linear-gradient(45deg, ${
              theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
            } 0, ${
            theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
          } 2px, transparent 2px, transparent 20px),
            repeating-linear-gradient(-45deg, ${
              theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
            } 0, ${
            theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
          } 2px, transparent 2px, transparent 20px)
          `,
          backgroundSize: "40px 40px",
        };

  return backgroundStyle;
}
