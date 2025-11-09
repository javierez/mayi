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
import { Loader2, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  setupUserTwoFactor,
  sendTwoFactorCode,
  verifyUserTwoFactorSetup,
} from "~/server/actions/account-2fa";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"setup" | "verify" | "codes">("setup");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSetup() {
    setLoading(true);
    setError("");
    try {
      const result = await setupUserTwoFactor();

      if (result.success && result.phoneNumber) {
        setPhoneNumber(result.phoneNumber);
        setStep("verify");
        toast.success("Configuración iniciada. Ahora envía el código SMS.");
      } else {
        setError(result.error ?? "Error al configurar 2FA");
      }
    } catch (err) {
      console.error("Setup error:", err);
      setError("Error al configurar 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    setLoading(true);
    setError("");
    try {
      const result = await sendTwoFactorCode();

      if (result.success) {
        setCodeSent(true);
        toast.success("Código enviado a tu teléfono");
      } else {
        setError(result.error ?? "Error al enviar el código");
      }
    } catch (err) {
      console.error("Send code error:", err);
      setError("Error al enviar el código");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code || code.length !== 6) {
      setError("Por favor, introduce un código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await verifyUserTwoFactorSetup(code);

      if (result.success) {
        setStep("codes");
        toast.success("2FA configurado correctamente");
      } else {
        setError(result.error ?? "Código inválido");
      }
    } catch (err) {
      console.error("Verify error:", err);
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPhone() {
    if (phoneNumber) {
      void navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      toast.success("Número copiado");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Autenticación de Dos Factores (2FA)</CardTitle>
          <CardDescription>
            Añade una capa extra de seguridad a tu cuenta mediante códigos SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              Se enviará un código de verificación a tu teléfono cada vez que inicies sesión.
              Asegúrate de tener acceso a tu número de teléfono registrado.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSetup} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Configuración
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificar Teléfono</CardTitle>
          <CardDescription>
            Te enviaremos un código SMS para verificar tu número de teléfono
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Número de teléfono</Label>
            <div className="flex gap-2">
              <Input value={phoneNumber} disabled className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPhone}
                title="Copiar número"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {!codeSent && (
            <Button onClick={handleSendCode} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Código SMS
            </Button>
          )}

          {codeSent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <Input
                  id="code"
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
                  className="font-mono text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Introduce el código de 6 dígitos enviado a tu teléfono
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSendCode} disabled={loading} className="flex-1">
                  Reenviar código
                </Button>
                <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={onCancel} disabled={loading} className="w-full">
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (step === "codes") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>2FA Configurado Correctamente</CardTitle>
          <CardDescription>
            Tu autenticación de dos factores está ahora activa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              A partir de ahora, recibirás un código SMS cada vez que inicies sesión.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={onComplete} className="w-full">
            Finalizar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
