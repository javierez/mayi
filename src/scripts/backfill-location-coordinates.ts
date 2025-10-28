/**
 * Backfill script to populate coordinates for existing locations
 *
 * Usage:
 *   npx tsx src/scripts/backfill-location-coordinates.ts
 *
 * This script:
 * 1. Queries all locations without coordinates
 * 2. Fetches coordinates from Nominatim API for each
 * 3. Updates the locations table with coordinates
 * 4. Logs success/failure for manual review
 */

import { db } from "~/server/db";
import { locations } from "~/server/db/schema";
import { eq, isNull, or } from "drizzle-orm";

interface NominatimResponse {
  lat?: string;
  lon?: string;
  display_name?: string;
}

// Rate limiting: Nominatim requires 1 request per second
const DELAY_MS = 1100; // Slightly over 1 second to be safe

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCoordinatesFromNominatim(
  neighborhood: string,
  city: string,
  province: string,
): Promise<{ lat: string; lon: string } | null> {
  try {
    // Build search query: neighborhood, city, province, Spain
    const query = `${neighborhood}, ${city}, ${province}, Spain`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;

    console.log(`  🔍 Searching: ${query}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0; +backfill-script)",
      },
    });

    if (!response.ok) {
      console.error(`  ❌ HTTP error! status: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as NominatimResponse[];

    if (!data || data.length === 0) {
      console.warn(`  ⚠️  No results found`);
      return null;
    }

    const result = data[0];
    if (!result?.lat || !result?.lon) {
      console.warn(`  ⚠️  Invalid response data`);
      return null;
    }

    console.log(`  ✅ Found: ${result.display_name}`);
    return { lat: result.lat, lon: result.lon };
  } catch (error) {
    console.error(`  ❌ Error:`, error);
    return null;
  }
}

async function backfillLocationCoordinates() {
  console.log("🚀 Starting location coordinates backfill...\n");

  try {
    // Query all locations without coordinates
    const locationsWithoutCoords = await db
      .select({
        neighborhoodId: locations.neighborhoodId,
        neighborhood: locations.neighborhood,
        city: locations.city,
        province: locations.province,
        municipality: locations.municipality,
      })
      .from(locations)
      .where(
        or(
          isNull(locations.latitude),
          isNull(locations.longitude),
        ),
      );

    console.log(`📊 Found ${locationsWithoutCoords.length} locations without coordinates\n`);

    if (locationsWithoutCoords.length === 0) {
      console.log("✅ All locations already have coordinates!");
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ id: bigint; name: string; reason: string }> = [];

    // Process each location
    for (const [index, location] of locationsWithoutCoords.entries()) {
      console.log(
        `\n[${index + 1}/${locationsWithoutCoords.length}] Processing: ${location.neighborhood}, ${location.city}`,
      );

      // Fetch coordinates from Nominatim
      const coords = await fetchCoordinatesFromNominatim(
        location.neighborhood,
        location.city,
        location.province,
      );

      if (coords) {
        // Update database with coordinates
        try {
          await db
            .update(locations)
            .set({
              latitude: coords.lat,
              longitude: coords.lon,
              updatedAt: new Date(),
            })
            .where(eq(locations.neighborhoodId, location.neighborhoodId));

          successCount++;
          console.log(`  💾 Updated database with coordinates`);
        } catch (error) {
          failureCount++;
          failures.push({
            id: location.neighborhoodId,
            name: `${location.neighborhood}, ${location.city}`,
            reason: error instanceof Error ? error.message : "Database update failed",
          });
          console.error(`  ❌ Database update failed:`, error);
        }
      } else {
        failureCount++;
        failures.push({
          id: location.neighborhoodId,
          name: `${location.neighborhood}, ${location.city}`,
          reason: "Could not fetch coordinates from Nominatim",
        });
      }

      // Rate limiting: wait before next request
      if (index < locationsWithoutCoords.length - 1) {
        console.log(`  ⏳ Waiting ${DELAY_MS}ms (rate limiting)...`);
        await sleep(DELAY_MS);
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📈 Total processed: ${locationsWithoutCoords.length}`);

    if (failures.length > 0) {
      console.log("\n❌ FAILURES:");
      failures.forEach((failure, idx) => {
        console.log(`  ${idx + 1}. [ID: ${failure.id}] ${failure.name}`);
        console.log(`     Reason: ${failure.reason}`);
      });
      console.log("\n💡 You may need to manually add coordinates for these locations.");
    }

    console.log("\n✅ Backfill complete!");
  } catch (error) {
    console.error("\n❌ Fatal error during backfill:", error);
    process.exit(1);
  }
}

// Run the backfill
backfillLocationCoordinates()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Unhandled error:", error);
    process.exit(1);
  });
