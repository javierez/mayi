"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Filter,
  Check,
  ChevronDown,
  User,
  UserPlus,
  AlertCircle,
  FilterX,
  X,
  Plus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalTaskModal } from "~/components/tasks/global-task-modal";

interface TaskFilterProps {
  users?: Array<{ id: string; name: string }>;
  categories?: string[];
  searchBar?: React.ReactNode;
  onTaskCreated?: () => void;
}

export function TaskFilter({
  users = [],
  searchBar,
  onTaskCreated,
}: TaskFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    createdBy: [] as string[],
    urgency: [] as string[],
    assignedTo: [] as string[],
  });
  const [assignedToFilters, setAssignedToFilters] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    createdBy: false,
    urgency: false,
  });
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    const createdBy = searchParams.get("createdBy");
    const urgency = searchParams.get("urgency");
    const assignedTo = searchParams.get("assignedTo");

    setTaskFilters({
      createdBy: createdBy ? createdBy.split(",") : [],
      urgency: urgency ? urgency.split(",") : [],
      assignedTo: assignedTo ? assignedTo.split(",") : [],
    });
    setAssignedToFilters(assignedTo ? assignedTo.split(",") : []);
  }, [searchParams]);

  const updateUrlParams = (newTaskFilters: typeof taskFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update createdBy
    if (newTaskFilters.createdBy.length > 0) {
      params.set("createdBy", newTaskFilters.createdBy.join(","));
    } else {
      params.delete("createdBy");
    }

    // Update urgency
    if (newTaskFilters.urgency.length > 0) {
      params.set("urgency", newTaskFilters.urgency.join(","));
    } else {
      params.delete("urgency");
    }

    // Update assignedTo
    if (newTaskFilters.assignedTo.length > 0) {
      params.set("assignedTo", newTaskFilters.assignedTo.join(","));
    } else {
      params.delete("assignedTo");
    }

    router.push(`/tareas?${params.toString()}`);
  };

  const toggleFilter = (
    filterType: "createdBy" | "urgency",
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

  const toggleAssignedToFilter = (userId: string) => {
    const newAssignedToFilters = assignedToFilters.includes(userId)
      ? assignedToFilters.filter((id) => id !== userId)
      : [...assignedToFilters, userId];
    
    setAssignedToFilters(newAssignedToFilters);
    const newFilters = {
      ...taskFilters,
      assignedTo: newAssignedToFilters,
    };
    setTaskFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const clearAssignedToFilters = () => {
    const newFilters = {
      ...taskFilters,
      assignedTo: [],
    };
    setAssignedToFilters([]);
    setTaskFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      createdBy: [],
      urgency: [],
      assignedTo: [],
    };
    setAssignedToFilters([]);
    setTaskFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const activeFiltersCount =
    taskFilters.createdBy.length +
    taskFilters.urgency.length +
    taskFilters.assignedTo.length;

  const AssignedToFilterOption = ({
    value,
    label,
  }: {
    value: string;
    label: string;
  }) => {
    const isSelected = assignedToFilters.includes(value);

    return (
      <div
        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
        onClick={() => toggleAssignedToFilter(value)}
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

  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string;
    label: string;
    filterType: "createdBy" | "urgency";
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
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {searchBar}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Create Task Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowCreateTaskModal(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>

          {/* Assigned To Button */}
          {users.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative h-7 w-7 p-0"
                >
                  <User className="h-3 w-3" />
                  {assignedToFilters.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                    >
                      {assignedToFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="flex flex-col">
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3 p-3">
                      <div className="space-y-0.5">
                        {users.map((user) => (
                          <AssignedToFilterOption
                            key={user.id}
                            value={user.id}
                            label={user.name}
                          />
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                  {assignedToFilters.length > 0 && (
                    <div className="border-t p-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAssignedToFilters}
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
          )}
          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="relative h-7 text-xs px-2"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="mr-1.5 h-3 w-3" />
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
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Creado Por Filter */}
                {users.length > 0 && (
                  <FilterCategory
                    title="Creado Por"
                    category="createdBy"
                    icon={UserPlus}
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

      {/* Global Task Modal */}
      <GlobalTaskModal
        open={showCreateTaskModal}
        onOpenChange={setShowCreateTaskModal}
        onSuccess={() => {
          setShowCreateTaskModal(false);
          if (onTaskCreated) {
            onTaskCreated();
          }
        }}
      />
    </div>
  );
}
