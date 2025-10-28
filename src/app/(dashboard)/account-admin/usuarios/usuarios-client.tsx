"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Users, ChevronRight, UserCircle, Mail } from "lucide-react";
import { ROLE_NAMES, ROLE_COLORS } from "~/types/account-roles";
import { updateUserRole } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  roleId: number | null;
  userRoleId: number | null;
}

interface Props {
  initialUsers: UserWithRole[];
}

// Available roles for assignment (2: Agent, 4: Office Manager, 5: Inactive)
// Excludes role 1 (Superadmin) and role 3 (Account Admin) as they are protected roles
const AVAILABLE_ROLES = [2, 4, 5];

export default function UsuariosClient({ initialUsers }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialUsers.length > 0 ? initialUsers[0]!.id : null,
  );
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<number | null>(
    initialUsers.length > 0 ? initialUsers[0]!.roleId : null,
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    setSelectedRole(user?.roleId ?? null);
    setHasChanges(false);
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(Number(roleId));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedUserId || selectedRole === null) return;

    setSaving(true);
    try {
      const result = await updateUserRole(selectedUserId, selectedRole);

      if (result.success) {
        // Update local state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === selectedUserId
              ? { ...user, roleId: selectedRole }
              : user,
          ),
        );

        setHasChanges(false);
      } else {
        console.error("Error saving user role:", result.error);
        alert(`Error: ${result.error ?? "Failed to update user role"}`);
      }
    } catch (error) {
      console.error("Error saving user role:", error);
      alert("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedUser) {
      setSelectedRole(selectedUser.roleId);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los roles de los usuarios en tu organización
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Descartar cambios
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4">No hay usuarios disponibles para gestionar</p>
              <p className="mt-2 text-sm">
                Los usuarios con roles de Comercial y Administrador de Cuenta no
                se muestran aquí
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuarios
                </CardTitle>
                <CardDescription>
                  Selecciona un usuario para gestionar su rol
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                        selectedUserId === user.id ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                              <UserCircle className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                            {user.roleId && (
                              <div className="mt-1 flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${ROLE_COLORS[user.roleId] ?? "bg-gray-500"}`}
                                />
                                <span className="text-xs text-gray-600">
                                  {ROLE_NAMES[user.roleId] ?? "Sin rol"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role Assignment Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Asignación de Rol
                </CardTitle>
                <CardDescription>
                  Selecciona el rol para {selectedUser?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedUser && (
                  <>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center gap-4">
                        {selectedUser.image ? (
                          <Image
                            src={selectedUser.image}
                            alt={selectedUser.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                            <UserCircle className="h-10 w-10 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedUser.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedUser.email}
                          </p>
                          {selectedUser.roleId && (
                            <div className="mt-2 flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${ROLE_COLORS[selectedUser.roleId] ?? "bg-gray-500"}`}
                              />
                              <span className="text-sm text-gray-700">
                                Rol actual:{" "}
                                {ROLE_NAMES[selectedUser.roleId] ?? "Sin rol"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="role-select"
                          className="text-sm font-medium"
                        >
                          Seleccionar Rol
                        </Label>
                        <Select
                          value={selectedRole?.toString() ?? ""}
                          onValueChange={handleRoleChange}
                        >
                          <SelectTrigger id="role-select" className="mt-2">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_ROLES.map((roleId) => (
                              <SelectItem
                                key={roleId}
                                value={roleId.toString()}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2 w-2 rounded-full ${ROLE_COLORS[roleId] ?? "bg-gray-500"}`}
                                  />
                                  {ROLE_NAMES[roleId] ?? `Rol ${roleId}`}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedRole && (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <h4 className="mb-2 font-medium text-gray-900">
                            Descripción del Rol
                          </h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {selectedRole === 2 && (
                              <>
                                <p>
                                  <strong>Agente:</strong> Agente inmobiliario
                                  con acceso a gestión de propiedades.
                                </p>
                                <ul className="ml-2 list-inside list-disc space-y-1">
                                  <li>Ver y gestionar sus propias tareas</li>
                                  <li>Crear y editar propiedades</li>
                                  <li>Ver y gestionar sus propios contactos</li>
                                  <li>Acceso a herramientas básicas</li>
                                </ul>
                              </>
                            )}
                            {selectedRole === 4 && (
                              <>
                                <p>
                                  <strong>Gestor de Oficina:</strong> Gestión de
                                  oficina y coordinación de equipo.
                                </p>
                                <ul className="ml-2 list-inside list-disc space-y-1">
                                  <li>Ver todas las tareas y propiedades</li>
                                  <li>
                                    Gestionar usuarios (sin cambiar roles)
                                  </li>
                                  <li>Acceso a reportes</li>
                                  <li>No puede eliminar datos críticos</li>
                                </ul>
                              </>
                            )}
                            {selectedRole === 5 && (
                              <>
                                <p>
                                  <strong>Inactivo:</strong> Usuario sin
                                  permisos activos.
                                </p>
                                <ul className="ml-2 list-inside list-disc space-y-1">
                                  <li>Sin acceso a funcionalidades</li>
                                  <li>No puede ver ni gestionar datos</li>
                                  <li>Cuenta desactivada temporalmente</li>
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
