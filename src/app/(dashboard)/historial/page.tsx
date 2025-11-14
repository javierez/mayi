import { getAllListingsHistory } from "~/server/queries/listing-history";
import { getAllContactActivityHistory } from "~/server/queries/contact-activity";
import { getAllListingContactActivityHistory } from "~/server/queries/listing-contact-activity";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";
import { GlobalHistoryTimeline } from "~/components/propiedades/detail/history/global-history-timeline";

interface HistorialPageProps {
  searchParams: Promise<{
    page?: string;
    agent?: string;
    dateFrom?: string;
    dateTo?: string;
    actions?: string;
  }>;
}

export default async function HistorialPage({ searchParams }: HistorialPageProps) {
  const unwrappedSearchParams = await searchParams;
  const currentPage = parseInt(unwrappedSearchParams.page ?? "1");
  const pageSize = 50;

  // Get filter params
  const agentFilter = unwrappedSearchParams.agent?.split(",") ?? [];
  const dateFrom = unwrappedSearchParams.dateFrom;
  const dateTo = unwrappedSearchParams.dateTo;
  const actionFilters = unwrappedSearchParams.actions?.split(",") ?? [];

  // Fetch agents for filter
  const agents = await getAgentsForSelectionWithAuth();

  // Fetch all activities - use a large limit to get all, then filter and paginate
  const largeLimit = 10000; // Large enough to get all activities
  const [listingHistory, contactHistory, listingContactHistory] = await Promise.all([
    getAllListingsHistory(1, largeLimit),
    getAllContactActivityHistory(1, largeLimit),
    getAllListingContactActivityHistory(1, largeLimit),
  ]);

  // Normalize and merge all activities
  const normalizedListingActivities = listingHistory.activities.map((activity) => ({
    ...activity,
    activityType: 'listing' as const,
    user: activity.user ? {
      id: activity.userId,
      name: activity.user.name,
      email: activity.user.email,
      firstName: null,
      lastName: null,
      image: null,
      initials: activity.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    } : null,
  }));

  const normalizedContactActivities = contactHistory.activities.map((activity) => ({
    ...activity,
    activityType: 'contact' as const,
  }));

  const normalizedListingContactActivities = listingContactHistory.activities.map((activity) => ({
    ...activity,
    activityType: 'listing_contact' as const,
  }));

  // Merge all activities
  let allActivities = [
    ...normalizedListingActivities,
    ...normalizedContactActivities,
    ...normalizedListingContactActivities,
  ];

  // Apply filters
  if (agentFilter.length > 0) {
    allActivities = allActivities.filter((activity) =>
      activity.user?.id && agentFilter.includes(activity.user.id)
    );
  }

  if (dateFrom || dateTo) {
    allActivities = allActivities.filter((activity) => {
      const activityDate = new Date(activity.createdAt);
      const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        if (activityDateOnly < fromDateOnly) return false;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        if (activityDateOnly > toDateOnly) return false;
      }
      
      return true;
    });
  }

  if (actionFilters.length > 0) {
    allActivities = allActivities.filter((activity) =>
      actionFilters.includes(activity.action)
    );
  }

  // Sort by createdAt (most recent first)
  allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate pagination based on filtered results
  const totalCount = allActivities.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get paginated slice
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedActivities = allActivities.slice(startIndex, endIndex);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de actividad</h1>
        <p className="text-gray-600">
          Registro completo de todos los cambios y eventos de todas las propiedades y contactos.
        </p>
      </div>

      <GlobalHistoryTimeline
        activities={paginatedActivities}
        currentPage={currentPage}
        totalPages={totalPages}
        agents={agents.map((a) => ({ id: a.id, name: a.name ?? `${a.firstName} ${a.lastName}`.trim() }))}
      />
    </div>
  );
}
