"use client";

import { type ChangelogEntry } from "~/lib/changelog-data";
import { cn } from "~/lib/utils";

interface ChangelogCardProps {
  entry: ChangelogEntry;
  onClick: () => void;
}

export function ChangelogCard({ entry, onClick }: ChangelogCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 h-20 flex flex-col justify-between transition-all duration-200 hover:border-amber-300 hover:shadow-sm",
        entry.category === "Feature" &&
          "bg-gradient-to-br from-amber-50/50 to-rose-50/50",
      )}
    >
      <h3 className="text-sm font-semibold leading-tight text-gray-900 line-clamp-1">
        {entry.title}
      </h3>
      <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">
        {entry.shortDescription}
      </p>
    </div>
  );
}

