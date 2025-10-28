import { notFound } from "next/navigation";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
} from "~/server/queries/listing";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { EnergyCertificatePage } from "~/components/propiedades/detail/energy-certificate-page";
import { getSecureSession } from "~/lib/dal";
import {
  getEnergyData,
  getEnergyCertificateDocument,
} from "~/server/queries/energy";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificadoEnergeticoPage({
  params,
}: DocumentPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);
  const session = await getSecureSession();

  // Get data with optimized queries
  const [breadcrumbData, headerData, energyData] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
    getEnergyData(listingId),
  ]);

  if (!breadcrumbData || !headerData || !energyData) {
    notFound();
  }

  // Get energy certificate document
  const energyCertificate = await getEnergyCertificateDocument(
    Number(headerData.propertyId),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Certificado Energético",
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

      <EnergyCertificatePage
        propertyId={headerData.propertyId}
        listingId={BigInt(listingId)}
        userId={session?.user?.id ?? "1"}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        uploadedDocument={
          energyCertificate
            ? {
                docId: energyCertificate.docId,
                documentKey: energyCertificate.documentKey,
                fileUrl: energyCertificate.fileUrl,
              }
            : null
        }
        energyCertificateStatus={energyData.energyCertificateStatus}
        energyConsumptionScale={energyData.energyConsumptionScale}
        energyConsumptionValue={
          energyData.energyConsumptionValue !== null &&
          energyData.energyConsumptionValue !== undefined
            ? parseFloat(energyData.energyConsumptionValue)
            : null
        }
        emissionsScale={energyData.emissionsScale}
        emissionsValue={
          energyData.emissionsValue !== null &&
          energyData.emissionsValue !== undefined
            ? parseFloat(energyData.emissionsValue)
            : null
        }
      />
    </div>
  );
}
