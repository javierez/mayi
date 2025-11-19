import { redirect } from "next/navigation";
import { getUserTasksWithAuth } from "~/server/queries/task";
import { getSecureSession, getCurrentUserAccountId } from "~/lib/dal";
import { listUsersByAccount } from "~/server/queries/users";
import { TareasPageClient } from "./tareas-page-client";

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Use DAL for authentication - the correct pattern
  const session = await getSecureSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Get current user ID from session
  const userId = session.user.id;

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
  const assignedToFilter = filters.assignedTo
    ? String(filters.assignedTo).split(",")
    : undefined;

  // Fetch tasks for the current user with filters
  // Include incomplete tasks and completed tasks from last 10 days
  const tasksResult = await getUserTasksWithAuth(userId, {
    createdBy: createdByFilter,
    category: categoryFilter,
    urgency: urgencyFilter,
    assignedTo: assignedToFilter,
    // Don't filter by completed - let the query include completed tasks from last 10 days
  });

  // Transform tasks to match the expected format
  // getUserTasks returns joined data with tasks + prospects + contacts + listings + properties
  const tasks = tasksResult.map((result) => ({
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
  // Include completed tasks from last 10 days for category options
  const allTasksForCategories = await getUserTasksWithAuth(userId);
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

      {/* Search and Filters */}
      <TareasPageClient
        initialTasks={tasks}
        users={users}
        categories={uniqueCategories}
      />
    </div>
  );
}
