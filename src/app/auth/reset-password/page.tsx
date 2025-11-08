"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetPassword } from "~/lib/auth-client";
import { AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import type { FC } from "react";

const ResetPasswordPage: FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token de restablecimiento no válido o expirado");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "La contraseña debe contener al menos una letra minúscula";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        setError(result.error.message ?? "Error al restablecer la contraseña");
        return;
      }

      setSuccess(true);

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin?message=password-reset-success");
      }, 3000);
    } catch (err) {
      setError("Error inesperado al restablecer la contraseña");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if no token
  if (!token && error) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
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

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                Enlace no válido
              </CardTitle>
              <CardDescription className="text-center">
                El enlace de restablecimiento no es válido o ha expirado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full border-0 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500">
                    Solicitar nuevo enlace
                  </Button>
                </Link>

                <div className="text-center">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
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

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-center">
                ¡Contraseña actualizada!
              </CardTitle>
              <CardDescription className="text-center">
                Tu contraseña ha sido restablecida exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      Tu contraseña ha sido actualizada correctamente. Serás
                      redirigido al inicio de sesión en unos segundos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/auth/signin">
                  <Button className="border-0 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500">
                    Ir al inicio de sesión
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white py-12 sm:px-6 lg:px-8">
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
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Crear nueva contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introduce tu nueva contraseña para restablecer el acceso a tu cuenta
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Contraseña</CardTitle>
            <CardDescription>
              Tu nueva contraseña debe ser segura y fácil de recordar para ti
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Introduce tu nueva contraseña"
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
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Confirma tu nueva contraseña"
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

              <div className="rounded bg-gray-50 p-3 text-xs text-gray-600">
                <p className="mb-2 font-medium">Requisitos de la contraseña:</p>
                <ul className="space-y-1">
                  <li
                    className={newPassword.length >= 8 ? "text-green-600" : ""}
                  >
                    • Al menos 8 caracteres
                  </li>
                  <li
                    className={
                      /(?=.*[a-z])/.test(newPassword) ? "text-green-600" : ""
                    }
                  >
                    • Una letra minúscula
                  </li>
                  <li
                    className={
                      /(?=.*[A-Z])/.test(newPassword) ? "text-green-600" : ""
                    }
                  >
                    • Una letra mayúscula
                  </li>
                  <li
                    className={
                      /(?=.*\d)/.test(newPassword) ? "text-green-600" : ""
                    }
                  >
                    • Al menos un número
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full border-0 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
