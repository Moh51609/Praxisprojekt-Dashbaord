// hooks/useModelRules.ts
import { useEffect, useState } from "react";
import { ParsedModel } from "@/types/model";
import { evaluateModelRulesPure } from "@/lib/modelRules";

export function useModelRules(data: ParsedModel | null) {
  const [relations, setRelations] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;

    fetch("/api/xmi-relations")
      .then((r) => r.json())
      .then((j) => {
        if ("error" in j) setError(j.error);
        else {
          setRelations(j.relations);
          const results = evaluateModelRulesPure(data, j.relations);
          setRules(results);
        }
      })
      .catch((e) => setError(String(e)));
  }, [data]);

  return { rules, error };
}
