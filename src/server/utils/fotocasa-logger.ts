import { db } from "~/server/db";
import { fotocasaLogs } from "~/server/db/schema";

interface FotocasaLogEntry {
  timestamp: string;
  listingId: number | string;
  operation: "BUILD_PAYLOAD" | "POST" | "PUT" | "DELETE";
  request?: unknown;
  requestHeaders?: Record<string, string>;
  response?: unknown;
  responseHeaders?: Record<string, string>;
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

    // Build request data with headers
    const requestData = entry.requestHeaders
      ? {
          headers: entry.requestHeaders,
          body: entry.request,
        }
      : entry.request;

    // Build response data with headers
    const responseData = entry.responseHeaders
      ? {
          headers: entry.responseHeaders,
          body: entry.response,
        }
      : entry.response;

    // Insert log entry into database with full data (no sanitization)
    await db.insert(fotocasaLogs).values({
      timestamp,
      listingId: typeof entry.listingId === "string"
        ? BigInt(entry.listingId)
        : BigInt(entry.listingId),
      operation: entry.operation,
      requestData,
      responseData,
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
  requestHeaders?: Record<string, string>,
  responseHeaders?: Record<string, string>,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "POST",
    request: payload,
    requestHeaders,
    response,
    responseHeaders,
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
  requestHeaders?: Record<string, string>,
  responseHeaders?: Record<string, string>,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "PUT",
    request: payload,
    requestHeaders,
    response,
    responseHeaders,
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
  requestHeaders?: Record<string, string>,
  responseHeaders?: Record<string, string>,
): Promise<void> {
  await logFotocasaRequest({
    listingId,
    operation: "DELETE",
    request: { listingId, base64ExternalId },
    requestHeaders,
    response,
    responseHeaders,
    success,
    error,
  });
}
