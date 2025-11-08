"use client";

import { type ChangelogEntry } from "~/lib/changelog-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface ChangelogSheetProps {
  entry: ChangelogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  Feature: {
    label: "Nueva Funcionalidad",
    color: "bg-green-100 text-green-700",
  },
  Improvement: {
    label: "Mejora",
    color: "bg-blue-100 text-blue-700",
  },
  Fix: {
    label: "Corrección",
    color: "bg-red-100 text-red-700",
  },
  Integration: {
    label: "Integración",
    color: "bg-purple-100 text-purple-700",
  },
};

export function ChangelogSheet({
  entry,
  isOpen,
  onClose,
}: ChangelogSheetProps) {
  if (!entry) return null;

  const Icon = entry.icon;
  const categoryInfo = categoryConfig[entry.category];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold text-gray-900">
                {entry.title}
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Category and Date */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("text-xs", categoryInfo.color)}>
              {categoryInfo.label}
            </Badge>
            <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
          </div>

          {/* Detailed Description */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Descripción
            </h3>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
              {entry.detailedDescription}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

