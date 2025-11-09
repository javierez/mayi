"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { verifyTwoFactorCode, sendTwoFactorCode } from "~/server/actions/account-2fa";
import { authClient } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

interface TwoFactorVerifyProps {
  email: string;
  password: string;
  userId: string;
  onCancel: () => void;
}

export function TwoFactorVerify({ email, password, userId, onCancel }: TwoFactorVerifyProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify() {
    if (!code || code.length !== 6) {
      setError("Por favor, introduce un código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Verify the 2FA code
      const verifyResult = await verifyTwoFactorCode(userId, code);

      if (verifyResult.success) {
        // Code is valid, now complete the sign-in
        const signInResult = await authClient.signIn.email({
          email,
          password,
        });

        if (signInResult.error) {
          setError(signInResult.error.message ?? "Error al iniciar sesión");
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        setError(verifyResult.error ?? "Código inválido");
      }
    } catch (err) {
      console.error("Verify error:", err);
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setLoading(true);
    setError("");
    try {
      const result = await sendTwoFactorCode(userId);

      if (result.success) {
        setError("");
        alert("Código reenviado a tu teléfono");
      } else {
        setError(result.error ?? "Error al reenviar el código");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError("Error al reenviar el código");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verificación de Dos Factores</CardTitle>
        <CardDescription>
          Introduce el código de 6 dígitos enviado a tu teléfono
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="2fa-code">Código de verificación</Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCode(value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.length === 6) {
                void handleVerify();
              }
            }}
            className="font-mono text-center text-lg tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={loading}
            className="text-sm"
          >
            No recibí el código, reenviar
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar
        </Button>
      </CardFooter>
    </Card>
  );
}
