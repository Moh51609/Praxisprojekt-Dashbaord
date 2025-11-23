"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export default function TreeNode({ node, level, onSelect }: any) {
  const [open, setOpen] = useState(false);

  const isLeaf = !node.children || node.children.length === 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-700/40"
        style={{ paddingLeft: level * 16 }}
        onClick={() => {
          if (isLeaf) {
            onSelect(node); // 🔥 DetailPanel öffnen
          } else {
            setOpen(!open); // Ordner auf/zu
          }
        }}
      >
        {isLeaf ? (
          <span className="text-gray-400">•</span>
        ) : open ? (
          <ChevronDown size={16} className="text-gray-300" />
        ) : (
          <ChevronRight size={16} className="text-gray-300" />
        )}

        <span className="text-gray-200 truncate">
          {node.name}{" "}
          <span className="text-gray-500 text-xs">({node.type})</span>
        </span>
      </div>

      {open &&
        node.children?.map((child: any) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
