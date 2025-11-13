"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Phone,
  Mail,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Handshake,
  UserCheck,
  X,
  Check,
  Clock,
  Trash2,
} from "lucide-react";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import { cn } from "~/lib/utils";
import { useSession } from "~/lib/auth-client";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "~/components/ui/delete-confirmation-modal";

interface ListingContactActivityTimelineProps {
  activities: ListingContactActivityWithUser[];
  loading?: boolean;
  onDelete?: (activityId: bigint) => Promise<void>;
  canDeleteAll?: boolean;
}

function getActionConfig(action: string, pending: boolean = false) {
  // Elegant style with gray gradient backgrounds and gray icon colors
  // Amber colors when pending = true
  
  const iconColor = pending ? "text-amber-600" : "text-gray-600";
  const bgGradient = pending 
    ? "bg-gradient-to-br from-amber-100 to-orange-100"
    : "bg-gradient-to-br from-gray-100 to-slate-100";
  const borderColor = pending ? "border-amber-200" : "border-gray-200";
  const hoverBg = pending 
    ? "hover:from-amber-200 hover:to-orange-200"
    : "hover:from-gray-200 hover:to-slate-200";
  
  switch (action) {
    case "call_logged":
      return {
        icon: <Phone className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "email_sent":
      return {
        icon: <Mail className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "whatsapp_sent":
    case "message_received":
      return {
        icon: <MessageSquare className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "notes_added":
      return {
        icon: <FileText className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "appointment_scheduled":
    case "viewing_completed":
      return {
        icon: <Calendar className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "offer_received":
    case "offer_accepted":
      return {
        icon: <Handshake className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "offer_rejected":
      return {
        icon: <Handshake className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "contact_assigned":
      return {
        icon: <UserCheck className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "appointment_cancelled":
      return {
        icon: <X className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    case "status_changed":
      return {
        icon: <Check className={`h-3.5 w-3.5 ${iconColor}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
    default:
      return {
        icon: <Clock className={`h-3.5 w-3.5 ${pending ? "text-amber-500" : "text-gray-500"}`} />,
        bgGradient,
        borderColor,
        hoverBg,
      };
  }
}

function getInitials(
  firstName: string | null,
  lastName: string | null,
  name: string | null,
): string {
  if (firstName && lastName) {
    const first = firstName[0];
    const last = lastName[0];
    if (first && last) {
      return `${first}${last}`.toUpperCase();
    }
  }
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      if (firstPart && lastPart && firstPart[0] && lastPart[0]) {
        return `${firstPart[0]}${lastPart[0]}`.toUpperCase();
      }
    }
    if (name.length >= 2) {
      return name.substring(0, 2).toUpperCase();
    }
  }
  return "??";
}

export function ListingContactActivityTimeline({
  activities,
  loading = false,
  onDelete,
  canDeleteAll = false,
}: ListingContactActivityTimelineProps) {
  const { data: session } = useSession();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [activityToDelete, setActivityToDelete] = useState<ListingContactActivityWithUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const canUserDeleteActivity = (activity: ListingContactActivityWithUser): boolean => {
    if (!onDelete) return false;
    // User can delete if they created the activity OR have deleteAll permission
    return activity.userId === session?.user?.id || canDeleteAll;
  };

  const handleDeleteClick = (activity: ListingContactActivityWithUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setActivityToDelete(activity);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !activityToDelete) return;

    const activityIdStr = activityToDelete.id.toString();
    setDeletingIds((prev) => new Set(prev).add(activityIdStr));

    try {
      await onDelete(activityToDelete.id);
      toast.success("Actividad eliminada correctamente");
      setIsDeleteModalOpen(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Error al eliminar la actividad");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(activityIdStr);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="mb-3 h-12 w-12 animate-spin opacity-50" />
        <p className="text-sm">Cargando actividades...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="mb-3 h-12 w-12 opacity-50" />
        <p className="text-sm">No hay actividades registradas</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pl-10">
      {/* Vertical connecting line - subtle gradient, centered with icon */}
      {/* Calculation: pl-10 = 40px, icon at left-[-28px] means 40px - 28px = 12px from container left */}
      {/* Icon is h-7 w-7 = 28px, border-2 = 2px each side, total = 32px */}
      {/* Icon right edge = 12px + 32px = 44px, plus shadow ~2px = 46px */}
      {/* Icon center = 12px + 16px = 28px from container left */}
      <div className="absolute bottom-2 left-[28px] top-2 w-px bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100" />

      {activities.map((activity, index) => {
        const isLast = index === activities.length - 1;
        const isExpanded = expandedIds.has(activity.id.toString());
        const details = activity.details as { notes?: string; topic?: string; pending?: boolean; isPending?: boolean } | null | undefined;
        const notes = details?.notes ?? "";
        const topic = details?.topic ?? notes.substring(0, 50) ?? "Sin tema";
        const pending = details?.pending === true || details?.isPending === true;
        const actionConfig = getActionConfig(activity.action, pending);

        return (
          <div key={activity.id.toString()} className="relative group">
            {/* Timeline dot with subtle gradient and elegant styling */}
            {/* Positioned at left-[-28px] relative to content area (40px padding) */}
            {/* So icon left edge is at 40px - 28px = 12px from container left */}
            <div className="absolute left-[-28px] top-1 z-10">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-300 ease-in-out",
                  actionConfig.bgGradient,
                  actionConfig.borderColor,
                  actionConfig.hoverBg,
                  "shadow-sm group-hover:shadow-md group-hover:scale-110",
                )}
              >
                {actionConfig.icon}
              </div>
            </div>

            {/* Elegant card with subtle transitions */}
            {/* ml-3 = 12px margin for tighter spacing from icon */}
            <div
              className={cn(
                "rounded-lg border bg-white p-4 shadow-sm transition-all duration-300 ease-in-out relative ml-3",
                "hover:shadow-md hover:border-gray-200",
                isLast ? "" : "mb-6",
              )}
            >
              {/* User avatar - top right with subtle ring and delete button on hover */}
              <div className="absolute right-3 top-3">
                <div className="relative">
                  <Avatar className="h-7 w-7 ring-1 ring-gray-100 transition-all duration-300 hover:ring-gray-200">
                    <AvatarImage src={activity.user.image ?? undefined} />
                    <AvatarFallback className="text-xs font-medium bg-gray-50 text-gray-600">
                      {getInitials(
                        activity.user.firstName,
                        activity.user.lastName,
                        activity.user.name,
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {/* Delete button overlay on card hover */}
                  {canUserDeleteActivity(activity) && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteClick(activity, e)}
                        disabled={deletingIds.has(activity.id.toString())}
                        className="h-full w-full rounded-full p-0 text-white hover:bg-transparent hover:text-white"
                        title="Eliminar actividad"
                      >
                        {deletingIds.has(activity.id.toString()) ? (
                          <Clock className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-2.5 w-2.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pr-10">
                {/* Date - subtle and refined */}
                <p className="text-xs text-gray-500 font-normal">
                  {format(activity.createdAt, "d 'de' MMMM, yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </p>

                {/* Topic with expandable chevron */}
                <div className="flex items-start gap-1.5">
                  <div className="text-xs font-medium text-gray-900 leading-snug transition-colors duration-200">
                    {topic}
                  </div>
                  {notes && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(activity.id.toString())}
                      className="-mt-0.5 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      aria-label={isExpanded ? "Ocultar notas" : "Mostrar notas"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </button>
                  )}
                </div>

                {/* Notes - expandable */}
                {notes && isExpanded && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar actividad?"
        description="Esta acción eliminará permanentemente esta actividad. No se puede deshacer."
        confirmText="Eliminar"
        loadingText="Eliminando..."
        variant="destructive"
        isDeleting={activityToDelete ? deletingIds.has(activityToDelete.id.toString()) : false}
      />
    </div>
  );
}

