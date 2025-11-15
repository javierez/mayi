import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ChevronRight } from "lucide-react";
import type { TemplateConfiguration } from "~/types/template-data";

interface CartelEditorPage1Props {
  config: TemplateConfiguration;
  updateConfig: (updates: Partial<TemplateConfiguration>) => void;
  accountColorPalette?: string[];
  onNext?: () => void;
}

export function CartelEditorPage1({
  config,
  updateConfig,
  accountColorPalette = [],
  onNext,
}: CartelEditorPage1Props) {
  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="orientation">Orientación</Label>
          <Select
            value={config.orientation}
            onValueChange={(value: "vertical" | "horizontal") =>
              updateConfig({ orientation: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="overlayColor">Color de Fondo</Label>
          <Select
            value={config.overlayColor}
            onValueChange={(value) => updateConfig({ overlayColor: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Default color options */}
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: "#9CA3AF" }}
                  />
                  <span>Gris</span>
                </div>
              </SelectItem>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: "#E5E7EB" }}
                  />
                  <span>Claro</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: "#1F2937" }}
                  />
                  <span>Oscuro</span>
                </div>
              </SelectItem>

              {/* Standard color options */}
              <SelectItem value="white">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border border-gray-300 bg-white"></div>
                  <span>Blanco</span>
                </div>
              </SelectItem>
              <SelectItem value="black">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-black"></div>
                  <span>Negro</span>
                </div>
              </SelectItem>
              <SelectItem value="gray">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-gray-500"></div>
                  <span>Gris Estándar</span>
                </div>
              </SelectItem>

              {/* Account color palette */}
              {accountColorPalette.length > 0 &&
                accountColorPalette.map((color, index) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      <span>Corporativo {index + 1}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <h4 className="font-medium">Opciones de Visualización</h4>

      {/* Contact Information Group */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">
          Contacto <span className="text-xs">(añade 2)</span>
        </h5>
        <div className="space-y-2">
          {[
            { key: "showPhone" as const, label: "Teléfono" },
            { key: "showEmail" as const, label: "Email" },
            { key: "showWebsite" as const, label: "Website" },
          ].map(({ key, label }) => {
            const isChecked = config[key] ?? false;

            // Count currently selected contact elements
            const selectedCount = [
              config.showPhone,
              config.showEmail,
              config.showWebsite,
            ].filter(Boolean).length;

            // Disable if trying to select more than 2 elements in basic template
            const wouldExceedLimit =
              config.templateStyle === "basic" &&
              !isChecked &&
              selectedCount >= 2;

            return (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (
                      config.templateStyle === "basic" &&
                      checked &&
                      selectedCount >= 2
                    ) {
                      // If trying to select a 3rd element in basic template, deselect another one
                      const otherKeys = [
                        "showPhone",
                        "showEmail",
                        "showWebsite",
                      ].filter((k) => k !== key);
                      const firstOtherKey = otherKeys.find(
                        (k) => config[k as keyof typeof config],
                      ) as keyof typeof config;
                      if (firstOtherKey) {
                        updateConfig({
                          [firstOtherKey]: false,
                          [key]: true,
                        });
                      }
                    } else {
                      updateConfig({ [key]: checked === true });
                    }
                  }}
                  disabled={wouldExceedLimit}
                  className="no-checkmark h-3 w-3"
                />
                <Label
                  htmlFor={key}
                  className={`text-xs ${wouldExceedLimit ? "text-gray-500" : ""}`}
                >
                  {label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Elements Group */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-muted-foreground">
          Elementos Visuales
        </h5>
        <div className="space-y-2">
          {/* QR Code Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showQR"
              checked={config.showQR ?? false}
              onCheckedChange={(checked) =>
                updateConfig({ showQR: checked === true })
              }
              className="no-checkmark h-3 w-3"
            />
            <Label htmlFor="showQR" className="text-xs">
              Código QR
            </Label>
          </div>

          {/* Watermark Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showWatermark"
              checked={config.showWatermark ?? false}
              onCheckedChange={(checked) =>
                updateConfig({ showWatermark: checked === true })
              }
              className="no-checkmark h-3 w-3"
            />
            <Label htmlFor="showWatermark" className="text-xs">
              Marca de Agua
            </Label>
          </div>

          {/* Reference Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showReference"
              checked={config.showReference ?? false}
              onCheckedChange={(checked) =>
                updateConfig({ showReference: checked === true })
              }
              className="no-checkmark h-3 w-3"
            />
            <Label htmlFor="showReference" className="text-xs">
              Referencia
            </Label>
          </div>

          {/* Energy Certificate Checkbox */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showEnergyRating"
                checked={config.showEnergyRating ?? false}
                onCheckedChange={(checked) =>
                  updateConfig({
                    showEnergyRating: checked === true,
                  })
                }
                className="no-checkmark h-3 w-3"
              />
              <Label
                htmlFor="showEnergyRating"
                className="text-xs"
              >
                Certificado Energético
              </Label>
            </div>

            {/* Energy Rating Controls - Only show when enabled */}
            {config.showEnergyRating && (
              <div className="ml-5 space-y-3 rounded-lg bg-gray-50 p-3">
                <Label className="text-xs font-medium">
                  Configuración Energética
                </Label>

                {/* Energy Scale Selector */}
                <div>
                  <Label className="text-xs">
                    Calificación
                  </Label>
                  <div className="mt-1 flex gap-1">
                    {["A", "B", "C", "D", "E", "F", "G"].map(
                      (rating) => {
                        const isSelected =
                          config.energyConsumptionScale ===
                          rating;
                        const getColor = (r: string) => {
                          const colors = {
                            A: "#22c55e",
                            B: "#4ade80",
                            C: "#facc15",
                            D: "#eab308",
                            E: "#fb923c",
                            F: "#f97316",
                            G: "#ef4444",
                          };
                          return (
                            colors[r as keyof typeof colors] ||
                            "#6b7280"
                          );
                        };

                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() =>
                              updateConfig({
                                energyConsumptionScale: rating,
                              })
                            }
                            className={`h-8 w-8 rounded text-xs font-bold text-white transition-all ${
                              isSelected
                                ? "scale-110 ring-2 ring-blue-500 ring-offset-2"
                                : "hover:scale-105"
                            }`}
                            style={{
                              backgroundColor: getColor(rating),
                            }}
                          >
                            {rating}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      {onNext && (
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={onNext}
            size="sm"
            variant="ghost"
            className="bg-gray-100 text-xs font-normal text-gray-800 shadow-md hover:bg-gray-200 hover:text-black hover:shadow-lg"
          >
            Siguiente
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
