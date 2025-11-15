"use client";
import dynamic from "next/dynamic";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAnimationsEnabled } from "@/hooks/useAnimation";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { Network } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import type { ForceGraphMethods } from "react-force-graph-2d";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default || mod),
  { ssr: false }
);

export default function RelationsGraph({ data }: { data: any[] }) {
  const { theme } = useTheme();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const animationEnabled = useAnimationsEnabled();
  const chartBackground = useChartBackground();
  const accentColor = useAccentColor();
  const { language } = useLanguage();
  // const bgColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods>();

  const [size, setSize] = useState({ width: 0, height: 600 });
  const chartZoom = useChartZoom();

  // 🧠 Größe dynamisch an Container anpassen
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Nodes
  const uniqueNodeIds = Array.from(
    new Set(data.flatMap((r) => [r.source, r.target]).filter(Boolean))
  );
  const nodes = uniqueNodeIds.map((id) => ({ id, name: id }));
  const links = useMemo(
    () =>
      data.map((r, i) => ({
        id: i,
        source: r.source,
        target: r.target,
        type: r.type,
      })),
    [data]
  );

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-300);
    }
  }, [data]);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col  min-h-[400px] flex-1 items-center justify-center  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4 text-center">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Network className="h-5 w-5 " style={{ color: accentColor }} />
        {translations[language].relationshierarchy}
      </h2>
      <div
        ref={containerRef}
        className=" rounded-2xl overflow-hidden w-full bg-transparent h-[500px] relative"
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            background:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937" // dunkles Grau im Dark Mode
                  : "#ffffff" // weiß im Light Mode
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)" // 🟣 leicht dunkler Overlay im Dark Mode
                  : "rgba(255,255,255,0.4)" // ⚪ heller Schleier im Light Mode
                : `
        linear-gradient(to right, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px),
        linear-gradient(to bottom, ${
          theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
        } 1px, transparent 1px)
      `,
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none", // 🧊 sanfter Blur-Effekt nur im Transparent-Modus
            boxShadow:
              chartBackground === "transparent"
                ? "inset 0 0 20px rgba(255,255,255,0.05)"
                : "none", // optionaler Glaseffekt
          }}
        />

        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes, links }}
          width={size.width}
          height={size.height}
          nodeLabel={(node) => node.name}
          linkColor={() => "#6366f1"}
          linkDirectionalArrowLength={4}
          nodeAutoColorBy="id"
        />
      </div>
      <p className="text-xs text-gray-500 mt-3 dark:text-white">
        {translations[language].relationshierarchyLegend}{" "}
      </p>
    </div>
  );
}
