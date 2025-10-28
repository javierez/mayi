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
      <button
        onClick={handleToggle}
        className="group flex w-full items-center justify-between px-1"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          {title} ({count})
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="animate-in fade-in duration-200">{children}</div>
      )}
    </div>
  );
}
