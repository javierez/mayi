import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  SaveConfigurationRequest,
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";

interface SaveConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateConfig: TemplateConfiguration;
  propertyOverrides?: Partial<ExtendedTemplatePropertyData>;
  selectedContacts?: { phone?: string; email?: string };
  selectedImageIndices: number[];
  propertyId?: string;
  onSave: (request: SaveConfigurationRequest) => Promise<boolean>;
}

export function SaveConfigurationModal({
  isOpen,
  onClose,
  templateConfig,
  propertyOverrides,
  selectedContacts,
  selectedImageIndices,
  propertyId,
  onSave,
}: SaveConfigurationModalProps) {
  const [configName, setConfigName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!configName.trim()) {
      toast.error("Por favor, introduce un nombre para la configuración");
      return;
    }

    setIsSaving(true);
    try {
      const request: SaveConfigurationRequest = {
        name: configName.trim(),
        templateConfig,
        propertyOverrides,
        selectedContacts,
        selectedImageIndices,
        isDefault,
        isGlobal,
        propertyId: !isGlobal ? propertyId : undefined,
      };

      const success = await onSave(request);
      if (success) {
        toast.success("Configuración guardada correctamente");
        handleClose();
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setConfigName("");
    setIsDefault(false);
    setIsGlobal(true);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar Configuración</DialogTitle>
          <DialogDescription>
            Guarda la configuración actual del cartel para reutilizarla más
            adelante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="config-name">Nombre de la configuración</Label>
            <Input
              id="config-name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Ej: Mi estilo favorito"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                disabled={isSaving}
              />
              <Label htmlFor="is-default" className="text-sm font-normal">
                Establecer como configuración por defecto
              </Label>
            </div>

            {propertyId && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-global"
                  checked={isGlobal}
                  onCheckedChange={(checked) => setIsGlobal(checked as boolean)}
                  disabled={isSaving}
                />
                <Label htmlFor="is-global" className="text-sm font-normal">
                  Usar para todas las propiedades
                </Label>
              </div>
            )}
          </div>

          {!isGlobal && propertyId && (
            <div className="rounded bg-muted p-2 text-xs text-muted-foreground">
              Esta configuración solo se aplicará a la propiedad actual.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !configName.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
