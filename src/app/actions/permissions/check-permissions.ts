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
    
    console.log("🔐 [canEditAllTasks] Checking permissions:", {
      editAll: permissions.tasks?.editAll,
      tasksPermissions: permissions.tasks,
    });

    // Can edit all if has editAll permission
    if (permissions.tasks?.editAll) {
      console.log("✅ [canEditAllTasks] Allowed: has editAll permission");
      return true;
    }

    // Check if user has elevated roles (Admin de Cuenta / account_manager or Administrador)
    // These roles should have all accesses
    try {
      const { getUserRolesForCurrentUser } = await import("~/lib/dal");
      const userRoles = await getUserRolesForCurrentUser();
      console.log("🔐 [canEditAllTasks] Checking roles:", {
        userRoles,
        roleCount: userRoles.length,
      });

      const hasElevatedRole = userRoles.some(
        (role) =>
          role.toLowerCase().includes("admin") ||
          role.toLowerCase() === "account_manager" ||
          role.toLowerCase() === "administrador"
      );
      
      if (hasElevatedRole) {
        console.log("✅ [canEditAllTasks] Allowed: has elevated role", {
          matchingRoles: userRoles.filter(
            (role) =>
              role.toLowerCase().includes("admin") ||
              role.toLowerCase() === "account_manager" ||
              role.toLowerCase() === "administrador"
          ),
        });
        return true;
      } else {
        console.log("❌ [canEditAllTasks] Denied: no elevated role found", {
          userRoles,
        });
      }
    } catch (roleError) {
      // If role check fails, continue with permission check
      console.warn("⚠️ [canEditAllTasks] Could not check user roles:", roleError);
    }

    console.log("❌ [canEditAllTasks] Denied: no permission or elevated role");
    return false;
  } catch (error) {
    console.error("❌ [canEditAllTasks] Error checking permission:", error);
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
    
    console.log("🔐 [canDeleteAllTasks] Checking permissions:", {
      deleteAll: permissions.tasks?.deleteAll,
      tasksPermissions: permissions.tasks,
    });

    // Can delete all if has deleteAll permission
    if (permissions.tasks?.deleteAll) {
      console.log("✅ [canDeleteAllTasks] Allowed: has deleteAll permission");
      return true;
    }

    // Check if user has elevated roles (Admin de Cuenta / account_manager or Administrador)
    // These roles should have all accesses
    try {
      const { getUserRolesForCurrentUser } = await import("~/lib/dal");
      const userRoles = await getUserRolesForCurrentUser();
      console.log("🔐 [canDeleteAllTasks] Checking roles:", {
        userRoles,
        roleCount: userRoles.length,
      });

      const hasElevatedRole = userRoles.some(
        (role) =>
          role.toLowerCase().includes("admin") ||
          role.toLowerCase() === "account_manager" ||
          role.toLowerCase() === "administrador"
      );
      
      if (hasElevatedRole) {
        console.log("✅ [canDeleteAllTasks] Allowed: has elevated role", {
          matchingRoles: userRoles.filter(
            (role) =>
              role.toLowerCase().includes("admin") ||
              role.toLowerCase() === "account_manager" ||
              role.toLowerCase() === "administrador"
          ),
        });
        return true;
      } else {
        console.log("❌ [canDeleteAllTasks] Denied: no elevated role found", {
          userRoles,
        });
      }
    } catch (roleError) {
      // If role check fails, continue with permission check
      console.warn("⚠️ [canDeleteAllTasks] Could not check user roles:", roleError);
    }

    console.log("❌ [canDeleteAllTasks] Denied: no permission or elevated role");
    return false;
  } catch (error) {
    console.error("❌ [canDeleteAllTasks] Error checking permission:", error);
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
    const { getUserRolesForCurrentUser } = await import("~/lib/dal");
    const session = await getSecureSession();
    if (!session?.user?.id) {
      console.log("❌ [canEditTask] Denied: no session");
      return false;
    }

    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;

    console.log("🔐 [canEditTask] Checking permissions:", {
      userId: session.user.id,
      taskCreatorId,
      isCreator: taskCreatorId === session.user.id,
      editAll: permissions.tasks?.editAll,
      editOwn: permissions.tasks?.editOwn,
      tasksPermissions: permissions.tasks,
    });

    // Can edit if has editAll permission
    if (permissions.tasks?.editAll) {
      console.log("✅ [canEditTask] Allowed: has editAll permission");
      return true;
    }

    // Check if user has elevated roles (Admin de Cuenta / account_manager or Administrador)
    // These roles should have all accesses
    try {
      const userRoles = await getUserRolesForCurrentUser();
      console.log("🔐 [canEditTask] Checking roles:", {
        userRoles,
        roleCount: userRoles.length,
      });

      const hasElevatedRole = userRoles.some(
        (role) =>
          role.toLowerCase().includes("admin") ||
          role.toLowerCase() === "account_manager" ||
          role.toLowerCase() === "administrador"
      );
      
      if (hasElevatedRole) {
        console.log("✅ [canEditTask] Allowed: has elevated role", {
          matchingRoles: userRoles.filter(
            (role) =>
              role.toLowerCase().includes("admin") ||
              role.toLowerCase() === "account_manager" ||
              role.toLowerCase() === "administrador"
          ),
        });
        return true;
      } else {
        console.log("❌ [canEditTask] No elevated role found", {
          userRoles,
        });
      }
    } catch (roleError) {
      // If role check fails, continue with permission check
      console.warn("⚠️ [canEditTask] Could not check user roles:", roleError);
    }

    // Can edit if has editOwn permission AND is the task creator
    if (permissions.tasks?.editOwn && taskCreatorId === session.user.id) {
      console.log("✅ [canEditTask] Allowed: has editOwn permission and is creator");
      return true;
    }

    console.log("❌ [canEditTask] Denied: no permission or elevated role, and not creator");
    return false;
  } catch (error) {
    console.error("❌ [canEditTask] Error checking permission:", error);
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
    const { getUserRolesForCurrentUser } = await import("~/lib/dal");
    const session = await getSecureSession();
    if (!session?.user?.id) {
      console.log("❌ [canDeleteTask] Denied: no session");
      return false;
    }

    const permissions =
      (await getUserPermissionsForCurrentUser()) as PermissionsObject;

    console.log("🔐 [canDeleteTask] Checking permissions:", {
      userId: session.user.id,
      taskCreatorId,
      isCreator: taskCreatorId === session.user.id,
      deleteAll: permissions.tasks?.deleteAll,
      deleteOwn: permissions.tasks?.deleteOwn,
      tasksPermissions: permissions.tasks,
    });

    // Can delete if has deleteAll permission
    if (permissions.tasks?.deleteAll) {
      console.log("✅ [canDeleteTask] Allowed: has deleteAll permission");
      return true;
    }

    // Check if user has elevated roles (Admin de Cuenta / account_manager or Administrador)
    // These roles should have all accesses
    try {
      const userRoles = await getUserRolesForCurrentUser();
      console.log("🔐 [canDeleteTask] Checking roles:", {
        userRoles,
        roleCount: userRoles.length,
      });

      const hasElevatedRole = userRoles.some(
        (role) =>
          role.toLowerCase().includes("admin") ||
          role.toLowerCase() === "account_manager" ||
          role.toLowerCase() === "administrador"
      );
      
      if (hasElevatedRole) {
        console.log("✅ [canDeleteTask] Allowed: has elevated role", {
          matchingRoles: userRoles.filter(
            (role) =>
              role.toLowerCase().includes("admin") ||
              role.toLowerCase() === "account_manager" ||
              role.toLowerCase() === "administrador"
          ),
        });
        return true;
      } else {
        console.log("❌ [canDeleteTask] No elevated role found", {
          userRoles,
        });
      }
    } catch (roleError) {
      // If role check fails, continue with permission check
      console.warn("⚠️ [canDeleteTask] Could not check user roles:", roleError);
    }

    // Can delete if has deleteOwn permission AND is the task creator
    if (permissions.tasks?.deleteOwn && taskCreatorId === session.user.id) {
      console.log("✅ [canDeleteTask] Allowed: has deleteOwn permission and is creator");
      return true;
    }

    console.log("❌ [canDeleteTask] Denied: no permission or elevated role, and not creator");
    return false;
  } catch (error) {
    console.error("❌ [canDeleteTask] Error checking permission:", error);
    return false;
  }
}
