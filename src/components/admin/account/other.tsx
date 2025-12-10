"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Users,
  Key,
  Download,
  Mail,
  Bell,
  CreditCard,
  Shield,
  Settings,
  BarChart3,
} from "lucide-react";

interface OptionCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const options: OptionCard[] = [
  {
    title: "Reportes",
    description: "Revisa estadísticas y métricas de tu cuenta",
    icon: BarChart3,
    available: false,
  },
  {
    title: "Gestión de Usuarios",
    description:
      "Administra los usuarios de tu cuenta, asigna roles y permisos",
    icon: Users,
    available: false,
  },
  {
    title: "Claves API",
    description: "Genera y gestiona claves API para integraciones externas",
    icon: Key,
    available: false,
  },
  {
    title: "Exportar Datos",
    description:
      "Exporta información de propiedades, contactos y transacciones",
    icon: Download,
    available: false,
  },
  {
    title: "Plantillas de Email",
    description:
      "Personaliza las plantillas de correo electrónico de tu cuenta",
    icon: Mail,
    available: false,
  },
  {
    title: "Notificaciones",
    description: "Configura alertas y notificaciones para tu equipo",
    icon: Bell,
    available: false,
  },
  {
    title: "Facturación",
    description: "Revisa tu plan, facturas y métodos de pago",
    icon: CreditCard,
    available: false,
  },
];

export const AccountOther = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.title}
              className={
                option.available
                  ? "cursor-pointer transition-shadow hover:shadow-md"
                  : "opacity-60"
              }
            >
              <CardHeader className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-base">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {option.description}
                </CardDescription>
                {!option.available && (
                  <p className="mt-2 text-xs text-gray-400">Próximamente</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad y Privacidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            Mantén tu cuenta segura con estas opciones adicionales de seguridad.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium">
                  Autenticación de dos factores
                </p>
                <p className="text-xs text-gray-500">
                  Añade una capa extra de seguridad
                </p>
              </div>
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>
                <p className="text-sm font-medium">Registro de actividad</p>
                <p className="text-xs text-gray-500">
                  Revisa las acciones realizadas en tu cuenta
                </p>
              </div>
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            Estas funciones estarán disponibles próximamente
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
