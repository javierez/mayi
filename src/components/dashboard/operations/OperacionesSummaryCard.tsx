"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
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

  // Definir secciones con iconos y colores de estado
  const sections = [
    {
      key: "leads",
      label: "Conexión",
      labelPlural: "Conexiones",
      data: activeData.leads,
      statusColors: {
        New: "bg-blue-100 text-blue-800",
        Working: "bg-yellow-100 text-yellow-800",
        Converted: "bg-green-100 text-green-800",
        Disqualified: "bg-red-100 text-red-800",
      },
    },
    {
      key: "deals",
      label: "Acuerdo",
      labelPlural: "Acuerdos",
      data: activeData.deals,
      statusColors: {
        Offer: "bg-purple-100 text-purple-800",
        UnderContract: "bg-blue-100 text-blue-800",
        Closed: "bg-green-100 text-green-800",
        Lost: "bg-red-100 text-red-800",
      },
    },
  ];

  return (
    <Card className={className + " group relative"}>
      <CardContent>
        {/* Alternar entre Venta y Alquiler */}
        <div className="mt-4 flex flex-col items-center gap-3">
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
          <div className="mt-4 flex w-full gap-2">
            {/* Tarjeta de Demandas */}
            <div className="flex flex-1 items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Demandas
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {activeData.prospects}
              </span>
            </div>

            {/* Tarjeta de Propiedades en Oferta */}
            <div className="flex flex-1 items-center justify-between rounded-lg border border-transparent bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Prop. en Oferta
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {activeData.listings}
              </span>
            </div>
          </div>

          {/* Desglose de Operaciones */}
          <div className="mt-4 flex w-full flex-col gap-1.5">
            {sections.map((section, index) => {
              const sectionTotal = calculateTotal(section.data);
              const isExpanded = expandedSection === section.key;

              if (sectionTotal === 0) return null; // Ocultar secciones sin datos

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
                        {Object.entries(section.data).map(
                          ([status, count], statusIndex) => {
                            if (count === 0) return null;

                            const colorClass =
                              section.statusColors[
                                status as keyof typeof section.statusColors
                              ] ?? "bg-gray-100 text-gray-800";

                            return (
                              <motion.div
                                key={status}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: statusIndex * 0.03 }}
                                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className={`${colorClass} text-xs font-medium`}
                                  >
                                    {status}
                                  </Badge>
                                </div>
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
