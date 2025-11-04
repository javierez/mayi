"use client";

import { cn } from "~/lib/utils";
import { Mic, Zap, FileSignature, Check } from "lucide-react";

export interface RegistrationOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  additionalInfo?: string;
  gradient: string;
  bgActive: string;
  action: () => void;
}

interface RegistrationOptionsProps {
  activeOption: string | null;
  onToggleOption: (optionId: string) => void;
  className?: string;
}

export function RegistrationOptions({
  activeOption,
  onToggleOption,
  className,
}: RegistrationOptionsProps) {
  const options: RegistrationOption[] = [
    {
      id: "quick",
      title: "Formulario Rápido",
      icon: Zap,
      description:
        "Captura los datos esenciales para crear la propiedad en un instante",
      features: [
        "Venta o alquiler, casa o piso",
        "Información de contacto",
        "Dirección y precio",
      ],
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () => console.log("Navigate to quick form"),
    },
    {
      id: "recording",
      title: "Grabación de Voz",
      icon: Mic,
      description:
        "Habla con nuesetro sistema y la IA registrará la información automáticamente",
      features: [
        "Transcripción automática",
        "Procesamiento con IA",
        "Extracción de datos",
        "Ahorra 10 minutos por propiedad",
      ],
      additionalInfo:
        "Dirección, tipo de propiedad, habitaciones, baños, precio y características especiales.",
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () => console.log("Open recording panel"),
    },
    {
      id: "upload",
      title: "Ficha de Encargo",
      icon: FileSignature,
      description:
        "Carga documentos existentes y extrae información automáticamente",
      features: [
        "OCR inteligente",
        "Extracción automática",
        "Múltiples formatos",
        "Procesamiento rápido",
      ],
      gradient: "from-amber-400 to-rose-400",
      bgActive: "from-amber-50 to-rose-50",
      action: () => console.log("Open upload panel"),
    },
  ];

  return (
    <div
      className={cn(
        "xs:grid-cols-2 grid grid-cols-1 gap-3 md:grid-cols-3",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = activeOption === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onToggleOption(option.id)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl p-3 transition-all duration-200 sm:p-4",
              "min-h-[80px] hover:scale-[1.02] sm:min-h-[100px]",
              isActive
                ? `bg-gradient-to-br ${option.bgActive} shadow-lg`
                : "bg-gray-50 shadow hover:shadow-lg",
            )}
          >
            <div
              className={cn(
                "mb-1.5 rounded-lg p-1.5 transition-colors sm:mb-2 sm:p-2",
                isActive
                  ? `bg-gradient-to-r ${option.gradient}`
                  : "bg-gray-100",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors sm:h-5 sm:w-5",
                  isActive ? "text-white" : "text-gray-600",
                )}
              />
            </div>
            <span
              className={cn(
                "text-center text-xs font-medium leading-tight transition-colors sm:text-sm",
                isActive ? "text-gray-900" : "text-gray-600",
              )}
            >
              {option.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface OptionDetailsProps {
  option: RegistrationOption;
  onStart?: () => void;
}

export function OptionDetails({
  option,
  onStart: _onStart,
}: OptionDetailsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 sm:mb-3 sm:text-2xl">
          {option.title}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          {option.description}
        </p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 sm:text-base">
          Características principales
        </h4>
        <ul className="space-y-2 sm:space-y-3">
          {option.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 sm:mt-1">
                <Check className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
              </div>
              <span className="text-sm text-gray-700 sm:text-base">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        {option.additionalInfo && (
          <div className="mt-4 rounded-lg bg-white p-3 shadow-sm sm:mt-6 sm:p-4">
            <h5 className="mb-1 text-xs font-medium text-gray-900 sm:text-sm">
              Información a mencionar:
            </h5>
            <p className="text-xs text-gray-600">{option.additionalInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export interface OptionPreviewProps {
  optionId: string;
}

export function OptionPreview({ optionId: _ }: OptionPreviewProps) {
  // The actual preview components will be imported and used in the parent component
  // This is just a placeholder that returns null since we'll use specific components
  return null;
}
