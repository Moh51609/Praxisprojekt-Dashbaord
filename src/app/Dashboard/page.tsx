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
import UploadXmi from "@/components/UploadXmi";
import { useModel } from "@/context/ModelContext";

type CountByType = { name: string; value: number };

export default function DashboardPage() {
  const { model, setModel } = useModel();
  const data = model;
  const elements = data?.elements ?? [];
  const relations = data?.relationships ?? [];
  const typeCounts = elements.reduce((acc, el) => {
    const clean = el.type.replace(/^uml:|^sysml:/, "");
    acc[clean] = (acc[clean] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const diagramTypes = data?.diagramsByType ?? {};
  const stats = {
    total: elements.length,
    distinctTypes: Object.keys(typeCounts).length,
  };

  const [byType, setByType] = useState<CountByType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pageBackground = usePageBackground();
  const accessColor = useAccentColor();
  const { language } = useLanguage();
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
        {
          name: "Vererbung",
          value: data.metrics.generalizations,
        },
        {
          name: "Abhängigkeiten",
          value: data.metrics.dependencies,
        },
        {
          name: "Traceability",
          value: data.metrics.abstraction ?? 0,
        },
      ].filter((r) => r.value > 0)
    : [];

  const totalRelations = relations.length;
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

  if (!mounted) return null;
  return (
    <main
      className="p-10 space-y-2 bg-gray-300 dark:bg-gray-900 dark:text-gray-50 transition-colors duration-300 min-w-[600px]"
      style={pageBackground}
    >
      <header className="w-full flex flex-row justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" style={{ color: accessColor }} />
          {translations[language].overview}
        </h1>
        <UploadXmi onLoaded={(model) => setModel(model)} />
      </header>

      {!data && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">
            Bitte lade eine XML hoch
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nach dem Upload werden hier die Modell-KPIs und Analysen angezeigt.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border text-red-600">
          Fehler beim Laden: {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1  [@media(min-width:1600px)]:grid-cols-[2fr_1fr]  gap-4 items-stretch py-4 justify-center  ">
            <section className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4 w-full ">
              <KpiCard
                total={elements.length}
                title={translations[language].blocks}
                value={data.metrics.classes}
                icon={Cuboid}
              />
              <KpiCard
                total={elements.length}
                title={translations[language].association}
                value={data.metrics.associations ?? "0"}
                icon={Cable}
              />
              <KpiCard
                total={elements.length}
                title={translations[language].generalization}
                value={data.metrics.generalizations ?? "0"}
                icon={Dna}
              />
              <KpiCard
                total={elements.length}
                title={translations[language].ports}
                value={data.metrics.ports ?? "0"}
                icon={BetweenHorizonalEnd}
              />
              <KpiCard
                total={elements.length}
                title={translations[language].useCases}
                value={data.metrics.useCases ?? "0"}
                icon={ChartNetwork}
              />
              <KpiCard
                total={elements.length}
                title={translations[language].diagrams}
                value={data.metrics.diagramsTotal ?? "0"}
                icon={ChartPie}
              />
            </section>

            <section className="  gap-4 items-stretch h-full w-full">
              <div className="w-full">
                <DonutCard
                  title={translations[language].diagramTypes}
                  data={Object.entries(data.diagramsByType).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  name={translations[language].diagrams}
                  total={Object.values(data.diagramsByType).reduce(
                    (a, b) => a + b,
                    0
                  )}
                  icon={LifeBuoy}
                />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 auto-cols-fr w-full  [@media(min-width:1250px)]:grid-cols-2   [@media(min-width:1700px)]:grid-cols-[1fr_1.5fr_1fr]">
            <section className="gap-4 items-stretch h-full w-full ">
              <div className="w-full">
                <DonutCard
                  name={translations[language].relations}
                  title={translations[language].relationshipTypes}
                  data={relationsData}
                  icon={LifeBuoy}
                  total={totalRelations}
                />
              </div>
            </section>
            <div className="w-full">
              <SortedPortDiagram data={data} />
            </div>
            <section className="grid grid-cols-1 gap-4  h-full justify-between  ">
              <ElementCoverageMiniChart />
            </section>
            <SmellSeverityBarChart smells={smells} />
            <RuleComplianceChart rules={rules} />
            <OverallKpiTrendChart />
          </div>
        </>
      )}
    </main>
  );
}
