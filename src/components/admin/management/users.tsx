"use client";

import { useState, useEffect, useCallback } from "react";
import type { FC } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserX,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignRoleToUser,
  bulkUserActions,
} from "~/app/actions/users";
import { searchAccounts } from "~/app/actions/accounts";
import type {
  UserWithRoles,
  UserFilters,
  CreateUserData,
  UpdateUserData,
  BulkUserOperation,
  AccountOption,
  RoleOption,
} from "~/types/user-management";

// Mock roles - In a real app, you'd fetch these from the database
const AVAILABLE_ROLES: RoleOption[] = [
  { roleId: 1, name: "agent", description: "Agente con permisos básicos" },
  { roleId: 2, name: "superadmin", description: "Acceso completo al sistema" },
  {
    roleId: 3,
    name: "admin de cuenta",
    description: "Administrador de cuenta",
  },
];

interface UserFormData {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  timezone: string;
  language: string;
  roleId: string;
  accountId: string;
  isVerified: boolean;
  isActive: boolean;
}

export const UsersManagement: FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: "",
    statusFilter: "active",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    page: 1,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleEditDialogOpen, setIsRoleEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Helper function to get Spanish role names
  const getRoleDisplayName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      superadmin: "Superadmin",
      admin: "Administrador",
      "account-admin": "Admin de Cuenta",
      account_admin: "Admin de Cuenta",
      "admin de cuenta": "Admin de Cuenta",
      agent: "Agente",
    };
    return roleMap[roleName?.toLowerCase()] ?? roleName ?? "Sin rol";
  };

  // Helper function to get role badge variant
  const getRoleBadgeVariant = (
    roleName: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    const roleMap: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      superadmin: "destructive",
      admin: "default",
      "account-admin": "default",
      account_admin: "default",
      "admin de cuenta": "default",
      agent: "secondary",
    };
    return roleMap[roleName?.toLowerCase()] ?? "outline";
  };

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    timezone: "UTC",
    language: "es",
    roleId: "",
    accountId: "",
    isVerified: false,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      timezone: "UTC",
      language: "es",
      roleId: "",
      accountId: "",
      isVerified: false,
      isActive: true,
    });
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchUsers(filters);
      setUsers(result.users);
      setPagination({
        totalCount: result.pagination.totalCount,
        totalPages: result.pagination.totalPages,
        page: result.pagination.page,
      });
    } catch (error) {
      toast.error("Error al cargar usuarios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAccounts = useCallback(async () => {
    try {
      const result = await searchAccounts();
      setAccounts(
        result.map((account) => ({
          accountId: Number(account.accountId),
          name: account.name,
          plan: account.plan ?? undefined,
        })),
      );
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  }, []);

  const handleCreateUser = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const userData: CreateUserData = {
        name: formData.name,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone ?? undefined,
        timezone: formData.timezone,
        language: formData.language,
        roleId: formData.roleId ? parseInt(formData.roleId) : undefined,
        accountId: parseInt(formData.accountId),
        isVerified: formData.isVerified,
        isActive: formData.isActive,
      };

      await createUser(userData);
      toast.success("Usuario creado exitosamente");
      setIsCreateDialogOpen(false);
      resetForm();
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear usuario",
      );
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || isUpdating) return;

    setIsUpdating(true);
    try {
      const updateData: UpdateUserData = {
        name: formData.name,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone ?? undefined,
        timezone: formData.timezone,
        language: formData.language,
        isVerified: formData.isVerified,
        isActive: formData.isActive,
      };

      await updateUser(selectedUser.id, updateData);

      // Update role if changed
      if (
        formData.roleId &&
        selectedUser.roles[0]?.roleId !== parseInt(formData.roleId)
      ) {
        await assignRoleToUser(selectedUser.id, parseInt(formData.roleId));
      }

      toast.success("Usuario actualizado exitosamente");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar usuario",
      );
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      await deleteUser(userId);
      toast.success("Usuario eliminado exitosamente");
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar usuario",
      );
      console.error(error);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const result = await toggleUserStatus(userId);
      toast.success(
        `Usuario ${result.isActive ? "activado" : "desactivado"} exitosamente`,
      );
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al cambiar estado del usuario",
      );
      console.error(error);
    }
  };

  const handleBulkAction = async (
    action: "activate" | "deactivate" | "delete",
  ) => {
    if (selectedUsers.length === 0) {
      toast.error("Selecciona al menos un usuario");
      return;
    }

    const actionText = {
      activate: "activar",
      deactivate: "desactivar",
      delete: "eliminar",
    }[action];

    if (
      !confirm(
        `¿Estás seguro de que quieres ${actionText} ${selectedUsers.length} usuario(s)?`,
      )
    ) {
      return;
    }

    try {
      const bulkOperation: BulkUserOperation = {
        operation: action,
        userIds: selectedUsers,
      };

      await bulkUserActions(bulkOperation);
      toast.success(
        `${selectedUsers.length} usuario(s) ${actionText}(s) exitosamente`,
      );
      setSelectedUsers([]);
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Error al ${actionText} usuarios`,
      );
      console.error(error);
    }
  };

  const openEditDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      timezone: "UTC", // We'll need to add this to the user type
      language: "es", // We'll need to add this to the user type
      roleId: user.roles[0]?.roleId.toString() ?? "",
      accountId: user.accountId?.toString() ?? "",
      isVerified: user.isVerified ?? false,
      isActive: user.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const openRoleEditDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      roleId: user.roles[0]?.roleId.toString() ?? "",
    }));
    setIsRoleEditDialogOpen(true);
  };

  const handleRoleEdit = async () => {
    if (!selectedUser || !formData.roleId || isUpdating) return;

    setIsUpdating(true);
    try {
      await assignRoleToUser(selectedUser.id, parseInt(formData.roleId));
      toast.success("Rol actualizado exitosamente");
      setIsRoleEditDialogOpen(false);
      setSelectedUser(null);
      void loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar rol",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  // Load data on component mount
  useEffect(() => {
    void loadUsers();
    void loadAccounts();
  }, [loadUsers, loadAccounts]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa la información para crear un nuevo usuario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-name" className="text-right">
                    Nombre *
                  </Label>
                  <Input
                    id="create-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-email" className="text-right">
                    Email *
                  </Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-firstName" className="text-right">
                    Nombre *
                  </Label>
                  <Input
                    id="create-firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-lastName" className="text-right">
                    Apellido
                  </Label>
                  <Input
                    id="create-lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-phone" className="text-right">
                    Teléfono
                  </Label>
                  <Input
                    id="create-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-account" className="text-right">
                    Cuenta *
                  </Label>
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, accountId: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.accountId}
                          value={account.accountId.toString()}
                        >
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-role" className="text-right">
                    Rol
                  </Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, roleId: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem
                          key={role.roleId}
                          value={role.roleId.toString()}
                        >
                          {getRoleDisplayName(role.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-language" className="text-right">
                    Idioma
                  </Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ca">Català</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-isVerified" className="text-right">
                    Verificado
                  </Label>
                  <Switch
                    id="create-isVerified"
                    checked={formData.isVerified}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isVerified: checked })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="create-isActive" className="text-right">
                    Activo
                  </Label>
                  <Switch
                    id="create-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>

          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Bulk actions */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedUsers.length} seleccionado(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("activate")}
            >
              <UserCheck className="mr-1 h-3 w-3" />
              Activar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("deactivate")}
            >
              <UserX className="mr-1 h-3 w-3" />
              Desactivar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction("delete")}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Nombre, email..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cuenta</Label>
                <Select
                  value={filters.accountId?.toString() ?? "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      accountId:
                        value && value !== "all" ? parseInt(value) : undefined,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account.accountId}
                        value={account.accountId.toString()}
                      >
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select
                  value={filters.statusFilter}
                  onValueChange={(value: "active" | "inactive" | "all") =>
                    setFilters({ ...filters, statusFilter: value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Rol</Label>
                <Select
                  value={filters.roleFilter?.toString() ?? "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      roleFilter:
                        value && value !== "all" ? parseInt(value) : undefined,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem
                        key={role.roleId}
                        value={role.roleId.toString()}
                      >
                        {getRoleDisplayName(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ordenar por</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(
                    value: "name" | "email" | "createdAt" | "lastLogin",
                  ) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="createdAt">Fecha de creación</SelectItem>
                    <SelectItem value="lastLogin">Último acceso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="mb-4 h-12 w-12 text-gray-400" />
              <p className="text-center text-gray-500">
                {filters.search ||
                filters.roleFilter ||
                filters.accountId ||
                filters.statusFilter !== "active"
                  ? "No se encontraron usuarios con los filtros actuales"
                  : "No hay usuarios registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select all checkbox */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedUsers.length === users.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    Seleccionar todos ({users.length})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Users */}
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name}</h3>
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role.roleId}
                                variant={getRoleBadgeVariant(role.name)}
                                className="text-xs font-medium"
                              >
                                {getRoleDisplayName(role.name)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Sin rol
                            </Badge>
                          )}
                          <Badge
                            variant={user.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          {user.isVerified && (
                            <Badge variant="outline" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          {user.accountName && (
                            <p className="font-semibold text-gray-900">
                              {user.accountName}
                            </p>
                          )}
                          <p className="text-gray-600">{user.email}</p>
                          {user.phone && (
                            <p className="text-gray-600">
                              Teléfono: {user.phone}
                            </p>
                          )}
                          <p className="text-gray-600">
                            Creado: {user.createdAt.toLocaleDateString()}
                          </p>
                          {user.lastLogin && (
                            <p className="text-gray-600">
                              Último acceso:{" "}
                              {user.lastLogin.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openRoleEditDialog(user)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Cambiar Rol
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {(pagination.page - 1) * (filters.limit ?? 10) + 1} a{" "}
            {Math.min(
              pagination.page * (filters.limit ?? 10),
              pagination.totalCount,
            )}{" "}
            de {pagination.totalCount} usuarios
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setFilters({ ...filters, page: pagination.page - 1 })
              }
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters({ ...filters, page: pagination.page + 1 })
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Same form fields as create, but pre-filled */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nombre *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-firstName" className="text-right">
                Nombre *
              </Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lastName" className="text-right">
                Apellido
              </Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Rol
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      {getRoleDisplayName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isVerified" className="text-right">
                Verificado
              </Label>
              <Switch
                id="edit-isVerified"
                checked={formData.isVerified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isVerified: checked })
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Activo
              </Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Actualizar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog
        open={isRoleEditDialogOpen}
        onOpenChange={setIsRoleEditDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roleSelect" className="text-right">
                Rol
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRoleBadgeVariant(role.name)}
                          className="text-xs"
                        >
                          {getRoleDisplayName(role.name)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRoleEdit}
              disabled={isUpdating || !formData.roleId}
            >
              {isUpdating ? "Actualizando..." : "Actualizar Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
