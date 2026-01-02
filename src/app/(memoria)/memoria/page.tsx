import { Suspense } from "react";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { CalendarView } from "~/components/memoria/CalendarView";

export default function MemoriaPage() {
  return (
    <MemoriaLayout coupleName="Nuestra Historia">
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <Suspense fallback={<CalendarSkeleton />}>
            <CalendarView />
          </Suspense>
        </div>
      </div>
    </MemoriaLayout>
  );
}

function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Month navigation skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="h-8 w-8 rounded-full bg-gray-200" />
      </div>

      {/* Days of week skeleton */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-gray-200" />
        ))}
      </div>

      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
