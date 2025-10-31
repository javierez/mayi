"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Filter,
  Check,
  ChevronDown,
  FilterX,
  AlertCircle,
  CheckSquare,
  User,
  Tag,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface TaskFilterProps {
  users?: Array<{ id: string; name: string }>;
  inline?: boolean; // If true, renders only the filter button without wrapper
  iconOnly?: boolean; // If true, shows only icon without text
}

export interface TaskFilters {
  urgency: number[];
  status: string[];
  assignedTo: string[];
  category: string[];
}

// Task urgency levels (1-5)
const URGENCY_OPTIONS = [
  { value: 1, label: "Baja (1)" },
  { value: 2, label: "Media-Baja (2)" },
  { value: 3, label: "Media (3)" },
  { value: 4, label: "Media-Alta (4)" },
  { value: 5, label: "Crítica (5)" },
];

// Task status options from schema
const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "blocked", label: "Bloqueado" },
  { value: "ready", label: "Listo" },
  { value: "in_progress", label: "En Progreso" },
  { value: "validation", label: "Validación" },
  { value: "finished", label: "Finalizado" },
];

// Common task categories (can be expanded based on your needs)
const CATEGORY_OPTIONS = [
  { value: "follow_up", label: "Seguimiento" },
  { value: "viewing", label: "Visita" },
  { value: "documentation", label: "Documentación" },
  { value: "valuation", label: "Valoración" },
  { value: "negotiation", label: "Negociación" },
  { value: "marketing", label: "Marketing" },
  { value: "administrative", label: "Administrativo" },
  { value: "other", label: "Otro" },
];

export function TaskFilter({
  users = [],
  inline = false,
  iconOnly = false,
}: TaskFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    urgency: false,
    status: false,
    assignedTo: false,
    category: false,
  });

  const [filters, setFilters] = useState<TaskFilters>({
    urgency: [],
    status: [],
    assignedTo: [],
    category: [],
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const urgency = searchParams.get("urgency");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");
    const category = searchParams.get("category");

    const newFilters: TaskFilters = {
      urgency: urgency ? urgency.split(",").map(Number) : [],
      status: status ? status.split(",") : [],
      assignedTo: assignedTo ? assignedTo.split(",") : [],
      category: category ? category.split(",") : [],
    };

    setFilters(newFilters);
    // Don't call onFilterChange here to avoid infinite loops
    // The parent component will read from URL params directly
  }, [searchParams]);

  const updateUrlParams = (newFilters: TaskFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update urgency
    if (newFilters.urgency.length > 0) {
      params.set("urgency", newFilters.urgency.join(","));
    } else {
      params.delete("urgency");
    }

    // Update status
    if (newFilters.status.length > 0) {
      params.set("status", newFilters.status.join(","));
    } else {
      params.delete("status");
    }

    // Update assignedTo
    if (newFilters.assignedTo.length > 0) {
      params.set("assignedTo", newFilters.assignedTo.join(","));
    } else {
      params.delete("assignedTo");
    }

    // Update category
    if (newFilters.category.length > 0) {
      params.set("category", newFilters.category.join(","));
    } else {
      params.delete("category");
    }

    router.push(`?${params.toString()}`);
  };

  const toggleFilter = (
    filterType: keyof TaskFilters,
    value: string | number,
  ) => {
    const currentValues = filters[filterType];
    const newFilters = {
      ...filters,
      [filterType]: currentValues.includes(value as never)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value],
    };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearFilters = () => {
    const newFilters: TaskFilters = {
      urgency: [],
      status: [],
      assignedTo: [],
      category: [],
    };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const activeFiltersCount =
    filters.urgency.length +
    filters.status.length +
    filters.assignedTo.length +
    filters.category.length;

  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string | number;
    label: string;
    filterType: keyof TaskFilters;
  }) => {
    const isSelected = filters[filterType].includes(value as never);

    return (
      <div
        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
        onClick={() => toggleFilter(filterType, value)}
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
  };

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

  const filterButton = iconOnly ? (
    <button
      className="relative rounded-md p-1.5 transition-colors hover:bg-gray-100"
      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
      title="Filtrar tareas"
    >
      <Filter className="h-4 w-4 text-gray-600" />
      {activeFiltersCount > 0 && (
        <Badge
          variant="secondary"
          className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px] font-normal"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </button>
  ) : (
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
          className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
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
  );

  if (inline) {
    return (
      <>
        {filterButton}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="absolute right-0 top-full z-50 mt-2 w-auto max-w-2xl">
            <div className="rounded-lg bg-card p-2 shadow-md">
              <div className="space-y-2">
                {/* Row: All filters */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {/* Urgency Filter */}
                  <FilterCategory
                    title="Urgencia"
                    category="urgency"
                    icon={AlertCircle}
                  >
                    <div className="grid grid-cols-1 gap-x-2">
                      {URGENCY_OPTIONS.map((option) => (
                        <FilterOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          filterType="urgency"
                        />
                      ))}
                    </div>
                  </FilterCategory>

                  {/* Status Filter */}
                  <FilterCategory
                    title="Estado"
                    category="status"
                    icon={CheckSquare}
                  >
                    <div className="grid grid-cols-1 gap-x-2">
                      {STATUS_OPTIONS.map((option) => (
                        <FilterOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          filterType="status"
                        />
                      ))}
                    </div>
                  </FilterCategory>

                  {/* Assigned To Filter */}
                  <FilterCategory
                    title="Asignado a"
                    category="assignedTo"
                    icon={User}
                  >
                    <div className="grid grid-cols-1 gap-x-2">
                      {users.map((user) => (
                        <FilterOption
                          key={user.id}
                          value={user.id}
                          label={user.name}
                          filterType="assignedTo"
                        />
                      ))}
                    </div>
                  </FilterCategory>

                  {/* Category Filter */}
                  <FilterCategory
                    title="Categoría"
                    category="category"
                    icon={Tag}
                  >
                    <div className="grid grid-cols-1 gap-x-2">
                      {CATEGORY_OPTIONS.map((option) => (
                        <FilterOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          filterType="category"
                        />
                      ))}
                    </div>
                  </FilterCategory>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-2 flex items-center justify-end px-2">
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
            </div>
          </CollapsibleContent>
        </Collapsible>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">{filterButton}</div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              {/* Row: All filters */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {/* Urgency Filter */}
                <FilterCategory
                  title="Urgencia"
                  category="urgency"
                  icon={AlertCircle}
                >
                  <div className="grid grid-cols-1 gap-x-2">
                    {URGENCY_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        filterType="urgency"
                      />
                    ))}
                  </div>
                </FilterCategory>

                {/* Status Filter */}
                <FilterCategory
                  title="Estado"
                  category="status"
                  icon={CheckSquare}
                >
                  <div className="grid grid-cols-1 gap-x-2">
                    {STATUS_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        filterType="status"
                      />
                    ))}
                  </div>
                </FilterCategory>

                {/* Assigned To Filter */}
                <FilterCategory
                  title="Asignado a"
                  category="assignedTo"
                  icon={User}
                >
                  <div className="grid grid-cols-1 gap-x-2">
                    {users.map((user) => (
                      <FilterOption
                        key={user.id}
                        value={user.id}
                        label={user.name}
                        filterType="assignedTo"
                      />
                    ))}
                  </div>
                </FilterCategory>

                {/* Category Filter */}
                <FilterCategory
                  title="Categoría"
                  category="category"
                  icon={Tag}
                >
                  <div className="grid grid-cols-1 gap-x-2">
                    {CATEGORY_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        filterType="category"
                      />
                    ))}
                  </div>
                </FilterCategory>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
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
