/**
 * Utility functions for bidirectional fallback between squareMeter and builtSurfaceArea
 */

type AreaFields = {
  squareMeter?: number | null;
  builtSurfaceArea?: string | number | null;
};

/**
 * Get squareMeter with builtSurfaceArea as fallback
 */
export function getSquareMeter(listing: AreaFields): number | null {
  const sqm = listing.squareMeter;
  if (sqm !== null && sqm !== undefined && sqm > 0) {
    return sqm;
  }

  const built = listing.builtSurfaceArea;
  if (built !== null && built !== undefined) {
    const num = typeof built === "string" ? parseFloat(built) : built;
    if (!isNaN(num) && num > 0) {
      return Math.round(num);
    }
  }

  return null;
}

/**
 * Get builtSurfaceArea with squareMeter as fallback
 */
export function getBuiltSurfaceArea(listing: AreaFields): number | null {
  const built = listing.builtSurfaceArea;
  if (built !== null && built !== undefined) {
    const num = typeof built === "string" ? parseFloat(built) : built;
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }

  const sqm = listing.squareMeter;
  if (sqm !== null && sqm !== undefined && sqm > 0) {
    return sqm;
  }

  return null;
}

/**
 * Get area value for display (prefers squareMeter, falls back to builtSurfaceArea)
 */
export function getDisplayArea(listing: AreaFields): number | null {
  return getSquareMeter(listing);
}
