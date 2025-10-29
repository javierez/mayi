"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Filter,
  Check,
  ChevronDown,
  User,
  Tag,
  AlertCircle,
  FilterX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface TaskFilterProps {
  users?: Array<{ id: string; name: string }>;
  categories?: string[];
}

export function TaskFilter({
  users = [],
  categories = [],
}: TaskFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    createdBy: [] as string[],
    category: [] as string[],
    urgency: [] as string[],
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    createdBy: false,
    category: false,
    urgency: false,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const createdBy = searchParams.get("createdBy");
    const category = searchParams.get("category");
    const urgency = searchParams.get("urgency");

    setTaskFilters({
      createdBy: createdBy ? createdBy.split(",") : [],
      category: category ? category.split(",") : [],
      urgency: urgency ? urgency.split(",") : [],
    });
  }, [searchParams]);

  const updateUrlParams = (newTaskFilters: typeof taskFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update createdBy
    if (newTaskFilters.createdBy.length > 0) {
      params.set("createdBy", newTaskFilters.createdBy.join(","));
    } else {
      params.delete("createdBy");
    }

    // Update category
    if (newTaskFilters.category.length > 0) {
      params.set("category", newTaskFilters.category.join(","));
    } else {
      params.delete("category");
    }

    // Update urgency
    if (newTaskFilters.urgency.length > 0) {
      params.set("urgency", newTaskFilters.urgency.join(","));
    } else {
      params.delete("urgency");
    }

    // Get current agentId from path
    const pathParts = window.location.pathname.split("/");
    const agentId = pathParts[pathParts.length - 1];

    router.push(`/agents/tareas/${agentId}?${params.toString()}`);
  };

  const toggleFilter = (
    filterType: "createdBy" | "category" | "urgency",
    value: string,
  ) => {
    const currentValues = taskFilters[filterType];
    const newFilters = {
      ...taskFilters,
      [filterType]: currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value],
    };
    setTaskFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearFilters = () => {
    const newFilters = {
      createdBy: [],
      category: [],
      urgency: [],
    };
    setTaskFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const activeFiltersCount =
    taskFilters.createdBy.length +
    taskFilters.category.length +
    taskFilters.urgency.length;

  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string;
    label: string;
    filterType: "createdBy" | "category" | "urgency";
  }) => {
    const isSelected = taskFilters[filterType].includes(value);

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

  const urgencyOptions = [
    { value: "1", label: "1 - Muy Baja" },
    { value: "2", label: "2 - Baja" },
    { value: "3", label: "3 - Media" },
    { value: "4", label: "4 - Alta" },
    { value: "5", label: "5 - Crítica" },
  ];

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
          <span>Filtros</span>
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
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {/* Creado Por Filter */}
                {users.length > 0 && (
                  <FilterCategory
                    title="Creado Por"
                    category="createdBy"
                    icon={User}
                  >
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-0.5">
                        {users.map((user) => (
                          <FilterOption
                            key={user.id}
                            value={user.id}
                            label={user.name}
                            filterType="createdBy"
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </FilterCategory>
                )}

                {/* Category Filter */}
                {categories.length > 0 && (
                  <FilterCategory
                    title="Categoría"
                    category="category"
                    icon={Tag}
                  >
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-0.5">
                        {categories.map((cat) => (
                          <FilterOption
                            key={cat}
                            value={cat}
                            label={cat}
                            filterType="category"
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </FilterCategory>
                )}

                {/* Urgency Filter */}
                <FilterCategory
                  title="Urgencia"
                  category="urgency"
                  icon={AlertCircle}
                >
                  <div className="space-y-0.5">
                    {urgencyOptions.map((option) => (
                      <FilterOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        filterType="urgency"
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
