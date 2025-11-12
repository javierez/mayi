"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import {
  Plus,
  CheckSquare,
  Calendar,
  Users,
  Clock,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { GlobalTaskModalTrigger } from "~/components/tasks/global-task-modal";
import { createQuickPropertyAction } from "~/app/actions/quick-property";

interface OperacionesQuickActionsCardProps {
  onTaskCreated?: () => void;
}

export default function OperacionesQuickActionsCard({
  onTaskCreated,
}: OperacionesQuickActionsCardProps = {}) {
  const router = useRouter();
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);

  const handleAddProperty = async () => {
    try {
      setIsCreatingProperty(true);
      const result = await createQuickPropertyAction();

      if (result.success) {
        router.push(`/propiedades/registro/${result.data.listingId}`);
      } else {
        console.error("Error creating property:", result.error);
        alert("Error al crear la propiedad. Por favor, inténtalo de nuevo.");
        setIsCreatingProperty(false);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Error inesperado. Por favor, inténtalo de nuevo.");
      setIsCreatingProperty(false);
    }
  };

  const actions = [
    {
      icon: Plus,
      label: "Añadir Propiedad",
      onClick: handleAddProperty,
    },
    {
      icon: Users,
      label: "Añadir Contacto",
      href: "/contactos/crear",
    },
    {
      icon: CheckSquare,
      label: "Crear Tarea",
      isModal: true,
    },
    {
      icon: Calendar,
      label: "Programar Cita",
      href: "/calendario?new=true",
    },
    {
      icon: Phone,
      label: "Acción Rápida",
      isMock: true,
      isDisabled: true,
    },
    {
      icon: Clock,
      label: "Historial",
      href: "/historial",
    },
  ];

  return (
    <Card className="group relative">
      <CardContent>
        <div className="mb-4 mt-8 grid grid-cols-2 gap-3">
          {actions.map((action) => {
            if (action.isModal && action.label === "Crear Tarea") {
              return (
                <GlobalTaskModalTrigger
                  key={action.label}
                  onSuccess={onTaskCreated}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <action.icon className="mb-2 h-6 w-6" />
                    <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
                      {action.label}
                    </span>
                  </motion.div>
                </GlobalTaskModalTrigger>
              );
            }

            if (action.isMock) {
              return (
                <motion.div
                  key={action.label}
                  whileHover={action.isDisabled ? {} : { scale: 1.02 }}
                  whileTap={action.isDisabled ? {} : { scale: 0.98 }}
                  className={`relative flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 ${
                    action.isDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer opacity-90 hover:shadow-md"
                  }`}
                  onClick={() => {
                    if (action.isDisabled) return;
                    // Mock button - just show an alert for now
                    alert("Funcionalidad próximamente disponible");
                  }}
                >
                  <action.icon className="mb-2 h-6 w-6" />
                  <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
                    {action.label}
                  </span>
                </motion.div>
              );
            }

            if (action.isDisabled) {
              return (
                <motion.div
                  key={action.label}
                  className="flex cursor-not-allowed flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 opacity-50 shadow-sm transition-all duration-200"
                >
                  <action.icon className="mb-2 h-6 w-6" />
                  <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
                    {action.label}
                  </span>
                </motion.div>
              );
            }

            // Handle onClick actions (like "Añadir Propiedad")
            if (action.onClick) {
              return (
                <motion.button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={
                    action.label === "Añadir Propiedad" && isCreatingProperty
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                    action.label === "Añadir Propiedad" && isCreatingProperty
                      ? "cursor-wait opacity-50"
                      : ""
                  }`}
                >
                  <action.icon className="mb-2 h-6 w-6" />
                  <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
                    {action.label === "Añadir Propiedad" && isCreatingProperty
                      ? "Creando..."
                      : action.label}
                  </span>
                </motion.button>
              );
            }

            return (
              <motion.a
                key={action.label}
                href={action.href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <action.icon className="mb-2 h-6 w-6" />
                <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
                  {action.label}
                </span>
              </motion.a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
