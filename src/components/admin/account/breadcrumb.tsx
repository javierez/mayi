"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";

const routeNames: Record<string, string> = {
  "/account-admin": "Administración de Cuenta",
  "/account-admin/reports": "Reportes",
  "/account-admin/privacy": "Privacidad y Permisos",
  "/account-admin/portales": "Portales",
  "/account-admin/branding": "Marca y Logo",
  "/account-admin/carteleria": "Cartelería",
  "/account-admin/website": "Sitio Web",
  "/account-admin/seguridad": "Seguridad",
  "/account-admin/correo": "Correo",
  "/account-admin/other": "Otras Opciones",
};

export const AccountAdminBreadcrumb = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pathname === "/account-admin") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="mb-6 flex items-center space-x-1 overflow-x-auto whitespace-nowrap pb-2 text-xs text-gray-500 sm:text-sm">
      <Link
        href="/account-admin"
        className="flex flex-shrink-0 items-center transition-colors hover:text-gray-900"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Admin</span>
      </Link>

      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;

        return (
          <div key={path} className="flex flex-shrink-0 items-center">
            <ChevronRight className="mx-1 h-3 w-3 sm:h-4 sm:w-4" />
            {isLast ? (
              <span className="max-w-[120px] truncate font-medium text-gray-900 sm:max-w-none">
                {routeNames[path] ?? segment}
              </span>
            ) : (
              <Link
                href={path}
                className="max-w-[100px] truncate transition-colors hover:text-gray-900 sm:max-w-none"
              >
                {routeNames[path] ?? segment}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
