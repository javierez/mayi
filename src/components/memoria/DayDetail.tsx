"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Cloud,
  Smile,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  MapPinned,
  Quote,
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { Day, MemoryWithUser } from "~/types/memoria";
import { AddMemoryModal } from "./AddMemoryModal";

interface DayDetailProps {
  date: string;
  day: Day | null;
  initialMemories: MemoryWithUser[];
}

const MOOD_ICONS: Record<string, string> = {
  happy: "😊",
  romantic: "💕",
  adventurous: "🌟",
  relaxed: "😌",
  emotional: "🥹",
  funny: "😂",
  special: "✨",
  cozy: "🏠",
};

export function DayDetail({ date, day, initialMemories }: DayDetailProps) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleMemoryClick = (memoryId: string) => {
    router.push(`/memoria/recuerdo/${memoryId}`);
  };

  const handleMemoryAdded = () => {
    // Refresh the page to get new data
    router.refresh();
    setShowAddModal(false);
    setSelectedType(null);
  };

  const openAddModal = (type?: string) => {
    setSelectedType(type ?? null);
    setShowAddModal(true);
  };

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Day Header */}
        {day && (day.title ?? day.location ?? day.mood) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
          >
            {day.title && (
              <h2 className="text-lg font-medium text-gray-700">{day.title}</h2>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {day.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-rose-400" />
                  {day.location}
                </span>
              )}
              {day.weather && day.temperature !== null && (
                <span className="flex items-center gap-1">
                  <Cloud className="h-4 w-4 text-sky-400" />
                  {day.temperature}°C
                </span>
              )}
              {day.mood && (
                <span className="flex items-center gap-1">
                  <span>{MOOD_ICONS[day.mood] ?? "😊"}</span>
                  <span className="capitalize">{day.mood}</span>
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Memory Grid */}
        {memories.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {memories.map((memory, index) => (
              <MemoryCard
                key={memory.id.toString()}
                memory={memory}
                index={index}
                onClick={() => handleMemoryClick(memory.id.toString())}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
              <Heart className="h-8 w-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              No hay recuerdos aún
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Añade tu primer recuerdo de este día
            </p>
            <button
              onClick={() => openAddModal()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Añadir recuerdo
            </button>
          </motion.div>
        )}

        {/* Quick Add Buttons */}
        {memories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <QuickAddButton
              icon={ImageIcon}
              label="Foto"
              onClick={() => openAddModal("photo")}
            />
            <QuickAddButton
              icon={Video}
              label="Video"
              onClick={() => openAddModal("video")}
            />
            <QuickAddButton
              icon={FileText}
              label="Nota"
              onClick={() => openAddModal("note")}
            />
            <QuickAddButton
              icon={Music}
              label="Canción"
              onClick={() => openAddModal("song")}
            />
            <QuickAddButton
              icon={MapPinned}
              label="Lugar"
              onClick={() => openAddModal("location")}
            />
            <QuickAddButton
              icon={Quote}
              label="Frase"
              onClick={() => openAddModal("quote")}
            />
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      {memories.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => openAddModal()}
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      {/* Add Memory Modal */}
      <AddMemoryModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedType(null);
        }}
        date={date}
        initialType={selectedType}
        onSuccess={handleMemoryAdded}
      />
    </div>
  );
}

function MemoryCard({
  memory,
  index,
  onClick,
}: {
  memory: MemoryWithUser;
  index: number;
  onClick: () => void;
}) {
  const getMemoryPreview = () => {
    switch (memory.type) {
      case "photo":
        return (
          <Image
            src={memory.thumbnailUrl ?? memory.url}
            alt={memory.caption ?? "Foto"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        );
      case "video":
        return memory.thumbnailUrl ? (
          <>
            <Image
              src={memory.thumbnailUrl}
              alt={memory.caption ?? "Video"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 200px"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                <Video className="h-5 w-5 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
            <Video className="h-8 w-8 text-purple-400" />
          </div>
        );
      case "note":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-3">
            <FileText className="mb-2 h-6 w-6 text-blue-400" />
            <p className="line-clamp-3 text-center text-xs text-gray-600">
              {memory.content}
            </p>
          </div>
        );
      case "song":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-3">
            <Music className="mb-2 h-6 w-6 text-green-500" />
            <p className="line-clamp-2 text-center text-xs font-medium text-gray-700">
              {memory.songData?.title}
            </p>
            <p className="text-center text-xs text-gray-500">
              {memory.songData?.artist}
            </p>
          </div>
        );
      case "location":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-3">
            <MapPinned className="mb-2 h-6 w-6 text-red-400" />
            <p className="line-clamp-2 text-center text-xs font-medium text-gray-700">
              {memory.locationData?.name}
            </p>
          </div>
        );
      case "quote":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-3">
            <Quote className="mb-2 h-6 w-6 text-amber-500" />
            <p className="line-clamp-3 text-center text-xs italic text-gray-600">
              &ldquo;{memory.content}&rdquo;
            </p>
          </div>
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <Heart className="h-8 w-8 text-gray-300" />
          </div>
        );
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl"
    >
      {getMemoryPreview()}

      {/* Overlay with interaction info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {memory.reactionsCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-white">
                <Heart className="h-3 w-3 fill-current" />
                {memory.reactionsCount}
              </span>
            )}
            {memory.commentsCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-white">
                <MessageCircle className="h-3 w-3" />
                {memory.commentsCount}
              </span>
            )}
          </div>
          {memory.user && (
            <span className="text-xs text-white/80">
              {memory.user.firstName}
            </span>
          )}
        </div>
      </div>

      {/* Private indicator */}
      {memory.isPrivate && (
        <div className="absolute right-1 top-1 rounded-full bg-black/50 p-1">
          <span className="text-xs">🔒</span>
        </div>
      )}
    </motion.button>
  );
}

function QuickAddButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow-md"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
