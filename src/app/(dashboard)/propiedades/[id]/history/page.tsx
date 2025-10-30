import { notFound } from "next/navigation";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { HistoryTimeline } from "~/components/propiedades/detail/history/history-timeline";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
} from "~/server/queries/listing";
import { getListingHistory } from "~/server/queries/listing-history";
import { canEditProperties } from "~/app/actions/permissions/check-permissions";

interface HistoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);

  // Fetch breadcrumb, header data, and history in parallel
  const [breadcrumbData, headerData, activities, hasEditPermission] =
    await Promise.all([
      getListingBreadcrumbData(listingId),
      getListingHeaderData(listingId),
      getListingHistory(listingId),
      canEditProperties(),
    ]);

  if (!breadcrumbData || !headerData) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? undefined}
        documentFolder={{ name: "Historial", propertyId: listingId.toString() }}
      />

      {/* Property Header */}
      <PropertyHeader
        title={headerData.title ?? ""}
        propertyId={headerData.propertyId}
        listingId={headerData.listingId}
        propertyType={breadcrumbData.propertyType ?? ""}
        street={headerData.street ?? ""}
        city={headerData.city ?? ""}
        province={headerData.province ?? ""}
        postalCode={headerData.postalCode ?? ""}
        price={headerData.price}
        listingType={headerData.listingType}
        status={headerData.status ?? undefined}
        isBankOwned={false}
        neighborhood=""
        dynamicTitle={false}
      />

      {/* Page Title and Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Historial de actividad</h2>
        <p className="text-muted-foreground">
          Registro completo de todos los cambios y eventos de esta propiedad
        </p>
      </div>

      {/* History Timeline */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <HistoryTimeline activities={activities} />
        </div>
      </div>
    </div>
  );
}
