"use server";

import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import { redirect } from "next/navigation";
import {
  getAllUsersWithRoles,
  createUserWithRole as createUserWithRoleQuery,
  getUserWithFullDetails,
  updateUserByAccount,
  deleteUserByAccount,
  updateUserRole,
  bulkUserOperations as bulkUserOperationsQuery,
  searchUsersWithFilters,
} from "~/server/queries/users";
import { removeUserRole } from "~/server/queries/user-roles";
import type {
  UserFilters,
  CreateUserData,
  UpdateUserData,
  BulkUserOperation,
} from "~/types/user-management";

// Helper function to check superadmin access
async function checkSuperAdminAccess() {
  // Use optimized DAL function instead of direct auth.api.getSession
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const isSuperAdmin = await userHasRole(session.user.id, 2);

  if (!isSuperAdmin) {
    throw new Error("Access denied: Superadmin role required");
  }

  return session.user;
}

// Get all users with roles and pagination
export async function searchUsers(filters?: UserFilters) {
  await checkSuperAdminAccess();
  return await getAllUsersWithRoles(filters);
}

// Get single user with full details
export async function getUserDetails(userId: string) {
  await checkSuperAdminAccess();
  return await getUserWithFullDetails(userId);
}

// Create a new user with role assignment
export async function createUser(data: CreateUserData) {
  await checkSuperAdminAccess();

  // Generate unique user ID
  const userId = crypto.randomUUID();

  return await createUserWithRoleQuery({
    id: userId,
    name: data.name,
    email: data.email,
    accountId: BigInt(data.accountId),
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    timezone: data.timezone ?? "UTC",
    language: data.language ?? "es",
    roleId: data.roleId,
    isVerified: data.isVerified ?? false,
    isActive: data.isActive ?? true,
  });
}

// Update user information
export async function updateUser(userId: string, data: UpdateUserData) {
  await checkSuperAdminAccess();

  // First get the user to check if they exist and get their account
  const existingUser = await getUserWithFullDetails(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  return await updateUserByAccount(userId, existingUser.accountId!, data);
}

// Delete user (soft delete by setting isActive to false)
export async function deleteUser(userId: string) {
  const user = await checkSuperAdminAccess();

  // Get user to check if they exist and get their account
  const existingUser = await getUserWithFullDetails(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  // Prevent self-deletion
  if (existingUser.id === user.id) {
    throw new Error("Cannot delete your own account");
  }

  return await deleteUserByAccount(userId, existingUser.accountId!);
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: number) {
  await checkSuperAdminAccess();
  return await updateUserRole(userId, roleId);
}

// Remove role from user
export async function removeRoleFromUser(userId: string, roleId: number) {
  await checkSuperAdminAccess();
  return await removeUserRole(userId, roleId);
}

// Bulk operations on multiple users
export async function bulkUserActions(operation: BulkUserOperation) {
  await checkSuperAdminAccess();

  return await bulkUserOperationsQuery(operation.operation, operation.userIds);
}

// Search users with advanced filters
export async function advancedUserSearch(filters: {
  search?: string;
  accountId?: number;
  roleIds?: number[];
  isActive?: boolean;
  hasRole?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}) {
  await checkSuperAdminAccess();
  return await searchUsersWithFilters(filters);
}

// Toggle user active status
export async function toggleUserStatus(userId: string) {
  await checkSuperAdminAccess();

  const user = await getUserWithFullDetails(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const newStatus = !user.isActive;

  await updateUserByAccount(userId, user.accountId!, { isActive: newStatus });

  return { success: true, isActive: newStatus };
}

// Get users by role
export async function getUsersByRole(roleId: number) {
  await checkSuperAdminAccess();

  // This would need to be implemented in the queries file
  // For now, we can use the search functionality
  return await searchUsersWithFilters({ roleIds: [roleId] });
}
