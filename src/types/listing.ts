/**
 * Represents a combined view of listing data including property details, location, and images
 * This type is used for displaying listing information in the UI
 */
export type ListingType =
  | "Sale" // Venta
  | "Rent" // Alquiler
  | "RentWithOption" // Alquiler con opción a compra
  | "RoomSharing" // Compartir habitación
  | "Transfer"; // Transferencia

export type ListingOverview = {
  // Essential fields (always present)
  listingId: bigint;
  agentName: string | null;
  price: string;
  listingType: ListingType;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  builtSurfaceArea: number | null;
  city: string | null;
  imageUrl: string | null;
  referenceNumber: string | null;

  // View-specific fields (conditional presence)
  ownerId?: bigint | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  title?: string | null;
  propertyId?: bigint;
  agentId?: string;
  status: string; // Now always included in queries
  isActive?: boolean | null;
  isFeatured?: boolean | null;
  isBankOwned?: boolean | null;
  publishToWebsite?: boolean | null;
  viewCount?: number | null;
  inquiryCount?: number | null;
  street?: string | null;
  addressDetails?: string | null;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  province?: string | null;
  municipality?: string | null;
  neighborhood?: string | null;
  s3key?: string | null;
  imageUrl2?: string | null;
  s3key2?: string | null;
};
