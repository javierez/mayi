"use client";

import { useState, useMemo, useRef, useCallback } from "react";
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
      const [yearA, monthA, weekA] = a.split("-").map(Number);
      const [yearB, monthB, weekB] = b.split("-").map(Number);
      
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

  const scrollToMonth = useCallback((month: number, year: number) => {
    // Find the first week key for this month
    const firstWeekKey = weekKeys.find((key) => {
      const [keyYear, keyMonth] = key.split("-").map(Number);
      return keyMonth === month && keyYear === year;
    });

    if (firstWeekKey && weekColumnRefs.current[firstWeekKey] && scrollContainerRef.current) {
      const columnElement = weekColumnRefs.current[firstWeekKey];
      const containerElement = scrollContainerRef.current;
      
      if (columnElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const columnRect = columnElement.getBoundingClientRect();
        const scrollLeft = containerElement.scrollLeft;
        const targetScroll = scrollLeft + columnRect.left - containerRect.left - 24; // 24px offset
        
        containerElement.scrollTo({
          left: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [weekKeys]);

  // Generate timeline months (Jul 2025 - Nov 2025)
  const timelineMonths = useMemo(() => {
    const monthLabels = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    
    // Specific months: Jul, Ago, Sep, Oct, Nov 2025
    const months: Array<{ month: number; year: number; label: string }> = [
      { month: 6, year: 2025, label: "Jul" },   // July (0-indexed: 6)
      { month: 7, year: 2025, label: "Ago" },   // August (0-indexed: 7)
      { month: 8, year: 2025, label: "Sep" },   // September (0-indexed: 8)
      { month: 9, year: 2025, label: "Oct" },   // October (0-indexed: 9)
      { month: 10, year: 2025, label: "Nov" },  // November (0-indexed: 10)
    ];
    
    return months;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />

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
                  const [year, month, week] = key.split("-").map(Number);
                  const entries = groupedEntries[key];
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        weekColumnRefs.current[key] = el;
                      }}
                    >
                      <WeekColumn
                        entries={entries}
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

      {/* Timeline Footer */}
      <section className="border-t border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-8">
              {timelineMonths.map((monthInfo, index) => {
                const hasEntries = weekKeys.some((key) => {
                  const [year, month] = key.split("-").map(Number);
                  return (
                    month === monthInfo.month && year === monthInfo.year
                  );
                });

                return (
                  <button
                    key={`${monthInfo.year}-${monthInfo.month}`}
                    onClick={() => scrollToMonth(monthInfo.month, monthInfo.year)}
                    className="flex-shrink-0 text-center transition-colors hover:bg-gray-50 rounded-lg p-2 -m-2"
                    disabled={!hasEntries}
                  >
                    <div className={`mb-2 text-xs font-medium ${
                      hasEntries 
                        ? "text-gray-900 cursor-pointer hover:text-amber-600" 
                        : "text-gray-400 cursor-not-allowed"
                    } transition-colors`}>
                      {monthInfo.label} {monthInfo.year}
                    </div>
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3, 4].map((week) => {
                        const weekKey = `${monthInfo.year}-${monthInfo.month}-${week}`;
                        const hasWeekEntries = groupedEntries[weekKey]?.length > 0;
                        const isPast = index < timelineMonths.length - 1 || 
                          (index === timelineMonths.length - 1 && week <= Math.ceil(new Date().getDate() / 7));

                        return (
                          <div
                            key={week}
                            className={`h-2 w-2 rounded ${
                              hasWeekEntries
                                ? "bg-green-500"
                                : isPast
                                  ? "bg-gray-300"
                                  : "bg-gray-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </button>
                );
              })}
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

