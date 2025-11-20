"use client";

import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";
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
  listingId?: string | null;
  contactId?: string | null;
  propertyTitle?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
  onToggleCompleted?: (taskId: string, currentCompleted: boolean) => void;
  onTaskClick?: (taskId: string) => void;
}

export function TaskColumn({ id, title, tasks, onToggleCompleted, onTaskClick }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col transition-colors",
        isOver && "opacity-60",
      )}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium font-mono tracking-wider uppercase text-foreground">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        <div className="mt-1 h-px w-full bg-border" />
      </div>
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-1">
        {tasks.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Arrastra tareas aquí
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onToggleCompleted={onToggleCompleted}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
