"use client";

import { useEffect, useState } from "react";
import TreeNode from "./TreeNode";
import DetailPanel from "../Search/DetailPanel";

export default function TreeOverlay({ tree }: any) {
  const [visible, setVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Öffnen durch Custom Event
  useEffect(() => {
    const toggle = () => setVisible((v) => !v);
    window.addEventListener("toggle-tree", toggle);
    return () => window.removeEventListener("toggle-tree", toggle);
  }, []);

  if (!visible) return null;

  return (
    <>
      <div
        className="
        fixed 
        top-[340px]
        w-[380px]
        max-h-[60vh]
        overflow-y-auto
        bg-gray-900/80 backdrop-blur-md
        rounded-lg shadow-xl p-4
        z-[9999]
      "
      >
        <h2 className="text-md font-semibold mb-2 text-white">
          Hierarchischer Aufbau
        </h2>

        {!tree || tree.length === 0 ? (
          <p className="text-gray-400">Keine Struktur gefunden.</p>
        ) : (
          <div className="space-y-2">
            {tree.map((root: any) => (
              <TreeNode
                key={root.id}
                node={root}
                level={0}
                onSelect={(item: any) => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
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
