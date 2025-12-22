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

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const navigatorStandalone = "standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isStandalone = navigatorStandalone || mediaStandalone;

    // Debug logging - remove after confirming it works
    console.log("[iOS Redirect Debug]", {
      pathname,
      isIOS,
      navigatorStandalone,
      mediaStandalone,
      isStandalone,
      userAgent: navigator.userAgent,
    });

    // Only redirect from root path to avoid loops
    if (pathname !== "/") return;
    if (!isIOS) return;
    if (!isStandalone) return;

    // All conditions met: iOS + standalone + on root path
    console.log("[iOS Redirect] Redirecting to /operaciones");
    router.replace("/operaciones");
  }, [pathname, router]);

  return null;
}
