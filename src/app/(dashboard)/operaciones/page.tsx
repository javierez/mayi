"use client";

import { useState, useEffect } from "react";
import OperacionesSummaryCard from "~/components/dashboard/operations/OperacionesSummaryCard";
import WorkQueueCard from "~/components/dashboard/WorkQueueCard";
import OperacionesQuickActionsCard from "~/components/dashboard/operations/OperacionesQuickActionsCard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  OperacionesSummaryCardSkeleton,
  OperacionesQuickActionsCardSkeleton,
  WorkQueueCardSkeleton,
} from "~/components/ui/skeletons";
import {
  getOperacionesSummaryWithAuth,
  getUrgentTasksWithAuth,
  getTodayAppointmentsWithAuth,
} from "~/server/queries/operaciones-dashboard";
import type {
  OperacionesSummary,
  UrgentTask,
  TodayAppointment,
} from "~/server/queries/operaciones-dashboard";
import { getMostUrgentTasksWithAuth } from "~/server/queries/task";

export default function OperacionesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<OperacionesSummary | null>(null);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [mostUrgentTasks, setMostUrgentTasks] = useState<
    Awaited<ReturnType<typeof getMostUrgentTasksWithAuth>>
  >([]);
  const [tasksDaysFilter, setTasksDaysFilter] = useState(7);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Initial data fetch (without detailed tasks)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Obtención de datos iniciales en paralelo para mejor rendimiento
        const [summaryData, tasksData, appointmentsData, mostUrgentTasksData] =
          await Promise.all([
            getOperacionesSummaryWithAuth(),
            getUrgentTasksWithAuth(5), // 5 días laborables
            getTodayAppointmentsWithAuth(),
            getMostUrgentTasksWithAuth(10, tasksDaysFilter), // Initial detailed tasks
          ]);

        setSummary(summaryData);
        setUrgentTasks(tasksData);
        setAppointments(appointmentsData);
        setMostUrgentTasks(mostUrgentTasksData);
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

  // Separate effect for fetching detailed tasks based on days filter
  useEffect(() => {
    const fetchDetailedTasks = async () => {
      setTasksLoading(true);
      try {
        const mostUrgentTasksData = await getMostUrgentTasksWithAuth(
          10,
          tasksDaysFilter,
        );
        setMostUrgentTasks(mostUrgentTasksData);
      } catch (error) {
        console.error("Error al cargar tareas detalladas:", error);
      } finally {
        setTasksLoading(false);
      }
    };

    void fetchDetailedTasks();
  }, [tasksDaysFilter]);

  const handleDaysFilterChange = (days: number) => {
    setTasksDaysFilter(days);
  };

  const refreshTasks = async () => {
    try {
      const [urgentTasksData, mostUrgentTasksData] = await Promise.all([
        getUrgentTasksWithAuth(5),
        getMostUrgentTasksWithAuth(10, tasksDaysFilter),
      ]);
      setUrgentTasks(urgentTasksData);
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
            tasks={urgentTasks}
            appointments={appointments}
            detailedTasks={mostUrgentTasks}
            loading={tasksLoading}
            onDaysChange={handleDaysFilterChange}
            className="md:col-span-2 lg:col-span-3"
          />
        </div>
      )}
    </div>
  );
}
