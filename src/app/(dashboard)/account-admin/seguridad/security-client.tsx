"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Users, ChevronRight, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import {
  getAccountTwoFactorSettings,
  toggleAccountTwoFactorRequired,
} from "~/server/actions/account-2fa";
import { toast } from "sonner";

type SecuritySection = "account";

export default function SecurityClient() {
  const [selectedSection, setSelectedSection] = useState<SecuritySection>("account");
  const [loading, setLoading] = useState(false);
  const [accountSettings, setAccountSettings] = useState<{
    isRequired: boolean;
  } | null>(null);
  const [showPolicyConfirm, setShowPolicyConfirm] = useState(false);
  const [pendingPolicyValue, setPendingPolicyValue] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const accountData = await getAccountTwoFactorSettings();
      setAccountSettings(accountData ? { isRequired: accountData.isRequired } : { isRequired: false });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Error al cargar configuración de seguridad");
    }
  }

  function handlePolicyToggleClick(checked: boolean) {
    setPendingPolicyValue(checked);
    setShowPolicyConfirm(true);
  }

  async function confirmPolicyChange() {
    setLoading(true);
    try {
      const result = await toggleAccountTwoFactorRequired(pendingPolicyValue);

      if (result.success) {
        setAccountSettings({ isRequired: pendingPolicyValue });
        toast.success(
          pendingPolicyValue
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
      setShowPolicyConfirm(false);
    }
  }

  const sections = [
    {
      id: "account" as const,
      name: "Política de Cuenta",
      description: "Configuración para toda la organización",
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Sidebar Navigation */}
      <div className="lg:col-span-1">
        <Card className="p-0">
          <div className="divide-y">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedSection === section.id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {section.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    {selectedSection === section.id && (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Right Content Area */}
      <div className="lg:col-span-2">
        {/* Account Policy View */}
        {selectedSection === "account" && (
          <Card>
            <CardHeader>
              <CardTitle>Política de 2FA para la Organización</CardTitle>
              <CardDescription>
                Controla si todos los usuarios deben habilitar 2FA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div className="space-y-1">
                  <Label htmlFor="require-2fa" className="text-base font-medium">
                    Requerir 2FA para todos los usuarios
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {accountSettings?.isRequired
                      ? "Todos los usuarios deben habilitar 2FA"
                      : "Los usuarios pueden elegir si habilitan 2FA"}
                  </p>
                </div>
                <Switch
                  id="require-2fa"
                  checked={accountSettings?.isRequired ?? false}
                  onCheckedChange={handlePolicyToggleClick}
                  disabled={loading || !accountSettings}
                  className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200"
                />
              </div>

              {accountSettings?.isRequired && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50/50 px-3 py-2 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-800">
                    Los usuarios deben tener su número de teléfono configurado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Confirmation Dialog for Policy Change */}
      <ConfirmDialog
        open={showPolicyConfirm}
        onOpenChange={setShowPolicyConfirm}
        title={pendingPolicyValue ? "¿Activar 2FA para todos?" : "¿Desactivar 2FA para todos?"}
        description={
          pendingPolicyValue
            ? "Se activará automáticamente 2FA para todos los usuarios de la organización que tengan un número de teléfono configurado. Los usuarios comenzarán a recibir códigos SMS en su próximo inicio de sesión."
            : "Se desactivará 2FA para todos los usuarios. Esto reducirá significativamente la seguridad de la organización. ¿Estás seguro?"
        }
        onConfirm={confirmPolicyChange}
        confirmText={pendingPolicyValue ? "Sí, hacer obligatorio" : "Sí, hacer opcional"}
        cancelText="Cancelar"
        confirmVariant={pendingPolicyValue ? "default" : "destructive"}
      />
    </div>
  );
}
