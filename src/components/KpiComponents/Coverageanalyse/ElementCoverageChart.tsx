"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";
import { Compass } from "lucide-react";
import * as d3 from "d3";
import { useChartZoom } from "@/hooks/useChartZoom";
import { useRef, useState, useMemo, useEffect } from "react";
import { useChartBackground } from "@/hooks/useChartBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { UmlElement } from "@/types/model";

export default function SystemCoverageRadarChart({
  data,
  relations,
}: {
  data: any;
  relations: any[];
}) {
  const accent = useAccentColor();
  const { theme } = useTheme();
  const chartBackground = useChartBackground();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const chartZoom = useChartZoom();
  const { language } = useLanguage();

  /* 🔍 Zoom bleibt */
  useEffect(() => {
    if (!svgRef.current || !chartZoom) return;

    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => setTransform(event.transform));

    svg.call(zoom as any);
    return () => {
      svg.on(".zoom", null);
    };
  }, [chartZoom]);

  const relatedIds = new Set(
    relations?.flatMap((r) => [r.source, r.target]) ?? []
  );

  /* =================================================
     ✅ KORREKTE COVERAGE – angepasst an XML + ParsedModel
     ================================================= */
  const coverage = useMemo(() => {
    const elements = data?.elements ?? [];
    const rels = relations ?? [];

    /* 🔹 BLOCKS (uml:Class mit Ports oder Block-Stereotyp) */
    const blocks = data.elements.filter(
      (e: UmlElement) => e.type === "uml:Class"
    );
    const connectedBlocks = blocks.filter((b: UmlElement) =>
      relations.some((r) => r.source === b.id || r.target === b.id)
    );

    console.log("Blocks gesamt:", blocks.length);
    console.log("Verbundene Blocks:", connectedBlocks.length);
    /* 🔹 REQUIREMENTS */
    const requirements = elements.filter((e: any) =>
      e.type?.toLowerCase().includes("requirement")
    );
    const connectedRequirements = requirements.filter((r: any) =>
      relatedIds.has(r.id)
    );

    /* 🔹 PORTS (über owning Block!) */
    const ports = blocks.flatMap((b: any) => b.ports ?? []);
    const connectedPorts = blocks
      .filter((b: any) => relatedIds.has(b.id))
      .flatMap((b: any) => b.ports ?? []);

    /* 🔹 CONNECTORS */
    const connectors = rels;
    const validConnectors = connectors.filter((r: any) => r.source && r.target);

    /* 🔹 PACKAGES */
    const packages = elements.filter((e: any) => e.type === "uml:Package");
    const nonEmptyPackages = packages.filter((p: any) =>
      elements.some((e: any) => e.package === p.name)
    );

    return [
      {
        category: "Block",
        abdeckung: blocks.length
          ? Math.round((connectedBlocks.length / blocks.length) * 100)
          : 0,
      },
      {
        category: "Requirement",
        abdeckung: requirements.length
          ? Math.round(
              (connectedRequirements.length / requirements.length) * 100
            )
          : 0,
      },
      {
        category: "Port",
        abdeckung: ports.length
          ? Math.round((connectedPorts.length / ports.length) * 100)
          : 0,
      },
      {
        category: "Connector",
        abdeckung: connectors.length
          ? Math.round((validConnectors.length / connectors.length) * 100)
          : 0,
      },
      {
        category: "Package",
        abdeckung: packages.length
          ? Math.round((nonEmptyPackages.length / packages.length) * 100)
          : 0,
      },
    ];
  }, [data, relations, relatedIds]);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Compass className="h-5 w-5" style={{ color: accent }} />
        {translations[language].systemicCoverage}
      </h2>

      <div className="relative rounded-2xl p-4">
        {/* ✅ ChartBackground bleibt */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-colors duration-300"
          style={{
            zIndex: 0,
            backgroundColor:
              chartBackground === "light"
                ? theme === "dark"
                  ? "#1f2937"
                  : "#ffffff"
                : chartBackground === "transparent"
                ? theme === "dark"
                  ? "rgba(0,0,0,0.25)"
                  : "rgba(255,255,255,0.4)"
                : "transparent",
            backgroundImage:
              chartBackground === "grid"
                ? `
          linear-gradient(to right, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px),
          linear-gradient(to bottom, ${
            theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
          } 1px, transparent 1px)
        `
                : "none",
            backgroundSize: chartBackground === "grid" ? "24px 24px" : "auto",
            backdropFilter:
              chartBackground === "transparent" ? "blur(4px)" : "none",
          }}
        />

        <svg ref={svgRef} width="100%" height="250">
          <g transform={transform.toString()}>
            <foreignObject width="100%" height="100%">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={coverage}>
                  <PolarGrid
                    stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                    gridType="polygon"
                  />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{
                      fill: theme === "dark" ? "#D1D5DB" : "#111827",
                      fontSize: 12,
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{
                      fill: theme === "dark" ? "#9CA3AF" : "#4B5563",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null;
                      const { category, abdeckung } = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 text-black p-2 rounded shadow text-xs">
                          <strong>{category}</strong>
                          <div className="text-gray-600">{abdeckung} %</div>
                        </div>
                      );
                    }}
                  />
                  <Radar
                    dataKey="abdeckung"
                    stroke={accent}
                    fill={accent}
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </foreignObject>
          </g>
        </svg>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {translations[language].systemicCoverageLegend}
      </p>
    </section>
  );
}
