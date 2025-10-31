import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { ListingActivityAction } from "~/lib/constants/listing-activity-actions";
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
  type LucideIcon,
} from "lucide-react";

/**
 * Get Spanish label for activity action
 */
export function getActivityActionLabel(action: ListingActivityAction): string {
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
  };

  return labels[action] ?? action;
}

/**
 * Get color variant for activity action type
 */
export function getActivityActionColor(
  action: ListingActivityAction,
): "default" | "secondary" | "destructive" | "outline" {
  // Critical/important actions
  if (
    [
      "price_changed",
      "status_changed",
      "agent_reassigned",
      "keys_received",
    ].includes(action)
  ) {
    return "default";
  }

  // Portal/publication actions
  if (action.includes("portal") || action.includes("published")) {
    return "secondary";
  }

  // Errors
  if (action.includes("error")) {
    return "destructive";
  }

  return "outline";
}

/**
 * Get icon for activity action type
 */
export function getActivityActionIcon(
  action: ListingActivityAction,
): LucideIcon {
  const iconMap: Partial<Record<ListingActivityAction, LucideIcon>> = {
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

  return iconMap[action] ?? RefreshCw;
}

/**
 * Format activity summary text based on action type and details
 */
export function formatActivitySummary(
  action: ListingActivityAction,
  details: Record<string, unknown>,
): string {
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
