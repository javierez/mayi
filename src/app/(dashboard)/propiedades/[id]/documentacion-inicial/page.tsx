import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
  getListingDocumentsData,
} from "~/server/queries/listing";
import { checkExistingHojaEncargoAction } from "~/server/actions/hoja-encargo";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { DocumentsSection } from "~/components/propiedades/detail/documents-section";
import { Button } from "~/components/ui/button";
import { FilePlus, FileCheck, ChevronRight } from "lucide-react";

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
  const [breadcrumbData, headerData, documentsData, existingHojaEncargo] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
    getListingDocumentsData(listingId),
    checkExistingHojaEncargoAction(listingId),
  ]);

  if (!breadcrumbData || !headerData || !documentsData) {
    notFound();
  }

  const hasExistingHojaEncargo = existingHojaEncargo.success && existingHojaEncargo.exists;

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
      </div>

      {/* Hoja Encargo generation button */}
      <div className="mb-6">
        {hasExistingHojaEncargo ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              <FileCheck className="h-4 w-4" />
              <span>Hoja de Encargo generada</span>
            </div>
            <Link href={`/propiedades/${listingId}/hoja-encargo`}>
              <Button variant="outline" size="sm" className="rounded-2xl">
                Ver o regenerar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link href={`/propiedades/${listingId}/hoja-encargo`}>
            <Button variant="outline" className="rounded-2xl">
              <FilePlus className="mr-2 h-4 w-4" />
              Generar Hoja Encargo
            </Button>
          </Link>
        )}
      </div>

      <DocumentsSection
        listing={documentsData}
        folderType="documentacion-inicial"
      />
    </div>
  );
}
