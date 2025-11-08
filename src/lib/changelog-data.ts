import {
  Camera,
  Shield,
  Users,
  Globe,
  Brain,
  Home,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface ChangelogEntry {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: "Feature" | "Improvement" | "Fix" | "Integration";
  team?: string;
  icon: LucideIcon;
  date: Date;
  week: number;
  month: number;
  year: number;
  isSpecialLaunch?: boolean;
}

// Helper function to format month name in Spanish
export function formatMonthName(month: number, year: number): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${months[month]} ${year}`;
}

// Helper function to get week label
export function getWeekLabel(week: number): string {
  const weekLabels = ["I", "II", "III", "IV"];
  return weekLabels[week - 1] ?? "I";
}

// Changelog data starting from First Week of November 2025
export const changelogEntries: ChangelogEntry[] = [
  {
    id: "1",
    title: "Lanzamiento Oficial",
    shortDescription: "Bienvenido a Vesta",
    detailedDescription:
      "Lanzamos oficialmente Vesta, la plataforma completa de gestión inmobiliaria. Incluye gestión de propiedades, contactos, calendario, integración con portales inmobiliarios (Fotocasa, Idealista), herramientas de IA para descripciones y staging virtual, y mucho más. Una solución todo-en-uno para profesionales del sector inmobiliario.",
    category: "Feature",
    team: "Product Team",
    icon: Home,
    date: new Date(2025, 10, 1), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
    isSpecialLaunch: true,
  },
  {
    id: "2",
    title: "Sistema de autenticación Better Auth",
    shortDescription: "Autenticación segura con múltiples métodos",
    detailedDescription:
      "Implementamos Better Auth como sistema de autenticación principal. Soporta inicio de sesión con email/contraseña, OAuth (Google, GitHub), autenticación de dos factores (2FA) y gestión de sesiones seguras. Todos los datos están encriptados y protegidos según los estándares más recientes.",
    category: "Feature",
    team: "Platform Features Team",
    icon: Shield,
    date: new Date(2025, 10, 2), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "3",
    title: "Gestión completa de propiedades",
    shortDescription: "Módulo robusto para administrar todas tus propiedades",
    detailedDescription:
      "Sistema completo de gestión de propiedades con soporte para múltiples tipos de inmuebles (venta, alquiler, vacacional), galería de imágenes con watermarking automático, mapas interactivos, referencias catastrales, certificados energéticos, y exportación a portales inmobiliarios. Todo lo que necesitas en un solo lugar.",
    category: "Feature",
    team: "Product Team",
    icon: Home,
    date: new Date(2025, 10, 3), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "4",
    title: "Integración con Fotocasa",
    shortDescription: "Publica tus propiedades directamente en Fotocasa",
    detailedDescription:
      "Integración completa con Fotocasa Pro API. Publica y sincroniza tus propiedades automáticamente, gestiona respuestas de clientes potenciales, y mantén tus anuncios actualizados sin esfuerzo. La sincronización es bidireccional y en tiempo real.",
    category: "Integration",
    team: "Integrations Team",
    icon: Globe,
    date: new Date(2025, 10, 4), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "5",
    title: "Módulo de contactos y CRM",
    shortDescription: "Gestión completa del ciclo de vida del cliente",
    detailedDescription:
      "Sistema CRM integrado para gestionar prospectos, leads y clientes. Incluye seguimiento de interacciones, historial de comunicaciones, gestión de preferencias de propiedades, y pipeline de ventas completo. Mantén organizadas todas tus relaciones con clientes en un solo lugar.",
    category: "Feature",
    team: "Product Team",
    icon: Users,
    date: new Date(2025, 10, 5), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "6",
    title: "Calendario y gestión de citas",
    shortDescription: "Organiza visitas y reuniones eficientemente",
    detailedDescription:
      "Calendario integrado para gestionar visitas a propiedades, reuniones con clientes y tareas importantes. Incluye recordatorios automáticos, sincronización con Google Calendar, y vista de disponibilidad en tiempo real. Nunca pierdas una cita importante.",
    category: "Feature",
    team: "Product Team",
    icon: Camera,
    date: new Date(2025, 10, 6), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "7",
    title: "Generación de descripciones con IA",
    shortDescription: "Crea descripciones atractivas automáticamente",
    detailedDescription:
      "Utiliza inteligencia artificial (OpenAI GPT-4) para generar descripciones profesionales y atractivas de propiedades. El sistema analiza las características de la propiedad y genera textos optimizados para diferentes portales y audiencias. Ahorra tiempo y mejora la calidad de tus anuncios.",
    category: "Feature",
    team: "AI Team",
    icon: Brain,
    date: new Date(2025, 10, 7), // November 2025, Week I
    week: 1,
    month: 10,
    year: 2025,
  },
  {
    id: "8",
    title: "Migración de base de datos",
    shortDescription: "A una base de datos mucho más potente y optimizada",
    detailedDescription:
      "Hemos migrado toda la infraestructura a una base de datos mucho más potente y optimizada. Esto mejora significativamente el rendimiento, la velocidad de respuesta y la capacidad de escalar. Si experimentas algún tipo de error, no dudes en reportarlo para que podamos solucionarlo de inmediato.",
    category: "Improvement",
    team: "Engineering Team",
    icon: Zap,
    date: new Date(2025, 10, 8), // November 2025, Week II
    week: 2,
    month: 10,
    year: 2025,
  },
];

// Helper function to group entries by week
export function groupEntriesByWeek(
  entries: ChangelogEntry[],
): Record<string, ChangelogEntry[]> {
  const grouped: Record<string, ChangelogEntry[]> = {};

  entries.forEach((entry) => {
    const key = `${entry.year}-${entry.month}-${entry.week}`;
    grouped[key] ??= [];
    const entries = grouped[key];
    if (entries) {
      entries.push(entry);
    }
  });

  // Sort entries within each week by date
  Object.keys(grouped).forEach((key) => {
    const entries = grouped[key];
    if (entries) {
      entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  });

  return grouped;
}

// Helper function to get all unique categories
export function getCategories(entries: ChangelogEntry[]): string[] {
  const categories = new Set(entries.map((entry) => entry.category));
  return Array.from(categories).sort();
}

// Helper function to get all unique teams
export function getTeams(entries: ChangelogEntry[]): string[] {
  const teams = new Set(
    entries.filter((entry) => entry.team).map((entry) => entry.team!),
  );
  return Array.from(teams).sort();
}

