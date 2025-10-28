"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import {
  Plus,
  Search,
  CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Filter,
  FilterX,
  X,
  TableIcon,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Loader,
  Home,
  Users,
  PenTool,
  Handshake,
  Train,
  RefreshCw,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import Image from "next/image"; // Add Image import for optimized images
import { useWeeklyAppointments } from "~/hooks/use-cached-calendar";
import CalendarEvent, {
  ListCalendarEvent,
  CompactCalendarEvent,
} from "~/components/appointments/calendar-event";
import AppointmentModal, {
  useAppointmentModal,
} from "~/components/appointments/appointment-modal";
import { AppointmentDetailSheet } from "~/components/appointments/appointment-detail-sheet";
import type { AppointmentData } from "~/components/appointments/appointment-card";
import {
  getAgentsForFilterAction,
  getBatchAppointmentTasksAction,
} from "~/server/actions/appointments";
import { useGoogleCalendarIntegration } from "~/hooks/use-google-calendar-integration";
import { GoogleCalendarSyncSettings } from "~/components/calendar/google-calendar-sync-settings";
import {
  canEditCalendar,
  canDeleteCalendar,
} from "~/app/actions/permissions/check-permissions";
import { useSession } from "~/lib/auth-client";
import { ExpandableSection } from "~/components/propiedades/detail/activity/expandable-section";

// Appointment types configuration
const appointmentTypes = {
  Visita: {
    color: "bg-blue-100 text-blue-800",
    icon: <Home className="h-4 w-4" />,
  },
  Reunión: {
    color: "bg-purple-100 text-purple-800",
    icon: <Users className="h-4 w-4" />,
  },
  Firma: {
    color: "bg-green-100 text-green-800",
    icon: <PenTool className="h-4 w-4" />,
  },
  Cierre: {
    color: "bg-yellow-100 text-yellow-800",
    icon: <Handshake className="h-4 w-4" />,
  },
  Viaje: {
    color: "bg-emerald-100 text-emerald-800",
    icon: <Train className="h-4 w-4" />,
  },
};

// Helper to get the Monday of the week for a given date
const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Helper to get date string in YYYY-MM-DD
const getDateString = (date: Date) => date.toISOString().split("T")[0];

// Helper to format date for display in separators
const formatDateSeparator = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = getDateString(date) === getDateString(today);
  const isTomorrow = getDateString(date) === getDateString(tomorrow);
  const isYesterday = getDateString(date) === getDateString(yesterday);

  if (isToday) return "Hoy";
  if (isTomorrow) return "Mañana";
  if (isYesterday) return "Ayer";

  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
};

// Helper to parse time string to hours and minutes
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours = 0, minutes = 0] = timeStr.split(":").map(Number);
  return { hours, minutes };
};

// Helper to calculate event position and height
const calculateEventStyle = (startTime: string, endTime: string) => {
  const start = parseTime(startTime);
  const end = parseTime(endTime || startTime);

  // Calculate position from top (each hour is 60px height)
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Calendar starts at 6:00 AM (360 minutes), so subtract that from position
  const calendarStartMinutes = 6 * 60; // 6:00 AM = 360 minutes
  const topPosition = ((startMinutes - calendarStartMinutes) / 60) * 60;

  // Height based on duration
  const durationMinutes = endMinutes - startMinutes;
  const height = (durationMinutes / 60) * 60;

  // Only show events that start at 6:00 AM or later
  if (startMinutes < calendarStartMinutes) {
    return {
      top: "0px",
      height: "0px",
      display: "none",
    };
  }

  return {
    top: `${Math.max(0, topPosition)}px`,
    height: `${height}px`,
  };
};

export default function AppointmentsPage() {
  const { data: session } = useSession();

  // Log session data for debugging
  useEffect(() => {
    console.log("👤 [Calendar] Current session:", {
      userId: session?.user?.id,
      userName: session?.user?.name,
      hasSession: !!session,
    });
  }, [session]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedFilterSections, setExpandedFilterSections] = useState<{
    type: boolean;
    status: boolean;
  }>({ type: true, status: true });
  const [agents, setAgents] = useState<
    Array<{
      id: string;
      name: string;
      firstName: string;
      lastName: string | null;
    }>
  >([]);
  const [view, setView] = useState<"list" | "calendar" | "weekly">("weekly");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<bigint | null>(null);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    bigint | null
  >(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Prefetch state management
  const hasTriggeredPrefetchRef = useRef(false);
  const lastPrefetchTimeRef = useRef<number>(0);

  // Use real appointments data
  const {
    appointments: realAppointments,
    loading,
    error,
    refetch,
    addOptimisticEvent,
    removeOptimisticEvent,
    updateOptimisticEvent,
  } = useWeeklyAppointments(weekStart);

  // Use appointment modal
  const {
    isOpen: isModalOpen,
    openModal,
    closeModal,
    initialData,
  } = useAppointmentModal();

  // Use Google Calendar integration
  const { integration, connect, disconnect, updateSyncDirection } =
    useGoogleCalendarIntegration();

  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);

  // Permission states
  const [hasEditCalendarPermission, setHasEditCalendarPermission] =
    useState<boolean>(false);
  const [hasDeleteCalendarPermission, setHasDeleteCalendarPermission] =
    useState<boolean>(false);

  // Tasks state - batch loaded for all appointments
  const [appointmentTasksMap, setAppointmentTasksMap] = useState<
    Record<number, unknown[]>
  >({});

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("🔐 [Calendar] Fetching calendar permissions...");
      try {
        const [editCalendarPerm, deleteCalendarPerm] = await Promise.all([
          canEditCalendar(),
          canDeleteCalendar(),
        ]);
        console.log("🔐 [Calendar] Permissions fetched:", {
          editCalendar: editCalendarPerm,
          deleteCalendar: deleteCalendarPerm,
        });
        setHasEditCalendarPermission(editCalendarPerm);
        setHasDeleteCalendarPermission(deleteCalendarPerm);
      } catch (error) {
        console.error(
          "❌ [Calendar] Error fetching calendar permissions:",
          error,
        );
        setHasEditCalendarPermission(false);
        setHasDeleteCalendarPermission(false);
      }
    };

    void fetchPermissions();
  }, []); // Run once on mount

  // Fetch agents for filter on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const result = await getAgentsForFilterAction();
        if (result.success) {
          setAgents(result.agents);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    void fetchAgents();
  }, []);

  // Filter appointments - memoized for performance
  const filteredAppointments = useMemo(() => {
    return realAppointments.filter((appointment) => {
      const matchesSearch =
        appointment.contactName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (appointment.propertyAddress
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ??
          false);
      const matchesType =
        typeFilter === "all" || appointment.type === typeFilter;

      // Map Spanish status filter to English DB status
      const statusMap: Record<string, string> = {
        Programado: "Scheduled",
        Completado: "Completed",
        Cancelado: "Cancelled",
        Reprogramado: "Rescheduled",
        "No asistió": "NoShow",
      };
      const matchesStatus =
        statusFilter === "all" ||
        appointment.status === statusMap[statusFilter];

      const matchesAgent =
        selectedAgents.length === 0 ||
        (appointment.agentName != null &&
          selectedAgents.some(
            (agentId) =>
              agents.find((agent) => agent.id === agentId)?.name ===
              appointment.agentName,
          ));
      return matchesSearch && matchesType && matchesStatus && matchesAgent;
    });
  }, [
    realAppointments,
    searchQuery,
    typeFilter,
    statusFilter,
    selectedAgents,
    agents,
  ]);

  // Batch fetch tasks for filtered appointments (only in list view)
  useEffect(() => {
    if (view !== "list" || filteredAppointments.length === 0) return;

    const fetchTasksForAppointments = async () => {
      try {
        const appointmentIds = filteredAppointments.map((app) =>
          Number(app.appointmentId),
        );
        const result = await getBatchAppointmentTasksAction(appointmentIds);

        if (result.success) {
          setAppointmentTasksMap(result.tasksMap);
        }
      } catch (error) {
        console.error("Error fetching appointment tasks:", error);
      }
    };

    void fetchTasksForAppointments();
  }, [view, filteredAppointments]);

  // Reset prefetch flag when week changes
  useEffect(() => {
    hasTriggeredPrefetchRef.current = false;
  }, [weekStart]);

  // Smart prefetching for list view - preload next week's data when scrolling
  useEffect(() => {
    if (view !== "list") return;

    const PREFETCH_COOLDOWN = 5000; // 5 seconds cooldown between prefetches
    const PREFETCH_THRESHOLD = 0.8; // Trigger at 80% scroll

    const prefetchNextWeek = () => {
      // Guard conditions
      if (hasTriggeredPrefetchRef.current || loading) return;

      const now = Date.now();
      const timeSinceLastPrefetch = now - lastPrefetchTimeRef.current;

      // Enforce cooldown period
      if (timeSinceLastPrefetch < PREFETCH_COOLDOWN) return;

      // Check scroll position
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight * PREFETCH_THRESHOLD) {
        hasTriggeredPrefetchRef.current = true;
        lastPrefetchTimeRef.current = now;

        // Calculate next week
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        // Trigger refetch for extended range
        console.log(
          `Prefetching appointments for next week starting ${nextWeekStart.toDateString()}`,
        );
        refetch().catch(console.error);
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(prefetchNextWeek);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [view, weekStart, loading, refetch]);

  // Scroll to 10:00 AM on mount for weekly view
  useEffect(() => {
    if (view === "weekly" && scrollAreaRef.current) {
      // Calendar starts at 6:00 AM, so 10:00 AM is 4 hours down
      const scrollPosition = 4 * 60; // 4 hours from 6:00 AM = 240px (4 hours * 60px per hour)
      scrollAreaRef.current.scrollTop = scrollPosition;
    }
  }, [view, weekStart]);

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
    }).format(date);
  };

  const formatWeekday = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
    })
      .format(date)
      .toUpperCase();
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(
      newWeekStart.getDate() + (direction === "next" ? 7 : -7),
    );
    setWeekStart(newWeekStart);
  };

  // Handle modal for appointment creation
  const handleCreateAppointment = () => {
    setEditMode("create");
    setEditingAppointmentId(null);
    openModal({});
  };

  // Handle click on empty time slot for appointment creation
  const handleTimeSlotClick = (date: Date, hour: number, minute = 0) => {
    const clickedDate = new Date(date);
    const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    // Default to 1-hour appointment
    const endHour = hour + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const dateString = getDateString(clickedDate);
    if (!dateString) return;

    // Set create mode and navigate with URL parameters to trigger modal
    setEditMode("create");
    setEditingAppointmentId(null);

    const params = new URLSearchParams();
    params.set("new", "true");
    params.set("date", dateString);
    params.set("time", startTime);
    params.set("endTime", endTime);

    router.push(`/calendario?${params.toString()}`, { scroll: false });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Permission helper function for ownership check
  const checkAppointmentOwnership = (
    appointment: AppointmentData & { userId?: string | null },
  ): boolean => {
    const userId = (appointment as AppointmentData & { userId?: string | null })
      .userId;
    if (!userId) return hasEditCalendarPermission;
    const isOwner = userId === session?.user?.id;
    return isOwner || hasEditCalendarPermission;
  };

  // Handle opening modal for editing
  const handleEditAppointment = (
    appointmentId: bigint,
    initialData: Partial<Record<string, unknown>>,
  ) => {
    setEditMode("edit");
    setEditingAppointmentId(appointmentId);
    openModal(initialData);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Calendario</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateAppointment}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Crear Evento</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar citas..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Agent Filter - Multi-select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-8 p-0"
              >
                <Users className="h-3.5 w-3.5" />
                {selectedAgents.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                  >
                    {selectedAgents.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="flex flex-col">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3 p-3">
                    <div className="space-y-0.5">
                      {agents.map((agent) => {
                        const isSelected = selectedAgents.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAgents((prev) =>
                                  prev.filter((id) => id !== agent.id),
                                );
                              } else {
                                setSelectedAgents((prev) => [
                                  ...prev,
                                  agent.id,
                                ]);
                              }
                            }}
                          >
                            <div
                              className={`flex h-3 w-3 items-center justify-center rounded border ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-input"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-2 w-2 text-primary-foreground" />
                              )}
                            </div>
                            <span
                              className={`text-[12px] ${isSelected ? "font-medium" : ""}`}
                            >
                              {agent.name ??
                                `${agent.firstName} ${agent.lastName ?? ""}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
                {selectedAgents.length > 0 && (
                  <div className="border-t p-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAgents([])}
                      className="h-6 w-full text-[12px]"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Borrar
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              setView(
                view === "list"
                  ? "calendar"
                  : view === "calendar"
                    ? "weekly"
                    : "list",
              )
            }
            title={
              view === "list"
                ? "Ver como calendario"
                : view === "calendar"
                  ? "Ver como semanal"
                  : "Ver como lista"
            }
          >
            {view === "list" ? (
              <CalendarIcon className="h-3.5 w-3.5" />
            ) : view === "calendar" ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <TableIcon className="h-3.5 w-3.5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                title="Integraciones"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {!integration.connected ? (
                <DropdownMenuItem
                  onClick={connect}
                  disabled={integration.loading}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Image
                      src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Google_Calendar_icon_(2020).svg.png"
                      alt="Google Calendar"
                      width={16}
                      height={16}
                      className="mr-2 h-4 w-4"
                    />
                    <span>Google Calendar</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    {integration.loading ? (
                      <Loader className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    <span className="text-xs">
                      {integration.loading ? "Conectando..." : "Conectar"}
                    </span>
                  </div>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open("https://calendar.google.com", "_blank")
                    }
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Image
                        src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Google_Calendar_icon_(2020).svg.png"
                        alt="Google Calendar"
                        width={24}
                        height={24}
                        className="mr-3 h-6 w-6"
                      />
                      {integration.lastSync && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          <span>
                            {integration.lastSync.toLocaleDateString()}{" "}
                            {integration.lastSync.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 text-muted-foreground opacity-50",
                          integration.loading && "animate-spin",
                        )}
                      />
                      <XCircle
                        className="h-4 w-4 cursor-pointer text-muted-foreground transition-colors hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          void disconnect()
                            .then((result) => {
                              if (result.success) void refetch();
                            })
                            .catch(console.error);
                        }}
                      />
                      <Settings
                        className="h-4 w-4 cursor-pointer text-muted-foreground transition-colors hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSyncSettingsOpen(true);
                        }}
                      />
                    </div>
                  </DropdownMenuItem>
                </>
              )}
              {integration.error && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled
                    className="flex items-center text-red-600"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span className="text-xs">{integration.error}</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/outlook-calendar.png"
                    alt="Outlook Calendar"
                    width={24}
                    height={24}
                    className="mr-3 h-6 w-6"
                  />
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>Próximamente</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <XCircle className="h-4 w-4 text-muted-foreground opacity-50" />
                  <RefreshCw className="h-4 w-4 text-muted-foreground opacity-50" />
                  <XCircle className="h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="relative h-8 text-xs"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {(typeFilter !== "all" || statusFilter !== "all") && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
              >
                {[typeFilter, statusFilter].filter((f) => f !== "all").length}
              </Badge>
            )}
            <ChevronDown
              className={`ml-1 h-3 w-3 transition-transform ${
                isFiltersOpen ? "rotate-180 transform" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <div
                    className="group flex cursor-pointer items-center gap-1"
                    onClick={() =>
                      setExpandedFilterSections((prev) => ({
                        ...prev,
                        type: !prev.type,
                      }))
                    }
                  >
                    <h5 className="text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Tipo
                    </h5>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${
                        expandedFilterSections.type ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {expandedFilterSections.type && (
                    <div className="space-y-0.5">
                      {Object.keys(appointmentTypes).map((type) => (
                        <div
                          key={type}
                          className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                          onClick={() => {
                            setTypeFilter(typeFilter === type ? "all" : type);
                          }}
                        >
                          <div
                            className={`flex h-3 w-3 items-center justify-center rounded border ${typeFilter === type ? "border-primary bg-primary" : "border-input"}`}
                          >
                            {typeFilter === type && (
                              <Check className="h-2 w-2 text-primary-foreground" />
                            )}
                          </div>
                          <span
                            className={`text-[12px] ${typeFilter === type ? "font-medium" : ""}`}
                          >
                            {type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div
                    className="group flex cursor-pointer items-center gap-1"
                    onClick={() =>
                      setExpandedFilterSections((prev) => ({
                        ...prev,
                        status: !prev.status,
                      }))
                    }
                  >
                    <h5 className="text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Estado
                    </h5>
                    <ChevronDown
                      className={`h-3 w-3 text-muted-foreground transition-transform ${
                        expandedFilterSections.status ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {expandedFilterSections.status && (
                    <div className="space-y-0.5">
                      {[
                        "Programado",
                        "Completado",
                        "Cancelado",
                        "Reprogramado",
                        "No asistió",
                      ].map((status) => (
                        <div
                          key={status}
                          className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                          onClick={() => {
                            setStatusFilter(
                              statusFilter === status ? "all" : status,
                            );
                          }}
                        >
                          <div
                            className={`flex h-3 w-3 items-center justify-center rounded border ${statusFilter === status ? "border-primary bg-primary" : "border-input"}`}
                          >
                            {statusFilter === status && (
                              <Check className="h-2 w-2 text-primary-foreground" />
                            )}
                          </div>
                          <span
                            className={`text-[12px] ${statusFilter === status ? "font-medium" : ""}`}
                          >
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(typeFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center justify-end px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="h-auto px-2 py-1 text-[12px]"
              >
                <FilterX className="mr-1 h-3 w-3" />
                Borrar filtros
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {view === "list" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando citas...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">{error}</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No se encontraron citas
            </div>
          ) : (
            <>
              {/* 🔴 Urgent/Action Required Section */}
              {(() => {
                const now = new Date();
                const urgentAppointments = filteredAppointments
                  .filter((a) => {
                    // Include NoShow and Rescheduled
                    if (a.status === "NoShow" || a.status === "Rescheduled")
                      return true;
                    // Include Scheduled appointments that are in the past
                    if (a.status === "Scheduled" && a.endTime < now)
                      return true;
                    return false;
                  })
                  .sort(
                    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
                  );

                return urgentAppointments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-700">
                        Requieren Atención ({urgentAppointments.length})
                      </h3>
                    </div>
                    <div className="space-y-0">
                      {urgentAppointments.map((appointment, index) => {
                        const currentDate = getDateString(
                          appointment.startTime,
                        );
                        const previousDate =
                          index > 0
                            ? getDateString(
                                urgentAppointments[index - 1]!.startTime,
                              )
                            : null;
                        const showDateLabel =
                          index === 0 ||
                          (previousDate && currentDate !== previousDate);
                        const isToday =
                          currentDate === getDateString(new Date());

                        return (
                          <div
                            key={`urgent-${appointment.appointmentId.toString()}`}
                          >
                            {showDateLabel && (
                              <div className={isToday ? "my-4" : "my-3"}>
                                {isToday ? (
                                  <div className="mb-2 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-blue-200" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                      Hoy -{" "}
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-blue-200" />
                                  </div>
                                ) : (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mb-3">
                              <ListCalendarEvent
                                event={appointment}
                                isSelected={
                                  selectedEvent === appointment.appointmentId
                                }
                                onClick={() =>
                                  setSelectedEvent(appointment.appointmentId)
                                }
                                tasks={
                                  appointmentTasksMap[
                                    Number(appointment.appointmentId)
                                  ] ?? []
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* 🟢 Active/Upcoming Appointments Section */}
              {(() => {
                const now = new Date();
                const activeAppointments = filteredAppointments
                  .filter((a) => a.status === "Scheduled" && a.endTime >= now)
                  .sort(
                    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
                  );

                return activeAppointments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                        Próximas Citas ({activeAppointments.length})
                      </h3>
                    </div>
                    <div className="space-y-0">
                      {activeAppointments.map((appointment, index) => {
                        const currentDate = getDateString(
                          appointment.startTime,
                        );
                        const previousDate =
                          index > 0
                            ? getDateString(
                                activeAppointments[index - 1]!.startTime,
                              )
                            : null;
                        const showDateLabel =
                          index === 0 ||
                          (previousDate && currentDate !== previousDate);
                        const isToday =
                          currentDate === getDateString(new Date());

                        return (
                          <div
                            key={`active-${appointment.appointmentId.toString()}`}
                          >
                            {showDateLabel && (
                              <div className={isToday ? "my-4" : "my-3"}>
                                {isToday ? (
                                  <div className="mb-2 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-blue-200" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                      Hoy -{" "}
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-blue-200" />
                                  </div>
                                ) : (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mb-3">
                              <ListCalendarEvent
                                event={appointment}
                                isSelected={
                                  selectedEvent === appointment.appointmentId
                                }
                                onClick={() =>
                                  setSelectedEvent(appointment.appointmentId)
                                }
                                tasks={
                                  appointmentTasksMap[
                                    Number(appointment.appointmentId)
                                  ] ?? []
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* ✓ Completed Appointments Section - Collapsible */}
              {(() => {
                const completedAppointments = filteredAppointments
                  .filter((a) => a.status === "Completed")
                  .sort(
                    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
                  );

                return completedAppointments.length > 0 ? (
                  <ExpandableSection
                    title="Completadas"
                    count={completedAppointments.length}
                    defaultExpanded={false}
                    storageKey="calendar-completed-appointments"
                  >
                    <div className="space-y-0">
                      {completedAppointments.map((appointment, index) => {
                        const currentDate = getDateString(
                          appointment.startTime,
                        );
                        const previousDate =
                          index > 0
                            ? getDateString(
                                completedAppointments[index - 1]!.startTime,
                              )
                            : null;
                        const showDateLabel =
                          index === 0 ||
                          (previousDate && currentDate !== previousDate);
                        const isToday =
                          currentDate === getDateString(new Date());

                        return (
                          <div
                            key={`completed-${appointment.appointmentId.toString()}`}
                          >
                            {showDateLabel && (
                              <div className={isToday ? "my-4" : "my-3"}>
                                {isToday ? (
                                  <div className="mb-2 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-blue-200" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                      Hoy -{" "}
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-blue-200" />
                                  </div>
                                ) : (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mb-3">
                              <ListCalendarEvent
                                event={appointment}
                                isSelected={
                                  selectedEvent === appointment.appointmentId
                                }
                                onClick={() =>
                                  setSelectedEvent(appointment.appointmentId)
                                }
                                tasks={
                                  appointmentTasksMap[
                                    Number(appointment.appointmentId)
                                  ] ?? []
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ExpandableSection>
                ) : null;
              })()}

              {/* ✕ Cancelled Appointments Section - Collapsible */}
              {(() => {
                const now = new Date();
                const fourteenDaysAgo = new Date(now);
                fourteenDaysAgo.setDate(now.getDate() - 14);

                const cancelledAppointments = filteredAppointments
                  .filter(
                    (a) =>
                      a.status === "Cancelled" &&
                      a.startTime >= fourteenDaysAgo,
                  )
                  .sort(
                    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
                  );

                return cancelledAppointments.length > 0 ? (
                  <ExpandableSection
                    title="Canceladas"
                    count={cancelledAppointments.length}
                    defaultExpanded={false}
                    storageKey="calendar-cancelled-appointments"
                  >
                    <div className="space-y-0">
                      {cancelledAppointments.map((appointment, index) => {
                        const currentDate = getDateString(
                          appointment.startTime,
                        );
                        const previousDate =
                          index > 0
                            ? getDateString(
                                cancelledAppointments[index - 1]!.startTime,
                              )
                            : null;
                        const showDateLabel =
                          index === 0 ||
                          (previousDate && currentDate !== previousDate);
                        const isToday =
                          currentDate === getDateString(new Date());

                        return (
                          <div
                            key={`cancelled-${appointment.appointmentId.toString()}`}
                          >
                            {showDateLabel && (
                              <div className={isToday ? "my-4" : "my-3"}>
                                {isToday ? (
                                  <div className="mb-2 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-blue-200" />
                                    <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                                      Hoy -{" "}
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-blue-200" />
                                  </div>
                                ) : (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateSeparator(
                                        appointment.startTime,
                                      )}
                                    </span>
                                    <div className="h-px flex-1 bg-gray-100" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mb-3">
                              <ListCalendarEvent
                                event={appointment}
                                isSelected={
                                  selectedEvent === appointment.appointmentId
                                }
                                onClick={() =>
                                  setSelectedEvent(appointment.appointmentId)
                                }
                                tasks={
                                  appointmentTasksMap[
                                    Number(appointment.appointmentId)
                                  ] ?? []
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ExpandableSection>
                ) : null;
              })()}
            </>
          )}
        </div>
      )}

      {view === "calendar" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando citas...</span>
            </div>
          ) : error ? (
            <div className="col-span-full py-8 text-center text-red-600">
              {error}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No se encontraron citas
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <CompactCalendarEvent
                key={appointment.appointmentId.toString()}
                event={appointment}
                isSelected={selectedEvent === appointment.appointmentId}
                onClick={() => setSelectedEvent(appointment.appointmentId)}
              />
            ))
          )}
        </div>
      )}

      {view === "weekly" && (
        <Card className="border-none shadow-none">
          <CardHeader className="px-0 pt-0">
            <div className="mb-4 mt-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h3 className="text-base font-semibold sm:text-lg">
                  {formatMonthYear(weekStart)}
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() => setWeekStart(getWeekStart(new Date()))}
                className="w-full sm:ml-4 sm:w-auto"
              >
                Hoy
              </Button>
            </div>
          </CardHeader>

          <CardContent className="overflow-x-auto p-0">
            <div className="min-w-[640px]">
              {/* Day headers */}
              <div className="sticky top-0 z-10 grid grid-cols-8 border-b bg-white">
                {/* Time column header */}
                <div className="flex h-14 min-w-[60px] items-center justify-center border-r text-xs text-muted-foreground sm:text-sm">
                  GMT+02
                </div>

                {/* Day columns headers */}
                {getWeekDays().map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      "relative flex h-14 min-w-[80px] flex-col items-center justify-center sm:min-w-[100px]",
                      isToday(day) && "bg-blue-50",
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      {formatWeekday(day)}
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium sm:h-10 sm:w-10 sm:text-xl",
                        isToday(day) && "bg-blue-600 text-white",
                      )}
                    >
                      {formatShortDate(day)}
                    </div>
                  </div>
                ))}
              </div>

              <ScrollArea
                className="h-[400px] sm:h-[500px] lg:h-[600px]"
                ref={scrollAreaRef}
              >
                <div className="grid grid-cols-8">
                  {/* Hours column */}
                  <div className="flex flex-col border-r">
                    {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                      <div
                        key={hour}
                        className="flex h-[60px] items-start justify-end border-b pr-1 pt-1 text-xs text-muted-foreground sm:pr-2"
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  {/* Days columns */}
                  {getWeekDays().map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={cn(
                        "relative flex min-w-[80px] flex-col border-r sm:min-w-[100px]",
                        isToday(day) && "bg-blue-50/30",
                      )}
                    >
                      {/* Hour slots */}
                      {Array.from({ length: 18 }, (_, i) => i + 6).map(
                        (hour) => (
                          <div
                            key={hour}
                            className="relative h-[60px] border-b"
                          >
                            {/* First half-hour slot */}
                            <div
                              className="absolute left-0 right-0 top-0 h-1/2 cursor-pointer transition-colors hover:bg-blue-50/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTimeSlotClick(day, hour, 0);
                              }}
                              title={`Crear cita - ${hour.toString().padStart(2, "0")}:00`}
                            />

                            {/* Half-hour divider */}
                            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200"></div>

                            {/* Second half-hour slot */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1/2 cursor-pointer transition-colors hover:bg-blue-50/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTimeSlotClick(day, hour, 30);
                              }}
                              title={`Crear cita - ${hour.toString().padStart(2, "0")}:30`}
                            />
                          </div>
                        ),
                      )}

                      {/* Appointments for this day */}
                      {!loading &&
                        !error &&
                        filteredAppointments
                          .filter((app) => {
                            const appDate = new Date(app.startTime)
                              .toISOString()
                              .split("T")[0];
                            const dayDate = getDateString(day);
                            return appDate === dayDate;
                          })
                          .map((app) => {
                            const startTime = new Date(app.startTime)
                              .toTimeString()
                              .slice(0, 5);
                            const endTime = new Date(app.endTime)
                              .toTimeString()
                              .slice(0, 5);
                            const eventStyle = calculateEventStyle(
                              startTime,
                              endTime,
                            );

                            return (
                              <CalendarEvent
                                key={app.appointmentId.toString()}
                                event={app}
                                style={eventStyle}
                                isSelected={selectedEvent === app.appointmentId}
                                onClick={() =>
                                  setSelectedEvent(app.appointmentId)
                                }
                              />
                            );
                          })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Detail Sheet (shows when an event is selected) */}
      <AppointmentDetailSheet
        appointment={
          selectedEvent
            ? (() => {
                const event = realAppointments.find(
                  (a) => a.appointmentId === selectedEvent,
                );
                if (!event) return null;

                // Map calendar event to AppointmentData with userId for ownership check
                return {
                  appointmentId: event.appointmentId,
                  type: event.type,
                  status: event.status,
                  datetimeStart: event.startTime,
                  datetimeEnd: event.endTime,
                  tripTimeMinutes: event.tripTimeMinutes ?? undefined,
                  notes: event.notes ?? undefined,
                  contactId: event.contactId,
                  contactName: event.contactName,
                  propertyAddress: event.propertyAddress ?? undefined,
                  agentName: event.agentName ?? undefined,
                  isOptimistic: event.isOptimistic ?? false,
                  userId: event.userId, // Include userId for ownership check
                  listingId: event.listingId,
                  listingContactId: event.listingContactId,
                  dealId: event.dealId,
                  prospectId: event.prospectId,
                };
              })()
            : null
        }
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onUpdate={async () => await refetch()}
        onEdit={handleEditAppointment}
        permissions={{
          canEdit: hasEditCalendarPermission,
          canDelete: hasDeleteCalendarPermission,
          checkOwnership: checkAppointmentOwnership,
        }}
        context={{
          includeExtendedFields: true,
        }}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        open={isModalOpen}
        onOpenChange={closeModal}
        initialData={initialData}
        mode={editMode}
        appointmentId={editingAppointmentId ?? undefined}
        onSuccess={() => {
          // Optimistic updates handle immediate UI changes
          // The form will convert optimistic events to real events on server response
        }}
        addOptimisticEvent={addOptimisticEvent}
        removeOptimisticEvent={removeOptimisticEvent}
        updateOptimisticEvent={updateOptimisticEvent}
      />

      <GoogleCalendarSyncSettings
        open={syncSettingsOpen}
        onOpenChange={setSyncSettingsOpen}
        currentDirection={integration.syncDirection}
        onDirectionChange={updateSyncDirection}
        loading={integration.loading}
      />
    </div>
  );
}
