"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalActivityCard } from "./global-activity-card";
import { ActivityDetailModal } from "./activity-detail-modal";
import type { ListingActivityRecord } from "~/server/queries/listing-history";
import type { ContactActivityWithUser } from "~/server/queries/contact-activity";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import { FileText, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Union type for all activity types
type AllActivityRecord =
  | (ListingActivityRecord & { listingTitle: string; referenceNumber: string | null; activityType: 'listing' })
  | (ContactActivityWithUser & { activityType: 'contact'; contactName: string; contactId: bigint })
  | (ListingContactActivityWithUser & { activityType: 'listing_contact'; contactName: string; contactId: bigint; listingId: bigint | null });

interface GlobalHistoryTimelineProps {
  activities: AllActivityRecord[];
  currentPage?: number;
  totalPages?: number;
}

export function GlobalHistoryTimeline({
  activities,
  currentPage = 1,
  totalPages = 1,
}: GlobalHistoryTimelineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedActivity, setSelectedActivity] =
    useState<AllActivityRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchParams.get("agent") ??
      searchParams.get("dateFrom") ??
      searchParams.get("dateTo") ??
      searchParams.get("actions")
    );
  }, [searchParams]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, typeof activities>();

    activities.forEach((activity) => {
      const dateKey = format(activity.createdAt, "yyyy-MM-dd");

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)?.push(activity);
    });

    // Convert to array and sort by date (most recent first)
    return Array.from(groups.entries())
      .map(([dateKey, items]) => ({
        dateKey,
        dateLabel: format(new Date(dateKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
        activities: items,
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [activities]);

  const handleActivityClick = (activity: AllActivityRecord) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedActivity(null);
    }
  };

  const handlePageChange = (page: number) => {
    router.push(`/historial?page=${page}`);
  };

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {hasActiveFilters
            ? "No se encontraron actividades con los filtros aplicados"
            : "No hay actividad registrada"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {hasActiveFilters
            ? "Intenta ajustar los filtros para ver más resultados."
            : "Cuando se realicen cambios en las propiedades o contactos, aparecerán aquí."}
        </p>
      </div>
    );
  }

  // Pagination controls component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
      <div className="flex items-center justify-between border-t bg-white px-4 py-3 sm:px-6 mt-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!canGoPrevious}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!canGoNext}
          >
            Siguiente
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!canGoPrevious}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                const isCurrentPage = pageNum === currentPage;

                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                      isCurrentPage
                        ? "z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        : "text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
                    )}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!canGoNext}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {groupedActivities.map((group) => {
          const isCollapsed = collapsedDates.has(group.dateKey);

          return (
            <div key={group.dateKey}>
              {/* Date header - collapsible */}
              <button
                onClick={() => toggleDateCollapse(group.dateKey)}
                className="flex w-full items-center gap-2 py-2 text-left transition-colors hover:text-foreground"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                />
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {group.dateLabel}
                </span>
                <div className="ml-2 flex-1 border-t border-muted" />
                <span className="text-xs text-muted-foreground">
                  {group.activities.length}
                </span>
              </button>

              {/* Activities for this date */}
              {!isCollapsed && (
                <div className="ml-6 space-y-3 mt-2">
                  {group.activities.map((activity) => (
                    <GlobalActivityCard
                      key={`${activity.activityType}-${activity.id.toString()}`}
                      activity={activity}
                      onClick={() => handleActivityClick(activity)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <PaginationControls />

      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
