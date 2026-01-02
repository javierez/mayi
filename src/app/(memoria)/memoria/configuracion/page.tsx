import { Suspense } from "react";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { SettingsView } from "~/components/memoria/SettingsView";
import { getCoupleWithPartnersAction } from "~/server/actions/memoria/couples";
import { requireCoupleSession } from "~/lib/dal-couples";

export default async function ConfiguracionPage() {
  return (
    <MemoriaLayout>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<SettingsSkeleton />}>
            <SettingsContent />
          </Suspense>
        </div>
      </div>
    </MemoriaLayout>
  );
}

async function SettingsContent() {
  const [coupleResult, session] = await Promise.all([
    getCoupleWithPartnersAction(),
    requireCoupleSession(),
  ]);

  const couple = coupleResult.success ? coupleResult.data : null;

  return (
    <SettingsView
      couple={couple}
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
