import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Plus,
  AlertCircle,
  Loader2,
  Filter,
  Check,
  ChevronUp,
  ChevronDown,
  User,
  UserPlus,
  FilterX,
} from "lucide-react";
import { TareasSkeleton } from "~/components/ui/skeletons";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { TaskCard } from "~/components/tasks/task-card";
import { TaskViewModal } from "~/components/tasks/task-view-modal";
import { GlobalTaskModal } from "~/components/tasks/global-task-modal";
import { createTaskWithAuth, updateTaskWithAuth } from "~/server/queries/task";
import {
  getAllPotentialOwnersWithAuth,
  getListingOwnerInfoWithAuth,
} from "~/server/queries/contact";
import {
  getLeadByListingAndContactWithAuth,
  ensureLeadExistsWithAuth,
} from "~/server/queries/lead";
import { getDealByListingAndContactWithAuth } from "~/server/queries/deal";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";
import { getListingAppointmentsAction } from "~/server/actions/appointments";
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
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  urgency?: number;
  // User info for "Asignado a"
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
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
}

interface ContactOption {
  id: bigint;
  name: string;
}

interface Appointment {
  appointmentId: bigint;
  listingId?: bigint;
  datetimeStart: Date;
  datetimeEnd: Date;
  type?: string;
  status: string;
  contact: {
    contactId: bigint | null;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface TareasProps {
  propertyId: bigint;
  listingId: bigint;
  referenceNumber: string;
  tasks: Task[];
  loading?: boolean;
  onToggleCompleted: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddTask: (task: Task) => Promise<Task>;
  onUpdateTaskAfterSave: (optimisticId: string, savedTask: Task) => void;
  onRemoveOptimisticTask: (optimisticId: string) => void;
  onTaskCreated?: () => void; // Callback to refresh tasks after modal creation
}

export function Tareas({
  propertyId: _propertyId,
  listingId,
  referenceNumber: _referenceNumber,
  tasks,
  loading: externalLoading,
  onToggleCompleted,
  onDeleteTask,
  onAddTask,
  onUpdateTaskAfterSave,
  onRemoveOptimisticTask,
  onTaskCreated,
}: TareasProps) {
  const { data: session } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    contactId: "",
    appointmentId: "",
    agentId: "",
    urgency: "",
  });
  const [taskStates, setTaskStates] = useState<
    Record<string, "saving" | "saved" | "error">
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTaskForView, setSelectedTaskForView] = useState<{
    taskId: string;
    task: Task;
  } | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  const [showGlobalTaskModal, setShowGlobalTaskModal] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [agents, setAgents] = useState<
    { id: string; name: string; firstName?: string; lastName?: string }[]
  >([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    assignedTo: [] as string[],
    createdBy: [] as string[],
    urgency: [] as string[],
    contactId: [] as string[],
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    assignedTo: false,
    createdBy: false,
    urgency: false,
    contactId: false,
  });
  const [ownerInfo, setOwnerInfo] = useState<{
    listingContactId: bigint;
    contactId: bigint;
  } | null>(null);

  // Permission states
  const [hasEditAllPermission, setHasEditAllPermission] =
    useState<boolean>(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] =
    useState<boolean>(false);

  // Update optimistic tasks when tasks prop changes
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  // Fetch all contacts when user starts creating a task
  useEffect(() => {
    if (!isAdding) return;

    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const contactsData = await getAllPotentialOwnersWithAuth();

        const formattedContacts = contactsData.map((contact) => ({
          id: BigInt(contact.id),
          name: contact.name,
        }));

        setContacts(formattedContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoadingContacts(false);
      }
    };

    void fetchContacts();
  }, [isAdding]);

  // Fetch all agents when user starts creating a task
  useEffect(() => {
    if (!isAdding) return;

    const fetchAgents = async () => {
      setLoadingAgents(true);
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
      } finally {
        setLoadingAgents(false);
      }
    };

    void fetchAgents();
  }, [isAdding]);

  // Fetch appointments for this listing when user starts creating a task
  useEffect(() => {
    if (!isAdding) return;

    const fetchAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const result = await getListingAppointmentsAction(Number(listingId));

        if (result.success && result.appointments) {
          // Format appointments to match the Appointment interface
          const formattedAppointments: Appointment[] = result.appointments.map(
            (apt) => ({
              appointmentId: apt.appointmentId,
              listingId: apt.listingId ?? undefined,
              datetimeStart: new Date(apt.datetimeStart),
              datetimeEnd: apt.datetimeEnd ? new Date(apt.datetimeEnd) : new Date(apt.datetimeStart),
              type: apt.type ?? undefined,
              status: apt.status,
              contact: {
                contactId: apt.contactId,
                firstName: apt.contactFirstName ?? "",
                lastName: apt.contactLastName ?? "",
                email: apt.contactEmail ?? undefined,
              },
            }),
          );

          setAppointments(formattedAppointments);
        } else {
          console.error("Error fetching appointments:", result.error);
          setAppointments([]);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };

    void fetchAppointments();
  }, [isAdding, listingId]);

  // Initialize agent selection with current user when starting to add a task
  useEffect(() => {
    if (isAdding && !newTask.agentId && session?.user?.id) {
      setNewTask((prev) => ({ ...prev, agentId: session.user.id }));
    }
  }, [isAdding, session?.user?.id, newTask.agentId]);

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

  // Fetch owner information for this listing
  useEffect(() => {
    const fetchOwnerInfo = async () => {
      try {
        const info = await getListingOwnerInfoWithAuth(Number(listingId));
        setOwnerInfo(info ?? null);
      } catch (error) {
        console.error("Error fetching owner info:", error);
        setOwnerInfo(null);
      }
    };

    void fetchOwnerInfo();
  }, [listingId]);

  // Auto-save draft functionality
  useEffect(() => {
    const draftKey = `task-draft-${listingId}`;

    // Save draft to localStorage when form data changes
    if (newTask.title || newTask.description) {
      localStorage.setItem(draftKey, JSON.stringify(newTask));
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [newTask, listingId]);

  // Load draft on component mount
  useEffect(() => {
    const draftKey = `task-draft-${listingId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as typeof newTask;
        setNewTask(draft);
      } catch (error) {
        console.error("Error loading draft:", error);
        localStorage.removeItem(draftKey);
      }
    }
  }, [listingId]);

  // Permission helper functions
  const canUserEditTask = (task: Task): boolean => {
    // User can edit if they created the task OR have editAll permission
    return task.createdBy === session?.user?.id || hasEditAllPermission;
  };

  const canUserDeleteTask = (task: Task): boolean => {
    // User can delete if they created the task OR have deleteAll permission
    return task.createdBy === session?.user?.id || hasDeleteAllPermission;
  };

  // const canUserCompleteTask = (task: Task): boolean => {
  //   // User can complete if they created the task OR have editAll permission
  //   return task.createdBy === session?.user?.id || hasEditAllPermission;
  // };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) return;
    if (isSaving) return; // Prevent double submission

    setSaveError(null);
    setIsSaving(true);

    let relatedContact;
    let relatedAppointment;
    let dealId: bigint | undefined;
    let listingContactId: bigint | undefined;

    // Get related contact
    if (newTask.contactId) {
      const selectedContact = contacts.find(
        (c) => c.id.toString() === newTask.contactId,
      );
      if (selectedContact) {
        relatedContact = {
          contactId: selectedContact.id,
          name: selectedContact.name,
        };

        // Check for existing deal or lead to link the task
        try {
          // Check if there's a deal for this listing + contact
          const deal = await getDealByListingAndContactWithAuth(
            Number(listingId),
            Number(selectedContact.id),
          );

          // Check if there's a lead for this listing + contact
          const lead = await getLeadByListingAndContactWithAuth(
            Number(listingId),
            Number(selectedContact.id),
          );

          // Priority logic: deal > lead > create new lead
          if (deal) {
            dealId = deal.dealId;
          } else if (lead) {
            listingContactId = lead.listing_contacts.listingContactId;
          } else {
            // No deal or lead exists, create a new lead
            const newLead = await ensureLeadExistsWithAuth(
              Number(listingId),
              Number(selectedContact.id),
            );
            if (newLead) {
              listingContactId = newLead.listing_contacts.listingContactId;
            }
          }
        } catch (error) {
          console.error("Error linking task to lead/deal:", error);
          // Continue without linking to lead/deal
        }
      }
    }

    // Get appointment info if selected
    if (newTask.appointmentId) {
      const appointment = appointments.find(
        (a) => a.appointmentId.toString() === newTask.appointmentId,
      );
      if (appointment) {
        relatedAppointment = {
          appointmentId: appointment.appointmentId,
          datetimeStart: appointment.datetimeStart,
          type: appointment.type,
        };
      }
    }

    // Create optimistic task
    const optimisticId = Date.now().toString();
    const selectedUserId =
      newTask.agentId ?? session?.user?.id ?? "current-user-id";

    // Get the selected agent's info for display
    const selectedAgent = agents.find((a) => a.id === selectedUserId);

    // Fallback to session user if agent not found (e.g., during race condition)
    const agentName =
      selectedAgent?.name ??
      (selectedUserId === session?.user?.id ? session.user.name : undefined);
    const agentFirstName =
      selectedAgent?.firstName ??
      (selectedUserId === session?.user?.id
        ? session.user.name?.split(" ")[0]
        : undefined);
    const agentLastName =
      selectedAgent?.lastName ??
      (selectedUserId === session?.user?.id
        ? session.user.name?.split(" ").slice(1).join(" ")
        : undefined);

    const optimisticTask: Task = {
      id: optimisticId,
      userId: selectedUserId,
      userName: agentName,
      userFirstName: agentFirstName,
      userLastName: agentLastName,
      title: newTask.title,
      description: newTask.description,
      completed: false,
      createdAt: new Date(),
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      listingId: listingId,
      appointmentId: newTask.appointmentId
        ? BigInt(newTask.appointmentId)
        : undefined,
      urgency: newTask.urgency ? Number(newTask.urgency) : undefined,
      isActive: true,
      relatedContact,
      relatedAppointment,
    };

    // OPTIMISTIC UPDATE: Add task to UI immediately via parent
    await onAddTask(optimisticTask);
    setTaskStates((prev) => ({ ...prev, [optimisticId]: "saving" }));

    // Clear form
    const formData = { ...newTask };
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      contactId: "",
      appointmentId: "",
      agentId: "",
      urgency: "",
    });
    setIsAdding(false);

    // SERVER ACTION CALL in background
    try {
      const savedTask = await createTaskWithAuth({
        userId: selectedUserId,
        title: formData.title,
        description: formData.description,
        category: "property",
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dueTime: formData.dueDate ? formData.dueTime || "00:00" : undefined,
        completed: false,
        createdBy: session?.user?.id,
        listingId: BigInt(listingId),
        listingContactId: ownerInfo?.listingContactId ?? listingContactId,
        dealId: dealId,
        contactId:
          ownerInfo?.contactId ??
          (formData.contactId ? BigInt(formData.contactId) : undefined),
        appointmentId: formData.appointmentId
          ? BigInt(formData.appointmentId)
          : undefined,
        urgency: formData.urgency ? Number(formData.urgency) : undefined,
        isActive: true,
      });

      if (!savedTask) {
        throw new Error("Failed to save task");
      }

      // Extract contact fields safely
      const contactFirstName =
        "contactFirstName" in savedTask &&
        typeof savedTask.contactFirstName === "string"
          ? savedTask.contactFirstName
          : "";
      const contactLastName =
        "contactLastName" in savedTask &&
        typeof savedTask.contactLastName === "string"
          ? savedTask.contactLastName
          : "";
      const contactEmail =
        "contactEmail" in savedTask &&
        typeof savedTask.contactEmail === "string"
          ? savedTask.contactEmail
          : undefined;

      // Rebuild relatedContact from server response if contact data exists
      const savedRelatedContact =
        savedTask.contactId && (contactFirstName || contactLastName)
          ? {
              contactId: BigInt(savedTask.contactId),
              name: `${contactFirstName} ${contactLastName}`.trim(),
              email: contactEmail,
            }
          : relatedContact; // Fallback to the one we built earlier

      // Extract user fields safely
      const taskUserName =
        "userName" in savedTask && typeof savedTask.userName === "string"
          ? savedTask.userName
          : undefined;
      const taskUserFirstName =
        "userFirstName" in savedTask &&
        typeof savedTask.userFirstName === "string"
          ? savedTask.userFirstName
          : undefined;
      const taskUserLastName =
        "userLastName" in savedTask &&
        typeof savedTask.userLastName === "string"
          ? savedTask.userLastName
          : undefined;

      // Use agent info from server response, or fallback to what we built earlier
      const savedUserName = taskUserName ?? agentName;
      const savedUserFirstName = taskUserFirstName ?? agentFirstName;
      const savedUserLastName = taskUserLastName ?? agentLastName;

      // Server actions now return converted types, just add id and handle dates
      const savedTaskForComponent = {
        ...savedTask,
        id: savedTask.taskId?.toString() || optimisticId,
        taskId: savedTask.taskId ? BigInt(savedTask.taskId) : undefined,
        listingId: savedTask.listingId
          ? BigInt(savedTask.listingId)
          : undefined,
        leadId: savedTask.listingContactId
          ? BigInt(savedTask.listingContactId)
          : undefined,
        dealId: savedTask.dealId ? BigInt(savedTask.dealId) : undefined,
        appointmentId: savedTask.appointmentId
          ? BigInt(savedTask.appointmentId)
          : undefined,
        prospectId: savedTask.prospectId
          ? BigInt(savedTask.prospectId)
          : undefined,
        createdAt: new Date(savedTask.createdAt),
        updatedAt: savedTask.updatedAt
          ? new Date(savedTask.updatedAt)
          : undefined,
        dueDate: savedTask.dueDate ? new Date(savedTask.dueDate) : undefined,
        completed: savedTask.completed ?? false,
        isActive: savedTask.isActive ?? true,
        userName: savedUserName,
        userFirstName: savedUserFirstName,
        userLastName: savedUserLastName,
        relatedContact: savedRelatedContact,
      };

      // SUCCESS: Update with server response via parent
      onUpdateTaskAfterSave(optimisticId, savedTaskForComponent as Task);
      setTaskStates((prev) => ({ ...prev, [optimisticId]: "saved" }));

      // Clear draft after successful save
      const draftKey = `task-draft-${listingId}`;
      localStorage.removeItem(draftKey);

      // Clear success state after 2 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[optimisticId];
          return newStates;
        });
      }, 2000);
    } catch (error) {
      console.error("Error saving task:", error);

      // ERROR: Revert optimistic update via parent
      onRemoveOptimisticTask(optimisticId);
      setTaskStates((prev) => ({ ...prev, [optimisticId]: "error" }));
      setSaveError(
        error instanceof Error ? error.message : "Failed to save task",
      );

      // Restore form data
      setNewTask(formData);
      setIsAdding(true);

      // Clear error after 5 seconds
      setTimeout(() => {
        setSaveError(null);
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[optimisticId];
          return newStates;
        });
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !newTask.title.trim() || !newTask.description.trim())
      return;
    if (isSaving) return;

    setSaveError(null);
    setIsSaving(true);

    let relatedContact;
    let relatedAppointment;
    let dealId: bigint | undefined;
    let listingContactId: bigint | undefined;

    // Get related contact
    if (newTask.contactId) {
      const selectedContact = contacts.find(
        (c) => c.id.toString() === newTask.contactId,
      );
      if (selectedContact) {
        relatedContact = {
          contactId: selectedContact.id,
          name: selectedContact.name,
        };

        // Check for existing deal or lead to link the task
        try {
          // Check if there's a deal for this listing + contact
          const deal = await getDealByListingAndContactWithAuth(
            Number(listingId),
            Number(selectedContact.id),
          );

          // Check if there's a lead for this listing + contact
          const lead = await getLeadByListingAndContactWithAuth(
            Number(listingId),
            Number(selectedContact.id),
          );

          // Priority logic: deal > lead > create new lead
          if (deal) {
            dealId = deal.dealId;
          } else if (lead) {
            listingContactId = lead.listing_contacts.listingContactId;
          } else {
            // No deal or lead exists, create a new lead
            const newLead = await ensureLeadExistsWithAuth(
              Number(listingId),
              Number(selectedContact.id),
            );
            if (newLead) {
              listingContactId = newLead.listing_contacts.listingContactId;
            }
          }
        } catch (error) {
          console.error("Error linking task to lead/deal:", error);
          // Continue without linking to lead/deal
        }
      }
    }

    // Get appointment info if selected
    if (newTask.appointmentId) {
      const appointment = appointments.find(
        (a) => a.appointmentId.toString() === newTask.appointmentId,
      );
      if (appointment) {
        relatedAppointment = {
          appointmentId: appointment.appointmentId,
          datetimeStart: appointment.datetimeStart,
          type: appointment.type,
        };
      }
    }

    // Get the selected agent's info for display
    const selectedAgent = agents.find((a) => a.id === newTask.agentId);

    // Create updated task object
    const updatedTask: Task = {
      ...editingTask,
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      userId: newTask.agentId,
      userName: selectedAgent?.name,
      userFirstName: selectedAgent?.firstName,
      userLastName: selectedAgent?.lastName,
      appointmentId: newTask.appointmentId
        ? BigInt(newTask.appointmentId)
        : undefined,
      urgency: newTask.urgency ? Number(newTask.urgency) : undefined,
      relatedContact,
      relatedAppointment,
      updatedAt: new Date(),
    };

    // Set saving state
    setTaskStates((prev) => ({ ...prev, [editingTask.id]: "saving" }));

    try {
      const savedTask = await updateTaskWithAuth(
        Number(editingTask.taskId ?? editingTask.id),
        {
          title: newTask.title,
          description: newTask.description,
          category: "property",
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
          dueTime: newTask.dueDate ? newTask.dueTime || "00:00" : undefined,
          userId: newTask.agentId,
          listingContactId: ownerInfo?.listingContactId ?? listingContactId,
          dealId: dealId,
          contactId:
            ownerInfo?.contactId ??
            (newTask.contactId ? BigInt(newTask.contactId) : undefined),
          appointmentId: newTask.appointmentId
            ? BigInt(newTask.appointmentId)
            : undefined,
          urgency: newTask.urgency ? Number(newTask.urgency) : undefined,
        },
      );

      if (!savedTask) {
        throw new Error("Failed to update task");
      }

      // Update the task in the parent component
      onUpdateTaskAfterSave(editingTask.id, updatedTask);
      setTaskStates((prev) => ({ ...prev, [editingTask.id]: "saved" }));

      // Clear form and editing state
      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        contactId: "",
        appointmentId: "",
        agentId: "",
        urgency: "",
      });
      setEditingTask(null);
      setIsAdding(false);

      // Clear success state after 2 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[editingTask.id];
          return newStates;
        });
      }, 2000);
    } catch (error) {
      console.error("Error updating task:", error);
      setTaskStates((prev) => ({ ...prev, [editingTask.id]: "error" }));
      setSaveError(
        error instanceof Error ? error.message : "Failed to update task",
      );

      // Clear error after 5 seconds
      setTimeout(() => {
        setSaveError(null);
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[editingTask.id];
          return newStates;
        });
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCompleted = async (id: string) => {
    // Find the task to get current completed state
    const task = optimisticTasks.find((t) => t.id === id);
    if (!task) {
      console.log("Task not found:", id);
      return;
    }

    const newCompleted = !task.completed;
    console.log("Toggling task:", id, "from", task.completed, "to", newCompleted);

    // OPTIMISTIC UPDATE: Immediately update the UI
    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
    );

    // Set saving state for visual feedback
    setTaskStates((prev) => ({ ...prev, [id]: "saving" }));

    try {
      await onToggleCompleted(id);

      // Set saved state
      setTaskStates((prev) => ({ ...prev, [id]: "saved" }));

      // Clear the saved state after 2 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[id];
          return newStates;
        });
      }, 2000);
    } catch (error) {
      console.error("Error toggling task completion:", error);

      // REVERT: Restore original completed state on error
      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: task.completed } : t,
        ),
      );

      // Set error state
      setTaskStates((prev) => ({ ...prev, [id]: "error" }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[id];
          return newStates;
        });
      }, 5000);
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Store the task for potential reversion
    const taskToDelete = optimisticTasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    // OPTIMISTIC UPDATE: Immediately remove from UI
    setOptimisticTasks((prev) => prev.filter((t) => t.id !== id));

    // Set saving state for visual feedback
    setTaskStates((prev) => ({ ...prev, [id]: "saving" }));

    try {
      await onDeleteTask(id);

      // Set saved state briefly before the task is removed
      setTaskStates((prev) => ({ ...prev, [id]: "saved" }));

      // Clear state after 1 second
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[id];
          return newStates;
        });
      }, 1000);
    } catch (error) {
      console.error("Error deleting task:", error);

      // REVERT: Restore the task on error
      setOptimisticTasks((prev) =>
        [...prev, taskToDelete].sort((a, b) => {
          // Re-sort to maintain proper order
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime();
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        }),
      );

      // Set error state
      setTaskStates((prev) => ({ ...prev, [id]: "error" }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setTaskStates((prev) => {
          const newStates = { ...prev };
          delete newStates[id];
          return newStates;
        });
      }, 5000);
    }
  };

  // Filter helper functions
  const toggleFilter = (
    filterType: "assignedTo" | "createdBy" | "urgency" | "contactId",
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
      contactId: [],
    });
  };

  const activeFiltersCount =
    taskFilters.assignedTo.length +
    taskFilters.createdBy.length +
    taskFilters.urgency.length +
    taskFilters.contactId.length;

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(contactSearch.toLowerCase()),
    );
  }, [contacts, contactSearch]);

  // Filter appointments based on selected contact
  const filteredAppointments = useMemo(() => {
    // If no contact is selected, show all appointments
    if (!newTask.contactId) {
      return appointments;
    }

    // Filter appointments that match the selected contact
    return appointments.filter(
      (appointment) =>
        appointment.contact.contactId?.toString() === newTask.contactId,
    );
  }, [appointments, newTask.contactId]);

  // Sort and filter tasks: apply filters, incomplete first, then by due date
  const sortedTasks = useMemo(() => {
    let filteredTasks = [...optimisticTasks];

    // Filter by assigned to
    if (taskFilters.assignedTo.length > 0) {
      filteredTasks = filteredTasks.filter((task) =>
        taskFilters.assignedTo.includes(task.userId),
      );
    }

    // Filter by created by
    if (taskFilters.createdBy.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) => task.createdBy && taskFilters.createdBy.includes(task.createdBy),
      );
    }

    // Filter by urgency
    if (taskFilters.urgency.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.urgency && taskFilters.urgency.includes(task.urgency.toString()),
      );
    }

    // Filter by contact
    if (taskFilters.contactId.length > 0) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.relatedContact &&
          taskFilters.contactId.includes(task.relatedContact.contactId.toString()),
      );
    }

    return filteredTasks.sort((a, b) => {
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
  }, [optimisticTasks, taskFilters]);

  if (externalLoading) {
    return <TareasSkeleton />;
  }

  // Task form component (reusable for both new and edit)
  const taskForm = isAdding ? (
    <Card className="w-full">
      <CardContent
        className="space-y-4 px-4 pt-4 md:px-6 md:pt-6"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (editingTask) {
              void handleUpdateTask();
            } else {
              void handleAddTask();
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            setIsAdding(false);
            setEditingTask(null);
            setSaveError(null);
          }
        }}
      >
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {editingTask ? "Editando tarea" : "Nueva tarea"}
          </Label>
          <Input
            placeholder="Título de la tarea"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
        </div>
        <div className="relative">
          <Textarea
            placeholder="Descripción de la tarea"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
            className="min-h-[80px] pr-10 text-sm"
          />
          <div className="absolute right-2 top-2">
            <PushToTalkWhisperButton
              onTranscript={(text) => {
                setNewTask((prev) => ({
                  ...prev,
                  description: prev.description
                    ? `${prev.description} ${text}`.trim()
                    : text,
                }));
              }}
              language="es"
              disabled={isSaving}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent-select">Asignar a</Label>
            <Select
              value={newTask.agentId}
              onValueChange={(value) =>
                setNewTask({ ...newTask, agentId: value })
              }
              disabled={externalLoading ?? loadingAgents}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue
                  placeholder={
                    externalLoading || loadingAgents
                      ? "Cargando agentes..."
                      : agents.length === 0
                        ? "No hay agentes"
                        : "Seleccionar agente"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name ??
                      (`${agent.firstName ?? ""} ${agent.lastName ?? ""}`.trim() ||
                        agent.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="urgency-select">Urgencia</Label>
            <Select
              value={newTask.urgency}
              onValueChange={(value) =>
                setNewTask({ ...newTask, urgency: value })
              }
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    Baja
                  </span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    Media-Baja
                  </span>
                </SelectItem>
                <SelectItem value="3">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-400" />
                    Media
                  </span>
                </SelectItem>
                <SelectItem value="4">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Media-Alta
                  </span>
                </SelectItem>
                <SelectItem value="5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Crítica
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-select">Contacto</Label>
            <Select
              value={newTask.contactId}
              onValueChange={(value) =>
                setNewTask({ ...newTask, contactId: value })
              }
              disabled={externalLoading ?? loadingContacts}
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue
                  placeholder={
                    externalLoading || loadingContacts
                      ? "Cargando contactos..."
                      : contacts.length === 0
                        ? "No hay contactos"
                        : "Seleccionar contacto"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <div
                  className="flex items-center px-3 pb-2"
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Input
                    className="h-9"
                    placeholder="Buscar contacto..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <Separator className="mb-2" />
                {filteredContacts.map((contact) => (
                  <SelectItem
                    key={contact.id.toString()}
                    value={contact.id.toString()}
                  >
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due-date">Fecha límite</Label>
            <Input
              id="due-date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
              className="h-8 text-gray-500"
            />
          </div>
        </div>

        {/* Toggle for advanced options */}
        <button
          type="button"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700"
        >
          {showAdvancedOptions ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span>Ocultar opciones</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span>Más opciones</span>
            </>
          )}
        </button>

        {showAdvancedOptions && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment-select">Cita relacionada</Label>
              <Select
                value={newTask.appointmentId}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, appointmentId: value })
                }
                disabled={externalLoading ?? loadingAppointments}
              >
                <SelectTrigger className="h-8 text-gray-500">
                  <SelectValue
                    placeholder={
                      externalLoading || loadingAppointments
                        ? "Cargando citas..."
                        : filteredAppointments.length === 0
                          ? newTask.contactId
                            ? "No hay citas para este contacto"
                            : "No hay citas"
                          : "Seleccionar cita"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredAppointments.map((appointment) => (
                    <SelectItem
                      key={appointment.appointmentId.toString()}
                      value={appointment.appointmentId.toString()}
                    >
                      {appointment.contact.firstName}{" "}
                      {appointment.contact.lastName} - {appointment.type} (
                      {appointment.datetimeStart.toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-time">Hora límite</Label>
              <Input
                id="due-time"
                type="time"
                value={newTask.dueTime}
                onChange={(e) =>
                  setNewTask({ ...newTask, dueTime: e.target.value })
                }
                className="h-8 text-gray-500"
              />
            </div>
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{saveError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSaveError(null)}
              className="ml-auto h-6"
            >
              Dismiss
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="hidden text-xs text-gray-500 sm:block">
            <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              Cmd+Enter
            </kbd>{" "}
            para guardar,{" "}
            <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              Esc
            </kbd>{" "}
            para cancelar
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              onClick={editingTask ? handleUpdateTask : handleAddTask}
              disabled={
                isSaving || !newTask.title.trim() || !newTask.description.trim()
              }
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingTask ? "Actualizando..." : "Guardando..."}
                </>
              ) : editingTask ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setEditingTask(null);
                setSaveError(null);
              }}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  // Filter UI helper components
  const FilterOption = ({
    value,
    label,
    filterType,
  }: {
    value: string;
    label: string;
    filterType: "assignedTo" | "createdBy" | "urgency" | "contactId";
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
              onClick={() => {
                setShowGlobalTaskModal(true);
              }}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              <Plus className="mr-1.5 h-3 w-3" />
              <span>Nueva Tarea</span>
            </Button>
            {(newTask.title || newTask.description) && !isAdding && (
              <div
                className="h-3 w-3 animate-pulse cursor-help rounded-full bg-amber-400"
                title="Borrador guardado"
              />
            )}
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

                  {/* Contact Filter */}
                  <FilterCategory
                    title="Contacto"
                    category="contactId"
                    icon={User}
                  >
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-0.5">
                        {contacts.map((contact) => (
                          <FilterOption
                            key={contact.id.toString()}
                            value={contact.id.toString()}
                            label={contact.name}
                            filterType="contactId"
                          />
                        ))}
                      </div>
                    </ScrollArea>
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

      {/* Show form at top only when creating a new task (not editing) */}
      {isAdding && !editingTask && taskForm}

      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="py-6 text-center text-gray-500 sm:py-8">
            <p className="text-sm sm:text-base">
              {activeFiltersCount > 0
                ? "No hay tareas que coincidan con los filtros seleccionados"
                : "No hay tareas registradas para esta propiedad"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedTasks.map((task) => {
              const canEdit = canUserEditTask(task);
              const canDelete = canUserDeleteTask(task);

              // Debug logging
              if (sortedTasks.indexOf(task) === 0) {
                console.log("First task permissions:", {
                  taskId: task.id,
                  canEdit,
                  canDelete,
                  createdBy: task.createdBy,
                  sessionUserId: session?.user?.id,
                  hasEditAllPermission,
                });
              }

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  showPropertyBadge={false}
                  onToggleCompleted={async (taskId, _currentCompleted) => {
                    console.log("onToggleCompleted callback called with:", taskId);
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
                  taskState={taskStates[task.id]}
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

      {/* Global Task Modal with pre-selected listing */}
      <GlobalTaskModal
        open={showGlobalTaskModal}
        onOpenChange={setShowGlobalTaskModal}
        initialListingId={listingId}
        onSuccess={() => {
          // Trigger refresh - modal will close itself via onOpenChange
          onTaskCreated?.();
        }}
      />
    </div>
  );
}
