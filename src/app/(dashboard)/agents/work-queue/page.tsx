"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import WorkQueueCard from "~/components/dashboard/operations/WorkQueueCard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { WorkQueueCardSkeleton } from "~/components/ui/skeletons";
import type { getMostUrgentTasksWithAuth } from "~/server/queries/task";
import type { TodayAppointment } from "~/server/queries/operaciones-dashboard";

export default function AgentWorkQueuePage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedTasks, setDetailedTasks] = useState<Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>>([]);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get selected agent from URL or use current user
        const agentIdParam = searchParams.get("userId");

        // Set selected agent
        if (agentIdParam) {
          setSelectedAgentId(agentIdParam);
        } else if (session?.user?.id) {
          setSelectedAgentId(session.user.id);
        }

        // Fetch tasks and appointments for the agent
        const userId = agentIdParam ?? selectedAgentId;
        if (userId) {
          // Build URL with filters from searchParams
          const url = new URL(`/api/agents/summary`, window.location.origin);
          url.searchParams.set("userId", userId);

          // Add appointment filters if present
          const appointmentListingId = searchParams.get("appointmentListingId");
          const appointmentContactId = searchParams.get("appointmentContactId");
          if (appointmentListingId) {
            url.searchParams.set("appointmentListingId", appointmentListingId);
          }
          if (appointmentContactId) {
            url.searchParams.set("appointmentContactId", appointmentContactId);
          }

          const summaryResponse = await fetch(url.toString());
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
  }, [searchParams, selectedAgentId, session?.user?.id]);

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
          showAllTasks={true}
          standalone={true}
        />
      )}
    </div>
  );
}
