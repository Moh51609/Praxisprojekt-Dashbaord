"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Flame } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";
import * as d3 from "d3";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";

export default function RelationsHeatmap({ relations }: { relations: any[] }) {
  // 🔹 Beziehungen nach Blocknamen zählen
  const blockCounts: Record<string, number> = {};
  const chartZoom = useChartZoom();
  const accentColor = useAccentColor();
  const autoLoad = useAutoLoadChart();
  const [visible, setVisible] = useState(true);
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const { language } = useLanguage();
  const [transform, setTransform] = useState(d3.zoomIdentity);
  relations.forEach((r) => {
    const source = r.sourceName || r.source || "Unbekannt";
    const target = r.targetName || r.target || "Unbekannt";
    blockCounts[source] = (blockCounts[source] ?? 0) + 1;
    blockCounts[target] = (blockCounts[target] ?? 0) + 1;
  });

  // 🔹 Daten für die Treemap vorbereiten
  const data = Object.entries(blockCounts).map(([name, count]) => ({
    name,
    size: count,
  }));

  const getColor = (value: number) => {
    if (value > 15) return "#f59e0b"; // orange
    if (value > 8) return "#facc15"; // gelb
    return "#10b981"; // grün
  };

  useEffect(() => {
    if (!zoomRef.current) return;

    const svg = d3.select(zoomRef.current);

    if (chartZoom) {
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3]) // Zoom-Bereich
        .on("zoom", (event) => setTransform(event.transform));

      svg.call(zoomBehavior as any);
    } else {
      // 🔸 Zoom deaktiviert → zurücksetzen
      svg.on(".zoom", null);
      setTransform(d3.zoomIdentity);
    }
  }, [chartZoom]);

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  if (!visible) {
    return (
      <div className="flex flex-col min-h-[400px] flex-1 items-center justify-center  dark:bg-gray-800 bg-white rounded-2xl shadow-sm">
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
                          <div className="  bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
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

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center">
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
