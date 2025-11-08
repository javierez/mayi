import { redirect } from "next/navigation";
import { getSecureSession } from "~/lib/dal";
import { userHasRole } from "~/server/queries/user-roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use optimized DAL function for session retrieval
  const session = await getSecureSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has role ID 2 (Super Admin)
  const hasRequiredRole = await userHasRole(session.user.id, 2);

  if (!hasRequiredRole) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
