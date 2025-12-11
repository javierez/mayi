import { notFound } from "next/navigation";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
} from "~/server/queries/listing";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { getSecureSession } from "~/lib/dal";
import { CartelEditorPhase1 } from "~/components/propiedades/detail/cartel/cartel-editor-phase";
import { getPropertyImages } from "~/server/queries/property_images";
import type { PropertyImage } from "~/lib/data";

interface CartelEditorPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CartelEditorPage({
  params,
}: CartelEditorPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);
  await getSecureSession();

  // Get data with optimized queries
  const [breadcrumbData, headerData] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
  ]);

  if (!breadcrumbData || !headerData) {
    notFound();
  }

  // Get images after we have headerData (all images, including inactive)
  const images = await getPropertyImages(headerData.propertyId, undefined).catch(() => []);

  return (
    <>
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Generador de Carteles",
          propertyId: headerData.listingId.toString(),
        }}
      />

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

      {/* Main Content */}
      <div className="mt-6">
        <CartelEditorPhase1
          listingId={unwrappedParams.id}
          images={images as PropertyImage[]}
        />
      </div>
    </>
  );
}
