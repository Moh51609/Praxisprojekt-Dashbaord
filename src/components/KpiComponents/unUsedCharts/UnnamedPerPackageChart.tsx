"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import { ChartBar } from "lucide-react";
import type { ParsedModel } from "@/types/model";

export default function UnnamedPerPackageChart({
  data,
}: {
  data: ParsedModel;
}) {
  const unnamed = data.quality?.unnamedPerPackage ?? [];

  return (
    <section className="relative bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex flex-row justify-between mb-4 px-2">
        <h2 className="text-lg font-semibold">Unbe. Elemente / Package</h2>
        <ChartBar className="h-6 w-6 text-gray-700" />
      </div>

      <div className="relative rounded-2xl bg-gray-50 p-4">
        {/* Hintergrund-Gitter */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            zIndex: 0,
          }}
        />

        {/* Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data.quality?.unnamedPerPackage ?? []}
            margin={{ top: 10, right: 20, left: -30, bottom: 40 }}
          >
            {/* Farbige Qualitätsbereiche */}
            <ReferenceArea y1={0} y2={5} fill="#86efac" fillOpacity={0.5} />
            <ReferenceArea y1={5} y2={15} fill="#fde68a" fillOpacity={0.5} />
            <ReferenceArea y1={15} y2={30} fill="#fca5a5" fillOpacity={0.5} />

            <XAxis
              dataKey="package"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              domain={[0, 30]}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Unbenannte Elemente (%)",
                angle: -90,
                position: "insideLeft",
                fill: "#6B7280",
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const { package: pkg, unnamed, total } = payload[0].payload;
                const ratio = Math.round((unnamed / total) * 100);
                return (
                  <div className="bg-white border border-gray-200 p-2 rounded shadow text-xs">
                    <strong>{pkg}</strong>
                    <div className="text-gray-600">
                      {unnamed} von {total} unbenannt ({ratio}%)
                    </div>
                  </div>
                );
              }}
            />
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <defs>
              <linearGradient id="unnamedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                <stop offset="100%" stopColor="#f9a8d4" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <Bar
              dataKey={(d) => Math.round((d.ratio ?? 0) * 100)}
              name="Unbenannt (%)"
              fill="url(#unnamedFill)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Grün = sauber, Gelb = mäßig, Rot = kritisch
      </p>
    </section>
  );
}
