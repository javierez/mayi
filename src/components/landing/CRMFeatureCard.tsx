"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  CalendarIcon,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Home,
  Handshake,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";

export function CRMFeatureCard() {
  return (
    <motion.div
      key="crm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-4 sm:p-6 md:p-8 shadow-lg">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Description and Features - Left Column */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="mb-2 md:mb-3 text-xl sm:text-2xl font-bold text-gray-900">
                CRM de Contactos
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Gestiona demandantes y propietarios desde un solo lugar.
                Organiza visitas, ofertas, tareas y mantén un historial completo
                de cada contacto.
              </p>
            </div>

            <div className="space-y-2 md:space-y-3">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-1.5 md:space-y-2">
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 break-words min-w-0">
                    Gestión de demandantes y propietarios
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 break-words min-w-0">
                    Cruces automáticos entre demandas e intereses
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 break-words min-w-0">
                    Seguimiento de visitas y ofertas
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 break-words min-w-0">
                    Tareas y recordatorios automatizados
                  </span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 break-words min-w-0">
                    Historial completo de interacciones
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 pt-3 md:pt-4">
              <Link
                href="https://cal.com/vesta-crm/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
              >
                Probar Gratis
              </Link>
              <button className="w-full rounded-lg bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                Más información
              </button>
            </div>
          </div>

          {/* Contact Cards Preview - Middle and Right Columns */}
          <div className="space-y-3 md:space-y-4 lg:col-span-2">
            {/* Stats Bar */}
            <div className="mb-4 md:mb-6 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <div className="rounded-lg bg-white p-2 sm:p-3 text-center shadow-md">
                <div className="text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  245
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase text-gray-600 break-words">
                  Demandantes
                </div>
              </div>
              <div className="rounded-lg bg-white p-2 sm:p-3 text-center shadow-md">
                <div className="text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  95
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase text-gray-600 break-words">
                  Propietarios
                </div>
              </div>
              <div className="rounded-lg bg-white p-2 sm:p-3 text-center shadow-md">
                <div className="text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  28
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase text-gray-600 break-words">
                  Tareas pendientes
                </div>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="space-y-3 md:space-y-4">
              {/* Contact Card 1 */}
              <div className="overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
                <div className="p-3 sm:p-4">
                  <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/sen%CC%83or.png"
                          alt="Carlos Rodríguez"
                          width={56}
                          height={56}
                          className="object-cover scale-125 translate-y-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          Carlos Rodríguez
                        </h5>
                      </div>
                    </div>
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>Visita Pendiente</span>
                      </span>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">+34 612 345 678</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">carlosrodriguez@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span>Madrid</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t pt-2 sm:pt-3">
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">3 tareas pendientes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">2 propiedades</span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                      Última actividad: hace 2h
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Card 2 */}
              <div className="overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
                <div className="p-3 sm:p-4">
                  <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/sen%CC%83ora.png"
                          alt="María González"
                          width={56}
                          height={56}
                          className="object-cover scale-125 translate-y-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          María González
                        </h5>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Handshake className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>Oferta Pendiente</span>
                      </span>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">+34 655 432 109</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">mariagonzalez@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                      <span>Barcelona</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t pt-2 sm:pt-3">
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">5 tareas pendientes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">1 propiedad</span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                      Última actividad: hace 1 día
                    </span>
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
