"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import WorkQueueCard from "~/components/dashboard/operations/WorkQueueCard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { WorkQueueCardSkeleton } from "~/components/ui/skeletons";
import type { getMostUrgentTasksWithAuth } from "~/server/queries/task";
import type { TodayAppointment } from "~/server/queries/operaciones-dashboard";

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

export default function AgentWorkQueuePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedTasks, setDetailedTasks] = useState<Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>>([]);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const currentUserId = session?.user?.id ?? "";

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get selected agent from URL or use current user
        const agentIdParam = searchParams.get("userId");

        // Fetch agents list
        const agentsResponse = await fetch("/api/agents/list");
        if (agentsResponse.ok) {
          const agentsData = (await agentsResponse.json()) as Agent[];
          setAgents(agentsData);

          // Set selected agent
          if (agentIdParam) {
            setSelectedAgentId(agentIdParam);
          } else if (agentsData.length > 0) {
            setSelectedAgentId(agentsData[0]?.id ?? "");
          }
        }

        // Fetch tasks and appointments for the agent
        const userId = agentIdParam ?? selectedAgentId;
        if (userId) {
          const summaryResponse = await fetch(`/api/agents/summary?userId=${userId}`);
          if (!summaryResponse.ok) {
            throw new Error("Failed to fetch agent data");
          }
          const data = (await summaryResponse.json()) as {
            detailedTasks: Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>;
            todayAppointments: TodayAppointment[];
          };
          setDetailedTasks(data.detailedTasks);
          setAppointments(data.todayAppointments);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("No se pudo cargar la información de tareas urgentes");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [searchParams, selectedAgentId]);

  // Handle agent change
  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set("userId", agentId);
    window.history.replaceState({}, "", `?${params.toString()}`);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cola de Trabajo del Agente</h1>
      </div>

      {isLoading ? (
        <WorkQueueCardSkeleton />
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al Cargar Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <WorkQueueCard
          tasks={[]}
          appointments={appointments}
          detailedTasks={detailedTasks}
          selectedAgentId={selectedAgentId}
          agents={agents}
          showAllTasks={true}
          onAgentChange={handleAgentChange}
          currentUserId={currentUserId}
          standalone={true}
        />
      )}
    </div>
  );
}
