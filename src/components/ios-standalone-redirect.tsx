"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Redirects iOS users opening from home screen icon to /operaciones
 *
 * Conditions for redirect:
 * - iOS device (iPhone/iPad)
 * - Standalone mode (opened from home screen icon, not Safari)
 * - Currently on root path "/"
 */
export function IOSStandaloneRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Only redirect from root path to avoid loops
    if (pathname !== "/") return;

    // Check if iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    // Check if running in standalone mode (opened from home screen)
    // navigator.standalone is iOS-specific
    const isStandalone =
      ("standalone" in navigator && navigator.standalone === true) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (!isStandalone) return;

    // All conditions met: iOS + standalone + on root path
    router.replace("/operaciones");
  }, [pathname, router]);

  return null;
}
