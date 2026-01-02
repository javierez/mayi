import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { SettingsView } from "~/components/memoria/SettingsView";

export default function ConfiguracionPage() {
  // Mock data for development
  const mockCouple = {
    id: BigInt(1),
    name: "Nuestra Historia",
    anniversaryDate: "2020-02-14",
    inviteCode: "ABC123",
    inviteCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    timezone: "Europe/Madrid",
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    partners: [
      { id: "1", firstName: "Javier", lastName: "García", image: null, birthDate: null },
      { id: "2", firstName: "Partner", lastName: "", image: null, birthDate: null },
    ],
  };

  const mockUser = {
    id: "1",
    firstName: "Javier",
    lastName: "García",
    email: "javier@example.com",
  };

  return (
    <MemoriaLayout>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg">
          <SettingsView couple={mockCouple} currentUser={mockUser} />
        </div>
      </div>
    </MemoriaLayout>
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
