"use client";

import { motion } from "framer-motion";
import { ThumbsUp, ChevronRight, Bug } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "~/components/landing/animations";

interface FutureFeature {
  id: number;
  title: string;
  description: string;
  votes: number;
  comments: number;
  rank: number;
}

const topFeatures: FutureFeature[] = [
  {
    id: 1,
    title: "Home Staging e Inteligencia de Imágenes",
    description:
      "Mejor IA para reformas del mercado, pixela imágenes de personas en las fotografías.",
    votes: 23,
    comments: 134,
    rank: 1,
  },
  {
    id: 2,
    title: "Generación Automática de Documentos.",
    description: "Generación automática de hojas de visita, encargos, contratos de arras, etc.",
    votes: 8,
    comments: 8,
    rank: 2,
  },
  {
    id: 3,
    title: "Captación Automática de Leads desde Portales",
    description: "Sincroniza automáticamente los leads de Idealista, Fotocasa y otros portales directamente al CRM",
    votes: 5,
    comments: 3,
    rank: 3,
  },
  {
    id: 4,
    title: "Módulo de Gestión de Alquileres",
    description: "Comprueba pagos, gestiona contratos, recordatorios de pagos y resolución de incidencias",
    votes: 4,
    comments: 5,
    rank: 4,
  },
];

export function FutureFeaturesLeaderboard() {
  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Próximas funcionalidades
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vota por las características que más te gustaría ver en Vesta
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Column - Features Leaderboard (75% width) */}
          <div className="lg:col-span-3">
            {/* Leaderboard */}
            <div className="space-y-3">
          {topFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Rank Number */}
                  <div className="flex-shrink-0">
                    <span className="font-mono text-2xl font-bold tracking-wider text-gray-400">
                      #{feature.rank}
                    </span>
                  </div>

                  {/* Feature Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {feature.description}
                    </p>
                  </div>

                  {/* Vote Count */}
                  <Link href="/roadmap">
                    <motion.button
                      className="group/vote flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-rose-50 px-3 py-1.5 transition-all hover:from-amber-100 hover:to-rose-100"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ThumbsUp className="h-4 w-4 text-amber-600 transition-colors group-hover/vote:text-amber-700" />
                      <span className="text-sm font-medium text-gray-900">
                        <AnimatedCounter to={feature.votes} />
                      </span>
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

            {/* View All Link */}
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/roadmap"
                className="group inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Ver todas las funcionalidades
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column - Zero Bug Policy (25% width) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="overflow-hidden rounded-lg bg-white shadow-md">
                <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50 p-4">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Políticas Zero-bug
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-xs text-gray-600">
                    Priorizamos la estabilidad. Todos los bugs se resuelven
                    según su impacto:
                  </p>

                  {/* High Impact */}
                  <div className="mb-3 rounded-lg bg-gray-50 p-3 shadow-sm">
                    <div className="mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Alto Impacto
                      </span>
                    </div>
                    <div className="font-mono text-2xl font-bold text-red-600">
                      48h
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      Bugs críticos que afectan funcionalidad principal
                    </p>
                  </div>

                  {/* Low Impact */}
                  <div className="rounded-lg bg-gray-50 p-3 shadow-sm">
                    <div className="mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Bajo Impacto
                      </span>
                    </div>
                    <div className="font-mono text-2xl font-bold text-amber-600">
                      7 días
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      Problemas menores que no bloquean el trabajo diario
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
