// lib/modelSmells.ts
// 🔍 Analyse-Logik zur Erkennung von Model Smells in SysML-/UML-Modellen

import { ParsedModel } from "@/types/model";
import levenshtein from "fast-levenshtein";
export interface ModelSmell {
  id: string;
  category:
    | "Structure"
    | "Naming"
    | "Traceability"
    | "Relations"
    | "Redundancy"
    | "Consistency";
  name: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  element?: string;
  packagePath?: string;
}

/**
 * Evaluates all defined model smells for a given parsed model.
 * @param data ParsedModel - contains elements, relationships, metrics etc.
 * @param relations - relation list (from XMI)
 * @returns Array<ModelSmell>
 */
export function evaluateModelSmellsPure(
  data: ParsedModel,
  relations: any[]
): ModelSmell[] {
  const smells: ModelSmell[] = [];

  const elements = data.elements ?? [];
  const classStats = data.classStats ?? [];
  const packages = elements.filter((e) => e.type === "uml:Package");
  const relatedIds = new Set(
    relations.flatMap((r) => [r.source, r.target]).filter(Boolean)
  );

  // Filter nur echte Modell-Elemente
  const relevantElements = data.elements.filter((el) => {
    const t = el.type?.toLowerCase() ?? "";
    const n = el.name?.toLowerCase() ?? "";

    // ❌ ausschließen: leere oder technische Namen
    if (!el.name || n.includes("unbenannt") || n.includes("diagramm"))
      return false;

    // ❌ ausschließen: technische Diagramtypen oder Packages
    if (t.includes("diagram") && !t.includes("usecase") && !t.includes("block"))
      return false;
    if (t.includes("view") || t.includes("layout") || t.includes("profile"))
      return false;

    // ✅ nur echte SysML-Elemente
    return (
      t.includes("class") ||
      t.includes("block") ||
      t.includes("requirement") ||
      t.includes("usecase") ||
      t.includes("ibd") ||
      t.includes("bdd")
    );
  });

  // === S1 – Deep Nesting =====================================
  elements.forEach((e) => {
    if (e.depth && e.depth > 4) {
      smells.push({
        id: "S1",
        category: "Structure",
        name: "Deep Nesting",
        description: `Element "${e.name}" liegt auf Tiefe ${e.depth}.`,
        severity: e.depth > 6 ? "High" : "Medium",
        element: e.name,
        packagePath: e.package,
      });
    }
  });

  // === S2 – Large Package ====================================
  const packageCounts = elements.reduce((acc, e) => {
    const pkg = e.package || "Root";
    acc[pkg] = (acc[pkg] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(packageCounts).forEach(([pkg, count]) => {
    if (count > 15) {
      smells.push({
        id: "S2",
        category: "Structure",
        name: "Large Package",
        description: `Package "${pkg}" enthält ${count} Elemente.`,
        severity: count > 25 ? "High" : "Medium",
        element: pkg,

        packagePath: pkg,
      });
    }
  });

  // === S3 – Massive Block ====================================
  classStats.forEach((c) => {
    if ((c.ports ?? 0) > 10 || (c.attributes ?? 0) > 15) {
      smells.push({
        id: "S3",
        category: "Structure",
        name: "Massive Block",
        description: `Block "${c.className}" hat sehr viele Ports/Attribute.`,
        severity:
          (c.ports ?? 0) > 20 || (c.attributes ?? 0) > 25 ? "High" : "Medium",
        element: c.className,
        packagePath: c.className ?? "Root",
      });
    }
  });

  // === S4 – Duplicate Names ==================================
  const nameMap = new Map<string, string[]>();
  elements.forEach((e) => {
    const key = `${e.type}_${e.name}`;
    nameMap.set(key, [...(nameMap.get(key) ?? []), e.id]);
  });
  nameMap.forEach((ids, key) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        if (!el) return;

        smells.push({
          id: "S4",
          category: "Redundancy",
          name: "Duplicate Names",
          description: `Mehrere Elemente mit gleichem Namen "${el.name}".`,
          severity: "Medium",
          element: el.name,
          packagePath: el.package ?? "Root",
        });
      });
    }
  });

  // === S5 – Similar Names ====================================
  const nameCandidates = elements.filter((e) => {
    const t = e.type?.toLowerCase() ?? "";
    const n = e.name?.toLowerCase() ?? "";

    // ❌ Ausschluss von technischen/unnützen Typen
    if (!e.name || n.includes("diagramm") || n.includes("unbenannt"))
      return false;
    if (t.includes("diagram") || t.includes("view") || t.includes("profile"))
      return false;

    // ❌ Ausschluss generischer Namen
    if (["system", "model", "package", "block"].includes(n)) return false;

    // ✅ nur benannte Klassen, Blöcke, Anforderungen usw.
    return (
      t.includes("class") ||
      t.includes("block") ||
      t.includes("requirement") ||
      t.includes("usecase")
    );
  });

  for (let i = 0; i < nameCandidates.length; i++) {
    for (let j = i + 1; j < nameCandidates.length; j++) {
      const a = nameCandidates[i];
      const b = nameCandidates[j];
      const aName = a.name?.toLowerCase() ?? "";
      const bName = b.name?.toLowerCase() ?? "";

      if (a.type !== b.type) continue; // gleiche Typen vergleichen
      const dist = levenshtein.get(aName, bName);
      const maxLen = Math.max(aName.length, bName.length);
      const similarity = 1 - dist / maxLen;

      if (similarity > 0.88 && a.name !== b.name) {
        smells.push({
          id: "S5",
          category: "Redundancy",
          name: "Similar Names",
          element: a.name,
          description: `Ähnliche Namen erkannt: "${a.name}" und "${b.name}".`,
          severity: similarity > 0.94 ? "Medium" : "Low",
          packagePath: a.package,
        });
      }
    }
  }

  // === S6 – Unreferenced Requirement =========================
  const requirements = elements.filter((e) =>
    (e.type ?? "").toLowerCase().includes("requirement")
  );
  requirements.forEach((r) => {
    const hasRelation = relations.some(
      (rel) => rel.source === r.id || rel.target === r.id
    );
    if (!hasRelation) {
      smells.push({
        id: "S6",
        category: "Traceability",
        name: "Unreferenced Requirement",
        description: `Requirement "${r.name}" wird von keinem Element referenziert.`,
        severity: "High",
        element: r.name,
        packagePath: r.package,
      });
    }
  });

  // === S7 – Dead Connector ===================================
  const connectors = elements.filter((e) =>
    (e.type ?? "").toLowerCase().includes("connector")
  );
  connectors.forEach((c) => {
    if (!relatedIds.has(c.id)) {
      smells.push({
        id: "S7",
        category: "Relations",
        name: "Dead Connector",
        description: `Connector "${c.name}" ist unverbunden.`,
        severity: "Medium",
      });
    }
  });

  // === S8 – Empty Diagram ====================================
  // === S8 – Empty Diagram ====================================
  // erkennt nur echte Diagramme mit Namen, die keine modellierten Elemente enthalten

  const diagramList = (data.diagramList ?? []).filter((d) => {
    const name = d.name?.toLowerCase() ?? "";
    const type = d.mdType?.toLowerCase() ?? "";

    // ❌ ausschließen: unbenannte oder technische Diagramme
    if (!d.name || name.includes("unbenannt")) return false;
    if (
      type.includes("profile") ||
      type.includes("layout") ||
      type.includes("view")
    )
      return false;

    // ✅ nur echte Diagrammtypen
    return (
      type.includes("usecase") ||
      type.includes("block") ||
      type.includes("internalblock") ||
      type.includes("parametric") ||
      type.includes("requirement")
    );
  });

  diagramList.forEach((d) => {
    const hasLinkedElement = elements.some(
      (e) =>
        e.name &&
        e.name !== d.name &&
        (e.package?.includes(d.name ?? "") || d.name?.includes(e.name))
    );

    if (!hasLinkedElement) {
      smells.push({
        id: "S8",
        category: "Structure",
        name: "Empty Diagram",
        description: `Diagramm "${d.name}" enthält keine modellierten Elemente.`,
        severity: "Medium",
        element: d.name ?? "(Connector)",
        packagePath: "Root",
      });
    }
  });

  // === S9 – Overloaded Diagram ===============================
  const diagramTypeCounts = data.diagramsByType ?? {};
  Object.entries(diagramTypeCounts).forEach(([type, count]) => {
    if (count > 30) {
      smells.push({
        id: "S9",
        category: "Structure",
        name: "Overloaded Diagram",
        description: `Diagrammtyp "${type}" hat ${count} Einträge.`,
        severity: "High",
      });
    }
  });

  // === S10 – Long Element Names ==============================
  elements.forEach((e) => {
    if (e.name && e.name.length > 40) {
      smells.push({
        id: "S10",
        category: "Naming",
        name: "Long Element Name",
        description: `Name "${e.name}" ist ungewöhnlich lang (${e.name.length} Zeichen).`,
        severity: "Low",
        element: e.name,
      });
    }
  });

  // === S11 – Model Depth Imbalance ===========================
  const depths = elements.map((e) => e.depth ?? 0);
  const avgDepth = depths.reduce((sum, d) => sum + d, 0) / (depths.length || 1);
  const deepElements = elements.filter((e) => (e.depth ?? 0) > avgDepth * 2);
  if (deepElements.length > 0) {
    smells.push({
      id: "S11",
      category: "Structure",
      name: "Model Depth Imbalance",
      element: "Modell",
      packagePath: "—",
      description: `${
        deepElements.length
      } Elemente sind deutlich tiefer verschachtelt als der Durchschnitt (${avgDepth.toFixed(
        1
      )}).`,
      severity: "Medium",
    });
  }

  // === S12 – Redundant Relation ==============================
  const relMap = new Map<string, number>();
  relations.forEach((r) => {
    const key = `${r.source}_${r.target}_${r.type}`;
    relMap.set(key, (relMap.get(key) ?? 0) + 1);
  });
  relMap.forEach((count, key) => {
    if (count > 1) {
      smells.push({
        id: "S12",
        category: "Consistency",
        element: "Modell",
        packagePath: "—",
        name: "Redundant Relation",
        description: `Beziehung (${key}) tritt ${count}x auf.`,
        severity: "Low",
      });
    }
  });

  // === S13 – Unused Port =====================================
  const ports = elements.filter((e) =>
    (e.type ?? "").toLowerCase().includes("port")
  );
  ports.forEach((p) => {
    const used = relations.some((r) => r.source === p.id || r.target === p.id);
    if (!used) {
      smells.push({
        id: "S13",
        category: "Structure",
        name: "Unused Port",
        description: `Port "${p.name}" ist unverbunden.`,
        severity: "Medium",
      });
    }
  });

  // === S14 – Requirement without Verification ================
  requirements.forEach((r) => {
    const verified = relations.some(
      (rel) =>
        rel.type?.toLowerCase().includes("verify") &&
        (rel.source === r.id || rel.target === r.id)
    );
    if (!verified) {
      smells.push({
        id: "S14",
        category: "Traceability",
        name: "Requirement without Verification",
        description: `Requirement "${r.name}" hat keine Verify-Beziehung.`,
        severity: "Medium",
        element: r.name,
        packagePath: r.package ?? "Root",
      });
    }
  });

  // === S15 – Element Without Stereotype ======================
  elements.forEach((e) => {
    if (!e.stereotype || e.stereotype.trim() === "") {
      smells.push({
        id: "S15",
        category: "Consistency",
        name: "Element Without Stereotype",
        description: `Element "${e.name}" hat kein zugewiesenes Stereotyp.`,
        severity: "Low",
        element: e.name,
        packagePath: e.package ?? "Root",
      });
    }
  });

  return smells;
}
