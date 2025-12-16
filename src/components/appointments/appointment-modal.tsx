"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import AppointmentForm from "./appointment-form";

// Appointment form data interface
interface AppointmentFormData {
  contactId?: bigint;
  listingId?: bigint;
  leadId?: bigint;
  dealId?: bigint;
  prospectId?: bigint;
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endDate: string; // YYYY-MM-DD format
  endTime: string; // HH:mm format
  tripTimeMinutes?: number;
  notes?: string;
  appointmentType: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje";
  assignedTo?: string; // FK → users.id (who is assigned to the appointment)
}

// Type for appointment data returned from server
type ServerAppointmentData = {
  appointmentId: bigint;
  userId: string;
  assignedTo: string | null;
  contactId: bigint | null;
  listingId: bigint | null;
  listingContactId: bigint | null;
  dealId: bigint | null;
  prospectId: bigint | null;
  datetimeStart: Date | string;
  datetimeEnd: Date | string;
  tripTimeMinutes: number | null;
  status: string;
  title: string | null;
  notes: string | null;
  type: string | null;
  isActive: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  contactFirstName: string | null;
  contactLastName: string | null;
  propertyStreet: string | null;
  propertyTitle: string | null;
  city: string | null;
  creatorName: string | null;
  creatorFirstName: string | null;
  creatorLastName: string | null;
  agentName: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
};

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<AppointmentFormData>;
  title?: string;
  description?: string;
  onSuccess?: (appointmentId: bigint, appointmentData: ServerAppointmentData | null) => void; // Callback with appointment data
  mode?: "create" | "edit"; // New prop to distinguish between create and edit modes
  appointmentId?: bigint; // Required for edit mode
  // Optimistic update functions
  addOptimisticEvent?: (event: Partial<Record<string, unknown>>) => bigint;
  removeOptimisticEvent?: (tempId: bigint) => void;
  updateOptimisticEvent?: (
    tempId: bigint,
    updates: Partial<Record<string, unknown>>,
  ) => void;
}

export default function AppointmentModal({
  open,
  onOpenChange,
  initialData = {},
  title,
  description,
  onSuccess,
  mode = "create",
  appointmentId,
  addOptimisticEvent,
  removeOptimisticEvent,
  updateOptimisticEvent,
}: AppointmentModalProps) {
  // Set default title and description based on mode
  const defaultTitle = mode === "edit" ? "Editar Cita" : "Crear Nueva Cita";
  const defaultDescription =
    mode === "edit"
      ? "Modifique los detalles de la cita existente."
      : "Complete los detalles para programar una nueva cita.";

  const modalTitle = title ?? defaultTitle;
  const modalDescription = description ?? defaultDescription;
  // Handle successful appointment creation/update
  const handleSubmit = (appointmentId: bigint, appointmentData: ServerAppointmentData | null) => {
    console.log("Appointment created/updated with ID:", appointmentId, "Data:", appointmentData);

    // Close modal
    handleClose();

    // Trigger success callback with appointment data
    if (onSuccess) {
      onSuccess(appointmentId, appointmentData);
    }
  };

  // Handle modal close with navigation cleanup
  const handleClose = () => {
    onOpenChange(false);
  };

  // Handle cancel
  const handleCancel = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden p-0 sm:h-[90vh] sm:max-h-[90vh] sm:max-w-4xl">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <AppointmentForm
            // Key forces remount when switching between create/edit modes
            // This ensures form state is properly re-initialized
            key={mode === "edit" && appointmentId ? `edit-${appointmentId.toString()}` : "create"}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            mode={mode}
            appointmentId={appointmentId}
            addOptimisticEvent={addOptimisticEvent}
            removeOptimisticEvent={removeOptimisticEvent}
            updateOptimisticEvent={updateOptimisticEvent}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to handle URL parameter triggering
export function useAppointmentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState<Partial<AppointmentFormData>>(
    {},
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for 'new=true' URL parameter
    const shouldOpen = searchParams.get("new") === "true";

    if (shouldOpen) {
      // Extract initial data from URL parameters
      const urlInitialData: Partial<AppointmentFormData> = {};

      // Check for pre-populated date/time from calendar click
      const date = searchParams.get("date");
      const time = searchParams.get("time");
      const endTime = searchParams.get("endTime");

      if (date) {
        urlInitialData.startDate = date;
        urlInitialData.endDate = date;
      }

      if (time) {
        urlInitialData.startTime = time;
      }

      if (endTime) {
        urlInitialData.endTime = endTime;
      }

      // Check for contact ID
      const contactId = searchParams.get("contactId");
      if (contactId) {
        urlInitialData.contactId = BigInt(contactId);
      }

      // Check for listing ID
      const listingId = searchParams.get("listingId");
      if (listingId) {
        urlInitialData.listingId = BigInt(listingId);
        // When listingId is provided, default to "Visita" type
        urlInitialData.appointmentType = "Visita";
      }

      // Check for appointment type
      const type = searchParams.get("type");
      if (
        type &&
        ["Visita", "Reunión", "Firma", "Cierre", "Viaje"].includes(type)
      ) {
        urlInitialData.appointmentType =
          type as AppointmentFormData["appointmentType"];
      }

      setInitialData(urlInitialData);
      setIsOpen(true);
    }
  }, [searchParams]);

  // Function to open modal with initial data
  const openModal = (data?: Partial<AppointmentFormData>) => {
    setInitialData(data ?? {});
    setIsOpen(true);
  };

  // Function to close modal and clean URL
  const closeModal = () => {
    setIsOpen(false);

    // Clean URL parameters
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete("new");
    currentParams.delete("date");
    currentParams.delete("time");
    currentParams.delete("endTime");
    currentParams.delete("contactId");
    currentParams.delete("listingId");
    currentParams.delete("type");

    const newUrl = currentParams.toString()
      ? `${window.location.pathname}?${currentParams.toString()}`
      : window.location.pathname;

    // Use window.history.replaceState instead of router.replace to avoid
    // triggering Next.js navigation/caching that can interfere with refetch
    // in production. This only updates the browser URL without navigation side effects.
    window.history.replaceState(null, "", newUrl);
  };

  return {
    isOpen,
    openModal,
    closeModal,
    initialData,
  };
}

// Simple trigger component for opening the modal
interface AppointmentModalTriggerProps {
  children: React.ReactNode;
  initialData?: Partial<AppointmentFormData>;
}

export function AppointmentModalTrigger({
  children,
  initialData = {},
}: AppointmentModalTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      <AppointmentModal
        open={isOpen}
        onOpenChange={setIsOpen}
        initialData={initialData}
      />
    </>
  );
}
