/**
 * Edge Runtime compatible auth functions for middleware
 *
 * This module provides authentication helpers that work in the Edge Runtime
 * without importing Node.js modules like database connections.
 */

import { headers } from "next/headers";

export interface EdgeSessionUser {
  id: string;
  email: string;
  accountId: number;
}

export interface EdgeSession {
  user: EdgeSessionUser;
}

/**
 * Get user data from middleware headers (Edge Runtime compatible)
 * This is the fastest way to get auth data in middleware context
 */
export async function getSessionFromHeaders(): Promise<EdgeSession | null> {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userEmail = headersList.get("x-user-email");
    const accountId = headersList.get("x-user-account-id");

    if (userId && userEmail && accountId) {
      return {
        user: {
          id: userId,
          email: userEmail,
          accountId: parseInt(accountId, 10),
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to get session from headers:", error);
    return null;
  }
}

/**
 * Get user roles from headers (Edge Runtime compatible)
 * Returns roles that were set by middleware
 */
export async function getUserRolesFromHeaders(): Promise<string[]> {
  try {
    const headersList = await headers();
    const rolesHeader = headersList.get("x-user-roles");

    if (rolesHeader) {
      try {
        return JSON.parse(rolesHeader) as string[];
      } catch {
        console.warn("Failed to parse roles from header");
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to get roles from headers:", error);
    return [];
  }
}

/**
 * Get user permissions from headers (Edge Runtime compatible)
 * Returns permissions that were set by middleware
 */
export async function getUserPermissionsFromHeaders(): Promise<string[]> {
  try {
    const headersList = await headers();
    const permissionsHeader = headersList.get("x-user-permissions");

    if (permissionsHeader) {
      try {
        return JSON.parse(permissionsHeader) as string[];
      } catch {
        console.warn("Failed to parse permissions from header");
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to get permissions from headers:", error);
    return [];
  }
}
