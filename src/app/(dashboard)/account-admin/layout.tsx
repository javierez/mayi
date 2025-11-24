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

  // Check if user has role ID 1 (Admin) or role ID 3 (Account Admin) and is NOT inactive (role 5)
  const isAdmin = await userHasRole(session.user.id, 1);
  const isAccountAdmin = await userHasRole(session.user.id, 3);
  const isInactive = await userHasRole(session.user.id, 5);

  if ((!isAdmin && !isAccountAdmin) || isInactive) {
    redirect("/operaciones");
  }

  return <>{children}</>;
}
