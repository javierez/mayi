"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth-client";
import { useUserRole } from "~/components/providers/user-role-provider";
import { AgentSelector } from "~/components/agents/agent-selector";
import { AgentSummaryCards } from "~/components/agents/agent-summary-cards";
import { AgentHierarchyView } from "~/components/agents/agent-hierarchy-view";
import { AgentUrgentActions } from "~/components/agents/agent-urgent-actions";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface AgentStats {
  activeListingsCount: number;
  contactsCount: number;
  dealsCount: number;
  tasksCount: number;
  appointmentsCount: number;
}

interface Contact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Listing {
  listingId: string;
  propertyId: string;
  title: string | null;
  street: string | null;
  addressDetails: string | null;
  price: string;
  status: string;
  listingType: string;
  isActive: boolean | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

interface ListingContact {
  listingContactId: string;
  listingId: string | null;
  contactId: string;
  contactType: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  offer: number | null;
  offerAccepted: boolean | null;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean | null;
  listingId: string | null;
  listingContactId: string | null;
  dealId: string | null;
  appointmentId: string | null;
  entityName: string | null;
}

interface Appointment {
  appointmentId: string;
  datetimeStart: string;
  datetimeEnd: string;
  status: string;
  type: string | null;
  contactName: string;
  propertyAddress: string | null;
  listingId: string | null;
}

interface UrgentAction {
  type: "task" | "appointment";
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  datetimeStart?: string;
  status: string;
  entityName?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
}

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

interface AgentData {
  stats: AgentStats;
  contacts: Contact[];
  listings: Listing[];
  listingContacts: ListingContact[];
  tasks: Task[];
  appointments: Appointment[];
  urgentActions: UrgentAction[];
}

export default function AgentsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const { hasRoleId, loading: rolesLoading } = useUserRole();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAccountAdmin = hasRoleId(3);
  const currentUserId = session?.user?.id ?? "";

  // Initialize selected agent to current user
  useEffect(() => {
    if (currentUserId && !selectedAgentId) {
      setSelectedAgentId(currentUserId);
    }
  }, [currentUserId, selectedAgentId]);

  // Fetch agents list if user is Account Admin
  useEffect(() => {
    async function fetchAgents() {
      if (!isAccountAdmin) return;

      try {
        const response = await fetch("/api/agents/list");
        if (!response.ok) {
          throw new Error("Failed to fetch agents list");
        }
        const data = (await response.json()) as Agent[];
        setAgents(data);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("No se pudo cargar la lista de agentes");
      }
    }

    if (!rolesLoading) {
      void fetchAgents();
    }
  }, [isAccountAdmin, rolesLoading]);

  // Fetch agent data when selected agent changes
  useEffect(() => {
    async function fetchAgentData() {
      if (!selectedAgentId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/agents/summary?userId=${selectedAgentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch agent data");
        }
        const data = (await response.json()) as AgentData;
        setAgentData(data);
      } catch (err) {
        console.error("Error fetching agent data:", err);
        setError("No se pudo cargar la información del agente");
        setAgentData(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchAgentData();
  }, [selectedAgentId]);

  // Show loading state while session and roles are loading
  if (sessionLoading || rolesLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Información de Agentes
        </h1>
        <p className="text-muted-foreground">
          Visualiza estadísticas, propiedades, contactos y tareas de los agentes
        </p>
      </div>

      {/* Agent Selector for Account Admins */}
      {isAccountAdmin && agents.length > 0 && (
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onAgentChange={setSelectedAgentId}
          currentUserId={currentUserId}
        />
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      )}

      {/* Agent Data */}
      {!loading && agentData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <AgentSummaryCards stats={agentData.stats} />

          {/* Urgent Actions */}
          <AgentUrgentActions actions={agentData.urgentActions} />

          {/* Hierarchy View */}
          <AgentHierarchyView
            contacts={agentData.contacts}
            listings={agentData.listings}
            listingContacts={agentData.listingContacts}
            tasks={agentData.tasks}
            appointments={agentData.appointments}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !agentData && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No hay datos disponibles</p>
            <p className="text-sm text-muted-foreground">
              Selecciona un agente para ver su información
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
