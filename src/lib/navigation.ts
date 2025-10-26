import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * PWA-aware navigation that opens internal links intelligently
 * - Browser mode: Opens in new tab (_blank)
 * - PWA mode: Navigates in same window (router.push)
 *
 * This ensures a better user experience in both contexts:
 * - Desktop/mobile browsers can open links in new tabs for multitasking
 * - PWA users stay within the app without context switching
 *
 * @param url - The internal URL to navigate to (e.g., "/calendario?new=true")
 * @param router - Next.js router instance from useRouter()
 */
export function navigateToPage(url: string, router: AppRouterInstance): void {
  // Check if running as PWA (standalone mode)
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  if (isPWA) {
    // In PWA mode, navigate in same window
    router.push(url);
  } else {
    // In browser mode, open new tab
    window.open(url, '_blank');
  }
}
