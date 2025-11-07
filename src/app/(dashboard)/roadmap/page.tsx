"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  votes: number;
  comments: number;
  status: "planned" | "in-progress" | "completed";
  category: string;
  rank: number;
}

const roadmapItems: RoadmapItem[] = [
  {
    id: 1,
    title: "Asistente de IA por Voz",
    description:
      "Gestiona propiedades, contactos y agenda mediante comandos de voz con inteligencia artificial",
    votes: 2847,
    comments: 134,
    status: "planned",
    category: "IA",
    rank: 1,
  },
  {
    id: 2,
    title: "Chatbot Multiidioma para Clientes",
    description:
      "Chat automático en tu web que responde consultas de clientes 24/7 en cualquier idioma",
    votes: 2156,
    comments: 98,
    status: "planned",
    category: "Automatización",
    rank: 2,
  },
  {
    id: 3,
    title: "Análisis Predictivo de Mercado",
    description:
      "Predicciones de precios y tendencias del mercado inmobiliario con machine learning",
    votes: 1923,
    comments: 87,
    status: "in-progress",
    category: "Análisis",
    rank: 3,
  },
  {
    id: 4,
    title: "App Móvil Nativa",
    description: "Aplicación móvil nativa para iOS y Android",
    votes: 1654,
    comments: 72,
    status: "in-progress",
    category: "Plataforma",
    rank: 4,
  },
  {
    id: 5,
    title: "Firma Digital de Contratos",
    description: "Sistema de firma electrónica integrado para contratos",
    votes: 1432,
    comments: 65,
    status: "planned",
    category: "Legal",
    rank: 5,
  },
  {
    id: 6,
    title: "Integración con WhatsApp Business",
    description: "Conecta tu WhatsApp Business para gestionar conversaciones",
    votes: 1298,
    comments: 54,
    status: "completed",
    category: "Integraciones",
    rank: 6,
  },
  {
    id: 7,
    title: "Tours Virtuales 360°",
    description: "Crea y gestiona tours virtuales interactivos de tus propiedades",
    votes: 1187,
    comments: 48,
    status: "planned",
    category: "Visualización",
    rank: 7,
  },
  {
    id: 8,
    title: "CRM para Equipos",
    description: "Gestión colaborativa con roles y permisos avanzados",
    votes: 1045,
    comments: 41,
    status: "completed",
    category: "CRM",
    rank: 8,
  },
];

const statusConfig = {
  planned: {
    label: "Planeado",
    icon: Clock,
    color: "bg-gray-100 text-gray-700",
  },
  "in-progress": {
    label: "En Desarrollo",
    icon: Sparkles,
    color: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Completado",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700",
  },
};

export default function RoadmapPage() {
  const [votedItems, setVotedItems] = useState<Set<number>>(new Set());
  const [sortedItems, setSortedItems] = useState(roadmapItems);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "planned" | "in-progress" | "completed"
  >("all");

  const handleVote = (itemId: number) => {
    setVotedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    setSortedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              votes: votedItems.has(itemId) ? item.votes - 1 : item.votes + 1,
            }
          : item,
      ),
    );
  };

  const filteredItems =
    filterStatus === "all"
      ? sortedItems
      : sortedItems.filter((item) => item.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-rose-400">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Roadmap de Vesta
              </h1>
              <p className="text-sm text-gray-600">
                Vota por las funcionalidades que más te interesan
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Column - Roadmap (3/4 width) */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Todas ({roadmapItems.length})
              </Button>
              <Button
                variant={filterStatus === "planned" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("planned")}
              >
                Planeadas (
                {roadmapItems.filter((i) => i.status === "planned").length})
              </Button>
              <Button
                variant={filterStatus === "in-progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("in-progress")}
              >
                En Desarrollo (
                {roadmapItems.filter((i) => i.status === "in-progress").length}
                )
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("completed")}
              >
                Completadas (
                {roadmapItems.filter((i) => i.status === "completed").length})
              </Button>
            </div>

            {/* Roadmap Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Funcionalidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Comentarios
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Votos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredItems.map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  const isVoted = votedItems.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      {/* Rank */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="font-mono text-sm font-bold tracking-wider text-gray-400">
                          #{item.rank}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="px-4 py-4">
                        <div className="max-w-xl">
                          <div className="font-medium text-gray-900">
                            {item.title}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {item.description}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "flex items-center gap-1",
                              statusConfig[item.status].color,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span className="text-xs">
                              {statusConfig[item.status].label}
                            </span>
                          </Badge>
                        </div>
                      </td>

                      {/* Comments */}
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                          <MessageSquare className="h-4 w-4" />
                          <span>{item.comments}</span>
                        </div>
                      </td>

                      {/* Vote Button */}
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(item.id)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-50 to-rose-50 px-3 py-1.5 transition-all hover:from-amber-100 hover:to-rose-100",
                            isVoted && "from-amber-100 to-rose-100",
                          )}
                        >
                          <ThumbsUp
                            className={cn(
                              "h-4 w-4 text-amber-600 transition-colors",
                              isVoted && "fill-amber-600",
                            )}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {item.votes}
                          </span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="mt-8 text-center text-gray-500">
                No hay funcionalidades con ese estado
              </div>
            )}

            {/* Info Banner */}
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">
                    Las funcionalidades más votadas se priorizan en nuestro
                    desarrollo
                  </p>
                  <p className="mt-1 text-amber-700">
                    Las características en &quot;Planeado&quot; con más de 1000
                    votos suelen implementarse en menos de 60 días
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Zero Bug Policy (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Zero Bug Policy Card */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">
                      Zero-Bug Policy
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-sm text-gray-600">
                    Priorizamos la estabilidad. Todos los bugs se resuelven
                    según su impacto:
                  </p>

                  {/* High Impact */}
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-red-900">
                        Alto Impacto
                      </span>
                    </div>
                    <div className="font-mono text-2xl font-bold text-red-600">
                      48h
                    </div>
                    <p className="mt-1 text-xs text-red-700">
                      Bugs críticos que afectan funcionalidad principal
                    </p>
                  </div>

                  {/* Low Impact */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                        Bajo Impacto
                      </span>
                    </div>
                    <div className="font-mono text-2xl font-bold text-amber-600">
                      7 días
                    </div>
                    <p className="mt-1 text-xs text-amber-700">
                      Problemas menores que no bloquean el trabajo diario
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500">
                      Reportamos bugs desde{" "}
                      <a
                        href="mailto:support@vesta-crm.com"
                        className="font-medium text-gray-700 hover:text-gray-900"
                      >
                        support@vesta-crm.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
