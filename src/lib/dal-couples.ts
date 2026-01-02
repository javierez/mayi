"use server";

import { headers } from "next/headers";
import { auth } from "~/lib/auth";
import { db } from "~/server/db";
import { and, eq, type SQL, type SQLWrapper, type Column } from "drizzle-orm";

/**
 * Data Access Layer (DAL) for Couples App
 *
 * Authentication Architecture:
 * 1. Users authenticate (they have passwords)
 * 2. Users belong to couples (a relationship between two people)
 * 3. Couples have their own memories, milestones, and settings
 * 4. All data is filtered by the user's coupleId
 *
 * This wrapper ensures that:
 * 1. All queries are automatically filtered by the authenticated user's coupleId
 * 2. Users can only access data belonging to their couple
 * 3. Privacy is enforced at the application level
 */

export interface CoupleSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    coupleId: bigint;
    phone?: string;
    birthDate?: string;
    timezone?: string;
    language?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

export interface CoupleSessionWithoutCouple {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    coupleId: bigint | null;
    phone?: string;
    birthDate?: string;
    timezone?: string;
    language?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Get current authenticated user session with couple context
 *
 * Flow: User authenticates -> Session contains user info -> User belongs to couple
 * This function verifies the user session and extracts their couple context
 */
export async function getSecureCoupleSession(): Promise<CoupleSession | null> {
  try {
    const headersList = await headers();

    // Try header approach first (for performance)
    const userId = headersList.get("x-user-id");
    const userEmail = headersList.get("x-user-email");
    const coupleId = headersList.get("x-user-couple-id");

    if (userId && userEmail && coupleId) {
      return {
        user: {
          id: userId,
          email: userEmail,
          firstName: "",
          lastName: "",
          coupleId: BigInt(coupleId),
          phone: undefined,
          birthDate: undefined,
          timezone: undefined,
          language: undefined,
        },
        session: {
          id: "middleware-cached",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      };
    }

    // Full session check
    let session;
    try {
      session = await auth.api.getSession({
        headers: headersList,
      });
    } catch (dbError) {
      console.error(
        "Database connection failed during session validation:",
        dbError,
      );
      return null;
    }

    if (!session?.user) {
      return null;
    }

    // User must belong to a couple
    if (!session.user.coupleId) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName ?? session.user.name ?? "",
        lastName: session.user.lastName ?? "",
        coupleId: BigInt(session.user.coupleId),
        phone: session.user.phone ?? undefined,
        birthDate: session.user.birthDate
          ? typeof session.user.birthDate === "string"
            ? session.user.birthDate
            : session.user.birthDate.toISOString().split("T")[0]
          : undefined,
        timezone: session.user.timezone ?? undefined,
        language: session.user.language ?? undefined,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    };
  } catch (error) {
    console.error("Failed to get secure couple session:", error);
    return null;
  }
}

/**
 * Get user session without requiring coupleId
 * Useful for checking if a user is authenticated but needs couple setup
 */
export async function getSessionWithoutCoupleCheck(): Promise<CoupleSessionWithoutCouple | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName ?? session.user.name ?? "",
        lastName: session.user.lastName ?? "",
        coupleId: session.user.coupleId ? BigInt(session.user.coupleId) : null,
        phone: session.user.phone ?? undefined,
        birthDate: session.user.birthDate
          ? typeof session.user.birthDate === "string"
            ? session.user.birthDate
            : session.user.birthDate.toISOString().split("T")[0]
          : undefined,
        timezone: session.user.timezone ?? undefined,
        language: session.user.language ?? undefined,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    };
  } catch (error) {
    console.error("Failed to get user session:", error);
    return null;
  }
}

/**
 * Get the couple ID of the currently authenticated user
 * Throws error if no valid session exists or user is not in a couple
 */
export async function getCurrentCoupleId(): Promise<bigint> {
  const session = await getSecureCoupleSession();

  if (!session) {
    throw new NoCoupleError("No authenticated user session found or user not in a couple");
  }

  return session.user.coupleId;
}

/**
 * Get current authenticated user information
 * Throws error if no valid session exists or user is not in a couple
 */
export async function getCurrentCoupleUser() {
  const session = await getSecureCoupleSession();

  if (!session) {
    throw new NoCoupleError("No authenticated user session found or user not in a couple");
  }

  return session.user;
}

/**
 * Require couple session - throws if not authenticated or not in couple
 */
export async function requireCoupleSession(): Promise<CoupleSession> {
  const session = await getSecureCoupleSession();

  if (!session) {
    throw new NoCoupleError("Authentication required with couple membership");
  }

  return session;
}

/**
 * Secure database instance that automatically filters by the authenticated user's couple
 */
export async function getSecureCoupleDb() {
  const coupleId = await getCurrentCoupleId();

  return {
    db,
    coupleId,
    userId: (await getSecureCoupleSession())!.user.id,
    // Helper to add couple filtering to any where condition
    withCoupleFilter: (
      table: { coupleId: Column },
      additionalWhere?: SQL | SQLWrapper,
    ) => {
      const coupleFilter = eq(table.coupleId, coupleId);
      return additionalWhere
        ? and(coupleFilter, additionalWhere)
        : coupleFilter;
    },
  };
}

/**
 * Verify that a resource belongs to the current user's couple
 * Used for authorization checks before mutations
 */
export async function verifyCoupleAccess(
  resourceCoupleId: bigint,
): Promise<boolean> {
  try {
    const currentCoupleId = await getCurrentCoupleId();
    return currentCoupleId === resourceCoupleId;
  } catch {
    return false;
  }
}

/**
 * Error classes for DAL operations
 */
export class NoCoupleError extends Error {
  constructor(message = "User is not part of a couple") {
    super(message);
    this.name = "NoCoupleError";
  }
}

export class CoupleMismatchError extends Error {
  constructor(message = "Access denied: resource belongs to different couple") {
    super(message);
    this.name = "CoupleMismatchError";
  }
}
