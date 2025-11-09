"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Shield } from "lucide-react";

export function AccountTwoFactorAdmin() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Administración de 2FA
        </CardTitle>
        <CardDescription>
          Configuración de autenticación de dos factores a nivel de cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Gestiona las políticas de 2FA para toda la organización desde la página de
          administración de cuenta.
        </p>
      </CardContent>
    </Card>
  );
}
