import { Home, Calendar, Users } from "lucide-react";
import type { EmptyStateType } from "~/types/activity";

interface EmptyStateProps {
  type: EmptyStateType;
}

export function EmptyState({ type }: EmptyStateProps) {
  const states = {
    "completed-visits": {
      Icon: Home,
      title: "No hay visitas realizadas aún",
      subtitle: "Las visitas completadas aparecerán aquí",
    },
    "scheduled-visits": {
      Icon: Calendar,
      title: "No hay visitas programadas",
      subtitle: "Programa una visita para este inmueble",
    },
    "new-contacts": {
      Icon: Users,
      title: "No hay contactos nuevos",
      subtitle: "Los contactos recientes aparecerán aquí",
    },
  };

  const state = states[type];
  const Icon = state.Icon;

  return (
    <div className="py-16 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-8 w-8 text-gray-300" />
      </div>
      <p className="mb-2 text-base font-medium text-gray-500">{state.title}</p>
      <p className="text-sm text-gray-400">{state.subtitle}</p>
    </div>
  );
}
