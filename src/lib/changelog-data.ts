import {
  Camera,
  BarChart3,
  Monitor,
  AlertTriangle,
  FlaskConical,
  Search,
  Shield,
  Zap,
  Users,
  Globe,
  Palette,
  Brain,
  MessageSquare,
  Key,
  Home,
  Megaphone,
  Image as ImageIcon,
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

// Sample changelog data - 5 months ago from now (approximately August 2024 to December 2024)
// Adjust dates based on actual start date
export const changelogEntries: ChangelogEntry[] = [
  {
    id: "1",
    title: "2FA enforcement",
    shortDescription: "Autenticación de dos factores obligatoria para mayor seguridad",
    detailedDescription:
      "Implementamos la autenticación de dos factores (2FA) como requisito obligatorio para todas las cuentas. Esto mejora significativamente la seguridad de los datos de tus clientes y propiedades. Los usuarios pueden configurar 2FA mediante aplicaciones autenticadoras o SMS.",
    category: "Feature",
    team: "Platform Features Team",
    icon: Shield,
    date: new Date(2024, 7, 5), // August 2024, Week I
    week: 1,
    month: 7,
    year: 2024,
  },
  {
    id: "2",
    title: "Unstacked bar charts",
    shortDescription: "Nuevos gráficos de barras para análisis de datos",
    detailedDescription:
      "Añadimos gráficos de barras no apilados en el módulo de análisis. Esto permite comparar mejor los datos entre diferentes categorías y períodos de tiempo. Los gráficos son interactivos y se pueden exportar en diferentes formatos.",
    category: "Feature",
    team: "Product Analytics Team",
    icon: BarChart3,
    date: new Date(2024, 7, 12), // August 2024, Week II
    week: 2,
    month: 7,
    year: 2024,
  },
  {
    id: "3",
    title: "Better UI for path cleaning rules",
    shortDescription: "Interfaz mejorada para reglas de limpieza de rutas",
    detailedDescription:
      "Rediseñamos completamente la interfaz de usuario para las reglas de limpieza de rutas. Ahora es más intuitiva y fácil de usar, con una vista previa en tiempo real de cómo se aplicarán las reglas a tus datos.",
    category: "Improvement",
    team: "Platform Features Team",
    icon: Monitor,
    date: new Date(2024, 7, 19), // August 2024, Week III
    week: 3,
    month: 7,
    year: 2024,
  },
  {
    id: "4",
    title: "Export session replays as GIFs or MP4s",
    shortDescription: "Exporta grabaciones de sesión en múltiples formatos",
    detailedDescription:
      "Ahora puedes exportar las grabaciones de sesión de usuarios en formato GIF o MP4. Esto facilita compartir información con tu equipo o clientes. Los archivos se generan automáticamente y se pueden descargar desde el panel de administración.",
    category: "Feature",
    team: "Replay Team",
    icon: Camera,
    date: new Date(2024, 7, 26), // August 2024, Week IV
    week: 4,
    month: 7,
    year: 2024,
  },
  {
    id: "5",
    title: "Batch open error tracking issues",
    shortDescription: "Apertura masiva de incidencias de seguimiento de errores",
    detailedDescription:
      "Implementamos la funcionalidad de abrir múltiples incidencias de seguimiento de errores a la vez. Esto ahorra tiempo cuando necesitas reportar varios problemas relacionados. Puedes seleccionar múltiples errores y abrirlos todos con un solo clic.",
    category: "Improvement",
    team: "Platform Features Team",
    icon: AlertTriangle,
    date: new Date(2024, 8, 2), // September 2024, Week I
    week: 1,
    month: 8,
    year: 2024,
  },
  {
    id: "6",
    title: "Configurable recalculation time",
    shortDescription: "Tiempo de recálculo configurable para análisis",
    detailedDescription:
      "Ahora puedes configurar el tiempo de recálculo para los análisis automáticos. Esto te permite optimizar el rendimiento según tus necesidades. Puedes elegir entre recálculos en tiempo real, cada hora, diarios o semanales.",
    category: "Feature",
    team: "Product Analytics Team",
    icon: FlaskConical,
    date: new Date(2024, 8, 9), // September 2024, Week II
    week: 2,
    month: 8,
    year: 2024,
  },
  {
    id: "7",
    title: "Custom model pricing",
    shortDescription: "Precios personalizados para modelos de IA",
    detailedDescription:
      "Implementamos un sistema de precios personalizados para modelos de IA. Ahora puedes configurar diferentes precios según el tipo de modelo y el uso. Esto te da más control sobre los costos de las funcionalidades de IA.",
    category: "Feature",
    team: "Product Analytics Team",
    icon: Search,
    date: new Date(2024, 8, 16), // September 2024, Week III
    week: 3,
    month: 8,
    year: 2024,
  },
  {
    id: "8",
    title: "Unified role-based access control (RBAC)",
    shortDescription: "Control de acceso unificado basado en roles",
    detailedDescription:
      "Lanzamos un sistema unificado de control de acceso basado en roles (RBAC) en toda la plataforma. Esto simplifica la gestión de permisos y hace que sea más fácil asignar roles a los miembros del equipo. Los roles se pueden personalizar según las necesidades de tu inmobiliaria.",
    category: "Feature",
    team: "Platform Features Team",
    icon: Shield,
    date: new Date(2024, 8, 23), // September 2024, Week IV
    week: 4,
    month: 8,
    year: 2024,
  },
  {
    id: "9",
    title: "Mejoras en el editor de carteles",
    shortDescription: "Nuevas plantillas y herramientas de diseño",
    detailedDescription:
      "Añadimos nuevas plantillas profesionales y herramientas de diseño mejoradas al editor de carteles. Ahora puedes crear carteles más atractivos con menos esfuerzo. Las nuevas herramientas incluyen ajustes de color avanzados, efectos de texto y más opciones de diseño.",
    category: "Improvement",
    team: "Design Team",
    icon: Palette,
    date: new Date(2024, 9, 7), // October 2024, Week I
    week: 1,
    month: 9,
    year: 2024,
  },
  {
    id: "10",
    title: "Asistente IA mejorado",
    shortDescription: "Respuestas más precisas y contexto mejorado",
    detailedDescription:
      "Mejoramos significativamente el asistente de IA con respuestas más precisas y un mejor entendimiento del contexto. El asistente ahora puede manejar consultas más complejas y proporcionar información más relevante sobre propiedades y contactos.",
    category: "Improvement",
    team: "AI Team",
    icon: Brain,
    date: new Date(2024, 9, 14), // October 2024, Week II
    week: 2,
    month: 9,
    year: 2024,
  },
  {
    id: "11",
    title: "Integración con WhatsApp Business",
    shortDescription: "Conecta tu WhatsApp Business para comunicación automatizada",
    detailedDescription:
      "Lanzamos la integración con WhatsApp Business. Ahora puedes conectar tu cuenta de WhatsApp Business para enviar mensajes automáticos a clientes, recibir consultas y gestionar conversaciones directamente desde Vesta. La integración incluye respuestas automáticas impulsadas por IA.",
    category: "Integration",
    team: "Integrations Team",
    icon: MessageSquare,
    date: new Date(2024, 9, 21), // October 2024, Week III
    week: 3,
    month: 9,
    year: 2024,
  },
  {
    id: "12",
    title: "Home Staging con IA",
    shortDescription: "Herramientas de staging virtual mejoradas",
    detailedDescription:
      "Mejoramos las herramientas de home staging con IA. Ahora puedes generar imágenes de staging más realistas y con mejor calidad. El sistema puede sugerir diferentes estilos de decoración y aplicar cambios automáticamente a las imágenes de tus propiedades.",
    category: "Feature",
    team: "AI Team",
    icon: ImageIcon,
    date: new Date(2024, 9, 28), // October 2024, Week IV
    week: 4,
    month: 9,
    year: 2024,
  },
  {
    id: "13",
    title: "Gestión de alquileres - Beta",
    shortDescription: "Nuevo módulo para gestión completa de alquileres",
    detailedDescription:
      "Lanzamos la versión beta del módulo de gestión de alquileres. Incluye gestión de contratos, control de pagos y fianzas, calendario de vencimientos y gestión de incidencias. Este módulo está disponible para usuarios que lo soliciten y estamos recopilando feedback para mejoras futuras.",
    category: "Feature",
    team: "Product Team",
    icon: Key,
    date: new Date(2024, 10, 4), // November 2024, Week I
    week: 1,
    month: 10,
    year: 2024,
  },
  {
    id: "14",
    title: "Optimización de rendimiento",
    shortDescription: "Mejoras significativas en la velocidad de carga",
    detailedDescription:
      "Optimizamos el rendimiento de la plataforma con mejoras en la velocidad de carga de páginas y consultas a la base de datos. Las páginas ahora cargan hasta un 40% más rápido, especialmente en listados con muchas propiedades y contactos.",
    category: "Improvement",
    team: "Engineering Team",
    icon: Zap,
    date: new Date(2024, 10, 11), // November 2024, Week II
    week: 2,
    month: 10,
    year: 2024,
  },
  {
    id: "15",
    title: "Corrección de errores en exportación PDF",
    shortDescription: "Solucionados problemas al exportar documentos PDF",
    detailedDescription:
      "Corregimos varios errores relacionados con la exportación de documentos PDF. Ahora todos los documentos se exportan correctamente con el formato y diseño esperados. También mejoramos la calidad de las imágenes incluidas en los PDFs.",
    category: "Fix",
    team: "Engineering Team",
    icon: AlertTriangle,
    date: new Date(2024, 10, 18), // November 2024, Week III
    week: 3,
    month: 10,
    year: 2024,
  },
  {
    id: "16",
    title: "Gestión de comunidades - Beta",
    shortDescription: "Nuevo módulo para administración de comunidades",
    detailedDescription:
      "Lanzamos la versión beta del módulo de gestión de comunidades de propietarios. Incluye gestión de juntas y actas, control de gastos comunes, comunicación con propietarios y calendario de reuniones. Este módulo está disponible para usuarios que lo soliciten.",
    category: "Feature",
    team: "Product Team",
    icon: Home,
    date: new Date(2024, 10, 25), // November 2024, Week IV
    week: 4,
    month: 10,
    year: 2024,
  },
  {
    id: "17",
    title: "Mejoras en SEO-SEM",
    shortDescription: "Nuevas herramientas de análisis y optimización",
    detailedDescription:
      "Añadimos nuevas herramientas de análisis SEO-SEM que te permiten ver el rendimiento de tus campañas en tiempo real. Incluye análisis de palabras clave mejorado, sugerencias de optimización automáticas y reportes más detallados.",
    category: "Improvement",
    team: "Marketing Team",
    icon: Megaphone,
    date: new Date(2024, 11, 2), // December 2024, Week I
    week: 1,
    month: 11,
    year: 2024,
  },
  {
    id: "18",
    title: "Sincronización mejorada con portales",
    shortDescription: "Sincronización más rápida y confiable con portales inmobiliarios",
    detailedDescription:
      "Mejoramos la sincronización con portales inmobiliarios como Fotocasa e Idealista. Ahora la sincronización es más rápida, confiable y maneja mejor los errores. También añadimos soporte para sincronización bidireccional en algunos portales.",
    category: "Improvement",
    team: "Integrations Team",
    icon: Globe,
    date: new Date(2024, 11, 9), // December 2024, Week II
    week: 2,
    month: 11,
    year: 2024,
  },
  {
    id: "19",
    title: "Colaboración en equipo mejorada",
    shortDescription: "Nuevas funciones de colaboración y comunicación",
    detailedDescription:
      "Añadimos nuevas funciones de colaboración que facilitan el trabajo en equipo. Incluye comentarios en tiempo real, notificaciones mejoradas, y mejor gestión de tareas compartidas. Los equipos ahora pueden trabajar de forma más eficiente.",
    category: "Feature",
    team: "Product Team",
    icon: Users,
    date: new Date(2024, 11, 16), // December 2024, Week III
    week: 3,
    month: 11,
    year: 2024,
  },
  {
    id: "20",
    title: "Actualización de seguridad",
    shortDescription: "Mejoras en seguridad y protección de datos",
    detailedDescription:
      "Implementamos mejoras importantes en seguridad, incluyendo encriptación mejorada de datos, auditoría de accesos y nuevas medidas de protección contra amenazas. Todos los datos están ahora más protegidos y cumplimos con los últimos estándares de seguridad.",
    category: "Improvement",
    team: "Security Team",
    icon: Shield,
    date: new Date(2024, 11, 23), // December 2024, Week IV
    week: 4,
    month: 11,
    year: 2024,
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

