"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import BlockPreview from "./BlockPreview";

export default function DetailPanel({ item, onClose }: any) {
  const isRelation = item?.source && item?.target;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Hintergrund */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="
              fixed right-0 top-0 bottom-0
              w-[460px]
              bg-gray-900 border-l border-gray-700
              text-white shadow-2xl
              p-6 overflow-y-auto
              z-[99999]
            "
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {isRelation ? "Beziehung" : "Element"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isRelation ? item.type : item.type?.replace("uml:", "")}
                </p>
              </div>

              <button onClick={onClose}>
                <X size={22} className="text-gray-300 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            {!isRelation ? (
              <ElementDetails item={item} />
            ) : (
              <RelationDetails item={item} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ElementDetails({ item }: any) {
  return (
    <div className="space-y-10">
      {/* Allgemein */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Allgemein</h3>
        <ul className="space-y-1 pl-3 border-l border-gray-700">
          <BulletInfo label="Name" value={item.name} />
          <BulletInfo label="Typ" value={item.type?.replace("uml:", "")} />
          <BulletInfo label="Package" value={item.package ?? "—"} />
          <BulletInfo label="Stereotyp" value={item.stereotype ?? "—"} />
          <BulletInfo label="ID" value={item.id ?? "—"} />
        </ul>
      </section>

      {/* Attribute */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Attribute</h3>
        {item.attributes?.length ? (
          <ul className="space-y-1 pl-3 border-l border-gray-700">
            {item.attributes.map((a: any, i: number) => (
              <BulletInfo
                key={i}
                label={a.name}
                value={`${a.type ? a.type : ""}${
                  a.default ? " = " + a.default : ""
                }`}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Keine Attribute</p>
        )}
      </section>

      {/* Ports */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Ports</h3>
        {item.ports?.length ? (
          <ul className="space-y-1 pl-3 border-l border-gray-700">
            {item.ports.map((p: any, i: number) => (
              <BulletInfo
                key={i}
                label={p.name}
                value={`${p.direction ?? "?"}, Typ: ${p.type ?? "?"}, Mult: ${
                  p.multiplicity ?? "-"
                }`}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Keine Ports vorhanden</p>
        )}
      </section>

      {/* Beziehungen */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Beziehungen</h3>
        <ul className="space-y-1 pl-3 border-l border-gray-700">
          <BulletInfo label="Eingehend" value={item.incoming?.length ?? 0} />
          <BulletInfo label="Ausgehend" value={item.outgoing?.length ?? 0} />
        </ul>
      </section>

      {/* Diagramme */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Diagramme</h3>
        {item.diagrams?.length ? (
          <ul className="space-y-1 pl-3 border-l border-gray-700">
            {item.diagrams.map((d: any, i: number) => (
              <BulletInfo key={i} label={d.name} value={d.type} />
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Nicht in Diagrammen</p>
        )}
      </section>

      {/* Qualität */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Qualitätsanalyse</h3>
        <ul className="space-y-1 pl-3 border-l border-gray-700">
          <BulletInfo label="Smells" value={item.smells?.length ?? 0} />
          <BulletInfo label="Warnings" value={item.warnings?.length ?? 0} />
          <BulletInfo label="Verstöße" value={item.violations?.length ?? 0} />
        </ul>
      </section>

      <section>
        <BlockPreview item={item} />
      </section>
    </div>
  );
}

function RelationDetails({ item }: any) {
  return (
    <div className="space-y-6">
      <Info label="Quelle" value={item.source} />
      <Info label="Ziel" value={item.target} />
      <Info label="Typ" value={item.type} />
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-gray-300">{label}: </span>
      <span className="text-gray-100">{value}</span>
    </p>
  );
}

function BulletInfo({ label, value }: any) {
  return (
    <div className="grid grid-cols-[140px_10px_1fr] gap-4 text-sm py-1 items-start">
      {/* Label – linksbündig, mit truncate */}
      <div className="text-gray-400 font-medium truncate">{label}</div>

      {/* Doppelpunkt – rechtsbündig, immer exakt gleiche Position */}
      <div className="text-gray-400 font-medium text-right">:</div>

      {/* Value – linksbündig, truncate */}
      <div className="text-gray-100 truncate max-w-full">{value}</div>
    </div>
  );
}
