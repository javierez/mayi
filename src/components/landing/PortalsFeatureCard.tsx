"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { SubscribeInfoModal } from "~/components/landing/SubscribeInfoModal";

interface PortalsFeatureCardProps {
  portalStates: Record<string, boolean>;
  setPortalStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function PortalsFeatureCard({
  portalStates,
  setPortalStates,
}: PortalsFeatureCardProps) {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  return (
    <>
      <SubscribeInfoModal
        open={isSubscribeModalOpen}
        onOpenChange={setIsSubscribeModalOpen}
      />

      <motion.div
      key="portals"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-4 md:p-6 lg:p-8 shadow-lg">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Description and Features - Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xl md:text-2xl font-bold text-gray-900">
                Publicación Multi-Portal
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-gray-600">
                Publica en los principales portales inmobiliarios de España
                con un solo clic. Ahorra tiempo y maximiza la exposición
                de tus propiedades.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm md:text-base font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-2">
                {[
                  "Publicación simultánea en todos los portales",
                  "Sincronización automática de cambios",
                  "Gestión centralizada de respuestas",
                  "Análisis de rendimiento por portal",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3">
                    <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-700 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 md:gap-3 pt-4">
              <Link
                href="https://cal.com/vesta-crm/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-4 md:px-6 py-2.5 md:py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
              >
                Probar Gratis
              </Link>
              <button
                type="button"
                onClick={() => setIsSubscribeModalOpen(true)}
                className="w-full rounded-lg bg-gray-100 px-4 md:px-6 py-2.5 md:py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
              >
                Más información
              </button>
            </div>
          </div>

          {/* Portal Cards Grid - Right Columns */}
          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  id: "idealista",
                  name: "Idealista",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                  description: "El portal inmobiliario más visitado de España",
                },
                {
                  id: "fotocasa",
                  name: "Fotocasa",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                  description: "Encuentra tu casa ideal con millones de anuncios",
                },
                {
                  id: "habitaclia",
                  name: "Habitaclia",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                  description: "Portal especializado en alquiler y venta",
                },
                {
                  id: "milanuncios",
                  name: "Milanuncios",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-milanuncios.png",
                  description: "Portal de anuncios clasificados líder en España",
                },
                {
                  id: "pisoscom",
                  name: "Pisos.com",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                  description: "Tu portal inmobiliario de confianza",
                },
                {
                  id: "yaencontre",
                  name: "Yaencontre",
                  logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-yaencontre.png",
                  description: "Encuentra tu hogar ideal",
                },
                {
                  id: "enalquiler",
                  name: "EnAlquiler",
                  logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-ena.svg",
                  description: "Especialistas en alquiler de viviendas",
                },
                {
                  id: "kyero",
                  name: "Kyero",
                  logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/kyerologo.webp",
                  description: "Portal inmobiliario internacional",
                },
              ].map((platform, index) => {
                const isActive = portalStates[platform.id] ?? false;
                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <Card
                      className={cn(
                        "group relative transition-all duration-300",
                        isActive
                          ? "bg-white shadow-lg"
                          : "bg-transparent shadow-sm hover:border-gray-300",
                      )}
                    >
                      <CardContent className="flex flex-col p-3 relative">
                        <div className="flex h-16 flex-col items-center justify-start">
                          {/* Platform Logo */}
                          <div className="flex items-center justify-center flex-1 min-h-0 -mt-2">
                            <div className="relative">
                              {platform.logo ? (
                                <Image
                                  src={platform.logo}
                                  alt={platform.name}
                                  width={64}
                                  height={64}
                                  className="object-contain max-h-12"
                                  onError={(e) => {
                                    // Fallback for missing logos
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.parentElement!.innerHTML = `<div class="text-sm font-medium text-gray-500 w-16 h-16 flex items-center justify-center">${platform.name}</div>`;
                                  }}
                                />
                              ) : (
                                <div className="flex h-12 w-16 items-center justify-center text-sm font-medium text-gray-500">
                                  {platform.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Minimal Toggle Switch - Fixed Position */}
                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            onClick={() => {
                              setPortalStates((prev) => ({
                                ...prev,
                                [platform.id]: !prev[platform.id],
                              }));
                            }}
                            className={cn(
                              "relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full border border-gray-200 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-1",
                              isActive
                                ? "bg-gray-300 border-gray-300"
                                : "bg-gray-50 border-gray-200",
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
                                isActive ? "translate-x-4" : "translate-x-0.5",
                              )}
                            />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Portal Dashboard */}
            <div className="rounded-lg bg-white p-4 md:p-5 shadow-md border border-gray-100">
              <h5 className="mb-3 md:mb-4 text-xs md:text-sm font-medium text-gray-700">
                Leads por Portal
              </h5>

              {/* Stacked Bar Chart */}
              <div className="mb-3 md:mb-4">
                <div className="relative h-10 md:h-14 w-full overflow-visible">
                  {[
                    {
                      id: "idealista",
                      logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                      leads: 8,
                      color: "#A3D200",
                    },
                    {
                      id: "fotocasa",
                      logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                      leads: 5,
                      color: "#0064D2",
                    },
                    {
                      id: "habitaclia",
                      logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                      leads: 3,
                      color: "#FF6600",
                    },
                    {
                      id: "pisoscom",
                      logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                      leads: 2,
                      color: "#003366",
                    },
                  ]
                    .filter((item) => item.leads > 0)
                    .reduce(
                      (acc, item, index, array) => {
                        const totalLeads = array.reduce(
                          (sum, i) => sum + i.leads,
                          0,
                        );
                        const previousWidth = acc.previousWidth;
                        const width = (item.leads / totalLeads) * 100;
                        const gap = index > 0 ? 0.3 : 0; // Small gap between segments
                        acc.segments.push({
                          ...item,
                          width: width - gap,
                          left: previousWidth + gap,
                        });
                        acc.previousWidth += width;
                        return acc;
                      },
                      {
                        segments: [] as Array<{
                          id: string;
                          logo: string;
                          leads: number;
                          color: string;
                          width: number;
                          left: number;
                        }>,
                        previousWidth: 0,
                      },
                    )
                    .segments.map((segment, index, segmentsArray) => {
                      // Convert hex to rgba for transparency
                      const hexToRgba = (hex: string, alpha: number) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                      };

                      // Determine border radius based on position
                      const isFirst = index === 0;
                      const isLast = index === segmentsArray.length - 1;
                      const borderRadius = isFirst
                        ? "rounded-l-full"
                        : isLast
                          ? "rounded-r-full"
                          : "";

                      return (
                        <motion.div
                          key={segment.id}
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: `${segment.width}%`, opacity: 1 }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                          className={cn(
                            "absolute h-full flex items-center justify-center transition-all duration-500 shadow-md",
                            borderRadius,
                          )}
                          style={{
                            left: `${segment.left}%`,
                            background: `linear-gradient(135deg, ${segment.color} 0%, ${hexToRgba(segment.color, 0.7)} 50%, ${segment.color} 100%)`,
                          }}
                        >
                          {segment.width > 15 && (
                            <span className="text-xs md:text-sm font-semibold text-white drop-shadow-md font-mono">
                              {segment.leads}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              {/* Legends */}
              <div className="flex items-center justify-center flex-wrap gap-3 md:gap-6 -mt-1">
                {[
                  {
                    id: "idealista",
                    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                    leads: 8,
                    color: "#A3D200",
                  },
                  {
                    id: "fotocasa",
                    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                    leads: 5,
                    color: "#0064D2",
                  },
                  {
                    id: "habitaclia",
                    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                    leads: 3,
                    color: "#FF6600",
                  },
                  {
                    id: "pisoscom",
                    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                    leads: 2,
                    color: "#003366",
                  },
                ]
                  .filter((item) => item.leads > 0)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-center gap-2 md:gap-3"
                    >
                      <div
                        className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-sm flex-shrink-0 self-center"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 flex items-center justify-center">
                        <Image
                          src={item.logo}
                          alt=""
                          width={80}
                          height={80}
                          className="object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}
