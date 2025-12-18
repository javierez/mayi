import { type NextRequest, NextResponse } from "next/server";
import {
  getAccountsWithFotocasaEnabled,
  updateAccountFotocasaLastSync,
} from "~/server/queries/accounts";
import { fetchFotocasaLeads } from "~/server/services/fotocasa-leads-service";
import { importFotocasaLeads } from "~/server/queries/fotocasa-leads";

interface AccountResult {
  accountId: string;
  success: boolean;
  leadsProcessed: number;
  leadsImported: number;
  leadsSkipped: number;
  errors: string[];
  dateRange?: {
    from: string;
    to: string;
    hours: number;
    isFirstSync: boolean;
  };
}

/**
 * Cron job to fetch and import leads from Fotocasa Leads API
 * Runs every 2 hours via Vercel Cron
 *
 * For each account with Fotocasa enabled:
 * 1. Fetches leads from Fotocasa API (from lastSyncAt to now)
 * 2. Creates contacts for new leads
 * 3. Creates listing_contacts if reference matches existing listing
 * 4. Updates lastSyncAt timestamp
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Fotocasa Cron] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results: AccountResult[] = [];
    let totalLeadsImported = 0;

    // Optional: force a specific hour range for testing (e.g., ?hours=72)
    const url = new URL(request.url);
    const forceHours = url.searchParams.get("hours");
    const forceHoursNum = forceHours ? parseInt(forceHours, 10) : null;

    console.log(`[Fotocasa Cron] Starting at ${now.toISOString()}`);
    if (forceHoursNum) {
      console.log(`[Fotocasa Cron] FORCED RANGE: ${forceHoursNum} hours (ignoring lastLeadSyncAt)`);
    }

    // Get all accounts with Fotocasa enabled
    const fotocasaAccounts = await getAccountsWithFotocasaEnabled();
    console.log(
      `[Fotocasa Cron] Found ${fotocasaAccounts.length} accounts with Fotocasa enabled`,
    );

    // Process each account independently
    for (const account of fotocasaAccounts) {
      const accountResult: AccountResult = {
        accountId: account.accountId.toString(),
        success: true,
        leadsProcessed: 0,
        leadsImported: 0,
        leadsSkipped: 0,
        errors: [],
      };

      try {
        // Determine date range
        // If forceHours is set, use that instead of lastSyncAt
        // If no lastSyncAt (first sync), default to last 72 hours
        const isFirstSync = !account.lastLeadSyncAt;
        const from = forceHoursNum
          ? new Date(now.getTime() - forceHoursNum * 60 * 60 * 1000)
          : account.lastLeadSyncAt ??
            new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const to = now;

        // Calculate hours difference for logging
        const hoursDiff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60));

        // Add date range to result for visibility in response
        accountResult.dateRange = {
          from: from.toISOString(),
          to: to.toISOString(),
          hours: hoursDiff,
          isFirstSync: forceHoursNum ? false : isFirstSync,
        };

        const syncType = forceHoursNum
          ? `FORCED ${forceHoursNum}h`
          : isFirstSync
            ? "FIRST SYNC"
            : "Incremental sync";
        console.log(`[Fotocasa Cron] Account ${account.accountId}: ${syncType}`);
        console.log(
          `[Fotocasa Cron] Account ${account.accountId}: Date range: ${from.toISOString()} → ${to.toISOString()} (${hoursDiff} hours)`,
        );

        // Fetch leads from Fotocasa API
        const fetchResult = await fetchFotocasaLeads({
          apiKey: account.apiKey,
          from,
          to,
        });

        if (!fetchResult.success) {
          accountResult.success = false;
          accountResult.errors.push(fetchResult.error ?? "Unknown fetch error");
          results.push(accountResult);
          console.error(
            `[Fotocasa Cron] Account ${account.accountId}: Fetch failed - ${fetchResult.error}`,
          );
          continue;
        }

        accountResult.leadsProcessed = fetchResult.leads.length;
        console.log(
          `[Fotocasa Cron] Account ${account.accountId}: Processing ${fetchResult.leads.length} leads`,
        );

        // Import all leads for this account
        const importResult = await importFotocasaLeads(
          account.accountId,
          fetchResult.leads,
        );

        accountResult.leadsImported = importResult.imported;
        accountResult.leadsSkipped = importResult.skipped;
        accountResult.errors.push(...importResult.errorDetails);
        totalLeadsImported += importResult.imported;

        // Update last sync timestamp on success
        await updateAccountFotocasaLastSync(account.accountId, now);

        console.log(
          `[Fotocasa Cron] Account ${account.accountId}: Imported ${importResult.imported}, skipped ${importResult.skipped}, errors ${importResult.errors}`,
        );
      } catch (error) {
        accountResult.success = false;
        accountResult.errors.push(
          error instanceof Error ? error.message : "Unknown error",
        );
        console.error(
          `[Fotocasa Cron] Account ${account.accountId} error:`,
          error,
        );
      }

      results.push(accountResult);
    }

    console.log(
      `[Fotocasa Cron] Completed: ${totalLeadsImported} leads imported across ${fotocasaAccounts.length} accounts`,
    );

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      accountsProcessed: results.length,
      totalLeadsImported,
      results,
    });
  } catch (error) {
    console.error("[Fotocasa Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
