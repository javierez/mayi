"use client";

import { type ChangelogEntry } from "~/lib/changelog-data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import Link from "next/link";

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
  Security: {
    label: "Seguridad",
    gradient: "from-slate-50 to-gray-50",
    textColor: "text-slate-900",
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

  // Format the detailed description with proper styling
  const formatDescription = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Skip empty lines
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }

      // Separator lines
      if (line.includes("━━━")) {
        return (
          <div key={index} className="border-t border-gray-150 my-4" />
        );
      }

      // Section headers (all caps lines without bullet points)
      if (
        line === line.toUpperCase() &&
        line.trim().length > 0 &&
        !line.trim().startsWith("•")
      ) {
        return (
          <h3
            key={index}
            className="text-sm font-semibold text-gray-800 mt-4 mb-1.5"
          >
            {line.trim()}
          </h3>
        );
      }

      // Bullet points
      if (line.trim().startsWith("•")) {
        return (
          <div key={index} className="flex items-start gap-2 ml-2 mb-1.5">
            <span className="text-gray-500 text-sm mt-0.5">•</span>
            <span className="text-gray-700 text-sm leading-relaxed flex-1">
              {line.trim().substring(1).trim()}
            </span>
          </div>
        );
      }

      // Regular paragraphs
      return (
        <p key={index} className="text-gray-700 text-sm leading-relaxed mb-2">
          {line.trim()}
        </p>
      );
    });
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
            <div className="max-w-none">
              {formatDescription(entry.detailedDescription)}
            </div>
          </div>

          {/* Footer Button */}
          <div className="px-8 py-6 border-t border-gray-100">
            {entry.id === "10" ? (
              <Link href="/academia?article=visit-workflow-guide" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                >
                  Guía completa del sistema de registro de visitas
                </Button>
              </Link>
            ) : (
              <Link href="/academia?article=how-to-report-errors" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900"
                >
                  ¿Cómo reportar un error?
                </Button>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

