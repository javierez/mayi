"use client";

import { useDraggable, useDndMonitor } from "@dnd-kit/core";
import { Card, CardContent } from "~/components/ui/card";
import { Calendar, AlertCircle, Home, User, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import Link from "next/link";
import { useRef } from "react";

interface TaskCardProps {
  task: {
    taskId: string;
    title: string;
    description: string;
    dueDate: Date | null;
    dueTime?: string | null; // Time portion for accurate remaining time calculation
    urgency: number | null;
    category: string | null;
    status: string;
    completed: boolean | null;
    listingId?: string | null;
    contactId?: string | null;
    propertyTitle?: string | null;
    contactFirstName?: string | null;
    contactLastName?: string | null;
  };
  onToggleCompleted?: (taskId: string, currentCompleted: boolean) => void;
  onClick?: (taskId: string) => void;
}

// function getUrgencyColor(urgency: number | null): string {
//   if (!urgency) return "bg-gray-100 text-gray-800";

//   switch (urgency) {
//     case 5:
//       return "bg-red-100 text-red-800";
//     case 4:
//       return "bg-orange-100 text-orange-800";
//     case 3:
//       return "bg-yellow-100 text-yellow-800";
//     case 2:
//       return "bg-blue-100 text-blue-800";
//     case 1:
//       return "bg-green-100 text-green-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// }

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

// function getUrgencyLabel(urgency: number | null): string {
//   if (!urgency) return "Sin prioridad";

//   switch (urgency) {
//     case 5:
//       return "Crítica";
//     case 4:
//       return "Alta";
//     case 3:
//       return "Media";
//     case 2:
//       return "Baja";
//     case 1:
//       return "Muy baja";
//     default:
//       return "Sin prioridad";
//   }
// }

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function TaskCard({ task, onToggleCompleted, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.taskId,
    data: {
      type: "task",
      task,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const overdue = isOverdue(task.dueDate);
  
  // Track if a drag occurred to distinguish from clicks
  const dragOccurredRef = useRef(false);
  const lastDragEndTimeRef = useRef<number>(0);

  // Monitor drag events to track when dragging starts and ends
  useDndMonitor({
    onDragStart(event) {
      if (event.active.id === task.taskId) {
        dragOccurredRef.current = true;
      }
    },
    onDragEnd(event) {
      if (event.active.id === task.taskId) {
        lastDragEndTimeRef.current = Date.now();
        // Reset after a delay to allow click detection
        setTimeout(() => {
          dragOccurredRef.current = false;
        }, 150);
      }
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if we're currently dragging
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Prevent click if a drag just occurred (within last 200ms)
    // This prevents clicks from firing after drag ends
    const timeSinceDragEnd = Date.now() - lastDragEndTimeRef.current;
    if (dragOccurredRef.current || timeSinceDragEnd < 200) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If we get here, it's a genuine click (not a drag)
    if (onClick) {
      onClick(task.taskId);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md select-none",
          isDragging && "opacity-0",
          overdue && "border-red-300",
        )}
        onClick={handleCardClick}
      >
        <CardContent className="relative p-3">
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              {/* Checkbox */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleCompleted) {
                    onToggleCompleted(task.taskId, task.completed ?? false);
                  }
                }}
                className={cn(
                  "mt-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                  (task.completed ?? false)
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                    : "border-gray-300 hover:border-gray-400",
                  onToggleCompleted ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                )}
              >
                {(task.completed ?? false) && (
                  <Check className="h-2 w-2" />
                )}
              </div>

              {/* Title */}
              <h4
                className={cn(
                  "text-sm font-medium leading-tight flex-1 line-clamp-2",
                  (task.completed ?? false) && "text-gray-500 line-through",
                )}
              >
                {task.title}
              </h4>
            </div>

            {/* Property and Contact badges */}
            {(Boolean(task.listingId && task.propertyTitle) ||
              Boolean(
                task.contactId &&
                  (task.contactFirstName ?? task.contactLastName),
              )) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Property Link */}
                {task.listingId && task.propertyTitle && (
                  <Link
                    href={`/propiedades/${task.listingId}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300",
                      (task.completed ?? false)
                        ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                        : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                    )}
                  >
                    <Home className="h-2.5 w-2.5 flex-shrink-0 opacity-60" />
                    <span className="break-words">
                      {task.propertyTitle.length > 30
                        ? `${task.propertyTitle.substring(0, 30)}...`
                        : task.propertyTitle}
                    </span>
                  </Link>
                )}

                {/* Contact Link */}
                {task.contactId &&
                  (task.contactFirstName ?? task.contactLastName) && (
                    <Link
                      href={`/contactos/${task.contactId}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300",
                        (task.completed ?? false)
                          ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                          : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                      )}
                    >
                      <User className="h-2.5 w-2.5 flex-shrink-0 opacity-60" />
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

            <div className="flex flex-wrap items-center gap-1.5">
              {task.urgency && (
                <div
                  className={cn("h-1 w-16 rounded-full", getUrgencyBgColor(task.urgency))}
                />
              )}
            </div>
          </div>

          {/* Due date in bottom right */}
          {task.dueDate && (
            <div
              className={cn(
                "absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px]",
                overdue ? "text-red-600 font-medium" : "text-muted-foreground",
              )}
            >
              {overdue ? (
                <AlertCircle className="h-2.5 w-2.5" />
              ) : (
                <Calendar className="h-2.5 w-2.5" />
              )}
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
