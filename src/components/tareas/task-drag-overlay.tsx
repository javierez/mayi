"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Card, CardContent } from "~/components/ui/card";
import { Calendar, AlertCircle, Home, User, Check } from "lucide-react";
import { cn } from "~/lib/utils";
import Link from "next/link";

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  urgency: number | null;
  category: string | null;
  status: string;
  completed: boolean | null;
  listingId?: string | null;
  contactId?: string | null;
  propertyTitle?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

interface TaskDragOverlayProps {
  activeTask: Task | null;
}

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
        <CardContent className="relative p-3">
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              {/* Checkbox (read-only) */}
              <div
                className={cn(
                  "mt-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                  (activeTask.completed ?? false)
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                    : "border-gray-300",
                )}
              >
                {(activeTask.completed ?? false) && (
                  <Check className="h-2 w-2" />
                )}
              </div>

              {/* Title */}
              <h4
                className={cn(
                  "text-sm font-medium leading-tight flex-1",
                  (activeTask.completed ?? false) && "text-gray-500 line-through",
                )}
              >
                {activeTask.title}
              </h4>
            </div>

            {/* Property and Contact badges */}
            {(Boolean(activeTask.listingId && activeTask.propertyTitle) ||
              Boolean(
                activeTask.contactId &&
                  (activeTask.contactFirstName ?? activeTask.contactLastName),
              )) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Property Link */}
                {activeTask.listingId && activeTask.propertyTitle && (
                  <Link
                    href={`/propiedades/${activeTask.listingId}`}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300",
                      (activeTask.completed ?? false)
                        ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                        : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                    )}
                  >
                    <Home className="h-2.5 w-2.5 flex-shrink-0 opacity-60" />
                    <span className="break-words">
                      {activeTask.propertyTitle.length > 30
                        ? `${activeTask.propertyTitle.substring(0, 30)}...`
                        : activeTask.propertyTitle}
                    </span>
                  </Link>
                )}

                {/* Contact Link */}
                {activeTask.contactId &&
                  (activeTask.contactFirstName ?? activeTask.contactLastName) && (
                    <Link
                      href={`/contactos/${activeTask.contactId}`}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-300",
                        (activeTask.completed ?? false)
                          ? "bg-gray-50/50 text-gray-400 shadow-sm hover:bg-gray-100/60 hover:shadow-md"
                          : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md",
                      )}
                    >
                      <User className="h-2.5 w-2.5 flex-shrink-0 opacity-60" />
                      <span className="break-words">
                        {(() => {
                          const fullName = `${activeTask.contactFirstName ?? ""} ${activeTask.contactLastName ?? ""}`.trim();
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
              {activeTask.urgency && (
                <div
                  className={cn("h-1 w-16 rounded-full", getUrgencyBgColor(activeTask.urgency))}
                />
              )}
            </div>
          </div>

          {/* Due date in bottom right */}
          {activeTask.dueDate && (
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
              <span>{formatDate(activeTask.dueDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </DragOverlay>
  );
}
