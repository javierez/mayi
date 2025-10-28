// User management types for the admin interface

export interface UserRole {
  roleId: number;
  name: string;
  description: string | null;
  assignedAt: Date;
  permissions?: Record<string, unknown>; // Account-specific permissions
}

export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  image: string | null;
  isVerified: boolean | null;
  isActive: boolean | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  accountId: bigint | null;
  accountName: string | null;
  roles: UserRole[];
}

export interface UserDetails extends UserWithRoles {
  timezone: string | null;
  language: string | null;
  preferences: Record<string, unknown>;
  accountPlan: string | null;
}

export interface CreateUserData {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
  language?: string;
  roleId?: number;
  isVerified?: boolean;
  isActive?: boolean;
  accountId: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  accountId?: number;
  roleFilter?: number;
  statusFilter?: "active" | "inactive" | "all";
  sortBy?: "name" | "email" | "createdAt" | "lastLogin";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface UserPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface UsersResponse {
  users: UserWithRoles[];
  pagination: UserPagination;
}

export interface BulkUserOperation {
  operation: "activate" | "deactivate" | "delete";
  userIds: string[];
}

export interface RoleOption {
  roleId: number;
  name: string;
  description: string | null;
  permissions?: Record<string, unknown>;
}

export interface AccountOption {
  accountId: number;
  name: string;
  plan?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateUserResponse extends ApiResponse<UserDetails> {
  inviteLink?: string;
}

export type UpdateUserResponse = ApiResponse<UserDetails>;

export type DeleteUserResponse = ApiResponse<{ deletedUserId: string }>;

export type BulkOperationResponse = ApiResponse<{ affectedCount: number }>;

// Form types
export interface UserFormData {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  timezone: string;
  language: string;
  roleId: string; // String for form handling
  isVerified: boolean;
  isActive: boolean;
}

export interface UserFormErrors {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  roleId?: string;
  general?: string;
}

// Component props types
export interface UserCardProps {
  user: UserWithRoles;
  onEdit: (user: UserWithRoles) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
  onManageRoles: (user: UserWithRoles) => void;
}

export interface UserFormProps {
  user?: UserDetails;
  roles: RoleOption[];
  accounts: AccountOption[];
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface RoleSelectorProps {
  selectedRoleId?: number;
  roles: RoleOption[];
  onChange: (roleId: number) => void;
  showPermissions?: boolean;
}

export interface UserFiltersProps {
  filters: UserFilters;
  roles: RoleOption[];
  accounts: AccountOption[];
  onChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export interface BulkActionsProps {
  selectedUsers: string[];
  onBulkAction: (action: BulkUserOperation) => void;
  loading?: boolean;
}

// Permission-related types
export interface PermissionCategory {
  tasks: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  properties: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    publish: boolean;
  };
  contacts: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  calendar: {
    viewOwn: boolean;
    viewAll: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  tools: {
    imageStudio: boolean;
    aiTools: boolean;
    export: boolean;
  };
  admin: {
    manageUsers: boolean;
    manageRoles: boolean;
    viewReports: boolean;
    manageAccount: boolean;
    manageBilling: boolean;
  };
}

export interface RoleWithPermissions extends Omit<RoleOption, "permissions"> {
  permissions: PermissionCategory;
  isSystem: boolean;
  isActive: boolean;
}

// Table/List view types
export interface UserTableColumn {
  key: keyof UserWithRoles | "roles" | "actions";
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

// Search and filter types
export interface AdvancedSearchFilters {
  search?: string;
  accountId?: number;
  roleIds?: number[];
  isActive?: boolean;
  hasRole?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Status types
export type UserStatus = "active" | "inactive" | "pending" | "suspended";
export type LoadingState = "idle" | "loading" | "success" | "error";

// Modal/Dialog types
export interface UserModalState {
  isOpen: boolean;
  mode: "create" | "edit" | "view" | "delete";
  user?: UserDetails;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "warning" | "info";
}
