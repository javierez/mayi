"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "~/lib/auth-client";
import { getUserTasksWithAuth } from "~/server/queries/task";
import { listUsersWithAuth } from "~/server/queries/users";
import { TaskBoard } from "~/components/tareas/task-board";
import { TaskFilter } from "~/components/tareas/task-filter";
import { TaskSearch } from "~/components/tareas/task-search";

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  urgency: number | null;
  category: string | null;
  status: string;
  completed: boolean | null;
  createdAt: Date | null;
  listingId?: string | null;
  contactId?: string | null;
  propertyTitle?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

export default function TareasPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch static data (users and categories) once on mount
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const usersData = await listUsersWithAuth(1, 100);
        const usersList = usersData.map((user) => ({
          id: user.id,
          name: user.name,
        }));
        setUsers(usersList);

        // Fetch all tasks to extract unique categories (only if we have a user)
        if (session?.user?.id) {
          const allTasksResult = await getUserTasksWithAuth(session.user.id, {});
          const uniqueCategories = Array.from(
            new Set(
              allTasksResult
                .map((result) => result.tasks.category)
                .filter((cat): cat is string => cat !== null && cat !== undefined),
            ),
          ).sort();
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error fetching static data:", error);
      }
    };
    void fetchStaticData();
  }, [session?.user?.id]);

  // Fetch tasks whenever searchParams or session changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const userId = session.user.id;

        // Parse filters from URL params
        const createdByFilter = searchParams.get("createdBy")
          ? searchParams.get("createdBy")!.split(",")
          : undefined;
        const urgencyFilter = searchParams.get("urgency")
          ? searchParams.get("urgency")!.split(",").map(Number)
          : undefined;
        const assignedToFilter = searchParams.get("assignedTo")
          ? searchParams.get("assignedTo")!.split(",")
          : undefined;

        // Fetch tasks with filters
        const tasksResult = await getUserTasksWithAuth(userId, {
          createdBy: createdByFilter,
          urgency: urgencyFilter,
          assignedTo: assignedToFilter,
        });

        // Transform tasks to match the expected format
        const transformedTasks = tasksResult.map((result) => ({
          taskId: result.tasks.taskId.toString(),
          title: result.tasks.title,
          description: result.tasks.description,
          dueDate: result.tasks.dueDate,
          urgency: result.tasks.urgency,
          category: result.tasks.category,
          status: result.tasks.status ?? "backlog",
          completed: result.tasks.completed,
          createdAt: result.tasks.createdAt,
          listingId: result.tasks.listingId?.toString() ?? null,
          contactId:
            result.contacts?.contactId?.toString() ??
            result.tasks.contactId?.toString() ??
            null,
          propertyTitle: result.properties?.title ?? null,
          contactFirstName: result.contacts?.firstName ?? null,
          contactLastName: result.contacts?.lastName ?? null,
        }));

        setTasks(transformedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Error al cargar las tareas");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTasks();
  }, [searchParams, session?.user?.id]);

  // Initialize search query from URL
  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Organización de Tareas
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <TaskFilter
          users={users}
          categories={categories}
          searchBar={<TaskSearch onSearchChange={handleSearchChange} />}
        />

        {/* Task Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cargando tareas...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <TaskBoard initialTasks={tasks} searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
