"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  Building2,
  Users,
  ArrowRight,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { validateInvitationCode } from "~/app/actions/accounts";
import { updateUserAccount } from "~/app/actions/user-account";
import { assignUserRole } from "~/app/actions/user-roles";
import { useSession, getSession } from "~/lib/auth-client";

export default function AccountSetupPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"invite" | "create">("invite"); // Toggle between modes
  const [companyName, setCompanyName] = useState("");

  const { data: session } = useSession();

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!inviteCode.trim()) {
      setError("El código de invitación es obligatorio");
      setIsLoading(false);
      return;
    }

    // Validate invitation code
    const accountId = parseInt(inviteCode);
    if (isNaN(accountId)) {
      setError("El código de invitación debe ser un número válido");
      setIsLoading(false);
      return;
    }

    try {
      // Validate the invitation code
      const validation = await validateInvitationCode(accountId);
      if (!validation.isValid) {
        setError(validation.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setError("No se pudo obtener la información del usuario");
        setIsLoading(false);
        return;
      }

      // Update user's accountId
      const updateResult = await updateUserAccount(session.user.id, accountId);
      if (!updateResult.success) {
        setError(updateResult.error ?? "Error al asignar la cuenta");
        setIsLoading(false);
        return;
      }

      // Assign default agent role (roleId = 1)
      try {
        await assignUserRole(session.user.id, 1);
      } catch (roleError) {
        console.error("Failed to assign role:", roleError);
        // Don't fail the process if role assignment fails
      }

      // Force session refresh to get updated user data with accountId
      console.log("🔄 Refreshing session after account update...");
      await getSession();

      setSuccess(true);

      // Redirect to dashboard after successful setup
      setTimeout(() => {
        window.location.href = "/operaciones";
      }, 2000);
    } catch (err) {
      setError("Error inesperado al configurar la cuenta");
      console.error("Account setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!companyName.trim()) {
      setError("El nombre de la empresa es obligatorio");
      setIsLoading(false);
      return;
    }

    // Redirect to Calendly for organization creation request
    window.location.href = "https://calendly.com/kidoedu/kido-demo";
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardContent className="py-12 text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                ¡Cuenta configurada exitosamente!
              </h2>
              <p className="mb-6 text-gray-600">
                Te estamos redirigiendo al dashboard...
              </p>
              <div className="flex justify-center">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full animate-pulse bg-gradient-to-r from-gray-800 to-gray-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-lg px-4">
        <div className="text-center">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Bienvenido a Vesta
          </h1>
          <h2 className="mt-3 text-xl font-semibold text-gray-700">
            Un último paso
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Únete a una organización existente o solicita crear una nueva
          </p>
        </div>
      </div>

      <div className="mt-8 w-full max-w-lg px-4">
        {/* Mode Selection */}
        <div className="mb-6 flex gap-3 rounded-xl bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              mode === "invite"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Tengo un código</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
              mode === "create"
                ? "bg-gray-900 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Solicitar nueva</span>
          </button>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3">
              {mode === "invite" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <KeyRound className="h-5 w-5 text-gray-700" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Building2 className="h-5 w-5 text-gray-700" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">
                  {mode === "invite"
                    ? "Unirse a Organización"
                    : "Solicitar Creación"}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {mode === "invite"
                    ? "Usa el código proporcionado por tu administrador"
                    : "Solicita crear una nueva organización para tu equipo"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {session?.user && (
              <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {session.user.name ?? "Usuario"}
                    </p>
                    <p className="truncate text-xs text-gray-600">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mode === "invite" ? (
              <form onSubmit={handleInviteSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="inviteCode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Código de Invitación
                  </Label>
                  <div className="relative">
                    <Input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Ej: 1234"
                      className="h-12 pl-12 text-base"
                    />
                    <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Tu administrador te proporcionará este código
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-gray-900 font-medium hover:bg-gray-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uniéndose...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Unirse a Organización
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nombre de la Empresa
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Ej: Inmobiliaria Madrid"
                      className="h-12 pl-12 text-base"
                    />
                    <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Serás asignado como administrador de esta organización
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-gray-900 font-medium hover:bg-gray-800"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Procesando solicitud...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Solicitar Creación de Organización
                      <Sparkles className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">
                  {mode === "invite"
                    ? "¿No tienes código? Solicita crear una organización"
                    : "¿Ya tienes código? Úsalo para unirte"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
