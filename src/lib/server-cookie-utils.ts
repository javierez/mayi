/**
 * Server-Side Cookie Utility Functions
 * 
 * Provides cookie management for server-side operations (API routes, middleware, server components).
 * Use this instead of client-side cookie-utils for server-side operations.
 */

import { cookies } from "next/headers";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

/**
 * Get cookie consent from server-side cookies
 * 
 * @returns Cookie consent object or null if not found
 */
export async function getCookieConsent(): Promise<CookieConsent | null> {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get("vesta-cookie-consent");

    if (!consentCookie?.value) {
      return null;
    }

    return JSON.parse(consentCookie.value) as CookieConsent;
  } catch (error) {
    console.error("Error reading cookie consent:", error);
    return null;
  }
}

/**
 * Check if analytics consent has been given
 * 
 * @returns true if analytics consent is given
 */
export async function hasAnalyticsConsent(): Promise<boolean> {
  const consent = await getCookieConsent();
  return consent?.analytics ?? false;
}

/**
 * Check if marketing consent has been given
 * 
 * @returns true if marketing consent is given
 */
export async function hasMarketingConsent(): Promise<boolean> {
  const consent = await getCookieConsent();
  return consent?.marketing ?? false;
}

