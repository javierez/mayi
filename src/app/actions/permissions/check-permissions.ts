"use server";

import { getSecureSession } from "~/lib/dal";

/**
 * Permission checks - Roles have been removed, so all authenticated users have full access
 */

export async function getCurrentUserPermissionsAction(): Promise<Record<string, unknown>> {
  const session = await getSecureSession();
  if (!session?.user) return {};

  // All permissions enabled
  return {
    properties: { view: true, create: true, edit: true, delete: true },
    contacts: { view: true, create: true, edit: true, delete: true },
    calendar: { view: true, create: true, edit: true, delete: true },
    tasks: { viewAll: true, editOwn: true, editAll: true, deleteOwn: true, deleteAll: true },
  };
}

export async function canDeleteProperties(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canEditProperties(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canEditAllTasks(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canDeleteAllTasks(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canEditCalendar(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canDeleteCalendar(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canEditContacts(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canDeleteContacts(): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canEditTask(_taskCreatorId: string | null): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}

export async function canDeleteTask(_taskCreatorId: string | null): Promise<boolean> {
  const session = await getSecureSession();
  return !!session?.user;
}
