import { ParsedModel } from "@/types/model";

/**
 * Analysiert Regelverstöße nach Package und aggregiert alle (R1–R7)
 */
export function analyzeRuleHotspots(data: ParsedModel, relations: any[] = []) {
  if (!data?.elements) return [];

  const packageViolations: Record<string, number> = {};

  // Hilfsfunktion: Bestimme Package-Name
  const getPackageName = (el: any): string => {
    if (!el) return "Unbekannt";
    return (
      el.packageName || el.package || el._parent || el._package || "Unbekannt"
    );
  };

  /** ============================
   * R1 – Blöcke ohne Ports
   * ============================ */
  const blocksWithoutPorts =
    data.classStats?.filter((c) => (c.ports ?? 0) === 0) ?? [];
  blocksWithoutPorts.forEach((b) => {
    const pkg = getPackageName(b);
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  /** ============================
   * R2 – Leere Packages
   * ============================ */
  const emptyPackages =
    data.packages?.filter(
      (p) => !data.elements.some((el) => el.package === p.name)
    ) ?? [];

  /** ============================
   * R3 – Unbenannte Elemente
   * ============================ */
  const unnamed = data.elements.filter((e) => !e.name?.trim());
  unnamed.forEach((e) => {
    const pkg = getPackageName(e);
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  /** ============================
   * R4 – Ungültige Namenskonvention
   * ============================ */
  const invalidNames = data.elements.filter(
    (e) => e.name && !/^[A-Z][a-zA-Z0-9]*$/.test(e.name)
  );
  invalidNames.forEach((e) => {
    const pkg = getPackageName(e);
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  /** ============================
   * R5 – Isolierte Elemente
   * ============================ */
  const relatedIds = new Set(relations.flatMap((r) => [r.source, r.target]));
  const isolated = data.elements.filter((e) => !relatedIds.has(e.id));
  isolated.forEach((e) => {
    const pkg = getPackageName(e);
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  /** ============================
   * R6 – Ungültige Connector-Enden
   * ============================ */
  const invalidConnectors = relations.filter((r) => !r.source || !r.target);
  invalidConnectors.forEach((r) => {
    // Versuch, das Package aus Source oder Target zu holen
    const sourceEl = data.elements.find((e) => e.id === r.source);
    const targetEl = data.elements.find((e) => e.id === r.target);
    const pkg =
      getPackageName(sourceEl) || getPackageName(targetEl) || "Unbekannt";
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  /** ============================
   * R7 – Requirements ohne Satisfy
   * ============================ */
  const unsatisfiedReqs = data.elements.filter(
    (e) =>
      e.type?.includes("Requirement") &&
      !relations.some(
        (r) =>
          r.type?.includes("Satisfy") &&
          (r.source === e.id || r.target === e.id)
      )
  );
  unsatisfiedReqs.forEach((e) => {
    const pkg = getPackageName(e);
    packageViolations[pkg] = (packageViolations[pkg] ?? 0) + 1;
  });

  // 🔹 In sortierbares Array umwandeln
  return Object.entries(packageViolations)
    .map(([pkg, count]) => ({
      package: pkg,
      violations: count,
    }))
    .sort((a, b) => b.violations - a.violations);
}
