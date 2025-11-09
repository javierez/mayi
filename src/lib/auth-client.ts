import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Use relative URL for client-side requests
  // This ensures requests go to the same domain as the app
  baseURL: "",
  plugins: [twoFactorClient()],
});

// Export methods for use throughout app
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  twoFactor,
} = authClient;
