"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { Network } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default || m),
  { ssr: false }
);

type Element = {
  id: string;
  name?: string;
  type?: string;
};

type Relation = {
  sourceName?: string;
  targetName?: string;
  type?: string;
};

const ALLOWED_TYPES = [
  "uml:Class",
  "class",
  "block",
  "systemfunktion",
  "function",
];

export default function RelationsGraph({
  relations,
  elements,
}: {
  relations: Relation[];
  elements: Element[];
}) {
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const accentColor = useAccentColor();
  const autoLoad = useAutoLoadChart();
  const { language } = useLanguage();

  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () =>
      setSize({
        width: containerRef.current!.offsetWidth,
        height: containerRef.current!.offsetHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function isAllowedElement(e?: Element) {
    if (!e?.type) return false;
    const t = e.type.toLowerCase();
    return ALLOWED_TYPES.some((a) => t.includes(a));
  }

  /* ========= Nodes ========= */
  const allowedNames = useMemo(() => {
    const set = new Set<string>();

    elements.forEach((e) => {
      if (isAllowedElement(e) && e.name) {
        set.add(e.name);
      }
    });

    return set;
  }, [elements]);

  /* ========= Links ========= */
  const links = useMemo(() => {
    return relations
      .filter(
        (r) =>
          r.sourceName &&
          r.targetName &&
          allowedNames.has(r.sourceName) &&
          allowedNames.has(r.targetName)
      )
      .map((r) => ({
        source: r.sourceName!,
        target: r.targetName!,
        type: r.type,
      }));
  }, [relations, allowedNames]);
  const nodes = useMemo(() => {
    const names = new Set<string>();
    links.forEach((l) => {
      names.add(l.source);
      names.add(l.target);
    });
    return Array.from(names).map((n) => ({ id: n, name: n }));
  }, [links]);

  useEffect(() => {
    if (!graphRef.current) return;

    graphRef.current.d3Force("charge")?.strength(-300);
  }, [relations]);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col min-h-[400px] flex-1 items-center justify-center dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
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
        <Network className="h-5 w-5" style={{ color: accentColor }} />
        {translations[language].relationshierarchy}
      </h2>

      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden w-full bg-transparent h-[500px] relative"
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            background:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937"
                  : "#ffffff"
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)"
                  : "rgba(255,255,255,0.4)"
                : `
                  linear-gradient(to right, ${
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)"
                  } 1px, transparent 1px),
                  linear-gradient(to bottom, ${
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)"
                  } 1px, transparent 1px)
                `,
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none",
            boxShadow:
              chartBackground === "transparent"
                ? "inset 0 0 20px rgba(255,255,255,0.05)"
                : "none",
          }}
        />

        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes, links }}
          width={size.width}
          height={size.height}
          nodeLabel={(n: any) => n.name}
          nodeAutoColorBy="id"
          linkDirectionalArrowLength={4}
          linkColor={() => "#6366f1"}
        />
      </div>

      <p className="text-xs text-gray-500 mt-3 dark:text-gray-400 justify-center items-center flex">
        {translations[language].relationshierarchyLegend}
      </p>
    </div>
  );
}
