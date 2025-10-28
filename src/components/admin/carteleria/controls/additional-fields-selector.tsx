import type { FC } from "react";
import { cn } from "~/lib/utils";
import type { TemplateConfiguration } from "~/types/template-data";
import {
  Zap,
  Calendar,
  ArrowUp,
  Car,
  Package,
  TreePine,
  Compass,
  Flame,
  Home,
} from "lucide-react";

interface AdditionalFieldsSelectorProps {
  config: TemplateConfiguration;
  onChange: (updates: Partial<TemplateConfiguration>) => void;
}

// Available fields for selection based on database schema
const AVAILABLE_FIELDS = [
  {
    value: "energyConsumptionScale",
    label: "Certificación Energética",
    icon: Zap,
    description: "Calificación energética A-G",
  },
  {
    value: "yearBuilt",
    label: "Año de Construcción",
    icon: Calendar,
    description: "Año en que se construyó",
  },
  {
    value: "hasElevator",
    label: "Ascensor",
    icon: ArrowUp,
    description: "Disponibilidad de ascensor",
  },
  {
    value: "hasGarage",
    label: "Garaje",
    icon: Car,
    description: "Plaza de garaje incluida",
  },
  {
    value: "hasStorageRoom",
    label: "Trastero",
    icon: Package,
    description: "Trastero incluido",
  },
  {
    value: "terrace",
    label: "Terraza",
    icon: TreePine,
    description: "Terraza disponible",
  },
  {
    value: "orientation",
    label: "Orientación",
    icon: Compass,
    description: "Orientación cardinal",
  },
  {
    value: "heatingType",
    label: "Calefacción",
    icon: Flame,
    description: "Tipo de calefacción",
  },
  {
    value: "conservationStatus",
    label: "Estado",
    icon: Home,
    description: "Estado de conservación",
  },
] as const;

export const AdditionalFieldsSelector: FC<AdditionalFieldsSelectorProps> = ({
  config,
  onChange,
}) => {
  const handleFieldToggle = (fieldValue: string) => {
    const currentFields = config.additionalFields;
    const isSelected = currentFields.includes(fieldValue);

    let newFields: string[];

    if (isSelected) {
      // Remove field
      newFields = currentFields.filter((field) => field !== fieldValue);
    } else {
      // Add field - different limits based on whether icons are shown
      const maxFields = config.showIcons ? 6 : 3; // 6 total when icons (3 default + 3 additional), 3 when no icons

      if (currentFields.length >= maxFields) {
        // Replace the first field with the new one
        newFields = [...currentFields.slice(1), fieldValue];
      } else {
        newFields = [...currentFields, fieldValue];
      }
    }

    onChange({ additionalFields: newFields });
  };

  const maxFields = config.showIcons ? 6 : 3;
  const selectedCount = config.additionalFields.length;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-medium">Información Adicional</h3>
        <p className="text-sm text-gray-600">
          {config.showIcons
            ? `Selecciona hasta 6 campos (3 por defecto + 3 adicionales).`
            : `Selecciona hasta 3 campos.`}
        </p>
        {config.showIcons && (
          <p className="mt-1 text-xs text-blue-600">
            Con iconos habilitados, puedes mostrar más información adicional.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {AVAILABLE_FIELDS.map((field) => {
          const isSelected = config.additionalFields.includes(field.value);
          const isDisabled = !isSelected && selectedCount >= maxFields;
          const IconComponent = field.icon;

          return (
            <button
              key={field.value}
              onClick={() => !isDisabled && handleFieldToggle(field.value)}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl p-3 text-xs font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                isSelected && "bg-gray-200 text-gray-800 shadow-md",
                !isSelected &&
                  !isDisabled &&
                  "bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md",
                isDisabled &&
                  "cursor-not-allowed bg-gray-100 text-gray-400 opacity-60 shadow-none",
              )}
              title={
                isDisabled
                  ? `Máximo ${maxFields} campos seleccionados`
                  : field.description
              }
            >
              <IconComponent className="mb-1 h-4 w-4" />
              <span className="text-center leading-tight">{field.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selection counter */}
      <div className="text-center text-xs text-gray-500">
        {selectedCount} de {maxFields} campos seleccionados
      </div>
    </div>
  );
};
