"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { TaskViewModal } from "~/components/tasks/task-view-modal";
import { useToast } from "~/components/hooks/use-toast";
import { updateTaskWithAuth } from "~/server/queries/task";
import { useRouter } from "next/navigation";
import type { DetailedTask } from "~/lib/operations/task-utils";
import { matchesSearch } from "~/lib/search-utils";

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  dueTime?: string | null; // Time portion for accurate remaining time calculation
  urgency: number | null;
  category: string | null;
  status: string;
  completed: boolean | null;
  createdAt: Date | null;
  listingId?: string | null;
  contactId?: string | null;
  propertyTitle?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

interface TaskBoardProps {
  initialTasks: Task[];
  searchQuery?: string;
  onTaskUpdated?: () => void;
}

const TASK_STATUSES = [
  { id: "backlog", label: "Nuevas", color: "gray" },
  { id: "ready", label: "Pendiente", color: "blue" },
  { id: "in_progress", label: "En Progreso", color: "yellow" },
  { id: "validation", label: "Validación", color: "purple" },
  { id: "finished", label: "Finalizado", color: "green" },
  { id: "blocked", label: "Bloqueado", color: "red" },
];

export function TaskBoard({ initialTasks, searchQuery = "", onTaskUpdated }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previousTasks = useRef<Task[]>(initialTasks);
  const { toast } = useToast();
  const router = useRouter();

  // Update tasks when initialTasks prop changes (e.g., after parent refresh)
  useEffect(() => {
    setTasks(initialTasks);
    previousTasks.current = initialTasks;
  }, [initialTasks]);

  // Client-side search filtering with normalized search for accent-insensitive matching
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    return tasks.filter((task) => {
      // Search in title
      const titleMatch = matchesSearch(task.title, searchQuery);

      // Search in contact name
      const contactName = `${task.contactFirstName ?? ""} ${task.contactLastName ?? ""}`.trim();
      const contactMatch = matchesSearch(contactName, searchQuery);

      // Search in property title
      const propertyMatch = matchesSearch(task.propertyTitle, searchQuery);

      return titleMatch || contactMatch || propertyMatch;
    });
  }, [tasks, searchQuery]);

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

    filteredTasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status]?.push(task);
      } else {
        // If task has unknown status, put in backlog
        grouped.backlog?.push(task);
      }
    });

    // Sort backlog tasks by createdAt (newest first)
    if (grouped.backlog) {
      grouped.backlog.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Sort all other columns using comprehensive sorting hierarchy
    const sortTasks = (a: Task, b: Task) => {
      // First: Completed tasks go to the bottom
      const aCompleted = a.completed ?? false;
      const bCompleted = b.completed ?? false;
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      // Second: Priority order based on criticality and due date presence
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

      // Third: Same priority level - sort by due date (earlier dates first, null dates treated as 0)
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      if (aDate !== bDate) {
        return aDate - bDate;
      }

      // Fourth: Same priority and due date - sort by urgency (higher urgency first)
      return (b.urgency ?? 0) - (a.urgency ?? 0);
    };

    // Apply sorting to all columns except backlog
    Object.keys(grouped).forEach((status) => {
      if (status !== "backlog" && grouped[status]) {
        grouped[status]?.sort(sortTasks);
      }
    });

    return grouped;
  }, [filteredTasks]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = filteredTasks.find((t) => t.taskId === active.id);
    setActiveTask(task ?? null);
    // Store current state before drag
    previousTasks.current = filteredTasks;
  }

  function handleTaskClick(taskId: string) {
    const task = tasks.find((t) => t.taskId === taskId);
    setSelectedTaskId(Number(taskId));
    setSelectedTask(task ?? null);
    setIsModalOpen(true);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = filteredTasks.find((t) => t.taskId === activeId);
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

  async function handleToggleCompleted(taskId: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted;
    // When completing, move to "finished"; when uncompleting, always move to "validation"
    const newStatus = newCompleted ? "finished" : "validation";

    // Optimistic update - immediately update the UI
    // This will automatically move the task to the correct column via tasksByStatus
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.taskId === taskId
          ? {
              ...task,
              completed: newCompleted,
              status: newStatus,
            }
          : task,
      ),
    );

    // Store previous state for potential rollback
    const previousState = tasks;

    try {
      // Update task completed status and status in database
      // When completing, move to "finished"; when uncompleting, move to "validation"
      await updateTaskWithAuth(Number(taskId), {
        completed: newCompleted,
        status: newStatus,
      });

      toast({
        title: newCompleted ? "Tarea completada" : "Tarea reactivada",
        description: newCompleted
          ? "La tarea se movió a Finalizado"
          : "La tarea se movió a Validación",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert optimistic update on error
      setTasks(previousState);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea. Intenta de nuevo.",
        variant: "destructive",
      });
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
    const task = filteredTasks.find((t) => t.taskId === activeId);

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
      <div className="flex gap-6 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <TaskColumn
            key={status.id}
            id={status.id}
            title={status.label}
            tasks={tasksByStatus[status.id] ?? []}
            color={status.color}
            onToggleCompleted={handleToggleCompleted}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>
      <TaskDragOverlay activeTask={activeTask} />
      <TaskViewModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            // Reset state when modal closes
            setSelectedTaskId(null);
            setSelectedTask(null);
          }
        }}
        taskId={selectedTaskId}
        initialTask={selectedTask ? (() => {
          const task: Partial<DetailedTask> = {
            taskId: Number(selectedTask.taskId),
            userId: "",
            title: selectedTask.title,
            dueDate: selectedTask.dueDate ?? undefined,
            completed: selectedTask.completed ?? false,
            urgency: selectedTask.urgency ?? undefined,
            status: (selectedTask.status as DetailedTask["status"]) ?? "backlog",
            category: selectedTask.category ?? undefined,
            listingId: selectedTask.listingId ? Number(selectedTask.listingId) : undefined,
            contactId: selectedTask.contactId ? Number(selectedTask.contactId) : undefined,
            contactFirstName: selectedTask.contactFirstName ?? undefined,
            contactLastName: selectedTask.contactLastName ?? undefined,
            propertyTitle: selectedTask.propertyTitle ?? undefined,
          };
          return task as DetailedTask;
        })() : null}
        onSuccess={() => {
          // Refresh the page to get updated task data
          router.refresh();
          // Call parent callback to refresh tasks list
          if (onTaskUpdated) {
            onTaskUpdated();
          }
          // Also optimistically remove the task from local state if it was deleted
          if (selectedTaskId) {
            setTasks((prev) =>
              prev.filter((t) => t.taskId !== selectedTaskId.toString())
            );
          }
        }}
      />
    </DndContext>
  );
}
