"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Heart } from "lucide-react";
import Image from "next/image";

interface Memory {
  date: Date;
  image: string;
  caption?: string;
}

// Placeholder memories - you'll replace these with real photos later
const DEMO_MEMORIES: Memory[] = [
  {
    date: new Date(2024, 0, 15),
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop",
    caption: "Nuestro primer viaje juntos",
  },
  {
    date: new Date(2024, 0, 28),
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=400&fit=crop",
    caption: "Cena especial",
  },
  {
    date: new Date(2024, 1, 14),
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop",
    caption: "San Valentín",
  },
  {
    date: new Date(2024, 2, 8),
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=400&fit=crop",
    caption: "Paseo por el parque",
  },
  {
    date: new Date(2024, 3, 20),
    image: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=400&h=400&fit=crop",
    caption: "Atardecer en la playa",
  },
  {
    date: new Date(2024, 4, 5),
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop",
    caption: "Concierto juntos",
  },
];

const DAYS_OF_WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
}

export function MemoryCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1));
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getMemoryForDay = (day: number): Memory | undefined => {
    return DEMO_MEMORIES.find(
      (m) =>
        m.date.getFullYear() === year &&
        m.date.getMonth() === month &&
        m.date.getDate() === day
    );
  };

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <section
      id="memory-calendar"
      className="min-h-screen bg-gradient-to-b from-amber-50/30 to-pink-50/50 px-4 py-16"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-light text-gray-700 sm:text-3xl">
            Nuestros Recuerdos
          </h2>
          <p className="mt-2 text-gray-500">
            Haz clic en los días con fotos para ver el recuerdo
          </p>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8"
        >
          {/* Month navigation */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-medium text-gray-700">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={goToNextMonth}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-500"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const memory = getMemoryForDay(day);
              const hasMemory = Boolean(memory);

              return (
                <motion.button
                  key={day}
                  onClick={() => memory && setSelectedMemory(memory)}
                  disabled={!hasMemory}
                  className={`relative aspect-square overflow-hidden rounded-lg transition-all ${
                    hasMemory
                      ? "cursor-pointer ring-2 ring-pink-200 hover:ring-pink-400 hover:shadow-lg"
                      : "cursor-default"
                  }`}
                  whileHover={hasMemory ? { scale: 1.05 } : undefined}
                  whileTap={hasMemory ? { scale: 0.95 } : undefined}
                >
                  {hasMemory && memory ? (
                    <>
                      <Image
                        src={memory.image}
                        alt={memory.caption ?? `Recuerdo del día ${day}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40px, 60px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-sm font-medium text-white drop-shadow">
                          {day}
                        </span>
                      </div>
                      <Heart className="absolute bottom-1 right-1 h-3 w-3 fill-pink-400 text-pink-400 drop-shadow" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-sm text-gray-400">
                      {day}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Memory count */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Heart className="h-4 w-4 fill-pink-300 text-pink-300" />
            <span>
              {DEMO_MEMORIES.filter(
                (m) => m.date.getMonth() === month && m.date.getFullYear() === year
              ).length}{" "}
              recuerdos este mes
            </span>
          </div>
        </motion.div>
      </div>

      {/* Memory modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image */}
              <div className="relative aspect-square w-full">
                <Image
                  src={selectedMemory.image}
                  alt={selectedMemory.caption ?? "Recuerdo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 500px"
                  priority
                />
              </div>

              {/* Caption */}
              <div className="bg-gradient-to-t from-white to-white/95 p-6">
                <p className="text-sm text-gray-400">
                  {selectedMemory.date.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {selectedMemory.caption && (
                  <p className="mt-2 text-lg font-medium text-gray-700">
                    {selectedMemory.caption}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1 text-pink-400">
                  <Heart className="h-5 w-5 fill-current" />
                  <Heart className="h-5 w-5 fill-current" />
                  <Heart className="h-5 w-5 fill-current" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
