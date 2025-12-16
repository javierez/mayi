"use client";

import {
  Clock,
  MapPin,
  Car,
  Home,
  Users,
  PenTool,
  Handshake,
  Train,
  ListTodo,
  CalendarIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { AppointmentCard, type AppointmentData } from "./appointment-card";

// Calendar Event Display Type from PRP
interface CalendarEvent {
  appointmentId: bigint;
  contactName: string;
  propertyAddress?: string;
  startTime: Date;
  endTime: Date;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow";
  type: string;
  title?: string;
  tripTimeMinutes?: number;
  notes?: string;
  // Optimistic update flag
  isOptimistic?: boolean;
}

interface CalendarEventProps {
  event: CalendarEvent;
  style: {
    top: string;
    height: string;
  };
  isSelected?: boolean;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
}

// Appointment type colors and icons from PRP
const appointmentTypes = {
  Visita: {
    color: "bg-blue-500",
    icon: <Home className="h-3 w-3" />,
    textColor: "text-white",
  },
  Reunión: {
    color: "bg-purple-500",
    icon: <Users className="h-3 w-3" />,
    textColor: "text-white",
  },
  Firma: {
    color: "bg-green-500",
    icon: <PenTool className="h-3 w-3" />,
    textColor: "text-white",
  },
  Cierre: {
    color: "bg-yellow-500",
    icon: <Handshake className="h-3 w-3" />,
    textColor: "text-white",
  },
  Viaje: {
    color: "bg-emerald-500",
    icon: <Train className="h-3 w-3" />,
    textColor: "text-white",
  },
  Tarea: {
    color: "bg-rose-500",
    icon: <ListTodo className="h-3 w-3" />,
    textColor: "text-white",
  },
};

// Status colors
const statusColors = {
  Scheduled: "opacity-100",
  Completed: "opacity-75 bg-green-600",
  Cancelled: "opacity-30 bg-gray-400 line-through",
  Rescheduled: "opacity-75 bg-orange-500",
  NoShow: "opacity-50 bg-red-400",
};

export default function CalendarEvent({
  event,
  style,
  isSelected = false,
  onClick,
  className = "",
}: CalendarEventProps) {
  const typeConfig = appointmentTypes[
    event.type as keyof typeof appointmentTypes
  ] || {
    color: "bg-gray-500",
    icon: <CalendarIcon className="h-3 w-3" />,
    textColor: "text-white",
  };

  const statusConfig = statusColors[event.status] || statusColors.Scheduled;

  // Apply visual indicators for optimistic events
  const isOptimisticEvent = event.isOptimistic ?? false;
  const optimisticStyles = isOptimisticEvent
    ? "opacity-75 ring-1 ring-blue-400 ring-opacity-50 animate-pulse"
    : "";

  const formatTime = (date: Date) => {
    // Use UTC components - times are stored as UTC in the database
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTripTime = (minutes?: number) => {
    if (!minutes || minutes === 0) return null;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // Calculate height in pixels to determine what content to show
  const heightPx = parseInt(style.height.replace("px", "")) || 60;
  const showDetails = heightPx > 50;
  const showExtended = heightPx > 80;
  const showFull = heightPx > 120;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  // Calculate travel time block height (1px per minute on calendar)
  const travelTimeHeight = event.tripTimeMinutes ?? 0;

  // Get the base color for fading travel blocks
  const getBaseColor = () => {
    switch (event.type) {
      case "Visita":
        return "59, 130, 246"; // blue-500 RGB
      case "Reunión":
        return "147, 51, 234"; // purple-500 RGB
      case "Firma":
        return "34, 197, 94"; // green-500 RGB
      case "Cierre":
        return "234, 179, 8"; // yellow-500 RGB
      case "Viaje":
        return "16, 185, 129"; // emerald-500 RGB
      case "Tarea":
        return "244, 63, 94"; // rose-500 RGB
      default:
        return "107, 114, 128"; // gray-500 RGB
    }
  };
  const baseColorRGB = getBaseColor();

  return (
    <>
      {/* Travel Time Block - positioned above appointment */}
      {travelTimeHeight > 0 && event.tripTimeMinutes != null && event.tripTimeMinutes > 0 && event.status !== "Cancelled" && (
        <div
          className="pointer-events-none absolute left-0 right-0 rounded-t-sm backdrop-blur-sm sm:left-0.5 sm:right-0.5 sm:rounded-t-lg"
          style={{
            top: `${parseInt(style.top) - travelTimeHeight}px`,
            height: `${travelTimeHeight}px`,
            background: `linear-gradient(to bottom,
              rgba(${baseColorRGB}, 0.12),
              rgba(${baseColorRGB}, 0.25)
            )`,
          }}
        >
          {/* Subtle travel indicator */}
          {travelTimeHeight >= 12 && (
            <div className="absolute right-1 top-0.5 hidden sm:block sm:right-2 sm:top-1">
              <Car
                className="h-2 w-2 sm:h-2.5 sm:w-2.5"
                style={{ color: `rgba(${baseColorRGB}, 0.5)` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Appointment Block */}
      <div
        className={cn(
          "calendar-event absolute left-0 right-0 cursor-pointer overflow-hidden px-0.5 py-0.5 shadow-sm transition-all duration-200 hover:ring-1 hover:ring-black sm:left-0.5 sm:right-0.5 sm:px-1 sm:py-1 sm:hover:ring-2 sm:hover:ring-offset-1 md:px-2",
          travelTimeHeight > 0 ? "" : "rounded-sm sm:rounded-lg", // No rounding if travel blocks exist (they handle the rounding)
          typeConfig.color,
          typeConfig.textColor,
          statusConfig,
          isSelected && "ring-1 ring-black sm:ring-2 sm:ring-offset-1",
          optimisticStyles,
          className,
        )}
        style={style}
        onClick={handleClick}
      >
        {/* Always show: Event type and title/contact name */}
        <div className="flex min-w-0 items-center gap-0.5 truncate text-[8px] font-medium leading-tight sm:gap-1 sm:text-[10px] md:text-xs">
          <span className="hidden sm:inline">{typeConfig.icon}</span>
          <span className="truncate">
            {event.title ? (
              <>
                <span className="hidden sm:inline">{event.type}: </span>
                {event.title}
              </>
            ) : (
              <>
                <span className="hidden sm:inline">{event.type} </span>
                {event.contactName}
              </>
            )}
          </span>
        </div>

        {/* Show time if height > 50px */}
        {showDetails && (
          <div className="mt-0.5 hidden min-w-0 items-center gap-0.5 truncate text-[8px] opacity-90 sm:flex sm:gap-1 sm:text-[10px] md:text-xs">
            <Clock className="h-2 w-2 flex-shrink-0 sm:h-3 sm:w-3" />
            <span className="truncate">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
              <span className="hidden md:inline">{event.title && ` • ${event.contactName}`}</span>
            </span>
          </div>
        )}

        {/* Show address if height > 80px and address exists */}
        {showExtended && event.propertyAddress && (
          <div className="mt-0.5 hidden min-w-0 items-center gap-0.5 truncate text-[8px] opacity-90 md:flex md:gap-1 md:text-xs">
            <MapPin className="h-2 w-2 flex-shrink-0 sm:h-3 sm:w-3" />
            <span className="truncate">{event.propertyAddress}</span>
          </div>
        )}

        {/* Show trip time if height > 80px and trip time exists */}
        {showExtended && event.tripTimeMinutes != null && event.tripTimeMinutes > 0 && (
          <div className="mt-0.5 hidden min-w-0 items-center gap-0.5 truncate text-[8px] opacity-90 md:flex md:gap-1 md:text-xs">
            <Car className="h-2 w-2 flex-shrink-0 sm:h-3 sm:w-3" />
            <span className="truncate">
              {formatTripTime(event.tripTimeMinutes)}
            </span>
          </div>
        )}

        {/* Show notes if height > 120px and notes exist */}
        {showFull && event.notes && (
          <div className="mt-1 hidden line-clamp-2 text-xs opacity-75 md:block">
            {event.notes}
          </div>
        )}

        {/* Status indicator for non-scheduled appointments */}
        {event.status !== "Scheduled" && (
          <div className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white sm:h-2 sm:w-2",
                event.status === "Completed" ? "bg-opacity-0" : "bg-opacity-80",
              )}
            />
          </div>
        )}
      </div>

      {/* Return Travel Time Block - positioned below appointment */}
      {travelTimeHeight > 0 && event.tripTimeMinutes != null && event.tripTimeMinutes > 0 && event.status !== "Cancelled" && (
        <div
          className="pointer-events-none absolute left-0 right-0 rounded-b-sm backdrop-blur-sm sm:left-0.5 sm:right-0.5 sm:rounded-b-lg"
          style={{
            top: `${parseInt(style.top) + parseInt(style.height)}px`,
            height: `${travelTimeHeight}px`,
            background: `linear-gradient(to top,
              rgba(${baseColorRGB}, 0.12),
              rgba(${baseColorRGB}, 0.25)
            )`,
          }}
        >
          {/* Subtle travel indicator */}
          {travelTimeHeight >= 12 && (
            <div className="absolute bottom-0.5 right-1 hidden sm:block sm:bottom-1 sm:right-2">
              <Car
                className="h-2 w-2 sm:h-2.5 sm:w-2.5"
                style={{ color: `rgba(${baseColorRGB}, 0.5)` }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Compact version for mobile or small spaces
export function CompactCalendarEvent({
  event,
  isSelected = false,
  onClick,
  className = "",
}: Omit<CalendarEventProps, "style">) {
  const typeConfig = appointmentTypes[
    event.type as keyof typeof appointmentTypes
  ] ?? {
    color: "bg-gray-500",
    icon: <CalendarIcon className="h-3 w-3" />,
    textColor: "text-white",
  };

  const statusConfig = statusColors[event.status] ?? statusColors.Scheduled;

  // Apply visual indicators for optimistic events
  const isOptimisticEvent = event.isOptimistic ?? false;
  const optimisticStyles = isOptimisticEvent
    ? "opacity-75 ring-1 ring-blue-400 ring-opacity-50 animate-pulse"
    : "";

  const formatTime = (date: Date) => {
    // Use UTC components - times are stored as UTC in the database
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  return (
    <div
      className={cn(
        "calendar-event relative cursor-pointer overflow-hidden rounded-lg px-2 py-1.5 shadow-sm transition-all duration-200 hover:ring-2 hover:ring-black hover:ring-offset-1 sm:px-3 sm:py-2",
        typeConfig.color,
        typeConfig.textColor,
        statusConfig,
        isSelected && "ring-2 ring-black ring-offset-1",
        optimisticStyles,
        className,
      )}
      onClick={handleClick}
    >
      {/* Event type and title/contact name */}
      <div className="flex min-w-0 items-center gap-1 text-xs font-medium leading-tight sm:gap-1.5 sm:text-sm">
        <span className="flex-shrink-0">{typeConfig.icon}</span>
        <span className="truncate">
          {event.title ? (
            <>
              {event.type}: {event.title}
            </>
          ) : (
            <>
              {event.type} {event.contactName}
            </>
          )}
        </span>
      </div>

      {/* Time */}
      <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs opacity-90 sm:mt-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </span>
      </div>

      {/* Address if available */}
      {event.propertyAddress && (
        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs opacity-90 sm:mt-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{event.propertyAddress}</span>
        </div>
      )}

      {/* Status indicator for non-scheduled appointments */}
      {event.status !== "Scheduled" && (
        <div className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full bg-white",
              event.status === "Completed" ? "bg-opacity-0" : "bg-opacity-80",
            )}
          />
        </div>
      )}
    </div>
  );
}

// List version for list view
export function ListCalendarEvent({
  event,
  isSelected = false,
  onClick,
  className = "",
  tasks = [],
}: Omit<CalendarEventProps, "style"> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks?: any[];
}) {
  // Convert CalendarEvent to AppointmentData format
  const appointmentData: AppointmentData = {
    appointmentId: event.appointmentId,
    type: event.type,
    status: event.status,
    datetimeStart: event.startTime,
    datetimeEnd: event.endTime,
    tripTimeMinutes: event.tripTimeMinutes,
    title: event.title,
    notes: event.notes,
    contactName: event.contactName,
    propertyAddress: event.propertyAddress,
    agentName: undefined, // Calendar events don't have agent info
    isOptimistic: event.isOptimistic,
  };

  // Create a typed callback handler
  const handleClick = onClick
    ? (appointment: AppointmentData) => {
        // Convert AppointmentData back to CalendarEvent for the callback
        const calendarEvent: CalendarEvent = {
          appointmentId: appointment.appointmentId,
          contactName: appointment.contactName,
          propertyAddress: appointment.propertyAddress,
          startTime: appointment.datetimeStart,
          endTime: appointment.datetimeEnd,
          status: appointment.status,
          type: appointment.type,
          tripTimeMinutes: appointment.tripTimeMinutes,
          notes: appointment.notes,
          isOptimistic: appointment.isOptimistic,
        };
        onClick(calendarEvent);
      }
    : undefined;

  return (
    <AppointmentCard
      appointment={appointmentData}
      isSelected={isSelected}
      onClick={handleClick}
      className={className}
      navigateToVisit={false} // Calendar uses onClick callback instead
      tasks={tasks} // Pass tasks from parent
    />
  );
}
