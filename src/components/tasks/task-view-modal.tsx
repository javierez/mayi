"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Clock,
  Home,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  X,
  CalendarPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { getTaskByIdWithAuth, deleteTaskWithAuth, updateTaskWithAuth } from "~/server/queries/task";
import type { DetailedTask } from "~/lib/operations/task-utils";
import { getInitials, getRemainingTime } from "~/lib/operations/task-utils";
import { TaskEditModal } from "./task-edit-modal";
import { useSession } from "~/lib/auth-client";
import {
  canEditAllTasks,
  canDeleteAllTasks,
} from "~/app/actions/permissions/check-permissions";
import { useRouter } from "next/navigation";
import { createAppointmentAction } from "~/server/actions/appointments";
import { toast } from "sonner";

interface TaskViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
  initialTask?: DetailedTask | null;
  onSuccess?: () => void; // Optional callback for refresh after edit/delete
}

export function TaskViewModal({
  open,
  onOpenChange,
  taskId,
  initialTask,
  onSuccess,
}: TaskViewModalProps) {
  const [task, setTask] = useState<DetailedTask | null>(initialTask ?? null);
  const [loading, setLoading] = useState(false);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [listingReferenceNumber, setListingReferenceNumber] = useState<string | null>(null);
  const [listingCity, setListingCity] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  // Store raw task data to pass to edit modal
  const [rawTaskData, setRawTaskData] = useState<Awaited<ReturnType<typeof getTaskByIdWithAuth>> | null>(null);

  // Permission states
  const [hasEditAllPermission, setHasEditAllPermission] = useState<boolean>(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] = useState<boolean>(false);

  const { data: session } = useSession();
  const router = useRouter();

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const [editAllPerm, deleteAllPerm] = await Promise.all([
          canEditAllTasks(),
          canDeleteAllTasks(),
        ]);
        setHasEditAllPermission(editAllPerm);
        setHasDeleteAllPermission(deleteAllPerm);
      } catch (error) {
        console.error("Error fetching task permissions:", error);
        setHasEditAllPermission(false);
        setHasDeleteAllPermission(false);
      }
    };

    void fetchPermissions();
  }, []); // Run once on mount

  useEffect(() => {
    if (open && taskId) {
      // Always fetch full task details when we have a taskId, even if initialTask is provided
      // This ensures we get contact email/phone, property image, city, etc.
      void fetchTask();
    } else if (open && initialTask && !taskId) {
      // Only use initialTask if we don't have a taskId to fetch
      setTask(initialTask);
    } else if (!open) {
      setTask(null);
      setContactEmail(null);
      setContactPhone(null);
      setListingImageUrl(null);
      setListingReferenceNumber(null);
      setListingCity(null);
      setIsDeleteModalOpen(false);
      setRawTaskData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);


  const fetchTask = async () => {
    if (!taskId) {
      return;
    }

    setLoading(true);
    try {
      const taskData = await getTaskByIdWithAuth(taskId);
      console.log('🔍 Raw task data fetched:', {
        taskId,
        dueDate: taskData?.tasks?.dueDate,
        dueTime: taskData?.tasks?.dueTime,
        appointmentId: taskData?.tasks?.appointmentId,
        fullTaskData: taskData?.tasks,
      });

      // Store raw task data for passing to edit modal
      setRawTaskData(taskData);

      if (taskData?.tasks) {
        // Transform the task data to match DetailedTask format
        // Using type assertion since the query structure matches DetailedTask but types differ slightly
        const transformedTask = {
          taskId: Number(taskData.tasks.taskId),
          userId: taskData.tasks.userId ?? "",
          createdBy: taskData.tasks.createdBy ?? null,
          title: taskData.tasks.title ?? "",
          description: taskData.tasks.description ?? "",
          dueDate: taskData.tasks.dueDate ?? null,
          dueTime: taskData.tasks.dueTime ?? null,
          completed: taskData.tasks.completed ?? false,
          urgency: taskData.tasks.urgency ?? null,
          status: taskData.tasks.status ?? null,
          category: taskData.tasks.category ?? null,
          listingId: taskData.listings?.listingId
            ? Number(taskData.listings.listingId)
            : null,
          listingContactId: taskData.tasks.listingContactId
            ? Number(taskData.tasks.listingContactId)
            : null,
          dealId: taskData.tasks.dealId ? Number(taskData.tasks.dealId) : null,
          appointmentId: taskData.tasks.appointmentId
            ? Number(taskData.tasks.appointmentId)
            : null,
          prospectId: taskData.tasks.prospectId
            ? Number(taskData.tasks.prospectId)
            : null,
          contactId: taskData.contacts?.contactId
            ? Number(taskData.contacts.contactId)
            : null,
          isActive: taskData.tasks.isActive ?? true,
          createdAt: taskData.tasks.createdAt ?? null,
          updatedAt: taskData.tasks.updatedAt ?? null,
          // User info from getTaskById join with users table
          userName: taskData.users?.name ?? null,
          userFirstName: taskData.users?.firstName ?? null,
          userLastName: taskData.users?.lastName ?? null,
          contactFirstName: taskData.contacts?.firstName ?? null,
          contactLastName: taskData.contacts?.lastName ?? null,
          propertyTitle: taskData.properties?.title ?? null,
        } as unknown as DetailedTask;
        setTask(transformedTask);
        // Set contact email and phone if available from the query
        if (taskData.contacts?.email) {
          setContactEmail(taskData.contacts.email);
        }
        if (taskData.contacts?.phone) {
          setContactPhone(taskData.contacts.phone);
        }
        // Set listing details if available from the query
        if (taskData.properties?.referenceNumber) {
          setListingReferenceNumber(taskData.properties.referenceNumber);
        }
        if (taskData.propertyImages?.imageUrl) {
          setListingImageUrl(taskData.propertyImages.imageUrl);
        }
        if (taskData.locations?.city) {
          setListingCity(taskData.locations.city);
        }
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "No especificada";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Fecha inválida";

    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time;
  };

  const formatDateTime = (date: Date | string | null, time: string | null) => {
    const dateStr = formatDate(date);
    const timeStr = formatTime(time);
    if (timeStr) {
      return `${dateStr} a las ${timeStr}`;
    }
    return dateStr;
  };

  const getUrgencyLabel = (urgency: number | null) => {
    if (!urgency) return "Sin especificar";
    const labels: Record<number, string> = {
      1: "Baja",
      2: "Media-Baja",
      3: "Media",
      4: "Media-Alta",
      5: "Crítica",
    };
    return labels[urgency] ?? "Sin especificar";
  };

  const getUrgencyColor = (urgency: number | null) => {
    if (!urgency) return "bg-gray-100 text-gray-700";
    const colors: Record<number, string> = {
      1: "bg-green-100 text-green-700",
      2: "bg-blue-100 text-blue-700",
      3: "bg-yellow-100 text-yellow-700",
      4: "bg-orange-100 text-orange-700",
      5: "bg-rose-100 text-rose-700",
    };
    return colors[urgency] ?? "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "";
    const labels: Record<string, string> = {
      backlog: "Por Hacer",
      blocked: "Bloqueado",
      ready: "Listo",
      in_progress: "En Progreso",
      validation: "Validación",
      finished: "Finalizado",
    };
    return labels[status] ?? status;
  };

  const getStatusColor = (status: string | null, completed: boolean | null) => {
    // If task is completed and status is "finished", show green
    if (completed && status === "finished") {
      return "bg-green-100 text-green-700";
    }
    // Default amber color for other statuses
    return "bg-amber-100 text-amber-700";
  };

  // Permission helper functions
  const canUserEditTask = (task: DetailedTask | null): boolean => {
    if (!task) return false;
    // User can edit if they created the task OR have editAll permission
    return task.createdBy === session?.user?.id || hasEditAllPermission;
  };

  const canUserDeleteTask = (task: DetailedTask | null): boolean => {
    if (!task) return false;
    // User can delete if they created the task OR have deleteAll permission
    return task.createdBy === session?.user?.id || hasDeleteAllPermission;
  };

  const handleDeleteTask = async () => {
    if (!task || !taskId) return;

    // Check permission
    if (!canUserDeleteTask(task)) {
      console.warn("User does not have permission to delete this task");
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTaskWithAuth(taskId);
      // Close both modals
      setIsDeleteModalOpen(false);
      onOpenChange(false);

      // Trigger refresh: use callback if provided, otherwise use router.refresh()
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      // Error handling - could show a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!task || !taskId) return;

    // Ensure we have both date and time
    if (!task.dueDate || !rawTaskData?.tasks.dueTime) {
      toast.error("Error", {
        description: "La tarea debe tener fecha y hora para crear una cita",
      });
      return;
    }

    setIsCreatingAppointment(true);
    try {
      // Format dates
      const dueDate = new Date(task.dueDate);
      const startDate = dueDate.toISOString().split("T")[0];
      const startTime = rawTaskData.tasks.dueTime;

      if (!startDate) {
        throw new Error("Invalid start date");
      }

      // Calculate end time (30 minutes after start)
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

      // Extract endDate and endTime - use local time components consistently
      const endDate = `${endDateTime.getFullYear()}-${String(endDateTime.getMonth() + 1).padStart(2, "0")}-${String(endDateTime.getDate()).padStart(2, "0")}`;
      const endTime = `${String(endDateTime.getHours()).padStart(2, "0")}:${String(endDateTime.getMinutes()).padStart(2, "0")}`;

      console.log("📅 Creating appointment:", {
        startDate,
        startTime,
        startDateTime: startDateTime.toISOString(),
        endDate,
        endTime,
        endDateTime: endDateTime.toISOString(),
      });

      // Create appointment
      const appointmentResult = await createAppointmentAction({
        startDate,
        startTime,
        endDate,
        endTime,
        title: task.title,
        notes: rawTaskData.tasks.description ?? undefined,
        appointmentType: "Tarea",
        assignedTo: task.userId ?? undefined,
        contactId: task.contactId ? BigInt(task.contactId) : undefined,
        listingId: task.listingId ? BigInt(task.listingId) : undefined,
        listingContactId: rawTaskData?.tasks.listingContactId ? BigInt(rawTaskData.tasks.listingContactId) : undefined,
      });

      if (appointmentResult.success && appointmentResult.appointmentId) {
        // Link appointment back to task
        await updateTaskWithAuth(taskId, {
          appointmentId: BigInt(appointmentResult.appointmentId),
        });

        toast.success("Cita creada", {
          description: "La tarea se ha añadido al calendario correctamente",
        });

        // Refresh task data
        await fetchTask();

        // Trigger refresh callback
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error("Error al crear la cita", {
          description: appointmentResult.error ?? "No se pudo crear la cita",
        });
      }
    } catch (error) {
      console.error("Error creating appointment from task:", error);
      toast.error("Error inesperado", {
        description: "Ocurrió un error al crear la cita",
      });
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[600px] [&>button]:hidden">
        <DialogHeader className="space-y-0 -mb-6">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex-1">
              {loading ? "Cargando..." : task ? task.title : "Tarea"}
            </DialogTitle>
            {task && !loading && (
              <div className="flex items-center gap-1 shrink-0">
                {canUserEditTask(task) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditModalOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Editar tarea"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canUserDeleteTask(task) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogDescription className="sr-only">
            {loading
              ? "Cargando detalles de la tarea"
              : task
                ? "Detalles de la tarea"
                : "Información de la tarea"}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : task ? (
          <>
            <div className="space-y-4 py-2">
              {/* Description */}
              {rawTaskData?.tasks.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {rawTaskData.tasks.description}
                </p>
              )}

              {/* Contact Information - Styled like creation modal */}
              {(task.contactFirstName ?? task.contactLastName) && (
                <div className="rounded-lg bg-white p-3 shadow-md">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                        {getInitials(
                          task.contactFirstName ?? undefined,
                          task.contactLastName ?? undefined,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        {task.contactId ? (
                          <Link
                            href={`/contactos/${task.contactId}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary transition-colors truncate"
                          >
                            {`${task.contactFirstName ?? ""} ${task.contactLastName ?? ""}`.trim()}
                          </Link>
                        ) : (
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {`${task.contactFirstName ?? ""} ${task.contactLastName ?? ""}`.trim()}
                          </div>
                        )}
                      </div>
                      {contactEmail && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="text-xs text-muted-foreground truncate">
                            {contactEmail}
                          </div>
                        </div>
                      )}
                      {contactPhone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="text-xs text-muted-foreground truncate">
                            {contactPhone}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Property Information - Styled like creation modal */}
              {task.propertyTitle && (
                <div className="rounded-lg bg-white p-3 shadow-md">
                  <div className="flex items-start gap-3">
                    {task.listingId ? (
                      <Link href={`/propiedades/${task.listingId}`} className="shrink-0">
                        {listingImageUrl ? (
                          <Image
                            src={listingImageUrl}
                            alt={task.propertyTitle ?? "Property"}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 cursor-pointer hover:opacity-80 transition-opacity">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </Link>
                    ) : (
                      <>
                        {listingImageUrl ? (
                          <Image
                            src={listingImageUrl}
                            alt={task.propertyTitle ?? "Property"}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-primary/10">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        {task.listingId ? (
                          <Link
                            href={`/propiedades/${task.listingId}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary transition-colors truncate"
                          >
                            {task.propertyTitle}
                          </Link>
                        ) : (
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {task.propertyTitle}
                          </div>
                        )}
                      </div>
                      {listingReferenceNumber && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {listingReferenceNumber}
                        </div>
                      )}
                      {listingCity && (
                        <div className="text-xs text-muted-foreground">
                          {listingCity}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status, Urgency, and Due Date Information */}
              {(Boolean(task.urgency) || Boolean(task.status) || Boolean(task.dueDate)) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.urgency && (
                      <Badge className={`${getUrgencyColor(task.urgency)} pointer-events-none`}>
                        {getUrgencyLabel(task.urgency)}
                      </Badge>
                    )}
                    {task.status && (
                      <Badge className={`${getStatusColor(task.status, task.completed)} pointer-events-none`}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    )}
                    <Link
                      href="/tareas"
                      className="text-xs text-gray-500 hover:text-primary transition-colors"
                    >
                      Ver todas las tareas →
                    </Link>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>
                        {getRemainingTime(task.dueDate) ?? formatDateTime(task.dueDate, rawTaskData?.tasks.dueTime ?? null)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer with Assigned User and Calendar Button */}
              {(task.userName ?? task.userFirstName ?? task.userLastName) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-100 text-gray-700 text-[10px] font-medium">
                          {getInitials(
                            task.userFirstName ?? undefined,
                            task.userLastName ?? undefined,
                            task.userName ?? undefined,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">
                        {task.userName ??
                          ((`${task.userFirstName ?? ""} ${task.userLastName ?? ""}`.trim() ||
                            "Usuario"))}
                      </span>
                    </div>
                    {/* Create appointment button - only show if task has date+time and no appointment linked */}
                    {(() => {
                      const hasDueTime = !!rawTaskData?.tasks.dueTime;
                      const hasAppointment = !!rawTaskData?.tasks.appointmentId;
                      const shouldShow = hasDueTime && !hasAppointment;

                      console.log('📅 Calendar button visibility check:', {
                        hasDueTime,
                        dueTime: rawTaskData?.tasks.dueTime,
                        hasAppointment,
                        appointmentId: rawTaskData?.tasks.appointmentId,
                        shouldShow,
                        taskId: task.taskId,
                      });

                      return shouldShow ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleCreateAppointment()}
                          disabled={isCreatingAppointment}
                          className="h-7 px-2 text-xs text-gray-500 hover:text-primary hover:bg-gray-100"
                          title="Añadir al calendario"
                        >
                          {isCreatingAppointment ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Añadiendo...
                            </>
                          ) : (
                            <>
                              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
                              Añadir al calendario
                            </>
                          )}
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              No se pudo cargar la tarea
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Por favor, intenta de nuevo más tarde
            </p>
          </div>
        )}
      </DialogContent>
      
      {/* Edit Modal */}
      {task && taskId && (
        <TaskEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          taskId={taskId}
          initialTaskData={rawTaskData} // Pass pre-fetched data to avoid redundant API call
          onSuccess={() => {
            // Refresh task data after successful update
            void fetchTask();
            setIsEditModalOpen(false);
            
            // Trigger refresh: use callback if provided, otherwise use router.refresh()
            if (onSuccess) {
              onSuccess();
            } else {
              router.refresh();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {task && (
            <div className="py-4">
              <p className="line-clamp-2 text-sm font-medium text-gray-900">
                {task.title}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteTask()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}


