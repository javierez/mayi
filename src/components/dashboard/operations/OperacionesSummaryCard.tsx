"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { OperacionesSummary } from "~/server/queries/operaciones-dashboard";
import { OperacionesInfoModal } from "./operaciones-info-modal";

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
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Calcular totales para cada tipo de operación
  const calculateTotal = (operations: Record<string, number>) => {
    return Object.values(operations).reduce((acc, count) => acc + count, 0);
  };

  const saleTotal = data.sale.listings;

  const rentTotal = data.rent.listings;

  const activeData = data[activeType];

  // Helper function to translate and pluralize status names
  const formatStatus = (status: string, count: number): string => {
    // Singular translations
    const singularMap: Record<string, string> = {
      // Conexiones badge types
      Inactivo: "Inactivo",
      "Visita Pendiente": "Visita Pendiente",
      "Oferta Aceptada": "Oferta Aceptada",
      "Oferta Rechazada": "Oferta Rechazada",
      "Oferta Pendiente": "Oferta Pendiente",
      "Visita Cancelada": "Visita Cancelada",
      "Visita Perdida": "Visita Perdida",
      "Visita Completada": "Visita Completada",
      "Sin Visitas": "Sin Visitas",
      // Ofertas aceptadas y cierres - DB statuses (English)
      Offer: "Oferta Aceptada",
      "Arras Pending": "Arras Pendientes",
      UnderContract: "Arras Firmadas",
      Closed: "Cerrado",
      Lost: "Perdido",
      // Ofertas aceptadas y cierres - Derived statuses (Spanish from query)
      "Arras Firmadas": "Arras Firmadas",
      "Contrato Firmado": "Contrato Firmado",
      Cerrado: "Cerrado",
      Perdido: "Perdido",
    };

    // Plural translations
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
      "Sin Visitas": "Sin Visitas",
      // Ofertas aceptadas y cierres - DB statuses (English)
      Offer: "Ofertas Aceptadas",
      "Arras Pending": "Arras Pendientes",
      UnderContract: "Arras Firmadas",
      Closed: "Cerrados",
      Lost: "Perdidos",
      // Ofertas aceptadas y cierres - Derived statuses (Spanish from query)
      "Arras Firmadas": "Arras Firmadas",
      "Contrato Firmado": "Contratos Firmados",
      Cerrado: "Cerrados",
      Perdido: "Perdidos",
    };

    if (count <= 1) {
      return singularMap[status] ?? status;
    }
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

  // Map Spanish status labels to filter values for /operaciones/leads
  const statusToFilterValue: Record<string, string> = {
    "Visita Pendiente": "hasUpcomingVisit",
    "Oferta Aceptada": "offerAccepted",
    "Oferta Rechazada": "offerRejected",
    "Oferta Pendiente": "offerPending",
    "Visita Cancelada": "hasCancelledVisit",
    "Visita Perdida": "hasMissedVisit",
    "Visita Completada": "hasCompletedVisit",
    "Sin Visitas": "noVisits",
    Inactivo: "inactive",
  };

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
      label: "Ofertas aceptadas y cierres",
      labelPlural: "Ofertas aceptadas y cierres",
      data: activeData.deals,
    },
  ];

  return (
    <Card className={className + " group relative"}>
      <CardContent>
        {/* Alternar entre Venta y Alquiler */}
        <div className="mt-5 flex flex-col items-center gap-3"> <div className="flex w-full justify-center gap-2"> {/* Tarjeta de Venta */}
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
                {saleTotal.toLocaleString("es-ES")}
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
                {rentTotal.toLocaleString("es-ES")}
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
                    Búsquedas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {activeData.prospects.toLocaleString("es-ES")}
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
                      <span className="text-xs text-gray-700">Con Resultados</span>
                      <span className="font-mono text-xs text-primary">
                        {activeData.prospectsWithMatches.toLocaleString("es-ES")}
                      </span>
                    </Link>
                    <Link
                      href={`/operaciones/prospects?hasMatches=false&type=${activeType}`}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                    >
                      <span className="text-xs text-gray-700">Sin Resultados</span>
                      <span className="font-mono text-xs text-primary">
                        {activeData.prospectsWithoutMatches.toLocaleString("es-ES")}
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
                  Propiedades en cartera
                </span>
              </div>
              <span className="text-sm font-bold text-primary">
                {activeData.listings.toLocaleString("es-ES")}
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
                        {sectionTotal.toLocaleString("es-ES")}
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

                            // For leads section, make items clickable
                            if (section.key === "leads") {
                              const filterValue =
                                statusToFilterValue[status] ?? status;
                              // For inactive status, we need to use isActive=false instead of badgeStatus
                              const href =
                                status === "Inactivo"
                                  ? `/operaciones/leads?isActive=false`
                                  : `/operaciones/leads?badgeStatus=${encodeURIComponent(filterValue)}`;

                              return (
                                <motion.div
                                  key={status}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: statusIndex * 0.03 }}
                                >
                                  <Link
                                    href={href}
                                    className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                                  >
                                    <span className="text-xs text-gray-700">
                                      {formatStatus(status, count)}
                                    </span>
                                    <span className="font-mono text-xs text-primary">
                                      {count.toLocaleString("es-ES")}
                                    </span>
                                  </Link>
                                </motion.div>
                              );
                            }

                            return (
                              <motion.div
                                key={status}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: statusIndex * 0.03 }}
                                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100"
                              >
                                <span className="text-xs text-gray-700">
                                  {formatStatus(status, count)}
                                </span>
                                <span className="font-mono text-xs text-primary">
                                  {count.toLocaleString("es-ES")}
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

          {/* Info Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInfoModalOpen(true)}
            className="absolute bottom-3 right-3 h-6 w-6 text-muted-foreground hover:text-foreground"
            title="Info"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>

      <OperacionesInfoModal
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
      />
    </Card>
  );
}
