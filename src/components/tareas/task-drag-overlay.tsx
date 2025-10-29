"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, AlertCircle, GripVertical } from "lucide-react";
import { cn } from "~/lib/utils";

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  urgency: number | null;
  category: string | null;
  status: string;
  completed: boolean | null;
}

interface TaskDragOverlayProps {
  activeTask: Task | null;
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

export function TaskDragOverlay({ activeTask }: TaskDragOverlayProps) {
  if (!activeTask) return null;

  const overdue = isOverdue(activeTask.dueDate);

  return (
    <DragOverlay>
      <Card
        className={cn(
          "cursor-grabbing shadow-xl rotate-3",
          overdue && "border-red-300",
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="mt-1 text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-medium leading-tight">
                  {activeTask.title}
                </h4>
                {activeTask.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {activeTask.urgency && (
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", getUrgencyColor(activeTask.urgency))}
                  >
                    {getUrgencyLabel(activeTask.urgency)}
                  </Badge>
                )}

                {activeTask.category && (
                  <Badge variant="outline" className="text-xs">
                    {activeTask.category}
                  </Badge>
                )}

                {activeTask.dueDate && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      overdue
                        ? "text-red-600 font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {overdue ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Calendar className="h-3 w-3" />
                    )}
                    <span>{formatDate(activeTask.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DragOverlay>
  );
}
