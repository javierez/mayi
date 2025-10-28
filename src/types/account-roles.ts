export interface AccountRolePermissions {
  tasks?: {
    viewAll: boolean;
    editOwn: boolean;
    editAll: boolean;
    deleteOwn: boolean;
    deleteAll: boolean;
  };
  properties?: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    publish: boolean;
  };
  contacts?: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  calendar?: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  tools?: {
    imageStudio: boolean;
    aiTools: boolean;
    export: boolean;
  };
  admin?: {
    manageUsers: boolean;
    manageRoles: boolean;
    viewReports: boolean;
    manageAccount: boolean;
    manageBilling: boolean;
  };
}

export interface AccountRole {
  accountRoleId: number;
  roleId: number; // 1=Admin, 2=Agent, 3=Account Admin, 4=Office Manager, 5=Inactive
  accountId: number;
  permissions: AccountRolePermissions;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export const ROLE_NAMES: Record<number, string> = {
  1: "Administrador",
  2: "Agente",
  3: "Administrador de Cuenta",
  4: "Gestor de Oficina",
  5: "Inactivo",
};

export const ROLE_DESCRIPTIONS: Record<number, string> = {
  1: "Administrador con acceso completo al sistema",
  2: "Agente inmobiliario con acceso a gestión de propiedades",
  3: "Administrador de cuenta",
  4: "Gestor de oficina con coordinación de equipo",
  5: "Usuario sin permisos activos",
};

export const ROLE_COLORS: Record<number, string> = {
  1: "bg-purple-600",
  2: "bg-slate-500",
  3: "bg-emerald-600",
  4: "bg-blue-500",
  5: "bg-gray-400",
};
