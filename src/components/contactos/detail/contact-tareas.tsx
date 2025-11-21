import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Plus,
  Check,
  Filter,
  X,
} from "lucide-react";
import { TaskCard } from "~/components/tasks/task-card";
import { TaskViewModal } from "~/components/tasks/task-view-modal";
import { GlobalTaskModal } from "~/components/tasks/global-task-modal";
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
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "contact" | "property"
  >("all");
  const [selectedTaskForView, setSelectedTaskForView] = useState<{
    taskId: string;
    task: Task;
  } | null>(null);
  const [showGlobalTaskModal, setShowGlobalTaskModal] = useState(false);

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

  // const toggleDescriptionExpansion = (taskId: string, e: React.MouseEvent) => {
  //   e.stopPropagation(); // Prevent task toggle
  //   setExpandedDescriptions((prev) => ({
  //     ...prev,
  //     [taskId]: !prev[taskId],
  //   }));
  // };

  // Filter and sort tasks by category
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by category
    if (categoryFilter === "contact") {
      filtered = filtered.filter((task) => task.category === "contact");
    } else if (categoryFilter === "property") {
      filtered = filtered.filter((task) => task.category === "property");
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
  }, [tasks, categoryFilter]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold sm:text-xl">Tareas</h3>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-8 p-0 text-gray-600 shadow"
              >
                <Filter className="h-3.5 w-3.5" />
                {categoryFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px] font-normal"
                  >
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-1">
                <div
                  className={`flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                    categoryFilter === "all" ? "bg-accent" : ""
                  }`}
                  onClick={() => setCategoryFilter("all")}
                >
                  <div
                    className={`flex h-3 w-3 items-center justify-center rounded border ${
                      categoryFilter === "all"
                        ? "border-primary bg-primary"
                        : "border-input"
                    }`}
                  >
                    {categoryFilter === "all" && (
                      <Check className="h-2 w-2 text-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={categoryFilter === "all" ? "font-medium" : ""}
                  >
                    Todas
                  </span>
                </div>
                <div
                  className={`flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                    categoryFilter === "contact" ? "bg-accent" : ""
                  }`}
                  onClick={() => setCategoryFilter("contact")}
                >
                  <div
                    className={`flex h-3 w-3 items-center justify-center rounded border ${
                      categoryFilter === "contact"
                        ? "border-primary bg-primary"
                        : "border-input"
                    }`}
                  >
                    {categoryFilter === "contact" && (
                      <Check className="h-2 w-2 text-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={
                      categoryFilter === "contact" ? "font-medium" : ""
                    }
                  >
                    Contacto
                  </span>
                </div>
                <div
                  className={`flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                    categoryFilter === "property" ? "bg-accent" : ""
                  }`}
                  onClick={() => setCategoryFilter("property")}
                >
                  <div
                    className={`flex h-3 w-3 items-center justify-center rounded border ${
                      categoryFilter === "property"
                        ? "border-primary bg-primary"
                        : "border-input"
                    }`}
                  >
                    {categoryFilter === "property" && (
                      <Check className="h-2 w-2 text-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={
                      categoryFilter === "property" ? "font-medium" : ""
                    }
                  >
                    Propiedad
                  </span>
                </div>
              </div>
              {categoryFilter !== "all" && (
                <>
                  <Separator className="my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoryFilter("all")}
                    className="h-7 w-full text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Borrar filtro
                  </Button>
                </>
              )}
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => setShowGlobalTaskModal(true)}
            variant="outline"
            className="flex h-8 items-center gap-2 text-sm text-gray-600 shadow"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
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
              {categoryFilter !== "all"
                ? `No hay tareas de ${categoryFilter === "contact" ? "contacto" : "propiedad"}`
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
