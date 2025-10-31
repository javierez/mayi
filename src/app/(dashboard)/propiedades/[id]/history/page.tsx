import { notFound } from "next/navigation";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { HistoryTimeline } from "~/components/propiedades/detail/history/history-timeline";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
} from "~/server/queries/listing";
import { getListingHistory } from "~/server/queries/listing-history";

interface HistoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function HistoryPage({ params, searchParams }: HistoryPageProps) {
  const unwrappedParams = await params;
  const unwrappedSearchParams = await searchParams;
  const listingId = parseInt(unwrappedParams.id);
  const currentPage = parseInt(unwrappedSearchParams.page ?? "1");

  // Fetch breadcrumb, header data, and history in parallel
  const [breadcrumbData, headerData, historyData] =
    await Promise.all([
      getListingBreadcrumbData(listingId),
      getListingHeaderData(listingId),
      getListingHistory(listingId, currentPage, 50),
    ]);

  if (!breadcrumbData || !headerData) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Historial",
          propertyId: headerData.listingId.toString(),
        }}
      />

      {/* Property Title - Always Visible */}
      <PropertyHeader
        title={headerData.title ?? ""}
        propertyId={headerData.propertyId}
        listingId={headerData.listingId}
        street={headerData.street ?? ""}
        city={headerData.city ?? ""}
        province={headerData.province ?? ""}
        postalCode={headerData.postalCode ?? ""}
        price={headerData.price}
        listingType={headerData.listingType}
        status={headerData.status}
        isBankOwned={headerData.isBankOwned ?? false}
      />

      <HistoryTimeline
        activities={historyData.activities}
        currentPage={currentPage}
        totalPages={historyData.totalPages}
        listingId={listingId}
      />
    </div>
  );
}
