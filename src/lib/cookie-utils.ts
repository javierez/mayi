/**
 * Cookie Utility Functions
 * 
 * Provides standardized cookie management for client-side operations.
 * Note: For server-side cookie operations, use Next.js cookies() API.
 */

/**
 * Set a cookie with proper attributes
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Expiration in days (default: 365)
 * @param options - Additional cookie options
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 365,
  options: {
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    path?: string;
  } = {},
) {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const isProduction = process.env.NODE_ENV === "production";
  const secure = options.secure ?? isProduction;
  const sameSite = options.sameSite ?? "lax";
  const path = options.path ?? "/";

  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=${sameSite}`;

  if (secure) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * 
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Delete a cookie
 * 
 * @param name - Cookie name
 * @param path - Cookie path (default: "/")
 */
export function deleteCookie(name: string, path: string = "/") {
  if (typeof document === "undefined") return;

  // Set expiration date to past
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

/**
 * Check if cookies are enabled in the browser
 * 
 * @returns true if cookies are enabled
 */
export function areCookiesEnabled(): boolean {
  if (typeof document === "undefined") return false;

  try {
    // Try to set a test cookie
    document.cookie = "testCookie=1; path=/";
    const enabled = document.cookie.indexOf("testCookie=") !== -1;
    // Delete test cookie
    deleteCookie("testCookie");
    return enabled;
  } catch {
    return false;
  }
}

