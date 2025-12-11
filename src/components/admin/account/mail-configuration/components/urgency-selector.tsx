"use client";

import { Circle, CircleDot, AlertCircle, AlertTriangle, Flame } from "lucide-react";
import { cn } from "~/lib/utils";

interface UrgencySelectorProps {
  urgencyLevels: number[];
  onToggle: (level: number) => void;
  disabled?: boolean;
}

const urgencyConfig = [
  {
    value: 1,
    label: "1",
    fullLabel: "Muy Baja",
    icon: <Circle className="h-3 w-3" />,
  },
  {
    value: 2,
    label: "2",
    fullLabel: "Baja",
    icon: <CircleDot className="h-3 w-3" />,
  },
  {
    value: 3,
    label: "3",
    fullLabel: "Media",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  {
    value: 4,
    label: "4",
    fullLabel: "Alta",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  {
    value: 5,
    label: "5",
    fullLabel: "Crítica",
    icon: <Flame className="h-3 w-3" />,
  },
];

export function UrgencySelector({
  urgencyLevels,
  onToggle,
  disabled = false,
}: UrgencySelectorProps) {
  return (
    <div className="mt-2 flex gap-1.5">
      {urgencyConfig.map((urgency) => {
        const isSelected = urgencyLevels.includes(urgency.value);
        return (
          <button
            key={urgency.value}
            type="button"
            onClick={() => !disabled && onToggle(urgency.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 transition-all",
              "hover:shadow-sm",
              disabled && "cursor-not-allowed opacity-50",
              isSelected
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "bg-gray-50 hover:bg-gray-100"
            )}
            title={urgency.fullLabel}
          >
            <span
              className={cn(
                "text-gray-500",
                isSelected && "text-primary"
              )}
            >
              {urgency.icon}
            </span>
            <span
              className={cn(
                "text-[9px] leading-tight text-center uppercase",
                isSelected ? "text-primary/80" : "text-gray-400"
              )}
            >
              {urgency.fullLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

