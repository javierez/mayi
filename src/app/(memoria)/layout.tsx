import { redirect } from "next/navigation";
import { getSessionWithoutCoupleCheck } from "~/lib/dal-couples";
import { CoupleOnboarding } from "~/components/memoria/CoupleOnboarding";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MayI - Nuestros Recuerdos",
  description: "Calendario de recuerdos para parejas",
};

export default async function MemoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated (without requiring coupleId)
  const session = await getSessionWithoutCoupleCheck();

  // If not authenticated, redirect to memoria signin
  if (!session) {
    redirect("/memoria/auth/signin");
  }

  // Check the database directly for coupleId (session cookie might be stale)
  console.log("[MemoriaLayout] Checking DB for user:", session.user.id);
  const userFromDb = await db
    .select({ coupleId: users.coupleId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  console.log("[MemoriaLayout] DB result:", userFromDb);

  const hasCoupleId = userFromDb[0]?.coupleId !== null && userFromDb[0]?.coupleId !== undefined;
  console.log("[MemoriaLayout] hasCoupleId:", hasCoupleId);

  // If user doesn't have a couple, show onboarding
  if (!hasCoupleId) {
    return <CoupleOnboarding userName={session.user.firstName} />;
  }

  // User is authenticated and has a couple - show the app
  return <>{children}</>;
}
