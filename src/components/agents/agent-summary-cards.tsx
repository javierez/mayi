"use client";

import { Card, CardContent } from "~/components/ui/card";

interface AgentSummaryCardsProps {
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
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentSummaryCards({ stats }: AgentSummaryCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <StatCard title="Propiedades Activas" value={stats.activeListingsCount} />
      <StatCard title="Contactos" value={stats.contactsCount} />
      <StatCard title="Operaciones" value={stats.dealsCount} />
      <StatCard title="Tareas Pendientes" value={stats.tasksCount} />
      <StatCard title="Citas Programadas" value={stats.appointmentsCount} />
    </div>
  );
}
