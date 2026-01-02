import { redirect } from "next/navigation";
import { getSessionWithoutCoupleCheck } from "~/lib/dal-couples";

export const metadata = {
  title: "MayI - Nuestros Recuerdos",
  description: "Calendario de recuerdos para parejas",
};

export default async function MemoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await getSessionWithoutCoupleCheck();

  if (!session) {
    redirect("/auth/signin");
  }

  // If user doesn't have a couple, redirect to setup
  if (!session.user.coupleId) {
    redirect("/auth/account-setup");
  }

  return <>{children}</>;
}
