"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface TaskCardProps {
  task: {
    taskId: string;
    title: string;
    description: string;
    dueDate: Date | null;
    urgency: number | null;
    category: string | null;
    status: string;
    completed: boolean | null;
  };
}

function getUrgencyColor(urgency: number | null): string {
  if (!urgency) return "bg-gray-100 text-gray-800";

  switch (urgency) {
    case 5:
      return "bg-red-100 text-red-800";
    case 4:
      return "bg-orange-100 text-orange-800";
    case 3:
      return "bg-yellow-100 text-yellow-800";
    case 2:
      return "bg-blue-100 text-blue-800";
    case 1:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getUrgencyLabel(urgency: number | null): string {
  if (!urgency) return "Sin prioridad";

  switch (urgency) {
    case 5:
      return "Crítica";
    case 4:
      return "Alta";
    case 3:
      return "Media";
    case 2:
      return "Baja";
    case 1:
      return "Muy baja";
    default:
      return "Sin prioridad";
  }
}

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

export function TaskCard({ task }: TaskCardProps) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md select-none",
          isDragging && "opacity-50",
          overdue && "border-red-300",
        )}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-medium leading-tight">
                {task.title}
              </h4>
              {task.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {task.urgency && (
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getUrgencyColor(task.urgency))}
                >
                  {getUrgencyLabel(task.urgency)}
                </Badge>
              )}

              {task.category && (
                <Badge variant="outline" className="text-xs">
                  {task.category}
                </Badge>
              )}

              {task.dueDate && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    overdue ? "text-red-600 font-medium" : "text-muted-foreground",
                  )}
                >
                  {overdue ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
