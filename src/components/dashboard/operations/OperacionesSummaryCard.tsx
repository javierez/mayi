"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { OperacionesSummary } from "~/server/queries/operaciones-dashboard";

interface OperacionesSummaryCardProps {
  data: OperacionesSummary;
  className?: string;
}

export default function OperacionesSummaryCard({
  data,
  className = "",
}: OperacionesSummaryCardProps) {
  const [activeType, setActiveType] = useState<"sale" | "rent">("sale");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Calcular totales para cada tipo de operación
  const calculateTotal = (operations: Record<string, number>) => {
    return Object.values(operations).reduce((acc, count) => acc + count, 0);
  };

  const saleTotal =
    data.sale.prospects +
    data.sale.listings +
    calculateTotal(data.sale.leads) +
    calculateTotal(data.sale.deals);

  const rentTotal =
    data.rent.prospects +
    data.rent.listings +
    calculateTotal(data.rent.leads) +
    calculateTotal(data.rent.deals);

  const activeData = data[activeType];

  // Helper function to pluralize status names
  const pluralizeStatus = (status: string, count: number): string => {
    if (count <= 1) return status;

    const pluralMap: Record<string, string> = {
      // Conexiones badge types
      Inactivo: "Inactivos",
      "Visita Pendiente": "Visitas Pendientes",
      "Oferta Aceptada": "Ofertas Aceptadas",
      "Oferta Rechazada": "Ofertas Rechazadas",
      "Oferta Pendiente": "Ofertas Pendientes",
      "Visita Cancelada": "Visitas Canceladas",
      "Visita Perdida": "Visitas Perdidas",
      "Visita Completada": "Visitas Completadas",
      "Sin Visitas": "Sin Visitas", // Doesn't change
      // Acuerdos status types
      Offer: "Offers",
      UnderContract: "UnderContract",
      Closed: "Closed",
      Lost: "Lost",
    };

    return pluralMap[status] ?? status;
  };

  // Define urgency order for conexiones statuses (from most to least urgent)
  const conexionesUrgencyOrder = [
    "Visita Pendiente",
    "Oferta Pendiente",
    "Oferta Aceptada",
    "Oferta Rechazada",
    "Visita Completada",
    "Sin Visitas",
    "Visita Cancelada",
    "Visita Perdida",
    "Inactivo",
  ];

  // Helper function to sort statuses by urgency
  const sortByUrgency = (entries: [string, number][]): [string, number][] => {
    return entries.sort((a, b) => {
      const indexA = conexionesUrgencyOrder.indexOf(a[0]);
      const indexB = conexionesUrgencyOrder.indexOf(b[0]);

      // If status not in urgency order, put it at the end
      const finalIndexA = indexA === -1 ? 999 : indexA;
      const finalIndexB = indexB === -1 ? 999 : indexB;

      return finalIndexA - finalIndexB;
    });
  };

  // Definir secciones
  const sections = [
    {
      key: "leads",
      label: "Conexión",
      labelPlural: "Conexiones",
      data: activeData.leads,
    },
    {
      key: "deals",
      label: "Acuerdo",
      labelPlural: "Acuerdos",
      data: activeData.deals,
    },
  ];

  return (
    <Card className={className + " group relative"}>
      <CardContent>
        {/* Alternar entre Venta y Alquiler */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="flex w-full justify-center gap-2">
            {/* Tarjeta de Venta */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-1 flex-col items-center rounded-2xl p-3 transition-all duration-200 ${
                activeType === "sale"
                  ? "bg-gray-100 shadow-xl"
                  : "bg-white shadow hover:shadow-lg"
              }`}
              onClick={() => {
                setActiveType("sale");
                setExpandedSection(null);
              }}
              aria-label="Ver operaciones de venta"
              type="button"
            >
              <span className="mb-0.5 text-lg font-bold text-primary">
                {saleTotal}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Venta
              </span>
            </motion.button>

            {/* Tarjeta de Alquiler */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-1 flex-col items-center rounded-2xl p-3 transition-all duration-200 ${
                activeType === "rent"
                  ? "bg-gray-100 shadow-xl"
                  : "bg-white shadow hover:shadow-lg"
              }`}
              onClick={() => {
                setActiveType("rent");
                setExpandedSection(null);
              }}
              aria-label="Ver operaciones de alquiler"
              type="button"
            >
              <span className="mb-0.5 text-lg font-bold text-primary">
                {rentTotal}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Alquiler
              </span>
            </motion.button>
          </div>

          {/* Demandas y Propiedades en Oferta - Side by side */}
          <div className="mt-3 flex w-full gap-2">
            {/* Tarjeta de Demandas - Expandable */}
            <div className="flex flex-1 flex-col gap-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                className={`flex w-full items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none ${
                  expandedSection === "prospects"
                    ? "border-primary bg-gray-100"
                    : ""
                }`}
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "prospects" ? null : "prospects",
                  )
                }
                type="button"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Demandas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {activeData.prospects}
                  </span>
                  <motion.div
                    animate={{
                      rotate: expandedSection === "prospects" ? 180 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </motion.div>
                </div>
              </motion.button>

              {/* Expanded breakdown */}
              <AnimatePresence>
                {expandedSection === "prospects" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 flex flex-col gap-1 overflow-hidden"
                  >
                    <Link
                      href={`/operaciones/prospects?hasMatches=true&type=${activeType}`}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                    >
                      <span className="text-xs text-gray-700">Con Conexiones</span>
                      <span className="font-mono text-xs text-primary">
                        {activeData.prospectsWithMatches}
                      </span>
                    </Link>
                    <Link
                      href={`/operaciones/prospects?hasMatches=false&type=${activeType}`}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                    >
                      <span className="text-xs text-gray-700">Sin Conexiones</span>
                      <span className="font-mono text-xs text-primary">
                        {activeData.prospectsWithoutMatches}
                      </span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tarjeta de Propiedades en Oferta */}
            <Link
              href="/propiedades"
              className="flex flex-1 items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Prop. en Oferta
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {activeData.listings}
              </span>
            </Link>
          </div>

          {/* Desglose de Operaciones */}
          <div className=" flex w-full flex-col gap-2">
            {sections.map((section, index) => {
              const sectionTotal = calculateTotal(section.data);
              const isExpanded = expandedSection === section.key;

              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    className={`flex w-full items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:bg-gray-50 focus:outline-none ${
                      isExpanded ? "border-primary bg-gray-100" : ""
                    }`}
                    onClick={() =>
                      setExpandedSection(isExpanded ? null : section.key)
                    }
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {sectionTotal > 1 ? section.labelPlural : section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {sectionTotal}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* Desglose de Estados */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-1 flex flex-col gap-1 overflow-hidden pr-4"
                      >
                        {sortByUrgency(Object.entries(section.data)).map(
                          ([status, count], statusIndex) => {
                            if (count === 0) return null;

                            return (
                              <motion.div
                                key={status}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: statusIndex * 0.03 }}
                                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                              >
                                <span className="text-xs text-gray-700">
                                  {pluralizeStatus(status, count)}
                                </span>
                                <span className="font-mono text-xs text-primary">
                                  {count}
                                </span>
                              </motion.div>
                            );
                          },
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
