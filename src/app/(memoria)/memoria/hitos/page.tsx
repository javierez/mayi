import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { MilestonesList } from "~/components/memoria/MilestonesList";

export default function HitosPage() {
  // Mock milestones for development
  const mockMilestones = [
    {
      id: BigInt(1),
      coupleId: BigInt(1),
      title: "Nuestro Aniversario",
      description: "El día que empezó todo",
      originalDate: "2020-02-14",
      icon: "💕",
      recurrence: "yearly" as const,
      reminderDaysBefore: 7,
      color: "#ec4899",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      nextDate: "2025-02-14",
      daysUntil: 43,
      yearsAgo: 5,
    },
    {
      id: BigInt(2),
      coupleId: BigInt(1),
      title: "Primera Cita",
      description: "Café en el centro",
      originalDate: "2020-01-20",
      icon: "☕",
      recurrence: "yearly" as const,
      reminderDaysBefore: 3,
      color: "#f59e0b",
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      nextDate: "2025-01-20",
      daysUntil: 18,
      yearsAgo: 5,
    },
  ];

  return (
    <MemoriaLayout>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <MilestonesList initialMilestones={mockMilestones} />
        </div>
      </div>
    </MemoriaLayout>
  );
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
