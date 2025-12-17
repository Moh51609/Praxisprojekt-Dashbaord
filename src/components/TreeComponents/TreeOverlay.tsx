"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import TreeNode from "./TreeNode";
import DetailPanel from "../Search/DetailPanel";
import { useModel } from "@/context/ModelContext";
import { buildTreeFromModel } from "@/lib/treeBuilder";

interface TreeNodeData {
  id: string;
  label: string;
  children: TreeNodeData[];
  original: any;
}

export default function TreeOverlay() {
  const { model } = useModel();
  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tree = useMemo(() => {
    if (!model) return [];
    return buildTreeFromModel(model);
  }, [model]);

  useEffect(() => {
    const toggle = () => setVisible((v) => !v);
    window.addEventListener("toggle-tree", toggle);
    return () => window.removeEventListener("toggle-tree", toggle);
  }, []);

  useEffect(() => {
    setSelectedItem(null);
  }, [model]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-[340px] w-[380px] max-h-[60vh] overflow-y-auto bg-gray-900/80 backdrop-blur-md rounded-lg p-4 z-[9999]">
        <h2 className="text-md font-semibold mb-2 text-white">
          Hierarchischer Aufbau
        </h2>

        {tree.map((root) => (
          <TreeNode
            key={root.id}
            node={root}
            level={0}
            onSelect={(n: TreeNodeData) => setSelectedItem(n.original)} // 🔥 echtes Element
          />
        ))}
      </div>

      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
