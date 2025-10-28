import { notFound } from "next/navigation";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
  getListingDocumentsData,
} from "~/server/queries/listing";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { DocumentsSection } from "~/components/propiedades/detail/documents-section";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentacionInicialPage({
  params,
}: DocumentPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);

  // Get data with optimized queries
  const [breadcrumbData, headerData, documentsData] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
    getListingDocumentsData(listingId),
  ]);

  if (!breadcrumbData || !headerData || !documentsData) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Documentación Inicial",
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

      {/* Section header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Documentación Inicial
        </h3>
        <p className="text-gray-600">
          Gestiona todos los documentos iniciales de la propiedad y genera la
          hoja de encargo.
        </p>
      </div>

      <DocumentsSection
        listing={documentsData}
        folderType="documentacion-inicial"
      />
    </div>
  );
}
