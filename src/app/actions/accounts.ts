"use server";

import { getSecureSession } from "~/lib/dal";
import { redirect } from "next/navigation";
import {
  createAccount as createAccountQuery,
  searchAccounts as searchAccountsQuery,
  updateAccount as updateAccountQuery,
  deleteAccount as deleteAccountQuery,
  getAccountById as getAccountByIdQuery,
  validateInvitationCode as validateInvitationCodeQuery,
} from "~/server/queries/accounts";

// Helper function to check authenticated access
async function checkAuthenticatedAccess() {
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session.user;
}

// Create a new account
export async function createAccount(data: {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  plan?: string;
  subscriptionStatus?: string;
  isActive?: boolean;
}) {
  await checkAuthenticatedAccess();
  return await createAccountQuery(data);
}

// Search accounts
export async function searchAccounts(searchTerm = "") {
  await checkAuthenticatedAccess();
  return await searchAccountsQuery(searchTerm);
}

// Update an account
export async function updateAccount(
  accountId: number,
  data: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    plan?: string;
    subscriptionStatus?: string;
    isActive?: boolean;
  },
) {
  await checkAuthenticatedAccess();
  return await updateAccountQuery(accountId, data);
}

// Delete an account (soft delete by setting isActive to false)
export async function deleteAccount(accountId: number) {
  await checkAuthenticatedAccess();
  return await deleteAccountQuery(accountId);
}

// Get account by ID
export async function getAccountById(accountId: number) {
  await checkAuthenticatedAccess();
  return await getAccountByIdQuery(accountId);
}

// Validate invitation code (no auth required for signup)
export async function validateInvitationCode(accountId: number) {
  return await validateInvitationCodeQuery(accountId);
}
