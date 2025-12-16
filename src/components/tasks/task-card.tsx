"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Check,
  CheckCircle2,
  Home,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { getRemainingTime } from "~/lib/operations/task-utils";

// Generic task interface that works with both tareas.tsx and WorkQueueCard
interface BaseTask {
  taskId?: bigint | number;
  id?: string;
  title: string;
  completed?: boolean | null;
  dueDate?: Date | string | null;
  dueTime?: string | null; // Added for accurate time remaining calculation
  listingId?: bigint | number | null;
  propertyTitle?: string | null;
  contactId?: bigint | number | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  userName?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  urgency?: number | null;
}

interface TaskCardProps<T extends BaseTask> {
  task: T;
  showPropertyBadge?: boolean;
  onToggleCompleted: (taskId: number | string, currentCompleted: boolean) => Promise<void>;
  onDeleteClick: (taskId: number | string, title: string) => void;
  onTaskClick: (taskId: number | string, task: T) => void;
  taskState?: "saving" | "saved" | "error";
  canEdit: boolean;
  canDelete: boolean;
}

const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null,
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

function getUrgencyBgColor(urgency: number | null): string {
  if (!urgency) return "bg-gray-300/60";

  switch (urgency) {
    case 5:
      return "bg-red-500/60";
    case 4:
      return "bg-orange-500/60";
    case 3:
      return "bg-yellow-500/60";
    case 2:
      return "bg-blue-500/60";
    case 1:
      return "bg-gray-400/60";
    default:
      return "bg-gray-300/60";
  }
}

// Use shared getRemainingTime from task-utils with dueTime for accurate calculation

export function TaskCard<T extends BaseTask>({
  task,
  showPropertyBadge = true,
  onToggleCompleted,
  onDeleteClick,
  onTaskClick,
  taskState,
  canEdit,
  canDelete,
}: TaskCardProps<T>) {
  const [draggingTask, setDraggingTask] = useState(false);
  // Get taskId - prefer taskId, fallback to id
  const taskId = task.taskId?.toString() ?? task.id ?? "";

  return (
    <div className="relative rounded-lg">
      {/* Red delete background - only shown when BOTH dragging AND has permission */}
      {draggingTask && canDelete && (
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
            setDraggingTask(true);
          }
        }}
        onDragEnd={(_e, info) => {
          setDraggingTask(false);

          // Only enable swipe-to-delete on mobile AND if user has permission
          if (window.innerWidth >= 640 || !canDelete) return;

          // If swiped more than 100px to the right, show delete confirmation
          if (info.offset.x > 100) {
            onDeleteClick(taskId, task.title);
          }
        }}
        onClick={(e) => {
          // Don't open modal if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (
            target.closest("a") ||
            target.closest("button") ||
            target.closest('[role="button"]')
          ) {
            return;
          }
          onTaskClick(taskId, task);
        }}
        className={`relative z-10 rounded-lg p-2 shadow-md transition-shadow duration-200 sm:p-3 ${
          (task.completed ?? false)
            ? "bg-gray-50 opacity-75"
            : "bg-white"
        } ${taskState === "saving" ? "opacity-70" : ""} cursor-pointer hover:shadow-lg`}
      >
        {/* Days remaining badge and Avatar - top right, side by side */}
        <div className="absolute right-2 top-2 mt-1.5 flex items-center gap-1">
          {task.dueDate && (() => {
            const now = new Date();
            const dueDate = new Date(task.dueDate);
            // Parse dueTime if available, otherwise default to end of day (23:59)
            let dueHours = 23;
            let dueMinutes = 59;
            if (task.dueTime) {
              const timeParts = task.dueTime.split(":").map(Number);
              dueHours = timeParts[0] ?? 23;
              dueMinutes = timeParts[1] ?? 59;
            }
            const fullDueDateTime = new Date(
              dueDate.getFullYear(),
              dueDate.getMonth(),
              dueDate.getDate(),
              dueHours,
              dueMinutes,
            );
            const diffMs = fullDueDateTime.getTime() - now.getTime();
            // Use Math.trunc() to round toward zero (prevents -0.5 becoming -1)
            const diffHours = Math.trunc(diffMs / (1000 * 60 * 60));
            // Convert string to Date if needed, and call shared function with dueTime
            const dueDateObj = task.dueDate instanceof Date ? task.dueDate : (task.dueDate ? new Date(task.dueDate) : null);
            const remainingTimeText = getRemainingTime(dueDateObj, task.dueTime ?? null);

            // Determine color based on time remaining
            let colorClasses = "";
            if (diffMs < 0 || (remainingTimeText?.includes("vencido") ?? false)) {
              colorClasses = "bg-rose-100 text-rose-800";
            } else if (diffHours < 24) {
              colorClasses = "bg-orange-100 text-orange-800";
            } else {
              colorClasses = "bg-yellow-100 text-yellow-800";
            }

            return (
              <span
                className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${colorClasses}`}
              >
                {remainingTimeText}
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
              onClick={(e) => {
                e.stopPropagation();
                console.log("Checkbox clicked:", { taskId, canEdit, completed: task.completed });
                if (canEdit) {
                  void onToggleCompleted(
                    taskId,
                    task.completed ?? false,
                  );
                } else {
                  console.log("Cannot edit - canEdit is false");
                }
              }}
              className={`mt-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                (task.completed ?? false)
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-gray-300 hover:border-gray-400"
              } ${canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
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
          {(Boolean(showPropertyBadge && task.listingId && task.propertyTitle) ||
            Boolean(
              task.contactId &&
                (task.contactFirstName ?? task.contactLastName),
            )) && (
            <div className="ml-5 flex flex-wrap items-center gap-1.5 sm:ml-6">
              {/* Property Link */}
              {showPropertyBadge && task.listingId && task.propertyTitle && (
                <Link
                  href={`/propiedades/${task.listingId.toString()}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300 sm:px-2.5 sm:py-1 sm:text-xs ${
                    (task.completed ?? false)
                      ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                      : "bg-white text-gray-500 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
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
                    href={`/contactos/${task.contactId.toString()}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300 sm:px-2.5 sm:py-1 sm:text-xs ${
                      (task.completed ?? false)
                        ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                        : "bg-white text-gray-500 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
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

        {/* Status icons and urgency indicator - bottom right */}
        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
          {/* Status icons */}
          <div className="flex items-center gap-1">
            {taskState === "saving" && (
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            )}
            {taskState === "saved" && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            )}
          </div>

          {/* Urgency indicator */}
          {task.urgency && (
            <div
              className={cn("h-1 w-16 rounded-full", getUrgencyBgColor(task.urgency))}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
