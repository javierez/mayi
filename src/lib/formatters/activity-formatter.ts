import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { ListingActivityAction } from "~/lib/constants/listing-activity-actions";
import type { ContactActivityAction } from "~/lib/constants/contact-activity-actions";
import type { ListingContactActivityAction } from "~/lib/constants/listing-contact-activity-actions";
import { CONTACT_ACTIVITY_LABELS } from "~/lib/constants/contact-activity-actions";
import { LISTING_CONTACT_ACTIVITY_LABELS } from "~/lib/constants/listing-contact-activity-actions";
import {
  TrendingDown,
  RefreshCw,
  Users,
  Upload,
  Globe,
  FileText,
  Image,
  Key,
  Eye,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  UserPlus,
  UserMinus,
  Shield,
  FileCheck,
  Handshake,
  type LucideIcon,
} from "lucide-react";

// Union type for all activity actions
export type AllActivityAction = ListingActivityAction | ContactActivityAction | ListingContactActivityAction;

/**
 * Get Spanish label for activity action
 */
export function getActivityActionLabel(action: AllActivityAction): string {
  // Check if it's a contact activity action
  if (action in CONTACT_ACTIVITY_LABELS) {
    return CONTACT_ACTIVITY_LABELS[action as ContactActivityAction];
  }

  // Check if it's a listing contact activity action
  if (action in LISTING_CONTACT_ACTIVITY_LABELS) {
    return LISTING_CONTACT_ACTIVITY_LABELS[action as ListingContactActivityAction];
  }

  // Listing activity actions
  const labels: Record<ListingActivityAction, string> = {
    price_changed: "Precio modificado",
    status_changed: "Estado cambiado",
    agent_reassigned: "Agente reasignado",
    portal_published: "Publicado en portal",
    portal_unpublished: "Despublicado de portal",
    description_changed: "Descripción modificada",
    images_updated: "Imágenes actualizadas",
    featured_toggled: "Estado destacado cambiado",
    listing_type_changed: "Tipo de operación cambiado",
    specifications_updated: "Especificaciones actualizadas",
    keys_received: "Llaves recibidas",
    visibility_changed: "Visibilidad cambiada",
    website_publication_toggled: "Publicación web cambiada",
    activated: "Activado",
    deactivated: "Desactivado",
    portal_sync_error: "Error de sincronización portal",
    portal_settings_updated: "Configuración portal actualizada",
    views_milestone: "Hito de visualizaciones",
    inquiry_received: "Consulta recibida",
    document_uploaded: "Documento subido",
    virtual_tour_added: "Tour virtual añadido",
    // Fotocasa portal actions
    fotocasa_published: "Publicado en Fotocasa",
    fotocasa_updated: "Actualizado en Fotocasa",
    fotocasa_deleted: "Eliminado de Fotocasa",
    // Portal selection toggles
    website_published: "Publicado en web",
    website_unpublished: "Despublicado de web",
    keys_returned: "Llaves devueltas",
    cartel_placed: "Cartel colocado",
    cartel_removed: "Cartel retirado",
    escaparate_added: "Añadido a escaparate",
    escaparate_removed: "Retirado de escaparate",
  };

  return labels[action as ListingActivityAction] ?? action;
}

/**
 * Get color variant for activity action type
 * Keep neutral/colorless for all actions
 */
export function getActivityActionColor(
  _action: AllActivityAction,
): "default" | "secondary" | "destructive" | "outline" {
  // Keep all actions neutral/colorless - use outline for all
  return "outline";
}

/**
 * Get icon for activity action type
 */
export function getActivityActionIcon(
  action: AllActivityAction,
): LucideIcon {
  // Contact activity icons
  if (action === "email_sent") return Mail;
  if (action === "whatsapp_sent") return MessageSquare;
  if (action === "call_logged") return Phone;
  if (action === "viewing_completed") return Calendar;
  if (action === "notes_added") return FileText;
  if (action === "contact_created") return UserPlus;
  if (action === "contact_deactivated") return UserMinus;
  if (action === "contact_merged") return Users;
  if (action.startsWith("consent") || action.startsWith("gdpr") || action === "do_not_contact_set") return Shield;

  // Listing contact activity icons
  if (action === "appointment_scheduled" || action === "appointment_cancelled" || action === "appointment_rescheduled") return Calendar;
  if (action === "offer_received" || action === "offer_accepted" || action === "offer_rejected" || action === "counter_offer_made") return Handshake;
  if (action === "deal_created") return FileCheck;
  if (action === "document_requested" || action === "document_received") return FileText;

  // Listing activity icons
  const listingIconMap: Partial<Record<ListingActivityAction, LucideIcon>> = {
    price_changed: TrendingDown,
    agent_reassigned: Users,
    portal_published: Globe,
    portal_unpublished: Globe,
    description_changed: FileText,
    images_updated: Image,
    keys_received: Key,
    visibility_changed: Eye,
    document_uploaded: Upload,
  };

  return listingIconMap[action as ListingActivityAction] ?? RefreshCw;
}

/**
 * Format activity summary text based on action type and details
 */
export function formatActivitySummary(
  action: AllActivityAction,
  details: Record<string, unknown>,
): string {
  // Contact activity summaries
  if (action === "email_sent" || action === "whatsapp_sent" || action === "call_logged") {
    const topic = details.topic as string | undefined;
    const notes = details.notes as string | undefined;
    if (topic) return topic;
    if (notes) {
      const firstSentence = notes.split(/[.!?]/)[0]?.trim() ?? "";
      return firstSentence.length > 50 ? firstSentence.substring(0, 50) + "..." : firstSentence || getActivityActionLabel(action);
    }
    return getActivityActionLabel(action);
  }

  if (action === "viewing_completed" || action === "notes_added") {
    const topic = details.topic as string | undefined;
    const notes = details.notes as string | undefined;
    if (topic) return topic;
    if (notes) {
      const firstSentence = notes.split(/[.!?]/)[0]?.trim() ?? "";
      return firstSentence.length > 50 ? firstSentence.substring(0, 50) + "..." : firstSentence || getActivityActionLabel(action);
    }
    return getActivityActionLabel(action);
  }

  // Listing contact activity summaries
  if (action === "offer_received" || action === "offer_accepted" || action === "offer_rejected") {
    const offerAmount = details.offerAmount as number | undefined;
    if (offerAmount) {
      return `${getActivityActionLabel(action)}: €${offerAmount.toLocaleString("es-ES")}`;
    }
    return getActivityActionLabel(action);
  }

  if (action === "appointment_scheduled" || action === "appointment_cancelled" || action === "appointment_rescheduled") {
    const appointmentDate = details.appointmentDate as string | undefined;
    if (appointmentDate) {
      const date = new Date(appointmentDate);
      return `${getActivityActionLabel(action)}: ${date.toLocaleDateString("es-ES")}`;
    }
    return getActivityActionLabel(action);
  }

  // Listing activity summaries
  switch (action) {
    case "price_changed": {
      const changeType = details.changeType as string;
      const percentChange = details.percentChange as number;
      const oldValue = details.oldValue as number;
      const newValue = details.newValue as number;

      if (changeType === "reduction") {
        return `Precio reducido ${Math.abs(percentChange).toFixed(1)}% (€${oldValue.toLocaleString()} → €${newValue.toLocaleString()})`;
      } else if (changeType === "increase") {
        return `Precio aumentado ${Math.abs(percentChange).toFixed(1)}% (€${oldValue.toLocaleString()} → €${newValue.toLocaleString()})`;
      } else {
        return `Precio corregido (€${oldValue.toLocaleString()} → €${newValue.toLocaleString()})`;
      }
    }

    case "status_changed": {
      const oldStatus = details.oldStatus as string;
      const newStatus = details.newStatus as string;
      return `Estado cambiado de "${oldStatus}" a "${newStatus}"`;
    }

    case "agent_reassigned": {
      const oldAgentName = details.oldAgentName as string;
      const newAgentName = details.newAgentName as string;
      return `Agente cambiado de ${oldAgentName} a ${newAgentName}`;
    }

    case "portal_published": {
      const portal = details.portal as string;
      return `Publicado en ${portal.charAt(0).toUpperCase() + portal.slice(1)}`;
    }

    case "portal_unpublished": {
      const portal = details.portal as string;
      return `Despublicado de ${portal.charAt(0).toUpperCase() + portal.slice(1)}`;
    }

    case "images_updated": {
      const operation = details.operation as string;
      const count = details.count as number;
      if (operation === "added") {
        return `${count} imagen${count !== 1 ? "es" : ""} añadida${count !== 1 ? "s" : ""}`;
      } else if (operation === "removed") {
        return `${count} imagen${count !== 1 ? "es" : ""} eliminada${count !== 1 ? "s" : ""}`;
      } else {
        return `Imágenes reordenadas (${count} imágenes)`;
      }
    }

    case "description_changed": {
      const method = details.method as string;
      return method === "ai"
        ? "Descripción generada con IA"
        : "Descripción actualizada manualmente";
    }

    case "keys_received": {
      return "Llaves recibidas del propietario";
    }

    case "document_uploaded": {
      return "Documento subido";
    }

    default:
      return getActivityActionLabel(action);
  }
}

/**
 * Format timestamp as relative time in Spanish
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: es,
  });
}

/**
 * Format timestamp as absolute date/time in Spanish
 */
export function formatAbsoluteTime(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
}

/**
 * Get all available action types with their labels for filtering
 */
export function getAllActionTypesForFilter(): Array<{ value: string; label: string }> {
  const actions: Array<{ value: string; label: string }> = [];

  // Add listing activity actions
  const listingActions = [
    "price_changed", "status_changed", "agent_reassigned", "portal_published",
    "portal_unpublished", "description_changed", "images_updated", "featured_toggled",
    "listing_type_changed", "specifications_updated", "keys_received", "visibility_changed",
    "website_publication_toggled", "activated", "deactivated", "portal_sync_error",
    "portal_settings_updated", "views_milestone", "inquiry_received", "document_uploaded",
    "virtual_tour_added", "fotocasa_published", "fotocasa_updated", "fotocasa_deleted",
    "website_published", "website_unpublished", "keys_returned", "cartel_placed",
    "cartel_removed", "escaparate_added", "escaparate_removed",
  ];
  listingActions.forEach((action) => {
    actions.push({
      value: action,
      label: getActivityActionLabel(action as ListingActivityAction),
    });
  });

  // Add contact activity actions
  const contactActions = [
    "contact_created", "contact_deactivated", "contact_merged", "consent_given",
    "consent_withdrawn", "do_not_contact_set", "gdpr_data_export_requested",
    "email_sent", "whatsapp_sent", "call_logged", "viewing_completed", "notes_added",
  ];
  contactActions.forEach((action) => {
    actions.push({
      value: action,
      label: getActivityActionLabel(action as ContactActivityAction),
    });
  });

  // Add listing contact activity actions
  const listingContactActions = [
    "status_changed", "offer_received", "offer_accepted", "offer_rejected",
    "appointment_scheduled", "contact_assigned", "contact_type_changed", "contact_merged",
    "call_logged", "email_sent", "whatsapp_sent", "message_received",
    "viewing_completed", "appointment_cancelled", "appointment_rescheduled",
    "viewing_feedback_received", "counter_offer_made", "offer_expired",
    "financing_status_updated", "interest_level_updated", "disqualified",
    "source_identified", "deal_created", "document_requested", "document_received",
    "follow_up_scheduled", "follow_up_completed", "notes_added", "match_score_updated",
    "alternative_suggested",
  ];
  listingContactActions.forEach((action) => {
    // Avoid duplicates (some actions exist in multiple types)
    if (!actions.some((a) => a.value === action)) {
      actions.push({
        value: action,
        label: getActivityActionLabel(action as ListingContactActivityAction),
      });
    }
  });

  // Sort alphabetically by label
  return actions.sort((a, b) => a.label.localeCompare(b.label));
}
