"use server";

import { getSecureSession } from "~/lib/dal";
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
import type {
  UserFilters,
  CreateUserData,
  UpdateUserData,
  BulkUserOperation,
} from "~/types/user-management";

// Helper function to check authenticated access
async function checkAuthenticatedAccess() {
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session.user;
}

// Get all users with roles and pagination
export async function searchUsers(filters?: UserFilters) {
  await checkAuthenticatedAccess();
  return await getAllUsersWithRoles(filters);
}

// Get single user with full details
export async function getUserDetails(userId: string) {
  await checkAuthenticatedAccess();
  return await getUserWithFullDetails(userId);
}

// Create a new user with role assignment
export async function createUser(data: CreateUserData) {
  await checkAuthenticatedAccess();

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
  await checkAuthenticatedAccess();

  // First get the user to check if they exist and get their account
  const existingUser = await getUserWithFullDetails(userId);

  if (!existingUser) {
    throw new Error("User not found");
  }

  return await updateUserByAccount(userId, existingUser.accountId!, data);
}

// Delete user (soft delete by setting isActive to false)
export async function deleteUser(userId: string) {
  const user = await checkAuthenticatedAccess();

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

// Bulk operations on multiple users
export async function bulkUserActions(operation: BulkUserOperation) {
  await checkAuthenticatedAccess();

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
  await checkAuthenticatedAccess();
  return await searchUsersWithFilters(filters);
}

// Toggle user active status
export async function toggleUserStatus(userId: string) {
  await checkAuthenticatedAccess();

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
  await checkAuthenticatedAccess();

  // This would need to be implemented in the queries file
  // For now, we can use the search functionality
  return await searchUsersWithFilters({ roleIds: [roleId] });
}
