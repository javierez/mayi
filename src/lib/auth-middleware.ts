/**
 * Edge Runtime compatible auth functions for middleware
 * This module provides BetterAuth session checking without database imports
 */

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

// Create a minimal BetterAuth instance for Edge Runtime (no database adapter)
// This is only used for session validation in middleware
export const authMiddleware = betterAuth({
  // Use environment variables for Edge Runtime compatibility
  database: {
    provider: "mysql",
    url: process.env.DATABASE_URL!,
  },
  plugins: [nextCookies()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [process.env.NEXTAUTH_URL!],
  // Minimal config for session checking only
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// Re-export only the session API for middleware use
export const getSessionForMiddleware = authMiddleware.api.getSession;
