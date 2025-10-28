"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "~/lib/auth-client";

/**
 * Component that redirects users without accountId to account setup
 * This handles Google OAuth users who need to be assigned to an organization
 */
export function AccountSetupRedirect() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isPending) return;

    // If user is authenticated but has no accountId, redirect to account setup
    if (
      session?.user &&
      !("accountId" in session.user && session.user.accountId)
    ) {
      console.log(
        "User authenticated but missing accountId, redirecting to account setup",
      );
      router.push("/auth/account-setup");
    }
  }, [session, isPending, router]);

  // This component doesn't render anything
  return null;
}
