"use client";

import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Filter,
  Check,
  ChevronDown,
  FilterX,
  Tag,
  User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface AppointmentFilterProps {
  users?: Array<{ id: string; name: string }>;
  inline?: boolean; // If true, renders only the filter button without wrapper
  iconOnly?: boolean; // If true, shows only icon without text
}

export interface AppointmentFilters {
  type: string[];
  assignedTo: string[];
}

// Appointment type options (match the actual values stored in the database)
const TYPE_OPTIONS = [
  { value: "Visita", label: "Visita" },
  { value: "Reunión", label: "Reunión" },
  { value: "Firma", label: "Firma" },
  { value: "Cierre", label: "Cierre" },
  { value: "Viaje", label: "Viaje" },
];

export function AppointmentFilter({
  users = [],
  inline = false,
}: AppointmentFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    type: false,
    assignedTo: false,
  });

  const [filters, setFilters] = useState<AppointmentFilters>({
    type: [],
    assignedTo: [],
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const type = searchParams.get("appointmentType");
    const assignedTo = searchParams.get("appointmentAssignedTo");

    const newFilters: AppointmentFilters = {
      type: type ? type.split(",") : [],
      assignedTo: assignedTo ? assignedTo.split(",") : [],
    };

    setFilters(newFilters);
  }, [searchParams]);

  const updateUrlParams = (newFilters: AppointmentFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update type
    if (newFilters.type.length > 0) {
      params.set("appointmentType", newFilters.type.join(","));
    } else {
      params.delete("appointmentType");
    }

    // Update assignedTo
    if (newFilters.assignedTo.length > 0) {
      params.set("appointmentAssignedTo", newFilters.assignedTo.join(","));
    } else {
      params.delete("appointmentAssignedTo");
    }

    router.push(`?${params.toString()}`);
  };

  const toggleFilter = (
    filterType: keyof AppointmentFilters,
    value: string,
  ) => {
    const currentValues = filters[filterType];
    const newFilters = {
      ...filters,
      [filterType]: currentValues.includes(value)
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
    const newFilters: AppointmentFilters = {
      type: [],
      assignedTo: [],
    };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const activeFiltersCount = filters.type.length + filters.assignedTo.length;

  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string;
    label: string;
    filterType: keyof AppointmentFilters;
  }) => {
    const isSelected = filters[filterType].includes(value);

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

  const filterButton = (
    <button
      className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
      title="Filtrar eventos"
      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
    >
      <Filter className="h-4 w-4 text-gray-600" />
    </button>
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
                  {/* Type Filter */}
                  <FilterCategory title="Tipo" category="type" icon={Tag}>
                    <div className="grid grid-cols-1 gap-x-2">
                      {TYPE_OPTIONS.map((option) => (
                        <FilterOption
                          key={option.value}
                          value={option.value}
                          label={option.label}
                          filterType="type"
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
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <div className="mt-2 flex items-center justify-end px-2">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] transition-colors hover:bg-accent"
                  >
                    <FilterX className="h-3 w-3" />
                    Borrar filtros
                  </button>
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {/* Type Filter */}
                <FilterCategory title="Tipo" category="type" icon={Tag}>
                  <div className="grid grid-cols-1 gap-x-2">
                    {TYPE_OPTIONS.map((option) => (
                      <FilterOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        filterType="type"
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
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-end px-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] transition-colors hover:bg-accent"
              >
                <FilterX className="h-3 w-3" />
                Borrar filtros
              </button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

