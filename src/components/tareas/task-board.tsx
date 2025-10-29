"use client";

import { useState, useMemo, useRef } from "react";
import {
  DndContext,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { TaskColumn } from "./task-column";
import { TaskDragOverlay } from "./task-drag-overlay";
import { useToast } from "~/components/hooks/use-toast";

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

interface TaskBoardProps {
  initialTasks: Task[];
}

const TASK_STATUSES = [
  { id: "backlog", label: "Por Hacer", color: "gray" },
  { id: "ready", label: "Listo", color: "blue" },
  { id: "in_progress", label: "En Progreso", color: "yellow" },
  { id: "validation", label: "Validación", color: "purple" },
  { id: "finished", label: "Finalizado", color: "green" },
  { id: "blocked", label: "Bloqueado", color: "red" },
];

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const previousTasks = useRef<Task[]>(initialTasks);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    TASK_STATUSES.forEach((status) => {
      grouped[status.id] = [];
    });

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status]?.push(task);
      } else {
        // If task has unknown status, put in backlog
        grouped.backlog?.push(task);
      }
    });

    return grouped;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find((t) => t.taskId === active.id);
    setActiveTask(task ?? null);
    // Store current state before drag
    previousTasks.current = tasks;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.taskId === activeId);
    if (!activeTask) return;

    const overData = over.data.current;
    if (overData?.type === "column") {
      const newStatus = overData.status as string;
      if (activeTask.status !== newStatus) {
        // Optimistic update
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.taskId === activeId ? { ...task, status: newStatus } : task,
          ),
        );
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      // Revert if dropped outside
      setTasks(previousTasks.current);
      return;
    }

    const activeId = active.id;
    const task = tasks.find((t) => t.taskId === activeId);

    if (!task) return;

    // Update task status in database
    try {
      const response = await fetch(`/api/tasks/${task.taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: task.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      toast({
        title: "Tarea actualizada",
        description: `La tarea se movió a "${TASK_STATUSES.find((s) => s.id === task.status)?.label ?? task.status}"`,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert to state before drag
      setTasks(previousTasks.current);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status.id}
            id={status.id}
            title={status.label}
            tasks={tasksByStatus[status.id] ?? []}
            color={status.color}
          />
        ))}
      </div>
      <TaskDragOverlay activeTask={activeTask} />
    </DndContext>
  );
}
