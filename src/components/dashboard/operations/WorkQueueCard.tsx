"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
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
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import type {
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
import { TaskViewModal } from "~/components/tasks/task-view-modal";
import { TaskCard } from "~/components/tasks/task-card";

type DetailedTask = Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>[0];

interface WorkQueueCardProps {
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

  // Helper function to normalize taskId for comparison (handles BigInt, Number, and String)
  const normalizeTaskId = (taskId: bigint | number | string | undefined): number => {
    if (taskId === undefined) return 0;
    if (typeof taskId === 'string') return Number(taskId);
    if (typeof taskId === 'bigint') return Number(taskId);
    return taskId;
  };
  const [optimisticTasks, setOptimisticTasks] = useState<DetailedTask[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [expandedPhones, setExpandedPhones] = useState<Set<string>>(new Set());
  const [selectedTaskForView, setSelectedTaskForView] = useState<{
    taskId: number;
    task: DetailedTask;
  } | null>(null);

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

    // Tasks without creator require editAll permission
    if (!task.createdBy) {
      return hasEditAllPermission;
    }

    // User can edit if they created the task OR have editAll permission
    return task.createdBy === session.user.id || hasEditAllPermission;
  };

  const canUserDeleteTask = (task: DetailedTask): boolean => {
    if (!session?.user?.id || !permissionsLoaded) return false;

    // Tasks without creator require deleteAll permission
    if (!task.createdBy) {
      return hasDeleteAllPermission;
    }

    // User can delete if they created the task OR have deleteAll permission
    return task.createdBy === session.user.id || hasDeleteAllPermission;
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
    
    // Priority order:
    // 1. Critical tasks (urgency = 5) with NO due date (highest priority)
    // 2. Critical tasks (urgency = 5) with due date
    // 3. Non-critical tasks with NO due date
    // 4. Non-critical tasks with due date (lowest priority)
    
    const aIsCritical = (a.urgency ?? 0) === 5;
    const bIsCritical = (b.urgency ?? 0) === 5;
    const aHasDate = a.dueDate != null;
    const bHasDate = b.dueDate != null;
    
    // Calculate priority score: critical + no date = highest priority
    const getPriorityScore = (isCritical: boolean, hasDate: boolean) => {
      if (isCritical && !hasDate) return 0; // Highest priority
      if (isCritical && hasDate) return 1;
      if (!isCritical && !hasDate) return 2;
      return 3; // Lowest priority
    };
    
    const aPriority = getPriorityScore(aIsCritical, aHasDate);
    const bPriority = getPriorityScore(bIsCritical, bHasDate);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority; // Lower priority score = higher priority
    }
    
    // Same priority level - sort by due date (earlier dates first, null dates treated as 0)
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;

    if (aDate !== bDate) {
      return aDate - bDate;
    }

    // Same priority and due date - sort by urgency (higher urgency first)
    return (b.urgency ?? 0) - (a.urgency ?? 0);
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

  // const formatDate = (date: Date | string) => {
  //   const today = new Date();
  //   const taskDate = new Date(date);

  //   // Check if date is valid
  //   if (isNaN(taskDate.getTime())) {
  //     return "Fecha inválida";
  //   }

  //   if (taskDate.toDateString() === today.toDateString()) {
  //     return "Hoy";
  //   }

  //   const tomorrow = new Date(today);
  //   tomorrow.setDate(today.getDate() + 1);

  //   if (taskDate.toDateString() === tomorrow.toDateString()) {
  //     return "Mañana";
  //   }

  //   return new Intl.DateTimeFormat("es-ES", {
  //     month: "short",
  //     day: "numeric",
  //   }).format(taskDate);
  // };


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

  const handleToggleCompleted = async (
    taskId: number | string,
    _currentCompleted: boolean,
  ) => {
    // Normalize taskId to number for comparison with database values
    const taskIdNum = typeof taskId === 'string' ? Number(taskId) : taskId;

    console.log("🔍 handleToggleCompleted called with:", {
      taskId,
      taskIdType: typeof taskId,
      taskIdNum,
      taskIdNumType: typeof taskIdNum,
    });

    // Find the task in the correct array (same logic as tasksToDisplay)
    const sourceArray = optimisticTasks.length > 0 ? optimisticTasks : detailedTasks;

    console.log("📦 Source array info:", {
      arrayUsed: optimisticTasks.length > 0 ? 'optimisticTasks' : 'detailedTasks',
      arrayLength: sourceArray.length,
      optimisticTasksLength: optimisticTasks.length,
      detailedTasksLength: detailedTasks.length,
    });

    console.log("📋 All taskIds in source array:", sourceArray.map(t => ({
      taskId: t.taskId,
      taskIdType: typeof t.taskId,
      normalized: normalizeTaskId(t.taskId),
      title: t.title?.substring(0, 30),
    })));

    // Find task - handle both BigInt and Number comparison
    const task = sourceArray.find((t) => normalizeTaskId(t.taskId) === taskIdNum);

    if (!task) {
      console.error("❌ Task not found for toggle!", {
        lookingFor: taskIdNum,
        lookingForType: typeof taskIdNum,
        availableIds: sourceArray.map(t => normalizeTaskId(t.taskId)),
        comparison: sourceArray.map(t => ({
          taskId: t.taskId,
          normalized: normalizeTaskId(t.taskId),
          matches: normalizeTaskId(t.taskId) === taskIdNum,
        })),
      });
      return;
    }

    console.log("✅ Task found:", {
      taskId: task.taskId,
      taskIdType: typeof task.taskId,
      title: task.title,
      completed: task.completed,
    });

    // Check permission
    if (!canUserEditTask(task)) {
      console.warn("User does not have permission to edit this task", {
        taskId: taskIdNum,
        userId: session?.user?.id,
        createdBy: task.createdBy,
        hasEditAllPermission,
      });
      // Optionally show toast notification here
      return;
    }

    const taskIdStr = taskIdNum.toString();
    const newCompleted = !task.completed;
    // When completing, move to "finished"; when uncompleting, always move to "validation"
    const newStatus = newCompleted ? "finished" : "validation";

    console.log("🔄 Starting optimistic update:", {
      taskIdNum,
      currentCompleted: task.completed,
      newCompleted,
    });

    // Optimistic update - immediately update the UI
    // If optimisticTasks is empty, populate it from detailedTasks first
    setOptimisticTasks((prev) => {
      const arrayToUpdate = prev.length > 0 ? prev : detailedTasks;
      console.log("⚙️ Optimistic update - array to update:", {
        source: prev.length > 0 ? 'prev (optimisticTasks)' : 'detailedTasks',
        length: arrayToUpdate.length,
      });

      const updated = arrayToUpdate.map((task) => {
        const matches = normalizeTaskId(task.taskId) === taskIdNum;
        if (matches) {
          console.log("✏️ Updating task:", {
            taskId: task.taskId,
            from: task.completed,
            to: newCompleted,
          });
        }
        return matches ? { ...task, completed: newCompleted } : task;
      });

      console.log("✅ Optimistic update complete. Updated tasks:",
        updated.filter(t => normalizeTaskId(t.taskId) === taskIdNum).map(t => ({
          taskId: t.taskId,
          completed: t.completed,
        }))
      );

      return updated;
    });

    setTaskStates((prev) => ({ ...prev, [taskIdStr]: "saving" }));

    try {
      // Use the general task update function
      await updateTaskWithAuth(taskIdNum, {
        completed: newCompleted,
        status: newStatus,
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
      setOptimisticTasks((prev) => {
        const arrayToUpdate = prev.length > 0 ? prev : detailedTasks;
        return arrayToUpdate.map((t) =>
          normalizeTaskId(t.taskId) === taskIdNum ? { ...t, completed: task.completed } : t
        );
      });

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

    // Store the task for potential reversion - handle BigInt comparison
    const taskToDeleteData = optimisticTasks.find((t) => normalizeTaskId(t.taskId) === taskId);
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
    setOptimisticTasks((prev) => prev.filter((task) => normalizeTaskId(task.taskId) !== taskId));
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
            ) : tasksToDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                <p className="text-sm font-medium text-gray-900">
                  ¡Todo al día!
                </p>
                <p className="text-xs text-gray-500">No hay tareas urgentes</p>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-80 space-y-1.5 overflow-y-auto px-3 py-1.5">
                {(showAllTasks ? tasksToDisplay : tasksToDisplay.slice(0, 10)).map((task) => {
                  const taskIdStr = task.taskId.toString();
                  const canEdit = canUserEditTask(task);
                  const canDelete = canUserDeleteTask(task);

                  // Ensure task has an id field for TaskCard compatibility
                  const taskWithId = {
                    ...task,
                    id: taskIdStr,
                  };

                  return (
                    <TaskCard
                      key={taskIdStr}
                      task={taskWithId}
                      showPropertyBadge={true}
                      onToggleCompleted={async (taskId, currentCompleted) => {
                        await handleToggleCompleted(taskId, currentCompleted);
                      }}
                      onDeleteClick={(taskId, title) => {
                        confirmDeleteTask(Number(taskId), title);
                      }}
                      onTaskClick={(taskId, task) => {
                        setSelectedTaskForView({ taskId: Number(taskId), task });
                      }}
                      taskState={taskStates[taskIdStr]}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
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
                  No hay eventos programados para los próximos 14 días
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
                                    : "bg-white shadow-md hover:shadow-lg"
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
                                        {appointment.city && ` - ${appointment.city}`}
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
                                          variant="outline"
                                          size="sm"
                                          className="h-6 w-auto bg-white px-2 text-xs font-medium shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                              `/calendario/visita/${appointment.appointmentId}`,
                                            );
                                          }}
                                        >
                                          <Calendar className="mr-1 h-3 w-3 shrink-0" />
                                          <span>Registrar Visita</span>
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

      {/* Task View Modal */}
      <TaskViewModal
        open={selectedTaskForView !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskForView(null);
          }
        }}
        taskId={selectedTaskForView?.taskId ?? null}
        initialTask={selectedTaskForView?.task ?? null}
        onSuccess={() => {
          // Refresh the page to get updated task data
          router.refresh();
          // Also remove from optimistic tasks if it was deleted
          if (selectedTaskForView?.taskId) {
            setOptimisticTasks((prev) =>
              prev.filter((t) => normalizeTaskId(t.taskId) !== selectedTaskForView.taskId)
            );
          }
        }}
      />
    </Card>
  );
}
