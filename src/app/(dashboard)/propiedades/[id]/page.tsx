import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { PropertyTabsClientWrapper } from "~/components/propiedades/detail/property-page-client-wrapper";
import {
  getPropertyImages,
  getPropertyImagesCount,
  getPropertyVideos,
  getPropertyYouTubeLinks,
  getPropertyVirtualTours,
} from "~/server/queries/property_images";
import {
  getListingDetailsWithAuth,
  getListingBreadcrumbData,
  getListingHeaderData,
  getListingTabsData,
} from "~/server/queries/listing";
import { getEnergyCertificate } from "~/server/queries/document";
import type { PropertyImage } from "~/lib/data";
import { convertDbListingToPropertyListing } from "~/types/property-listing";
import { canEditProperties } from "~/app/actions/permissions/check-permissions";
import { getCurrentUser } from "~/lib/dal";
import { getAccountById } from "~/server/queries/accounts";
import { TaskPreferencesModalWrapper } from "~/components/propiedades/task-preferences-modal-wrapper";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    new?: string;
  }>;
}

export default async function PropertyPage({
  params,
  searchParams,
}: PropertyPageProps) {
  const unwrappedParams = await params;
  const unwrappedSearchParams = await searchParams;
  const listingId = parseInt(unwrappedParams.id);
  const isNewProperty = unwrappedSearchParams.new === "true";

  // Get current user and account data for task preferences modal
  const currentUser = await getCurrentUser();
  const accountData = currentUser?.accountId
    ? await getAccountById(currentUser.accountId)
    : null;

  // Default task preferences if account doesn't have them
  const defaultTaskPreferences = {
    property: {
      uploadPhotos: { enabled: true, dueDays: 7 },
      completeInfo: { enabled: true, dueDays: 7 },
      scheduleVisit: { enabled: true, dueDays: 10 },
      pickupKeys: { enabled: true, dueDays: 10 },
      valuation: { enabled: true, dueDays: 10 },
      createHojaEncargo: { enabled: true, dueDays: 12 },
      signHojaEncargo: { enabled: true, dueDays: 14 },
      generateCartel: { enabled: true, dueDays: 16 },
    },
  };

  const taskPreferences =
    (accountData?.taskPreferences as typeof defaultTaskPreferences) ??
    defaultTaskPreferences;

  // Get data with optimized queries, including permissions
  const [
    breadcrumbData,
    headerData,
    tabsData,
    fullListingDetails,
    hasEditPermission,
  ] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
    getListingTabsData(listingId),
    getListingDetailsWithAuth(listingId), // Now includes agent and owners data
    canEditProperties(), // Fetch edit permission
  ]);

  // Type guard to check if fullListingDetails is a valid record
  const isValidRecord = (obj: unknown): obj is Record<string, unknown> => {
    return (
      obj != null && typeof obj === "object" && Object.keys(obj).length > 0
    );
  };

  if (!breadcrumbData || !headerData || !tabsData) {
    notFound();
  }

  // Check if this is a draft listing and redirect to edit page
  if (
    isValidRecord(fullListingDetails) &&
    (fullListingDetails as { status?: string }).status === "Draft"
  ) {
    redirect(`/propiedades/crear/${listingId}`);
  }

  // Get energy certificate, images, videos, YouTube links, virtual tours, and image count in parallel
  const [
    energyCertificate,
    propertyImages,
    propertyVideos,
    propertyYouTubeLinks,
    propertyVirtualTours,
    imageCount,
  ] = await Promise.all([
    getEnergyCertificate(Number(headerData.propertyId)),
    getPropertyImages(BigInt(headerData.propertyId)),
    getPropertyVideos(BigInt(headerData.propertyId)),
    getPropertyYouTubeLinks(BigInt(headerData.propertyId)),
    getPropertyVirtualTours(BigInt(headerData.propertyId)),
    getPropertyImagesCount(BigInt(headerData.propertyId)),
  ]);
  const defaultPlaceholder = "";

  // Process images to ensure they have valid URLs and match PropertyImage type
  const processedImages: PropertyImage[] = propertyImages.map((img) => ({
    propertyImageId: img.propertyImageId,
    propertyId: img.propertyId,
    referenceNumber: img.referenceNumber,
    imageUrl: img.imageUrl ?? defaultPlaceholder,
    isActive: img.isActive ?? true,
    createdAt: img.createdAt,
    updatedAt: img.updatedAt,
    imageKey: img.imageKey,
    imageTag: img.imageTag ?? undefined,
    s3key: img.s3key,
    imageOrder: img.imageOrder,
    originImageId: img.originImageId ?? undefined,
  }));

  // Process videos to ensure they have valid URLs and match PropertyImage type
  const processedVideos: PropertyImage[] = propertyVideos.map((video) => ({
    propertyImageId: video.propertyImageId,
    propertyId: video.propertyId,
    referenceNumber: video.referenceNumber,
    imageUrl: video.imageUrl ?? defaultPlaceholder,
    isActive: video.isActive ?? true,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    imageKey: video.imageKey,
    imageTag: video.imageTag ?? undefined,
    s3key: video.s3key,
    imageOrder: video.imageOrder,
    originImageId: video.originImageId ?? undefined,
  }));

  // Process YouTube links to ensure they have valid URLs and match PropertyImage type
  const processedYouTubeLinks: PropertyImage[] = propertyYouTubeLinks.map(
    (link) => ({
      propertyImageId: link.propertyImageId,
      propertyId: link.propertyId,
      referenceNumber: link.referenceNumber,
      imageUrl: link.imageUrl ?? defaultPlaceholder,
      isActive: link.isActive ?? true,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      imageKey: link.imageKey,
      imageTag: link.imageTag ?? undefined,
      s3key: link.s3key,
      imageOrder: link.imageOrder,
      originImageId: link.originImageId ?? undefined,
    }),
  );

  // Process virtual tours to ensure they have valid URLs and match PropertyImage type
  const processedVirtualTours: PropertyImage[] = propertyVirtualTours.map(
    (tour) => ({
      propertyImageId: tour.propertyImageId,
      propertyId: tour.propertyId,
      referenceNumber: tour.referenceNumber,
      imageUrl: tour.imageUrl ?? defaultPlaceholder,
      isActive: tour.isActive ?? true,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      imageKey: tour.imageKey,
      imageTag: tour.imageTag ?? undefined,
      s3key: tour.s3key,
      imageOrder: tour.imageOrder,
      originImageId: tour.originImageId ?? undefined,
    }),
  );

  return (
    <>
      {/* Task Preferences Modal */}
      <TaskPreferencesModalWrapper
        showModal={isNewProperty}
        listingId={unwrappedParams.id}
        taskPreferences={taskPreferences}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PropertyBreadcrumb
          propertyType={breadcrumbData.propertyType ?? ""}
          street={breadcrumbData.street ?? ""}
          referenceNumber={breadcrumbData.referenceNumber ?? ""}
        />

      {/* Property Title - Always Visible */}
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
        status={headerData.status}
        isBankOwned={headerData.isBankOwned ?? false}
        isFeatured={headerData.isFeatured ?? false}
        isOpportunity={headerData.isOpportunity ?? false}
        neighborhood=""
        dynamicTitle={false}
        listing={
          isValidRecord(fullListingDetails)
            ? { ...fullListingDetails, imageCount }
            : undefined
        }
      />

      {/* Property Tabs - Under Title */}
      <div className="pb-16">
        <Suspense
          fallback={<div className="py-8 text-center">Cargando...</div>}
        >
          <PropertyTabsClientWrapper
            listing={tabsData}
            convertedListing={
              isValidRecord(fullListingDetails)
                ? convertDbListingToPropertyListing(fullListingDetails)
                : undefined
            }
            images={processedImages}
            videos={processedVideos}
            youtubeLinks={processedYouTubeLinks}
            virtualTours={processedVirtualTours}
            energyCertificate={energyCertificate}
            canEdit={hasEditPermission}
          />
        </Suspense>
      </div>
    </div>
    </>
  );
}
