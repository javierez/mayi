"use server";
import { db } from "../db";
import { locations } from "../db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import type { Location } from "../../lib/data";
import { normalizeSearchText } from "../../lib/search-utils";

// Interface for location data from geocoding
interface LocationData {
  city: string;
  province: string;
  municipality: string;
  neighborhood: string;
  latitude?: string;
  longitude?: string;
}

// Find existing location or create new one and return neighborhood ID
// Uses only city and neighborhood for lookup to avoid duplicates from province/municipality variations
export async function findOrCreateLocation(
  locationData: LocationData,
): Promise<number> {
  try {
    // Look for existing location using only city and neighborhood
    const existingLocation = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.city, locationData.city),
          eq(locations.neighborhood, locationData.neighborhood),
        ),
      )
      .limit(1);

    if (existingLocation.length > 0 && existingLocation[0]) {
      // Update the existing location with new province/municipality/coordinates data
      await db
        .update(locations)
        .set({
          province: locationData.province,
          municipality: locationData.municipality,
          ...(locationData.latitude && { latitude: locationData.latitude }),
          ...(locationData.longitude && { longitude: locationData.longitude }),
          updatedAt: new Date(),
        })
        .where(
          eq(locations.neighborhoodId, existingLocation[0].neighborhoodId),
        );

      console.log(
        "🔄 Updated existing location:",
        existingLocation[0].neighborhoodId,
      );
      return Number(existingLocation[0].neighborhoodId);
    }

    // Create new location if none found
    await db.insert(locations).values({
      city: locationData.city,
      province: locationData.province,
      municipality: locationData.municipality,
      neighborhood: locationData.neighborhood,
      ...(locationData.latitude && { latitude: locationData.latitude }),
      ...(locationData.longitude && { longitude: locationData.longitude }),
      isActive: true,
    });

    // Get the newly created location
    const [newLocation] = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.city, locationData.city),
          eq(locations.neighborhood, locationData.neighborhood),
        ),
      )
      .limit(1);

    if (!newLocation) {
      throw new Error("Failed to create new location");
    }

    console.log("🆕 Created new location:", newLocation.neighborhoodId);
    return Number(newLocation.neighborhoodId);
  } catch (error) {
    throw error;
  }
}

// Create a new location
export async function createLocation(
  data: Omit<Location, "createdAt" | "updatedAt">,
) {
  try {
    await db.insert(locations).values({
      ...data,
      isActive: true,
    });

    const [newLocation] = await db
      .select()
      .from(locations)
      .where(eq(locations.neighborhoodId, data.neighborhoodId));

    if (!newLocation) throw new Error("Failed to create location");
    return newLocation;
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
}

// Get location by neighborhood ID
export async function getLocationByNeighborhoodId(
  neighborhoodId: number | bigint,
) {
  try {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.neighborhoodId, BigInt(neighborhoodId)));
    return location;
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
}

// Get location by neighborhood name
export async function getLocationByNeighborhood(neighborhood: string) {
  try {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.neighborhood, neighborhood));
    return location;
  } catch (error) {
    console.error("Error fetching location by neighborhood:", error);
    throw error;
  }
}

// Update location
export async function updateLocation(
  neighborhoodId: bigint,
  data: Omit<Partial<Location>, "neighborhoodId">,
) {
  try {
    await db
      .update(locations)
      .set(data)
      .where(eq(locations.neighborhoodId, neighborhoodId));
    const [updatedLocation] = await db
      .select()
      .from(locations)
      .where(eq(locations.neighborhoodId, neighborhoodId));
    return updatedLocation;
  } catch (error) {
    console.error("Error updating location:", error);
    throw error;
  }
}

// Delete location
export async function deleteLocation(neighborhoodId: bigint) {
  try {
    await db
      .delete(locations)
      .where(eq(locations.neighborhoodId, neighborhoodId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
}

// List all locations (with pagination)
export async function listLocations(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    const allLocations = await db
      .select()
      .from(locations)
      .limit(limit)
      .offset(offset);
    return allLocations;
  } catch (error) {
    console.error("Error listing locations:", error);
    throw error;
  }
}

// Get locations by city
export async function getLocationsByCity(city: string) {
  try {
    const cityLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.city, city));
    return cityLocations;
  } catch (error) {
    console.error("Error fetching locations by city:", error);
    throw error;
  }
}

// Get locations by province
export async function getLocationsByProvince(province: string) {
  try {
    const provinceLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.province, province));
    return provinceLocations;
  } catch (error) {
    console.error("Error fetching locations by province:", error);
    throw error;
  }
}

// Get locations by municipality
export async function getLocationsByMunicipality(municipality: string) {
  try {
    const municipalityLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.municipality, municipality));
    return municipalityLocations;
  } catch (error) {
    console.error("Error fetching locations by municipality:", error);
    throw error;
  }
}

// Check if location exists (using only city and neighborhood)
export async function locationExists(
  locationData: LocationData,
): Promise<boolean> {
  try {
    const existingLocation = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.city, locationData.city),
          eq(locations.neighborhood, locationData.neighborhood),
        ),
      )
      .limit(1);

    return existingLocation.length > 0;
  } catch (error) {
    throw error;
  }
}

// Get all unique cities
export async function getAllCities() {
  try {
    const cities = await db
      .selectDistinct({ city: locations.city })
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(locations.city);
    return cities.map((c) => c.city);
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
}

// Get unique cities from properties belonging to a specific account
export async function getCitiesFromAccountProperties(accountId: number) {
  try {
    const { properties } = await import("../db/schema");
    const cities = await db
      .selectDistinct({ city: locations.city })
      .from(locations)
      .innerJoin(
        properties,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(locations.isActive, true),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(locations.city);
    return cities.map((c) => c.city);
  } catch (error) {
    console.error("Error fetching cities from account properties:", error);
    throw error;
  }
}

// Get all neighborhoods for a specific city
export async function getNeighborhoodsByCity(city: string) {
  try {
    const neighborhoods = await db
      .select({
        neighborhoodId: locations.neighborhoodId,
        neighborhood: locations.neighborhood,
        municipality: locations.municipality,
        province: locations.province,
      })
      .from(locations)
      .where(and(eq(locations.city, city), eq(locations.isActive, true)))
      .orderBy(locations.neighborhood);
    return neighborhoods;
  } catch (error) {
    console.error("Error fetching neighborhoods by city:", error);
    throw error;
  }
}

// Get all locations for selection (with search capability)
export async function getAllLocationsForSelection() {
  try {
    const allLocations = await db
      .select({
        neighborhoodId: locations.neighborhoodId,
        neighborhood: locations.neighborhood,
        city: locations.city,
        municipality: locations.municipality,
        province: locations.province,
      })
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(locations.city, locations.neighborhood);
    return allLocations;
  } catch (error) {
    console.error("Error fetching all locations for selection:", error);
    throw error;
  }
}

// Get unique cities from current user's account properties (with auth)
export async function getCitiesFromAccountPropertiesWithAuth() {
  try {
    const { getCurrentUserAccountId } = await import("../../lib/dal");
    const accountId = await getCurrentUserAccountId();
    return getCitiesFromAccountProperties(accountId);
  } catch (error) {
    console.error(
      "Error fetching cities from account properties with auth:",
      error,
    );
    throw error;
  }
}

// Search neighborhoods by partial match (for autocomplete)
// Returns matching neighborhoods with their city for display
export async function searchNeighborhoods(query: string, limit = 10) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Use normalized search for case-insensitive and accent-insensitive matching
    const normalizedQuery = normalizeSearchText(query);
    const searchTerm = `%${normalizedQuery}%`;
    const prefixSearchTerm = `${normalizedQuery}%`;

    const results = await db
      .select({
        neighborhoodId: locations.neighborhoodId,
        neighborhood: locations.neighborhood,
        city: locations.city,
        municipality: locations.municipality,
        province: locations.province,
      })
      .from(locations)
      .where(
        and(
          eq(locations.isActive, true),
          or(
            sql`LOWER(${locations.neighborhood}) LIKE ${searchTerm}`,
            sql`LOWER(${locations.city}) LIKE ${searchTerm}`,
          ),
        ),
      )
      .orderBy(
        // Prioritize exact matches at the start
        sql`CASE WHEN LOWER(${locations.neighborhood}) LIKE ${prefixSearchTerm} THEN 0 ELSE 1 END`,
        locations.neighborhood,
        locations.city,
      )
      .limit(limit);

    return results;
  } catch (error) {
    console.error("Error searching neighborhoods:", error);
    throw error;
  }
}
