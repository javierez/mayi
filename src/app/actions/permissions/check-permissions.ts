"use server";

import { getUserPermissionsForCurrentUser } from "~/lib/dal";
import type { PermissionsObject } from "~/lib/auth";

/**
 * Server action to get current user's permissions
 * Can be called from client components
 */
export async function getCurrentUserPermissionsAction(): Promise<PermissionsObject> {
  try {
    const permissions = await getUserPermissionsForCurrentUser();
    return permissions as PermissionsObject;
  } catch (error) {
    console.error("Error fetching permissions in server action:", error);
    return {};
  }
}

/**
 * Check if user can delete properties
 */
export async function canDeleteProperties(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.properties?.delete);
  } catch (error) {
    console.error("❌ Error checking delete permission:", error);
    return false;
  }
}

/**
 * Check if user can edit properties
 */
export async function canEditProperties(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.properties?.edit);
  } catch (error) {
    console.error("❌ Error checking edit permission:", error);
    return false;
  }
}

/**
 * Check if user can edit all tasks
 */
export async function canEditAllTasks(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.tasks?.editAll);
  } catch (error) {
    console.error("❌ Error checking edit all tasks permission:", error);
    return false;
  }
}

/**
 * Check if user can delete all tasks
 */
export async function canDeleteAllTasks(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.tasks?.deleteAll);
  } catch (error) {
    console.error("❌ Error checking delete all tasks permission:", error);
    return false;
  }
}

/**
 * Check if user can edit calendar
 */
export async function canEditCalendar(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    const canEdit = Boolean(permissions.calendar?.edit);
    console.log("🔐 [Server] canEditCalendar check:", {
      calendarPermissions: permissions.calendar,
      canEdit,
    });
    return canEdit;
  } catch (error) {
    console.error(
      "❌ [Server] Error checking edit calendar permission:",
      error,
    );
    return false;
  }
}

/**
 * Check if user can delete calendar
 */
export async function canDeleteCalendar(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    const canDelete = Boolean(permissions.calendar?.delete);
    console.log("🔐 [Server] canDeleteCalendar check:", {
      calendarPermissions: permissions.calendar,
      canDelete,
    });
    return canDelete;
  } catch (error) {
    console.error(
      "❌ [Server] Error checking delete calendar permission:",
      error,
    );
    return false;
  }
}

/**
 * Check if user can edit contacts
 */
export async function canEditContacts(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.contacts?.edit);
  } catch (error) {
    console.error("❌ Error checking edit contacts permission:", error);
    return false;
  }
}

/**
 * Check if user can delete contacts
 */
export async function canDeleteContacts(): Promise<boolean> {
  try {
    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;
    return Boolean(permissions.contacts?.delete);
  } catch (error) {
    console.error("❌ Error checking delete contacts permission:", error);
    return false;
  }
}

/**
 * Check if user can edit a specific task
 * @param taskCreatorId - The createdBy userId of the task creator
 * @returns true if user has editAll permission OR (has editOwn permission AND is the task creator)
 */
export async function canEditTask(taskCreatorId: string | null): Promise<boolean> {
  try {
    const { getSecureSession } = await import("~/lib/dal");
    const session = await getSecureSession();
    if (!session?.user?.id) return false;

    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;

    // Can edit if has editAll permission
    if (permissions.tasks?.editAll) return true;

    // Can edit if has editOwn permission AND is the task creator
    if (permissions.tasks?.editOwn && taskCreatorId === session.user.id) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error checking edit task permission:", error);
    return false;
  }
}

/**
 * Check if user can delete a specific task
 * @param taskCreatorId - The createdBy userId of the task creator
 * @returns true if user has deleteAll permission OR (has deleteOwn permission AND is the task creator)
 */
export async function canDeleteTask(taskCreatorId: string | null): Promise<boolean> {
  try {
    const { getSecureSession } = await import("~/lib/dal");
    const session = await getSecureSession();
    if (!session?.user?.id) return false;

    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;

    // Can delete if has deleteAll permission
    if (permissions.tasks?.deleteAll) return true;

    // Can delete if has deleteOwn permission AND is the task creator
    if (permissions.tasks?.deleteOwn && taskCreatorId === session.user.id) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error checking delete task permission:", error);
    return false;
  }
}
