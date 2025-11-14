"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import type { ExtractedTask } from "~/server/openai/notes-transformer";

interface TaskSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: ExtractedTask[];
  onConfirm: (selectedTasks: ExtractedTask[]) => Promise<void>;
  isLoading?: boolean;
}

interface EditableTask extends ExtractedTask {
  selected: boolean;
  id: string; // For React key
}

export function TaskSelectionModal({
  open,
  onOpenChange,
  tasks,
  onConfirm,
  isLoading = false,
}: TaskSelectionModalProps) {
  const [editableTasks, setEditableTasks] = useState<EditableTask[]>(() =>
    tasks.map((task, index) => ({
      ...task,
      selected: true,
      id: `task-${index}`,
      suggestedDueDays: task.suggestedDueDays ?? 3,
    })),
  );
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Update editable tasks when tasks prop changes
  useEffect(() => {
    if (tasks.length > 0) {
      setEditableTasks(
        tasks.map((task, index) => ({
          ...task,
          selected: true,
          id: `task-${index}`,
          suggestedDueDays: task.suggestedDueDays ?? 3,
        })),
      );
    }
  }, [tasks]);

  const handleToggle = (taskId: string) => {
    setEditableTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, selected: !task.selected } : task,
      ),
    );
  };

  const handleUpdateTask = (
    taskId: string,
    updates: Partial<ExtractedTask>,
  ) => {
    setEditableTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task,
      ),
    );
  };

  const handleDueDaysChange = (taskId: string, delta: number) => {
    setEditableTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const currentDays = task.suggestedDueDays ?? 3;
          const newDays = Math.max(1, Math.min(90, currentDays + delta));
          return { ...task, suggestedDueDays: newDays };
        }
        return task;
      }),
    );
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleSelectAll = () => {
    setEditableTasks((prev) =>
      prev.map((task) => ({ ...task, selected: true })),
    );
  };

  const handleDeselectAll = () => {
    setEditableTasks((prev) =>
      prev.map((task) => ({ ...task, selected: false })),
    );
  };

  const handleCreateTasks = () => {
    const selectedTasks = editableTasks
      .filter((task) => task.selected)
      .map(({ selected: _selected, id: _id, ...task }) => task);

    if (selectedTasks.length === 0) {
      return;
    }

    startTransition(async () => {
      await onConfirm(selectedTasks);
    });
  };

  const selectedCount = editableTasks.filter((task) => task.selected).length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Tareas Extraídas
          </DialogTitle>
          <DialogDescription className="text-sm">
            Revisa y edita las tareas extraídas de las notas. Selecciona las que
            deseas crear.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs font-medium text-gray-600">
              {selectedCount} de {editableTasks.length} seleccionadas
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={isPending || isLoading}
                className="h-7 text-xs"
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                disabled={isPending || isLoading}
                className="h-7 text-xs"
              >
                Ninguna
              </Button>
            </div>
          </div>

          {/* Task Options - Expandable Cards */}
          <div className="space-y-2">
            {editableTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="rounded-lg bg-white shadow-md transition-all hover:shadow-lg has-[:checked]:bg-amber-50/40 has-[:checked]:shadow-lg"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox
                      id={task.id}
                      checked={task.selected}
                      onCheckedChange={() => handleToggle(task.id)}
                      disabled={isPending || isLoading}
                    />
                    <label
                      htmlFor={task.id}
                      className="flex-1 cursor-pointer text-sm font-medium text-gray-700"
                    >
                      {task.title}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(task.id)}
                      className="rounded p-1 transition-colors hover:bg-gray-100"
                      disabled={isPending || isLoading}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3">
                      {/* Editable Title */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${task.id}-title`}
                          className="text-xs font-medium text-gray-600"
                        >
                          Título
                        </label>
                        <Input
                          id={`${task.id}-title`}
                          value={task.title}
                          onChange={(e) =>
                            handleUpdateTask(task.id, { title: e.target.value })
                          }
                          disabled={isPending || isLoading}
                          maxLength={60}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Editable Description */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${task.id}-description`}
                          className="text-xs font-medium text-gray-600"
                        >
                          Descripción
                        </label>
                        <Textarea
                          id={`${task.id}-description`}
                          value={task.description}
                          onChange={(e) =>
                            handleUpdateTask(task.id, {
                              description: e.target.value,
                            })
                          }
                          disabled={isPending || isLoading}
                          className="min-h-[60px] text-sm"
                        />
                      </div>

                      {/* Urgency Selector */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${task.id}-urgency`}
                          className="text-xs font-medium text-gray-600"
                        >
                          Urgencia
                        </label>
                        <Select
                          value={task.urgency?.toString() ?? ""}
                          onValueChange={(value) =>
                            handleUpdateTask(task.id, {
                              urgency: value ? Number(value) : undefined,
                            })
                          }
                          disabled={isPending || isLoading}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Sin urgencia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                                Baja
                              </span>
                            </SelectItem>
                            <SelectItem value="2">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-400" />
                                Media-Baja
                              </span>
                            </SelectItem>
                            <SelectItem value="3">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                                Media
                              </span>
                            </SelectItem>
                            <SelectItem value="4">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                                Media-Alta
                              </span>
                            </SelectItem>
                            <SelectItem value="5">
                              <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Crítica
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Due Days Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">
                          Días hasta vencimiento
                        </label>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDueDaysChange(task.id, -1)}
                            disabled={
                              isPending ||
                              isLoading ||
                              (task.suggestedDueDays ?? 3) <= 1
                            }
                            className="rounded-full p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="min-w-[80px] text-center text-sm font-medium text-gray-700">
                            {task.suggestedDueDays ?? 3}{" "}
                            {(task.suggestedDueDays ?? 3) === 1 ? "día" : "días"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDueDaysChange(task.id, 1)}
                            disabled={
                              isPending ||
                              isLoading ||
                              (task.suggestedDueDays ?? 3) >= 90
                            }
                            className="rounded-full p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTasks}
              disabled={isPending || isLoading || selectedCount === 0}
              className="min-w-[140px] bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
            >
              {isPending || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                `Crear ${selectedCount} tarea${selectedCount !== 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

