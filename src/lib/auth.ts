import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "~/server/db";
import {
  users,
  sessions,
  authAccounts,
  verificationTokens,
  roles,
  userRoles,
  accountRoles,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { ROLE_PERMISSIONS } from "~/lib/permissions";
import type { Permission } from "~/lib/permissions";
import { sendEmail, generatePasswordResetEmail } from "~/lib/email";

/**
 * Add BigInt serialization support for JSON.stringify
 * This fixes "Do not know how to serialize a BigInt" errors
 * when auth returns user objects with BigInt fields (like accountId)
 */
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

/**
 * Permissions object structure from database
 * Nested object with categories and boolean/numeric flags
 */
export interface PermissionsObject {
  admin?: Record<string, boolean | number>;
  calendar?: Record<string, boolean | number>;
  contacts?: Record<string, boolean | number>;
  properties?: Record<string, boolean | number>;
  tasks?: Record<string, boolean | number>;
  tools?: Record<string, boolean | number>;
  [key: string]: Record<string, boolean | number> | undefined;
}

/**
 * Return type for getUserRolesAndPermissionsFromDB
 */
export interface UserRolesAndPermissions {
  roles: string[];
  permissions: PermissionsObject;
}

/**
 * Merge multiple permission objects using OR logic
 * If any role grants a permission, the user gets it
 */
function mergePermissions(
  permissionsArray: PermissionsObject[],
): PermissionsObject {
  const merged: PermissionsObject = {};

  permissionsArray.forEach((perms) => {
    Object.entries(perms).forEach(([category, permissions]) => {
      if (!merged[category as keyof PermissionsObject]) {
        merged[category as keyof PermissionsObject] = {};
      }

      Object.entries(permissions!).forEach(([permission, value]) => {
        const currentValue =
          merged[category as keyof PermissionsObject]?.[permission] ?? false;
        // OR logic: if any role grants permission (true or 1), user gets it
        // Normalize: 1 and true are truthy, false is falsy
        const normalizedValue = Boolean(value);
        const normalizedCurrent = Boolean(currentValue);
        (
          merged[category as keyof PermissionsObject] as Record<string, boolean>
        )[permission] = normalizedCurrent || normalizedValue;
      });
    });
  });

  return merged;
}

/**
 * Get user roles and permissions from database (with caching)
 * Fetches from account_roles.permissions JSON field
 */
export async function getUserRolesFromDB(
  userId: string,
  accountId: number,
): Promise<UserRolesAndPermissions> {
  console.log(
    `🔍 getUserRolesFromDB called for user ${userId}, account ${accountId}`,
  );

  try {
    const userRolesList = await db
      .select({
        roleName: roles.name,
        permissions: accountRoles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
      .innerJoin(
        accountRoles,
        and(
          eq(accountRoles.roleId, roles.roleId),
          eq(accountRoles.accountId, BigInt(accountId)),
        ),
      )
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true),
          eq(accountRoles.isActive, true),
        ),
      );

    const roleNames = userRolesList.map((role) => role.roleName);
    const permissionsArray = userRolesList
      .map((role) => role.permissions as PermissionsObject)
      .filter((p) => p && Object.keys(p).length > 0);

    // Merge permissions from all roles using OR logic
    const mergedPermissions =
      permissionsArray.length > 0 ? mergePermissions(permissionsArray) : {};

    console.log(
      `📊 DB query result for user ${userId}:`,
      `\n  Roles: [${roleNames.join(", ")}]`,
      `\n  Permissions (merged):`,
      JSON.stringify(mergedPermissions, null, 2),
    );

    return {
      roles: roleNames,
      permissions: mergedPermissions,
    };
  } catch (error) {
    console.error("❌ Error fetching user roles and permissions:", error);
    return {
      roles: [],
      permissions: {},
    };
  }
}

/**
 * Get permissions for given roles
 */
export function getPermissionsForRoles(roleNames: string[]): Permission[] {
  const permissionsSet = new Set<Permission>();

  roleNames.forEach((roleName) => {
    const rolePermissions = ROLE_PERMISSIONS[roleName] ?? [];
    rolePermissions.forEach((permission) => {
      permissionsSet.add(permission);
    });
  });

  return Array.from(permissionsSet);
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "mysql", // SingleStore is MySQL compatible
    schema: {
      user: users,
      session: sessions,
      account: authAccounts,
      verification: verificationTokens,
    },
  }),

  // Email and Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Start with false for development
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token: _token }, _request) => {
      try {
        const { html, text } = generatePasswordResetEmail(url, user.email);

        await sendEmail({
          to: user.email,
          subject: "Restablecer tu contraseña - Vesta CRM",
          html,
          text,
        });

        console.log(`🔐 Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error("❌ Failed to send password reset email:", error);
        throw error;
      }
    },
    onPasswordReset: async ({ user }, _request) => {
      console.log(`✅ Password successfully reset for user: ${user.email}`);
    },
  },

  // Social Providers Configuration (only enable if credentials are provided)
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
    ...(process.env.LINKEDIN_CLIENT_ID &&
      process.env.LINKEDIN_CLIENT_SECRET && {
        linkedin: {
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }),
  },

  // User schema - now matches Better-Auth expectations exactly
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
        input: true,
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "en",
        input: true,
      },
      isVerified: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
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
      preferences: {
        type: "string", // JSON stored as string
        required: false,
        input: false,
      },
      accountId: {
        type: "number",
        required: false,
        input: true,
      },
    },
  },

  // Next.js integration
  plugins: [nextCookies()],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    // Enable cookie cache for better performance
    // Stores encrypted session data in cookie to reduce database queries
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - balance between performance and data freshness
      strategy: "jwe", // Use encrypted tokens for maximum security
    },
  },

  // Advanced security configuration
  advanced: {
    // Use secure cookies only in production (HTTPS)
    // In development (HTTP), browsers won't send/store cookies with Secure flag
    useSecureCookies: process.env.NODE_ENV === "production",
    // Default cookie attributes for all auth cookies
    defaultCookieAttributes: {
      httpOnly: true, // Prevent JavaScript access to cookies (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send cookies over HTTPS in production
      sameSite: "lax", // Prevent CSRF attacks while allowing normal navigation
      ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }), // Optional domain for subdomain support
    },
  },

  // Built-in rate limiting
  rateLimit: {
    window: 60, // 1 minute window
    max: 5, // max 5 attempts
  },

  // Trusted origins for CORS
  trustedOrigins: [
    "http://localhost:3000",
    "https://v0-vesta-eight.vercel.app",
    "https://www.vesta-crm.com",
    ...(process.env.APP_URL ? [process.env.APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
});

/**
 * Get session with enriched user data (roles and permissions)
 */
export async function getEnrichedSession() {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session?.user?.accountId) {
    return session;
  }

  // Add roles and permissions to session data
  const rolesAndPermissions = await getUserRolesFromDB(
    session.user.id,
    Number(session.user.accountId),
  );

  return {
    ...session,
    user: {
      ...session.user,
      roles: rolesAndPermissions.roles,
      permissions: rolesAndPermissions.permissions,
    },
  };
}
