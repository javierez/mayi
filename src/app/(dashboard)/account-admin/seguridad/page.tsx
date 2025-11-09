import { AccountAdminBreadcrumb } from "~/components/admin/account/breadcrumb";
import SecurityClient from "./security-client";
import { getSecureSession } from "~/lib/dal";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountAdminSecurityPage() {
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <AccountAdminBreadcrumb />

      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Seguridad de la Cuenta
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura las opciones de seguridad para toda la organización
        </p>
      </div>

      <SecurityClient />
    </div>
  );
}
