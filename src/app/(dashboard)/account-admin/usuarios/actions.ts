"use server";

import { updateUserRoleWithAuth } from "~/server/queries/users";

export async function updateUserRole(userId: string, newRoleId: number) {
  console.log(
    `🎬 [Action:updateUserRole] Called with userId: ${userId}, newRoleId: ${newRoleId}`,
  );

  try {
    const result = await updateUserRoleWithAuth(userId, newRoleId);
    console.log(`✅ [Action:updateUserRole] Success:`, result);
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [Action:updateUserRole] Error updating user role:",
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
