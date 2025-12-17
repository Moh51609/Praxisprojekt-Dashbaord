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
import { useModel } from "@/context/ModelContext";

export default function KPIs() {
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pagePackage, setPagePackage] = useState(0);
  const { model: data, setModel } = useModel();
  const PAGE_SIZE = 20; // 🧩 20 Elemente pro Seite
  const accessColor = useAccentColor();
  const [portPage, setPortPage] = useState(0);
  const pageBackground = usePageBackground();
  const [section, setSection] = useState("structure");
  const { rules, error: rulesError } = useModelRules(data);
  const { language } = useLanguage();
  const hotspots = useMemo(
    () => (data ? analyzeRuleHotspots(data) : []),
    [data]
  );
  const filteredHotspots = useMemo(
    () =>
      hotspots.filter(
        (h) =>
          h.package && h.package !== "Unbekannt" && h.package !== "(Diagrams)"
      ),
    [hotspots]
  );

  const smells = useMemo(() => {
    if (!data) return [];
    return evaluateModelSmellsPure(data, data.relationships ?? []);
  }, [data]);
  const filteredSmells = useMemo(
    () =>
      smells.filter(
        (s) => s.packagePath && s.packagePath !== "-" && s.packagePath !== "—"
      ),
    [smells]
  );

  const relations = data?.relationships ?? [];

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

  const SmellCount = filteredSmells.length;

  const ruleBreakCount =
    rules?.reduce((sum, r) => sum + (r.violations ?? 0), 0) ?? 0;

  const totalRules = rules?.length;
  const passingRules = rules?.filter((r) => r.passed).length ?? 0;
  const acceptRulesPercentage =
    totalRules > 0 ? Math.round((passingRules / totalRules) * 100) : 0;

  const avgDepth = data?.elements?.length
    ? data.elements.reduce((sum, e) => sum + (e.depth ?? 0), 0) /
      data.elements.length
    : 0;

  const existingElementTypes = new Set(data.elements.map((e) => e.type));

  const evaluationResults = Object.values(EXPECTED_MODEL_ELEMENTS).map((fn) =>
    fn()
  );
  const existingCount = evaluationResults.filter((count) => count > 0).length;
  const possibleCount = evaluationResults.length;
  const coveragePercent = Math.round((existingCount / possibleCount) * 100);

  const modelHealth =
    100 - SmellCount * 2 - (100 - acceptRulesPercentage) / 3 - avgDepth * 1.5;
  const ruleBreakDensity =
    data.elements.length > 0 ? ruleBreakCount / data.elements.length : 0;

  const healthPercent = Math.max(
    0,
    Math.min(
      100,
      100 -
        SmellCount * 0.4 -
        ruleBreakDensity * 40 -
        (100 - acceptRulesPercentage) * 0.1 -
        avgDepth * 2
    )
  );

  const ruleHotspotsByElement = (() => {
    const map: Record<string, number> = {};

    rules.forEach((r) => {
      // WICHTIG: Regel MUSS Elementbezug haben
      if (!r.elementId || !r.elementName) return;

      map[r.elementName] = (map[r.elementName] ?? 0) + 1;
    });

    return Object.entries(map)
      .map(([name, violations]) => ({
        package: name, // ⬅️ Chart erwartet "package"
        violations,
      }))
      .sort((a, b) => b.violations - a.violations);
  })();

  const totalPortPages = Math.ceil((data.classStats?.length ?? 0) / 10);
  return (
    <main
      className="p-10 space-y-2 bg-gray-300 dark:bg-gray-900 min-w-[600px]"
      style={pageBackground}
    >
      <header className="flex items-center justify-between z-[9999]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ChartArea className="h-6 w-6 " style={{ color: accessColor }} />
          KPIs
        </h1>
        <KpiExportDropdown data={data} relations={relations} smells={smells} />
      </header>
      <div className="grid grid-cols-1  [@media(min-width:1800px)]:grid-cols-6 [@media(min-width:1200px)]:grid-cols-3  [@media(min-width:1000px)]:grid-cols-2 gap-4 justify-between py-4">
        <KpiCard
          title="Model Health"
          value={`${healthPercent.toFixed(0)}%`}
          subtitel="von 100%"
          icon={<HeartPlus style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Accept Rules"
          subtitel="von 100%"
          value={`${acceptRulesPercentage.toFixed(0)}%`}
          icon={<Scale style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Model Smells"
          subtitel="Je weniger desto besser"
          value={`${SmellCount}`}
          icon={<SprayCan style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Avg. Depth"
          subtitel="Je weniger desto besser"
          value={`${avgDepth.toFixed(1)}`}
          icon={<TreeDeciduous style={{ color: accessColor }} />}
        />
        <KpiCard
          title="Rule Breaks"
          subtitel="Je weniger desto besser"
          value={ruleBreakCount}
          icon={<Cctv style={{ color: accessColor }} />}
        />

        <KpiCard
          title="Coverage"
          subtitel="von 100%"
          value={`${coveragePercent.toFixed(0)}%`}
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
                  <TooltipContent className="max-w-xs text-xs dark:bg-gray-700 bg-gray-300 rounded-xl">
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
            <div className="grid grid-cols-1  [@media(min-width:1500px)]:grid-cols-2 h-full gap-4 py-4">
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

              <RelationsHeatmap
                relations={relations}
                elements={data.elements}
              />

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
              <div className="grid grid-cols-1 [@media(min-width:1650px)]:grid-cols-3 [@media(min-width:1250px)]:grid-cols-2 h-full  gap-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <RuleComplianceChart rules={rules} />
                  <RuleViolationsByCategoryChart rules={rules} />
                </div>
                <RuleDependencyChordChart rules={rules} />
                <div className="grid grid-cols-1  gap-4">
                  <TopViolatingRulesChart rules={rules} />
                  <RuleTrendChart />
                </div>
              </div>
              <div className="grid grid-cols-1 [@media(min-width:1650px)]:grid-cols-2 gap-4 h-full">
                <RuleHotspotChart hotspots={filteredHotspots} />
                <RuleViolationTable rules={rules} />
              </div>
            </div>
          )}

          {section === "coverage" && (
            <div className="grid  grid-cols-1 [@media(min-width:1800px)]:grid-cols-3 [@media(min-width:1250px)]:grid-cols-2 gap-4 py-4">
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
              <div className="grid  grid-cols-1 [@media(min-width:1650px)]:grid-cols-[33%_66%] [@media(min-width:1250px)]:grid-cols-1 gap-4 py-4">
                <div className="grid [@media(min-width:1650px)]:grid-cols-1 grid-cols-2 gap-4">
                  <SmellCategoryDonutChart smells={filteredSmells} />
                  <SmellSeverityBarChart smells={filteredSmells} />
                </div>
                <SmellViolationTable smells={filteredSmells} />
              </div>
              <div className="grid [@media(min-width:1650px)]:grid-cols-2 grid-cols-1 gap-4">
                <SmellSeverityTrendChart data={filteredSmells} />
                <SmellDistributionHeatmap smells={filteredSmells} />
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
  subtitel,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitel: string;
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

      <div className="text-xs text-gray-500 font-medium">{subtitel}</div>
    </div>
  );
}
