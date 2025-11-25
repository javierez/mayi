"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Car } from "lucide-react";

export function CalendarFeatureCard() {
  return (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-4 sm:p-6 md:p-8 shadow-lg">
        <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
          {/* Description and Features - Left Column */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="mb-3 text-xl md:text-2xl font-bold text-gray-900">
                Calendario Integrado
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-gray-600">
                Nunca falles a una cita. Programa visitas, recordatorios
                y tareas. Sincroniza con tu calendario favorito y mantén
                todo organizado.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm md:text-base font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-1.5 md:space-y-2">
                {[
                  "Programación inteligente de visitas",
                  "Recordatorios automáticos por SMS/Email",
                  "Sincronización con Google/Outlook",
                  "Vista de equipo compartida",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3">
                    <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-0.5 md:p-1">
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Link
                href="https://cal.com/vesta-crm/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
              >
                Probar Gratis
              </Link>
              <button disabled className="w-full rounded-lg bg-gray-100 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-400 shadow-sm cursor-not-allowed">
                Más información
              </button>
            </div>
          </div>

          {/* Calendar Preview - Middle and Right Columns */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            {/* Weekly Calendar View */}
            <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
              {/* Week Navigation Header */}
              <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    className="rounded-md border border-gray-300 p-1 sm:p-1.5 hover:bg-gray-50 transition-colors"
                    aria-label="Semana anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                  </button>
                  <button
                    className="rounded-md border border-gray-300 p-1 sm:p-1.5 hover:bg-gray-50 transition-colors"
                    aria-label="Semana siguiente"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                  </button>
                  <h5 className="ml-1 sm:ml-2 text-sm sm:text-base font-semibold text-gray-900">
                    Septiembre 2024
                  </h5>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <Image
                      src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Google_Calendar_icon_(2020).svg.png"
                      alt="Google Calendar"
                      width={20}
                      height={20}
                      className="h-4 w-4 sm:h-5 sm:w-5 object-contain opacity-70"
                    />
                    <Image
                      src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/outlook-calendar.png"
                      alt="Outlook Calendar"
                      width={20}
                      height={20}
                      className="h-4 w-4 sm:h-5 sm:w-5 object-contain opacity-70"
                    />
                  </div>
                  <button className="rounded-md border border-gray-300 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Hoy
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-hidden">
                <div className="w-full">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 border-b">
                    {/* Time column header */}
                    <div className="flex h-9 sm:h-10 md:h-12 min-w-0 items-center justify-center border-r text-xs text-gray-500">
                      <span className="hidden sm:inline text-[10px] sm:text-xs">GMT</span>
                      <span className="sm:hidden text-[9px]">•</span>
                    </div>

                    {/* Day columns headers */}
                    {["L", "M", "X", "J", "V", "S", "D"].map(
                      (day, dayIdx) => {
                        const isToday = dayIdx === 2; // Wednesday as "today"
                        const dayNumber = 15 + dayIdx;
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "relative flex h-9 sm:h-10 md:h-12 min-w-0 flex-col items-center justify-center border-r",
                              isToday && "bg-slate-50/50",
                            )}
                          >
                            <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                              {day}
                            </div>
                            <div
                              className={cn(
                                "flex h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-6 md:w-6 items-center justify-center rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium",
                                isToday
                                  ? "bg-slate-600 text-white"
                                  : "text-gray-700",
                              )}
                            >
                              {dayNumber}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Calendar Body with Time Slots */}
                  <div
                    className="custom-scrollbar-thin relative max-h-[280px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto border"
                  >
                    <div className="grid grid-cols-8">
                      {/* Hours column */}
                      <div className="flex flex-col border-r bg-gray-50/50">
                        {Array.from({ length: 12 }, (_, i) => i + 8).map(
                          (hour) => (
                            <div
                              key={hour}
                              className="flex h-[45px] sm:h-[55px] md:h-[60px] items-start justify-end border-b pr-0.5 sm:pr-1 md:pr-2 pt-0.5 sm:pt-1 text-[9px] sm:text-[10px] md:text-xs text-gray-500"
                            >
                              {hour.toString().padStart(2, "0")}:00
                            </div>
                          ),
                        )}
                      </div>

                      {/* Days columns */}
                      {Array.from({ length: 7 }, (_, dayIdx) => {
                        const isToday = dayIdx === 2;
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "relative flex min-w-0 flex-col border-r",
                              isToday && "bg-blue-50/30",
                            )}
                          >
                            {/* Hour slots */}
                            {Array.from(
                              { length: 12 },
                              (_, i) => i + 8,
                            ).map((hour) => (
                              <div
                                key={hour}
                                className="relative h-[45px] sm:h-[55px] md:h-[60px] border-b"
                              >
                                {/* Half-hour divider */}
                                <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200"></div>
                              </div>
                            ))}

                            {/* Sample Appointments */}
                            {dayIdx === 0 && (
                              <>
                                {/* 10:00 AM appointment with transport time */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-t-md bg-slate-50 border-l-2 sm:border-l-3 md:border-l-4 border-slate-400 p-0.5 sm:p-1 md:p-1.5 z-10 overflow-hidden"
                                  style={{
                                    top: "90px", // 10:00 AM (2 hours * 45px mobile)
                                    height: "45px", // 1 hour mobile
                                  }}
                                >
                                  <div className="font-medium text-slate-700 text-[7px] sm:text-[8px] md:text-[10px]">
                                    10:00
                                  </div>
                                  <div className="text-slate-600 truncate text-[7px] sm:text-[8px] md:text-[10px] leading-tight">
                                    Visita Villa
                                  </div>
                                </div>
                                {/* Transport time block */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-b-md backdrop-blur-sm z-10 hidden sm:block"
                                  style={{
                                    top: "135px", // Below appointment
                                    height: "11px", // 15 minutes
                                    background: "linear-gradient(to top, rgba(71, 85, 105, 0.12), rgba(71, 85, 105, 0.25))",
                                  }}
                                >
                                  <div className="absolute bottom-0.5 right-1 md:right-1.5">
                                    <Car className="h-1.5 w-1.5 md:h-2 md:w-2 text-slate-400 opacity-50" />
                                  </div>
                                </div>
                              </>
                            )}
                            {dayIdx === 2 && (
                              <>
                                {/* 10:00 AM appointment */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-md bg-slate-50 border-l-2 sm:border-l-3 md:border-l-4 border-slate-400 p-0.5 sm:p-1 md:p-1.5 z-10 overflow-hidden"
                                  style={{
                                    top: "90px", // 10:00 AM
                                    height: "45px",
                                  }}
                                >
                                  <div className="font-medium text-slate-700 text-[7px] sm:text-[8px] md:text-[10px]">
                                    10:00
                                  </div>
                                  <div className="text-slate-600 truncate text-[7px] sm:text-[8px] md:text-[10px] leading-tight">
                                    Visita Villa
                                  </div>
                                </div>
                                {/* 12:00 PM appointment with transport time */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-t-md bg-neutral-50 border-l-2 sm:border-l-3 md:border-l-4 border-neutral-400 p-0.5 sm:p-1 md:p-1.5 z-10 overflow-hidden"
                                  style={{
                                    top: "180px", // 12:00 PM
                                    height: "45px",
                                  }}
                                >
                                  <div className="font-medium text-neutral-700 text-[7px] sm:text-[8px] md:text-[10px]">
                                    12:00
                                  </div>
                                  <div className="text-neutral-600 truncate text-[7px] sm:text-[8px] md:text-[10px] leading-tight">
                                    Firma contr...
                                  </div>
                                </div>
                                {/* Transport time block for 12:00 PM */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-b-md backdrop-blur-sm z-10 hidden sm:block"
                                  style={{
                                    top: "225px", // Below appointment
                                    height: "18px", // 25 minutes
                                    background: "linear-gradient(to top, rgba(82, 82, 82, 0.12), rgba(82, 82, 82, 0.25))",
                                  }}
                                >
                                  <div className="absolute bottom-0.5 right-1 md:right-1.5">
                                    <Car className="h-1.5 w-1.5 md:h-2 md:w-2 text-neutral-400 opacity-50" />
                                  </div>
                                </div>
                                {/* 16:00 PM appointment */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-md bg-stone-50 border-l-2 sm:border-l-3 md:border-l-4 border-stone-400 p-0.5 sm:p-1 md:p-1.5 z-10 overflow-hidden"
                                  style={{
                                    top: "360px", // 4:00 PM (8 hours * 45px)
                                    height: "67px", // 1.5 hours
                                  }}
                                >
                                  <div className="font-medium text-stone-700 text-[7px] sm:text-[8px] md:text-[10px]">
                                    16:00
                                  </div>
                                  <div className="text-stone-600 truncate text-[7px] sm:text-[8px] md:text-[10px] leading-tight">
                                    Reunión eq...
                                  </div>
                                </div>
                              </>
                            )}
                            {dayIdx === 4 && (
                              <>
                                {/* 11:00 AM appointment with transport time */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-t-md bg-gray-50 border-l-2 sm:border-l-3 md:border-l-4 border-gray-400 p-0.5 sm:p-1 md:p-1.5 z-10 overflow-hidden"
                                  style={{
                                    top: "135px", // 11:00 AM (3 hours * 45px)
                                    height: "67px", // 1.5 hours
                                  }}
                                >
                                  <div className="font-medium text-gray-700 text-[7px] sm:text-[8px] md:text-[10px]">
                                    11:00
                                  </div>
                                  <div className="text-gray-600 truncate text-[7px] sm:text-[8px] md:text-[10px] leading-tight">
                                    Presentac...
                                  </div>
                                </div>
                                {/* Transport time block for 11:00 AM */}
                                <div
                                  className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 rounded-b-md backdrop-blur-sm z-10 hidden sm:block"
                                  style={{
                                    top: "202px", // Below appointment
                                    height: "15px", // 20 minutes
                                    background: "linear-gradient(to top, rgba(107, 114, 128, 0.12), rgba(107, 114, 128, 0.25))",
                                  }}
                                >
                                  <div className="absolute bottom-0.5 right-1 md:right-1.5">
                                    <Car className="h-1.5 w-1.5 md:h-2 md:w-2 text-gray-400 opacity-50" />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
