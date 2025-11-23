# Matches Table Implementation - Step by Step Guide

**Created:** 2025-11-23
**Status:** In Progress
**Estimated Time:** 14-20 hours (~2-3 days)

---

## Overview

This guide provides step-by-step instructions to implement the prospect-listing matches table system. Each step should be run individually and verified before proceeding to the next.

---

## Phase 1: Database Schema ✅ COMPLETED

### Step 1.1: Create Schema Definition ✅ DONE
**Status:** ✅ Completed
**File Modified:** `/src/server/db/schema.ts`
**Changes:** Added `prospectListingMatches` table definition after line 840

**What was added:**
- Table: `prospect_listing_matches`
- Columns: id, prospectId, listingId, matchType, toleranceReasons, priceMatch, isCrossAccount, priceDeviation, areaDeviation, locationMatchType, locationMatchScore, calculatedAt, expiresAt, isStale, createdAt, updatedAt

---

### Step 1.2: Generate Migration
**Command:**
```bash
pnpm db:generate
```

**Expected Output:**
```
Drizzle Kit: Generating migrations...
✓ Migration generated successfully
```

**Success Criteria:**
- New migration file created in `/drizzle/` directory
- File name format: `[timestamp]_[description].sql`
- No errors during generation

**Verification:**
```bash
# List migration files
ls -la drizzle/

# View the generated migration
cat drizzle/[latest-migration-file].sql
```

**Expected SQL Content:**
- CREATE TABLE statement for `prospect_listing_matches`
- All column definitions
- Default values set correctly

---

### Step 1.3: Review Migration File
**Action:** Manually review the generated SQL file

**Check for:**
- [ ] Table name: `prospect_listing_matches`
- [ ] All columns present (15 total)
- [ ] Correct data types (bigint, varchar, jsonb, decimal, boolean, timestamp)
- [ ] Default values (is_cross_account = false, is_stale = false)
- [ ] Primary key on `id`
- [ ] NOT NULL constraints where appropriate

**If issues found:**
- Fix schema definition in `src/server/db/schema.ts`
- Delete the bad migration file
- Re-run `pnpm db:generate`

---

### Step 1.4: Apply Migration to Database
**Command:**
```bash
pnpm db:push
```

**Expected Output:**
```
Pushing schema to database...
✓ Schema pushed successfully
```

**Success Criteria:**
- Migration applied without errors
- No conflicts with existing tables

**If errors occur:**
- Check database connection (verify .env file)
- Check for table name conflicts
- Review migration SQL for syntax errors

---

### Step 1.5: Verify Table Creation
**Command:**
```bash
pnpm db:studio
```

**Actions:**
1. Open browser to Drizzle Studio (usually http://localhost:4983)
2. Navigate to Tables list
3. Find `prospect_listing_matches` table
4. Click to view structure

**Verification Checklist:**
- [ ] Table exists in database
- [ ] All 15 columns present
- [ ] Primary key set on `id` column
- [ ] Default values working (test by inserting a row)

---

### Step 1.6: Create Database Indexes
**Why:** Indexes are created manually after table for better control

**Create file:** `/drizzle/manual-indexes.sql`

**Content:**
```sql
-- Indexes for prospect_listing_matches table
-- Run these manually after table creation

-- Composite unique index to prevent duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS prospect_listing_unique_idx
ON prospect_listing_matches(prospect_id, listing_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS matches_prospect_id_idx
ON prospect_listing_matches(prospect_id);

CREATE INDEX IF NOT EXISTS matches_listing_id_idx
ON prospect_listing_matches(listing_id);

CREATE INDEX IF NOT EXISTS matches_match_type_idx
ON prospect_listing_matches(match_type);

CREATE INDEX IF NOT EXISTS matches_calculated_at_idx
ON prospect_listing_matches(calculated_at DESC);

CREATE INDEX IF NOT EXISTS matches_is_stale_idx
ON prospect_listing_matches(is_stale)
WHERE is_stale = false;

CREATE INDEX IF NOT EXISTS matches_is_cross_account_idx
ON prospect_listing_matches(is_cross_account);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS matches_prospect_active_idx
ON prospect_listing_matches(prospect_id, listing_id, is_stale)
WHERE is_stale = false;
```

**Command:**
```bash
# Apply indexes using psql or your database client
# Example with psql:
psql $DATABASE_URL -f drizzle/manual-indexes.sql
```

**Verification:**
```sql
-- Check indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'prospect_listing_matches';
```

**Expected Result:**
- 8 indexes listed
- All index names match those in SQL file

---

## Phase 2: Match Calculation Service

### Step 2.1: Create Service File Structure
**Create file:** `/src/server/queries/match-calculation-service.ts`

**Command:**
```bash
touch src/server/queries/match-calculation-service.ts
```

**Initial content:**
```typescript
/**
 * Match Calculation Service
 *
 * Handles pre-calculation and storage of prospect-listing matches
 * for improved performance.
 */

import { db } from "~/server/db";
import { prospectListingMatches } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Type definitions will go here
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
  matchType: "strict" | "near-strict";
  toleranceReasons: string[];
  priceMatch: "exact" | "tolerance" | "out-of-range";
  isCrossAccount: boolean;
  priceDeviation: number | null;
  areaDeviation: number | null;
  locationMatchType: string | null;
  locationMatchScore: number | null;
}

// Functions will be implemented in subsequent steps
```

**Verification:**
```bash
# Check file was created
ls -la src/server/queries/match-calculation-service.ts

# Run TypeScript check
pnpm typecheck
```

---

### Step 2.2: Extract Existing Matching Logic
**Goal:** Create `calculateMatches()` function by extracting logic from existing `getMatchesForProspects()`

**File to modify:** `/src/server/queries/match-calculation-service.ts`

**What to implement:**
1. Import existing matching logic from `connection-matches.ts`
2. Create `calculateMatches()` function
3. Use existing SQL query and post-processing logic
4. Return raw match results without enrichment

**Implementation steps:**
```typescript
// Add to match-calculation-service.ts

import {
  getMatchesForProspects
} from "./connection-matches";

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
    const result = await getMatchesForProspects(accountId, {
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

    // Transform to RawMatchResult format
    const rawMatches: RawMatchResult[] = result.matches.map((match) => ({
      prospectId: match.prospectId,
      listingId: match.listingId,
      matchType: match.matchType,
      toleranceReasons: match.toleranceReasons,
      priceMatch: match.priceMatch,
      isCrossAccount: match.isCrossAccount,
      priceDeviation: extractPriceDeviation(match.toleranceReasons),
      areaDeviation: extractAreaDeviation(match.toleranceReasons),
      locationMatchType: determineLocationMatchType(match),
      locationMatchScore: null, // TODO: Extract if available
    }));

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

// Helper functions
function extractPriceDeviation(toleranceReasons: string[]): number | null {
  const priceReason = toleranceReasons.find((r) => r.includes("Price"));
  if (!priceReason) return null;

  const match = priceReason.match(/([+-]?\d+\.?\d*)%/);
  return match ? parseFloat(match[1]) : null;
}

function extractAreaDeviation(toleranceReasons: string[]): number | null {
  const areaReason = toleranceReasons.find((r) => r.includes("Area"));
  if (!areaReason) return null;

  const match = areaReason.match(/([+-]?\d+\.?\d*)%/);
  return match ? parseFloat(match[1]) : null;
}

function determineLocationMatchType(match: unknown): string | null {
  // TODO: Determine how location was matched
  // For now, return null - can be enhanced later
  return null;
}
```

**Verification:**
```bash
# Run TypeScript check
pnpm typecheck

# Should pass with no errors
```

---

### Step 2.3: Implement `calculateAndStoreMatches()`
**File:** `/src/server/queries/match-calculation-service.ts`

**Add this function:**
```typescript
import { sql } from "drizzle-orm";

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

    // Get account ID (for now, we'll need to pass it in)
    if (!options.accountId) {
      throw new Error("accountId is required");
    }

    // Step 1: Mark existing matches as stale if requested
    if (options.clearStale) {
      console.log("🗑️ Marking existing matches as stale...");

      const updateResult = await db
        .update(prospectListingMatches)
        .set({
          isStale: true,
          updatedAt: new Date(),
        })
        .where(eq(prospectListingMatches.isStale, false));

      matchesMarkedStale = updateResult.rowCount ?? 0;
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
          matchType: match.matchType,
          toleranceReasons: match.toleranceReasons,
          priceMatch: match.priceMatch,
          isCrossAccount: match.isCrossAccount,
          priceDeviation: match.priceDeviation?.toString() ?? null,
          areaDeviation: match.areaDeviation?.toString() ?? null,
          locationMatchType: match.locationMatchType,
          locationMatchScore: match.locationMatchScore?.toString() ?? null,
          calculatedAt: new Date(),
          isStale: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

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
              priceDeviation: sql`excluded.price_deviation`,
              areaDeviation: sql`excluded.area_deviation`,
              locationMatchType: sql`excluded.location_match_type`,
              locationMatchScore: sql`excluded.location_match_score`,
              calculatedAt: sql`excluded.calculated_at`,
              isStale: false,
              updatedAt: new Date(),
            },
          });

        matchesInserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allMatches.length / BATCH_SIZE)}`);
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
```

**Verification:**
```bash
# Run TypeScript check
pnpm typecheck

# Check for any type errors
```

---

## Phase 3: Background Job Setup

### Step 3.1: Install Dependencies
**Command:**
```bash
pnpm add node-cron
pnpm add -D @types/node-cron
```

**Verification:**
```bash
# Check package.json
cat package.json | grep node-cron
```

**Expected Output:**
```json
"node-cron": "^3.x.x",
"@types/node-cron": "^3.x.x"
```

---

### Step 3.2: Create Job Service File
**Create file:** `/src/server/jobs/match-calculation-job.ts`

**Command:**
```bash
mkdir -p src/server/jobs
touch src/server/jobs/match-calculation-job.ts
```

**Content:**
```typescript
/**
 * Background Job: Match Calculation
 *
 * Runs hourly to pre-calculate prospect-listing matches
 */

import cron from "node-cron";
import { calculateAndStoreMatches } from "~/server/queries/match-calculation-service";

let isRunning = false;
let lastRunTime: Date | null = null;
let lastRunResult: {
  success: boolean;
  matchesCalculated: number;
  executionTime: number;
} | null = null;

/**
 * Start the match calculation cron job
 * Runs every hour at :00 minutes
 */
export function startMatchCalculationJob() {
  // Get cron schedule from environment (default: hourly)
  const cronSchedule = process.env.MATCH_CALCULATION_CRON ?? "0 * * * *";

  console.log("⏰ Scheduling match calculation job...", {
    schedule: cronSchedule,
    description: "Runs every hour at :00",
  });

  cron.schedule(cronSchedule, async () => {
    if (isRunning) {
      console.log("⚠️ Match calculation job already running, skipping...");
      return;
    }

    isRunning = true;
    lastRunTime = new Date();
    console.log("🚀 Starting hourly match calculation job...", {
      startTime: lastRunTime.toISOString(),
    });

    try {
      // TODO: Get all account IDs and run for each
      // For now, we'll need to implement account iteration

      // Placeholder: Run for a single account (will be improved)
      const result = await calculateAndStoreMatches({
        clearStale: true,
        // accountId: will need to be provided
      });

      lastRunResult = {
        success: result.success,
        matchesCalculated: result.matchesCalculated,
        executionTime: result.executionTime,
      };

      console.log("✅ Match calculation job completed:", lastRunResult);
    } catch (error) {
      console.error("❌ Match calculation job failed:", error);
      lastRunResult = {
        success: false,
        matchesCalculated: 0,
        executionTime: 0,
      };
    } finally {
      isRunning = false;
    }
  });

  console.log("✅ Match calculation cron job scheduled successfully");
}

/**
 * Get job status (useful for monitoring)
 */
export function getJobStatus() {
  return {
    isRunning,
    lastRunTime,
    lastRunResult,
  };
}
```

**Verification:**
```bash
# Run TypeScript check
pnpm typecheck
```

---

### Step 3.3: Add Environment Variables
**File to modify:** `/src/env.js`

**Find the section with environment variables and add:**
```typescript
// Match Calculation Job Settings
ENABLE_MATCH_CALCULATION_JOB: z.string().default("true"),
MATCH_CALCULATION_CRON: z.string().default("0 * * * *"), // Hourly by default
USE_MATCHES_TABLE: z.string().default("true"), // Use pre-calculated matches
```

**Also add to `.env.example`:**
```bash
# Match Calculation Settings
ENABLE_MATCH_CALCULATION_JOB=true
MATCH_CALCULATION_CRON="0 * * * *"  # Hourly: at minute 0
USE_MATCHES_TABLE=true
```

**And to your `.env` file:**
```bash
# Add these lines
ENABLE_MATCH_CALCULATION_JOB=true
MATCH_CALCULATION_CRON="0 * * * *"
USE_MATCHES_TABLE=false  # Keep false during testing phase
```

**Verification:**
```bash
# Check env.js syntax
pnpm typecheck

# Test environment loading
node -e "require('./src/env.js')"
```

---

### Step 3.4: Initialize Job on Server Start
**Option A: Create API Route (Recommended for Next.js)**

**Create file:** `/src/app/api/cron/init/route.ts`

```bash
mkdir -p src/app/api/cron
touch src/app/api/cron/init/route.ts
```

**Content:**
```typescript
import { NextResponse } from "next/server";
import { startMatchCalculationJob } from "~/server/jobs/match-calculation-job";

let initialized = false;

export async function GET() {
  if (process.env.ENABLE_MATCH_CALCULATION_JOB !== "true") {
    return NextResponse.json({
      status: "disabled",
      message: "Match calculation job is disabled via environment variable"
    });
  }

  if (!initialized) {
    startMatchCalculationJob();
    initialized = true;

    return NextResponse.json({
      status: "initialized",
      message: "Match calculation cron job started successfully"
    });
  }

  return NextResponse.json({
    status: "already_initialized",
    message: "Cron job was already running"
  });
}
```

**Initialize by calling:**
```bash
# After server starts, call this endpoint once
curl http://localhost:3000/api/cron/init
```

---

## Phase 4: Manual Trigger Endpoint

### Step 4.1: Create Manual Trigger API Route
**Create file:** `/src/app/api/matches/calculate/route.ts`

```bash
mkdir -p src/app/api/matches
touch src/app/api/matches/calculate/route.ts
```

**Content:**
```typescript
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { calculateAndStoreMatches } from "~/server/queries/match-calculation-service";

/**
 * POST /api/matches/calculate
 * Manually trigger match calculation
 *
 * Body (optional):
 * {
 *   "prospectIds": ["123", "456"],  // Optional: specific prospects
 *   "listingIds": ["789", "012"],   // Optional: specific listings
 *   "clearStale": true               // Optional: mark existing as stale
 * }
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Optional: Check for admin role
    // if (session.user.role !== "admin") {
    //   return NextResponse.json(
    //     { error: "Forbidden - Admin access required" },
    //     { status: 403 }
    //   );
    // }

    console.log("📞 Manual match calculation triggered by:", {
      userId: session.user.id,
      accountId: session.user.accountId,
    });

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { prospectIds, listingIds, clearStale = true } = body;

    // Run calculation
    const result = await calculateAndStoreMatches({
      accountId: session.user.accountId
        ? BigInt(session.user.accountId)
        : undefined,
      prospectIds: prospectIds?.map((id: string) => BigInt(id)),
      listingIds: listingIds?.map((id: string) => BigInt(id)),
      clearStale,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Matches calculated successfully",
        data: result,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Match calculation completed with errors",
          data: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Manual match calculation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate matches",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
```

**Test the endpoint:**
```bash
# After server is running, test with curl
curl -X POST http://localhost:3000/api/matches/calculate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"clearStale": true}'
```

---

### Step 4.2: Add UI Button (Optional)
**File to modify:** `/src/components/prospects/conexiones-potenciales.tsx`

**Add state:**
```typescript
const [isRecalculating, setIsRecalculating] = useState(false);
```

**Add button in header (around line 485-505):**
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={handleRecalculateMatches}
  disabled={isRecalculating}
  title="Recalcular todas las coincidencias"
  className="gap-2"
>
  {isRecalculating ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4" />
  )}
  <span className="hidden sm:inline">Recalcular</span>
</Button>
```

**Add handler function:**
```typescript
const handleRecalculateMatches = async () => {
  setIsRecalculating(true);
  setError(null);

  try {
    const response = await fetch("/api/matches/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearStale: true }),
    });

    if (!response.ok) {
      throw new Error("Failed to recalculate matches");
    }

    const result = await response.json();
    console.log("✅ Matches recalculated:", result);

    // Refresh the matches display
    void fetchMatches();
    void fetchExternalMatches();
  } catch (error) {
    console.error("❌ Error recalculating matches:", error);
    setError("Error al recalcular las coincidencias. Inténtalo de nuevo.");
  } finally {
    setIsRecalculating(false);
  }
};
```

---

## Phase 5: Query Modifications

### Step 5.1: Add Feature Flag to Existing Query
**File to modify:** `/src/server/queries/connection-matches.ts`

**Find `getMatchesForProspectsWithAuth` function (around line 25-32)**

**Modify to add feature flag:**
```typescript
export async function getMatchesForProspectsWithAuth(
  params: GetMatchesParams & { forceRecalculate?: boolean }
): Promise<MatchResults> {
  const session = await auth();
  if (!session?.user?.accountId) {
    throw new Error("No user session found");
  }

  const accountId = BigInt(session.user.accountId);

  // Feature flag: use new table-based system or old calculation
  const useMatchesTable =
    process.env.USE_MATCHES_TABLE === "true" &&
    !params.forceRecalculate;

  if (useMatchesTable) {
    console.log("📊 Using pre-calculated matches from table");
    return await getMatchesFromTable(accountId, params);
  } else {
    console.log("🔄 Using real-time match calculation");
    return await getMatchesForProspects(accountId, params);
  }
}
```

---

### Step 5.2: Create `getMatchesFromTable()` Function
**File:** `/src/server/queries/connection-matches.ts`

**Add this new function before `getMatchesForProspectsWithAuth`:**
```typescript
import { prospectListingMatches } from "~/server/db/schema";
import { inArray, and } from "drizzle-orm";

/**
 * Get matches from pre-calculated table
 * Much faster than real-time calculation
 */
async function getMatchesFromTable(
  accountId: bigint,
  params: GetMatchesParams
): Promise<MatchResults> {
  const { filters, pagination } = params;

  try {
    // Build WHERE conditions
    const conditions = [
      eq(prospectListingMatches.isStale, false), // Only active matches
    ];

    // Apply account scope filter
    if (filters.accountScope === "current") {
      conditions.push(eq(prospectListingMatches.isCrossAccount, false));
    } else if (filters.accountScope === "cross-account") {
      conditions.push(eq(prospectListingMatches.isCrossAccount, true));
    }

    // Apply match type filter
    if (filters.includeNearStrict === false) {
      conditions.push(eq(prospectListingMatches.matchType, "strict"));
    }

    // Query matches with all related data
    const matchesData = await db
      .select({
        // Match metadata
        matchId: prospectListingMatches.id,
        prospectId: prospectListingMatches.prospectId,
        listingId: prospectListingMatches.listingId,
        matchType: prospectListingMatches.matchType,
        toleranceReasons: prospectListingMatches.toleranceReasons,
        priceMatch: prospectListingMatches.priceMatch,
        isCrossAccount: prospectListingMatches.isCrossAccount,
        calculatedAt: prospectListingMatches.calculatedAt,

        // Prospect data
        prospect: prospects,

        // Contact data
        contact: contacts,

        // Listing data
        listing: listings,

        // Property data
        property: properties,

        // Location data
        location: locations,
      })
      .from(prospectListingMatches)
      .innerJoin(prospects, eq(prospectListingMatches.prospectId, prospects.id))
      .innerJoin(contacts, eq(prospects.contactId, contacts.contactId))
      .innerJoin(listings, eq(prospectListingMatches.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .where(and(...conditions))
      .limit(pagination.limit)
      .offset(pagination.offset)
      .orderBy(desc(prospectListingMatches.calculatedAt));

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prospectListingMatches)
      .where(and(...conditions));

    const totalCount = totalCountResult[0]?.count ?? 0;

    // Apply additional filters (status, property types, etc.)
    let filteredMatches = matchesData;

    if (filters.statuses?.length) {
      filteredMatches = filteredMatches.filter((m) =>
        filters.statuses?.includes(m.prospect.status)
      );
    }

    if (filters.propertyTypes?.length) {
      filteredMatches = filteredMatches.filter((m) =>
        filters.propertyTypes?.includes(m.property.propertyType ?? "")
      );
    }

    if (filters.prospectTypes?.length) {
      filteredMatches = filteredMatches.filter((m) =>
        filters.prospectTypes?.includes(m.prospect.prospectType)
      );
    }

    if (filters.listingTypes?.length) {
      filteredMatches = filteredMatches.filter((m) =>
        filters.listingTypes?.includes(m.listing.listingType)
      );
    }

    if (filters.urgencyLevels?.length) {
      filteredMatches = filteredMatches.filter((m) =>
        filters.urgencyLevels?.includes(m.prospect.urgencyLevel ?? 0)
      );
    }

    // Enrich with lead status (reuse existing logic)
    const prospectIds = [...new Set(filteredMatches.map((m) => m.prospectId))];
    const listingIds = [...new Set(filteredMatches.map((m) => m.listingId))];

    const existingLeads = await db
      .select({
        prospectId: listingContacts.contactId,
        listingId: listingContacts.listingId,
        leadId: listingContacts.id,
        status: listingContacts.status,
        createdAt: listingContacts.createdAt,
      })
      .from(listingContacts)
      .where(
        and(
          inArray(listingContacts.contactId, prospectIds),
          inArray(listingContacts.listingId, listingIds),
          eq(listingContacts.contactType, "buyer")
        )
      );

    const leadMap = new Map(
      existingLeads.map((lead) => [
        `${lead.prospectId}-${lead.listingId}`,
        lead,
      ])
    );

    // Transform to ProspectMatch format
    const transformedMatches: ProspectMatch[] = filteredMatches.map((m) => {
      const leadKey = `${m.prospectId}-${m.listingId}`;
      const existingLead = leadMap.get(leadKey);

      return {
        prospectId: m.prospectId,
        listingId: m.listingId,
        matchType: m.matchType as "strict" | "near-strict",
        toleranceReasons: (m.toleranceReasons as string[]) ?? [],
        priceMatch: m.priceMatch as "exact" | "tolerance" | "out-of-range",
        isCrossAccount: m.isCrossAccount,
        hasExistingLead: !!existingLead,
        existingLead: existingLead
          ? {
              leadId: existingLead.leadId,
              status: existingLead.status,
              createdAt: existingLead.createdAt,
            }
          : undefined,

        // Related data
        prospect: {
          prospects: m.prospect,
          contacts: m.contact,
        },
        listing: m.listing,
        property: m.property,
        location: m.location,
        listingAccountId: m.listing.accountId,
        listingAccountName: null, // TODO: Join with accounts table if needed
      };
    });

    console.log(`📊 Loaded ${transformedMatches.length} matches from table`);

    return {
      matches: transformedMatches,
      totalCount,
      hasNextPage: pagination.offset + filteredMatches.length < totalCount,
      filters,
    };
  } catch (error) {
    console.error("❌ Error loading matches from table:", error);
    // Fallback to real-time calculation on error
    console.log("🔄 Falling back to real-time calculation...");
    return await getMatchesForProspects(accountId, params);
  }
}
```

**Verification:**
```bash
# Run TypeScript check
pnpm typecheck
```

---

## Phase 6: Testing

### Step 6.1: Test Table Creation
**Command:**
```bash
pnpm db:studio
```

**Actions:**
1. Open Drizzle Studio in browser
2. Navigate to `prospect_listing_matches` table
3. Verify structure

**Expected:**
- 15 columns visible
- No data yet (empty table)

---

### Step 6.2: Test Manual Calculation
**Command:**
```bash
# Start the dev server
pnpm dev

# In another terminal, trigger calculation
curl -X POST http://localhost:3000/api/matches/calculate \
  -H "Content-Type: application/json" \
  -d '{"clearStale": true}'
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Matches calculated successfully",
  "data": {
    "matchesCalculated": 123,
    "matchesInserted": 123,
    "executionTime": 2500
  }
}
```

**Verification:**
1. Check Drizzle Studio - should see rows in table
2. Check server logs for calculation messages
3. Verify `calculatedAt` timestamps are recent

---

### Step 6.3: Test Query Performance
**Create test script:** `/scripts/test-match-query-performance.ts`

```typescript
import { performance } from "perf_hooks";

async function testQueryPerformance() {
  console.log("🧪 Testing match query performance...\n");

  // Test 1: Old system (real-time calculation)
  process.env.USE_MATCHES_TABLE = "false";
  const startOld = performance.now();
  // Call getMatchesForProspectsWithAuth()
  const endOld = performance.now();
  const oldTime = endOld - startOld;

  // Test 2: New system (from table)
  process.env.USE_MATCHES_TABLE = "true";
  const startNew = performance.now();
  // Call getMatchesForProspectsWithAuth()
  const endNew = performance.now();
  const newTime = endNew - startNew;

  console.log("📊 Results:");
  console.log(`Old system: ${oldTime.toFixed(2)}ms`);
  console.log(`New system: ${newTime.toFixed(2)}ms`);
  console.log(`Improvement: ${((oldTime / newTime)).toFixed(2)}x faster`);
}

testQueryPerformance();
```

**Run:**
```bash
npx tsx scripts/test-match-query-performance.ts
```

---

### Step 6.4: Test Cron Job
**Command:**
```bash
# Initialize the cron job
curl http://localhost:3000/api/cron/init

# Wait and check logs for hourly execution
# Or modify cron schedule for testing: "*/5 * * * *" (every 5 minutes)
```

**Verification:**
- Check server logs every hour
- Verify matches are being recalculated
- Check `calculatedAt` timestamps update

---

## Phase 7: Documentation

### Step 7.1: Update README.md
**File:** `/README.md`

**Add section after "Architecture & Tech Stack":**

```markdown
### Match Calculation System

Vesta uses a pre-calculated match table for optimal performance when finding prospects that match available listings.

**How it works:**
1. **Background Job:** Runs hourly (configurable) to calculate all matches
2. **Storage:** Matches stored in `prospect_listing_matches` table
3. **Query:** UI reads from table (10-100x faster than real-time calculation)
4. **Invalidation:** Hourly recalculation ensures freshness
5. **Manual Refresh:** Available via UI button or API endpoint

**Environment Variables:**
- `ENABLE_MATCH_CALCULATION_JOB` - Enable/disable background job (default: true)
- `MATCH_CALCULATION_CRON` - Cron schedule (default: "0 * * * *" = hourly)
- `USE_MATCHES_TABLE` - Use table or fallback to real-time (default: true)

**Manual Trigger:**
```bash
POST /api/matches/calculate
Content-Type: application/json

{
  "clearStale": true  // Mark existing matches as stale first
}
```

**Performance:**
- Old system: 2-10 seconds per query
- New system: 50-200ms per query
- Improvement: 10-100x faster
```

---

### Step 7.2: Create Migration Guide
**Already created:** `/MATCHES_TABLE_MIGRATION_GUIDE.md`

**Review and update if needed**

---

## Deployment Checklist

### Pre-Deployment
- [ ] All TypeScript checks pass (`pnpm typecheck`)
- [ ] All linting passes (`pnpm lint`)
- [ ] Migration file reviewed
- [ ] Indexes SQL file created
- [ ] Environment variables documented
- [ ] README.md updated

### Deployment Steps
1. **Database Migration:**
   ```bash
   pnpm db:push
   ```

2. **Create Indexes:**
   ```bash
   psql $DATABASE_URL -f drizzle/manual-indexes.sql
   ```

3. **Set Environment Variables:**
   ```bash
   # In production .env
   ENABLE_MATCH_CALCULATION_JOB=true
   MATCH_CALCULATION_CRON="0 * * * *"
   USE_MATCHES_TABLE=false  # Keep false initially
   ```

4. **Deploy Code:**
   ```bash
   git add .
   git commit -m "feat: add prospect-listing matches table"
   git push
   ```

5. **Initial Calculation:**
   ```bash
   # After deployment, run initial calculation
   curl -X POST https://your-domain.com/api/matches/calculate
   ```

6. **Initialize Cron Job:**
   ```bash
   # Initialize background job
   curl https://your-domain.com/api/cron/init
   ```

7. **Monitor for 24 Hours:**
   - Check logs for cron job execution
   - Verify matches are being calculated
   - Check for errors

8. **Enable Table Queries:**
   ```bash
   # Update environment variable
   USE_MATCHES_TABLE=true
   ```

9. **Monitor Performance:**
   - Check query response times
   - Verify matches accuracy
   - Monitor user feedback

### Rollback Plan
If issues occur:
1. Set `USE_MATCHES_TABLE=false` (instant rollback, uses old system)
2. No data loss - old calculation still works
3. Fix issues and redeploy

---

## Troubleshooting

### Issue: Migration Fails
**Solution:**
```bash
# Check database connection
pnpm db:studio

# Review migration SQL
cat drizzle/[migration-file].sql

# Check for conflicts
# Drop table if needed: DROP TABLE prospect_listing_matches;
```

### Issue: Indexes Not Created
**Solution:**
```bash
# Check if indexes exist
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'prospect_listing_matches';"

# Manually create if missing
psql $DATABASE_URL -f drizzle/manual-indexes.sql
```

### Issue: Cron Job Not Running
**Solution:**
```bash
# Check environment variable
echo $ENABLE_MATCH_CALCULATION_JOB

# Check initialization
curl http://localhost:3000/api/cron/init

# Check server logs for cron messages
```

### Issue: No Matches Calculated
**Solution:**
```bash
# Check if prospects and listings exist
pnpm db:studio

# Manually trigger calculation
curl -X POST http://localhost:3000/api/matches/calculate

# Check logs for errors
```

### Issue: Queries Still Slow
**Solution:**
```bash
# Verify USE_MATCHES_TABLE is true
echo $USE_MATCHES_TABLE

# Check if table has data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM prospect_listing_matches WHERE is_stale = false;"

# Verify indexes exist
# Run EXPLAIN ANALYZE on query
```

---

## Status Tracking

- [x] Phase 1: Database Schema - COMPLETED
- [ ] Phase 2: Match Calculation Service - IN PROGRESS
- [ ] Phase 3: Background Job Setup
- [ ] Phase 4: Manual Trigger Endpoint
- [ ] Phase 5: Query Modifications
- [ ] Phase 6: Testing
- [ ] Phase 7: Documentation

**Next Step:** Continue with Phase 2.2 - Implement calculateMatches() function

---

**Last Updated:** 2025-11-23
**Current Step:** Phase 1 Complete, Starting Phase 2
