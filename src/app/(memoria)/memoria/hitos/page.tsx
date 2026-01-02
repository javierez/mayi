import { Suspense } from "react";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { MilestonesList } from "~/components/memoria/MilestonesList";
import { getMilestonesAction } from "~/server/actions/memoria/milestones";

export default async function HitosPage() {
  return (
    <MemoriaLayout>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<MilestonesSkeleton />}>
            <MilestonesContent />
          </Suspense>
        </div>
      </div>
    </MemoriaLayout>
  );
}

async function MilestonesContent() {
  const result = await getMilestonesAction();
  const milestones = result.success ? result.data : [];

  return <MilestonesList initialMilestones={milestones ?? []} />;
}

function MilestonesSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
