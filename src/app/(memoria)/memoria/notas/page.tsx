import { MemoriaLayout } from "~/components/memoria/MemoriaLayout";
import { BookOpen, Heart, Gift, PenLine, ChefHat, Sparkles } from "lucide-react";
import Link from "next/link";

const NOTE_CATEGORIES = [
  {
    id: "love_letter",
    icon: Heart,
    label: "Cartas de amor",
    description: "Expresiones escritas de amor",
    color: "from-pink-400 to-rose-400",
    bgColor: "bg-pink-50",
  },
  {
    id: "bucket_list",
    icon: Sparkles,
    label: "Bucket list",
    description: "Cosas que queremos hacer juntos",
    color: "from-amber-400 to-orange-400",
    bgColor: "bg-amber-50",
  },
  {
    id: "wishlist",
    icon: Gift,
    label: "Wishlist",
    description: "Ideas de regalos",
    color: "from-purple-400 to-violet-400",
    bgColor: "bg-purple-50",
  },
  {
    id: "journal",
    icon: PenLine,
    label: "Diario",
    description: "Reflexiones personales",
    color: "from-blue-400 to-sky-400",
    bgColor: "bg-blue-50",
  },
  {
    id: "recipe",
    icon: ChefHat,
    label: "Recetas",
    description: "Recetas que nos encantan",
    color: "from-green-400 to-emerald-400",
    bgColor: "bg-green-50",
  },
];

export default function NotasPage() {
  return (
    <MemoriaLayout>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-medium text-gray-700">Nuestras Notas</h2>
            <p className="text-sm text-gray-500">
              Un espacio para escribir juntos
            </p>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-3">
            {NOTE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={`/memoria/notas?categoria=${category.id}`}
                  className="group rounded-xl bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all hover:shadow-lg"
                >
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-700">{category.label}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Coming soon notice */}
          <div className="rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 p-4 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-amber-400" />
            <p className="mt-2 text-sm text-gray-600">
              Las notas estarán disponibles muy pronto
            </p>
          </div>
        </div>
      </div>
    </MemoriaLayout>
  );
}
