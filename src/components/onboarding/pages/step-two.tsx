"use client";

import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useOnboardingContext } from "../onboarding-context";

interface StepTwoProps {
  onNext: () => void;
  onBack: () => void;
}

export default function StepTwo({ onNext, onBack }: StepTwoProps) {
  const { state, updateFormData } = useOnboardingContext();
  const { formData } = state;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    // Validation
    if (!formData.email) {
      alert("Por favor, introduce tu correo electrónico.");
      return;
    }
    if (!validateEmail(formData.email)) {
      alert("Por favor, introduce un correo electrónico válido.");
      return;
    }
    if (formData.hasWebsite && !formData.websiteUrl) {
      alert("Por favor, introduce la URL de tu sitio web.");
      return;
    }
    if (formData.hasWebsiteDomain && !formData.websiteDomainName) {
      alert("Por favor, introduce tu dominio web.");
      return;
    }
    if (formData.hasEmailDomain && !formData.emailDomainName) {
      alert("Por favor, introduce tu dominio de email.");
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Configuración Técnica
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Información sobre tu infraestructura digital actual.
        </p>
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <FloatingLabelInput
          id="email"
          value={formData.email ?? ""}
          onChange={(value) => updateFormData({ email: value })}
          placeholder="Correo electrónico *"
          type="email"
        />
      </div>

      {/* Has Active Website */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">
          ¿Tienes un sitio web activo?
        </h3>
        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
          <motion.div
            className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
            animate={{
              x: formData.hasWebsite ? "calc(100% - 5px)" : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="relative flex h-full">
            <button
              onClick={() => {
                updateFormData({ hasWebsite: false, websiteUrl: "" });
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                !formData.hasWebsite ? "text-gray-900" : "text-gray-600",
              )}
            >
              No
            </button>
            <button
              onClick={() => updateFormData({ hasWebsite: true })}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.hasWebsite ? "text-gray-900" : "text-gray-600",
              )}
            >
              Sí
            </button>
          </div>
        </div>
      </div>

      {/* Website URL (conditional) */}
      {formData.hasWebsite && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <FloatingLabelInput
            id="websiteUrl"
            value={formData.websiteUrl ?? ""}
            onChange={(value) => updateFormData({ websiteUrl: value })}
            placeholder="URL del sitio web (ej: https://www.tuempresa.com)"
            type="url"
          />
        </motion.div>
      )}

      {/* Website Domain */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">
          ¿Tienes un dominio para tu página web?
        </h3>
        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
          <motion.div
            className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
            animate={{
              x: formData.hasWebsiteDomain ? "calc(100% - 5px)" : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="relative flex h-full">
            <button
              onClick={() => {
                updateFormData({
                  hasWebsiteDomain: false,
                  websiteDomainName: "",
                  websiteDomainManaged: false,
                });
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                !formData.hasWebsiteDomain ? "text-gray-900" : "text-gray-600",
              )}
            >
              No
            </button>
            <button
              onClick={() => updateFormData({ hasWebsiteDomain: true })}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.hasWebsiteDomain ? "text-gray-900" : "text-gray-600",
              )}
            >
              Sí
            </button>
          </div>
        </div>
      </div>

      {/* Website Domain Name & Management (conditional) */}
      {formData.hasWebsiteDomain && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <FloatingLabelInput
            id="websiteDomainName"
            value={formData.websiteDomainName ?? ""}
            onChange={(value) => updateFormData({ websiteDomainName: value })}
            placeholder="Nombre del dominio (ej: tuempresa.com)"
            type="text"
          />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              ¿Quieres que lo gestionemos nosotros?
            </h3>
            <div className="relative h-10 rounded-lg bg-gray-100 p-1">
              <motion.div
                className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
                animate={{
                  x: formData.websiteDomainManaged ? "calc(100% - 5px)" : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="relative flex h-full">
                <button
                  onClick={() =>
                    updateFormData({ websiteDomainManaged: false })
                  }
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                    !formData.websiteDomainManaged
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  No
                </button>
                <button
                  onClick={() => updateFormData({ websiteDomainManaged: true })}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                    formData.websiteDomainManaged
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Email Domain */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">
          ¿Tienes un dominio personalizado para emails?
        </h3>
        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
          <motion.div
            className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
            animate={{
              x: formData.hasEmailDomain ? "calc(100% - 5px)" : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="relative flex h-full">
            <button
              onClick={() => {
                updateFormData({
                  hasEmailDomain: false,
                  emailDomainName: "",
                  emailDomainManaged: false,
                });
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                !formData.hasEmailDomain ? "text-gray-900" : "text-gray-600",
              )}
            >
              No
            </button>
            <button
              onClick={() => updateFormData({ hasEmailDomain: true })}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.hasEmailDomain ? "text-gray-900" : "text-gray-600",
              )}
            >
              Sí
            </button>
          </div>
        </div>
      </div>

      {/* Email Domain Name & Management (conditional) */}
      {formData.hasEmailDomain && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <FloatingLabelInput
            id="emailDomainName"
            value={formData.emailDomainName ?? ""}
            onChange={(value) => updateFormData({ emailDomainName: value })}
            placeholder="Dominio de email (ej: @tuempresa.com)"
            type="text"
          />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              ¿Quieres que lo gestionemos nosotros?
            </h3>
            <div className="relative h-10 rounded-lg bg-gray-100 p-1">
              <motion.div
                className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
                animate={{
                  x: formData.emailDomainManaged ? "calc(100% - 5px)" : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <div className="relative flex h-full">
                <button
                  onClick={() => updateFormData({ emailDomainManaged: false })}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                    !formData.emailDomainManaged
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  No
                </button>
                <button
                  onClick={() => updateFormData({ emailDomainManaged: true })}
                  className={cn(
                    "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                    formData.emailDomainManaged
                      ? "text-gray-900"
                      : "text-gray-600",
                  )}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
        </motion.div>

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
