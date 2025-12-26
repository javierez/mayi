"use client";

import type { FC } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Settings,
  Users,
  Palette,
  FileImage,
  Globe,
  Monitor,
  Building,
  Shield,
  Mail,
  FileText,
} from "lucide-react";

interface AccountAdminCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  available: boolean;
}

const accountAdminSections: AccountAdminCard[] = [
  {
    title: "Detalles de Cuenta",
    description: "Información completa de tu cuenta y configuración",
    icon: Building,
    href: "/account-admin/account",
    available: true,
  },
  {
    title: "Usuarios",
    description: "Gestiona usuarios y asigna roles",
    icon: Users,
    href: "/account-admin/usuarios",
    available: true,
  },
  {
    title: "Roles y Privacidad",
    description: "Gestiona permisos de usuarios y configuración de privacidad",
    icon: Settings,
    href: "/account-admin/roles",
    available: true,
  },
  {
    title: "Seguridad",
    description: "Configuración de seguridad y autenticación de dos factores",
    icon: Shield,
    href: "/account-admin/seguridad",
    available: true,
  },
  {
    title: "Portales",
    description: "Configura la publicación en portales inmobiliarios",
    icon: Globe,
    href: "/account-admin/portales",
    available: true,
  },
  {
    title: "Marca y Logo",
    description: "Gestiona la identidad visual y elementos de marca",
    icon: Palette,
    href: "/account-admin/branding",
    available: true,
  },
  {
    title: "Cartelería",
    description:
      "Selecciona y personaliza plantillas para carteles inmobiliarios",
    icon: FileImage,
    href: "/account-admin/carteleria",
    available: true,
  },
  {
    title: "Sitio Web",
    description: "Personaliza tu página web: diseño, contenido y SEO",
    icon: Monitor,
    href: "/account-admin/website",
    available: true,
  },
  {
    title: "Sistema de Notificaciones",
    description: "Configura el servicio de correo electrónico y notificaciones",
    icon: Mail,
    href: "/account-admin/notification-system",
    available: true,
  },
  {
    title: "Ejemplos de Descripción",
    description: "Gestiona los ejemplos que usa la IA para generar descripciones",
    icon: FileText,
    href: "/account-admin/ejemplos-descripcion",
    available: true,
  },
  {
    title: "Otras Opciones",
    description: "Funcionalidades adicionales y herramientas avanzadas",
    icon: Users,
    href: "/account-admin/other",
    available: false,
  },
];

export const AccountAdminNavigationCards: FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accountAdminSections.map((section) => {
          const Icon = section.icon;

          if (!section.available) {
            return (
              <Card key={section.title} className="flex flex-col opacity-60">
                <CardHeader className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <Icon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <CardDescription className="min-h-[2.5rem] text-sm">
                    {section.description}
                  </CardDescription>
                  <p className="mt-3 text-xs text-gray-400">Próximamente</p>
                </CardContent>
              </Card>
            );
          }

          return (
            <Link key={section.title} href={section.href}>
              <Card className="group flex flex-col cursor-pointer transition-all duration-200 hover:bg-gray-100">
                <CardHeader className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-gray-100 p-2 group-hover:bg-gray-200">
                      <Icon className="h-6 w-6 text-gray-700 group-hover:text-gray-800" />
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-gray-900">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <CardDescription className="min-h-[2.5rem] text-sm group-hover:text-gray-600">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
