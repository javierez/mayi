"use client";

import { useState } from "react";
import { ActivityCard } from "./activity-card";
import { ActivityDetailModal } from "./activity-detail-modal";
import type { ListingActivityRecord } from "~/server/queries/listing-history";
import { FileText } from "lucide-react";

interface HistoryTimelineProps {
  activities: ListingActivityRecord[];
}

export function HistoryTimeline({ activities }: HistoryTimelineProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<ListingActivityRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleActivityClick = (activity: ListingActivityRecord) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedActivity(null);
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay actividad registrada</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Cuando se realicen cambios en esta propiedad (como modificaciones de precio,
          cambios de estado, publicaciones en portales, etc.), aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {activities.length} actividad{activities.length !== 1 ? "es" : ""}
          </p>
        </div>

        {activities.map((activity) => (
          <ActivityCard
            key={activity.id.toString()}
            activity={activity}
            onClick={() => handleActivityClick(activity)}
          />
        ))}
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
