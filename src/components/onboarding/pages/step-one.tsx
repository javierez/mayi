"use client";

import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { useOnboardingContext } from "../onboarding-context";

interface StepOneProps {
  onNext: () => void;
}

const businessFocusOptions = [
  { id: "residential_sale", label: "Venta residencial" },
  { id: "residential_rent", label: "Alquiler residencial" },
  { id: "commercial_sale", label: "Venta comercial" },
  { id: "commercial_rent", label: "Alquiler comercial" },
  { id: "new_construction", label: "Promoción de obra nueva" },
  { id: "luxury", label: "Propiedades de lujo" },
  { id: "bank_assets", label: "Gestión de activos bancarios" },
  { id: "land", label: "Suelo/Terrenos" },
];

const challengeOptions = [
  { id: "lead_management", label: "Gestión de leads" },
  { id: "photography", label: "Fotografía de propiedades" },
  { id: "portal_sync", label: "Sincronización con portales" },
  { id: "team_collaboration", label: "Colaboración en equipo" },
  { id: "reporting", label: "Informes y análisis" },
  { id: "client_communication", label: "Comunicación con clientes" },
  { id: "document_management", label: "Gestión documental" },
  { id: "other", label: "Otro" },
];

export default function StepOne({ onNext }: StepOneProps) {
  const { state, updateFormData } = useOnboardingContext();
  const { formData } = state;

  const handleBusinessFocusToggle = (focusId: string) => {
    const currentFocus = formData.businessFocus ?? [];
    const newFocus = currentFocus.includes(focusId)
      ? currentFocus.filter((id) => id !== focusId)
      : [...currentFocus, focusId];
    updateFormData({ businessFocus: newFocus });
  };

  const handleChallengeToggle = (challengeId: string) => {
    const currentChallenges = formData.biggestChallenge ?? [];
    const newChallenges = currentChallenges.includes(challengeId)
      ? currentChallenges.filter((id) => id !== challengeId)
      : [...currentChallenges, challengeId];
    updateFormData({ biggestChallenge: newChallenges });
  };

  const handleNext = () => {
    // Validation
    if (!formData.previousCrm) {
      alert("Por favor, selecciona tu CRM anterior.");
      return;
    }
    // If "Otro" is selected, check for custom CRM name
    if (
      formData.previousCrm === "other" &&
      !formData.previousCrmOther?.trim()
    ) {
      alert("Por favor, escribe el nombre de tu CRM anterior.");
      return;
    }
    if (!formData.referralSource) {
      alert("Por favor, indícanos cómo nos conociste.");
      return;
    }
    if (!formData.teamSize) {
      alert("Por favor, selecciona el tamaño de tu equipo.");
      return;
    }
    if (!formData.businessFocus || formData.businessFocus.length === 0) {
      alert("Por favor, selecciona al menos un enfoque de negocio.");
      return;
    }
    if (!formData.monthlyListings) {
      alert("Por favor, selecciona tu volumen mensual de anuncios.");
      return;
    }
    if (!formData.biggestChallenge || formData.biggestChallenge.length === 0) {
      alert("Por favor, selecciona al menos un desafío actual.");
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Antecedentes y Situación Actual
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Ayúdanos a conocer mejor tu negocio para personalizar tu experiencia.
        </p>
      </div>

      {/* Previous CRM */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          CRM Anterior <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.previousCrm}
          onValueChange={(value) => {
            updateFormData({ previousCrm: value });
            // Clear custom CRM name if not "other"
            if (value !== "other") {
              updateFormData({ previousCrmOther: "" });
            }
          }}
        >
          <SelectTrigger className="h-10 border border-gray-200 shadow-md">
            <SelectValue placeholder="Selecciona tu CRM anterior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ninguno</SelectItem>
            <SelectItem value="inmogesco">Inmogesco</SelectItem>
            <SelectItem value="aliseda">Aliseda</SelectItem>
            <SelectItem value="salesforce">Salesforce</SelectItem>
            <SelectItem value="hubspot">HubSpot</SelectItem>
            <SelectItem value="propiedad_raiz">Propiedad Raíz</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom CRM Input (conditional) */}
      {formData.previousCrm === "other" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <FloatingLabelInput
            id="previousCrmOther"
            value={formData.previousCrmOther ?? ""}
            onChange={(value: string) =>
              updateFormData({ previousCrmOther: value })
            }
            placeholder="Nombre del CRM"
            type="text"
          />
        </motion.div>
      )}

      {/* Referral Source */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          ¿Cómo nos conociste? <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.referralSource}
          onValueChange={(value) => updateFormData({ referralSource: value })}
        >
          <SelectTrigger className="h-10 border border-gray-200 shadow-md">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Búsqueda en Google</SelectItem>
            <SelectItem value="social_media">Redes sociales</SelectItem>
            <SelectItem value="referral">Recomendación</SelectItem>
            <SelectItem value="event">Evento/Conferencia</SelectItem>
            <SelectItem value="partner">Socio comercial</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          Número de agentes/miembros del equipo{" "}
          <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.teamSize}
          onValueChange={(value) => updateFormData({ teamSize: value })}
        >
          <SelectTrigger className="h-10 border border-gray-200 shadow-md">
            <SelectValue placeholder="Selecciona el tamaño de tu equipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solo">Solo yo</SelectItem>
            <SelectItem value="2-5">2-5</SelectItem>
            <SelectItem value="6-10">6-10</SelectItem>
            <SelectItem value="11-25">11-25</SelectItem>
            <SelectItem value="26-50">26-50</SelectItem>
            <SelectItem value="50+">Más de 50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Primary Business Focus */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Enfoque principal del negocio <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">
          Selecciona todas las que apliquen
        </p>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          {businessFocusOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={formData.businessFocus?.includes(option.id) ?? false}
                onCheckedChange={() => handleBusinessFocusToggle(option.id)}
              />
              <label
                htmlFor={option.id}
                className="cursor-pointer select-none text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Average Monthly Listings */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          Anuncios mensuales promedio <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.monthlyListings}
          onValueChange={(value) => updateFormData({ monthlyListings: value })}
        >
          <SelectTrigger className="h-10 border border-gray-200 shadow-md">
            <SelectValue placeholder="Selecciona tu volumen mensual" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="<10">Menos de 10</SelectItem>
            <SelectItem value="10-30">10-30</SelectItem>
            <SelectItem value="30-50">30-50</SelectItem>
            <SelectItem value="50-100">50-100</SelectItem>
            <SelectItem value="100+">Más de 100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Biggest Current Challenge */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Mayores desafíos actuales <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">
          Selecciona todos los que apliquen
        </p>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          {challengeOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={
                  formData.biggestChallenge?.includes(option.id) ?? false
                }
                onCheckedChange={() => handleChallengeToggle(option.id)}
              />
              <label
                htmlFor={option.id}
                className="cursor-pointer select-none text-sm text-gray-700"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-end border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleNext}
            className="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
