import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "~/server/db";
import {
  users,
  sessions,
  authAccounts,
  verificationTokens,
} from "~/server/db/schema";

/**
 * Add BigInt serialization support for JSON.stringify
 */
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// =============================================================================
// SIMPLIFIED AUTH FOR COUPLES APP
// The complex role-based permissions system has been removed for now.
// See git history for the original implementation if needed.
// =============================================================================

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: authAccounts,
      verification: verificationTokens,
      // twoFactor: removed for simplicity - add back if needed
    },
  }),

  // Email and Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    async sendVerificationEmail() {
      // TODO: Implement email verification when needed
    },
  },

  // Social Providers Configuration
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          accessType: "offline",
          prompt: "select_account+consent",
        },
      }),
    ...(process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_CLIENT_SECRET && {
        apple: {
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        },
      }),
  },

  // User schema for couples app
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      birthDate: {
        type: "date",
        required: false,
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Europe/Madrid",
        input: true,
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "es",
        input: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      lastLogin: {
        type: "date",
        required: false,
        input: false,
      },
      coupleId: {
        type: "number",
        required: false,
        input: false, // Set programmatically when joining a couple
      },
    },
  },

  // Plugins
  plugins: [
    nextCookies(),
    // twoFactor removed for simplicity - add back if needed:
    // twoFactor({ issuer: "MayI" }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days for couples app
    updateAge: 60 * 60 * 24, // Refresh session expiration every 24 hours of activity
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour cache (was 5 minutes - too short)
    },
  },

  // Security configuration
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },

  // Rate limiting
  rateLimit: {
    window: 60,
    max: 10,
  },

  // Trusted origins
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
});

/**
 * Get current session (simplified - no roles/permissions)
 */
export async function getSession() {
  return auth.api.getSession({
    headers: new Headers(),
  });
}

// =============================================================================
// STUB: Simplified permissions types (roles have been removed from the app)
// =============================================================================

export interface PermissionsObject {
  [key: string]: Record<string, boolean | number> | undefined;
}

export interface UserRolesAndPermissions {
  roles: string[];
  permissions: PermissionsObject;
}

/**
 * Stub function for getting user roles
 * Returns empty roles since the couples app doesn't use role-based permissions
 */
export async function getUserRolesFromDB(
  _userId: string,
  _accountId: number
): Promise<UserRolesAndPermissions> {
  return {
    roles: [],
    permissions: {},
  };
}

// =============================================================================
// ARCHIVED: Original role-based permissions system
// =============================================================================
/*
// This was the original implementation with roles and permissions.
// Keeping as reference for future use.

export interface PermissionsObject {
  admin?: Record<string, boolean | number>;
  calendar?: Record<string, boolean | number>;
  [key: string]: Record<string, boolean | number> | undefined;
}

export interface UserRolesAndPermissions {
  roles: string[];
  permissions: PermissionsObject;
}

function mergePermissions(permissionsArray: PermissionsObject[]): PermissionsObject {
  const merged: PermissionsObject = {};
  permissionsArray.forEach((perms) => {
    Object.entries(perms).forEach(([category, permissions]) => {
      if (!merged[category]) merged[category] = {};
      Object.entries(permissions!).forEach(([permission, value]) => {
        const currentValue = merged[category]?.[permission] ?? false;
        (merged[category] as Record<string, boolean>)[permission] =
          Boolean(currentValue) || Boolean(value);
      });
    });
  });
  return merged;
}

// Database query for roles would look like:
// const userRolesList = await db
//   .select({ roleName: roles.name, permissions: accountRoles.permissions })
//   .from(userRoles)
//   .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
//   .innerJoin(accountRoles, and(
//     eq(accountRoles.roleId, roles.roleId),
//     eq(accountRoles.accountId, BigInt(accountId))
//   ))
//   .where(and(
//     eq(userRoles.userId, userId),
//     eq(userRoles.isActive, true)
//   ));
*/
