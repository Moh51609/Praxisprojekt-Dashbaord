import { TreeNode } from "@/types/tree";

export function buildTreeFromModel(model: any): TreeNode[] {
  const nodes = new Map<string, TreeNode>();

  // 🔹 ROOT
  const root: TreeNode = {
    id: "root-model",
    name: "Model",
    type: "Package",
    children: [],
    original: null,
  };

  // 1️⃣ Packages
  model.elements
    .filter((e: any) => e.type === "uml:Package")
    .forEach((p: any) => {
      const node: TreeNode = {
        id: p.id,
        name: p.name,
        type: "Package",
        children: [],
        original: p,
      };
      nodes.set(p.id, node);
      root.children.push(node); // ⬅️ erstmal alle an Root
    });

  // 2️⃣ Klassen
  model.elements
    .filter((e: any) => e.type === "uml:Class")
    .forEach((c: any) => {
      const classNode: TreeNode = {
        id: c.id,
        name: c.name,
        type: "Class",
        children: [],
        original: c,
      };

      nodes.set(c.id, classNode);

      // 🔹 In Package einsortieren
      const parentPkg = [...nodes.values()].find(
        (n) => n.type === "Package" && n.original?.name === c.package
      );

      if (parentPkg) {
        parentPkg.children.push(classNode);
      } else {
        // 🔥 Klasse direkt unter Model
        root.children.push(classNode);
      }
    });

  // 3️⃣ Ports
  model.elements
    .filter((e: any) => e.type === "uml:Port")
    .forEach((p: any) => {
      const owner = nodes.get(p.owner);
      if (!owner) return;

      owner.children.push({
        id: p.id,
        name: p.name,
        type: "Port",
        children: [],
        original: p,
      });
    });

  return [root]; // ✅ EIN Root
}
