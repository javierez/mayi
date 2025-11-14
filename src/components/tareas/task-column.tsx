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
}

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

export function TaskColumn({ id, title, tasks }: TaskColumnProps) {
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
        "flex w-80 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "bg-muted/60 ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium tracking-wide text-foreground">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-muted-foreground/25">
            <p className="text-xs text-muted-foreground">
              Arrastra tareas aquí
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.taskId} task={task} />)
        )}
      </div>
    </div>
  );
}
