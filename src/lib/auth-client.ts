import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Use relative URL for client-side requests
  // This ensures requests go to the same domain as the app
  baseURL: "",
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
} = authClient;
