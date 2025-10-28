"use client";

import React, { useState } from "react";
import { cn } from "~/lib/utils";

interface RecordatoriosProps {
  isActive: boolean;
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
  }>;
}

export function Recordatorios({ isActive, tasks = [] }: RecordatoriosProps) {
  const [tasksList, setTasksList] = useState(tasks);

  const handleToggleTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasksList((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      );

      // Sort: incomplete first, then completed
      return updated.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    });
  };

  const displayTasks = tasksList;

  if (displayTasks.length === 0) {
    return (
      <div
        className={cn(
          "text-[12px]",
          isActive ? "text-gray-400" : "text-gray-300",
        )}
      >
        Sin recordatorios
      </div>
    );
  }

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 h-[60px] overflow-y-auto">
      <div className="flex flex-col gap-0.5">
        {displayTasks.map((task) => (
          <button
            key={task.id}
            onClick={(e) => handleToggleTask(task.id, e)}
            className="flex h-[18px] w-full items-center gap-1 rounded px-1 text-left transition-colors hover:bg-gray-50"
          >
            <span
              className={cn(
                "inline-block h-2 w-2 flex-shrink-0 rounded-full border",
                task.completed
                  ? "border-green-500 bg-green-500"
                  : isActive
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 bg-gray-200",
              )}
            />
            <span
              className={cn(
                "truncate text-[12px] transition-all",
                task.completed && "text-gray-400 line-through",
                !task.completed && isActive ? "text-gray-800" : "text-gray-500",
              )}
            >
              {task.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
