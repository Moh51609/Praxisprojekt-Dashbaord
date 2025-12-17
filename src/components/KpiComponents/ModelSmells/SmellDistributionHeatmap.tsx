"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { Flame } from "lucide-react";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { useAutoLoadChart } from "@/hooks/useAutoLoadChart";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { useAnimateMini } from "framer-motion";
import { useAnimationsEnabled } from "@/hooks/useAnimation";

export default function SmellHotspotHeatmap({ smells }: { smells: any[] }) {
  const accentColor = useAccentColor();
  const chartZoom = useChartZoom();
  const autoLoad = useAutoLoadChart();
  const { language } = useLanguage();
  const [visible, setVisible] = useState(true);
  const zoomRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const useAnimation = useAnimationsEnabled();

  const smellCounts: Record<string, number> = {};
  (smells ?? []).forEach((s) => {
    const key =
      s.packagePath || s.package || s.element || s.name || "Unbekannt";
    smellCounts[key] = (smellCounts[key] ?? 0) + 1;
  });

  const data = Object.entries(smellCounts).map(([name, count]) => ({
    name,
    size: count,
  }));

  const getColor = (value: number) => {
    if (value > 10) return "#ef4444";
    if (value > 5) return "#f59e0b";
    if (value > 2) return "#facc15";
    return "#10b981";
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

  useEffect(() => {
    setVisible(autoLoad);
  }, [autoLoad]);

  const hasData = data.length > 0;
  if (!hasData) {
    return (
      <section className="bg-white dark:bg-gray-800 h-[575px]  items-center flex justify-center flex-col rounded-2xl shadow-sm p-6 text-center text-gray-500 dark:text-gray-400">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          {translations[language].smellHotspotInModel}
        </h2>
        {translations[language].noData}
      </section>
    );
  }

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
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <div className="flex flex-row gap-2 items-center mb-4">
        <Flame className="h-6 w-6" style={{ color: accentColor }} />
        <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100">
          {translations[language].smellHotspotInModel}
        </h2>
      </div>

      <div className="rounded-2xl overflow-hidden relative">
        <svg ref={zoomRef} width="100%" height="450">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data}
                    dataKey="size"
                    nameKey="name"
                    aspectRatio={4 / 4}
                    stroke="#fff"
                    fill="#8884d8"
                    isAnimationActive={useAnimation}
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
                            <div>{d.size} Smells</div>
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

      <p className="text-xs text-gray-500 mt-3 dark:text-gray-300 text-center">
        {translations[language].smellHotspotInModelLegend}
      </p>
    </section>
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
          {name.length > 12 ? name.slice(0, 12) + "…" : name}
        </text>
      )}
    </g>
  );
}
