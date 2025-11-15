import { useTheme } from "next-themes";

export function useChartTooltipStyle() {
  const { theme } = useTheme();
  return {
    backgroundColor: theme === "dark" ? "#fff" : "#fff",
    color: theme === "dark" ? "#f3f4f6" : "#f3f4f6",
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  };
}
