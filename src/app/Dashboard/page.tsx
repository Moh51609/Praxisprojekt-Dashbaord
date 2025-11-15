"use client";

import {
  BetweenHorizonalEnd,
  Cable,
  ChartNetwork,
  ChartPie,
  Cuboid,
  Dna,
  LayoutDashboard,
  LifeBuoy,
  LucideIcon,
  Package,
  ShieldQuestionMark,
  Tangent,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ParsedModel } from "@/types/model";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Home,
  BarChart3,
  Boxes,
  GitBranch,
  Settings,
  User2,
  ArrowUp,
} from "lucide-react";
import { Icon } from "next/dist/lib/metadata/types/metadata-types";
import KpiCard from "@/components/DashboardComponents/KpiCard";
import DonutCard from "@/components/DashboardComponents/DonutCard";
import ElementTable from "@/components/ElementComponents/ElementTable";
import SortedPortDiagram from "@/components/DashboardComponents/SortedPortDiagram";
import { useAccentColor } from "@/hooks/useAccentColor";
import { usePageBackground } from "@/hooks/usePageBackground";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import ElementCoverageMiniChart from "@/components/KpiComponents/Coverageanalyse/ElementCoverageMiniChart";
import SmellSeverityBarChart from "@/components/KpiComponents/ModelSmells/SmellSeverityBarChart";
import RuleComplianceChart from "@/components/KpiComponents/Ruleanalyse/RuleComplianceChart";
import { useModelRules } from "@/hooks/useModelRules";
import OverallKpiTrendChart from "@/components/DashboardComponents/OverallKpiTrendChart";

type CountByType = { name: string; value: number };

export default function DashboardPage() {
  const [data, setData] = useState<ParsedModel | null>(null);
  const [byType, setByType] = useState<CountByType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pageBackground = usePageBackground();
  const accessColor = useAccentColor();
  const { language } = useLanguage();
  const [relations, setRelations] = useState<any[]>([]);
  const [smells, setSmells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { rules, error: rulesError } = useModelRules(data);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const relationsData = data
    ? [
        {
          name: "Struktur",
          value: data.metrics.associations + data.metrics.connectors,
        },
        { name: "Vererbung", value: data.metrics.generalizations },
        { name: "Abhängigkeiten", value: data.metrics.dependencies },
        { name: "Traceability", value: data.metrics.abstraction ?? 0 },
      ]
    : [];

  console.log("📊 classStats:", data?.classStats?.slice(0, 5));

  const topPorts =
    data?.classStats
      ?.sort((a, b) => (b.ports ?? 0) - (a.ports ?? 0))
      .slice(0, 10)
      .map((c) => ({ name: c.className ?? "—", value: c.ports ?? 0 })) ?? [];

  useEffect(() => {
    fetch("/api/xmi")
      .then((r) => r.json())
      .then((j: ParsedModel | { error: string }) => {
        if ("error" in j) {
          setError(j.error);
          return;
        }
        setData(j);

        // 1) Counter-Record aufbauen (explizit typisieren!)
        const countsByType: Record<string, number> = j.elements.reduce(
          (acc: Record<string, number>, e) => {
            acc[e.type] = (acc[e.type] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // 2) In Array<{name, value}> umwandeln (Tupeltyp angeben!)
        const byTypeArr: CountByType[] = Object.entries(countsByType).map(
          ([name, value]: [string, number]) => ({ name, value })
        );

        setByType(byTypeArr);
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    async function loadSmells() {
      try {
        const res = await fetch("/api/model-smells");
        const json = await res.json();
        setSmells(json.smells || []);
      } catch (err) {
        console.error("Fehler beim Laden der Smells:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSmells();
  }, []);

  useEffect(() => {
    fetch("/api/xmi-relations")
      .then((r) => r.json())
      .then((j) => {
        if ("error" in j) setError(j.error);
        else {
          setRelations(j.relations);

          // 🧩 Debug: zeige welche Typen wirklich vorkommen
          const typeCount = j.relations.reduce(
            (acc: Record<string, number>, r: any) => {
              acc[r.type] = (acc[r.type] ?? 0) + 1;
              return acc;
            },
            {}
          );
          console.log("🔍 Beziehungstypen in API:", typeCount);
        }
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (!mounted) return null;
  return (
    <main
      className="p-6 space-y-2 bg-gray-300 dark:bg-gray-900 dark:text-gray-50 transition-colors duration-300"
      style={pageBackground}
    >
      <header className="flex items-center justify-between pl-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" style={{ color: accessColor }} />
          {translations[language].overview}
        </h1>
      </header>

      {error && (
        <div className="rounded-xl border text-red-600">
          Fehler beim Laden: {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-[2fr_1fr] gap-4 px-4 pt-4 items-stretch">
            {/* 🔹 Linke Seite: KPI-Karten */}
            <section className="grid grid-cols-3 gap-4">
              <KpiCard
                data={data}
                title={translations[language].blocks}
                value={data.metrics.classes}
                icon={Cuboid}
              />
              <KpiCard
                data={data}
                title={translations[language].association}
                value={data.metrics.associations ?? "0"}
                icon={Cable}
              />
              <KpiCard
                data={data}
                title={translations[language].generalization}
                value={data.metrics.generalizations ?? "0"}
                icon={Dna}
              />
              <KpiCard
                data={data}
                title={translations[language].ports}
                value={data.metrics.ports ?? "0"}
                icon={BetweenHorizonalEnd}
              />
              <KpiCard
                data={data}
                title={translations[language].useCases}
                value={data.metrics.useCases ?? "0"}
                icon={ChartNetwork}
              />
              <KpiCard
                data={data}
                title={translations[language].diagrams}
                value={data.metrics.diagramsTotal ?? "0"}
                icon={ChartPie}
              />
            </section>

            {/* 🔸 Rechte Seite: Donut-Charts */}
            <section className="flex flex-row gap-4 items-stretch h-full w-full justify-center">
              <div className="flex-1">
                <DonutCard
                  title={translations[language].diagramTypes}
                  data={Object.entries(data.diagramsByType).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  icon={LifeBuoy}
                />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-4 pt-4 px-4 ">
            <section className="flex flex-row gap-4 items-stretch h-full w-full justify-center">
              <div className="flex-1">
                <DonutCard
                  title={translations[language].relationshipTypes}
                  data={relationsData}
                  icon={LifeBuoy}
                />
              </div>
            </section>
            {/* Chart: Elemente nach Typ */}
            <SortedPortDiagram data={data} />
            <section className="grid grid-cols-1 gap-4  h-full justify-between  ">
              <ElementCoverageMiniChart />
            </section>
          </div>
          <div className="grid grid-cols-3 gap-4 p-4">
            <SmellSeverityBarChart smells={smells} />
            <RuleComplianceChart rules={rules} />
            <OverallKpiTrendChart />
          </div>
        </>
      )}
    </main>
  );
}
