import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Plus,
  Trash2,
  Check,
  Mic,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Filter,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { TareasSkeleton } from "~/components/ui/skeletons";
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
    contactId: bigint;
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
  });
  const [taskStates, setTaskStates] = useState<
    Record<string, "saving" | "saved" | "error">
  >({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "contact" | "property"
  >("all");
  const [ownerInfo, setOwnerInfo] = useState<{
    listingContactId: bigint;
    contactId: bigint;
  } | null>(null);

  // Permission states
  const [hasEditAllPermission, setHasEditAllPermission] =
    useState<boolean>(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] =
    useState<boolean>(false);

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
              datetimeEnd: new Date(apt.datetimeEnd),
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsAdding(true);

    // Pre-fill form with task data
    const dueDateString: string =
      task.dueDate?.toISOString().split("T")[0] ?? "";
    const dueTimeString: string =
      task.dueDate?.toTimeString().slice(0, 5) ?? "";

    setNewTask({
      title: task.title,
      description: task.description,
      dueDate: dueDateString,
      dueTime: dueTimeString,
      contactId: task.relatedContact?.contactId.toString() ?? "",
      appointmentId: task.appointmentId?.toString() ?? "",
      agentId: task.userId,
    });
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
    await onToggleCompleted(id);
  };

  const handleDeleteTask = async (id: string) => {
    await onDeleteTask(id);
  };

  const toggleDescriptionExpansion = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent task toggle
    setExpandedDescriptions((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

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
        appointment.contact.contactId.toString() === newTask.contactId,
    );
  }, [appointments, newTask.contactId]);

  // Sort and filter tasks: filter by category, incomplete first, then by due date
  const sortedTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // Filter by category
    if (categoryFilter === "contact") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === "contact",
      );
    } else if (categoryFilter === "property") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === "property",
      );
    }

    return filteredTasks.sort((a, b) => {
      // First: Incomplete tasks come before completed tasks
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Second: Sort by due date (tasks with due dates first, then by date)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // If no due dates, maintain creation order
      return 0;
    });
  }, [tasks, categoryFilter]);

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
          <button
            type="button"
            className="absolute right-2 top-2 p-1 text-gray-400 transition-colors hover:text-gray-600"
            title="Próximamente: Grabación de voz"
          >
            <Mic className="h-4 w-4" />
          </button>
        </div>
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
            onClick={() => {
              setEditingTask(null);
              setIsAdding(true);
            }}
            variant="outline"
            className="flex h-8 items-center gap-2 text-sm text-gray-600 shadow"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
          {(newTask.title || newTask.description) && !isAdding && (
            <div
              className="h-3 w-3 animate-pulse cursor-help rounded-full bg-amber-400"
              title="Borrador guardado"
            />
          )}
        </div>
      </div>

      {/* Show form at top only when creating a new task (not editing) */}
      {isAdding && !editingTask && taskForm}

      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="py-6 text-center text-gray-500 sm:py-8">
            <p className="text-sm sm:text-base">
              {categoryFilter !== "all"
                ? `No hay tareas de ${categoryFilter === "contact" ? "contacto" : "propiedad"}`
                : "No hay tareas registradas para esta propiedad"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedTasks.map((task) => {
              const getInitials = (
                firstName?: string,
                lastName?: string,
                name?: string,
              ) => {
                if (firstName && lastName) {
                  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                }
                if (name) {
                  const parts = name.split(" ").filter((p) => p.length > 0);
                  if (parts.length >= 2 && parts[0] && parts[1]) {
                    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
                  } else if (parts[0]) {
                    return parts[0].charAt(0).toUpperCase();
                  }
                }
                return "U";
              };

              const getRemainingTime = (dueDate?: Date) => {
                if (!dueDate) return null;

                const now = new Date();
                const today = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate(),
                );
                const taskDate = new Date(
                  dueDate.getFullYear(),
                  dueDate.getMonth(),
                  dueDate.getDate(),
                );

                // Create full datetime - defaulting to end of day
                const fullDueDateTime = new Date(
                  dueDate.getFullYear(),
                  dueDate.getMonth(),
                  dueDate.getDate(),
                  23,
                  59,
                );

                const diffMs = fullDueDateTime.getTime() - now.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor(diffMs / (1000 * 60));

                if (diffMs < 0) {
                  const overdueDays = Math.abs(diffDays);
                  const overdueHours = Math.abs(diffHours);
                  if (overdueDays > 0) {
                    return `${overdueDays} día${overdueDays !== 1 ? "s" : ""} vencido`;
                  } else if (overdueHours > 0) {
                    return `${overdueHours} hora${overdueHours !== 1 ? "s" : ""} vencido`;
                  } else {
                    return "Vencido";
                  }
                }

                if (taskDate.getTime() === today.getTime()) {
                  // Same day
                  if (diffHours > 0) {
                    return `${diffHours} hora${diffHours !== 1 ? "s" : ""} restantes`;
                  } else if (diffMinutes > 0) {
                    return `${diffMinutes} minuto${diffMinutes !== 1 ? "s" : ""} restantes`;
                  } else {
                    return "Vence ahora";
                  }
                } else {
                  // Different day
                  return `${diffDays} día${diffDays !== 1 ? "s" : ""} restantes`;
                }
              };

              return (
                <div key={task.id}>
                  <div
                    className={`group relative cursor-pointer rounded-xl p-3 shadow-md transition-all duration-200 hover:shadow-lg sm:p-4 ${
                      task.completed ? "bg-gray-50/50 opacity-75" : "bg-white"
                    } ${taskStates[task.id] === "saving" ? "opacity-70" : ""}`}
                    onClick={() => handleToggleCompleted(task.id)}
                  >
                    {/* User avatar - top right */}
                    <div className="absolute right-2 top-2 flex flex-col items-center gap-1 sm:right-3 sm:top-3">
                      <div
                        title={
                          task.userName ??
                          (`${task.userFirstName ?? ""} ${task.userLastName ?? ""}`.trim() ||
                            "Usuario")
                        }
                      >
                        <Avatar className="h-6 w-6 ring-2 ring-gray-100 sm:h-7 sm:w-7">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(
                              task.userFirstName,
                              task.userLastName,
                              task.userName,
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* System task indicator - under avatar */}
                      {task.createdBy === "0" && (
                        <div
                          className="flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6"
                          title="Tarea del sistema"
                        >
                          <Image
                            src="/favicon.ico"
                            alt="Sistema"
                            width={20}
                            height={20}
                            className="h-4 w-4 object-contain opacity-60 sm:h-5 sm:w-5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Task content */}
                    <div className="pr-8 sm:pr-10">
                      <div className="mb-2 flex items-center gap-2 sm:gap-3">
                        {/* Checkbox */}
                        <div
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                            task.completed
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {task.completed && <Check className="h-3 w-3" />}
                        </div>

                        <h3
                          className={`text-sm font-semibold leading-tight ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
                        >
                          {task.title}
                        </h3>

                        {taskStates[task.id] === "saving" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                        )}
                        {taskStates[task.id] === "saved" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>

                      <div className="mb-3 ml-6 sm:ml-8">
                        {(() => {
                          const isExpanded = expandedDescriptions[task.id];
                          const isLongDescription =
                            task.description.length > 120;
                          const displayText =
                            isExpanded || !isLongDescription
                              ? task.description
                              : task.description.substring(0, 120) + "...";

                          return (
                            <div className="group">
                              <p
                                className={`text-sm leading-relaxed ${task.completed ? "text-gray-400 line-through" : "text-gray-600"}`}
                              >
                                {displayText}
                              </p>
                              {isLongDescription && (
                                <button
                                  onClick={(e) =>
                                    toggleDescriptionExpansion(task.id, e)
                                  }
                                  className={`mt-1 flex items-center gap-1 text-xs transition-colors ${
                                    task.completed
                                      ? "text-gray-400 hover:text-gray-500"
                                      : "text-gray-500 hover:text-gray-700"
                                  }`}
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Ver menos</span>
                                      <ChevronUp className="h-3 w-3" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Ver más</span>
                                      <ChevronDown className="h-3 w-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Related items with time */}
                      {(task.relatedContact ??
                        task.relatedAppointment ??
                        task.dueDate) && (
                        <div className="mb-1 ml-6 flex flex-wrap items-center gap-2 sm:ml-8">
                          {task.dueDate && (
                            <span className="inline-block min-w-[120px] whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-center text-xs font-normal text-amber-600 sm:px-2.5">
                              {getRemainingTime(task.dueDate)}
                            </span>
                          )}
                          {task.relatedContact && (
                            <span className="flex items-center gap-1 break-words text-xs font-normal text-gray-500">
                              <User className="h-3 w-3 flex-shrink-0 opacity-60" />
                              <span className="max-w-32 truncate sm:max-w-none">
                                {task.relatedContact.name}
                              </span>
                            </span>
                          )}
                          {task.relatedAppointment && (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium sm:px-2.5"
                            >
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {task.relatedAppointment.type}
                              </span>
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons - bottom right */}
                    <div className="absolute bottom-1 right-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:bottom-2 sm:right-2">
                      {canUserEditTask(task) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          className="h-6 w-6 rounded-lg p-0 text-gray-400 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-500 sm:h-7 sm:w-7"
                          title="Editar tarea"
                        >
                          <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      )}
                      {canUserDeleteTask(task) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteTask(
                              task.taskId?.toString() ?? task.id,
                            );
                          }}
                          className="h-6 w-6 rounded-lg p-0 text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-500 sm:h-7 sm:w-7"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Show edit form inline after this task if it's being edited */}
                  {editingTask?.id === task.id && (
                    <div className="mt-2">{taskForm}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
