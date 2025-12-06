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
  const [page, setPage] = useState(0);
  const [pagePackage, setPagePackage] = useState(0);

  const PAGE_SIZE = 20; // 🧩 20 Elemente pro Seite
  const accessColor = useAccentColor();
  const [portPage, setPortPage] = useState(0);
  const pageBackground = usePageBackground();
  const [relations, setRelations] = useState<any[]>([]);
  const [section, setSection] = useState("structure");
  const { rules, error: rulesError } = useModelRules(data);
  const { language } = useLanguage();
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
    return null;
  }

  const EXPECTED_MODEL_ELEMENTS = {
    blocks: () => data.classStats.length,
    associations: () => data.metrics.associations,
    generalizations: () => data.metrics.generalizations,
    ports: () => data.metrics.ports,
    useCases: () => data.metrics.useCases,
    diagrams: () => data.diagramList.length,
    dependencies: () => data.metrics.dependencies,
    connectors: () => data.metrics.connectors,
    parameters: () => data.metrics.parameters,
    activities: () => data.metrics.activities,
    packages: () => data.metrics.packages,
    profiles: () => data.metrics.profiles,
    stereotypes: () => data.metrics.stereotypes,
    abstractions: () => data.metrics.abstraction,
  };

  const SmellCount = smells.length;

  const totalRules = rules?.length;
  const passingRules = rules?.filter((r) => r.passed).length ?? 0;
  const acceptRulesPercentage =
    totalRules > 0 ? Math.round((passingRules / totalRules) * 100) : 0;

  const avgDepth = data?.elements?.length
    ? data.elements.reduce((sum, e) => sum + (e.depth ?? 0), 0) /
      data.elements.length
    : 0;

  const elementIds = new Set(data.elements.map((e) => e.id));

  const connectedIds = new Set();
  relations.forEach((r) => {
    if (elementIds.has(r.source)) connectedIds.add(r.source);
    if (elementIds.has(r.target)) connectedIds.add(r.target);
  });

  const connectivityPercent = Math.round(
    (connectedIds.size / elementIds.size) * 100
  );

  const existingElementTypes = new Set(data.elements.map((e) => e.type));

  const evaluationResults = Object.values(EXPECTED_MODEL_ELEMENTS).map((fn) =>
    fn()
  );
  const existingCount = evaluationResults.filter((count) => count > 0).length;
  const possibleCount = evaluationResults.length;
  const coveragePercent = Math.round((existingCount / possibleCount) * 100);

  const modelHealth =
    100 -
    SmellCount * 2 - // jedes Smell zieht 2% ab
    (100 - acceptRulesPercentage) / 3 - // schlechte Regeln wirken negativ
    avgDepth * 1.5; // tiefe Hierarchien senken Health

  const healthPercent = Math.max(
    0,
    Math.min(
      100,
      100 -
        SmellCount * 0.5 - // deutlich geringere Gewichtung
        (100 - acceptRulesPercentage) * 0.2 -
        avgDepth * 2 // moderate Bestrafung
    )
  );

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
          value={`${healthPercent.toFixed(2)}%`}
          icon={<HeartPlus style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Accept Rules"
          value={`${acceptRulesPercentage.toFixed(2)}%`}
          icon={<Scale style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Model Smells"
          value={`${SmellCount}`}
          icon={<SprayCan style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Avg. Depth"
          value={`${avgDepth.toFixed(1)}`}
          icon={<TreeDeciduous style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Connectivity"
          value={`${connectivityPercent.toFixed(2)}%`}
          icon={<Cable style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Coverage"
          value={`${coveragePercent.toFixed(2)}%`}
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
                {translations[language].structureQualitiy}
              </h2>
            )}
            {section === "rules" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />{" "}
                {translations[language].rules}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs bg-gray-700">
                    Regeln: <br />
                    <br /> R1 - {translations[language].r1}
                    <br /> R2 - {translations[language].r2}
                    <br /> R3 - {translations[language].r3}
                    <br /> R4 - {translations[language].r4}
                    <br /> R5 - {translations[language].r5}
                    <br /> R6 - {translations[language].r6}
                    <br /> R7 - {translations[language].r7}
                  </TooltipContent>
                </Tooltip>
              </h2>
            )}
            {section === "coverage" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PaintRoller className="h-5 w-5 text-accent" />{" "}
                {translations[language].coverage}
              </h2>
            )}
            {section === "smells" && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageCircleWarning className="h-5 w-5 text-accent" />{" "}
                {translations[language].possibleProblems}{" "}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs bg-gray-700">
                    Smells: <br />
                    <br /> S1 - {translations[language].s1}
                    <br /> S2 - {translations[language].s2}
                    <br /> S3 -{translations[language].s3}
                    <br /> S4 - {translations[language].s4}
                    <br /> S5 - {translations[language].s5}
                    <br /> S6 - {translations[language].s6}
                    <br /> S7 - {translations[language].s7}
                    <br /> S8 -{translations[language].s8}
                    <br /> S9 - {translations[language].s9}
                    <br /> S10 - {translations[language].s10}
                    <br /> S11 - {translations[language].s11}
                    <br /> S12 - {translations[language].s12}
                    <br /> S13 - {translations[language].s13}
                    <br /> S14 - {translations[language].s14}
                    <br /> S15 - {translations[language].s15}
                  </TooltipContent>
                </Tooltip>
              </h2>
            )}

            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sektion auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structure">
                  🧩 {translations[language].structureQualitiy}
                </SelectItem>
                <SelectItem value="rules">
                  ⚙️ {translations[language].ruleAnalysis}
                </SelectItem>
                <SelectItem value="coverage">
                  🎯 {translations[language].coverageAnalysis}
                </SelectItem>
                <SelectItem value="smells">
                  💨 {translations[language].modelSmells}
                </SelectItem>
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

              <PackageDistributionChart
                data={data}
                page={pagePackage}
                totalPages={2}
                onPageChange={setPagePackage}
              />
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
              <div className=" grid grid-cols-2 gap-4 h-full">
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
