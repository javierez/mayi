"use client";

import { useState, useMemo } from "react";
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
  UserPlus,
  UserMinus,
  Users,
  Shield,
  ShieldAlert,
  FileDown,
  Ban,
} from "lucide-react";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import type { ContactActivityWithUser } from "~/server/queries/contact-activity";
import { LISTING_CONTACT_ACTIVITY_LABELS } from "~/lib/constants/listing-contact-activity-actions";
import { CONTACT_ACTIVITY_LABELS } from "~/lib/constants/contact-activity-actions";
import { cn } from "~/lib/utils";

// Unified activity type with discriminator
export type UnifiedActivity =
  | ({
      activityType: "listing";
    } & ListingContactActivityWithUser)
  | ({
      activityType: "contact";
    } & ContactActivityWithUser);

interface GeneralActivityTimelineProps {
  listingActivities: ListingContactActivityWithUser[];
  contactActivities: ContactActivityWithUser[];
  loading?: boolean;
}

function getActionConfig(action: string) {
  // Elegant style with solid gradient backgrounds and solid icon colors
  // Similar to PropertyImagePlaceholder but fully opaque
  
  switch (action) {
    // Listing contact activity actions
    case "call_logged":
      return {
        icon: <Phone className="h-3.5 w-3.5 text-amber-600" />,
        bgGradient: "bg-gradient-to-br from-amber-100 to-orange-100",
        borderColor: "border-amber-200",
        hoverBg: "hover:from-amber-200 hover:to-orange-200",
      };
    case "email_sent":
      return {
        icon: <Mail className="h-3.5 w-3.5 text-rose-600" />,
        bgGradient: "bg-gradient-to-br from-rose-100 to-pink-100",
        borderColor: "border-rose-200",
        hoverBg: "hover:from-rose-200 hover:to-pink-200",
      };
    case "whatsapp_sent":
    case "message_received":
      return {
        icon: <MessageSquare className="h-3.5 w-3.5 text-green-600" />,
        bgGradient: "bg-gradient-to-br from-green-100 to-emerald-100",
        borderColor: "border-green-200",
        hoverBg: "hover:from-green-200 hover:to-emerald-200",
      };
    case "notes_added":
      return {
        icon: <FileText className="h-3.5 w-3.5 text-slate-600" />,
        bgGradient: "bg-gradient-to-br from-slate-100 to-gray-100",
        borderColor: "border-slate-200",
        hoverBg: "hover:from-slate-200 hover:to-gray-200",
      };
    case "appointment_scheduled":
    case "viewing_completed":
      return {
        icon: <Calendar className="h-3.5 w-3.5 text-blue-600" />,
        bgGradient: "bg-gradient-to-br from-blue-100 to-cyan-100",
        borderColor: "border-blue-200",
        hoverBg: "hover:from-blue-200 hover:to-cyan-200",
      };
    case "offer_received":
    case "offer_accepted":
      return {
        icon: <Handshake className="h-3.5 w-3.5 text-emerald-600" />,
        bgGradient: "bg-gradient-to-br from-emerald-100 to-teal-100",
        borderColor: "border-emerald-200",
        hoverBg: "hover:from-emerald-200 hover:to-teal-200",
      };
    case "offer_rejected":
      return {
        icon: <Handshake className="h-3.5 w-3.5 text-red-600" />,
        bgGradient: "bg-gradient-to-br from-red-100 to-rose-100",
        borderColor: "border-red-200",
        hoverBg: "hover:from-red-200 hover:to-rose-200",
      };
    case "contact_assigned":
      return {
        icon: <UserCheck className="h-3.5 w-3.5 text-indigo-600" />,
        bgGradient: "bg-gradient-to-br from-indigo-100 to-purple-100",
        borderColor: "border-indigo-200",
        hoverBg: "hover:from-indigo-200 hover:to-purple-200",
      };
    case "appointment_cancelled":
      return {
        icon: <X className="h-3.5 w-3.5 text-gray-600" />,
        bgGradient: "bg-gradient-to-br from-gray-100 to-slate-100",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-200 hover:to-slate-200",
      };
    case "status_changed":
      return {
        icon: <Check className="h-3.5 w-3.5 text-purple-600" />,
        bgGradient: "bg-gradient-to-br from-purple-100 to-violet-100",
        borderColor: "border-purple-200",
        hoverBg: "hover:from-purple-200 hover:to-violet-200",
      };
    // Contact activity actions
    case "contact_created":
      return {
        icon: <UserPlus className="h-3.5 w-3.5 text-blue-600" />,
        bgGradient: "bg-gradient-to-br from-blue-100 to-indigo-100",
        borderColor: "border-blue-200",
        hoverBg: "hover:from-blue-200 hover:to-indigo-200",
      };
    case "contact_deactivated":
      return {
        icon: <UserMinus className="h-3.5 w-3.5 text-gray-600" />,
        bgGradient: "bg-gradient-to-br from-gray-100 to-slate-100",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-200 hover:to-slate-200",
      };
    case "contact_merged":
      return {
        icon: <Users className="h-3.5 w-3.5 text-purple-600" />,
        bgGradient: "bg-gradient-to-br from-purple-100 to-violet-100",
        borderColor: "border-purple-200",
        hoverBg: "hover:from-purple-200 hover:to-violet-200",
      };
    case "consent_given":
      return {
        icon: <Shield className="h-3.5 w-3.5 text-green-600" />,
        bgGradient: "bg-gradient-to-br from-green-100 to-emerald-100",
        borderColor: "border-green-200",
        hoverBg: "hover:from-green-200 hover:to-emerald-200",
      };
    case "consent_withdrawn":
      return {
        icon: <ShieldAlert className="h-3.5 w-3.5 text-orange-600" />,
        bgGradient: "bg-gradient-to-br from-orange-100 to-amber-100",
        borderColor: "border-orange-200",
        hoverBg: "hover:from-orange-200 hover:to-amber-200",
      };
    case "do_not_contact_set":
      return {
        icon: <Ban className="h-3.5 w-3.5 text-red-600" />,
        bgGradient: "bg-gradient-to-br from-red-100 to-rose-100",
        borderColor: "border-red-200",
        hoverBg: "hover:from-red-200 hover:to-rose-200",
      };
    case "gdpr_data_export_requested":
      return {
        icon: <FileDown className="h-3.5 w-3.5 text-indigo-600" />,
        bgGradient: "bg-gradient-to-br from-indigo-100 to-blue-100",
        borderColor: "border-indigo-200",
        hoverBg: "hover:from-indigo-200 hover:to-blue-200",
      };
    default:
      return {
        icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
        bgGradient: "bg-gradient-to-br from-gray-100 to-slate-100",
        borderColor: "border-gray-200",
        hoverBg: "hover:from-gray-200 hover:to-slate-200",
      };
  }
}

function getActivityLabel(action: string, activityType: "listing" | "contact"): string {
  if (activityType === "listing") {
    return (
      LISTING_CONTACT_ACTIVITY_LABELS[action as keyof typeof LISTING_CONTACT_ACTIVITY_LABELS] ??
      action
    );
  } else {
    return (
      CONTACT_ACTIVITY_LABELS[action as keyof typeof CONTACT_ACTIVITY_LABELS] ?? action
    );
  }
}

function getActivityTopic(
  action: string,
  details: Record<string, unknown>,
  activityType: "listing" | "contact",
): string {
  // For listing activities, try to get topic from details
  if (activityType === "listing") {
    const topic = (details as { topic?: string })?.topic;
    const notes = (details as { notes?: string })?.notes;
    if (topic) return topic;
    if (notes) return notes.substring(0, 50);
    return getActivityLabel(action, activityType);
  }
  
  // For contact activities, use the label as topic or extract from details
  const label = getActivityLabel(action, activityType);
  const reason = (details as { reason?: string; reasonDetail?: string })?.reasonDetail;
  const method = (details as { method?: string })?.method;
  
  if (reason) return `${label}: ${reason}`;
  if (method) return `${label}: ${method}`;
  return label;
}

function getActivityNotes(
  details: Record<string, unknown>,
  activityType: "listing" | "contact",
): string {
  // For listing activities, notes are typically in details.notes
  if (activityType === "listing") {
    return (details as { notes?: string })?.notes ?? "";
  }
  
  // For contact activities, extract relevant details
  const contactDetails = details as {
    reason?: string;
    reasonDetail?: string;
    method?: string;
    notes?: string;
    initialNotes?: string;
  };
  
  if (contactDetails.reasonDetail) return contactDetails.reasonDetail;
  if (contactDetails.initialNotes) return contactDetails.initialNotes;
  if (contactDetails.notes) return contactDetails.notes;
  if (contactDetails.method) return `Método: ${contactDetails.method}`;
  if (contactDetails.reason) return `Razón: ${contactDetails.reason}`;
  
  return "";
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

export function GeneralActivityTimeline({
  listingActivities,
  contactActivities,
  loading = false,
}: GeneralActivityTimelineProps) {
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

  // Merge and sort activities by date (most recent first)
  const unifiedActivities = useMemo<UnifiedActivity[]>(() => {
    const merged: UnifiedActivity[] = [
      ...listingActivities.map((activity) => ({
        ...activity,
        activityType: "listing" as const,
      })),
      ...contactActivities.map((activity) => ({
        ...activity,
        activityType: "contact" as const,
      })),
    ];

    return merged.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listingActivities, contactActivities]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="mb-3 h-12 w-12 animate-spin opacity-50" />
        <p className="text-sm">Cargando actividades...</p>
      </div>
    );
  }

  if (unifiedActivities.length === 0) {
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
      <div className="absolute bottom-2 left-[28px] top-2 w-px bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100" />

      {unifiedActivities.map((activity, index) => {
        const isLast = index === unifiedActivities.length - 1;
        const isExpanded = expandedIds.has(`${activity.activityType}-${activity.id.toString()}`);
        const actionConfig = getActionConfig(activity.action);
        const topic = getActivityTopic(
          activity.action,
          activity.details,
          activity.activityType,
        );
        const notes = getActivityNotes(activity.details, activity.activityType);

        return (
          <div
            key={`${activity.activityType}-${activity.id.toString()}`}
            className="relative group"
          >
            {/* Timeline dot with subtle gradient and elegant styling */}
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
                          onClick={() =>
                            toggleExpand(`${activity.activityType}-${activity.id.toString()}`)
                          }
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
                            onClick={() =>
                              toggleExpand(`${activity.activityType}-${activity.id.toString()}`)
                            }
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

