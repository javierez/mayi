import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
  getListingDocumentsData,
} from "~/server/queries/listing";
import { getActiveDealForListingWithAuth } from "~/server/queries/deal";
import { checkExistingArrasContractAction } from "~/server/actions/arras";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { DocumentsSection } from "~/components/propiedades/detail/documents-section";
import { Card, CardContent } from "~/components/ui/card";
import { FileText, ChevronRight, FilePlus } from "lucide-react";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContratosPage({ params }: DocumentPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);

  // Get data with optimized queries
  const [breadcrumbData, headerData, documentsData, activeDeal] =
    await Promise.all([
      getListingBreadcrumbData(listingId),
      getListingHeaderData(listingId),
      getListingDocumentsData(listingId),
      getActiveDealForListingWithAuth(listingId),
    ]);

  if (!breadcrumbData || !headerData || !documentsData) {
    notFound();
  }

  // Check if arras contract already exists (only if there's an active deal)
  let existingArrasContract = null;
  if (activeDeal) {
    const arrasCheck = await checkExistingArrasContractAction(
      Number(activeDeal.dealId),
    );
    if (arrasCheck.success && arrasCheck.exists && arrasCheck.contract) {
      existingArrasContract = arrasCheck.contract;
    }
  }

  // Show "create arras" link only if deal exists but contract doesn't
  const showCreateArrasLink = activeDeal && !existingArrasContract;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Contratos",
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
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Contratos</h3>
        <p className="text-gray-600">
          Contrato de Arras, Escritura de compraventa.
        </p>
      </div>

      {/* Create Contrato de Arras link - only show if deal exists but contract doesn't */}
      {showCreateArrasLink && (
        <div className="mb-6">
          <Link
            href={`/propiedades/${listingId}/contrato-arras/${activeDeal.dealId}`}
          >
            <Card className="cursor-pointer border-dashed border-amber-300 bg-amber-50/50 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <FilePlus className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Generar Contrato de Arras
                    </h4>
                    <p className="text-sm text-gray-500">
                      Crear y firmar contrato de arras para esta operación
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      <DocumentsSection listing={documentsData} folderType="contratos" />
    </div>
  );
}
