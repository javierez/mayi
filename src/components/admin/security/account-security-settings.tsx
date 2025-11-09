"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Shield, Users, Lock } from "lucide-react";
import {
  getAccountTwoFactorSettings,
  toggleAccountTwoFactorRequired,
} from "~/server/actions/account-2fa";
import { toast } from "sonner";

interface AccountSecuritySettingsProps {
  userId: string;
}

export function AccountSecuritySettings({ userId: _userId }: AccountSecuritySettingsProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<{
    isRequired: boolean;
  } | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getAccountTwoFactorSettings();
      setSettings(data ? { isRequired: data.isRequired } : { isRequired: false });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error al cargar configuración de seguridad");
    }
  }

  async function handleToggleRequired(checked: boolean) {
    setLoading(true);
    try {
      const result = await toggleAccountTwoFactorRequired(checked);

      if (result.success) {
        setSettings({ isRequired: checked });
        toast.success(
          checked
            ? "2FA ahora es obligatorio para todos los usuarios"
            : "2FA ahora es opcional para los usuarios"
        );
      } else {
        toast.error(result.error ?? "Error al actualizar configuración");
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      toast.error("Error al actualizar configuración");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="two-factor" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="two-factor" className="gap-2">
            <Shield className="h-4 w-4" />
            Autenticación de Dos Factores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="two-factor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Política de 2FA para la Organización
              </CardTitle>
              <CardDescription>
                Controla si la autenticación de dos factores es obligatoria para todos los usuarios
                de la cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="require-2fa" className="text-base">
                    Requerir 2FA para todos los usuarios
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {settings?.isRequired
                      ? "Todos los usuarios deben habilitar 2FA para acceder"
                      : "Los usuarios pueden optar por habilitar 2FA (recomendado pero no obligatorio)"}
                  </p>
                </div>
                <Switch
                  id="require-2fa"
                  checked={settings?.isRequired ?? false}
                  onCheckedChange={handleToggleRequired}
                  disabled={loading || !settings}
                />
              </div>

              {settings?.isRequired && (
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-900">
                        2FA Obligatorio Activado
                      </p>
                      <p className="text-sm text-amber-700">
                        Los usuarios que aún no han configurado 2FA deberán hacerlo en su próximo
                        inicio de sesión.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Gestión Individual de 2FA
                    </p>
                    <p className="text-sm text-blue-700">
                      Los usuarios pueden gestionar su 2FA individual desde su página de seguridad
                      personal en /seguridad
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
