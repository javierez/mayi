import type { ListingOverview } from "~/types/listing";

interface PropertyMapCardProps {
  listing: ListingOverview;
}

export function PropertyMapCard({ listing }: PropertyMapCardProps) {
  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat("es-ES").format(numPrice);
  };

  const getPropertyTypeLabel = (type: string | null): string => {
    switch (type) {
      case "piso":
        return "Piso";
      case "casa":
        return "Casa";
      case "local":
        return "Local";
      case "solar":
        return "Solar";
      case "garaje":
        return "Garaje";
      default:
        return type ?? "Propiedad";
    }
  };

  const formatListingType = (type: string): string => {
    switch (type) {
      case "Sale":
        return "En Venta";
      case "Rent":
        return "En Alquiler";
      case "RentWithOption":
        return "Alquiler con Opción";
      case "RoomSharing":
        return "Compartir Habitación";
      case "Transfer":
        return "Traspaso";
      default:
        return type;
    }
  };

  const imageUrl = listing.imageUrl ?? "";
  const price = formatPrice(listing.price);
  const bedrooms = listing.bedrooms ?? "-";
  const bathrooms = listing.bathrooms
    ? Math.floor(Number(listing.bathrooms))
    : "-";
  const sqm = listing.squareMeter ?? "-";
  const listingUrl = `/propiedades/${listing.listingId}`;
  const propertyTypeLabel = getPropertyTypeLabel(listing.propertyType);
  const listingTypeLabel = formatListingType(listing.listingType);
  const city = listing.city ?? "";
  const showBedroomsBaths =
    listing.propertyType !== "solar" &&
    listing.propertyType !== "garaje" &&
    listing.propertyType !== "local";
  const isRent = ["Rent", "RentWithOption", "RoomSharing"].includes(
    listing.listingType,
  );

  return `
    <div style="width: 300px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative;">
      <a href="${listingUrl}" style="text-decoration: none; color: inherit; display: block;">
        <div style="position: relative; height: 200px; background: #f3f4f6;">
          ${
            imageUrl
              ? `<img
            src="${imageUrl}"
            alt="Property"
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'"
          />`
              : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 48px;">${propertyTypeLabel[0]}</div>`
          }
          <div style="position: absolute; top: 8px; left: 8px; background: rgba(255,255,255,0.9); padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid #e5e7eb;">
            ${propertyTypeLabel}
          </div>
          <div style="position: absolute; top: 8px; right: 8px; background: hsl(var(--primary)); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
            ${listingTypeLabel}
          </div>
          ${
            listing.referenceNumber
              ? `<div style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255,255,255,0.9); text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
            ${listing.referenceNumber}
          </div>`
              : ""
          }
        </div>
        <div style="padding: 12px;">
          <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 4px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${listing.title ?? `${propertyTypeLabel} en ${city}`}
            </h3>
            <p style="margin: 0; font-size: 16px; font-weight: 700; white-space: nowrap; margin-left: 8px;">
              ${price}€${isRent ? "/mes" : ""}
            </p>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 8px; color: #6b7280; font-size: 12px;">
            <svg style="width: 14px; height: 14px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${city}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; gap: 8px;">
            ${
              showBedroomsBaths
                ? `
              <div style="display: flex; align-items: center;">
                <svg style="width: 14px; height: 14px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>${bedrooms} ${bedrooms === 1 ? "Hab" : "Habs"}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <svg style="width: 14px; height: 14px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 16h20v4H2v-4zM4 6h.01M7 6h10M4 10h16v6H4v-6z"/>
                </svg>
                <span>${bathrooms} ${bathrooms === 1 ? "Baño" : "Baños"}</span>
              </div>
            `
                : ""
            }
            <div style="display: flex; align-items: center;">
              <svg style="width: 14px; height: 14px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              <span>${sqm} m²</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  `;
}
