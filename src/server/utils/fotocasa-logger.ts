import { db } from "~/server/db";
import { fotocasaLogs } from "~/server/db/schema";

interface FotocasaLogEntry {
  timestamp: string;
  listingId: number | string;
  operation: "BUILD_PAYLOAD" | "POST" | "PUT" | "DELETE";
  request?: unknown;
  response?: unknown;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Writes a log entry to the database
 */
export async function logFotocasaRequest(
  entry: Omit<FotocasaLogEntry, "timestamp">,
): Promise<void> {
  try {
    const timestamp = new Date();

    // Log full data to server console
    console.log("=== FOTOCASA API LOG ===");
    console.log("Timestamp:", timestamp.toISOString());
    console.log("Listing ID:", entry.listingId);
    console.log("Operation:", entry.operation);
    console.log("Success:", entry.success);
    console.log("Request Data:", JSON.stringify(entry.request, null, 2));
    console.log("Response Data:", JSON.stringify(entry.response, null, 2));
    if (entry.error) {
      console.log("Error:", entry.error);
    }
    if (entry.metadata) {
      console.log("Metadata:", JSON.stringify(entry.metadata, null, 2));
    }
    console.log("========================");

    // Insert log entry into database with full data (no sanitization)
    await db.insert(fotocasaLogs).values({
      timestamp,
      listingId: typeof entry.listingId === "string"
        ? BigInt(entry.listingId)
        : BigInt(entry.listingId),
      operation: entry.operation,
      requestData: entry.request,
      responseData: entry.response,
      success: entry.success,
      error: entry.error ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    // Don't throw errors from logging - just log to console
    console.error("Failed to write Fotocasa log to database:", error);
  }
}

/**
 * Logs the payload building process
 */
export async function logPayloadBuild(
  listingId: number,
  payload: unknown,
  watermarkedKeysCount: number,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "BUILD_PAYLOAD",
    request: { listingId },
    response: payload,
    success: true,
    metadata: {
      watermarkedImagesCount: watermarkedKeysCount,
    },
  });
}

/**
 * Logs API POST request (publish)
 */
export async function logPublishRequest(
  listingId: number,
  payload: unknown,
  response: unknown,
  success: boolean,
  error?: string,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "POST",
    request: payload,
    response,
    success,
    error,
  });
}

/**
 * Logs API PUT request (update)
 */
export async function logUpdateRequest(
  listingId: number,
  payload: unknown,
  response: unknown,
  success: boolean,
  error?: string,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "PUT",
    request: payload,
    response,
    success,
    error,
  });
}

/**
 * Logs API DELETE request
 */
export async function logDeleteRequest(
  listingId: number,
  base64ExternalId: string,
  response: unknown,
  success: boolean,
  error?: string,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "DELETE",
    request: { listingId, base64ExternalId },
    response,
    success,
    error,
  });
}
