"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import OperacionesSummaryCard from "~/components/dashboard/operations/OperacionesSummaryCard";
import WorkQueueCard from "~/components/dashboard/operations/WorkQueueCard";
import OperacionesQuickActionsCard from "~/components/dashboard/operations/OperacionesQuickActionsCard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  OperacionesSummaryCardSkeleton,
  OperacionesQuickActionsCardSkeleton,
  WorkQueueCardSkeleton,
} from "~/components/ui/skeletons";
import {
  getOperacionesSummaryWithAuth,
  getTodayAppointmentsWithAuth,
} from "~/server/queries/operaciones-dashboard";
import type {
  OperacionesSummary,
  TodayAppointment,
} from "~/server/queries/operaciones-dashboard";
import { getMostUrgentTasksWithAuth } from "~/server/queries/task";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";

export default function OperacionesPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OperacionesSummary | null>(null);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [mostUrgentTasks, setMostUrgentTasks] = useState<
    Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>
  >([]);
  const tasksDaysFilter = 7;
  const [tasksLoading, setTasksLoading] = useState(false);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Initial data fetch (without detailed tasks)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Read appointment filter params from URL
        const appointmentListingId = searchParams.get("appointmentListingId");
        const appointmentContactId = searchParams.get("appointmentContactId");
        
        const filters = {
          appointmentListingId: appointmentListingId ? Number(appointmentListingId) : undefined,
          appointmentContactId: appointmentContactId ? Number(appointmentContactId) : undefined,
        };
        
        // Read appointment filter params from URL
        const appointmentType = searchParams.get("appointmentType");
        const appointmentAssignedTo = searchParams.get("appointmentAssignedTo");
        
        const appointmentFilters = {
          type: appointmentType ? appointmentType.split(",") : undefined,
          assignedTo: appointmentAssignedTo ? appointmentAssignedTo.split(",") : undefined,
        };
        
        // Obtención de datos iniciales en paralelo para mejor rendimiento
        const [summaryData, appointmentsData, mostUrgentTasksData, usersData] =
          await Promise.all([
            getOperacionesSummaryWithAuth(),
            getTodayAppointmentsWithAuth(appointmentFilters),
            getMostUrgentTasksWithAuth(10, tasksDaysFilter, filters), // Initial detailed tasks
            getAgentsForSelectionWithAuth(),
          ]);

        setSummary(summaryData);
        setAppointments(appointmentsData);
        setMostUrgentTasks(mostUrgentTasksData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error al cargar datos de operaciones:", error);
        setError(
          "No se pudieron cargar los datos de operaciones. Por favor, intenta actualizar la página.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for fetching detailed tasks based on days filter and appointment filters
  useEffect(() => {
    const fetchDetailedTasks = async () => {
      setTasksLoading(true);
      try {
        // Read appointment filter params from URL
        const appointmentListingId = searchParams.get("appointmentListingId");
        const appointmentContactId = searchParams.get("appointmentContactId");
        
        const filters = {
          appointmentListingId: appointmentListingId ? Number(appointmentListingId) : undefined,
          appointmentContactId: appointmentContactId ? Number(appointmentContactId) : undefined,
        };
        
        const mostUrgentTasksData = await getMostUrgentTasksWithAuth(
          10,
          tasksDaysFilter,
          filters,
        );
        setMostUrgentTasks(mostUrgentTasksData);
      } catch (error) {
        console.error("Error al cargar tareas detalladas:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    void fetchDetailedTasks();
  }, [tasksDaysFilter, searchParams]);

  // Separate effect for fetching appointments based on filters
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Read appointment filter params from URL
        const appointmentType = searchParams.get("appointmentType");
        const appointmentAssignedTo = searchParams.get("appointmentAssignedTo");
        
        const appointmentFilters = {
          type: appointmentType ? appointmentType.split(",") : undefined,
          assignedTo: appointmentAssignedTo ? appointmentAssignedTo.split(",") : undefined,
        };
        
        const appointmentsData = await getTodayAppointmentsWithAuth(appointmentFilters);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Error al cargar citas:", error);
      }
    };

    void fetchAppointments();
  }, [searchParams]);

  const refreshTasks = async () => {
    try {
      // Read appointment filter params from URL
      const appointmentListingId = searchParams.get("appointmentListingId");
      const appointmentContactId = searchParams.get("appointmentContactId");
      
      const filters = {
        appointmentListingId: appointmentListingId ? Number(appointmentListingId) : undefined,
        appointmentContactId: appointmentContactId ? Number(appointmentContactId) : undefined,
      };
      
      const mostUrgentTasksData = await getMostUrgentTasksWithAuth(10, tasksDaysFilter, filters);
      setMostUrgentTasks(mostUrgentTasksData);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operaciones</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <OperacionesSummaryCardSkeleton className="lg:col-span-2" />
          <OperacionesQuickActionsCardSkeleton />
          <WorkQueueCardSkeleton className="md:col-span-2 lg:col-span-3" />
        </div>
      ) : error ? (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error al Cargar el Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <OperacionesSummaryCard data={summary!} className="lg:col-span-2" />
          <OperacionesQuickActionsCard onTaskCreated={refreshTasks} />
          <WorkQueueCard
            appointments={appointments}
            detailedTasks={mostUrgentTasks}
            loading={tasksLoading}
            users={users}
            className="md:col-span-2 lg:col-span-3"
          />
        </div>
      )}
    </div>
  );
}
