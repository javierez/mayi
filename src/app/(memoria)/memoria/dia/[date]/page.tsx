import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { DayDetail } from "~/components/memoria/DayDetail";
import { getDayByDateAction } from "~/server/actions/memoria/days";
import { getMemoriesForDayAction } from "~/server/actions/memoria/memories";

interface DayPageProps {
  params: Promise<{
    date: string;
  }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  // Format the date for display
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <MemoriaLayout
      showBackButton
      backHref="/memoria"
      title={displayDate}
    >
      <Suspense fallback={<DayDetailSkeleton />}>
        <DayDetailContent date={date} />
      </Suspense>
    </MemoriaLayout>
  );
}

async function DayDetailContent({ date }: { date: string }) {
  // Fetch day data and memories in parallel
  const [dayResult, memoriesResult] = await Promise.all([
    getDayByDateAction(date),
    getMemoriesForDayAction(date),
  ]);

  const day = dayResult.success ? dayResult.data : null;
  const memories = memoriesResult.success ? memoriesResult.data : [];

  return (
    <DayDetail
      date={date}
      day={day}
      initialMemories={memories ?? []}
    />
  );
}

function DayDetailSkeleton() {
  return (
    <div className="animate-pulse px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Day header skeleton */}
        <div className="rounded-2xl bg-white/80 p-4">
          <div className="h-6 w-3/4 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
        </div>

        {/* Memory grid skeleton */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
