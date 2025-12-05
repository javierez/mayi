/**
 * Adevinta Portal Configuration
 *
 * All these portals use the same Fotocasa API endpoint (imports.gw.fotocasa.pro).
 * - Fotocasa: Default destination (no PublicationId needed)
 * - Other portals: Require PublicationId in PropertyPublications array
 *
 * Important: Portals must be contracted/subscribed with Adevinta before enabling.
 */

export const ADEVINTA_PORTALS = {
  // Fotocasa is the default destination - no PublicationId needed
  fotocasa: {
    id: "fotocasa",
    publicationId: null, // Default destination, no PublicationId required
    publicationTypeId: null,
    name: "Fotocasa",
  },
  // pisos.com requires PublicationId
  pisoscom: {
    id: "pisoscom",
    publicationId: 31,
    publicationTypeId: 2,
    name: "Pisos.com",
  },
  spainhouses: {
    id: "spainhouses",
    publicationId: 1983,
    publicationTypeId: 2,
    name: "Spainhouses",
  },
  kyero: {
    id: "kyero",
    publicationId: 4539,
    publicationTypeId: 2,
    name: "Kyero",
  },
  thinkspain: {
    id: "thinkspain",
    publicationId: 10025,
    publicationTypeId: 2,
    name: "Think Spain",
  },
  listglobally: {
    id: "listglobally",
    publicationId: 32421,
    publicationTypeId: 2,
    name: "Listglobally Basic",
  },
} as const;

export type AdevintaPortalId = keyof typeof ADEVINTA_PORTALS;

export const ADEVINTA_PORTAL_IDS = Object.keys(
  ADEVINTA_PORTALS,
) as AdevintaPortalId[];

/**
 * Build PropertyPublications array for the Fotocasa API
 * Only includes portals with PublicationIds (excludes fotocasa which is the default)
 */
export function getPropertyPublications(enabledPortals: AdevintaPortalId[]) {
  return enabledPortals
    .filter((portalId) => ADEVINTA_PORTALS[portalId].publicationId !== null)
    .map((portalId) => {
      const portal = ADEVINTA_PORTALS[portalId];
      return {
        PublicationId: portal.publicationId as number,
        PublicationTypeId: portal.publicationTypeId as number,
      };
    });
}

/**
 * Check if a portal ID is an Adevinta portal
 */
export function isAdevintaPortal(portalId: string): portalId is AdevintaPortalId {
  return portalId in ADEVINTA_PORTALS;
}

/**
 * Check if any Adevinta portal is enabled (determines if we need to call the API)
 */
export function hasAnyAdevintaPortalEnabled(enabledPortals: AdevintaPortalId[]) {
  return enabledPortals.some((portalId) => portalId in ADEVINTA_PORTALS);
}
