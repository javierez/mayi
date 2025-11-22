import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Plus,
  Check,
  Filter,
  ChevronDown,
  User,
  UserPlus,
  AlertCircle,
  FilterX,
} from "lucide-react";
import { TaskCard } from "~/components/tasks/task-card";
import { TaskViewModal } from "~/components/tasks/task-view-modal";
import { GlobalTaskModal } from "~/components/tasks/global-task-modal";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";
import { useSession } from "~/lib/auth-client";
import {
  canEditAllTasks,
  canDeleteAllTasks,
} from "~/app/actions/permissions/check-permissions";

interface Task {
  taskId?: bigint;
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  dueDate?: Date;
  completed: boolean;
  listingId?: bigint;
  leadId?: bigint;
  dealId?: bigint;
  appointmentId?: bigint;
  prospectId?: bigint;
  contactId?: bigint;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  urgency?: number;
  // User info for "Asignado a"
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  // Property information for badge display
  propertyTitle?: string;
  // Related entity info for display
  relatedContact?: {
    contactId: bigint;
    name: string;
    email?: string;
  };
  relatedAppointment?: {
    appointmentId: bigint;
    datetimeStart: Date;
    type?: string;
  };
  relatedProperty?: {
    street: string | null;
    city: string | null;
    province: string | null;
  };
  relatedDeal?: {
    dealId: bigint;
    status: string | null;
    role: string | null;
  };
}

interface ContactTareasProps {
  contactId: bigint;
  tasks?: Task[];
  loading?: boolean;
  onToggleCompleted: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: (task: Task) => Promise<Task>;
  onUpdateTaskAfterSave: (optimisticId: string, savedTask: Task) => void;
  onRemoveOptimisticTask: (optimisticId: string) => void;
  onTaskCreated?: () => void; // Callback to refresh tasks after modal creation
}

export function ContactTareas({
  contactId,
  tasks = [],
  loading: externalLoading,
  onToggleCompleted,
  onDeleteTask,
  onAddTask: _onAddTask,
  onUpdateTaskAfterSave: _onUpdateTaskAfterSave,
  onRemoveOptimisticTask: _onRemoveOptimisticTask,
  onTaskCreated,
}: ContactTareasProps) {
  const { data: session } = useSession();
  const [selectedTaskForView, setSelectedTaskForView] = useState<{
    taskId: string;
    task: Task;
  } | null>(null);
  const [showGlobalTaskModal, setShowGlobalTaskModal] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    assignedTo: [] as string[],
    createdBy: [] as string[],
    urgency: [] as string[],
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    assignedTo: false,
    createdBy: false,
    urgency: false,
  });
  const [agents, setAgents] = useState<
    { id: string; name: string; firstName?: string; lastName?: string }[]
  >([]);

  // Permission states
  const [hasEditAllPermission, setHasEditAllPermission] =
    useState<boolean>(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] =
    useState<boolean>(false);

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const [editAllPerm, deleteAllPerm] = await Promise.all([
          canEditAllTasks(),
          canDeleteAllTasks(),
        ]);
        setHasEditAllPermission(editAllPerm);
        setHasDeleteAllPermission(deleteAllPerm);
      } catch (error) {
        console.error("Error fetching task permissions:", error);
        setHasEditAllPermission(false);
        setHasDeleteAllPermission(false);
      }
    };

    void fetchPermissions();
  }, []); // Run once on mount

  // Fetch agents for filter options when filters panel is opened
  useEffect(() => {
    if (!isFiltersOpen) return;

    const fetchAgents = async () => {
      try {
        const agentsData = await getAgentsForSelectionWithAuth();
        const formattedAgents = agentsData.map((agent) => ({
          id: agent.id,
          name: agent.name,
          firstName: agent.firstName,
          lastName: agent.lastName ?? undefined,
        }));
        setAgents(formattedAgents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    void fetchAgents();
  }, [isFiltersOpen]);

  // Permission helper functions
  const canUserEditTask = (task: Task): boolean => {
    // User can edit if they created the task OR have editAll permission
    return task.createdBy === session?.user?.id || hasEditAllPermission;
  };

  const canUserDeleteTask = (task: Task): boolean => {
    // User can delete if they created the task OR have deleteAll permission
    return task.createdBy === session?.user?.id || hasDeleteAllPermission;
  };

  const handleToggleCompleted = async (id: string) => {
    await onToggleCompleted(id);
  };

  const handleDeleteTask = async (id: string) => {
    await onDeleteTask(id);
  };

  // Filter helper functions
  const toggleFilter = (
    filterType: "assignedTo" | "createdBy" | "urgency",
    value: string,
  ) => {
    const currentValues = taskFilters[filterType];
    setTaskFilters({
      ...taskFilters,
      [filterType]: currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value],
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearFilters = () => {
    setTaskFilters({
      assignedTo: [],
      createdBy: [],
      urgency: [],
    });
  };

  const activeFiltersCount =
    taskFilters.assignedTo.length +
    taskFilters.createdBy.length +
    taskFilters.urgency.length;

  // Filter Option component
  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string;
    label: string;
    filterType: "assignedTo" | "createdBy" | "urgency";
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

  // Filter Category component
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

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by assigned to
    if (taskFilters.assignedTo.length > 0) {
      filtered = filtered.filter((task) =>
        taskFilters.assignedTo.includes(task.userId),
      );
    }

    // Filter by created by
    if (taskFilters.createdBy.length > 0) {
      filtered = filtered.filter(
        (task) => task.createdBy && taskFilters.createdBy.includes(task.createdBy),
      );
    }

    // Filter by urgency
    if (taskFilters.urgency.length > 0) {
      filtered = filtered.filter(
        (task) =>
          task.urgency && taskFilters.urgency.includes(task.urgency.toString()),
      );
    }

    // Sort tasks using comprehensive sorting hierarchy
    return filtered.sort((a, b) => {
      // First: Completed tasks go to the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Second: Priority order based on criticality and due date presence
      // 1. Critical tasks (urgency = 5) with NO due date (highest priority)
      // 2. Critical tasks (urgency = 5) with due date
      // 3. Non-critical tasks with NO due date
      // 4. Non-critical tasks with due date (lowest priority)

      const aIsCritical = (a.urgency ?? 0) === 5;
      const bIsCritical = (b.urgency ?? 0) === 5;
      const aHasDate = a.dueDate != null;
      const bHasDate = b.dueDate != null;

      // Calculate priority score: critical + no date = highest priority
      const getPriorityScore = (isCritical: boolean, hasDate: boolean) => {
        if (isCritical && !hasDate) return 0; // Highest priority
        if (isCritical && hasDate) return 1;
        if (!isCritical && !hasDate) return 2;
        return 3; // Lowest priority
      };

      const aPriority = getPriorityScore(aIsCritical, aHasDate);
      const bPriority = getPriorityScore(bIsCritical, bHasDate);

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower priority score = higher priority
      }

      // Third: Same priority level - sort by due date (earlier dates first, null dates treated as 0)
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      if (aDate !== bDate) {
        return aDate - bDate;
      }

      // Fourth: Same priority and due date - sort by urgency (higher urgency first)
      return (b.urgency ?? 0) - (a.urgency ?? 0);
    });
  }, [tasks, taskFilters]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="mb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold sm:text-xl">Tareas</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="relative h-7 px-2 text-xs"
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
            <Button
              onClick={() => setShowGlobalTaskModal(true)}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Plus className="mr-1.5 h-3 w-3" />
              <span>Nueva Tarea</span>
            </Button>
          </div>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="space-y-2">
            <div className="rounded-lg bg-card p-2 shadow-md">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Assigned To Filter */}
                  <FilterCategory
                    title="Asignado a"
                    category="assignedTo"
                    icon={User}
                  >
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-0.5">
                        {agents.map((agent) => (
                          <FilterOption
                            key={agent.id}
                            value={agent.id}
                            label={
                              agent.name ??
                              `${agent.firstName ?? ""} ${agent.lastName ?? ""}`.trim()
                            }
                            filterType="assignedTo"
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </FilterCategory>

                  {/* Created By Filter */}
                  <FilterCategory
                    title="Creado por"
                    category="createdBy"
                    icon={UserPlus}
                  >
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-0.5">
                        {agents.map((agent) => (
                          <FilterOption
                            key={agent.id}
                            value={agent.id}
                            label={
                              agent.name ??
                              `${agent.firstName ?? ""} ${agent.lastName ?? ""}`.trim()
                            }
                            filterType="createdBy"
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </FilterCategory>

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

      <div className="space-y-2">
        {externalLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white p-3 shadow-md sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-md bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-5/6 rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-6 rounded-full bg-gray-200 sm:h-7 sm:w-7" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-6 text-center text-gray-500 sm:py-8">
            <p className="text-sm sm:text-base">
              {activeFiltersCount > 0
                ? "No hay tareas que coincidan con los filtros seleccionados"
                : "No hay tareas registradas para este contacto"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredTasks.map((task) => {
              const canEdit = canUserEditTask(task);
              const canDelete = canUserDeleteTask(task);

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPropertyBadge={true}
                  onToggleCompleted={async (taskId, _currentCompleted) => {
                    await handleToggleCompleted(taskId.toString());
                  }}
                  onDeleteClick={(taskId, _title) => {
                    void handleDeleteTask(taskId.toString());
                  }}
                  onTaskClick={(taskId, task) => {
                    setSelectedTaskForView({
                      taskId: taskId.toString(),
                      task,
                    });
                  }}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Task View Modal */}
      <TaskViewModal
        open={selectedTaskForView !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskForView(null);
          }
        }}
        taskId={selectedTaskForView?.taskId ? Number(selectedTaskForView.taskId) : null}
        initialTask={null}
        onSuccess={() => {
          // Close modal and trigger refresh after edit/delete
          setSelectedTaskForView(null);
          onTaskCreated?.();
        }}
      />

      {/* Global Task Modal */}
      <GlobalTaskModal
        open={showGlobalTaskModal}
        onOpenChange={setShowGlobalTaskModal}
        initialContactId={contactId}
        onSuccess={() => {
          // Trigger refresh - modal will close itself via onOpenChange
          onTaskCreated?.();
        }}
      />
    </div>
  );
}
