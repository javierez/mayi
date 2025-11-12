"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
} from "lucide-react";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import { cn } from "~/lib/utils";

interface ListingContactActivityTimelineProps {
  activities: ListingContactActivityWithUser[];
  loading?: boolean;
}

function getActionConfig(action: string) {
  switch (action) {
    case "call_logged":
      return {
        icon: <Phone className="h-3.5 w-3.5" />,
        bgGradient: "from-amber-50 to-rose-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200",
        hoverBg: "hover:from-amber-100 hover:to-rose-100",
      };
    case "email_sent":
      return {
        icon: <Mail className="h-3.5 w-3.5" />,
        bgGradient: "from-rose-50 to-amber-50",
        iconColor: "text-rose-600",
        borderColor: "border-rose-200",
        hoverBg: "hover:from-rose-100 hover:to-amber-100",
      };
    case "whatsapp_sent":
    case "message_received":
      return {
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        bgGradient: "from-amber-100 to-rose-100",
        iconColor: "text-amber-700",
        borderColor: "border-amber-300",
        hoverBg: "hover:from-amber-200 hover:to-rose-200",
      };
    case "notes_added":
      return {
        icon: <FileText className="h-3.5 w-3.5" />,
        bgGradient: "from-gray-50 to-slate-50",
        iconColor: "text-gray-600",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-100 hover:to-slate-100",
      };
    case "appointment_scheduled":
    case "viewing_completed":
      return {
        icon: <Calendar className="h-3.5 w-3.5" />,
        bgGradient: "from-amber-50 via-rose-50 to-amber-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200",
        hoverBg: "hover:from-amber-100 hover:via-rose-100 hover:to-amber-100",
      };
    case "offer_received":
    case "offer_accepted":
      return {
        icon: <Handshake className="h-3.5 w-3.5" />,
        bgGradient: "from-amber-100 to-amber-200",
        iconColor: "text-amber-700",
        borderColor: "border-amber-300",
        hoverBg: "hover:from-amber-200 hover:to-amber-300",
      };
    case "offer_rejected":
      return {
        icon: <Handshake className="h-3.5 w-3.5" />,
        bgGradient: "from-rose-100 to-rose-200",
        iconColor: "text-rose-700",
        borderColor: "border-rose-300",
        hoverBg: "hover:from-rose-200 hover:to-rose-300",
      };
    case "contact_assigned":
      return {
        icon: <UserCheck className="h-3.5 w-3.5" />,
        bgGradient: "from-amber-50 to-rose-50",
        iconColor: "text-amber-600",
        borderColor: "border-amber-200",
        hoverBg: "hover:from-amber-100 hover:to-rose-100",
      };
    case "appointment_cancelled":
      return {
        icon: <X className="h-3.5 w-3.5" />,
        bgGradient: "from-gray-50 to-gray-100",
        iconColor: "text-gray-500",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-100 hover:to-gray-200",
      };
    case "status_changed":
      return {
        icon: <Check className="h-3.5 w-3.5" />,
        bgGradient: "from-rose-50 to-amber-50",
        iconColor: "text-rose-600",
        borderColor: "border-rose-200",
        hoverBg: "hover:from-rose-100 hover:to-amber-100",
      };
    default:
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        bgGradient: "from-gray-50 to-gray-100",
        iconColor: "text-gray-500",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-100 hover:to-gray-200",
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
}: ListingContactActivityTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        const details = activity.details as { notes?: string; topic?: string } | null | undefined;
        const notes = (details?.notes as string | undefined) || "";
        const topic = (details?.topic as string | undefined) || notes.substring(0, 50) || "Sin tema";
        const actionConfig = getActionConfig(activity.action);

        return (
          <div key={activity.id.toString()} className="relative group">
            {/* Timeline dot with subtle gradient and elegant styling */}
            {/* Positioned at left-[-28px] relative to content area (40px padding) */}
            {/* So icon left edge is at 40px - 28px = 12px from container left */}
            <div className="absolute left-[-28px] top-1 z-10">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ease-in-out",
                  `bg-gradient-to-br ${actionConfig.bgGradient}`,
                  actionConfig.borderColor,
                  actionConfig.hoverBg,
                  "shadow-sm group-hover:shadow-md group-hover:scale-110",
                )}
              >
                <div className={cn("transition-colors duration-300", actionConfig.iconColor)}>
                  {actionConfig.icon}
                </div>
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
              {/* User avatar - top right with subtle ring */}
              <div className="absolute right-3 top-3">
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
              </div>

              <div className="space-y-2.5 pr-10">
                {/* Date - subtle and refined */}
                <p className="text-xs text-gray-500 font-normal">
                  {format(activity.createdAt, "d 'de' MMMM, yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </p>

                {/* Topic - elegant typography */}
                <div className="text-sm font-medium text-gray-900 leading-snug transition-colors duration-200">
                  {topic}
                </div>

                {/* Notes preview/expandable */}
                {notes && (
                  <div className="space-y-1.5">
                    {!isExpanded && notes.length > 100 ? (
                      <>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {notes}
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleExpand(activity.id.toString())}
                          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                          <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
                          Ver más
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {notes}
                        </p>
                        {notes.length > 100 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(activity.id.toString())}
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            <ChevronUp className="h-3.5 w-3.5 transition-transform duration-200" />
                            Ver menos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

