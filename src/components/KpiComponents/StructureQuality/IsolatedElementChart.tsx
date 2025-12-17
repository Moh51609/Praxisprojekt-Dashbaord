"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useAccentColor } from "@/hooks/useAccentColor";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";

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
  source?: string;
  target?: string;
  type?: string;
};

type GraphLink = {
  source: string;
  target: string;
};

export default function IsolatedElementsChart({
  relations,
  elements,
}: {
  relations: Relation[];
  elements: Element[];
}) {
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const accentColor = useAccentColor();
  const { language } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 500 });
  const [visible, setVisible] = useState(false);
  const autoLoad = useAutoLoadChart();

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

  function isBlock(e?: Element) {
    if (!e) return false;

    const type = e.type?.toLowerCase() ?? "";
    const stereo = e.stereotype?.toLowerCase() ?? "";

    return (
      type === "uml:class" || type.includes("sysml:block") || stereo === "block"
    );
  }

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
        };
      })
      .filter((l): l is GraphLink => l !== null);
  }, [relations, elementById]);

  const relationGraphBlockNames = useMemo(() => {
    const names = new Set<string>();

    links.forEach((l) => {
      const src = elementById.get(l.source);
      const tgt = elementById.get(l.target);

      if (src?.name) names.add(src.name);
      if (tgt?.name) names.add(tgt.name);
    });

    return names;
  }, [links, elementById]);

  const connectedBlockIds = useMemo(() => {
    const ids = new Set<string>();
    links.forEach((l) => {
      ids.add(l.source);
      ids.add(l.target);
    });
    return ids;
  }, [links]);

  const isolatedNodes = useMemo(() => {
    return elements
      .filter((e) => isBlock(e))
      .filter((e) => e.name && !relationGraphBlockNames.has(e.name))
      .map((e) => ({
        id: e.id,
        name: e.name!,
      }));
  }, [elements, relationGraphBlockNames]);

  const hasData = isolatedNodes.length > 0;

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.d3Force("charge")?.strength(-300);
  }, [isolatedNodes]);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="p-8 text-center dark:bg-gray-800 bg-white rounded-2xl  h-[575px] items-center flex justify-center flex-col shadow-sm">
        <p className="text-gray-600 dark:text-gray-200 mb-4">
          {translations[language].loadChart}
        </p>
        <button
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
          onClick={() => setVisible(true)}
        >
          {translations[language].loadNow}{" "}
        </button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <section className="bg-white flex-col dark:bg-gray-800 items-center flex justify-center rounded-2xl h-[625px]  shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].isolatedELements}
        </h2>

        {translations[language].noData}
      </section>
    );
  }
  return (
    <section className="rounded-2xl dark:bg-gray-800 bg-white p-6 shadow-sm relative">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" style={{ color: accentColor }} />
          {translations[language].isolatedELements}
        </h2>
      </div>

      <div
        ref={containerRef}
        className="rounded-2xl overflow-hidden w-full bg-transparent h-[500px] relative flex items-center justify-center"
      >
        {isolatedNodes.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-green-500" />
            <span>Keine isolierten Blöcke vorhanden</span>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={{ nodes: isolatedNodes, links: [] }}
            width={size.width}
            height={size.height}
            nodeLabel={(n: any) => n.name}
            nodeColor={() => "#ef4444"}
          />
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 dark:text-gray-300">
        {translations[language].isolatedELementsLegend}
      </p>
    </section>
  );
}
