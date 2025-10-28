/**
 * Geographic distance calculation utilities using Haversine formula
 * For matching properties within proximity of prospect preferred areas
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance;
}

/**
 * Check if two coordinates are within a specified radius
 * @param coord1 - First coordinate pair
 * @param coord2 - Second coordinate pair
 * @param radiusKm - Radius in kilometers (default 0.5km)
 * @returns True if within radius, false otherwise
 */
export function isWithinRadius(
  coord1: Coordinates,
  coord2: Coordinates,
  radiusKm = 0.5,
): boolean {
  const distance = calculateHaversineDistance(
    coord1.latitude,
    coord1.longitude,
    coord2.latitude,
    coord2.longitude,
  );

  return distance <= radiusKm;
}

/**
 * Calculate distance and check if within radius in one call
 * @param coord1 - First coordinate pair
 * @param coord2 - Second coordinate pair
 * @param radiusKm - Radius in kilometers (default 0.5km)
 * @returns Object with distance and withinRadius boolean
 */
export function calculateDistanceWithRadius(
  coord1: Coordinates,
  coord2: Coordinates,
  radiusKm = 0.5,
): { distance: number; withinRadius: boolean } {
  const distance = calculateHaversineDistance(
    coord1.latitude,
    coord1.longitude,
    coord2.latitude,
    coord2.longitude,
  );

  return {
    distance,
    withinRadius: distance <= radiusKm,
  };
}

/**
 * Get the minimum distance from a point to a list of target coordinates
 * @param point - Source coordinate
 * @param targets - Array of target coordinates
 * @returns Minimum distance in kilometers, or null if targets is empty
 */
export function getMinimumDistance(
  point: Coordinates,
  targets: Coordinates[],
): number | null {
  if (targets.length === 0) return null;

  const distances = targets.map((target) =>
    calculateHaversineDistance(
      point.latitude,
      point.longitude,
      target.latitude,
      target.longitude,
    ),
  );

  return Math.min(...distances);
}

/**
 * Check if a point is within radius of any target coordinates
 * @param point - Source coordinate
 * @param targets - Array of target coordinates
 * @param radiusKm - Radius in kilometers (default 0.5km)
 * @returns True if within radius of at least one target
 */
export function isNearAnyTarget(
  point: Coordinates,
  targets: Coordinates[],
  radiusKm = 0.5,
): boolean {
  if (targets.length === 0) return false;

  return targets.some((target) => isWithinRadius(point, target, radiusKm));
}
