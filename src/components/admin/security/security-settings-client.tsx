"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Shield } from "lucide-react";

export function SecuritySettingsClient() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>
            Gestiona la seguridad de la cuenta y las políticas de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Utiliza las pestañas arriba para configurar diferentes aspectos de seguridad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
