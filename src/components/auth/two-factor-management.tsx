"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { disableUserTwoFactor } from "~/server/actions/account-2fa";
import { toast } from "sonner";

interface TwoFactorManagementProps {
  onDisabled: () => void;
}

export function TwoFactorManagement({ onDisabled }: TwoFactorManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  async function handleDisable() {
    setLoading(true);
    setError("");
    try {
      const result = await disableUserTwoFactor();

      if (result.success) {
        toast.success("2FA desactivado correctamente");
        onDisabled();
      } else {
        setError(result.error ?? "Error al desactivar 2FA");
      }
    } catch (err) {
      console.error("Disable error:", err);
      setError("Error al desactivar 2FA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            2FA Activa
          </CardTitle>
          <CardDescription>
            Tu cuenta está protegida con autenticación de dos factores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Recibirás un código SMS cada vez que inicies sesión en tu cuenta.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => setShowConfirmDialog(true)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Desactivar 2FA
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="¿Desactivar 2FA?"
        description="Esto reducirá la seguridad de tu cuenta. Solo podrás iniciar sesión con tu contraseña. ¿Estás seguro de que quieres continuar?"
        onConfirm={handleDisable}
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
    </>
  );
}
