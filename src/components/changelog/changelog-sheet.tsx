"use client";

import { type ChangelogEntry } from "~/lib/changelog-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";

interface ChangelogSheetProps {
  entry: ChangelogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  Feature: {
    label: "Nueva Funcionalidad",
    gradient: "from-emerald-50 to-teal-50",
    textColor: "text-emerald-900",
  },
  Improvement: {
    label: "Mejora",
    gradient: "from-blue-50 to-indigo-50",
    textColor: "text-blue-900",
  },
  Fix: {
    label: "Corrección",
    gradient: "from-rose-50 to-pink-50",
    textColor: "text-rose-900",
  },
  Integration: {
    label: "Integración",
    gradient: "from-violet-50 to-purple-50",
    textColor: "text-violet-900",
  },
};

export function ChangelogSheet({
  entry,
  isOpen,
  onClose,
}: ChangelogSheetProps) {
  if (!entry) return null;

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
      <SheetContent className="w-full max-w-full sm:max-w-xl border-l-0 bg-white p-0">
        <div className="flex h-full flex-col">
          {/* Header with gradient background */}
          <div className={`bg-gradient-to-br ${categoryInfo.gradient} px-8 py-12`}>
            <SheetHeader className="space-y-4">
              <div className="space-y-2">
                <div className={`text-sm font-medium tracking-wide uppercase ${categoryInfo.textColor} opacity-70`}>
                  {categoryInfo.label}
                </div>
                <SheetTitle className="text-3xl font-bold text-gray-900 leading-tight">
                  {entry.title}
                </SheetTitle>
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {formatDate(entry.date)}
              </div>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                {entry.detailedDescription}
              </p>
            </div>
          </div>

          {/* Footer Button */}
          <div className="px-8 py-6 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={() => {
                // Mock button - no action for now
                console.log("Report error clicked");
              }}
            >
              ¿Cómo reportar un error?
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

