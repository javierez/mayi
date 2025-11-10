import { notFound } from "next/navigation";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
} from "~/server/queries/listing";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { ImageStudioClientWrapper } from "~/components/propiedades/image-studio/image-studio-client-wrapper";
import { getSecureSession } from "~/lib/dal";
import { getPropertyImages } from "~/server/queries/property_images";
import type { PropertyImage } from "~/lib/data";

interface ImageStudioPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ImageStudioPage({
  params,
}: ImageStudioPageProps) {
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

  // Get images after we have headerData
  const images = await getPropertyImages(headerData.propertyId).catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Vesta Image Studio",
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
      <ImageStudioClientWrapper
        images={images as PropertyImage[]}
        title={headerData.title ?? ""}
      />
    </div>
  );
}
