"use client";

import { useState, useRef } from "react";
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
  email?: string;
  password?: string;
  userId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function TwoFactorVerify({ email, password, userId, onCancel, onSuccess }: TwoFactorVerifyProps) {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

    const lastFilledIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  async function handleVerify() {
    const codeString = code.join("");

    if (codeString.length !== 6) {
      setError("Por favor, introduce un código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Verify the 2FA code
      const verifyResult = await verifyTwoFactorCode(userId, codeString);

      if (verifyResult.success) {
        // If onSuccess callback is provided, use it (sign-in flow)
        if (onSuccess) {
          onSuccess();
        } else if (email && password) {
          // Otherwise, complete the sign-in with email/password (legacy flow)
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
          // No callback and no credentials - just redirect
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
          <Label>Código de verificación</Label>
          <div className="flex justify-center gap-2">
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
                disabled={loading}
                className="h-14 w-12 text-center text-xl font-semibold"
                autoFocus={index === 0}
              />
            ))}
          </div>
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
        <Button onClick={handleVerify} disabled={loading || code.some((d) => !d)}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar
        </Button>
      </CardFooter>
    </Card>
  );
}
