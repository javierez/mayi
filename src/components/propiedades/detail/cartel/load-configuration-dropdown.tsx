"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Settings2, Star, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { SavedCartelConfiguration } from "~/types/template-data";

interface LoadConfigurationDropdownProps {
  configurations: SavedCartelConfiguration[];
  onLoad: (configuration: SavedCartelConfiguration) => void;
  onDelete: (configurationId: string) => Promise<void>;
  onSetDefault: (configurationId: string) => Promise<void>;
  disabled?: boolean;
}

export function LoadConfigurationDropdown({
  configurations,
  onLoad,
  onDelete,
  onSetDefault,
  disabled = false,
}: LoadConfigurationDropdownProps) {
  const handleLoad = (configId: string) => {
    const config = configurations.find((c) => c.id === configId);
    if (config) {
      onLoad(config);
      toast.success(`Configuración "${config.name}" cargada`);
    }
  };

  const handleDelete = async (
    configId: string,
    configName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar la configuración "${configName}"?`,
      )
    ) {
      try {
        await onDelete(configId);
        toast.success("Configuración eliminada");
      } catch (error) {
        console.error("Error deleting configuration:", error);
        toast.error("Error al eliminar la configuración");
      }
    }
  };

  const handleSetDefault = async (
    configId: string,
    configName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    try {
      await onSetDefault(configId);
      toast.success(
        `"${configName}" establecida como configuración por defecto`,
      );
    } catch (error) {
      console.error("Error setting default configuration:", error);
      toast.error("Error al establecer configuración por defecto");
    }
  };

  if (configurations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No hay configuraciones guardadas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select onValueChange={handleLoad} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Cargar configuración guardada..." />
        </SelectTrigger>
        <SelectContent>
          {configurations.map((config) => (
            <SelectItem
              key={config.id}
              value={config.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{config.name}</span>
                {config.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="mr-1 h-3 w-3" />
                    Por defecto
                  </Badge>
                )}
                {!config.isGlobal && (
                  <Badge variant="outline" className="text-xs">
                    Específica
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-2">
        {configurations.map((config) => (
          <div key={config.id} className="flex items-center gap-1">
            <Badge
              variant={config.isDefault ? "default" : "secondary"}
              className="cursor-pointer text-xs transition-colors hover:bg-opacity-80"
              onClick={() => handleLoad(config.id)}
            >
              {config.isDefault && <Star className="mr-1 h-3 w-3" />}
              {config.name}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-muted"
                >
                  <Settings2 className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {!config.isDefault && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) =>
                        handleSetDefault(config.id, config.name, e)
                      }
                      className="text-sm"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Establecer por defecto
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => handleDelete(config.id, config.name, e)}
                  className="text-sm text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
