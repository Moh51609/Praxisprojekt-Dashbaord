"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Flame } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useAnimation } from "framer-motion";
import { useAnimationsEnabled } from "@/hooks/useAnimation";

export default function RelationsHeatmap({
  relations,
  elements,
}: {
  relations: any[];
  elements: any[];
}) {
  const chartZoom = useChartZoom();
  const accentColor = useAccentColor();
  const useAnimation = useAnimationsEnabled();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const { language } = useLanguage();
  const [transform, setTransform] = useState(d3.zoomIdentity);

  const elementById = useMemo(() => {
    const map = new Map<string, any>();
    elements.forEach((e) => map.set(e.id, e));
    return map;
  }, [elements]);

  function isBlock(e?: any) {
    if (!e) return false;

    const type = e.type?.toLowerCase() ?? "";
    const stereo = (e.stereotype ?? "").toLowerCase();

    if (type === "uml:class") return true;

    if (type.includes("sysml:block")) return true;

    if (
      stereo.includes("system") ||
      stereo.includes("kontext") ||
      stereo.includes("domain")
    ) {
      return true;
    }

    return false;
  }

  function resolveToBlock(el?: any): any | null {
    if (!el) return null;
    if (isBlock(el)) return el;
    if (el.parentId) return resolveToBlock(elementById.get(el.parentId));
    return null;
  }

  const blockCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};

    relations.forEach((r, i) => {
      if (!r.source || !r.target) return;

      const srcEl = elementById.get(r.source);
      const tgtEl = elementById.get(r.target);

      const srcBlock = resolveToBlock(srcEl);
      const tgtBlock = resolveToBlock(tgtEl);

      if (!srcBlock || !tgtBlock) return;
      if (srcBlock.id === tgtBlock.id) return;

      const srcName = srcBlock.name ?? srcBlock.id;
      const tgtName = tgtBlock.name ?? tgtBlock.id;

      counts[srcName] = (counts[srcName] ?? 0) + 1;
      counts[tgtName] = (counts[tgtName] ?? 0) + 1;
    });

    return counts;
  }, [relations, elementById]);

  const data = useMemo(
    () =>
      Object.entries(blockCounts).map(([name, count]) => ({
        name,
        size: count,
      })),
    [blockCounts]
  );

  const getColor = (value: number) => {
    if (value > 15) return "#f59e0b";
    if (value > 8) return "#facc15";
    return "#10b981"; // grün
  };

  useEffect(() => {
    if (!zoomRef.current) return;

    const svg = d3.select(zoomRef.current);

    if (chartZoom) {
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => setTransform(event.transform));

      svg.call(zoomBehavior as any);
    } else {
      svg.on(".zoom", null);
      setTransform(d3.zoomIdentity);
    }
  }, [chartZoom]);

  const hasData = data.length > 0;

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
      <section className="bg-white flex-col dark:bg-gray-800 h-[625px]  items-center flex justify-center rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].relationsIntensity}
        </h2>
        {translations[language].noData}
      </section>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-row gap-1">
        <Flame className="h-6 w-6" style={{ color: accentColor }} />
        <h2 className="text-lg font-semibold mb-4">
          {translations[language].relationsIntensity}
        </h2>
      </div>

      <div className="rounded-2xl overflow-hidden relative">
        <svg ref={zoomRef} width="100%" height="500">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data}
                    dataKey="size"
                    nameKey="name"
                    aspectRatio={4 / 2}
                    isAnimationActive={useAnimation}
                    stroke="#fff"
                    fill="#111827"
                    content={<CustomTreemapCell getColor={getColor} />}
                  >
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                            <strong>{d.name}</strong>
                            <div>{d.size} Beziehungen</div>
                          </div>
                        );
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 mt-2 dark:text-gray-300">
        {translations[language].relationsIntensityLegend}
      </p>
    </div>
  );
}

function CustomTreemapCell({ x, y, width, height, name, size, getColor }: any) {
  const color = getColor(size);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        rx={5}
        ry={5}
      />
      {width > 40 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontWeight="bold"
        >
          {name.length > 10 ? name.slice(0, 10) + "…" : name}
        </text>
      )}
    </g>
  );
}
