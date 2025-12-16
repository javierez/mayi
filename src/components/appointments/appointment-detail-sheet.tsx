"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "~/lib/auth-client";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "~/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Home,
  Users,
  PenTool,
  Handshake,
  Train,
  ListTodo,
  CircleDot,
  CheckCircle,
  Ban,
  RotateCw,
  UserX,
  Trash2,
  Loader,
  Pencil,
  ExternalLink,
  X,
} from "lucide-react";
import {
  updateAppointmentStatusAction,
  deleteAppointmentAction,
  updateAppointmentTitleAction,
} from "~/server/actions/appointments";
import type { AppointmentData } from "./appointment-card";
import { AppointmentComments } from "./appointment-comments";
import {
  isSameDay as isSameDayHelper,
  formatDate,
  formatTime,
  formatShortDate,
  getLocalTimeComponents,
} from "~/lib/utils/date-helpers";
import {
  createAppointmentCommentAction,
  updateAppointmentCommentAction,
  deleteAppointmentCommentAction,
} from "~/server/actions/appointment-comments";
import { getAppointmentCommentsByIdWithAuth } from "~/server/queries/appointment-comments";
import type { AppointmentCommentWithUser } from "~/types/appointment-comments";

// Appointment types configuration
const appointmentTypes = {
  Visita: {
    color: "bg-blue-100 text-blue-800",
    icon: <Home className="h-4 w-4" />,
  },
  Reunión: {
    color: "bg-purple-100 text-purple-800",
    icon: <Users className="h-4 w-4" />,
  },
  Firma: {
    color: "bg-green-100 text-green-800",
    icon: <PenTool className="h-4 w-4" />,
  },
  Cierre: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <Handshake className="h-4 w-4" />,
  },
  Viaje: {
    color: "bg-emerald-100 text-emerald-800",
    icon: <Train className="h-4 w-4" />,
  },
  Tarea: {
    color: "bg-rose-100 text-rose-800",
    icon: <ListTodo className="h-4 w-4" />,
  },
};

// Status labels mapping
type VisitStatus =
  | "Completed"
  | "Scheduled"
  | "Cancelled"
  | "Rescheduled"
  | "NoShow";
const STATUS_LABELS: Record<VisitStatus, string> = {
  Completed: "Completado",
  Scheduled: "Programado",
  Cancelled: "Cancelado",
  Rescheduled: "Reprogramado",
  NoShow: "No asistió",
};

// Appointment form data interface for edit modal
interface AppointmentFormData {
  contactId?: bigint;
  listingId?: bigint;
  listingContactId?: bigint;
  dealId?: bigint;
  prospectId?: bigint;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  tripTimeMinutes?: number;
  title?: string;
  notes?: string;
  appointmentType?: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje" | "Tarea";
  assignedTo?: string; // FK → users.id (who is assigned to the appointment)
}

export interface AppointmentDetailSheetProps {
  appointment: AppointmentData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void | Promise<void>;
  onEdit?: (
    appointmentId: bigint,
    initialData: Partial<AppointmentFormData>,
  ) => void;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    checkOwnership?: (appointment: AppointmentData) => boolean;
  };
  context?: {
    listingId?: bigint;
    contactId?: bigint;
    includeExtendedFields?: boolean;
  };
}

export function AppointmentDetailSheet({
  appointment,
  isOpen,
  onClose,
  onUpdate,
  onEdit,
  permissions,
  context,
}: AppointmentDetailSheetProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [comments, setComments] = useState<AppointmentCommentWithUser[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Inline title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments when sheet opens
  useEffect(() => {
    if (isOpen && appointment) {
      setIsLoadingComments(true);
      getAppointmentCommentsByIdWithAuth(appointment.appointmentId)
        .then((data) => setComments(data))
        .catch((error) => {
          console.error("Error loading comments:", error);
          toast.error("Error al cargar los comentarios");
        })
        .finally(() => setIsLoadingComments(false));
    }
  }, [isOpen, appointment]);

  // Reset title editing state when sheet closes or appointment changes
  useEffect(() => {
    if (!isOpen) {
      setIsEditingTitle(false);
      setEditedTitle("");
      setIsStatusMenuOpen(false);
    }
  }, [isOpen]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  if (!appointment) return null;

  // Use optimistic status if available, otherwise use actual status
  const currentStatus = optimisticStatus ?? appointment.status;

  // Determine if user can edit this specific appointment
  const canEditAppointment = permissions.checkOwnership
    ? permissions.checkOwnership(appointment)
    : permissions.canEdit;

  const canDeleteAppointment = canEditAppointment && permissions.canDelete;

  // Check if "Visita" button should be shown
  // Hide "Visita" button for final/non-actionable states
  const showVisitaButton =
    canEditAppointment &&
    appointment.type === "Visita" &&
    currentStatus === "Scheduled";

  // Type configuration
  const typeConfig = appointmentTypes[
    appointment.type as keyof typeof appointmentTypes
  ] ?? {
    color: "bg-gray-100 text-gray-800",
    icon: <CalendarIcon className="h-4 w-4" />,
  };

  // Date/time formatting - using helpers from date-helpers

  // Handle status update
  const handleStatusUpdate = async (
    newStatus:
      | "Scheduled"
      | "Completed"
      | "Cancelled"
      | "Rescheduled"
      | "NoShow",
  ) => {
    // Close the dropdown menu immediately
    setIsStatusMenuOpen(false);
    
    // Optimistically update the status
    setOptimisticStatus(newStatus);
    setIsUpdatingStatus(true);

    try {
      const result = await updateAppointmentStatusAction(
        appointment.appointmentId,
        newStatus,
        context?.listingId,
        context?.contactId ?? appointment.contactId,
      );

      if (result.success) {
        toast.success("Estado actualizado correctamente");
        if (onUpdate) {
          console.log("🔄 [DetailSheet] Calling onUpdate after status change");
          try {
            await onUpdate();
            console.log("✅ [DetailSheet] onUpdate completed successfully");
          } catch (error) {
            console.error("❌ [DetailSheet] Error in onUpdate callback:", error);
          }
        }
        // Keep the sheet open to show the new layout
      } else {
        // Revert optimistic update on error
        setOptimisticStatus(null);
        toast.error(result.error ?? "Error al actualizar el estado");
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStatus(null);
      console.error("Error updating appointment status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
      return;
    }

    setIsDeletingAppointment(true);
    try {
      const result = await deleteAppointmentAction(
        appointment.appointmentId,
        context?.listingId,
        context?.contactId ?? appointment.contactId,
      );

      if (result.success) {
        toast.success("Cita eliminada correctamente");
        onClose();
        if (onUpdate) {
          console.log("🔄 [DetailSheet] Calling onUpdate after deletion");
          try {
            await onUpdate();
            console.log("✅ [DetailSheet] onUpdate completed successfully after deletion");
          } catch (error) {
            console.error("❌ [DetailSheet] Error in onUpdate callback after deletion:", error);
          }
        }
      } else {
        toast.error(result.error ?? "Error al eliminar la cita");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Error al eliminar la cita");
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  // Handle inline title edit
  const handleStartEditingTitle = () => {
    setEditedTitle(appointment.title ?? "");
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    const trimmedTitle = editedTitle.trim();

    // Don't save if unchanged
    if (trimmedTitle === (appointment.title ?? "")) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      const result = await updateAppointmentTitleAction(
        appointment.appointmentId,
        trimmedTitle,
      );

      if (result.success) {
        toast.success("Título actualizado");
        if (onUpdate) {
          console.log("🔄 [DetailSheet] Calling onUpdate after title change");
          try {
            await onUpdate();
            console.log("✅ [DetailSheet] onUpdate completed successfully after title change");
          } catch (error) {
            console.error("❌ [DetailSheet] Error in onUpdate callback after title change:", error);
          }
        }
      } else {
        toast.error(result.error ?? "Error al actualizar el título");
      }
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Error al actualizar el título");
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSaveTitle();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setEditedTitle("");
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    if (!onEdit) return;

    // Use local time components in DD-MM-YYYY format to avoid timezone conversion issues
    const startTimeComponents = getLocalTimeComponents(appointment.datetimeStart);
    const endTimeComponents = getLocalTimeComponents(appointment.datetimeEnd);
    const startDate = appointment.datetimeStart;
    const endDate = appointment.datetimeEnd;

    const initialData: Partial<AppointmentFormData> = {
      contactId: appointment.contactId,
      startDate: `${String(startDate.getDate()).padStart(2, '0')}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${startDate.getFullYear()}`,
      startTime: `${String(startTimeComponents.hours).padStart(2, '0')}:${String(startTimeComponents.minutes).padStart(2, '0')}`,
      endDate: `${String(endDate.getDate()).padStart(2, '0')}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getFullYear()}`,
      endTime: `${String(endTimeComponents.hours).padStart(2, '0')}:${String(endTimeComponents.minutes).padStart(2, '0')}`,
      tripTimeMinutes: appointment.tripTimeMinutes,
      title: appointment.title,
      notes: appointment.notes,
      appointmentType: appointment.type as
        | "Visita"
        | "Reunión"
        | "Firma"
        | "Cierre"
        | "Viaje"
        | "Tarea",
      // Preserve assignedTo to prevent accidental reassignment on edit
      assignedTo: appointment.assignedTo ?? undefined,
    };

    // Add listingId from appointment itself first, then override with context if provided
    if (appointment.listingId) {
      initialData.listingId = appointment.listingId;
    }

    // Add context-specific fields (can override appointment fields)
    if (context?.listingId) {
      initialData.listingId = context.listingId;
    }

    // Add extended fields for calendar context (if available from appointment)
    if (context?.includeExtendedFields) {
      // These fields might be available in the appointment object depending on the query
      // TypeScript will allow these since initialData is Partial<AppointmentFormData>
      const extendedAppointment = appointment as AppointmentData & {
        listingContactId?: bigint;
        dealId?: bigint;
        prospectId?: bigint;
      };

      if (extendedAppointment.listingContactId) {
        initialData.listingContactId = extendedAppointment.listingContactId;
      }
      if (extendedAppointment.dealId) {
        initialData.dealId = extendedAppointment.dealId;
      }
      if (extendedAppointment.prospectId) {
        initialData.prospectId = extendedAppointment.prospectId;
      }
    }

    onEdit(appointment.appointmentId, initialData);
    onClose();
  };

  // Handle "Visita" button click
  const handleVisitaClick = () => {
    router.push(`/calendario/visita/${appointment.appointmentId}`);
    onClose();
  };

  // Comment handlers
  const handleAddComment = async (tempComment: AppointmentCommentWithUser) => {
    try {
      const result = await createAppointmentCommentAction({
        appointmentId: tempComment.appointmentId,
        content: tempComment.content,
        parentId: tempComment.parentId,
      });

      if (result.success) {
        // Refresh comments
        const freshComments = await getAppointmentCommentsByIdWithAuth(
          tempComment.appointmentId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error adding comment:", error);
      return { success: false, error: "Error al añadir el comentario" };
    }
  };

  const handleEditComment = async (commentId: bigint, content: string) => {
    try {
      const result = await updateAppointmentCommentAction({
        commentId,
        content,
      });

      if (result.success && appointment) {
        // Refresh comments
        const freshComments = await getAppointmentCommentsByIdWithAuth(
          appointment.appointmentId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error editing comment:", error);
      return { success: false, error: "Error al editar el comentario" };
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    try {
      const result = await deleteAppointmentCommentAction(commentId);

      if (result.success && appointment) {
        // Refresh comments
        const freshComments = await getAppointmentCommentsByIdWithAuth(
          appointment.appointmentId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: "Error al eliminar el comentario" };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-full sm:max-w-md [&>button]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0 flex-1">
              <span className="shrink-0">{typeConfig.icon}</span>
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={() => void handleSaveTitle()}
                  disabled={isSavingTitle}
                  className="h-7 min-w-0 flex-1 border-0 border-b border-gray-300 bg-transparent px-0 text-base font-semibold focus-visible:ring-0 focus-visible:border-blue-500 sm:text-lg"
                  placeholder="Título de la cita..."
                />
              ) : (
                <span
                  className={cn(
                    "min-w-0 break-words",
                    canEditAppointment && "cursor-pointer hover:text-blue-600 transition-colors"
                  )}
                  onClick={canEditAppointment ? handleStartEditingTitle : undefined}
                  title={canEditAppointment ? "Clic para editar título" : undefined}
                >
                  {appointment.title ?? `${appointment.type} - ${appointment.contactName}`}
                </span>
              )}
            </SheetTitle>

            {/* Custom Close Button */}
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
          {/* Type and Status */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{appointment.type}</p>

            {/* Status Dropdown */}
            <DropdownMenu open={isStatusMenuOpen} onOpenChange={setIsStatusMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={!canEditAppointment || isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5",
                        currentStatus === "Scheduled" &&
                          "bg-gray-100 text-gray-700",
                        currentStatus === "Completed" &&
                          "bg-gray-200 text-gray-800",
                        currentStatus === "Cancelled" &&
                          "bg-gray-50 text-gray-400 line-through",
                        currentStatus === "Rescheduled" &&
                          "bg-gray-150 text-gray-700",
                        currentStatus === "NoShow" && "bg-gray-100 text-gray-500",
                      )}
                    >
                      {STATUS_LABELS[currentStatus as VisitStatus]}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    void handleStatusUpdate("Scheduled");
                  }}
                  disabled={isUpdatingStatus || currentStatus === "Scheduled"}
                >
                  <CircleDot className="mr-2 h-3 w-3 text-muted-foreground" />
                  Programado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleStatusUpdate("Completed");
                  }}
                  disabled={isUpdatingStatus || currentStatus === "Completed"}
                >
                  <CheckCircle className="mr-2 h-3 w-3 text-muted-foreground" />
                  Completado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleStatusUpdate("Cancelled");
                  }}
                  disabled={isUpdatingStatus || currentStatus === "Cancelled"}
                >
                  <Ban className="mr-2 h-3 w-3 text-muted-foreground" />
                  Cancelado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleStatusUpdate("Rescheduled");
                  }}
                  disabled={isUpdatingStatus || currentStatus === "Rescheduled"}
                >
                  <RotateCw className="mr-2 h-3 w-3 text-muted-foreground" />
                  Reprogramado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void handleStatusUpdate("NoShow");
                  }}
                  disabled={isUpdatingStatus || currentStatus === "NoShow"}
                >
                  <UserX className="mr-2 h-3 w-3 text-muted-foreground" />
                  No asistió
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Appointment Details */}
          <div className="space-y-2">
            {(() => {
              const startDate = appointment.datetimeStart;
              const endDate = appointment.datetimeEnd;
              const isSameDay = isSameDayHelper(startDate, endDate);

              if (isSameDay) {
                return (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{formatDate(startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>
                        {formatTime(startDate)} - {formatTime(endDate)}
                      </span>
                    </div>
                  </>
                );
              }

              // Different days - show combined date+time format
              return (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {formatShortDate(startDate)} {formatTime(startDate)} -{" "}
                    {formatShortDate(endDate)} {formatTime(endDate)}
                  </span>
                </div>
              );
            })()}
            {appointment.listingId && (
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words">
                  {appointment.propertyTitle ?? "Propiedad"}
                </span>
                <Link
                  href={`/propiedades/${appointment.listingId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
            {appointment.contactId && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Link
                  href={`/contactos/${appointment.contactId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 break-words underline decoration-dotted underline-offset-2 transition-all hover:decoration-solid"
                >
                  {appointment.contactName ?? "Contacto"}
                </Link>
              </div>
            )}
            {appointment.propertyAddress && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${appointment.propertyAddress}${appointment.city ? `, ${appointment.city}` : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 break-words underline decoration-dotted underline-offset-2 transition-all hover:decoration-solid"
                >
                  {appointment.propertyAddress}
                  {appointment.city && ` - ${appointment.city}`}
                </a>
              </div>
            )}
            {appointment.tripTimeMinutes != null && appointment.tripTimeMinutes > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Tiempo de viaje: {appointment.tripTimeMinutes} min</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="mt-4 border-l-2 border-gray-300 py-1 pl-3 sm:mt-6 sm:pl-4">
              <p className="break-words text-sm italic leading-relaxed text-gray-600">
                &ldquo;{appointment.notes}&rdquo;
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:pt-4">
            {showVisitaButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                onClick={handleVisitaClick}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Registrar Visita</span>
              </Button>
            )}
            {!showVisitaButton &&
            (Boolean(canEditAppointment) || Boolean(canDeleteAppointment)) ? (
              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
                {canEditAppointment && onEdit && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={handleEditClick}
                    className="h-10 min-w-0 flex-1 gap-2 sm:h-9"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    <span className="truncate">Editar cita</span>
                  </Button>
                )}
                {canDeleteAppointment && (
                  <Button
                    size="default"
                    variant="outline"
                    onClick={() => {
                      void handleDeleteAppointment();
                    }}
                    disabled={isDeletingAppointment}
                    className="h-10 min-w-0 flex-1 gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 sm:h-9"
                  >
                    {isDeletingAppointment ? (
                      <Loader className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">Eliminar cita</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {canEditAppointment && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditClick}
                    className="h-10 w-10 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:h-8 sm:w-8"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDeleteAppointment && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void handleDeleteAppointment();
                    }}
                    disabled={isDeletingAppointment}
                    className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-8 sm:w-8"
                    title="Eliminar"
                  >
                    {isDeletingAppointment ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-4 border-t pt-4 sm:mt-6 sm:pt-6">
            {isLoadingComments ? (
              <div className="flex justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              session?.user && (
                <AppointmentComments
                  appointmentId={appointment.appointmentId}
                  initialComments={comments}
                  currentUserId={session.user.id}
                  currentUser={{
                    id: session.user.id,
                    name: session.user.name ?? undefined,
                    image: session.user.image ?? undefined,
                  }}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
