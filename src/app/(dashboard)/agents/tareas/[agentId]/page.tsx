import { redirect } from "next/navigation";
import { TaskBoard } from "~/components/tareas/task-board";
import { TaskFilter } from "~/components/tareas/task-filter";
import { getUserTasksWithAuth } from "~/server/queries/task";
import { getSecureSession, getCurrentUserAccountId } from "~/lib/dal";
import { listUsersByAccount } from "~/server/queries/users";

export default async function AgentTareasPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Use DAL for authentication - the correct pattern
  const session = await getSecureSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get agentId from URL params
  const { agentId } = await params;

  // Get search params for filters
  const filters = await searchParams;
  const createdByFilter = filters.createdBy
    ? String(filters.createdBy).split(",")
    : undefined;
  const categoryFilter = filters.category
    ? String(filters.category).split(",")
    : undefined;
  const urgencyFilter = filters.urgency
    ? String(filters.urgency).split(",").map(Number)
    : undefined;

  // Fetch tasks for the specified agent with filters
  const tasksResult = await getUserTasksWithAuth(agentId, {
    createdBy: createdByFilter,
    category: categoryFilter,
    urgency: urgencyFilter,
    completed: false, // Always filter to incomplete tasks
  });

  // Transform tasks to match the expected format
  // getUserTasks returns joined data with tasks + prospects + contacts + listings + properties
  const tasks = tasksResult.map((result) => ({
    taskId: result.tasks.taskId.toString(),
    title: result.tasks.title,
    description: result.tasks.description,
    dueDate: result.tasks.dueDate,
    dueTime: result.tasks.dueTime ?? null, // Include for accurate time remaining
    urgency: result.tasks.urgency,
    category: result.tasks.category,
    status: result.tasks.status ?? "backlog",
    completed: result.tasks.completed,
    createdAt: result.tasks.createdAt,
    listingId: result.tasks.listingId?.toString() ?? null,
    contactId: result.contacts?.contactId?.toString() ?? result.tasks.contactId?.toString() ?? null,
    propertyTitle: result.properties?.title ?? null,
    contactFirstName: result.contacts?.firstName ?? null,
    contactLastName: result.contacts?.lastName ?? null,
  }));

  // Fetch users for filter
  const accountId = await getCurrentUserAccountId();
  const usersData = await listUsersByAccount(accountId, 1, 100);
  const users = usersData.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  // Extract unique categories from all tasks (for filter options)
  const allTasksForCategories = await getUserTasksWithAuth(agentId, {
    completed: false,
  });
  const uniqueCategories = Array.from(
    new Set(
      allTasksForCategories
        .map((result) => result.tasks.category)
        .filter((cat): cat is string => cat !== null && cat !== undefined),
    ),
  ).sort();

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Organización de Tareas
        </h1>
        <p className="text-muted-foreground">
          Arrastra y suelta las tareas para cambiar su estado
        </p>
      </div>

      {/* Filters */}
      <TaskFilter users={users} categories={uniqueCategories} />

      {/* Task Board */}
      <TaskBoard initialTasks={tasks} />
    </div>
  );
}
