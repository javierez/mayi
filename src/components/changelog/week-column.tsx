"use client";

import { type ChangelogEntry, formatMonthName, getWeekLabel } from "~/lib/changelog-data";
import { ChangelogCard } from "./changelog-card";
import { Badge } from "~/components/ui/badge";

interface WeekColumnProps {
  entries: ChangelogEntry[];
  month: number;
  year: number;
  week: number;
  onEntryClick: (entry: ChangelogEntry) => void;
}

export function WeekColumn({
  entries,
  month,
  year,
  week,
  onEntryClick,
}: WeekColumnProps) {
  const monthName = formatMonthName(month, year);
  const weekLabel = getWeekLabel(week);

  return (
    <div className="flex-shrink-0 w-80 mr-8 pl-6 border-l border-gray-300 first:border-l-0 first:pl-0">
      {/* Week Header */}
      <div className="sticky top-0 z-10 mb-4 bg-white pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {monthName} - Semana {weekLabel}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {entries.length}
          </Badge>
        </div>
      </div>

      {/* Entries Container - Space for 4 cards */}
      <div className="min-h-[350px] space-y-2.5 pt-2 pb-4 bg-gray-50/30 rounded-lg p-2 border border-gray-100">
        {entries.map((entry) => (
          <ChangelogCard
            key={entry.id}
            entry={entry}
            onClick={() => onEntryClick(entry)}
          />
        ))}
        {/* Empty space indicators - show placeholders for missing cards up to 4 total */}
        {Array.from({ length: Math.max(0, 4 - entries.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-20 border-2 border-dashed border-gray-200 rounded-lg bg-transparent"
          />
        ))}
      </div>
    </div>
  );
}

