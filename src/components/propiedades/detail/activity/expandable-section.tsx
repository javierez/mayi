"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { ExpandableSectionProps } from "~/types/activity";

export function ExpandableSection({
  title,
  count,
  defaultExpanded = true,
  children,
  storageKey,
  titleClassName,
  dotColor,
  infoButton,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    }
  }, [storageKey]);

  // Save to localStorage when changed
  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex w-full items-center px-1">
        <button
          onClick={handleToggle}
          className="group flex items-center gap-2"
        >
          {dotColor && <div className={`h-2 w-2 rounded-full ${dotColor}`} />}
          <h3
            className={`text-sm font-semibold uppercase tracking-wide ${titleClassName ?? "text-gray-600"}`}
          >
            {title} ({count})
          </h3>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={handleToggle} className="group p-1">
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {infoButton && <div>{infoButton}</div>}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="animate-in fade-in duration-200">{children}</div>
      )}
    </div>
  );
}
