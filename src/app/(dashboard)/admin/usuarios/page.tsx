import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import { UsersManagement } from "~/components/admin/management/users";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 1 (superadmin)
  const hasRequiredRole = await userHasRole(session.user.id, 1);

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
        / Gestión de Usuarios
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      <UsersManagement />
    </div>
  );
}
