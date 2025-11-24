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
import { Users, Building2, Settings, BarChart3, Globe, MessageCircle } from "lucide-react";

interface AdminCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  available: boolean;
}

const adminSections: AdminCard[] = [
  {
    title: "Gestión de Cuentas",
    description:
      "Administra las cuentas de la plataforma, planes y suscripciones",
    icon: Building2,
    href: "/admin/accounts",
    available: true,
  },
  {
    title: "Gestión de Usuarios",
    description: "Administra usuarios, roles y permisos del sistema",
    icon: Users,
    href: "/admin/users",
    available: true,
  },
  {
    title: "Configuración del Sistema",
    description: "Configuraciones globales y parámetros del sistema",
    icon: Settings,
    href: "/admin/settings",
    available: true,
  },
  {
    title: "Analíticas",
    description: "Reportes y estadísticas de uso de la plataforma",
    icon: BarChart3,
    href: "/admin/analytics",
    available: false,
  },
  {
    title: "Configuración de Página Web",
    description: "Administra la configuración de tu página web",
    icon: Globe,
    href: "/admin/webpage",
    available: true,
  },
  {
    title: "Gestión de Feedback",
    description: "Visualiza y gestiona el feedback de los usuarios",
    icon: MessageCircle,
    href: "/admin/feedback",
    available: true,
  },
];

export const AdminNavigationCards: FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;

          if (!section.available) {
            return (
              <Card key={section.title} className="opacity-60">
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
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                  <p className="mt-3 text-xs text-gray-400">Próximamente</p>
                </CardContent>
              </Card>
            );
          }

          return (
            <Link key={section.title} href={section.href}>
              <Card className="group cursor-pointer transition-all duration-200 hover:bg-gray-100">
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
                <CardContent>
                  <CardDescription className="text-sm group-hover:text-gray-600">
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
