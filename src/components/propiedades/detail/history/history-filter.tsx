"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Filter,
  X,
  Check,
  ChevronDown,
  User,
  Calendar,
  Tag,
  FilterX,
} from "lucide-react";
import { getAllActionTypesForFilter } from "~/lib/formatters/activity-formatter";
import { format } from "date-fns";

interface HistoryFilterProps {
  agents?: Array<{ id: string; name: string }>;
}

export function HistoryFilter({ agents = [] }: HistoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agentFilters, setAgentFilters] = useState<string[]>([]);
  const [actionFilters, setActionFilters] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    agent: false,
    time: false,
    action: false,
  });

  const actionTypes = getAllActionTypesForFilter();

  // Initialize filters from URL on mount
  useEffect(() => {
    const agent = searchParams.get("agent");
    const actions = searchParams.get("actions");
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");

    setAgentFilters(agent ? agent.split(",") : []);
    setActionFilters(actions ? actions.split(",") : []);
    setDateFrom(from ?? "");
    setDateTo(to ?? "");
    setDatePreset("");
  }, [searchParams]);

  const updateUrlParams = (
    newAgentFilters: string[],
    newActionFilters: string[],
    newDateFrom: string,
    newDateTo: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update agent filter
    if (newAgentFilters.length > 0) {
      params.set("agent", newAgentFilters.join(","));
    } else {
      params.delete("agent");
    }

    // Update action filter
    if (newActionFilters.length > 0) {
      params.set("actions", newActionFilters.join(","));
    } else {
      params.delete("actions");
    }

    // Update date filters
    if (newDateFrom) {
      params.set("dateFrom", newDateFrom);
    } else {
      params.delete("dateFrom");
    }
    if (newDateTo) {
      params.set("dateTo", newDateTo);
    } else {
      params.delete("dateTo");
    }

    // Reset to first page when filters change
    params.set("page", "1");

    router.push(`/historial?${params.toString()}`);
  };

  const toggleAgentFilter = (value: string) => {
    const newFilters = agentFilters.includes(value)
      ? agentFilters.filter((v) => v !== value)
      : [...agentFilters, value];
    setAgentFilters(newFilters);
    updateUrlParams(newFilters, actionFilters, dateFrom, dateTo);
  };

  const toggleActionFilter = (value: string) => {
    const newFilters = actionFilters.includes(value)
      ? actionFilters.filter((v) => v !== value)
      : [...actionFilters, value];
    setActionFilters(newFilters);
    updateUrlParams(agentFilters, newFilters, dateFrom, dateTo);
  };

  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let from = "";
    let to = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "today":
        from = format(today, "yyyy-MM-dd");
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        from = format(weekAgo, "yyyy-MM-dd");
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        from = format(monthAgo, "yyyy-MM-dd");
        break;
      case "3months":
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        from = format(threeMonthsAgo, "yyyy-MM-dd");
        break;
      case "clear":
        from = "";
        to = "";
        break;
    }

    setDatePreset(preset === "clear" ? "" : preset);
    setDateFrom(from);
    setDateTo(to);
    updateUrlParams(agentFilters, actionFilters, from, to);
  };

  const handleDateChange = (type: "from" | "to", value: string) => {
    if (type === "from") {
      setDateFrom(value);
      setDatePreset("");
      updateUrlParams(agentFilters, actionFilters, value, dateTo);
    } else {
      setDateTo(value);
      setDatePreset("");
      updateUrlParams(agentFilters, actionFilters, dateFrom, value);
    }
  };

  const clearFilters = () => {
    setAgentFilters([]);
    setActionFilters([]);
    setDateFrom("");
    setDateTo("");
    setDatePreset("");
    updateUrlParams([], [], "", "");
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const activeFiltersCount =
    agentFilters.length + actionFilters.length + (dateFrom || dateTo ? 1 : 0);

  const FilterOption = ({
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 text-xs"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
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
          <ChevronDown
            className={`ml-1 h-3 w-3 transition-transform ${
              isFiltersOpen ? "rotate-180 transform" : ""
            }`}
          />
        </Button>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2 mb-4">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FilterCategory
                  title="Agente"
                  category="agent"
                  icon={User}
                >
                  <div className="pt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                        >
                          {agentFilters.length > 0
                            ? `${agentFilters.length} seleccionado${agentFilters.length > 1 ? "s" : ""}`
                            : "Seleccionar agentes"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <div className="flex flex-col">
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-3 p-3">
                              <div className="space-y-0.5">
                                {agents.map((agent) => (
                                  <FilterOption
                                    key={agent.id}
                                    value={agent.id}
                                    label={agent.name}
                                    isSelected={agentFilters.includes(agent.id)}
                                    onClick={() => toggleAgentFilter(agent.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          </ScrollArea>
                          {agentFilters.length > 0 && (
                            <div className="border-t p-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAgentFilters([]);
                                  updateUrlParams([], actionFilters, dateFrom, dateTo);
                                }}
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
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Fecha"
                  category="time"
                  icon={Calendar}
                >
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant={datePreset === "today" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handleDatePreset("today")}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant={datePreset === "week" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handleDatePreset("week")}
                      >
                        Semana
                      </Button>
                      <Button
                        variant={datePreset === "month" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handleDatePreset("month")}
                      >
                        Mes
                      </Button>
                      <Button
                        variant={datePreset === "3months" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handleDatePreset("3months")}
                      >
                        3 Meses
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleDateChange("from", e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Desde"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleDateChange("to", e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Hasta"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDatePreset("clear")}
                        className="h-6 w-full text-[11px]"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Limpiar fecha
                      </Button>
                    )}
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Tipo de acción"
                  category="action"
                  icon={Tag}
                >
                  <div className="pt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                        >
                          {actionFilters.length > 0
                            ? `${actionFilters.length} seleccionado${actionFilters.length > 1 ? "s" : ""}`
                            : "Seleccionar acciones"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="flex flex-col">
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-3 p-3">
                              <div className="space-y-0.5">
                                {actionTypes.map((action) => (
                                  <FilterOption
                                    key={action.value}
                                    value={action.value}
                                    label={action.label}
                                    isSelected={actionFilters.includes(action.value)}
                                    onClick={() => toggleActionFilter(action.value)}
                                  />
                                ))}
                              </div>
                            </div>
                          </ScrollArea>
                          {actionFilters.length > 0 && (
                            <div className="border-t p-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActionFilters([]);
                                  updateUrlParams(agentFilters, [], dateFrom, dateTo);
                                }}
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
                  </div>
                </FilterCategory>
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-end px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto px-2 py-1 text-[12px]"
              >
                <FilterX className="mr-1 h-3 w-3" />
                Borrar filtros
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

