"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
} from "~/components/ui/collapsible";
import { Badge } from "~/components/ui/badge";
import {
  Search,
  Filter,
  Check,
  ChevronDown,
  Clock,
  Tag as TagIcon,
  Star,
  ToggleLeft,
  FilterX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { CONTACT_SOURCES, CONTACT_SOURCE_LABELS } from "~/types/contact-source";

interface ContactFilterProps {
  onFilterChange: (filters: {
    searchQuery: string;
    roles: string[];
    lastContactFilter: string;
    sources: string[];
    ratings: number[];
    statuses: boolean[];
  }) => void;
}

export function ContactFilter({ onFilterChange }: ContactFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>("owner");
  const [lastContactFilter, setLastContactFilter] = useState("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<boolean[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    lastContact: false,
    sources: false,
    rating: false,
    status: false,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const roles = searchParams.get("roles");
    const q = searchParams.get("q");
    const lastContact = searchParams.get("lastContact");
    const sources = searchParams.get("sources");
    const ratings = searchParams.get("ratings");
    const statuses = searchParams.get("statuses");

    // Handle URL initialization - if roles contains 'buyer' or 'interested', set to 'buyer'
    if (roles) {
      const roleArray = roles.split(",");
      if (roleArray.includes("buyer") || roleArray.includes("interested")) {
        setSelectedRole("buyer");
      } else if (roleArray.includes("owner")) {
        setSelectedRole("owner");
      } else {
        setSelectedRole(roleArray[0] ?? "owner");
      }
    } else {
      setSelectedRole("owner");
    }
    setSearchQuery(q ?? "");
    setLastContactFilter(lastContact ?? "all");
    setSelectedSources(sources ? sources.split(",") : []);
    setSelectedRatings(ratings ? ratings.split(",").map(Number) : []);
    setSelectedStatuses(statuses ? statuses.split(",").map(s => s === "true") : []);

    // Clean up any view parameter from URL since we only have table view
    if (searchParams.get("view")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("view");
      router.replace(`/contactos?${params.toString()}`);
    }
  }, [searchParams, router]);

  const updateUrlParams = (
    newSelectedRole: string | null,
    newSearchQuery: string,
    newLastContactFilter: string,
    newSelectedSources: string[],
    newSelectedRatings: number[],
    newSelectedStatuses: boolean[],
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove any view parameter since we only have table view now
    params.delete("view");

    // Update search query
    if (newSearchQuery) {
      params.set("q", newSearchQuery);
    } else {
      params.delete("q");
    }

    // Update roles
    if (newSelectedRole) {
      // When 'buyer' is selected, include both 'buyer' and 'interested' in URL
      const rolesForUrl =
        newSelectedRole === "buyer" ? "buyer,interested" : newSelectedRole;
      params.set("roles", rolesForUrl);
    } else {
      // Default to 'owner' when no role is selected
      params.set("roles", "owner");
    }

    // Update last contact filter
    if (newLastContactFilter !== "all") {
      params.set("lastContact", newLastContactFilter);
    } else {
      params.delete("lastContact");
    }

    // Update sources filter
    if (newSelectedSources.length > 0) {
      params.set("sources", newSelectedSources.join(","));
    } else {
      params.delete("sources");
    }

    // Update ratings filter
    if (newSelectedRatings.length > 0) {
      params.set("ratings", newSelectedRatings.join(","));
    } else {
      params.delete("ratings");
    }

    // Update statuses filter
    if (newSelectedStatuses.length > 0) {
      params.set("statuses", newSelectedStatuses.join(","));
    } else {
      params.delete("statuses");
    }

    // Reset to first page when filters change
    params.set("page", "1");

    router.push(`/contactos?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlParams(selectedRole, value, lastContactFilter, selectedSources, selectedRatings, selectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery: value,
      roles: rolesToFilter,
      lastContactFilter,
      sources: selectedSources,
      ratings: selectedRatings,
      statuses: selectedStatuses,
    });
  };

  const toggleRoleFilter = (value: string) => {
    // Only allow 'buyer' and 'owner' values
    if (value !== "buyer" && value !== "owner") return;

    const newSelectedRole = selectedRole === value ? null : value;
    setSelectedRole(newSelectedRole);
    updateUrlParams(newSelectedRole, searchQuery, lastContactFilter, selectedSources, selectedRatings, selectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      newSelectedRole === "buyer"
        ? ["buyer", "interested"]
        : newSelectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter,
      sources: selectedSources,
      ratings: selectedRatings,
      statuses: selectedStatuses,
    });
  };

  const handleLastContactFilterChange = (value: string) => {
    setLastContactFilter(value);
    updateUrlParams(selectedRole, searchQuery, value, selectedSources, selectedRatings, selectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter: value,
      sources: selectedSources,
      ratings: selectedRatings,
      statuses: selectedStatuses,
    });
  };

  const toggleSourceFilter = (source: string) => {
    const newSelectedSources = selectedSources.includes(source)
      ? selectedSources.filter((s) => s !== source)
      : [...selectedSources, source];

    setSelectedSources(newSelectedSources);
    updateUrlParams(selectedRole, searchQuery, lastContactFilter, newSelectedSources, selectedRatings, selectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter,
      sources: newSelectedSources,
      ratings: selectedRatings,
      statuses: selectedStatuses,
    });
  };

  const toggleRatingFilter = (rating: number) => {
    const newSelectedRatings = selectedRatings.includes(rating)
      ? selectedRatings.filter((r) => r !== rating)
      : [...selectedRatings, rating];

    setSelectedRatings(newSelectedRatings);
    updateUrlParams(selectedRole, searchQuery, lastContactFilter, selectedSources, newSelectedRatings, selectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter,
      sources: selectedSources,
      ratings: newSelectedRatings,
      statuses: selectedStatuses,
    });
  };

  const toggleStatusFilter = (status: boolean) => {
    const newSelectedStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newSelectedStatuses);
    updateUrlParams(selectedRole, searchQuery, lastContactFilter, selectedSources, selectedRatings, newSelectedStatuses);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter,
      sources: selectedSources,
      ratings: selectedRatings,
      statuses: newSelectedStatuses,
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearAllFilters = () => {
    setLastContactFilter("all");
    setSelectedSources([]);
    setSelectedRatings([]);
    setSelectedStatuses([]);
    updateUrlParams(selectedRole, searchQuery, "all", [], [], []);

    // When 'buyer' is selected, include both 'buyer' and 'interested'
    const rolesToFilter =
      selectedRole === "buyer"
        ? ["buyer", "interested"]
        : selectedRole === "owner"
          ? ["owner"]
          : ["owner"]; // Default to owner

    onFilterChange({
      searchQuery,
      roles: rolesToFilter,
      lastContactFilter: "all",
      sources: [],
      ratings: [],
      statuses: [],
    });
  };

  const activeFiltersCount =
    (lastContactFilter !== "all" ? 1 : 0) +
    (selectedSources.length > 0 ? 1 : 0) +
    (selectedRatings.length > 0 ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0);

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
      className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 hover:bg-accent transition-colors"
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
        className="flex cursor-pointer items-center gap-1 group"
        onClick={() => toggleCategory(category)}
      >
        <Icon className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        <h5 className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full md:flex-1 md:max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, teléfono o DNI..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Role Filter Toggle */}
          <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1 md:max-w-xs md:flex-1">
            {selectedRole && (
              <motion.div
                className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                animate={{
                  width: "calc(50% - 4px)",
                  x: (() => {
                    const buttonOrder = ["owner", "buyer"];
                    const selectedIndex = buttonOrder.indexOf(selectedRole);
                    return `${selectedIndex * 100}%`;
                  })(),
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <div className="relative flex h-full">
              <button
                onClick={() => toggleRoleFilter("owner")}
                className={cn(
                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                  selectedRole === "owner" ? "text-gray-900" : "text-gray-600",
                )}
              >
                Propietario
              </button>
              <button
                onClick={() => toggleRoleFilter("buyer")}
                className={cn(
                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                  selectedRole === "buyer" ? "text-gray-900" : "text-gray-600",
                )}
              >
                Demandante
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg shadow-md bg-card p-2">
            <div className="space-y-2">
              {/* Filter Categories Row */}
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FilterCategory title="Último contacto" category="lastContact" icon={Clock}>
                  <div className="grid grid-cols-1 gap-y-0.5 pt-1">
                    <FilterOption
                      value="today"
                      label="Hoy"
                      isSelected={lastContactFilter === "today"}
                      onClick={() => handleLastContactFilterChange("today")}
                    />
                    <FilterOption
                      value="week"
                      label="Última semana"
                      isSelected={lastContactFilter === "week"}
                      onClick={() => handleLastContactFilterChange("week")}
                    />
                    <FilterOption
                      value="month"
                      label="Último mes"
                      isSelected={lastContactFilter === "month"}
                      onClick={() => handleLastContactFilterChange("month")}
                    />
                    <FilterOption
                      value="quarter"
                      label="Últimos 3 meses"
                      isSelected={lastContactFilter === "quarter"}
                      onClick={() => handleLastContactFilterChange("quarter")}
                    />
                    <FilterOption
                      value="year"
                      label="Último año"
                      isSelected={lastContactFilter === "year"}
                      onClick={() => handleLastContactFilterChange("year")}
                    />
                  </div>
                </FilterCategory>

                <FilterCategory title="Origen" category="sources" icon={TagIcon}>
                  <div className="pt-1">
                    <div className="max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                      <div className="grid grid-cols-1 gap-y-0.5">
                        {CONTACT_SOURCES.map((source) => (
                          <FilterOption
                            key={source}
                            value={source}
                            label={CONTACT_SOURCE_LABELS[source]}
                            isSelected={selectedSources.includes(source)}
                            onClick={() => toggleSourceFilter(source)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </FilterCategory>

                <FilterCategory title="Valoración" category="rating" icon={Star}>
                  <div className="grid grid-cols-1 gap-y-0.5 pt-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div
                        key={rating}
                        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 hover:bg-accent transition-colors"
                        onClick={() => toggleRatingFilter(rating)}
                      >
                        <div
                          className={`flex h-3 w-3 items-center justify-center rounded border ${
                            selectedRatings.includes(rating) ? "border-primary bg-primary" : "border-input"
                          }`}
                        >
                          {selectedRatings.includes(rating) && <Check className="h-2 w-2 text-primary-foreground" />}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </FilterCategory>

                <FilterCategory title="Estado" category="status" icon={ToggleLeft}>
                  <div className="grid grid-cols-1 gap-y-0.5 pt-1">
                    <FilterOption
                      value="active"
                      label="Activo"
                      isSelected={selectedStatuses.includes(true)}
                      onClick={() => toggleStatusFilter(true)}
                    />
                    <FilterOption
                      value="inactive"
                      label="Inactivo"
                      isSelected={selectedStatuses.includes(false)}
                      onClick={() => toggleStatusFilter(false)}
                    />
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
                onClick={clearAllFilters}
                className="h-auto py-1 px-2 text-[12px]"
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
