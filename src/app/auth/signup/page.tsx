"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { signIn } from "~/lib/auth-client";
import { AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { assignUserRole } from "~/app/actions/user-roles";
import { validateInvitationCode } from "~/app/actions/accounts";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = async () => {
    if (!formData.firstName.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("El apellido es obligatorio");
      return false;
    }
    if (!formData.email.trim()) {
      setError("El email es obligatorio");
      return false;
    }
    if (formData.phone && !formData.phone.trim()) {
      setError("El teléfono no puede estar vacío");
      return false;
    }
    if (!formData.password) {
      setError("La contraseña es obligatoria");
      return false;
    }
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    if (!formData.inviteCode.trim()) {
      setError("El código de invitación es obligatorio");
      return false;
    }

    // Validate invitation code
    const accountId = parseInt(formData.inviteCode);
    if (isNaN(accountId)) {
      setError("El código de invitación debe ser un número válido");
      return false;
    }

    try {
      const validation = await validateInvitationCode(accountId);
      if (!validation.isValid) {
        setError(validation.message);
        return false;
      }
    } catch {
      setError("Error al validar el código de invitación");
      return false;
    }

    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!(await validateForm())) {
      setIsLoading(false);
      return;
    }

    try {
      // Make a direct API call to Better Auth's signup endpoint with additional fields
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone.trim() || undefined,
          accountId: Number(formData.inviteCode),
        }),
      });

      const result = (await response.json()) as {
        error?: { message?: string };
        message?: string;
        user?: { id: string };
      };

      if (!response.ok || result.error) {
        setError(
          result.error?.message ?? result.message ?? "Error al crear la cuenta",
        );
        return;
      }

      // Assign inactive role to the new user
      if (result.user?.id) {
        try {
          console.log("Attempting to assign role to user:", result.user.id);
          const roleResult = await assignUserRole(result.user.id, 5); // Assign inactive role (roleId = 5)
          console.log("Role assignment result:", roleResult);
        } catch (roleError) {
          console.error("Failed to assign user role:", roleError);
          // Don't fail the signup process if role assignment fails
        }
      } else {
        console.log("No user ID found in result:", result);
      }

      setSuccess(true);

      // Redirect to operaciones after successful registration
      void setTimeout(() => {
        router.push("/operaciones");
      }, 2000);
    } catch (err) {
      setError("Error inesperado al crear la cuenta");
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/auth/account-setup", // Redirect to account setup instead of dashboard
      });
    } catch (err) {
      setError("Error al registrarse con Google");
      console.error("Google sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                ¡Cuenta creada exitosamente!
              </h2>
              <p className="mb-4 text-gray-600">
                Te estamos redirigiendo al dashboard...
              </p>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Image
              src="/vestazoomin.jpeg"
              alt="Vesta Logo"
              width={200}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>
              Crea tu cuenta para acceder a Vesta CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="inviteCode">Código de Invitación</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  value={formData.inviteCode}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  placeholder="Ingresa tu código de invitación"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Solicita un código de invitación a tu administrador
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="+34 600 000 000"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Opcional
                </p>
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Al menos 8 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    placeholder="Repite tu contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            <div className="flex items-center justify-center gap-4 text-center">
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-600 transition-all hover:bg-gradient-to-r hover:from-amber-400 hover:to-rose-400 hover:bg-clip-text hover:text-transparent"
              >
                Inicia sesión
              </Link>
            </div>

            <div className="text-center text-xs text-gray-500">
              Al crear una cuenta, aceptas nuestros{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-500"
              >
                Política de Privacidad
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
