import type { LocationMemoryForMap, GeotaggedMemoryForMap } from "~/types/memoria";

interface MemoriaLocationCardProps {
  location: LocationMemoryForMap;
}

// Gradient colors by memory type
const TYPE_GRADIENTS = {
  location: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", // Pink to Purple
  photo: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",    // Blue to Cyan
  video: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",    // Purple to Pink
} as const;

// Type labels in Spanish
const TYPE_LABELS = {
  location: "Lugar",
  photo: "Foto",
  video: "Video",
} as const;

/**
 * Format date string to Spanish locale
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Returns HTML string for Google Maps InfoWindow popup
 * Displays location memory with photo, name, date and links to day detail
 */
export function MemoriaLocationCard({ location }: MemoriaLocationCardProps): string {
  const imageUrl = location.thumbnailUrl ?? location.locationData.photoUrl ?? "";
  const locationName = location.locationData.name;
  const formattedDate = formatDate(location.date);
  const dayUrl = `/memoria/dia/${location.date}`;
  const caption = location.caption ?? "";

  return `
    <div style="width: 280px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <a href="${dayUrl}" style="text-decoration: none; color: inherit; display: block;">
        <div style="position: relative; height: 160px; background: ${TYPE_GRADIENTS.location};">
          ${
            imageUrl
              ? `<img
              src="${imageUrl}"
              alt="${locationName}"
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.style.display='none'"
            />`
              : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              <svg style="width: 48px; height: 48px; color: white; opacity: 0.8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>`
          }
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%); padding: 12px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: white; line-height: 1.3; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
              ${locationName}
            </h3>
          </div>
        </div>
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: ${caption ? "8px" : "0"};">
            <svg style="width: 14px; height: 14px; color: #9ca3af; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="16" y1="2" x2="16" y2="6"></line>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" y1="2" x2="8" y2="6"></line>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span style="font-size: 13px; color: #6b7280;">${formattedDate}</span>
          </div>
          ${
            caption
              ? `<p style="margin: 0; font-size: 13px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${caption}
            </p>`
              : ""
          }
        </div>
      </a>
    </div>
  `;
}

interface MemoriaGeotaggedCardProps {
  memory: GeotaggedMemoryForMap;
}

/**
 * Returns HTML string for Google Maps InfoWindow popup
 * Handles all geotagged memory types: location, photo, video
 */
export function MemoriaGeotaggedCard({ memory }: MemoriaGeotaggedCardProps): string {
  const formattedDate = formatDate(memory.date);
  const dayUrl = `/memoria/dia/${memory.date}`;
  const caption = memory.caption ?? "";

  // Determine display values based on type
  const imageUrl =
    memory.type === "location"
      ? memory.thumbnailUrl ?? memory.locationData?.photoUrl ?? ""
      : memory.thumbnailUrl ?? memory.url ?? "";

  const title =
    memory.type === "location" && memory.locationData
      ? memory.locationData.name
      : caption || `${TYPE_LABELS[memory.type]} - ${formattedDate}`;

  const gradient = TYPE_GRADIENTS[memory.type];
  const typeLabel = TYPE_LABELS[memory.type];

  // Icon SVG based on type
  const iconSvg =
    memory.type === "location"
      ? `<svg style="width: 48px; height: 48px; color: white; opacity: 0.8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>`
      : memory.type === "photo"
        ? `<svg style="width: 48px; height: 48px; color: white; opacity: 0.8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle stroke-linecap="round" stroke-linejoin="round" stroke-width="2" cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="21 15 16 10 5 21"></polyline>
          </svg>`
        : `<svg style="width: 48px; height: 48px; color: white; opacity: 0.8;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polygon stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="23 7 16 12 23 17 23 7"></polygon>
            <rect stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>`;

  return `
    <div style="width: 280px; font-family: system-ui, -apple-system, sans-serif; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <a href="${dayUrl}" style="text-decoration: none; color: inherit; display: block;">
        <div style="position: relative; height: 160px; background: ${gradient};">
          ${
            imageUrl
              ? `<img
              src="${imageUrl}"
              alt="${title}"
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.style.display='none'"
            />`
              : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
              ${iconSvg}
            </div>`
          }
          <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); color: white; font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 500;">
            ${typeLabel}
          </div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%); padding: 12px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: white; line-height: 1.3; text-shadow: 0 1px 2px rgba(0,0,0,0.3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${title}
            </h3>
          </div>
        </div>
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg style="width: 14px; height: 14px; color: #9ca3af; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="16" y1="2" x2="16" y2="6"></line>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" y1="2" x2="8" y2="6"></line>
              <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span style="font-size: 13px; color: #6b7280;">${formattedDate}</span>
          </div>
        </div>
      </a>
    </div>
  `;
}
