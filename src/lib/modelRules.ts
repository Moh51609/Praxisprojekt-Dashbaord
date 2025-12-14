// lib/modelRules.ts
import { ParsedModel, UmlElement } from "@/types/model";

type ViolatingElement = {
  id: string;
  name: string;
  packagePath: string;
};

export function evaluateModelRulesPure(data: ParsedModel, relations: any[]) {
  const rules: any[] = [];

  // 🔹 Hilfsfunktion für Package-Pfad
  const getPackagePath = (el?: UmlElement): string => el?.package ?? "Root";

  // 🔹 Lookup: Element-ID → Element
  const elementById = new Map<string, UmlElement>(
    data.elements.map((e) => [e.id, e])
  );

  /* ======================================================
     R1 – Block ohne Ports
     Quelle: classStats + elements
     ====================================================== */
  const blocksWithoutPorts = data.classStats.filter(
    (c) => (c.ports ?? 0) === 0
  );

  const r1ViolatingElements: ViolatingElement[] = blocksWithoutPorts
    .map((c) => {
      const el = c.umlId ? elementById.get(c.umlId) : undefined;
      if (!el) return null;
      return {
        id: el.id,
        name: el.name ?? "(Unbenannt)",
        packagePath: getPackagePath(el),
      };
    })
    .filter(Boolean) as ViolatingElement[];

  rules.push({
    id: "R1",
    name: "Blöcke ohne Ports",
    description: "Jeder Block sollte mindestens einen Port haben.",
    passed: r1ViolatingElements.length === 0,
    violations: r1ViolatingElements.length,
    violatingElements: r1ViolatingElements,
  });

  /* ======================================================
     R2 – Leere Packages
     ====================================================== */
  const emptyPackages = data.packages.filter(
    (pkg) => !data.elements.some((el) => el.package === pkg.name)
  );

  rules.push({
    id: "R2",
    name: "Leere Packages",
    description: "Packages sollten Inhalte enthalten.",
    passed: emptyPackages.length === 0,
    violations: emptyPackages.length,
    violatingElements: emptyPackages.map((p) => ({
      id: p.id,
      name: p.name ?? "(Unbenanntes Package)",
      packagePath: "—",
    })),
  });

  /* ======================================================
     R3 – Unbenannte Elemente
     ====================================================== */
  const unnamed = data.elements.filter((e) => !e.name?.trim());

  rules.push({
    id: "R3",
    name: "Unbenannte Elemente",
    description: "Alle Modell-Elemente sollten einen Namen besitzen.",
    passed: unnamed.length === 0,
    violations: unnamed.length,
    violatingElements: unnamed.map((e) => ({
      id: e.id,
      name: "(Unbenannt)",
      packagePath: getPackagePath(e),
    })),
  });

  /* ======================================================
     R4 – Ungültige Namenskonvention
     ====================================================== */
  const invalidNames = data.elements.filter(
    (e) => e.name && !/^[A-Z][a-zA-Z0-9]*$/.test(e.name)
  );

  rules.push({
    id: "R4",
    name: "Ungültige Namenskonvention",
    description: "Elementnamen sollten nach CamelCase formatiert sein.",
    passed: invalidNames.length === 0,
    violations: invalidNames.length,
    violatingElements: invalidNames.map((e) => ({
      id: e.id,
      name: e.name!,
      packagePath: getPackagePath(e),
    })),
  });

  /* ======================================================
     R5 – Isolierte Elemente
     ====================================================== */
  const relatedIds = new Set(relations.flatMap((r) => [r.source, r.target]));
  const isolated = data.elements.filter((e) => !relatedIds.has(e.id));

  rules.push({
    id: "R5",
    name: "Isolierte Elemente",
    description: "Kein Block sollte unverbunden sein.",
    passed: isolated.length === 0,
    violations: isolated.length,
    violatingElements: isolated.map((e) => ({
      id: e.id,
      name: e.name ?? "(Unbenannt)",
      packagePath: getPackagePath(e),
    })),
  });

  /* ======================================================
     R6 – Ungültige Connector-Enden
     ====================================================== */
  const invalidConnectors = relations.filter((r) => !r.source || !r.target);

  rules.push({
    id: "R6",
    name: "Ungültige Connector-Enden",
    description: "Jeder Connector sollte zwei gültige Enden verbinden.",
    passed: invalidConnectors.length === 0,
    violations: invalidConnectors.length,
    violatingElements: invalidConnectors.map((r) => ({
      id: r.id,
      name: r.name ?? "(Connector)",
      packagePath: "—",
    })),
  });

  /* ======================================================
     R7 – Requirement ohne Satisfy
     ====================================================== */
  const unsatisfiedReqs = data.elements.filter(
    (e) =>
      e.type.includes("Requirement") &&
      !relations.some(
        (r) =>
          r.type?.includes("Satisfy") &&
          (r.source === e.id || r.target === e.id)
      )
  );

  rules.push({
    id: "R7",
    name: "Requirement ohne Satisfy",
    description:
      "Jede Anforderung sollte durch mindestens ein Element erfüllt werden.",
    passed: unsatisfiedReqs.length === 0,
    violations: unsatisfiedReqs.length,
    violatingElements: unsatisfiedReqs.map((e) => ({
      id: e.id,
      name: e.name ?? "(Unbenannt)",
      packagePath: getPackagePath(e),
    })),
  });

  return rules;
}
