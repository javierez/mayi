import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import { SystemSettings } from "~/components/admin/management/system-settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 2 (superadmin)
  const hasRequiredRole = await userHasRole(session.user.id, 2);

  if (!hasRequiredRole) {
    redirect("/operaciones");
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Administración
        </Link>{" "}
        / Configuración del Sistema
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configuraciones globales y parámetros del sistema
        </p>
      </div>

      <SystemSettings />
    </div>
  );
}
