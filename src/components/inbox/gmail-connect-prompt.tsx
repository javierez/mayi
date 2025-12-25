"use client";

import { Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

interface GmailConnectPromptProps {
  className?: string;
}

export function GmailConnectPrompt({ className }: GmailConnectPromptProps) {
  const handleConnect = () => {
    window.location.href = "/api/google/gmail/connect";
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-rose-100 p-4 dark:bg-rose-950/30">
          <Mail className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Conecta tu cuenta de Gmail</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sincroniza tus emails para gestionar consultas de propiedades directamente desde Vesta
          </p>
        </div>
        <Button onClick={handleConnect} className="gap-2">
          <Mail className="h-4 w-4" />
          Conectar Gmail
        </Button>
        <p className="text-xs text-muted-foreground">
          Solo lectura y envio de emails. Tus datos estan seguros.
        </p>
      </CardContent>
    </Card>
  );
}

interface GmailConnectionStatusProps {
  email: string;
  onDisconnect: () => void;
}

export function GmailConnectionStatus({ email, onDisconnect }: GmailConnectionStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
          <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm font-medium">Gmail conectado</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect}>
        Desconectar
      </Button>
    </div>
  );
}
