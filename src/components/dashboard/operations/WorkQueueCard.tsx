"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  CheckSquare,
  Check,
  Trash2,
  Loader2,
  Home,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import type {
  UrgentTask,
  TodayAppointment,
} from "~/server/queries/operaciones-dashboard";
import {
  type getMostUrgentTasksWithAuth,
  updateTaskWithAuth,
  deleteTaskWithAuth,
} from "~/server/queries/task";
import {
  canEditAllTasks,
  canDeleteAllTasks,
} from "~/app/actions/permissions/check-permissions";
import { TaskFilter, type TaskFilters } from "./TaskFilter";
import { AppointmentFilter } from "./AppointmentFilter";

type DetailedTask = Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>[0];

interface WorkQueueCardProps {
  tasks: UrgentTask[];
  appointments: TodayAppointment[];
  detailedTasks?: DetailedTask[];
  loading?: boolean;
  className?: string;
  users?: Array<{ id: string; name: string }>;
  // New props for agent page context
  selectedAgentId?: string;
  showAllTasks?: boolean; // When true, don't limit to 10 tasks
  standalone?: boolean; // Improve aesthetics when used outside dashboard grid
}

export default function WorkQueueCard({
  tasks,
  appointments,
  detailedTasks = [],
  loading = false,
  className = "",
  users = [],
  selectedAgentId: _selectedAgentId,
  showAllTasks = false,
  standalone = false,
}: WorkQueueCardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [taskStates, setTaskStates] = useState<
    Record<string, "saving" | "saved" | "error">
  >({});
  const [optimisticTasks, setOptimisticTasks] = useState<DetailedTask[]>([]);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [expandedPhones, setExpandedPhones] = useState<Set<string>>(new Set());

  // Permission states
  const [hasEditAllPermission, setHasEditAllPermission] = useState(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Fetch permissions on mount
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
      } finally {
        setPermissionsLoaded(true);
      }
    };

    void fetchPermissions();
  }, []);

  // Update optimistic tasks when detailedTasks changes
  useEffect(() => {
    setOptimisticTasks(detailedTasks);
  }, [detailedTasks]);

  // Permission helper functions
  const canUserEditTask = (task: DetailedTask): boolean => {
    if (!session?.user?.id || !permissionsLoaded) return false;

    // Tasks without owner require editAll permission
    if (!task.userId) {
      return hasEditAllPermission;
    }

    // User can edit if they are assigned to the task OR have editAll permission
    return task.userId === session.user.id || hasEditAllPermission;
  };

  const canUserDeleteTask = (task: DetailedTask): boolean => {
    if (!session?.user?.id || !permissionsLoaded) return false;

    // Tasks without owner require deleteAll permission
    if (!task.userId) {
      return hasDeleteAllPermission;
    }

    // User can delete if they are assigned to the task OR have deleteAll permission
    return task.userId === session.user.id || hasDeleteAllPermission;
  };

  // Read filters from URL params - updates automatically when searchParams change
  const taskFilters: TaskFilters = {
    urgency: searchParams.get("urgency")
      ? searchParams.get("urgency")!.split(",").map(Number)
      : [],
    status: searchParams.get("status")
      ? searchParams.get("status")!.split(",")
      : [],
    assignedTo: searchParams.get("assignedTo")
      ? searchParams.get("assignedTo")!.split(",")
      : [],
    category: searchParams.get("category")
      ? searchParams.get("category")!.split(",")
      : [],
  };

  // Apply filters to tasks
  const applyFilters = (tasks: DetailedTask[]) => {
    return tasks.filter((task) => {
      // Filter by urgency
      if (
        taskFilters.urgency.length > 0 &&
        !taskFilters.urgency.includes(task.urgency ?? 0)
      ) {
        return false;
      }

      // Filter by status
      if (
        taskFilters.status.length > 0 &&
        !taskFilters.status.includes(task.status ?? "")
      ) {
        return false;
      }

      // Filter by assignedTo (userId)
      if (
        taskFilters.assignedTo.length > 0 &&
        !taskFilters.assignedTo.includes(task.userId ?? "")
      ) {
        return false;
      }

      // Filter by category
      if (
        taskFilters.category.length > 0 &&
        !taskFilters.category.includes(task.category ?? "")
      ) {
        return false;
      }

      return true;
    });
  };

  // Use optimistic tasks or detailedTasks (already filtered by backend), apply filters, then sort with completed tasks at the bottom
  const tasksToDisplay = applyFilters(
    optimisticTasks.length > 0 ? optimisticTasks : detailedTasks,
  ).sort((a, b) => {
    // Completed tasks go to the bottom
    if ((a.completed ?? false) !== (b.completed ?? false)) {
      return (a.completed ?? false) ? 1 : -1;
    }
    // Otherwise sort by due date
    return (
      new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime()
    );
  });

  const formatTime = (date: Date | string) => {
    const dateObj = new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "--:--";
    }

    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const formatDate = (date: Date | string) => {
    const today = new Date();
    const taskDate = new Date(date);

    // Check if date is valid
    if (isNaN(taskDate.getTime())) {
      return "Fecha inválida";
    }

    if (taskDate.toDateString() === today.toDateString()) {
      return "Hoy";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (taskDate.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    }

    return new Intl.DateTimeFormat("es-ES", {
      month: "short",
      day: "numeric",
    }).format(taskDate);
  };

  const getDaysUntilDueColor = (days: number) => {
    if (days <= 1) return "bg-red-100 text-red-800 border-red-200";
    if (days <= 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getEntityTypeIcon = (entityType: UrgentTask["entityType"]) => {
    switch (entityType) {
      case "prospect":
        return <User className="h-3 w-3" />;
      case "lead":
        return <User className="h-3 w-3" />;
      case "deal":
        return <CheckCircle2 className="h-3 w-3" />;
      case "listing":
        return <MapPin className="h-3 w-3" />;
      case "appointment":
        return <Calendar className="h-3 w-3" />;
      default:
        return <CheckSquare className="h-3 w-3" />;
    }
  };

  const formatAppointmentDate = (date: Date | string) => {
    const today = new Date();
    const appointmentDate = new Date(date);

    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) {
      return "Fecha inválida";
    }

    if (appointmentDate.toDateString() === today.toDateString()) {
      return "Hoy";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return "Mañana";
    }

    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
    }).format(appointmentDate);
  };

  const getAppointmentTypeInSpanish = (appointmentType: string) => {
    // Map English appointment types to Spanish
    const typeMap: Record<string, string> = {
      viewing: "visita",
      visit: "visita",
      Visita: "visita",
      meeting: "reunión",
      reunion: "reunión",
      Reunión: "reunión",
      signing: "firma",
      sign: "firma",
      Firma: "firma",
      closing: "cierre",
      close: "cierre",
      Cierre: "cierre",
      travel: "viaje",
      trip: "viaje",
      Viaje: "viaje",
    };

    return typeMap[appointmentType] ?? appointmentType?.toLowerCase() ?? "cita";
  };

  const getInitials = (
    firstName?: string,
    lastName?: string,
    name?: string,
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (name) {
      const parts = name.split(" ").filter((p) => p.length > 0);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      } else if (parts[0]) {
        return parts[0].charAt(0).toUpperCase();
      }
    }
    return "U";
  };

  const getRemainingTime = (dueDate?: Date | string | null) => {
    if (!dueDate) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateObj = new Date(dueDate);
    const taskDate = new Date(
      dueDateObj.getFullYear(),
      dueDateObj.getMonth(),
      dueDateObj.getDate(),
    );

    const fullDueDateTime = new Date(
      dueDateObj.getFullYear(),
      dueDateObj.getMonth(),
      dueDateObj.getDate(),
      23,
      59,
    );

    const diffMs = fullDueDateTime.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays);
      const overdueHours = Math.abs(diffHours);
      if (overdueDays > 0) {
        return `${overdueDays} día${overdueDays !== 1 ? "s" : ""} vencido`;
      } else if (overdueHours > 0) {
        return `${overdueHours} hora${overdueHours !== 1 ? "s" : ""} vencido`;
      } else {
        return "Vencido";
      }
    }

    if (taskDate.getTime() === today.getTime()) {
      if (diffHours > 0) {
        return `${diffHours} hora${diffHours !== 1 ? "s" : ""} restantes`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minuto${diffMinutes !== 1 ? "s" : ""} restantes`;
      } else {
        return "Vence ahora";
      }
    } else {
      return `${diffDays} día${diffDays !== 1 ? "s" : ""} restantes`;
    }
  };

  const handleToggleCompleted = async (
    taskId: number,
    currentCompleted: boolean,
  ) => {
    // Find the task to check permissions
    const task = optimisticTasks.find((t) => t.taskId === taskId);
    if (!task) return;

    // Check permission
    if (!canUserEditTask(task)) {
      console.warn("User does not have permission to edit this task");
      // Optionally show toast notification here
      return;
    }

    const taskIdStr = taskId.toString();
    const newCompleted = !currentCompleted;

    // Optimistic update - immediately update the UI
    setOptimisticTasks((prev) =>
      prev.map((task) =>
        task.taskId === taskId ? { ...task, completed: newCompleted } : task,
      ),
    );

    setTaskStates((prev) => ({ ...prev, [taskIdStr]: "saving" }));

    try {
      // Use the general task update function
      await updateTaskWithAuth(taskId, {
        completed: newCompleted,
      });

      setTaskStates((prev) => ({ ...prev, [taskIdStr]: "saved" }));

      // Clear the saved state after 2 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[taskIdStr];
          return newStates;
        });
      }, 2000);
    } catch (error) {
      console.error("Error updating task:", error);

      // Revert optimistic update on error
      setOptimisticTasks((prev) =>
        prev.map((task) =>
          task.taskId === taskId
            ? { ...task, completed: currentCompleted }
            : task,
        ),
      );

      setTaskStates((prev) => ({ ...prev, [taskIdStr]: "error" }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[taskIdStr];
          return newStates;
        });
      }, 5000);
    }
  };

  const confirmDeleteTask = (taskId: number, taskTitle: string) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
  };

  const handleDeleteTask = async (taskId: number) => {
    const taskIdStr = taskId.toString();

    // Store the task for potential reversion
    const taskToDeleteData = optimisticTasks.find((t) => t.taskId === taskId);
    if (!taskToDeleteData) return;

    // Check permission
    if (!canUserDeleteTask(taskToDeleteData)) {
      console.warn("User does not have permission to delete this task");
      setTaskToDelete(null); // Close dialog
      // Optionally show toast notification here
      return;
    }

    // Close the confirmation dialog
    setTaskToDelete(null);

    // Optimistic update - immediately remove from UI
    setOptimisticTasks((prev) => prev.filter((task) => task.taskId !== taskId));
    setTaskStates((prev) => ({ ...prev, [taskIdStr]: "saving" }));

    try {
      // Use the general task delete function
      await deleteTaskWithAuth(taskId);
      setTaskStates((prev) => ({ ...prev, [taskIdStr]: "saved" }));

      // Clear the saved state after 1 second
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[taskIdStr];
          return newStates;
        });
      }, 1000);
    } catch (error) {
      console.error("Error deleting task:", error);

      // Revert optimistic update on error - restore the task
      setOptimisticTasks((prev) =>
        [...prev, taskToDeleteData].sort(
          (a, b) =>
            new Date(a.dueDate ?? 0).getTime() -
            new Date(b.dueDate ?? 0).getTime(),
        ),
      );

      setTaskStates((prev) => ({ ...prev, [taskIdStr]: "error" }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[taskIdStr];
          return newStates;
        });
      }, 5000);
    }
  };

  // Legacy handler for old task format
  const handleCompleteTask = async (taskId: bigint) => {
    await handleToggleCompleted(Number(taskId), false); // Assume task is not completed when using this legacy handler
  };

  const toggleDateCollapse = (dateLabel: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateLabel)) {
        newSet.delete(dateLabel);
      } else {
        newSet.add(dateLabel);
      }
      return newSet;
    });
  };

  const togglePhoneExpanded = (appointmentId: string) => {
    setExpandedPhones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  return (
    <Card className={`${standalone ? "shadow-lg" : ""} ${className}`}>
      <CardContent className={standalone ? "p-4 sm:p-6 md:p-8" : "pt-2 px-4 sm:px-6"}>
        <div className={`${standalone ? "mt-2" : "mt-4"} grid gap-4 sm:gap-6 lg:grid-cols-2`}>
          {/* Columna de Tareas Urgentes */}
          <div>
            <div className="relative mb-3 sm:mb-4">
              <div className="flex items-center">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Tareas Urgentes</h3>
                <div className="ml-auto">
                  <TaskFilter users={users} inline iconOnly />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg p-2.5 shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-gray-200"></div>
                      <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (tasksToDisplay.length > 0 ? tasksToDisplay : tasks).length ===
              0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                <p className="text-sm font-medium text-gray-900">
                  ¡Todo al día!
                </p>
                <p className="text-xs text-gray-500">No hay tareas urgentes</p>
              </div>
            ) : tasksToDisplay.length > 0 ? (
              <div className="custom-scrollbar max-h-80 space-y-1.5 overflow-y-auto px-1 py-1.5">
                {(showAllTasks ? tasksToDisplay : tasksToDisplay.slice(0, 10)).map((task) => {
                  const taskIdStr = task.taskId.toString();
                  const canEdit = canUserEditTask(task);
                  const canDelete = canUserDeleteTask(task);

                  return (
                    <div key={taskIdStr} className="relative rounded-lg">
                      {/* Red delete background - only shown when BOTH dragging AND has permission */}
                      {draggingTask === taskIdStr && canDelete && (
                        <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4">
                          <Trash2 className="h-5 w-5 text-white" />
                        </div>
                      )}

                      {/* Swipeable task card */}
                      <motion.div
                        drag={canDelete ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={canDelete ? 0.2 : 0}
                        onDragStart={() => {
                          // Only enable swipe-to-delete on mobile AND if user has permission
                          if (window.innerWidth < 640 && canDelete) {
                            setDraggingTask(taskIdStr);
                          }
                        }}
                        onDragEnd={(_e, info) => {
                          setDraggingTask(null);

                          // Only enable swipe-to-delete on mobile AND if user has permission
                          if (window.innerWidth >= 640 || !canDelete) return;

                          // If swiped more than 100px to the right, show delete confirmation
                          if (info.offset.x > 100) {
                            confirmDeleteTask(task.taskId, task.title);
                          }
                        }}
                        className={`relative z-10 rounded-lg p-2 shadow-md transition-shadow duration-200 sm:p-3 ${
                          (task.completed ?? false)
                            ? "bg-gray-50 opacity-75"
                            : "bg-white"
                        } ${taskStates[taskIdStr] === "saving" ? "opacity-70" : ""} ${
                          canEdit ? "cursor-pointer hover:shadow-lg" : "cursor-not-allowed opacity-60"
                        }`}
                        onClick={() => {
                          if (canEdit) {
                            void handleToggleCompleted(
                              task.taskId,
                              task.completed ?? false,
                            );
                          }
                        }}
                      >
                        {/* Days remaining badge and Avatar - top right, side by side */}
                        <div className="absolute right-2 top-2 mt-1.5 flex items-center gap-1">
                          {task.dueDate && (() => {
                            const now = new Date();
                            const dueDate = new Date(task.dueDate);
                            const fullDueDateTime = new Date(
                              dueDate.getFullYear(),
                              dueDate.getMonth(),
                              dueDate.getDate(),
                              23,
                              59,
                            );
                            const diffMs = fullDueDateTime.getTime() - now.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

                            // Determine color based on time remaining (matching tareas.tsx)
                            let colorClasses = "";
                            if (diffMs < 0) {
                              // Overdue - rose
                              colorClasses = "bg-rose-100 text-rose-800";
                            } else if (diffHours < 24) {
                              // Less than 1 day - orange
                              colorClasses = "bg-orange-100 text-orange-800";
                            } else {
                              // More than 1 day - yellow
                              colorClasses = "bg-yellow-100 text-yellow-800";
                            }

                            return (
                              <span
                                className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${colorClasses}`}
                              >
                                {getRemainingTime(task.dueDate)}
                              </span>
                            );
                          })()}

                          <Avatar
                            className="h-4 w-4 ring-1 ring-gray-100"
                            title={
                              task.userName ??
                              (`${task.userFirstName ?? ""} ${task.userLastName ?? ""}`.trim() ||
                                "Usuario")
                            }
                          >
                            <AvatarFallback className="text-[10px] font-medium">
                              {getInitials(
                                task.userFirstName,
                                task.userLastName ?? undefined,
                                task.userName,
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Mobile: Compact layout, Desktop: Original layout */}
                        <div className="flex flex-col gap-1.5">
                          {/* Header row: Checkbox and Title */}
                          <div className="flex items-start gap-1.5 sm:gap-2">
                            {/* Checkbox */}
                            <div
                              className={`mt-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                                (task.completed ?? false)
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {(task.completed ?? false) && (
                                <Check className="h-2 w-2" />
                              )}
                            </div>

                            {/* Title */}
                            <div className="min-w-0 flex-1 pr-20 sm:pr-24">
                              <h3
                                className={`min-w-0 flex-1 break-words text-xs font-semibold leading-tight sm:text-sm ${(task.completed ?? false) ? "text-gray-500 line-through" : "text-gray-900"}`}
                              >
                                {task.title.length > 45
                                  ? `${task.title.substring(0, 45)}...`
                                  : task.title}
                              </h3>
                            </div>
                          </div>

                          {/* Property and Contact links - more compact on mobile */}
                          {(Boolean(task.listingId && task.propertyTitle) ||
                            Boolean(
                              task.contactId &&
                                (task.contactFirstName ?? task.contactLastName),
                            )) && (
                            <div className="ml-5 flex flex-wrap items-center gap-1.5 sm:ml-6">
                              {/* Property Link */}
                              {task.listingId && task.propertyTitle && (
                                <Link
                                  href={`/propiedades/${task.listingId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300 sm:px-2.5 sm:py-1 sm:text-xs ${
                                    (task.completed ?? false)
                                      ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                                      : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                                  }`}
                                >
                                  <Home className="h-2.5 w-2.5 flex-shrink-0 opacity-60 sm:h-3 sm:w-3" />
                                  <span className="break-words">
                                    {task.propertyTitle.length > 30
                                      ? `${task.propertyTitle.substring(0, 30)}...`
                                      : task.propertyTitle}
                                  </span>
                                </Link>
                              )}

                              {/* Contact Link */}
                              {task.contactId &&
                                (task.contactFirstName ??
                                  task.contactLastName) && (
                                  <Link
                                    href={`/contactos/${task.contactId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300 sm:px-2.5 sm:py-1 sm:text-xs ${
                                      (task.completed ?? false)
                                        ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                                        : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                                    }`}
                                  >
                                    <User className="h-2.5 w-2.5 flex-shrink-0 opacity-60 sm:h-3 sm:w-3" />
                                    <span className="break-words">
                                      {(() => {
                                        const fullName = `${task.contactFirstName ?? ""} ${task.contactLastName ?? ""}`.trim();
                                        return fullName.length > 20
                                          ? `${fullName.substring(0, 20)}...`
                                          : fullName;
                                      })()}
                                    </span>
                                  </Link>
                                )}
                            </div>
                          )}
                        </div>

                        {/* Status icons - bottom right */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                          {taskStates[taskIdStr] === "saving" && (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          )}
                          {taskStates[taskIdStr] === "saved" && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {!showAllTasks && tasksToDisplay.length > 10 && (
                  <div className="pt-2 text-center">
                    <Button variant="ghost" size="sm">
                      Ver todas las {tasksToDisplay.length} tareas
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="custom-scrollbar max-h-80 space-y-3 overflow-y-auto pr-1">
                {tasks.slice(0, 10).map((task, index) => (
                  <motion.div
                    key={task.taskId.toString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg bg-white p-3 shadow-md transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {getEntityTypeIcon(task.entityType)}
                          <span className="text-xs font-medium capitalize text-gray-600">
                            {task.entityType ?? "General"}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getDaysUntilDueColor(task.daysUntilDue)}`}
                          >
                            {task.daysUntilDue === 1
                              ? "Vence Mañana"
                              : `${task.daysUntilDue} días`}
                          </Badge>
                        </div>

                        <p className="line-clamp-2 text-sm font-medium text-gray-900">
                          {task.description}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span>{task.entityName}</span>
                          <span>•</span>
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteTask(task.taskId)}
                        className="flex-shrink-0"
                      >
                        <CheckSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {tasks.length > 10 && (
                  <div className="pt-2 text-center">
                    <Button variant="ghost" size="sm">
                      Ver todas las {tasks.length} tareas
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna de Citas */}
          <div>
            <div className="relative mb-3 sm:mb-4">
              <div className="flex items-center">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Próximos Eventos</h3>
                <div className="ml-auto">
                  <AppointmentFilter users={users} inline iconOnly />
                </div>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <Calendar className="mb-2 h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">Sin eventos</p>
                <p className="text-xs text-gray-500">
                  No hay eventos programados para los próximos 7 días
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {(() => {
                  // Group appointments by date
                  const groupedAppointments = appointments.reduce(
                    (groups, appointment) => {
                      const dateLabel = formatAppointmentDate(
                        appointment.startTime,
                      );
                      groups[dateLabel] ??= [];
                      groups[dateLabel].push(appointment);
                      return groups;
                    },
                    {} as Record<string, typeof appointments>,
                  );

                  return Object.entries(groupedAppointments).map(
                    ([dateLabel, dayAppointments]) => {
                      const isCollapsed = collapsedDates.has(dateLabel);

                      return (
                        <div key={dateLabel} className="space-y-2">
                          {/* Date Separator - Collapsible */}
                          <button
                            onClick={() => toggleDateCollapse(dateLabel)}
                            className="flex w-full items-center py-1"
                          >
                            <span className="cursor-pointer rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 transition-opacity hover:opacity-70">
                              {dateLabel}
                            </span>
                          </button>

                          {/* Appointments for this date */}
                          {!isCollapsed && (
                            <div className="space-y-2">
                          {dayAppointments.map((appointment, index) => {
                            // Check if this appointment is selected based on URL params
                            // Selection logic: listingId must always match, and contactId must match if it exists in both
                            const appointmentListingId = searchParams.get("appointmentListingId");
                            const appointmentContactId = searchParams.get("appointmentContactId");

                            const listingMatches = appointmentListingId &&
                              appointment.listingId &&
                              Number(appointment.listingId) === Number(appointmentListingId);

                            const contactMatches = !appointmentContactId ? true : // No contact in filter = always matches
                              (appointment.contactId && Number(appointment.contactId) === Number(appointmentContactId));

                            const isSelected = listingMatches && contactMatches;
                            const appointmentIdStr = appointment.appointmentId.toString();
                            const isPhoneExpanded = expandedPhones.has(appointmentIdStr);

                            return (
                              <motion.div
                                key={appointment.appointmentId.toString()}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => {
                                  // Get current URL params
                                  const params = new URLSearchParams(searchParams.toString());
                                  
                                  // Toggle filter: if already selected, clear it; otherwise set it
                                  if (isSelected) {
                                    params.delete("appointmentListingId");
                                    params.delete("appointmentContactId");
                                  } else {
                                    // Remove any existing appointment filter first
                                    params.delete("appointmentListingId");
                                    params.delete("appointmentContactId");
                                    
                                    // Add new filter params
                                    if (appointment.listingId) {
                                      params.set("appointmentListingId", appointment.listingId.toString());
                                    }
                                    if (appointment.contactId) {
                                      params.set("appointmentContactId", appointment.contactId.toString());
                                    }
                                  }
                                  
                                  // Update URL
                                  router.push(`?${params.toString()}`);
                                }}
                                className={`group relative cursor-pointer rounded-lg p-3 sm:p-4 transition-all duration-200 ${
                                  isSelected
                                    ? "bg-gray-100 shadow-lg"
                                    : "bg-white shadow-sm hover:shadow-md"
                                }`}
                              >
                                {/* Type Badge */}
                                <div className="absolute right-2 sm:right-3 top-2 sm:top-3 flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-medium uppercase tracking-wide ${
                                      isSelected ? "text-gray-800" : "text-gray-400"
                                    }`}
                                  >
                                    {getAppointmentTypeInSpanish(
                                      appointment.appointmentType,
                                    )}
                                  </span>
                                </div>

                                {/* Time - bottom right */}
                                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 font-mono">
                                  <div className="text-[10px] font-medium tabular-nums text-gray-600">
                                    {formatTime(appointment.startTime)}
                                  </div>
                                  <div className="text-[10px] text-gray-400">—</div>
                                  <div className="text-[10px] tabular-nums text-gray-500">
                                    {formatTime(appointment.endTime)}
                                  </div>
                                </div>

                                {/* Main content */}
                                <div className="pr-12 sm:pr-16">
                                  {/* Contact name with phone number inline */}
                                  <div className="mb-2 sm:mb-2.5 flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 break-words">
                                      {appointment.contactName}
                                    </h3>
                                    {appointment.contactPhone && (
                                      <div className="group/phone flex items-center gap-1 text-xs text-gray-700">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPhoneExpanded) {
                                              // If already expanded, trigger the call
                                              window.location.href = `tel:${appointment.contactPhone}`;
                                            } else {
                                              // First click: expand the number
                                              togglePhoneExpanded(appointmentIdStr);
                                            }
                                          }}
                                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-transparent shadow-md transition-shadow hover:shadow-lg"
                                        >
                                          <Phone className="h-2.5 w-2.5 fill-current" />
                                        </button>
                                        <span
                                          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                                            isPhoneExpanded ? "max-w-[150px]" : "max-w-0 sm:group-hover/phone:max-w-[150px]"
                                          }`}
                                        >
                                          {appointment.contactPhone}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Address */}
                                  {appointment.propertyAddress && (
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.propertyAddress)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-start gap-1 transition-colors hover:text-blue-600 min-w-0"
                                    >
                                      <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-400" />
                                      <span className="line-clamp-2 text-xs leading-tight text-gray-600 hover:underline break-words min-w-0">
                                        {appointment.propertyAddress}
                                      </span>
                                    </a>
                                  )}

                                  {/* Registrar Visita Button - Only show when selected and it's a scheduled Visita */}
                                  {isSelected &&
                                    getAppointmentTypeInSpanish(
                                      appointment.appointmentType,
                                    ) === "visita" &&
                                    appointment.status === "Scheduled" && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-full justify-start px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                              `/calendario/visita/${appointment.appointmentId}`,
                                            );
                                          }}
                                        >
                                          <Calendar className="mr-1.5 h-3 w-3 shrink-0" />
                                          <span className="truncate">Registrar Visita</span>
                                        </Button>
                                      </div>
                                    )}
                                </div>
                              </motion.div>
                            );
                          })}
                            </div>
                          )}
                        </div>
                      );
                    },
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <Dialog
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta tarea?
            </DialogDescription>
          </DialogHeader>

          {taskToDelete && (
            <div className="py-4">
              <p className="line-clamp-2 text-sm font-medium text-gray-900">
                {taskToDelete.title}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTaskToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (taskToDelete) {
                  void handleDeleteTask(taskToDelete.id);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
