import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function TreeNode({ node, level, onSelect }: any) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-700/40"
        style={{ paddingLeft: level * 16 }}
      >
        {/* ▶️ Toggle nur über Icon */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? (
              <ChevronDown size={16} className="text-gray-300" />
            ) : (
              <ChevronRight size={16} className="text-gray-300" />
            )}
          </span>
        ) : (
          <span className="text-gray-400">•</span>
        )}

        {/* 🔍 Klick auf Text = Auswahl */}
        <span className="text-gray-200 truncate" onClick={() => onSelect(node)}>
          {node.name}{" "}
          <span className="text-gray-500 text-xs">({node.type})</span>
        </span>
      </div>

      {open &&
        hasChildren &&
        node.children.map((child: any) => (
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
