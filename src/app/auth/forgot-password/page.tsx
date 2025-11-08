"use client";

import { useState } from "react";
import Link from "next/link";
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
import { requestPasswordReset } from "~/lib/auth-client";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import type { FC } from "react";

const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (result.error) {
        setError(
          result.error.message ??
            "Error al enviar el email de restablecimiento",
        );
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Error inesperado al procesar la solicitud");
      console.error("Password reset request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-white py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Vesta{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                CRM
              </span>
            </h1>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Email enviado
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-center">Revisa tu email</CardTitle>
              <CardDescription className="text-center">
                Te hemos enviado un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      Hemos enviado un enlace de restablecimiento a{" "}
                      <span className="font-medium">{email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  <strong>¿Qué hacer ahora?</strong>
                </p>
                <ol className="list-inside list-decimal space-y-2">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>Busca un email de &ldquo;Vesta CRM&rdquo;</li>
                  <li>Haz clic en el enlace para restablecer tu contraseña</li>
                  <li>Si no lo encuentras, revisa tu carpeta de spam</li>
                </ol>

                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    El enlace expira en 1 hora por seguridad.
                  </p>
                </div>
              </div>

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
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Vesta{" "}
            <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
              CRM
            </span>
          </h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            No te preocupes, te ayudaremos a recuperar el acceso a tu cuenta
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Restablecer Contraseña</CardTitle>
            <CardDescription>
              Introduce tu email y te enviaremos un enlace para crear una nueva
              contraseña
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
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="tu@email.com"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full border-0 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                disabled={isLoading}
              >
                {isLoading
                  ? "Enviando..."
                  : "Enviar enlace de restablecimiento"}
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

export default ForgotPasswordPage;
