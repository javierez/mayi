"use client";

import { TaskPreferencesModal } from "./task-preferences-modal";

interface TaskPreferences {
  property: {
    uploadPhotos: { enabled: boolean; dueDays: number | null };
    completeInfo: { enabled: boolean; dueDays: number | null };
    scheduleVisit: { enabled: boolean; dueDays: number | null };
    pickupKeys: { enabled: boolean; dueDays: number | null };
    valuation: { enabled: boolean; dueDays: number | null };
    createHojaEncargo: { enabled: boolean; dueDays: number | null };
    signHojaEncargo: { enabled: boolean; dueDays: number | null };
    generateCartel: { enabled: boolean; dueDays: number | null };
  };
}

interface TaskPreferencesModalWrapperProps {
  showModal: boolean;
  listingId: string;
  taskPreferences: TaskPreferences;
}

export function TaskPreferencesModalWrapper({
  showModal,
  listingId,
  taskPreferences,
}: TaskPreferencesModalWrapperProps) {
  if (!showModal) return null;

  return (
    <TaskPreferencesModal
      isOpen={showModal}
      listingId={listingId}
      initialPreferences={taskPreferences}
    />
  );
}
