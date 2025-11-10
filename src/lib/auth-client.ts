import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Use relative URL for client-side requests
  // This ensures requests go to the same domain as the app
  baseURL: "",
  plugins: [twoFactorClient()],
});

// Export methods for use throughout app
// Note: Password reset is now handled via SMS server actions
// (see src/server/actions/password-reset.ts)
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  twoFactor,
} = authClient;
