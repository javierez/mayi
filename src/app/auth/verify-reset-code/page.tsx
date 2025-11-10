"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  verifyResetCodeAndChangePassword,
  resendPasswordResetCode,
} from "~/server/actions/password-reset";
import {
  AlertCircle,
  ArrowLeft,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import type { FC } from "react";

const VerifyResetCodePage: FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const phone = searchParams.get("phone");
    if (!phone) {
      router.push("/auth/forgot-password");
    } else {
      setPhoneNumber(decodeURIComponent(phone));
    }
  }, [searchParams, router]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const digits = pastedData.replace(/\D/g, "").split("");

    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newCode[i] = digit;
      }
    });
    setCode(newCode);

    // Focus last filled input or first empty
    const lastFilledIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

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

    // Join code array to string
    const codeString = code.join("");

    // Validate code
    if (codeString.length !== 6) {
      setError("Por favor, introduce el código completo de 6 dígitos");
      setIsLoading(false);
      return;
    }

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
      const result = await verifyResetCodeAndChangePassword(
        phoneNumber,
        codeString,
        newPassword,
      );

      if (!result.success) {
        setError(result.error ?? "Error al verificar el código");
        return;
      }

      setSuccess(true);

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin?message=password-reset-success");
      }, 3000);
    } catch (err) {
      setError("Error inesperado al verificar el código");
      console.error("Code verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");

    try {
      const result = await resendPasswordResetCode(phoneNumber);

      if (!result.success) {
        setError(result.error ?? "Error al reenviar el código");
        return;
      }

      setError(""); // Clear any previous errors
      // Show success message briefly
      setError("Código reenviado exitosamente");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError("Error inesperado al reenviar el código");
      console.error("Resend code error:", err);
    } finally {
      setIsResending(false);
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-100 to-rose-100">
              <Smartphone className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-center">Código de Verificación</CardTitle>
            <CardDescription className="text-center">
              Revisa tu teléfono {phoneNumber && `(${phoneNumber})`}
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
                <Label>Código de verificación</Label>
                <div className="mt-2 flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={isLoading}
                      className="h-14 w-12 text-center text-xl font-semibold"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-gray-500">
                  El código expira en 5 minutos
                </p>
              </div>

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
                disabled={isLoading || code.some((d) => !d) || !newPassword || !confirmPassword}
              >
                {isLoading ? "Verificando..." : "Verificar y Cambiar Contraseña"}
              </Button>
            </form>

            <div className="space-y-3 text-center">
              <p className="text-sm text-gray-600">¿No recibiste el código?</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? "Reenviando..." : "Reenviar código"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Volver
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyResetCodePage;
