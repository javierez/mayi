"use client";

import { TaskPreferencesModal } from "./task-preferences-modal";

interface TaskPreferences {
  property: {
    uploadPhotos: { enabled: boolean; dueDays: number };
    completeInfo: { enabled: boolean; dueDays: number };
    scheduleVisit: { enabled: boolean; dueDays: number };
    pickupKeys: { enabled: boolean; dueDays: number };
    valuation: { enabled: boolean; dueDays: number };
    createHojaEncargo: { enabled: boolean; dueDays: number };
    signHojaEncargo: { enabled: boolean; dueDays: number };
    generateCartel: { enabled: boolean; dueDays: number };
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
