import { getAllListingsHistory } from "~/server/queries/listing-history";
import { GlobalHistoryTimeline } from "~/components/propiedades/detail/history/global-history-timeline";

interface HistorialPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function HistorialPage({ searchParams }: HistorialPageProps) {
  const unwrappedSearchParams = await searchParams;
  const currentPage = parseInt(unwrappedSearchParams.page ?? "1");

  // Fetch all listings history
  const historyData = await getAllListingsHistory(currentPage, 50);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de actividad</h1>
        <p className="text-gray-600">
          Registro completo de todos los cambios y eventos de todas las propiedades.
        </p>
      </div>

      <GlobalHistoryTimeline
        activities={historyData.activities}
        currentPage={currentPage}
        totalPages={historyData.totalPages}
      />
    </div>
  );
}
