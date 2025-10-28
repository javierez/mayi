/**
 * Simple utility functions for handling images
 */

/**
 * Handles image loading errors
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
): void {
  const img = e.target as HTMLImageElement;
  img.onerror = null; // Prevent infinite loop
  // Use a data URI placeholder or hide the image instead of a 404-prone fallback
  img.src =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23374151' text-anchor='middle' dy='.3em'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
}
