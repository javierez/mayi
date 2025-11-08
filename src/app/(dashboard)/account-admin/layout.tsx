import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";

export const dynamic = "force-dynamic";

export default async function AccountAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 3 (Account Admin) and is NOT inactive (role 5)
  const hasRequiredRole = await userHasRole(session.user.id, 3);
  const isInactive = await userHasRole(session.user.id, 5);

  if (!hasRequiredRole || isInactive) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
