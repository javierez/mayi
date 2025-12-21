"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Filter, Check, ChevronDown, X } from "lucide-react";
import { ExpandableSection } from "./expandable-section";
import {
  AppointmentCard,
  type AppointmentData,
} from "~/components/appointments/appointment-card";
import { EmptyState } from "./empty-states";

type VisitStatus =
  | "Completed"
  | "Scheduled"
  | "Cancelled"
  | "Rescheduled"
  | "NoShow";

const STATUS_LABELS: Record<VisitStatus, string> = {
  Completed: "Completado",
  Scheduled: "Programado",
  Cancelled: "Cancelado",
  Rescheduled: "Reprogramado",
  NoShow: "No asistió",
};

const TYPE_LABELS: Record<string, string> = {
  Visita: "Visita",
  Reunión: "Reunión",
  Firma: "Firma",
  Cierre: "Cierre",
  Viaje: "Viaje",
};

export interface VisitData {
  appointmentId: bigint;
  type: string | null;
  status: string | null;
  datetimeStart: Date;
  datetimeEnd: Date;
  tripTimeMinutes: number | null;
  notes: string | null;
  contactId: bigint | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  agentName: string | null;
}

interface VisitsSectionProps {
  visits: VisitData[];
  listingId: bigint;
  onAppointmentClick: (appointment: AppointmentData) => void;
}

export function VisitsSection({
  visits,
  listingId,
  onAppointmentClick,
}: VisitsSectionProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<Set<VisitStatus>>(
    new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"]),
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"]),
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    status: true,
    type: true,
  });

  // Filter visits based on selected statuses and types
  const filteredVisits = visits.filter(
    (v) =>
      selectedStatuses.has(v.status as VisitStatus) &&
      selectedTypes.has(v.type ?? ""),
  );

  // Group visits by category
  const urgentVisits = filteredVisits
    .filter((v) => v.status === "NoShow" || v.status === "Rescheduled")
    .sort(
      (a, b) =>
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime(),
    );

  const activeVisits = filteredVisits
    .filter((v) => v.status === "Scheduled")
    .sort(
      (a, b) =>
        new Date(a.datetimeStart).getTime() -
        new Date(b.datetimeStart).getTime(),
    );

  const completedVisits = filteredVisits
    .filter((v) => v.status === "Completed")
    .sort(
      (a, b) =>
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime(),
    );

  const cancelledVisits = filteredVisits
    .filter((v) => v.status === "Cancelled")
    .sort(
      (a, b) =>
        new Date(b.datetimeStart).getTime() -
        new Date(a.datetimeStart).getTime(),
    );

  // Get unique types from visits
  const availableTypes = Array.from(
    new Set(visits.map((v) => v.type).filter((t): t is string => t !== null)),
  );

  const toggleStatus = (status: VisitStatus) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearFilters = () => {
    setSelectedStatuses(
      new Set(["Completed", "Scheduled", "Cancelled", "Rescheduled", "NoShow"]),
    );
    setSelectedTypes(
      new Set(["Visita", "Reunión", "Firma", "Cierre", "Viaje"]),
    );
  };

  const activeFilterCount =
    5 - selectedStatuses.size + (5 - selectedTypes.size);

  const createAppointmentData = (visit: VisitData): AppointmentData => ({
    appointmentId: visit.appointmentId,
    type: visit.type ?? "",
    status: (visit.status ?? "Completed") as
      | "Completed"
      | "Scheduled"
      | "Cancelled"
      | "Rescheduled"
      | "NoShow",
    datetimeStart: visit.datetimeStart,
    datetimeEnd: visit.datetimeEnd,
    tripTimeMinutes: visit.tripTimeMinutes ?? undefined,
    notes: visit.notes ?? undefined,
    contactId: visit.contactId ?? undefined,
    contactName:
      `${visit.contactFirstName ?? ""} ${visit.contactLastName ?? ""}`.trim(),
    propertyAddress: undefined,
    agentName: visit.agentName ?? undefined,
    isOptimistic: false,
  });

  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      {/* Filter Button */}
      {visits.length > 0 && (
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative h-8">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-sm px-1 font-normal"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="flex flex-col">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-6 p-4">
                    {/* Status Filter Category */}
                    <div className="space-y-2">
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => toggleCategory("status")}
                      >
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Estado
                        </h5>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.status ? "rotate-180 transform" : ""}`}
                        />
                      </div>
                      {expandedCategories.status && (
                        <div className="space-y-1">
                          {(
                            Object.entries(STATUS_LABELS) as [
                              VisitStatus,
                              string,
                            ][]
                          ).map(([status, label]) => (
                            <div
                              key={status}
                              className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                              onClick={() => toggleStatus(status)}
                            >
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border ${selectedStatuses.has(status) ? "border-primary bg-primary" : "border-input"}`}
                              >
                                {selectedStatuses.has(status) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Type Filter Category */}
                    <div className="space-y-2">
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => toggleCategory("type")}
                      >
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Tipo
                        </h5>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.type ? "rotate-180 transform" : ""}`}
                        />
                      </div>
                      {expandedCategories.type && (
                        <div className="space-y-1">
                          {availableTypes.map((type) => (
                            <div
                              key={type}
                              className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                              onClick={() => toggleType(type)}
                            >
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border ${selectedTypes.has(type) ? "border-primary bg-primary" : "border-input"}`}
                              >
                                {selectedTypes.has(type) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm">
                                {TYPE_LABELS[type] ?? type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                {activeFilterCount > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 w-full text-xs"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Borrar filtros
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* All visits view */}
      <div className="space-y-6">
          {/* No visits at all */}
          {filteredVisits.length === 0 && <EmptyState type="completed-visits" />}

          {/* Urgent/Action Required Section */}
          {urgentVisits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                  Requieren Atención ({urgentVisits.length})
                </h3>
              </div>
              <div className="space-y-3 pl-4">
                {urgentVisits.map((visit) => (
                  <AppointmentCard
                    key={visit.appointmentId.toString()}
                    appointment={createAppointmentData(visit)}
                    onClick={(appointment) => {
                      console.log(
                        "🔍 [Activity] Appointment clicked:",
                        appointment.appointmentId.toString(),
                      );
                      onAppointmentClick(appointment);
                    }}
                    navigateToVisit={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active/Upcoming Visits Section */}
          {activeVisits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Próximas Visitas ({activeVisits.length})
                </h3>
              </div>
              <div className="space-y-3">
                {activeVisits.map((visit) => (
                  <AppointmentCard
                    key={visit.appointmentId.toString()}
                    appointment={createAppointmentData(visit)}
                    onClick={(appointment) => {
                      console.log(
                        "🔍 [Activity] Appointment clicked:",
                        appointment.appointmentId.toString(),
                      );
                      onAppointmentClick(appointment);
                    }}
                    navigateToVisit={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Visits Section - Collapsible */}
          {completedVisits.length > 0 && (
            <ExpandableSection
              title="Completadas"
              count={completedVisits.length}
              defaultExpanded={false}
              storageKey={`activity-completed-visits-${listingId}`}
            >
              <div className="space-y-3">
                {completedVisits.map((visit) => (
                  <AppointmentCard
                    key={visit.appointmentId.toString()}
                    appointment={createAppointmentData(visit)}
                    onClick={(appointment) => {
                      console.log(
                        "🔍 [Activity] Appointment clicked:",
                        appointment.appointmentId.toString(),
                      );
                      onAppointmentClick(appointment);
                    }}
                    navigateToVisit={false}
                  />
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* Cancelled Visits Section - Collapsible */}
          {cancelledVisits.length > 0 && (
            <ExpandableSection
              title="Canceladas"
              count={cancelledVisits.length}
              defaultExpanded={false}
              storageKey={`activity-cancelled-visits-${listingId}`}
            >
              <div className="space-y-3">
                {cancelledVisits.map((visit) => (
                  <AppointmentCard
                    key={visit.appointmentId.toString()}
                    appointment={createAppointmentData(visit)}
                    onClick={(appointment) => {
                      console.log(
                        "🔍 [Activity] Appointment clicked:",
                        appointment.appointmentId.toString(),
                      );
                      onAppointmentClick(appointment);
                    }}
                    navigateToVisit={false}
                  />
                ))}
              </div>
            </ExpandableSection>
          )}
      </div>
    </div>
  );
}
