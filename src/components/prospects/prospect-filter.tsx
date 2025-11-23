"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Filter,
  Check,
  ChevronDown,
  Search,
  Tag,
  TrendingUp,
  Home,
  FilterX,
  RefreshCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProspectFilterProps {
  onRefreshComplete?: () => void;
}

export function ProspectFilter({ onRefreshComplete }: ProspectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [prospectFilters, setProspectFilters] = useState({
    listingType: [] as string[],
    status: [] as string[],
    urgencyLevel: [] as string[],
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    listingType: false,
    status: false,
    urgencyLevel: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    const listingType = searchParams.get("listingType");
    const status = searchParams.get("status");
    const urgencyLevel = searchParams.get("urgencyLevel");
    const q = searchParams.get("q");

    setProspectFilters({
      listingType:
        listingType && listingType !== "all" ? listingType.split(",") : [],
      status: status ? status.split(",") : [],
      urgencyLevel: urgencyLevel ? urgencyLevel.split(",") : [],
    });
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const updateUrlParams = (
    newFilters: typeof prospectFilters,
    newSearchQuery: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update search query
    if (newSearchQuery) {
      params.set("q", newSearchQuery);
    } else {
      params.delete("q");
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

    router.push(`/operaciones/prospects?${params.toString()}`);
  };

  const toggleFilter = (
    category: keyof typeof prospectFilters,
    value: string,
  ) => {
    const newFilters = {
      ...prospectFilters,
      [category]: prospectFilters[category].includes(value)
        ? prospectFilters[category].filter((v) => v !== value)
        : [...prospectFilters[category], value],
    };
    setProspectFilters(newFilters);
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
      listingType: [],
      status: [],
      urgencyLevel: [],
    };
    setProspectFilters(newFilters);
    setSearchQuery("");
    updateUrlParams(newFilters, "");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams(prospectFilters, searchQuery);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      console.log("🔄 Triggering match recalculation from ProspectFilter...");

      // Call API to recalculate and store matches
      const response = await fetch("/api/matches/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearStale: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to recalculate matches");
      }

      const result = (await response.json()) as { success: boolean; message?: string };
      console.log("✅ Match recalculation completed:", result);

      // Notify parent to refresh data
      onRefreshComplete?.();
    } catch (error) {
      console.error("❌ Error during match recalculation:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeFiltersCount = Object.values(prospectFilters).reduce(
    (acc, curr) => acc + curr.length,
    0,
  );

  const FilterOption = ({
    value,
    label,
    category,
  }: {
    value: string;
    label: string;
    category: keyof typeof prospectFilters;
  }) => {
    const isSelected = prospectFilters[category].includes(value);

    return (
      <div
        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
        onClick={() => toggleFilter(category, value)}
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative w-128">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar prospectos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-8 w-full rounded-md border-0 bg-background pl-8 text-sm shadow-md placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </form>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Actualizar"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
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
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              {/* Row 1: Filters */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FilterCategory
                  title="Tipo de Operación"
                  category="listingType"
                  icon={Home}
                >
                  <div className="grid grid-cols-2 gap-x-2">
                    <FilterOption
                      value="Sale"
                      label="Venta"
                      category="listingType"
                    />
                    <FilterOption
                      value="Rent"
                      label="Alquiler"
                      category="listingType"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory title="Estado" category="status" icon={Tag}>
                  <div className="grid grid-cols-2 gap-x-2">
                    <FilterOption
                      value="En búsqueda"
                      label="En búsqueda"
                      category="status"
                    />
                    <FilterOption
                      value="Archivado"
                      label="Archivado"
                      category="status"
                    />
                    <FilterOption
                      value="Finalizado"
                      label="Finalizado"
                      category="status"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Nivel de Urgencia"
                  category="urgencyLevel"
                  icon={TrendingUp}
                >
                  <div className="grid grid-cols-2 gap-x-2">
                    <FilterOption
                      value="1"
                      label="1 - Baja"
                      category="urgencyLevel"
                    />
                    <FilterOption
                      value="2"
                      label="2 - Media"
                      category="urgencyLevel"
                    />
                    <FilterOption
                      value="3"
                      label="3 - Media-Alta"
                      category="urgencyLevel"
                    />
                    <FilterOption
                      value="4"
                      label="4 - Alta"
                      category="urgencyLevel"
                    />
                    <FilterOption
                      value="5"
                      label="5 - Urgente"
                      category="urgencyLevel"
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
