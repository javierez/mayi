/**
 * Match Calculation Service
 *
 * Handles pre-calculation and storage of prospect-listing matches
 * for improved performance.
 *
 * This service:
 * 1. Reuses existing matching logic from connection-matches.ts
 * 2. Calculates matches for internal and cross-account scenarios
 * 3. Stores results in prospect_listing_matches table
 * 4. Provides batch insert with conflict handling
 */

import { db } from "~/server/db";
import { prospectListingMatches } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { getMatchesForProspects } from "./connection-matches";

// =====================================================
// Type Definitions
// =====================================================

export interface CalculateMatchesOptions {
  accountId?: bigint;
  prospectIds?: bigint[];
  listingIds?: bigint[];
  accountScope?: "current" | "cross-account";
}

export interface CalculateMatchesResult {
  success: boolean;
  matchesCalculated: number;
  matchesInserted: number;
  matchesMarkedStale: number;
  executionTime: number;
  errors: string[];
}

export interface RawMatchResult {
  prospectId: bigint;
  listingId: bigint;
  accountId: bigint;
  matchType: "strict" | "near-strict";
  toleranceReasons: string[];
  priceMatch: "exact" | "tolerance" | "out-of-range";
  isCrossAccount: boolean;
  crossAccountId: bigint | null;

  // Quality scores
  matchQualityScore: number | null;
  confidenceLevel: string | null;
  priceMatchScore: number | null;
  locationMatchScore: number | null;
  featureMatchScore: number | null;
  sizeMatchScore: number | null;
  urgencyScore: number | null;

  // Deviations
  priceDeviation: number | null;
  areaDeviation: number | null;
  bedroomDifference: number | null;
  bathroomDifference: number | null;

  // Location details
  locationMatchType: string | null;
  distanceKm: number | null;
  neighborhoodMatch: boolean | null;

  // Feature details
  missingFeatures: string[] | null;
  extraFeatures: string[] | null;
  featureMatchPercentage: number | null;

  // Time-sensitive factors
  prospectUrgency: number | null;
  daysUntilMoveIn: number | null;
  listingAgeInDays: number | null;
  isNewListing: boolean | null;

  // Pricing intelligence
  pricePerSqMeter: number | null;
  isGoodDeal: boolean | null;
  marketPriceDeviation: number | null;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract price deviation from tolerance reasons
 */
function extractPriceDeviation(toleranceReasons: string[]): number | null {
  if (!toleranceReasons || toleranceReasons.length === 0) return null;

  const priceReason = toleranceReasons.find((r) =>
    r ? r.toLowerCase().includes("price") : false
  );
  if (!priceReason) return null;

  const regex = /([+-]?\d+\.?\d*)%/;
  const match = regex.exec(priceReason);
  return match?.[1] ? parseFloat(match[1]) : null;
}

/**
 * Extract area deviation from tolerance reasons
 */
function extractAreaDeviation(toleranceReasons: string[]): number | null {
  if (!toleranceReasons || toleranceReasons.length === 0) return null;

  const areaReason = toleranceReasons.find((r) =>
    r ? r.toLowerCase().includes("area") : false
  );
  if (!areaReason) return null;

  const regex = /([+-]?\d+\.?\d*)%/;
  const match = regex.exec(areaReason);
  return match?.[1] ? parseFloat(match[1]) : null;
}

/**
 * Calculate overall match quality score (0-100)
 * Weighted average of individual scores
 */
function calculateMatchQualityScore(scores: {
  priceMatchScore?: number | null;
  locationMatchScore?: number | null;
  featureMatchScore?: number | null;
  sizeMatchScore?: number | null;
  urgencyScore?: number | null;
}): number {
  const weights = {
    price: 0.3,
    location: 0.3,
    features: 0.2,
    size: 0.1,
    urgency: 0.1,
  };

  let totalScore = 0;
  let totalWeight = 0;

  if (scores.priceMatchScore !== null && scores.priceMatchScore !== undefined) {
    totalScore += scores.priceMatchScore * weights.price;
    totalWeight += weights.price;
  }

  if (scores.locationMatchScore !== null && scores.locationMatchScore !== undefined) {
    totalScore += scores.locationMatchScore * weights.location;
    totalWeight += weights.location;
  }

  if (scores.featureMatchScore !== null && scores.featureMatchScore !== undefined) {
    totalScore += scores.featureMatchScore * weights.features;
    totalWeight += weights.features;
  }

  if (scores.sizeMatchScore !== null && scores.sizeMatchScore !== undefined) {
    totalScore += scores.sizeMatchScore * weights.size;
    totalWeight += weights.size;
  }

  if (scores.urgencyScore !== null && scores.urgencyScore !== undefined) {
    totalScore += scores.urgencyScore * weights.urgency;
    totalWeight += weights.urgency;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}

/**
 * Calculate price match score (0-100)
 * 100 = exact match, decreases with deviation
 */
function calculatePriceMatchScore(priceDeviation: number | null): number {
  if (priceDeviation === null) return 100;
  const absDeviation = Math.abs(priceDeviation);
  if (absDeviation === 0) return 100;
  if (absDeviation <= 2) return 95;
  if (absDeviation <= 5) return 85;
  if (absDeviation <= 10) return 70;
  return 50;
}


/**
 * Calculate confidence level based on quality score
 */
function calculateConfidenceLevel(qualityScore: number): string {
  if (qualityScore >= 85) return "high";
  if (qualityScore >= 65) return "medium";
  return "low";
}

/**
 * Calculate days until move-in from prospect's moveInBy date
 */
function calculateDaysUntilMoveIn(moveInBy: Date | null): number | null {
  if (!moveInBy) return null;
  const now = new Date();
  const diffTime = moveInBy.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate listing age in days
 */
function calculateListingAge(createdAt: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate price per square meter
 */
function calculatePricePerSqMeter(
  price: number,
  squareMeters: number | null
): number | null {
  if (!squareMeters || squareMeters <= 0) return null;
  return price / squareMeters;
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Calculate matches using existing logic
 * This is a wrapper that reuses the proven matching algorithm
 */
export async function calculateMatches(
  accountId: bigint,
  options: CalculateMatchesOptions
): Promise<RawMatchResult[]> {
  const startTime = Date.now();

  try {
    console.log("🔍 Starting match calculation...", {
      accountId: accountId.toString(),
      options,
    });

    // Call existing matching logic
    const result = await getMatchesForProspects({
      accountId,
      filters: {
        accountScope: options.accountScope ?? "current",
        includeNearStrict: true,
        propertyTypes: [],
        locationIds: [],
        prospectTypes: [],
        listingTypes: [],
        statuses: [],
        urgencyLevels: [],
      },
      pagination: {
        offset: 0,
        limit: 10000, // Large limit to get all matches
      },
    });

    // Transform to RawMatchResult format with enhanced fields
    const rawMatches: RawMatchResult[] = result.matches.map((match) => {
      const priceDeviation = extractPriceDeviation(match.toleranceReasons);
      const areaDeviation = extractAreaDeviation(match.toleranceReasons);

      // Calculate price match score
      const priceMatchScore = calculatePriceMatchScore(priceDeviation);

      // Calculate location match score (placeholder - will be enhanced)
      const locationMatchScore = 80; // Default for now

      // Calculate feature match score (placeholder - will be enhanced)
      const featureMatchScore = 85; // Default for now

      // Calculate size match score (placeholder - will be enhanced)
      const sizeMatchScore = 90; // Default for now

      // Calculate urgency score based on prospect urgency
      const prospectUrgency = match.prospect.prospects.urgencyLevel ?? 3;
      const urgencyScore = prospectUrgency * 20; // Scale 1-5 to 20-100

      // Calculate overall quality score
      const matchQualityScore = calculateMatchQualityScore({
        priceMatchScore,
        locationMatchScore,
        featureMatchScore,
        sizeMatchScore,
        urgencyScore,
      });

      // Calculate confidence level
      const confidenceLevel = calculateConfidenceLevel(matchQualityScore);

      // Calculate bedroom/bathroom differences
      const bedroomDifference =
        (match.listing.properties.bedrooms ?? 0) -
        (match.prospect.prospects.minBedrooms ?? 0);
      const bathroomDifference =
        (match.listing.properties.bathrooms ?? 0) -
        (match.prospect.prospects.minBathrooms ?? 0);

      // Calculate time-sensitive factors
      const daysUntilMoveIn = calculateDaysUntilMoveIn(
        match.prospect.prospects.moveInBy
      );
      const listingAgeInDays = calculateListingAge(match.listing.listings.createdAt);
      const isNewListing = listingAgeInDays <= 7;

      // Calculate price per square meter
      const pricePerSqMeter = calculatePricePerSqMeter(
        parseFloat(match.listing.listings.price),
        match.listing.properties.squareMeter
      );

      return {
        prospectId: match.prospectId,
        listingId: match.listingId,
        accountId: accountId,
        matchType: match.matchType,
        toleranceReasons: match.toleranceReasons,
        priceMatch: match.priceMatch,
        isCrossAccount: match.isCrossAccount,
        crossAccountId: match.listingAccountId,

        // Quality scores
        matchQualityScore,
        confidenceLevel,
        priceMatchScore,
        locationMatchScore,
        featureMatchScore,
        sizeMatchScore,
        urgencyScore,

        // Deviations
        priceDeviation,
        areaDeviation,
        bedroomDifference,
        bathroomDifference,

        // Location details (placeholders for now)
        locationMatchType: null,
        distanceKm: null,
        neighborhoodMatch: null,

        // Feature details (placeholders for now)
        missingFeatures: null,
        extraFeatures: null,
        featureMatchPercentage: null,

        // Time-sensitive factors
        prospectUrgency,
        daysUntilMoveIn,
        listingAgeInDays,
        isNewListing,

        // Pricing intelligence
        pricePerSqMeter,
        isGoodDeal: null, // TODO: Implement market comparison
        marketPriceDeviation: null, // TODO: Implement market comparison
      };
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Match calculation completed in ${executionTime}ms`, {
      matchesFound: rawMatches.length,
    });

    return rawMatches;
  } catch (error) {
    console.error("❌ Match calculation failed:", error);
    throw error;
  }
}

/**
 * Calculate matches and store them in the database
 * Marks existing matches as stale if clearStale=true
 */
export async function calculateAndStoreMatches(
  options: CalculateMatchesOptions & { clearStale?: boolean }
): Promise<CalculateMatchesResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let matchesMarkedStale = 0;
  let matchesInserted = 0;

  try {
    console.log("🚀 Starting calculateAndStoreMatches...", options);

    // Get account ID (required)
    if (!options.accountId) {
      throw new Error("accountId is required");
    }

    // Step 1: Mark existing matches as stale if requested
    if (options.clearStale) {
      console.log("🗑️ Marking existing matches as stale...");

      await db
        .update(prospectListingMatches)
        .set({
          isStale: true,
          staleReason: "recalculated",
          updatedAt: new Date(),
        })
        .where(eq(prospectListingMatches.accountId, options.accountId));

      // Count how many were marked stale
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(prospectListingMatches)
        .where(eq(prospectListingMatches.isStale, true));

      matchesMarkedStale = countResult[0]?.count ?? 0;
      console.log(`✅ Marked ${matchesMarkedStale} matches as stale`);
    }

    // Step 2: Calculate matches for internal (current account)
    console.log("🔍 Calculating internal matches...");
    const internalMatches = await calculateMatches(options.accountId, {
      ...options,
      accountScope: "current",
    });
    console.log(`Found ${internalMatches.length} internal matches`);

    // Step 3: Calculate matches for cross-account
    console.log("🌐 Calculating cross-account matches...");
    const crossAccountMatches = await calculateMatches(options.accountId, {
      ...options,
      accountScope: "cross-account",
    });
    console.log(`Found ${crossAccountMatches.length} cross-account matches`);

    // Step 4: Combine all matches
    const allMatches = [...internalMatches, ...crossAccountMatches];
    console.log(`📊 Total matches to insert: ${allMatches.length}`);

    // Step 5: Bulk insert matches (in batches of 500)
    const BATCH_SIZE = 500;
    for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
      const batch = allMatches.slice(i, i + BATCH_SIZE);

      try {
        const insertData = batch.map((match) => ({
          prospectId: match.prospectId,
          listingId: match.listingId,
          accountId: match.accountId,

          matchType: match.matchType,
          toleranceReasons: match.toleranceReasons,
          priceMatch: match.priceMatch,
          isCrossAccount: match.isCrossAccount,
          crossAccountId: match.crossAccountId,

          // Quality scores
          matchQualityScore: match.matchQualityScore,
          confidenceLevel: match.confidenceLevel,
          priceMatchScore: match.priceMatchScore,
          locationMatchScore: match.locationMatchScore,
          featureMatchScore: match.featureMatchScore,
          sizeMatchScore: match.sizeMatchScore,
          urgencyScore: match.urgencyScore,

          // Deviations
          priceDeviation: match.priceDeviation?.toString() ?? null,
          areaDeviation: match.areaDeviation?.toString() ?? null,
          bedroomDifference: match.bedroomDifference,
          bathroomDifference: match.bathroomDifference,

          // Location details
          locationMatchType: match.locationMatchType,
          distanceKm: match.distanceKm?.toString() ?? null,
          neighborhoodMatch: match.neighborhoodMatch,

          // Feature details
          missingFeatures: match.missingFeatures,
          extraFeatures: match.extraFeatures,
          featureMatchPercentage: match.featureMatchPercentage,

          // Time-sensitive factors
          prospectUrgency: match.prospectUrgency,
          daysUntilMoveIn: match.daysUntilMoveIn,
          listingAgeInDays: match.listingAgeInDays,
          isNewListing: match.isNewListing,

          // Pricing intelligence
          pricePerSqMeter: match.pricePerSqMeter?.toString() ?? null,
          isGoodDeal: match.isGoodDeal,
          marketPriceDeviation: match.marketPriceDeviation?.toString() ?? null,

          // Timestamps
          calculatedAt: new Date(),
          firstCalculatedAt: new Date(),
          isStale: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Check if unique constraint exists, if not do simple insert
        try {
          await db
            .insert(prospectListingMatches)
            .values(insertData)
            .onConflictDoUpdate({
              target: [
                prospectListingMatches.prospectId,
                prospectListingMatches.listingId,
              ],
              set: {
                matchType: sql`excluded.match_type`,
                toleranceReasons: sql`excluded.tolerance_reasons`,
                priceMatch: sql`excluded.price_match`,
                isCrossAccount: sql`excluded.is_cross_account`,
                crossAccountId: sql`excluded.cross_account_id`,
                matchQualityScore: sql`excluded.match_quality_score`,
                confidenceLevel: sql`excluded.confidence_level`,
                priceMatchScore: sql`excluded.price_match_score`,
                locationMatchScore: sql`excluded.location_match_score`,
                featureMatchScore: sql`excluded.feature_match_score`,
                sizeMatchScore: sql`excluded.size_match_score`,
                urgencyScore: sql`excluded.urgency_score`,
                priceDeviation: sql`excluded.price_deviation`,
                areaDeviation: sql`excluded.area_deviation`,
                bedroomDifference: sql`excluded.bedroom_difference`,
                bathroomDifference: sql`excluded.bathroom_difference`,
                locationMatchType: sql`excluded.location_match_type`,
                distanceKm: sql`excluded.distance_km`,
                neighborhoodMatch: sql`excluded.neighborhood_match`,
                prospectUrgency: sql`excluded.prospect_urgency`,
                daysUntilMoveIn: sql`excluded.days_until_move_in`,
                listingAgeInDays: sql`excluded.listing_age_in_days`,
                isNewListing: sql`excluded.is_new_listing`,
                pricePerSqMeter: sql`excluded.price_per_sq_meter`,
                calculatedAt: sql`excluded.calculated_at`,
                isStale: false,
                updatedAt: new Date(),
              },
            });
        } catch (conflictError: unknown) {
          // If unique constraint doesn't exist, do simple insert
          if (
            conflictError instanceof Error &&
            conflictError.message.includes("no unique or exclusion constraint")
          ) {
            console.warn("⚠️ Unique constraint not found, doing simple insert (duplicates possible)");
            await db.insert(prospectListingMatches).values(insertData);
          } else {
            throw conflictError;
          }
        }

        matchesInserted += batch.length;
        console.log(
          `✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allMatches.length / BATCH_SIZE)}`
        );
      } catch (batchError) {
        console.error(`❌ Error inserting batch:`, batchError);
        errors.push(`Batch ${i}-${i + BATCH_SIZE}: ${String(batchError)}`);
      }
    }

    const executionTime = Date.now() - startTime;

    const result: CalculateMatchesResult = {
      success: errors.length === 0,
      matchesCalculated: allMatches.length,
      matchesInserted,
      matchesMarkedStale,
      executionTime,
      errors,
    };

    console.log("🎉 calculateAndStoreMatches completed:", result);

    return result;
  } catch (error) {
    console.error("💥 calculateAndStoreMatches failed:", error);

    return {
      success: false,
      matchesCalculated: 0,
      matchesInserted: 0,
      matchesMarkedStale,
      executionTime: Date.now() - startTime,
      errors: [String(error)],
    };
  }
}
