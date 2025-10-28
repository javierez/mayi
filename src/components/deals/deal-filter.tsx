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
  Tag,
  FilterX,
  User,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEAL_STATUSES,
  DEAL_STATUS_LABELS,
} from "~/lib/constants/deal-statuses";

// Convert statuses to filter options
const STATUS_OPTIONS = DEAL_STATUSES.map((status) => ({
  value: status,
  label: DEAL_STATUS_LABELS[status],
}));

interface DealFilterProps {
  agents: Array<{ id: string; name: string }>;
}

export function DealFilter({ agents }: DealFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [dealFilters, setDealFilters] = useState({
    status: [] as string[],
    agent: [] as string[],
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    status: true,
    agent: true,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const status = searchParams.get("status");
    const agent = searchParams.get("agent");
    const q = searchParams.get("search");

    setDealFilters({
      status: status ? status.split(",") : [],
      agent: agent ? agent.split(",") : [],
    });
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const updateUrlParams = (
    newFilters: typeof dealFilters,
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

    router.push(`/operaciones/deals?${params.toString()}`);
  };

  const toggleFilter = (category: keyof typeof dealFilters, value: string) => {
    const newFilters = {
      ...dealFilters,
      [category]: dealFilters[category].includes(value)
        ? dealFilters[category].filter((v) => v !== value)
        : [...dealFilters[category], value],
    };
    setDealFilters(newFilters);
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
      status: [],
      agent: [],
    };
    setDealFilters(newFilters);
    setSearchQuery("");
    updateUrlParams(newFilters, "");
  };

  const toggleAgentFilter = (value: string) => {
    const newFilters = {
      ...dealFilters,
      agent: dealFilters.agent.includes(value)
        ? dealFilters.agent.filter((v) => v !== value)
        : [...dealFilters.agent, value],
    };
    setDealFilters(newFilters);
    updateUrlParams(newFilters, searchQuery);
  };

  const clearAgentFilters = () => {
    const newFilters = {
      ...dealFilters,
      agent: [],
    };
    setDealFilters(newFilters);
    updateUrlParams(newFilters, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams(dealFilters, searchQuery);
  };

  // Count active filters excluding agent filters (agent has its own button)
  const activeFiltersCount = dealFilters.status.length;

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
              placeholder="Buscar por comprador, propietario o propiedad..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
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
                {dealFilters.agent.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                  >
                    {dealFilters.agent.length}
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
                            dealFilters.agent.includes(agent.id)
                              ? "border-primary bg-primary"
                              : "border-input"
                          }`}
                        >
                          {dealFilters.agent.includes(agent.id) && (
                            <Check className="h-2 w-2 text-primary-foreground" />
                          )}
                        </div>
                        <span
                          className={`text-[12px] ${
                            dealFilters.agent.includes(agent.id)
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
              {dealFilters.agent.length > 0 && (
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
            <PopoverContent className="w-[300px] p-0" align="start">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2 p-3">
                  {/* Status Filter */}
                  <FilterCategory title="Estado" category="status" icon={Tag}>
                    <div className="grid grid-cols-1 gap-x-2">
                      {STATUS_OPTIONS.map((status) => (
                        <FilterOption
                          key={status.value}
                          value={status.value}
                          label={status.label}
                          isSelected={dealFilters.status.includes(status.value)}
                          onClick={() => toggleFilter("status", status.value)}
                        />
                      ))}
                    </div>
                  </FilterCategory>
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
    </div>
  );
}
