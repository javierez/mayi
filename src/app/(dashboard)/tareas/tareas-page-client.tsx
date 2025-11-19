"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TaskBoard } from "~/components/tareas/task-board";
import { TaskFilter } from "~/components/tareas/task-filter";
import { TaskSearch } from "~/components/tareas/task-search";

interface TareasPageClientProps {
  initialTasks: Array<{
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
  }>;
  users: Array<{ id: string; name: string }>;
  categories: string[];
}

export function TareasPageClient({
  initialTasks,
  users,
  categories,
}: TareasPageClientProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize search query from URL
  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Update URL without page reload - client-side only, no server request
    // Search is done client-side, so we don't need to update the URL
  };

  return (
    <div className="space-y-2">
      <TaskFilter
        users={users}
        categories={categories}
        searchBar={<TaskSearch onSearchChange={handleSearchChange} />}
      />

      {/* Task Board */}
      <TaskBoard initialTasks={initialTasks} searchQuery={searchQuery} />
    </div>
  );
}

