"use client";

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
  },
  {
    value: 2,
    label: "2",
    fullLabel: "Baja",
  },
  {
    value: 3,
    label: "3",
    fullLabel: "Media",
  },
  {
    value: 4,
    label: "4",
    fullLabel: "Alta",
  },
  {
    value: 5,
    label: "5",
    fullLabel: "Crítica",
  },
];

export function UrgencySelector({
  urgencyLevels,
  onToggle,
  disabled = false,
}: UrgencySelectorProps) {
  return (
    <div className="mt-2 flex gap-1">
      {urgencyConfig.map((urgency) => {
        const isSelected = urgencyLevels.includes(urgency.value);
        return (
          <button
            key={urgency.value}
            type="button"
            onClick={() => !disabled && onToggle(urgency.value)}
            disabled={disabled}
            className={cn(
              "flex items-center justify-center rounded-md px-2 py-1 transition-all w-14 h-6",
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
                "text-[9px] leading-tight text-center uppercase",
                isSelected ? "text-primary/80 font-medium" : "text-gray-400"
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

