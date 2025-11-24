import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import { getAllFeedbackWithAuth } from "~/server/queries/feedback";
import { FeedbackKanban } from "~/components/admin/feedback/feedback-kanban";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 1 (superadmin)
  const hasRequiredRole = await userHasRole(session.user.id, 1);

  if (!hasRequiredRole) {
    redirect("/operaciones");
  }

  // Fetch all feedback
  const feedbackData = await getAllFeedbackWithAuth();

  // Get search query from params
  const params = await searchParams;
  const searchQuery = params.search ?? "";

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Maestro
        </Link>{" "}
        / <span className="text-gray-900">Feedback</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Feedback
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Visualiza y gestiona el feedback de los usuarios en un tablero Kanban
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{feedbackData.length}</span> feedback
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          name="search"
          placeholder="Buscar por comentario o cuenta..."
          defaultValue={searchQuery}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <FeedbackKanban
        initialFeedback={feedbackData}
        searchQuery={searchQuery}
      />
    </div>
  );
}
