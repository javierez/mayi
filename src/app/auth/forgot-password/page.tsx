"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { requestPasswordResetSMS } from "~/server/actions/password-reset";
import { AlertCircle, ArrowLeft, Smartphone } from "lucide-react";
import type { FC } from "react";

const ForgotPasswordPage: FC = () => {
  const [phonePrefix, setPhonePrefix] = useState("+34");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Use only the phone number WITHOUT prefix for lookup (users are stored without prefix)
    const phoneOnly = phone.trim();

    try {
      const result = await requestPasswordResetSMS(phoneOnly);

      if (!result.success) {
        setError(result.error ?? "Error al enviar el código SMS");
        return;
      }

      // Redirect to verification page with just the phone number (no prefix)
      router.push(
        `/auth/verify-reset-code?phone=${encodeURIComponent(phoneOnly)}`,
      );
    } catch (err) {
      setError("Error inesperado al procesar la solicitud");
      console.error("Password reset request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-center">Restablecer Contraseña</CardTitle>
            <CardDescription className="text-center">
              Introduce tu número de teléfono y te enviaremos un código de
              verificación
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
                <Label htmlFor="phone">Número de Teléfono</Label>
                <div className="flex gap-2">
                  <Select
                    value={phonePrefix}
                    onValueChange={setPhonePrefix}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+34">+34 (ES)</SelectItem>
                      <SelectItem value="+1">+1 (US)</SelectItem>
                      <SelectItem value="+44">+44 (UK)</SelectItem>
                      <SelectItem value="+33">+33 (FR)</SelectItem>
                      <SelectItem value="+49">+49 (DE)</SelectItem>
                      <SelectItem value="+351">+351 (PT)</SelectItem>
                      <SelectItem value="+39">+39 (IT)</SelectItem>
                      <SelectItem value="+52">+52 (MX)</SelectItem>
                      <SelectItem value="+54">+54 (AR)</SelectItem>
                      <SelectItem value="+56">+56 (CL)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="600 000 000"
                    className="flex-1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Introduce el número de teléfono asociado a tu cuenta
                </p>
              </div>

              <Button
                type="submit"
                className="w-full border-0 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar código SMS"}
              </Button>
            </form>

            <p className="text-center text-xs text-gray-500">
              Código válido por 5 minutos
            </p>

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
