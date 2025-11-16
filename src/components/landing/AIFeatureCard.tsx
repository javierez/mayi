"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Brain, Zap, Languages, PenTool } from "lucide-react";
import { SubscribeInfoModal } from "~/components/landing/SubscribeInfoModal";

interface AIFeatureCardProps {
  generatedTitleText: string;
  isTypingGenerated: boolean;
  descriptionText: string;
  isTypingDescription: boolean;
}

export function AIFeatureCard({
  generatedTitleText,
  isTypingGenerated,
  descriptionText,
  isTypingDescription,
}: AIFeatureCardProps) {
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  return (
    <>
      <SubscribeInfoModal
        open={isSubscribeModalOpen}
        onOpenChange={setIsSubscribeModalOpen}
      />

    <motion.div
      key="ai"
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
              <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold text-gray-900">
                /re
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                Genera descripciones atractivas y optimizadas para SEO
                con inteligencia artificial. Destaca las mejores
                características de cada propiedad.
              </p>
            </div>

            <div>
              <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-1.5 sm:space-y-2">
                {[
                  "Generación en segundos",
                  "Optimización SEO automática",
                  "Múltiples idiomas disponibles",
                  "Personalización por cliente",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
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
              <button
                type="button"
                onClick={() => setIsSubscribeModalOpen(true)}
                className="w-full rounded-lg bg-gray-100 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-200"
              >
                Más información
              </button>
            </div>
          </div>

          {/* AI Generation Preview - Middle and Right Columns */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            {/* AI Controls */}
            <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h5 className="text-sm sm:text-base font-semibold text-gray-900">
                  Generador de Descripciones IA
                </h5>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-medium text-amber-600">
                    Powered by GPT-4o
                  </span>
                </div>
              </div>
              <div className="mb-3 sm:mb-4 grid grid-cols-2 gap-2 sm:gap-3">
                <button className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200">
                  <Languages className="mr-1 inline h-4 w-4" />
                  Español
                </button>
                <button className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200">
                  <PenTool className="mr-1 inline h-4 w-4" />
                  Tono Profesional
                </button>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white transition-all hover:from-amber-500 hover:to-rose-500">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                Generar Descripción
              </button>
            </div>

            {/* Generated Description Example */}
            <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
              <div className="mb-2 sm:mb-3">
                <h5 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                  {generatedTitleText}
                  {isTypingGenerated && <span className="ml-1 animate-pulse">|</span>}
                </h5>
              </div>
              <div className="prose prose-sm sm:prose-base text-gray-700 max-w-none">
                {descriptionText.split("\n\n").map((paragraph, index, arr) => {
                  if (!paragraph) return null;
                  const isLastNonEmpty = arr.filter(p => p).length - 1 === index;
                  return (
                    <p key={index} className={index > 0 ? "mt-2 leading-relaxed" : "leading-relaxed"}>
                      {paragraph}
                      {isTypingDescription && isLastNonEmpty && (
                        <span className="ml-1 animate-pulse">|</span>
                      )}
                    </p>
                  );
                })}
                {!descriptionText && isTypingDescription && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-gray-500">
                  Generado en 2.3 segundos
                </span>
                <span className="text-gray-500 hidden sm:inline">•</span>
                <span className="text-gray-500">
                  Score SEO: 94/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}
