"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Clock,
  Home,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { getTaskByIdWithAuth } from "~/server/queries/task";
import type { DetailedTask } from "~/lib/operations/task-utils";
import { getInitials, getRemainingTime } from "~/lib/operations/task-utils";

interface TaskViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
  initialTask?: DetailedTask | null;
}

export function TaskViewModal({
  open,
  onOpenChange,
  taskId,
  initialTask,
}: TaskViewModalProps) {
  const [task, setTask] = useState<DetailedTask | null>(initialTask ?? null);
  const [loading, setLoading] = useState(false);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [listingReferenceNumber, setListingReferenceNumber] = useState<string | null>(null);
  const [listingCity, setListingCity] = useState<string | null>(null);

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
      if (taskData?.tasks) {
        // Transform the task data to match DetailedTask format
        // Note: getTaskById doesn't include user info, so those fields will be null
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
          // User info not available from getTaskById
          userName: null,
          userFirstName: null,
          userLastName: null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {loading ? "Cargando..." : task ? task.title : "Tarea"}
          </DialogTitle>
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
            <div className="flex items-start justify-between gap-4 -mt-4 mb-2">
              <div className="flex-1">
                {task.completed && (
                  <div className="mt-2">
                    <Badge className="bg-emerald-500 text-white">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Completada
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 py-2">
              {/* Description */}
              {task.description && (
                <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}

              {/* Due Date - Subtle with remaining time */}
              {task.dueDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    {getRemainingTime(task.dueDate) || formatDateTime(task.dueDate, task.dueTime)}
                  </span>
                </div>
              )}

              {/* Contact Information - Styled like creation modal */}
              {(task.contactFirstName || task.contactLastName) && (
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

              {/* Status and Urgency Information */}
              {(task.urgency || task.status) && (
                <div className="flex flex-wrap items-center gap-2">
                  {task.urgency && (
                    <Badge className={getUrgencyColor(task.urgency)}>
                      {getUrgencyLabel(task.urgency)}
                    </Badge>
                  )}
                  {task.status && (
                    <Badge className="bg-amber-100 text-amber-700">
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
              )}

              {/* Footer with Metadata and Assigned User */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  {/* Assigned User */}
                  {task.userName || task.userFirstName || task.userLastName ? (
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
                  ) : (
                    <div />
                  )}

                  {/* Metadata */}
                  {task.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Intl.DateTimeFormat("es-ES", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(task.createdAt))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
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
    </Dialog>
  );
}


