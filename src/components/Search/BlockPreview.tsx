"use client";

export default function BlockPreview({ item }: any) {
  // 🧠 Ports aus allen möglichen Quellen sammeln
  const ports =
    item.ports ??
    item.ownedPorts ??
    item?.ownedAttributes?.filter((a: any) => a.stereotype === "Port") ??
    item.attributes?.filter((a: any) =>
      (a.type ?? "").toLowerCase().includes("port")
    ) ??
    [];

  if (!ports || ports.length === 0) {
    return (
      <div className="text-gray-500 text-sm mt-4">🔌 Keine Ports gefunden</div>
    );
  }

  const left = ports.filter((p: any) =>
    (p.direction ?? "").toLowerCase().includes("in")
  );
  const right = ports.filter((p: any) =>
    (p.direction ?? "").toLowerCase().includes("out")
  );

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 mt-6 select-none">
      <div className="text-center font-semibold text-gray-200 mb-3">
        {item.name}
      </div>

      <div className="flex justify-center w-full rounded-md ">
        {/* LEFT PORTS */}
        <div className="flex flex-col gap-2">
          {left.map((p: any, i: number) => (
            <div
              key={i}
              className="text-xs bg-gray-700 px-2 py-1 rounded-md border border-gray-600 
             w-36 text-center truncate"
            >
              ◀ {p.name}
            </div>
          ))}
        </div>

        {/* RIGHT PORTS */}
        <div className="flex flex-col gap-2 text-right">
          {right.map((p: any, i: number) => (
            <div
              key={i}
              className="text-xs bg-gray-700 px-2 py-1 rounded-md border border-gray-600 
             w-36 text-center truncate"
            >
              {p.name} ▶
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
