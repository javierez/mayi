import type {
  TaskNotificationSettings,
  OverdueTaskNotificationSettings,
  TaskEventNotificationSettings,
  AppointmentNotificationSettings,
  AppointmentEventNotificationSettings,
  QuietHoursSettings,
  CustomerAppointmentNotificationSettings,
  CustomerPropertyNotificationSettings,
  CustomerDocumentNotificationSettings,
  CustomerDealNotificationSettings,
  MailSettings,
} from "./types";

// Default notification options factory for upcoming tasks
export const createDefaultTaskNotifications = (
  urgencyLevel: "critical" | "urgent" | "other",
): TaskNotificationSettings => ({
  weeklyBriefing: {
    id: `${urgencyLevel}-weekly-briefing`,
    label: "Incluir en resumen semanal",
    description: "Recibe un resumen semanal los lunes a las 9:00 AM",
    emailEnabled: urgencyLevel === "critical" || urgencyLevel === "urgent",
    smsEnabled: false,
  },
  dailyBriefing: {
    id: `${urgencyLevel}-daily-briefing`,
    label: "Incluir en resumen diario",
    description: "Recibe un resumen diario a las 9:00 AM",
    emailEnabled: urgencyLevel === "critical",
    smsEnabled: false,
  },
  dueIn1Week: {
    id: `${urgencyLevel}-due-1-week`,
    label: "Notificar 1 semana antes",
    description: "Recibe una notificacion cuando falte 1 semana",
    emailEnabled: false,
    smsEnabled: false,
  },
  dueIn48h: {
    id: `${urgencyLevel}-due-48h`,
    label: "Notificar 48 horas antes",
    description: "Recibe una notificacion cuando falten 48 horas",
    emailEnabled: false,
    smsEnabled: false,
  },
  dueIn24h: {
    id: `${urgencyLevel}-due-24h`,
    label: "Notificar 24 horas antes",
    description: "Recibe una notificacion cuando falten 24 horas",
    emailEnabled: urgencyLevel === "critical" || urgencyLevel === "urgent",
    smsEnabled: urgencyLevel === "critical",
  },
  dueIn12h: {
    id: `${urgencyLevel}-due-12h`,
    label: "Notificar 12 horas antes",
    description: "Recibe una notificacion cuando falten 12 horas",
    emailEnabled: urgencyLevel === "critical",
    smsEnabled: urgencyLevel === "critical",
  },
  dueIn2h: {
    id: `${urgencyLevel}-due-2h`,
    label: "Notificar 2 horas antes",
    description: "Recibe una notificacion cuando falten 2 horas",
    emailEnabled: urgencyLevel === "critical",
    smsEnabled: urgencyLevel === "critical",
  },
  dueIn1h: {
    id: `${urgencyLevel}-due-1h`,
    label: "Notificar 1 hora antes",
    description: "Recibe una notificacion cuando falte 1 hora",
    emailEnabled: urgencyLevel === "critical",
    smsEnabled: urgencyLevel === "critical",
  },
});

// Default overdue task notifications
export const createDefaultOverdueNotifications = (): OverdueTaskNotificationSettings => ({
  weeklyDigest: {
    id: "overdue-weekly-digest",
    label: "Resumen semanal de tareas vencidas",
    description: "Recibe un resumen los lunes con todas las tareas vencidas",
    emailEnabled: true,
    smsEnabled: false,
  },
  dailyDigest: {
    id: "overdue-daily-digest",
    label: "Resumen diario de tareas vencidas",
    description: "Recibe un resumen diario con las tareas vencidas",
    emailEnabled: false,
    smsEnabled: false,
  },
  notifyWhenOverdue: {
    id: "overdue-notify-immediately",
    label: "Notificar cuando una tarea critica se venza",
    description:
      "Recibe una notificacion inmediata cuando una tarea critica (urgencia 5) pase su fecha limite",
    emailEnabled: true,
    smsEnabled: true,
  },
});

// Default task event notifications
export const createDefaultTaskEventNotifications = (): TaskEventNotificationSettings => ({
  taskAssigned: {
    id: "task-assigned",
    label: "Tarea asignada",
    description: "Notificar cuando alguien te asigne una tarea",
    emailEnabled: true,
    smsEnabled: false,
    urgencyLevels: [1, 2, 3, 4, 5], // Default to all urgency levels
  },
  taskCompleted: {
    id: "task-completed",
    label: "Tarea completada",
    description: "Notificar cuando se complete una tarea que creaste o sigues",
    emailEnabled: true,
    smsEnabled: false,
  },
  taskReassigned: {
    id: "task-reassigned",
    label: "Tarea reasignada",
    description: "Notificar cuando una tarea tuya sea reasignada a otra persona",
    emailEnabled: true,
    smsEnabled: false,
  },
});

export const createDefaultAppointmentNotifications = (
  appointmentType: string,
): AppointmentNotificationSettings => ({
  weeklyBriefing: {
    id: `${appointmentType}-weekly-briefing`,
    label: "Incluir en resumen semanal",
    description: "Incluir las citas de esta semana en el resumen semanal",
    emailEnabled: true,
    smsEnabled: false,
  },
  dailyBriefing: {
    id: `${appointmentType}-daily-briefing`,
    label: "Incluir en resumen diario",
    description: "Incluir las citas de manana en el resumen diario",
    emailEnabled: true,
    smsEnabled: false,
  },
  notify24h: {
    id: `${appointmentType}-notify-24h`,
    label: "Notificar 24 horas antes",
    description: "Recibe una notificacion 24 horas antes de la cita",
    emailEnabled: true,
    smsEnabled: false,
  },
  notify12h: {
    id: `${appointmentType}-notify-12h`,
    label: "Notificar 12 horas antes",
    description: "Recibe una notificacion 12 horas antes de la cita",
    emailEnabled: false,
    smsEnabled: false,
  },
  notify1h: {
    id: `${appointmentType}-notify-1h`,
    label: "Notificar 1 hora antes",
    description: "Recibe una notificacion 1 hora antes de la cita",
    emailEnabled: true,
    smsEnabled: true,
  },
  notify30min: {
    id: `${appointmentType}-notify-30min`,
    label: "Notificar 30 minutos antes",
    description: "Recibe una notificacion 30 minutos antes de la cita",
    emailEnabled: false,
    smsEnabled: true,
  },
  notifyTravelTime: {
    id: `${appointmentType}-notify-travel`,
    label: "Notificar antes de salir",
    description:
      "Recibe una notificacion 30 minutos antes de que debas salir (considerando tiempo de viaje)",
    emailEnabled: false,
    smsEnabled: false,
  },
});

// Default appointment event notifications
export const createDefaultAppointmentEventNotifications =
  (): AppointmentEventNotificationSettings => ({
    appointmentScheduled: {
      id: "appointment-scheduled",
      label: "Cita programada",
      description: "Notificar cuando alguien programe una cita para ti",
      emailEnabled: true,
      smsEnabled: false,
    },
    appointmentRescheduled: {
      id: "appointment-rescheduled",
      label: "Cita reprogramada",
      description: "Notificar cuando una cita sea reprogramada",
      emailEnabled: true,
      smsEnabled: true,
    },
    appointmentCancelled: {
      id: "appointment-cancelled",
      label: "Cita cancelada",
      description: "Notificar cuando una cita sea cancelada",
      emailEnabled: true,
      smsEnabled: true,
    },
  });

// Default quiet hours settings
export const createDefaultQuietHours = (): QuietHoursSettings => ({
  enabled: false,
  startTime: "22:00",
  endTime: "08:00",
  days: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  },
});

// Default customer appointment notifications
export const createDefaultCustomerAppointmentNotifications = (
  appointmentType: string,
): CustomerAppointmentNotificationSettings => ({
  notify24h: {
    id: `customer-${appointmentType}-notify-24h`,
    label: "Notificar 24 horas antes",
    description: "Enviar notificación 24 horas antes de la cita",
    emailEnabled: true,
    smsEnabled: false,
  },
  notify12h: {
    id: `customer-${appointmentType}-notify-12h`,
    label: "Notificar 12 horas antes",
    description: "Enviar notificación 12 horas antes de la cita",
    emailEnabled: false,
    smsEnabled: false,
  },
  notify1h: {
    id: `customer-${appointmentType}-notify-1h`,
    label: "Notificar 1 hora antes",
    description: "Enviar notificación 1 hora antes de la cita",
    emailEnabled: true,
    smsEnabled: true,
  },
  notify30min: {
    id: `customer-${appointmentType}-notify-30min`,
    label: "Notificar 30 minutos antes",
    description: "Enviar notificación 30 minutos antes de la cita",
    emailEnabled: false,
    smsEnabled: true,
  },
  notifyTravelTime: {
    id: `customer-${appointmentType}-notify-travel`,
    label: "Notificar antes de salir",
    description:
      "Enviar notificación considerando tiempo de viaje (si aplica)",
    emailEnabled: false,
    smsEnabled: false,
  },
});

// Default customer property notifications
export const createDefaultCustomerPropertyNotifications =
  (): CustomerPropertyNotificationSettings => ({
    newListing: {
      id: "customer-property-new-listing",
      label: "Nueva propiedad disponible",
      description: "Notificar cuando se publique una nueva propiedad de interés",
      emailEnabled: true,
      smsEnabled: false,
    },
    priceChange: {
      id: "customer-property-price-change",
      label: "Cambio de precio",
      description: "Notificar cuando cambie el precio de una propiedad",
      emailEnabled: true,
      smsEnabled: false,
    },
    statusChange: {
      id: "customer-property-status-change",
      label: "Cambio de estado",
      description: "Notificar cuando cambie el estado de una propiedad (vendida, alquilada, etc.)",
      emailEnabled: true,
      smsEnabled: true,
    },
    newPhotos: {
      id: "customer-property-new-photos",
      label: "Nuevas fotos",
      description: "Notificar cuando se añadan nuevas fotos a una propiedad",
      emailEnabled: false,
      smsEnabled: false,
    },
  });

// Default customer document notifications
export const createDefaultCustomerDocumentNotifications =
  (): CustomerDocumentNotificationSettings => ({
    documentReady: {
      id: "customer-document-ready",
      label: "Documento listo",
      description: "Notificar cuando un documento esté listo para revisión",
      emailEnabled: true,
      smsEnabled: false,
    },
    signatureRequired: {
      id: "customer-document-signature-required",
      label: "Firma requerida",
      description: "Notificar cuando se requiera una firma en un documento",
      emailEnabled: true,
      smsEnabled: true,
    },
    documentExpiring: {
      id: "customer-document-expiring",
      label: "Documento próximo a vencer",
      description: "Notificar cuando un documento esté próximo a vencer",
      emailEnabled: true,
      smsEnabled: false,
    },
  });

// Default customer deal notifications
export const createDefaultCustomerDealNotifications =
  (): CustomerDealNotificationSettings => ({
    offerReceived: {
      id: "customer-deal-offer-received",
      label: "Oferta recibida",
      description: "Notificar cuando se reciba una oferta en una operación",
      emailEnabled: true,
      smsEnabled: true,
    },
    offerAccepted: {
      id: "customer-deal-offer-accepted",
      label: "Oferta aceptada",
      description: "Notificar cuando se acepte una oferta",
      emailEnabled: true,
      smsEnabled: true,
    },
    dealClosed: {
      id: "customer-deal-closed",
      label: "Operación cerrada",
      description: "Notificar cuando se cierre una operación",
      emailEnabled: true,
      smsEnabled: true,
    },
    paymentReceived: {
      id: "customer-deal-payment-received",
      label: "Pago recibido",
      description: "Notificar cuando se reciba un pago relacionado con la operación",
      emailEnabled: true,
      smsEnabled: false,
    },
  });

// Initial default settings
export const defaultSettings: MailSettings = {
  tasks: {
    critical: createDefaultTaskNotifications("critical"),
    urgent: createDefaultTaskNotifications("urgent"),
    other: createDefaultTaskNotifications("other"),
    overdue: createDefaultOverdueNotifications(),
    events: createDefaultTaskEventNotifications(),
  },
  appointments: {
    visita: createDefaultAppointmentNotifications("visita"),
    firma: createDefaultAppointmentNotifications("firma"),
    reunion: createDefaultAppointmentNotifications("reunion"),
    llamada: createDefaultAppointmentNotifications("llamada"),
    cierre: createDefaultAppointmentNotifications("cierre"),
    viaje: createDefaultAppointmentNotifications("viaje"),
    events: createDefaultAppointmentEventNotifications(),
  },
  customers: {
    appointments: {
      visita: createDefaultCustomerAppointmentNotifications("visita"),
      firma: createDefaultCustomerAppointmentNotifications("firma"),
      reunion: createDefaultCustomerAppointmentNotifications("reunion"),
      llamada: createDefaultCustomerAppointmentNotifications("llamada"),
      cierre: createDefaultCustomerAppointmentNotifications("cierre"),
      viaje: createDefaultCustomerAppointmentNotifications("viaje"),
    },
    properties: createDefaultCustomerPropertyNotifications(),
    documents: createDefaultCustomerDocumentNotifications(),
    deals: createDefaultCustomerDealNotifications(),
  },
  quietHours: createDefaultQuietHours(),
};

// Task category configuration for upcoming tasks
export const taskCategories = [
  {
    id: "critical" as const,
    title: "Tareas Críticas",
    description: "Urgencia = 5",
  },
  {
    id: "urgent" as const,
    title: "Tareas Urgentes",
    description: "Urgencia = 3, 4",
  },
  {
    id: "other" as const,
    title: "Otras Tareas",
    description: "Urgencia = 1, 2",
  },
];

// Appointment type configuration
export const appointmentTypes = [
  {
    id: "visita" as const,
    title: "Visitas",
  },
  {
    id: "firma" as const,
    title: "Firmas",
  },
  {
    id: "reunion" as const,
    title: "Reuniones",
  },
  {
    id: "llamada" as const,
    title: "Llamadas",
  },
  {
    id: "cierre" as const,
    title: "Cierres",
  },
  {
    id: "viaje" as const,
    title: "Viajes",
  },
];

// Days of the week for quiet hours
export const daysOfWeek = [
  { id: "monday" as const, label: "L", fullLabel: "Lunes" },
  { id: "tuesday" as const, label: "M", fullLabel: "Martes" },
  { id: "wednesday" as const, label: "X", fullLabel: "Miércoles" },
  { id: "thursday" as const, label: "J", fullLabel: "Jueves" },
  { id: "friday" as const, label: "V", fullLabel: "Viernes" },
  { id: "saturday" as const, label: "S", fullLabel: "Sábado" },
  { id: "sunday" as const, label: "D", fullLabel: "Domingo" },
];

// Time options for quiet hours
export const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

