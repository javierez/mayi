import { db } from "~/server/db";
import { listings, properties, documents } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";

/**
 * Get energy certificate data for a specific listing
 * Optimized query that only fetches fields needed by energy certificate components
 */
export async function getEnergyData(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const [energyData] = await db
      .select({
        // Core identifiers needed by energy certificate components
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        referenceNumber: properties.referenceNumber,

        // Energy certificate specific fields
        energyCertificateStatus: properties.energyCertificateStatus,
        energyConsumptionScale: properties.energyConsumptionScale,
        energyConsumptionValue: properties.energyConsumptionValue,
        emissionsScale: properties.emissionsScale,
        emissionsValue: properties.emissionsValue,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    if (!energyData) {
      throw new Error("Energy data not found");
    }

    return energyData;
  } catch (error) {
    console.error("Error fetching energy data:", error);
    throw error;
  }
}

/**
 * Get energy certificate document for a specific property
 * Returns the most recent active energy certificate document
 */
export async function getEnergyCertificateDocument(propertyId: number) {
  try {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.propertyId, BigInt(propertyId)),
          eq(documents.documentTag, "energy_certificate"),
          eq(documents.isActive, true),
        ),
      )
      .orderBy(desc(documents.uploadedAt));

    return document ?? null;
  } catch (error) {
    console.error("Error fetching energy certificate document:", error);
    throw error;
  }
}
