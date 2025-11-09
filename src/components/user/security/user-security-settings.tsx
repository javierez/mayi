"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Shield } from "lucide-react";

export function UserSecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad Personal
          </CardTitle>
          <CardDescription>
            Gestiona la seguridad de tu cuenta personal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aquí podrás gestionar tus opciones de seguridad personales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
