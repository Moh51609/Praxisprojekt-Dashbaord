"use client";

import { useEffect, useMemo, useState } from "react";
import { ParsedModel } from "@/types/model";
import { motion, AnimatePresence } from "framer-motion";

import ChartDepth from "@/components/KpiComponents/StructureQuality/ChartDepth";
import {
  ChevronLeft,
  ChevronRight,
  ChartBar,
  ChartArea,
  ArrowUp,
  Cuboid,
  Icon,
  Construction,
  Settings,
  PaintRoller,
  MessageCircleWarning,
  HeartPlus,
  Scale,
  SprayCan,
  Cctv,
  TreeDeciduous,
  Cable,
  Blend,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Bar,
  BarChart,
  Legend,
  PieChart,
  Pie,
  Area,
  ReferenceArea,
} from "recharts";
import PortComplexityChart from "@/components/KpiComponents/StructureQuality/PortKomplexityChart";
import DiagramCoverageChart from "@/components/KpiComponents/DiagramCoverageChart";
import UnnamedPerPackageChart from "@/components/KpiComponents/unUsedCharts/UnnamedPerPackageChart";
import PortDirectionKpi from "@/components/KpiComponents/PortDirectionsKpi";
import RedundantElementsCard from "@/components/KpiComponents/unUsedCharts/RedundantElementCard";
import GeneralIssuesCard from "@/components/KpiComponents/GeneralIssueCard";
import { useAccentColor } from "@/hooks/useAccentColor";
import { usePageBackground } from "@/hooks/usePageBackground";
import { translations } from "@/lib/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import RelationsHeatmap from "@/components/KpiComponents/StructureQuality/RelationsHeatmap";
import DepthDistributionChart from "@/components/KpiComponents/StructureQuality/DepthDistributionChart";
import PackageDistributionChart from "@/components/KpiComponents/StructureQuality/PackageDistributionChart";
import IsolatedElementsChart from "@/components/KpiComponents/StructureQuality/IsolatedElementChart";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RuleConformanceChart from "@/components/KpiComponents/RuleConformanceChart";
import RuleComplianceChart from "@/components/KpiComponents/Ruleanalyse/RuleComplianceChart";
import { useModelRules } from "@/hooks/useModelRules";
import RuleViolationsByCategoryChart from "@/components/KpiComponents/Ruleanalyse/RuleViolationsByCategoryChart";
import RuleDependencyChordChart from "@/components/KpiComponents/Ruleanalyse/RuleDependencyChordChart";
import TopViolatingRulesChart from "@/components/KpiComponents/Ruleanalyse/TopViolatingRulesChart";
import RuleViolationHeatmap from "@/components/KpiComponents/unUsedCharts/RuleViolationHeatmap";
import RuleViolationTable from "@/components/KpiComponents/Ruleanalyse/RuleViolationTable";
import RuleTrendChart from "@/components/KpiComponents/Ruleanalyse/RuleTrendChart";
import RuleHotspotChart from "@/components/KpiComponents/Ruleanalyse/RuleHotspotChart";
import { analyzeRuleHotspots } from "@/lib/analyzeRuleHotspots";
import RequirementCoverageChart from "@/components/KpiComponents/Coverageanalyse/RequirementCoverageChart";
import RequirementTraceabilityMatrix from "@/components/KpiComponents/Coverageanalyse/RequirementTraceabilityMatrix";
import ElementCoverageChart from "@/components/KpiComponents/Coverageanalyse/ElementCoverageChart";
import ElementTypeDistributionChart from "@/components/KpiComponents/Coverageanalyse/ElementTypeDistributionChart";
import ElementCoverageMiniChart from "@/components/KpiComponents/Coverageanalyse/ElementCoverageMiniChart";
import CoverageTrendChart from "@/components/KpiComponents/Coverageanalyse/CoverageTrendChart";
import { evaluateModelSmellsPure } from "@/lib/modelSmells";
import { parseXmiFromFile } from "@/lib/xmi";
import SmellCategoryDonutChart from "@/components/KpiComponents/ModelSmells/SmellCategoryDonutChart";
import DiagramTypeCoverageTable from "@/components/KpiComponents/Coverageanalyse/DiagramTypeCoverageTable";
import SmellSeverityBarChart from "@/components/KpiComponents/ModelSmells/SmellSeverityBarChart";
import SmellHotspotHeatmap from "@/components/KpiComponents/ModelSmells/SmellViolationTable";
import SmellViolationTable from "@/components/KpiComponents/ModelSmells/SmellViolationTable";
import SmellSeverityTrendChart from "@/components/KpiComponents/ModelSmells/SmellSeverityTrendChart";
import SmellDistributionHeatmap from "@/components/KpiComponents/ModelSmells/SmellDistributionHeatmap";
import KpiExportDropdown from "@/components/KpiComponents/KpiExportDropdown";

export default function KPIs() {
  const [data, setData] = useState<ParsedModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 🆕 aktuelle Seite (0, 1, 2 …)
  const PAGE_SIZE = 20; // 🧩 20 Elemente pro Seite
  const accessColor = useAccentColor();
  const [portPage, setPortPage] = useState(0);
  const pageBackground = usePageBackground();
  const [relations, setRelations] = useState<any[]>([]);
  const [section, setSection] = useState("structure");
  const { rules, error: rulesError } = useModelRules(data);
  const hotspots = useMemo(
    () => (data ? analyzeRuleHotspots(data) : []),
    [data]
  );
  const [smells, setSmells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetch("/api/xmi")
      .then((r) => r.json())
      .then((j: ParsedModel | { error: string }) => {
        if ("error" in j) setError(j.error);
        else setData(j);
      })
      .catch((e) => setError(String(e)));
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

  if (!data) {
    return (
      <main className="p-6 bg-gray-300">
        <p className="text-gray-600">Keine Daten geladen...</p>
        {error && <p className="text-red-500">{error}</p>}
      </main>
    );
  }

  const totalPortPages = Math.ceil((data.classStats?.length ?? 0) / 10);
  return (
    <main
      className="p-10 space-y-2 bg-gray-300 dark:bg-gray-900"
      style={pageBackground}
    >
      <header className="flex items-center justify-between z-[9999]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ChartArea className="h-6 w-6 " style={{ color: accessColor }} />
          KPIs
        </h1>
        <KpiExportDropdown data={data} relations={relations} smells={smells} />
      </header>
      <div className="grid grid-cols-6 gap-4 justify-between py-4">
        <KpiCard
          title="Model Health"
          value="83%"
          icon={<HeartPlus style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Accept Rules"
          value="85%"
          icon={<Scale style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Model Smells"
          value="7"
          icon={<SprayCan style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Avg. Depth"
          value="2.8"
          icon={<TreeDeciduous style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Connectivity"
          value="92%"
          icon={<Cable style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Coverage"
          value="8/10"
          icon={<Blend style={{ color: accessColor }} />}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-row justify-between">
            {section === "structure" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Construction className="h-5 w-5 text-accent" />{" "}
                Strukturqualität
              </h2>
            )}
            {section === "rules" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" /> Regeln
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs bg-gray-700">
                    Regeln: <br />
                    <br /> R1 - Blöcke ohne Ports
                    <br /> R2 - Leere Packages
                    <br /> R3 - Unbenannte Elemente
                    <br /> R4 - Ungültige Namenskonvention
                    <br /> R5 - Isolierte Elemente
                    <br /> R6 - Ungültige Connector-Enden
                    <br /> R7 - Requirement ohne Satisfy
                  </TooltipContent>
                </Tooltip>
              </h2>
            )}
            {section === "coverage" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PaintRoller className="h-5 w-5 text-accent" /> Abdeckung
              </h2>
            )}
            {section === "smells" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircleWarning className="h-5 w-5 text-accent" />{" "}
                Mögliche Probleme
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs bg-gray-700">
                    Smells: <br />
                    <br /> S1 - Deep Nesting
                    <br /> S2 - Large Package
                    <br /> S3 - Massive Block
                    <br /> S4 - Duplicate Names
                    <br /> S5 - Similar Names
                    <br /> S6 - Unreferenced Requirement
                    <br /> S7 - Dead Connector
                    <br /> S8 - Empty Diagram
                    <br /> S9 - Overloaded Diagram
                    <br /> S10 - Long Element Names
                    <br /> S11 - Model Depth Imbalance
                    <br /> S12 - Redundant Relation
                    <br /> S13 - Unused Port
                    <br /> S14 - Requirement without Verification
                    <br /> S15 - Element Without Stereotype
                  </TooltipContent>
                </Tooltip>
              </h2>
            )}

            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sektion auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">🧩 Strukturqualität</SelectItem>
                <SelectItem value="rules">⚙️ Regelanalyse</SelectItem>
                <SelectItem value="coverage">🎯 Abdeckungsanalyse</SelectItem>
                <SelectItem value="smells">💨 Model Smells</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {section === "structure" && (
            <div className="grid grid-cols-2 h-full lg:grid-cols-2 gap-4 py-4">
              <ChartDepth
                data={data}
                page={page}
                totalPages={2}
                onPageChange={setPage}
              />

              <PortComplexityChart
                data={data}
                page={portPage}
                onPageChange={setPortPage}
              />

              <RelationsHeatmap relations={relations} />

              <IsolatedElementsChart
                elements={data.elements}
                relations={relations}
              />

              <DepthDistributionChart data={data} />

              <PackageDistributionChart data={data} />
            </div>
          )}

          {section === "rules" && (
            <div className="flex flex-col ">
              <div className="grid grid-cols-3 h-full lg:grid-cols-3 gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <RuleComplianceChart rules={rules} />
                  <RuleViolationsByCategoryChart rules={rules} />
                </div>
                <RuleDependencyChordChart rules={rules} />
                <div className="grid grid-cols-1 gap-4">
                  <TopViolatingRulesChart rules={rules} />
                  <RuleTrendChart />
                </div>
              </div>
              <div className=" grid grid-cols-2 gap-4 px-4 pb-4 h-full">
                <RuleHotspotChart hotspots={hotspots} />
                <RuleViolationTable
                  data={data}
                  rules={rules}
                  relations={relations}
                />
              </div>
            </div>
          )}

          {section === "coverage" && (
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="grid gird-cols-1 gap-4">
                {" "}
                <ElementTypeDistributionChart />
                <ElementCoverageMiniChart />
              </div>
              <DiagramTypeCoverageTable data={data} />
              <div className="grid grid-cols-1 gap-4">
                <ElementCoverageChart data={data} relations={relations} />
                <CoverageTrendChart />
              </div>
            </div>
          )}

          {section === "smells" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[33%_66%] gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <SmellCategoryDonutChart smells={smells} />
                  <SmellSeverityBarChart smells={smells} />
                </div>
                <SmellViolationTable smells={smells} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SmellSeverityTrendChart data={smells} />
                <SmellDistributionHeatmap smells={smells} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  const accentColor = useAccentColor();

  return (
    <div className="rounded-xl dark:bg-gray-800 bg-white p-6 shadow-md  hover:shadow-xl transition space-y-3">
      <div className="flex flex-row justify-between">
        <div className="text-md font-semibold text-gray-800 dark:text-white">
          {title}
        </div>
        <div style={{ color: accentColor }}> {icon}</div>
      </div>
      <div className="mt-1 text-3xl dark:text-white font-bold text-gray-900">
        {value}
      </div>
      <div className="flex gap-1 items-center ">
        <ArrowUp className="h-3 w-3 text-green-500" />
        <div className="font-bold text-xs text-green-500">5</div>
        <div className="text-xs text-gray-500 font-medium">
          seit letztem Commit
        </div>
      </div>
    </div>
  );
}
