"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { ArrowRight } from "lucide-react";

interface AgentSummaryCardsProps {
  agentId: string;
  stats: {
    activeListingsCount: number;
    contactsCount: number;
    dealsCount: number;
    tasksCount: number;
    appointmentsCount: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  clickable?: boolean;
}

function StatCard({ title, value, clickable = false }: StatCardProps) {
  return (
    <Card className={clickable ? "border-gray-200 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer" : "border-gray-200"}>
      <CardContent className="p-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {clickable && (
              <div className="rounded-full bg-white p-1.5 shadow-md hover:shadow-lg transition-shadow">
                <ArrowRight className="h-3.5 w-3.5 text-gray-700" />
              </div>
            )}
          </div>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentSummaryCards({ agentId, stats }: AgentSummaryCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <StatCard title="Propiedades Activas" value={stats.activeListingsCount} />
      <StatCard title="Contactos" value={stats.contactsCount} />
      <StatCard title="Acuerdos" value={stats.dealsCount} />
      <Link href={`/agents/tareas/${agentId}`}>
        <StatCard title="Tareas Pendientes" value={stats.tasksCount} clickable />
      </Link>
      <StatCard title="Citas Programadas" value={stats.appointmentsCount} />
    </div>
  );
}
