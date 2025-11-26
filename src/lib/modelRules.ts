// lib/modelRules.ts
import { ParsedModel } from "@/types/model";

export function evaluateModelRulesPure(data: ParsedModel, relations: any[]) {
  const rules = [];

  // ✅ R1 – Block ohne Ports
  const blocksWithoutPorts = data.classStats.filter(
    (c) => (c.ports ?? 0) === 0
  );
  rules.push({
    id: "R1",
    name: "Blöcke ohne Ports",
    description: "Jeder Block sollte mindestens einen Port haben.",
    passed: blocksWithoutPorts.length === 0,
    violations: blocksWithoutPorts.length,
  });

  // ✅ R2 – Leere Packages
  // R2 – Leere Packages
  const emptyPackages = data.elements.filter(
    (pkg) =>
      pkg.type === "uml:Package" &&
      !data.elements.some((el) => el.package === pkg.name)
  );
  rules.push({
    id: "R2",
    name: "Leere Packages",
    description: "Packages sollten Inhalte enthalten.",
    passed: emptyPackages.length === 0,
    violations: emptyPackages.length,
  });

  // ✅ R3 – Unbenannte Elemente
  const unnamed = data.elements.filter((e) => !e.name?.trim());
  rules.push({
    id: "R3",
    name: "Unbenannte Elemente",
    description: "Alle Modell-Elemente sollten einen Namen besitzen.",
    passed: unnamed.length === 0,
    violations: unnamed.length,
  });

  // ✅ R4 – Namenskonvention
  const invalidNames = data.elements.filter(
    (e) => e.name && !/^[A-Z][a-zA-Z0-9]*$/.test(e.name)
  );
  rules.push({
    id: "R4",
    name: "Ungültige Namenskonvention",
    description: "Elementnamen sollten nach CamelCase formatiert sein.",
    passed: invalidNames.length === 0,
    violations: invalidNames.length,
  });

  // ✅ R5 – Isolierte Elemente
  const relatedIds = new Set(relations.flatMap((r) => [r.source, r.target]));
  const isolated = data.elements.filter((e) => !relatedIds.has(e.id));
  rules.push({
    id: "R5",
    name: "Isolierte Elemente",
    description: "Kein Block sollte unverbunden sein.",
    passed: isolated.length === 0,
    violations: isolated.length,
  });

  // ✅ R6 – Ungültige Connector-Enden
  const invalidConnectors = relations.filter((r) => !r.source || !r.target);
  rules.push({
    id: "R6",
    name: "Ungültige Connector-Enden",
    description: "Jeder Connector sollte zwei gültige Enden verbinden.",
    passed: invalidConnectors.length === 0,
    violations: invalidConnectors.length,
  });

  // ✅ R7 – Requirement ohne Satisfy
  const unsatisfiedReqs = data.elements.filter(
    (e) =>
      e.type?.includes("Requirement") &&
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
  });

  return rules;
}
