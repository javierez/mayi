"use client";

import { useState, useMemo, useRef } from "react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";
import {
  changelogEntries,
  groupEntriesByWeek,
  getCategories,
  type ChangelogEntry,
} from "~/lib/changelog-data";
import { WeekColumn } from "~/components/changelog/week-column";
import { ChangelogSheet } from "~/components/changelog/changelog-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function ChangelogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All categories");
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const categories = useMemo(() => getCategories(changelogEntries), []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return changelogEntries.filter((entry) => {
      const categoryMatch =
        selectedCategory === "All categories" ||
        entry.category === selectedCategory;
      return categoryMatch;
    });
  }, [selectedCategory]);

  // Group filtered entries by week
  const groupedEntries = useMemo(
    () => groupEntriesByWeek(filteredEntries),
    [filteredEntries],
  );

  // Get all unique week keys and sort them chronologically
  const weekKeys = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => {
      const [yearA = 0, monthA = 0, weekA = 0] = a.split("-").map(Number);
      const [yearB = 0, monthB = 0, weekB = 0] = b.split("-").map(Number);

      if (yearA !== yearB) return yearA - yearB;
      if (monthA !== monthB) return monthA - monthB;
      return weekA - weekB;
    });
  }, [groupedEntries]);

  const handleEntryClick = (entry: ChangelogEntry) => {
    setSelectedEntry(entry);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedEntry(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Novedades
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:mt-6 sm:text-lg md:text-xl">
              Todas las actualizaciones y mejoras de Vesta, organizadas por
              semana. Mantente al día con las últimas funcionalidades.
            </p>

            {/* Filters */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {selectedCategory === "All categories"
                      ? "Todas las categorías"
                      : selectedCategory === "Feature"
                        ? "Nueva Funcionalidad"
                        : selectedCategory === "Improvement"
                          ? "Mejora"
                          : selectedCategory === "Fix"
                            ? "Corrección"
                            : "Integración"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory("All categories")}
                  >
                    Todas las categorías
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === "Feature"
                        ? "Nueva Funcionalidad"
                        : category === "Improvement"
                          ? "Mejora"
                          : category === "Fix"
                            ? "Corrección"
                            : "Integración"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      {/* Changelog Board */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4"
          >
            <div className="flex gap-4 min-w-max">
              {weekKeys.length > 0 ? (
                weekKeys.map((key) => {
                  const [year = 0, month = 0, week = 0] = key.split("-").map(Number);
                  const entries = groupedEntries[key];
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        weekColumnRefs.current[key] = el;
                      }}
                    >
                      <WeekColumn
                        entries={entries ?? []}
                        month={month}
                        year={year}
                        week={week}
                        onEntryClick={handleEntryClick}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="w-full py-12 text-center text-gray-500">
                  No hay actualizaciones que coincidan con los filtros
                  seleccionados.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sheet for detailed view */}
      <ChangelogSheet
        entry={selectedEntry}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />

      <Footer />
    </div>
  );
}

