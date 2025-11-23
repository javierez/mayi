"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Filter,
  Check,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
  Tag,
  Package,
  FilterX,
  ToggleLeft,
  User,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";

// Badge statuses matching the activity tab
const BADGE_STATUSES = [
  { value: "hasUpcomingVisit", label: "Visita pendiente" },
  { value: "offerAccepted", label: "Oferta aceptada" },
  { value: "offerRejected", label: "Oferta rechazada" },
  { value: "offerPending", label: "Oferta pendiente" },
  { value: "hasCancelledVisit", label: "Visita cancelada" },
  { value: "hasMissedVisit", label: "Visita perdida" },
  { value: "hasCompletedVisit", label: "Visita completada" },
  { value: "noVisits", label: "Sin visitas" },
];

// Active status options
const ACTIVE_STATUSES = [
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
];

interface LeadFilterProps {
  view: "kanban" | "list";
  onViewChange: () => void;
  agents: Array<{ id: string; name: string }>;
}

export function LeadFilter({ view, onViewChange, agents }: LeadFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [leadFilters, setLeadFilters] = useState({
    badgeStatus: [] as string[],
    source: [] as string[],
    agent: [] as string[],
    isActive: ["true"] as string[], // Default to showing only active leads
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    badgeStatus: true,
    source: true,
    agent: true,
    isActive: true,
  });

  // Lead sources available in the system
  const leadSources = [
    "Appointment",
    "Web form",
    "Manual",
    "Phone call",
    "Email",
    "Referral",
  ];

  // Initialize filters from URL on mount
  useEffect(() => {
    const badgeStatus = searchParams.get("badgeStatus");
    const source = searchParams.get("source");
    const agent = searchParams.get("agent");
    const isActive = searchParams.get("isActive");
    const q = searchParams.get("search");

    setLeadFilters({
      badgeStatus: badgeStatus ? badgeStatus.split(",") : [],
      source: source ? source.split(",") : [],
      agent: agent ? agent.split(",") : [],
      isActive: isActive ? isActive.split(",") : ["true"], // Default to active if not in URL
    });
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const updateUrlParams = (
    newFilters: typeof leadFilters,
    newSearchQuery: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update search query
    if (newSearchQuery) {
      params.set("search", newSearchQuery);
    } else {
      params.delete("search");
    }

    // Update filters
    Object.entries(newFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
    });

    // Reset to first page when filters change
    params.set("page", "1");

    router.push(`/operaciones/leads?${params.toString()}`);
  };

  const toggleFilter = (category: keyof typeof leadFilters, value: string) => {
    const newFilters = {
      ...leadFilters,
      [category]: leadFilters[category].includes(value)
        ? leadFilters[category].filter((v) => v !== value)
        : [...leadFilters[category], value],
    };
    setLeadFilters(newFilters);
    updateUrlParams(newFilters, searchQuery);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearAllFilters = () => {
    const newFilters = {
      badgeStatus: [],
      source: [],
      agent: [],
      isActive: ["true"], // Reset to default: show active leads
    };
    setLeadFilters(newFilters);
    setSearchQuery("");
    updateUrlParams(newFilters, "");
  };

  const toggleAgentFilter = (value: string) => {
    const newFilters = {
      ...leadFilters,
      agent: leadFilters.agent.includes(value)
        ? leadFilters.agent.filter((v) => v !== value)
        : [...leadFilters.agent, value],
    };
    setLeadFilters(newFilters);
    updateUrlParams(newFilters, searchQuery);
  };

  const clearAgentFilters = () => {
    const newFilters = {
      ...leadFilters,
      agent: [],
    };
    setLeadFilters(newFilters);
    updateUrlParams(newFilters, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams(leadFilters, searchQuery);
  };

  // Count active filters excluding agent filters (agent has its own button)
  const activeFiltersCount =
    leadFilters.badgeStatus.length +
    leadFilters.source.length +
    leadFilters.isActive.length;

  const FilterOption = ({
    value: _value,
    label,
    isSelected,
    onClick,
  }: {
    value: string;
    label: string;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div
      className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
      onClick={onClick}
    >
      <div
        className={`flex h-3 w-3 items-center justify-center rounded border ${
          isSelected ? "border-primary bg-primary" : "border-input"
        }`}
      >
        {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
      </div>
      <span className={`text-[12px] ${isSelected ? "font-medium" : ""}`}>
        {label}
      </span>
    </div>
  );

  const FilterCategory = ({
    title,
    category,
    icon: Icon,
    children,
  }: {
    title: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1">
      <div
        className="group flex cursor-pointer items-center gap-1"
        onClick={() => toggleCategory(category)}
      >
        <Icon className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
        <h5 className="text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {title}
        </h5>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${
            expandedCategories[category] ? "rotate-180" : ""
          }`}
        />
      </div>
      {expandedCategories[category] && (
        <div className="space-y-0.5">{children}</div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      {/* Search and filters */}
      <div className="flex flex-1 items-center space-x-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="max-w-md flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por contacto, propietario o propiedad..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-8 pl-9"
            />
          </div>
        </form>

        {/* Filters and Agent Filter */}
        <div className="flex items-center gap-1.5">
          {/* Agent Filter - Separate Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-8 p-0"
              >
                <User className="h-3.5 w-3.5" />
                {leadFilters.agent.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                  >
                    {leadFilters.agent.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <ScrollArea className="h-[200px]">
                <div className="space-y-3 p-3">
                  <div className="space-y-0.5">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                        onClick={() => toggleAgentFilter(agent.id)}
                      >
                        <div
                          className={`flex h-3 w-3 items-center justify-center rounded border ${
                            leadFilters.agent.includes(agent.id)
                              ? "border-primary bg-primary"
                              : "border-input"
                          }`}
                        >
                          {leadFilters.agent.includes(agent.id) && (
                            <Check className="h-2 w-2 text-primary-foreground" />
                          )}
                        </div>
                        <span
                          className={`text-[12px] ${
                            leadFilters.agent.includes(agent.id)
                              ? "font-medium"
                              : ""
                          }`}
                        >
                          {agent.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
              {leadFilters.agent.length > 0 && (
                <div className="border-t p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAgentFilters}
                    className="h-6 w-full text-[12px]"
                  >
                    <FilterX className="mr-1 h-3 w-3" />
                    Borrar
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Main Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 p-3">
                  {/* Grid layout for filters */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* Badge Status Filter */}
                    <FilterCategory
                      title="Estado"
                      category="badgeStatus"
                      icon={Tag}
                    >
                      <div className="grid grid-cols-1 gap-x-2">
                        {BADGE_STATUSES.map((status) => (
                          <FilterOption
                            key={status.value}
                            value={status.value}
                            label={status.label}
                            isSelected={leadFilters.badgeStatus.includes(
                              status.value,
                            )}
                            onClick={() =>
                              toggleFilter("badgeStatus", status.value)
                            }
                          />
                        ))}
                      </div>
                    </FilterCategory>

                    {/* Source Filter */}
                    <FilterCategory
                      title="Fuente"
                      category="source"
                      icon={Package}
                    >
                      <div className="grid grid-cols-1 gap-x-2">
                        {leadSources.map((source) => (
                          <FilterOption
                            key={source}
                            value={source}
                            label={source}
                            isSelected={leadFilters.source.includes(source)}
                            onClick={() => toggleFilter("source", source)}
                          />
                        ))}
                      </div>
                    </FilterCategory>

                    {/* Active Status Filter */}
                    <FilterCategory
                      title="Estado de Registro"
                      category="isActive"
                      icon={ToggleLeft}
                    >
                      <div className="grid grid-cols-1 gap-x-2">
                        {ACTIVE_STATUSES.map((status) => (
                          <FilterOption
                            key={status.value}
                            value={status.value}
                            label={status.label}
                            isSelected={leadFilters.isActive.includes(
                              status.value,
                            )}
                            onClick={() =>
                              toggleFilter("isActive", status.value)
                            }
                          />
                        ))}
                      </div>
                    </FilterCategory>
                  </div>
                </div>
              </ScrollArea>

              {/* Clear filters button at bottom */}
              {activeFiltersCount > 0 && (
                <div className="border-t p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 w-full text-[12px]"
                  >
                    <FilterX className="mr-1 h-3 w-3" />
                    Borrar filtros
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-white p-0.5 shadow">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={onViewChange}
          title="Lista"
          className="h-7 w-7 p-0"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={view === "kanban" ? "secondary" : "ghost"}
          size="sm"
          disabled={true}
          title="Kanban disponible próximamente"
          className="h-7 w-7 p-0 opacity-50"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
