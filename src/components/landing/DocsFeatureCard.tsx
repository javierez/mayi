"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  FileText,
  FileSignature,
  FolderOpen,
  Eye,
  Clock,
} from "lucide-react";

export function DocsFeatureCard() {
  return (
    <motion.div
      key="docs"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Description and Features - Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-2xl font-bold text-gray-900">
                Procesamiento de Documentos
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                Genera documentos automáticamente, gestiona firmas
                digitales, recupera información de documentos y organiza
                todo tu archivo documental desde un solo lugar.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-2">
                {[
                  "Generación automática de documentos",
                  "Firmas digitales integradas",
                  "Extracción y recuperación de información",
                  "Gestión y organización centralizada",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="https://cal.com/vesta-crm/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
              >
                Probar Gratis
              </Link>
              <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                Más información
              </button>
            </div>
          </div>

          {/* Document Processing Preview - Middle and Right Columns */}
          <div className="space-y-2 lg:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Document Generation */}
              <div className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-gray-900">
                    Generación
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-2 text-center">
                    <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
                      <FileText className="h-3 w-3 text-amber-600" />
                    </div>
                    <p className="mb-1.5 text-[9px] text-gray-600">
                      Crea la{" "}
                      <span className="rounded bg-amber-50 px-0.5 py-0 text-[9px] font-semibold text-amber-600">
                        hoja de encargo
                      </span>
                    </p>
                    <div className="h-4 rounded bg-gradient-to-r from-amber-400 to-rose-400 text-[8px] font-medium leading-4 text-white">
                      Generar
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded bg-gray-50 px-1.5 py-1">
                    <FileText className="h-2.5 w-2.5 text-gray-500" />
                    <span className="text-[9px] text-gray-700">
                      Visita PDF
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="mb-2 flex items-center gap-1.5">
                  <FileSignature className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-xs font-semibold text-gray-900">
                    Firmas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-1.5">
                    <div className="mb-1 h-6 rounded border border-gray-200 bg-white"></div>
                    <div className="flex items-center justify-center gap-1 text-[9px] text-green-600">
                      <Check className="h-2.5 w-2.5" />
                      <span>Agente</span>
                    </div>
                  </div>
                  <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-1.5">
                    <div className="mb-1 h-6 rounded border border-gray-200 bg-white"></div>
                    <div className="flex items-center justify-center gap-1 text-[9px] text-amber-600">
                      <Clock className="h-2.5 w-2.5" />
                      <span>Visitante</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Document Management */}
              <div className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-gray-900">
                      Gestión
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 rounded bg-gray-50 px-1.5 py-1">
                    <FolderOpen className="h-2.5 w-2.5 fill-current text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium text-gray-900 truncate">
                        Inicial
                      </div>
                      <div className="text-[8px] text-gray-500 truncate">
                        Hoja encargo, valoración
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded bg-gray-50 px-1.5 py-1">
                    <FolderOpen className="h-2.5 w-2.5 fill-current text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium text-gray-900 truncate">
                        Visitas
                      </div>
                      <div className="text-[8px] text-gray-500 truncate">
                        Reportes de visitas
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded bg-gray-50 px-1.5 py-1">
                    <FolderOpen className="h-2.5 w-2.5 fill-current text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium text-gray-900 truncate">
                        Planos
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OCR / Info Retrieval */}
              <div className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="mb-2 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-semibold text-gray-900 leading-tight">
                    Reconocimiento de Imágenes
                  </span>
                </div>
                <div className="mb-2 rounded border border-gray-200 bg-gray-50 px-1.5 py-1">
                  <div className="flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5 text-gray-500" />
                    <span className="text-[9px] text-gray-600 truncate">
                      Escritura.pdf
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 p-1.5">
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-gray-700">
                      <span className="font-medium">Propietario:</span>{" "}
                      Juan García
                    </div>
                    <div className="text-[9px] text-gray-700">
                      <span className="font-medium">Precio:</span>{" "}
                      €875,000
                    </div>
                    <div className="text-[9px] text-gray-700">
                      <span className="font-medium">Fecha:</span>{" "}
                      15/09/2024
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
