"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface GoogleCalendarSyncSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDirection:
    | "bidirectional"
    | "vesta_to_google"
    | "google_to_vesta"
    | "none";
  onDirectionChange: (
    direction: "bidirectional" | "vesta_to_google" | "google_to_vesta" | "none",
  ) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function GoogleCalendarSyncSettings({
  open,
  onOpenChange,
}: GoogleCalendarSyncSettingsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Configuración de Sincronización
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Vesta → Google Calendar
                  </span>
                  <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
                    Activo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Las citas creadas en Vesta se sincronizan automáticamente a tu
                  Google Calendar. Esta es la única opción de sincronización
                  disponible para garantizar la mejor experiencia.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> La sincronización en otras direcciones no
              está disponible actualmente. Todas tus citas de Vesta aparecerán
              automáticamente en tu Google Calendar.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
