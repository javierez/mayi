/**
 * WhatsApp Template Types and SIDs
 *
 * Template SIDs are assigned by Twilio after templates are approved.
 * Update these values once your templates are approved in the Twilio Console.
 *
 * Template specifications are documented in: docs/whatsapp-templates.md
 */

/**
 * WhatsApp Content Template SIDs
 * These are placeholder values - update with actual SIDs after Twilio approval
 */
export const WHATSAPP_TEMPLATE_SIDS = {
  // Task Templates
  task_assigned: "HX_PLACEHOLDER_TASK_ASSIGNED",
  task_completed: "HX_PLACEHOLDER_TASK_COMPLETED",
  task_reassigned: "HX_PLACEHOLDER_TASK_REASSIGNED",
  task_due_soon: "HX_PLACEHOLDER_TASK_DUE_SOON",
  task_overdue: "HX_PLACEHOLDER_TASK_OVERDUE",

  // Appointment Templates
  apt_scheduled: "HX_PLACEHOLDER_APT_SCHEDULED",
  apt_rescheduled: "HX_PLACEHOLDER_APT_RESCHEDULED",
  apt_cancelled: "HX_PLACEHOLDER_APT_CANCELLED",
  apt_reminder: "HX_PLACEHOLDER_APT_REMINDER",

  // Conversation Templates (for re-engaging contacts after 24h window)
  re_engagement: "HX_PLACEHOLDER_RE_ENGAGEMENT",
} as const;

export type WhatsAppTemplateType = keyof typeof WHATSAPP_TEMPLATE_SIDS;

/**
 * Check if a template SID is configured (not a placeholder)
 */
export function isTemplateConfigured(templateType: WhatsAppTemplateType): boolean {
  const sid = WHATSAPP_TEMPLATE_SIDS[templateType];
  return sid.startsWith("HX") && !sid.includes("PLACEHOLDER");
}

/**
 * Urgency level labels for Spanish display
 */
export const URGENCY_LABELS: Record<number, string> = {
  1: "Baja",
  2: "Media",
  3: "Alta",
  4: "Urgente",
  5: "Critica",
};

/**
 * Appointment type labels for Spanish display
 */
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  visita: "Visita",
  firma: "Firma",
  reunion: "Reunion",
  llamada: "Llamada",
  cierre: "Cierre",
  viaje: "Viaje",
};

/**
 * Contact type labels for Spanish display
 */
export const CONTACT_TYPE_LABELS: Record<string, string> = {
  owner: "Propietario",
  buyer: "Comprador",
  contact: "Contacto",
};

/**
 * Appointment tips by type (for reminder templates)
 */
export const APPOINTMENT_TIPS: Record<string, string> = {
  visita: "Verifica llaves - Ten ficha del inmueble - Prepara respuestas FAQ",
  firma: "Verifica documentos - Confirma DNI/NIE - Revisa contrato - Lleva copias",
  reunion: "Prepara puntos a tratar - Ten documentacion lista - Confirma asistentes",
  cierre: "Verifica documentacion - Confirma entrega llaves - Revisa pagos - Prepara acta",
  viaje: "Confirma direccion - Calcula tiempo con margen - Ten contacto a mano",
  llamada: "Ten info del cliente lista - Prepara puntos a discutir - Lugar tranquilo",
};
