import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SavedCartelConfiguration } from "~/types/template-data";

interface SavedConfigurationsProps {
  savedConfigurations: SavedCartelConfiguration[];
  selectedConfigurationId: string | null;
  isLoading: boolean;
  onLoadConfiguration: (config: SavedCartelConfiguration) => void;
}

export function SavedConfigurations({
  savedConfigurations,
  selectedConfigurationId,
  isLoading,
  onLoadConfiguration,
}: SavedConfigurationsProps) {
  const handleLoadConfiguration = (config: SavedCartelConfiguration) => {
    onLoadConfiguration(config);
    toast.success(`"${config.name}" cargada`);
  };

  if (savedConfigurations.length === 0) {
    return null;
  }

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Select
          value={selectedConfigurationId ?? ""}
          onValueChange={(value) => {
            const config = savedConfigurations.find((c) => c.id === value);
            if (config) {
              handleLoadConfiguration(config);
            }
          }}
        >
          <SelectTrigger className="h-8 w-40 border-0 bg-white text-xs shadow-sm">
            <SelectValue placeholder="Cargar..." />
          </SelectTrigger>
          <SelectContent>
            {savedConfigurations.map((config) => (
              <SelectItem key={config.id} value={config.id} className="text-xs">
                <span className="truncate">{config.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
