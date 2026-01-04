import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { SettingsView } from "~/components/memoria/SettingsView";
import { getSecureCoupleSession } from "~/lib/dal-couples";
import { getCircleWithMembers } from "~/server/queries/memoria/couples";

async function SettingsContent() {
  const session = await getSecureCoupleSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const circle = await getCircleWithMembers(session.user.coupleId);

  return (
    <SettingsView
      circle={circle}
      currentUser={{
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
      }}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <MemoriaLayout>
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </MemoriaLayout>
  );
}
