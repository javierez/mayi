import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";
import { AccountsManagement } from "~/components/admin/management/accounts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCuentasPage() {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 2 (superadmin)
  const hasRequiredRole = await userHasRole(session.user.id, 2);

  if (!hasRequiredRole) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-700">
          Administración
        </Link>{" "}
        / Gestión de Cuentas
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cuentas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra cuentas y organizaciones del sistema
        </p>
      </div>

      <AccountsManagement />
    </div>
  );
}
