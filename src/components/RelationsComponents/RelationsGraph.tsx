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
import { useAnimationsEnabled } from "@/hooks/useAnimation";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default || m),
  { ssr: false }
);
type Element = {
  id: string;
  name?: string;
  type?: string;
  stereotype?: string;
  parentId?: string;
};

type Relation = {
  source?: string; // ID
  target?: string; // ID
  type?: string;
};

const ALLOWED_TYPES = [
  "uml:Class",
  "class",
  "block",
  "systemfunktion",
  "function",
];

type GraphLink = {
  source: string;
  target: string;
  type?: string;
};

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
  const useAnimation = useAnimationsEnabled();

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

  function isBlock(e?: Element & { stereotype?: string }) {
    if (!e) return false;

    const type = e.type?.toLowerCase() ?? "";
    const stereo = e.stereotype?.toLowerCase() ?? "";

    return (
      type.includes("sysml:block") ||
      stereo === "block" ||
      (type === "uml:class" && stereo === "block")
    );
  }

  const idToName = useMemo(() => {
    const map = new Map<string, string>();
    elements.forEach((e) => {
      if (e.id && e.name) map.set(e.id, e.name);
    });
    return map;
  }, [elements]);

  const elementById = useMemo(() => {
    const map = new Map<string, Element>();
    elements.forEach((e) => map.set(e.id, e));
    return map;
  }, [elements]);

  const links = useMemo<GraphLink[]>(() => {
    return relations
      .map((r): GraphLink | null => {
        if (!r.source || !r.target) return null;

        const src = elementById.get(r.source);
        const tgt = elementById.get(r.target);

        // 🔁 Port → Parent Block auflösen
        const srcBlock =
          src?.stereotype === "block"
            ? src
            : src?.parentId
            ? elementById.get(src.parentId)
            : null;

        const tgtBlock =
          tgt?.stereotype === "block"
            ? tgt
            : tgt?.parentId
            ? elementById.get(tgt.parentId)
            : null;

        if (!srcBlock || !tgtBlock) return null;
        if (srcBlock.id === tgtBlock.id) return null;

        return {
          source: srcBlock.id,
          target: tgtBlock.id,
          type: r.type,
        };
      })
      .filter((l): l is GraphLink => l !== null);
  }, [relations, elementById]);

  const nodes = useMemo(() => {
    const ids = new Set<string>();

    links.forEach((l) => {
      ids.add(l.source);
      ids.add(l.target);
    });

    return Array.from(ids).map((id) => {
      const el = elementById.get(id);
      return {
        id,
        name: el?.name ?? id,
      };
    });
  }, [links, elementById]);

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
  const hasData = nodes.length > 0 && links.length > 0;

  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].relationshierarchy}
        </h2>
        {translations[language].noData}
      </section>
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
