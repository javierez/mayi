import { type NextRequest, NextResponse } from "next/server";
import {
  getAccountsWithFotocasaEnabled,
  updateAccountFotocasaLastSync,
} from "~/server/queries/accounts";
import { fetchFotocasaLeads } from "~/server/services/fotocasa-leads-service";
import { importFotocasaLeads } from "~/server/queries/fotocasa-leads";
import {
  getFotocasaLeadsLogger,
  resetFotocasaLeadsLogger,
} from "~/server/utils/fotocasa-leads-logger";
import { createNotificationInternal } from "~/server/queries/notification";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getSystemUserIdForAccount } from "~/server/queries/fotocasa-leads";

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

    // Initialize logger for this cron session
    resetFotocasaLeadsLogger();
    const logger = getFotocasaLeadsLogger();

    logger.section("FOTOCASA LEADS CRON JOB STARTED");
    logger.info(`Starting at ${now.toISOString()}`);
    if (forceHoursNum) {
      logger.info(`FORCED RANGE: ${forceHoursNum} hours (ignoring lastLeadSyncAt)`);
    }

    // Get all accounts with Fotocasa enabled
    const fotocasaAccounts = await getAccountsWithFotocasaEnabled();
    logger.info(`Found ${fotocasaAccounts.length} accounts with Fotocasa enabled`);

    // Process each account independently
    for (const account of fotocasaAccounts) {
      logger.section(`Processing Account ${account.accountId.toString()}`);
      
      const accountResult: AccountResult = {
        accountId: account.accountId.toString(),
        success: true,
        leadsProcessed: 0,
        leadsImported: 0,
        leadsSkipped: 0,
        errors: [],
      };

      // Skip accounts without publisherId configured
      if (!account.publisherId) {
        accountResult.success = false;
        accountResult.errors.push("No publisherId configured - leads sync skipped");
        results.push(accountResult);
        logger.warn(`SKIPPED - no publisherId configured`);
        continue;
      }

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
        logger.info(`${syncType}`);
        logger.info(`Date range: ${from.toISOString()} → ${to.toISOString()} (${hoursDiff} hours)`);

        // Fetch leads from Fotocasa API using account's publisherId
        const fetchResult = await fetchFotocasaLeads({
          apiKey: account.apiKey,
          publisherId: account.publisherId,
          from,
          to,
        });

        if (!fetchResult.success) {
          accountResult.success = false;
          accountResult.errors.push(fetchResult.error ?? "Unknown fetch error");
          results.push(accountResult);
          logger.error(`Fetch failed - ${fetchResult.error}`);
          continue;
        }

        accountResult.leadsProcessed = fetchResult.leads.length;
        logger.info(`Processing ${fetchResult.leads.length} leads`);

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

        logger.info(`Imported ${importResult.imported}, skipped ${importResult.skipped}, errors ${importResult.errors}`);
        logger.info(`Contacts created: ${importResult.contactsCreated}, contacts updated: ${importResult.contactsUpdated}`);

        // Create notifications for all users if new contacts were created
        if (importResult.contactsCreated > 0) {
          try {
            await createFotocasaLeadNotifications(
              account.accountId,
              importResult.contactsCreated,
              importResult.createdContactIds,
            );
            logger.info(`Created notifications for ${importResult.contactsCreated} new contact(s)`);
          } catch (notificationError) {
            // Log error but don't fail the import
            logger.warn(
              `Failed to create notifications: ${notificationError instanceof Error ? notificationError.message : "Unknown error"}`,
            );
          }
        }
      } catch (error) {
        accountResult.success = false;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        accountResult.errors.push(errorMessage);
        logger.error(`Account processing error:`, error);
      }

      results.push(accountResult);
    }

    logger.section("FOTOCASA LEADS CRON JOB COMPLETED");
    logger.info(`Total leads imported: ${totalLeadsImported} across ${fotocasaAccounts.length} accounts`);
    const logFilePath = logger.getLogFilePath();
    logger.info(`Log file saved to: ${logFilePath}`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      accountsProcessed: results.length,
      totalLeadsImported,
      logFile: logFilePath,
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

/**
 * Create notifications for all users in an account when new Fotocasa leads are imported
 * 
 * @param accountId - The account ID
 * @param contactCount - Number of new contacts created
 * @param createdContactIds - Array of contact IDs that were created (for linking)
 */
async function createFotocasaLeadNotifications(
  accountId: bigint,
  contactCount: number,
  createdContactIds: bigint[],
): Promise<void> {
  // Get all active users for this account
  const accountUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.accountId, accountId), eq(users.isActive, true)),
    );

  if (accountUsers.length === 0) {
    return; // No users to notify
  }

  // Get system user ID for fromUserId
  const systemUserId = await getSystemUserIdForAccount(accountId);

  // Determine notification message based on contact count
  const title = contactCount === 1
    ? "¡Ha entrado un nuevo contacto desde Fotocasa!"
    : `¡Han entrado ${contactCount} nuevos contactos desde Fotocasa!`;
  
  const message = contactCount === 1
    ? "Se ha importado un nuevo contacto desde Fotocasa. Revisa los contactos para más detalles."
    : `Se han importado ${contactCount} nuevos contactos desde Fotocasa. Revisa los contactos para más detalles.`;

  // Determine action URL based on contact count
  // If only one contact was created, link to that specific contact
  // If multiple contacts were created, link to the contacts list
  const actionUrl = contactCount === 1 && createdContactIds.length > 0
    ? `/contactos/${createdContactIds[0]!.toString()}`
    : "/contactos";

  // Create notification for each user
  // Note: Using "task_assigned" type since "new_lead" isn't in the enum,
  // but the database accepts any string for the type field
  await Promise.all(
    accountUsers.map((user) =>
      createNotificationInternal({
        accountId,
        userId: user.id,
        fromUserId: systemUserId ?? null,
        type: "task_assigned", // Using existing type - database accepts any string
        title,
        message,
        actionUrl,
        priority: "normal",
        category: "contacts",
        entityType: contactCount === 1 && createdContactIds.length > 0 ? "contact" : null,
        entityId: contactCount === 1 && createdContactIds.length > 0 ? createdContactIds[0]! : null,
        metadata: {
          contactCount,
          source: "fotocasa",
          notificationType: "new_lead", // Store actual type in metadata
        },
        deliveryChannel: "in_app",
      }).catch((error) => {
        // Log individual notification errors but don't fail the batch
        console.error(
          `Failed to create notification for user ${user.id}:`,
          error,
        );
      }),
    ),
  );
}
