import { getAccountRolesWithAuth } from "~/server/queries/account-roles";
import { ROLE_NAMES } from "~/types/account-roles";
import type {
  AccountRole,
  AccountRolePermissions,
} from "~/types/account-roles";
import PrivacyPermissionsClient from "./privacy-client";

export const dynamic = "force-dynamic";

// Default permissions for each role
const DEFAULT_PERMISSIONS: Record<number, AccountRolePermissions> = {
  1: {
    // Administrador (Superadmin - internal only)
    tasks: {
      viewAll: true,
      editOwn: true,
      editAll: true,
      deleteOwn: true,
      deleteAll: true,
    },
    properties: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
      publish: true,
    },
    contacts: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
    },
    calendar: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
    },
    tools: { imageStudio: true, aiTools: true, export: true },
    admin: {
      manageUsers: true,
      manageRoles: true,
      viewReports: true,
      manageAccount: true,
      manageBilling: true,
    },
  },
  2: {
    // Agente
    tasks: {
      viewAll: false,
      editOwn: true,
      editAll: false,
      deleteOwn: true,
      deleteAll: false,
    },
    properties: {
      viewOwn: true,
      viewAll: false,
      create: true,
      edit: true,
      delete: false,
      publish: false,
    },
    contacts: {
      viewOwn: true,
      viewAll: false,
      create: true,
      edit: true,
      delete: false,
    },
    calendar: {
      viewOwn: true,
      viewAll: false,
      create: true,
      edit: true,
      delete: true,
    },
    tools: { imageStudio: false, aiTools: true, export: false },
    admin: {
      manageUsers: false,
      manageRoles: false,
      viewReports: false,
      manageAccount: false,
      manageBilling: false,
    },
  },
  3: {
    // Admin de Cuenta
    tasks: {
      viewAll: true,
      editOwn: true,
      editAll: true,
      deleteOwn: true,
      deleteAll: true,
    },
    properties: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
      publish: true,
    },
    contacts: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
    },
    calendar: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
    },
    tools: { imageStudio: true, aiTools: true, export: true },
    admin: {
      manageUsers: true,
      manageRoles: true,
      viewReports: true,
      manageAccount: true,
      manageBilling: true,
    },
  },
  4: {
    // Gestor de Oficina
    tasks: {
      viewAll: true,
      editOwn: true,
      editAll: true,
      deleteOwn: true,
      deleteAll: true,
    },
    properties: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: false,
      publish: true,
    },
    contacts: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: false,
    },
    calendar: {
      viewOwn: true,
      viewAll: true,
      create: true,
      edit: true,
      delete: true,
    },
    tools: { imageStudio: true, aiTools: true, export: true },
    admin: {
      manageUsers: true,
      manageRoles: false,
      viewReports: true,
      manageAccount: false,
      manageBilling: false,
    },
  },
  5: {
    // Inactivo
    tasks: {
      viewAll: false,
      editOwn: false,
      editAll: false,
      deleteOwn: false,
      deleteAll: false,
    },
    properties: {
      viewOwn: false,
      viewAll: false,
      create: false,
      edit: false,
      delete: false,
      publish: false,
    },
    contacts: {
      viewOwn: false,
      viewAll: false,
      create: false,
      edit: false,
      delete: false,
    },
    calendar: {
      viewOwn: false,
      viewAll: false,
      create: false,
      edit: false,
      delete: false,
    },
    tools: { imageStudio: false, aiTools: false, export: false },
    admin: {
      manageUsers: false,
      manageRoles: false,
      viewReports: false,
      manageAccount: false,
      manageBilling: false,
    },
  },
};

export default async function PrivacyPermissionsPage() {
  // Fetch existing roles from database
  const existingRoles = await getAccountRolesWithAuth();

  // Create a map of existing roles by roleId
  const existingRolesMap = new Map(
    existingRoles.map((role) => [role.roleId, role]),
  );

  // Generate all roles from ROLE_NAMES constant, using existing data or defaults
  // Exclude role_id 1 (Superadmin - internal only) and role_id 5 (Inactive role) from the UI
  const allRoles: AccountRole[] = Object.keys(ROLE_NAMES)
    .map(Number)
    .filter((roleId) => roleId !== 1 && roleId !== 5) // Exclude superadmin and inactive role from UI
    .map((roleId) => {
      const existingRole = existingRolesMap.get(roleId);

      if (existingRole) {
        // Use existing role from database
        return existingRole;
      } else {
        // Create a placeholder role with default permissions
        return {
          accountRoleId: 0, // Indicates this doesn't exist in DB yet
          roleId,
          accountId: 0, // Will be set on save
          permissions: DEFAULT_PERMISSIONS[roleId] ?? {},
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
      }
    });

  return <PrivacyPermissionsClient initialRoles={allRoles} />;
}
