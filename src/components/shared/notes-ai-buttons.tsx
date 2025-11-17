"use client";

import { Infinity, ListTodo, Loader } from "lucide-react";
import { cn } from "~/lib/utils";

export type TransformationType = "summarize" | "tasks";

interface NotesAiButtonsProps {
  notes: string;
  isPending: boolean;
  onTransform: (type: TransformationType) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  processingType?: TransformationType | null;
}

export function NotesAiButtons({
  notes,
  isPending: _isPending,
  onTransform,
  disabled = false,
  isProcessing = false,
  processingType = null,
}: NotesAiButtonsProps) {
  const noteLength = notes.length;

  // Show summarize button when notes > 400 characters
  const showSummarize = noteLength > 400;

  // Show tasks button always
  const showTasks = true;

  const buttonBaseClass = "inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm text-gray-400 transition-all hover:bg-gray-100/80 hover:text-gray-700 active:bg-gray-100/80 disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="flex items-center gap-1.5">
      {/* Tasks Button - Shows only when pending is enabled */}
      {showTasks && (
        <button
          type="button"
          onClick={() => onTransform("tasks")}
          disabled={disabled || isProcessing}
          className={cn(buttonBaseClass)}
          title="Crear tareas desde las notas"
          aria-label="Crear tareas desde las notas"
        >
          {isProcessing && processingType === "tasks" ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ListTodo className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {/* Summarize Button - Shows when notes > 400 characters */}
      {showSummarize && (
        <button
          type="button"
          onClick={() => onTransform("summarize")}
          disabled={disabled || isProcessing}
          className={cn(buttonBaseClass)}
          title="Resumir"
          aria-label="Resumir"
        >
          {isProcessing && processingType === "summarize" ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Infinity className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
