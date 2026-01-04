import { notFound, redirect } from "next/navigation";
import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { DayDetail } from "~/components/memoria/DayDetail";
import { getSecureCoupleSession } from "~/lib/dal-couples";
import { getDayByDate } from "~/server/queries/memoria/days";
import { getMemoriesForDay } from "~/server/queries/memoria/memories";

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

  // Get session
  const session = await getSecureCoupleSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch day and memories
  const day = await getDayByDate(session.user.coupleId, date);
  const memories = day
    ? await getMemoriesForDay(day.id, session.user.id)
    : [];

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
    <MemoriaLayout>
      <DayDetail
        date={date}
        displayDate={displayDate}
        day={day}
        initialMemories={memories}
      />
    </MemoriaLayout>
  );
}

function DayDetailSkeleton() {
  return (
    <div className="animate-pulse px-3 py-4 sm:px-4 sm:py-6">
      <div className="space-y-4">
        {/* Back button and date skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="h-6 w-48 rounded bg-gray-200" />
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
