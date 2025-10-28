"use server";

import { getCurrentUserWithoutAccountCheck } from "~/lib/dal";
import { updateUserAccountId } from "~/server/queries/users";

/**
 * Update the accountId for a user
 * This is used when OAuth users need to associate with an account
 */
export async function updateUserAccount(userId: string, accountId: number) {
  try {
    // Use session method that doesn't require accountId (for account setup flow)
    const session = await getCurrentUserWithoutAccountCheck();

    if (!session?.user) {
      return {
        success: false,
        error: "No authenticated session found",
      };
    }

    // Ensure user can only update their own accountId
    if (session.user.id !== userId) {
      return {
        success: false,
        error: "Unauthorized: Cannot update another user's account",
      };
    }

    // Don't allow updating if user already has an accountId
    if (session.user.accountId) {
      return {
        success: false,
        error: "User already belongs to an account",
      };
    }

    // Update the user's accountId
    const updatedUser = await updateUserAccountId(userId, accountId);

    if (!updatedUser) {
      return {
        success: false,
        error: "Failed to update user account",
      };
    }

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error updating user account:", error);
    return {
      success: false,
      error: "An unexpected error occurred while updating the account",
    };
  }
}
