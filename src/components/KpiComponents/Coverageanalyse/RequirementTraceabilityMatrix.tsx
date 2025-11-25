"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Scatter,
  Cell,
} from "recharts";
import { useAccentColor } from "@/hooks/useAccentColor";
import { useTheme } from "next-themes";

type ReqBlockPoint = {
  req: string;
  block: string;
  linked: boolean;
  x: number;
  y: number;
};

export default function RequirementTraceabilityMatrix({ data }: { data: any }) {
  const accent = useAccentColor();
  const { theme } = useTheme();

  // 🔹 Extrahiere Requirements und Blöcke
  const requirements = useMemo(
    () =>
      data?.elements?.filter((e: any) => e.type?.includes("Requirement")) ?? [],
    [data]
  );

  const blocks = useMemo(
    () => data?.elements?.filter((e: any) => e.type?.includes("Block")) ?? [],
    [data]
  );

  // 🔹 Alle Satisfy-Relationen als Paare (reqId, blockId)
  const satisfyLinks = new Set(
    data?.relations
      ?.filter((r: any) => r.type?.includes("Satisfy"))
      ?.map((r: any) => `${r.source}-${r.target}`) ?? []
  );

  // 🔹 Matrixpunkte generieren (jede Kombination von Requirement × Block)
  const matrixData = requirements.flatMap((req: any, i: number) =>
    blocks.map((blk: any, j: number) => {
      const linked =
        satisfyLinks.has(`${blk.id}-${req.id}`) ||
        satisfyLinks.has(`${req.id}-${blk.id}`);
      return {
        req: req.name ?? `Req ${i + 1}`,
        block: blk.name ?? `Block ${j + 1}`,
        linked,
        x: j,
        y: i,
      };
    })
  );

  const linkedColor = accent;
  const missingColor = theme === "dark" ? "#374151" : "#e5e7eb";

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <h2 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Traceability-Abdeckung (Requirement → Block)
      </h2>

      <div className="w-full h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 30, right: 20, bottom: 40, left: 60 }}>
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, blocks.length - 1]}
              ticks={blocks.map((_: unknown, i: number) => i)}
              tickFormatter={(i) => blocks[i]?.name?.slice(0, 10) ?? ""}
              tick={{
                fill: theme === "dark" ? "#D1D5DB" : "#111827",
                fontSize: 11,
              }}
              label={{
                value: "Systemblöcke",
                position: "insideBottom",
                offset: -10,
                fill: theme === "dark" ? "#D1D5DB" : "#111827",
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, requirements.length - 1]}
              ticks={requirements.map((_: unknown, i: number) => i)}
              tickFormatter={(i) => requirements[i]?.name?.slice(0, 10) ?? ""}
              tick={{
                fill: theme === "dark" ? "#D1D5DB" : "#111827",
                fontSize: 11,
              }}
              label={{
                value: "Requirements",
                angle: -90,
                position: "insideLeft",
                fill: theme === "dark" ? "#D1D5DB" : "#111827",
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(_, __, obj) =>
                obj.payload.linked
                  ? ["✅ Verknüpft", "Status"]
                  : ["❌ Keine Verbindung", "Status"]
              }
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "white",
                borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
              }}
            />

            <ZAxis range={[150, 150]} />

            <Scatter data={matrixData}>
              {matrixData.map((d: ReqBlockPoint, i: number) => (
                <Cell
                  key={i}
                  fill={d.linked ? linkedColor : missingColor}
                  r={6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: linkedColor }}
          ></span>
          <span>Verknüpft (Satisfy vorhanden)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: missingColor }}
          ></span>
          <span>Nicht verknüpft</span>
        </div>
      </div>
    </section>
  );
}
