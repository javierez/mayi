import { getCurrentUser } from "~/lib/dal";
import {
  getUserGmailIntegration,
  getGmailUserEmail,
  type GmailIntegration,
} from "~/lib/google-gmail";
import {
  fetchGmailThreads,
  fetchGmailThread,
  getGmailUnreadCount,
  type FetchThreadsOptions,
  type FetchThreadsResult,
} from "~/server/services/gmail-service";
import type { InboxContact, InboxThread } from "~/components/inbox/inbox-types";
import { enrichContactsWithLinkStatus } from "~/server/actions/inbox-contact";

/**
 * Get Gmail integration for current user (with auth)
 */
export async function getGmailIntegrationWithAuth(): Promise<GmailIntegration | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return getUserGmailIntegration(user.id);
}

/**
 * Check if current user has Gmail connected
 */
export async function hasGmailIntegrationWithAuth(): Promise<boolean> {
  const integration = await getGmailIntegrationWithAuth();
  return integration?.isActive ?? false;
}

/**
 * Get Gmail email address for current user
 */
export async function getGmailEmailWithAuth(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return getGmailUserEmail(user.id);
}

/**
 * Enrich thread participants with contact link status
 */
async function enrichThreadWithContactLinks(
  thread: InboxThread,
): Promise<InboxThread> {
  const enrichedParticipants = await enrichContactsWithLinkStatus(
    thread.participants,
  );

  // Create a map for quick lookup
  const participantMap = new Map<string, InboxContact>();
  for (const p of enrichedParticipants) {
    participantMap.set(p.email ?? p.id, p);
  }

  // Enrich message senders/recipients too
  const enrichedMessages = thread.messages.map((msg) => {
    const enrichedFrom = participantMap.get(msg.from.email ?? msg.from.id) ?? msg.from;
    const enrichedTo = msg.to?.map(
      (t) => participantMap.get(t.email ?? t.id) ?? t,
    );
    const enrichedCc = msg.cc?.map(
      (c) => participantMap.get(c.email ?? c.id) ?? c,
    );

    return {
      ...msg,
      from: enrichedFrom,
      to: enrichedTo,
      cc: enrichedCc,
    };
  });

  return {
    ...thread,
    participants: enrichedParticipants,
    messages: enrichedMessages,
  };
}

/**
 * Get Gmail threads for current user (with auth)
 */
export async function getGmailThreadsWithAuth(
  options?: FetchThreadsOptions
): Promise<FetchThreadsResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await fetchGmailThreads(user.id, options);

  // Enrich all threads with contact link status
  const enrichedThreads = await Promise.all(
    result.threads.map(enrichThreadWithContactLinks),
  );

  return {
    ...result,
    threads: enrichedThreads,
  };
}

/**
 * Get a single Gmail thread for current user (with auth)
 */
export async function getGmailThreadWithAuth(
  threadId: string
): Promise<InboxThread | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const thread = await fetchGmailThread(user.id, threadId);
  if (!thread) return null;

  return enrichThreadWithContactLinks(thread);
}

/**
 * Get unread email count for current user (with auth)
 */
export async function getGmailUnreadCountWithAuth(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  return getGmailUnreadCount(user.id);
}

// Direct functions for internal use (when userId is already known)

/**
 * Get Gmail integration by user ID
 */
export async function getGmailIntegrationByUser(
  userId: string
): Promise<GmailIntegration | null> {
  return getUserGmailIntegration(userId);
}

/**
 * Check if user has Gmail connected
 */
export async function hasGmailIntegration(userId: string): Promise<boolean> {
  const integration = await getUserGmailIntegration(userId);
  return integration?.isActive ?? false;
}

/**
 * Get Gmail threads by user ID
 */
export async function getGmailThreadsByUser(
  userId: string,
  options?: FetchThreadsOptions
): Promise<FetchThreadsResult> {
  return fetchGmailThreads(userId, options);
}

/**
 * Get a single Gmail thread by user ID
 */
export async function getGmailThreadByUser(
  userId: string,
  threadId: string
): Promise<InboxThread | null> {
  return fetchGmailThread(userId, threadId);
}
