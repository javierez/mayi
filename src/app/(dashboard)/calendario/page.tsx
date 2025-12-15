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
import {
  Plus,
  Search,
  CalendarIcon,
  Clock,
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
import { CalendarListView } from "~/components/appointments/calendar-list-view";
import { CalendarWeeklyView } from "~/components/appointments/calendar-weekly-view";
import { MonthlyCalendarView } from "~/components/appointments/monthly-calendar-view";
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

// Helper to get date string in DD-MM-YYYY (using local time, not UTC)
const getDateString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function AppointmentsPage() {
  const { data: session } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() =>
    session?.user?.id ? [session.user.id] : [],
  );
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
  const [view, setView] = useState<"list" | "calendar" | "weekly">("calendar");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<bigint | null>(null);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    bigint | null
  >(null);
  const router = useRouter();

  // Prefetch state management
  const hasTriggeredPrefetchRef = useRef(false);
  const lastPrefetchTimeRef = useRef<number>(0);

  // Use real appointments data - pass selectedAgents as filter
  const {
    appointments: realAppointments,
    loading,
    error,
    refetch,
    addOptimisticEvent,
    removeOptimisticEvent,
    updateOptimisticEvent,
  } = useWeeklyAppointments(
    weekStart,
    selectedAgents.length > 0 ? selectedAgents : undefined,
  );

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

  // Initialize selectedAgents with current user when session loads
  useEffect(() => {
    console.log("👤 [Calendar] Current session:", {
      userId: session?.user?.id,
      userName: session?.user?.name,
      hasSession: !!session,
    });

    // Set current user as default filter when session loads
    if (session?.user?.id && selectedAgents.length === 0) {
      setSelectedAgents([session.user.id]);
    }
  }, [session, selectedAgents.length]);

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
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

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar citas..."
              className="h-8 w-full border-0 pl-8 text-sm shadow-md"
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
                {/* Header with count */}
                <div className="border-b px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-muted-foreground">
                      Filtrar por agente
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {selectedAgents.length}/5
                    </span>
                  </div>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3 p-3">
                    <div className="space-y-0.5">
                      {agents.map((agent) => {
                        const isSelected = selectedAgents.includes(agent.id);
                        const isDisabled = !isSelected && selectedAgents.length >= 5;
                        return (
                          <div
                            key={agent.id}
                            className={`flex items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors ${
                              isDisabled
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:bg-accent"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;

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
                                  : isDisabled
                                    ? "border-muted bg-muted"
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
                      onClick={() => {
                        // Reset to current user only if available, otherwise empty
                        if (session?.user?.id) {
                          setSelectedAgents([session.user.id]);
                        } else {
                          setSelectedAgents([]);
                        }
                      }}
                      className="h-6 w-full text-[12px]"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Restablecer
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Toggle Button Group */}
          <div className="flex h-8 items-center rounded-md bg-muted/30 p-0.5 shadow-md">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-sm",
                view === "calendar"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
              onClick={() => setView("calendar")}
              title="Calendario compacto"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-sm",
                view === "weekly"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
              onClick={() => setView("weekly")}
              title="Vista semanal"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-sm",
                view === "list"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
              onClick={() => setView("list")}
              title="Vista de lista"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
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
        <CollapsibleContent className="mb-4 space-y-2">
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
        <CalendarListView
          appointments={filteredAppointments.map((app) => ({
            appointmentId: app.appointmentId,
            type: app.type,
            status: app.status,
            datetimeStart: app.startTime,
            datetimeEnd: app.endTime,
            tripTimeMinutes: app.tripTimeMinutes,
            title: app.title,
            notes: app.notes,
            contactName: app.contactName,
            propertyAddress: app.propertyAddress,
          }))}
          loading={loading}
          error={error}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          appointmentTasksMap={appointmentTasksMap}
        />
      )}

      {view === "calendar" && (
        <MonthlyCalendarView
          appointments={filteredAppointments}
          loading={loading}
          error={error}
          onRefetch={() => void refetch()}
          onEventClick={(appointmentId) => setSelectedEvent(appointmentId)}
          onDateClick={(date) => {
            const dateString = getDateString(date);
            if (!dateString) return;

            setEditMode("create");
            setEditingAppointmentId(null);

            const params = new URLSearchParams();
            params.set("new", "true");
            params.set("date", dateString);
            params.set("time", "10:00");
            params.set("endTime", "11:00");

            router.push(`/calendario?${params.toString()}`, { scroll: false });
          }}
          selectedEventId={selectedEvent}
        />
      )}

      {view === "weekly" && (
        <CalendarWeeklyView
          appointments={filteredAppointments.map((app) => ({
            appointmentId: app.appointmentId,
            type: app.type,
            status: app.status,
            datetimeStart: app.startTime,
            datetimeEnd: app.endTime,
            tripTimeMinutes: app.tripTimeMinutes,
            title: app.title,
            notes: app.notes,
            contactName: app.contactName,
            propertyAddress: app.propertyAddress,
          }))}
          loading={loading}
          error={error}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          weekStart={weekStart}
          onNavigateWeek={navigateWeek}
          onRefresh={() => void refetch()}
          onTimeSlotClick={handleTimeSlotClick}
        />
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
                  contactId: event.contactId ?? undefined,
                  contactName: event.contactName,
                  propertyAddress: event.propertyAddress ?? undefined,
                  propertyTitle: event.propertyTitle ?? undefined,
                  city: event.city ?? undefined,
                  listingId: event.listingId ?? undefined,
                  agentName: event.agentName ?? undefined,
                  isOptimistic: event.isOptimistic ?? false,
                  userId: event.userId, // Include userId for ownership check
                  listingContactId: event.listingContactId,
                  dealId: event.dealId,
                  prospectId: event.prospectId,
                  title: event.title ?? undefined,
                };
              })()
            : null
        }
        isOpen={selectedEvent !== null}
        onClose={() => {
          setSelectedEvent(null);
          // Don't refetch on close - only refetch when onUpdate is called (status changes, deletes)
        }}
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
        onOpenChange={(_open) => {
          closeModal();
        }}
        initialData={initialData}
        mode={editMode}
        appointmentId={editingAppointmentId ?? undefined}
        onSuccess={() => {
          // Trigger refresh of calendar view after successful create/update
          void refetch();
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
    </div>
  );
}
