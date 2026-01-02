"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  createMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
} from "~/server/actions/memoria/milestones";
import type { MilestoneWithNextDate, RecurrenceType } from "~/types/memoria";

interface MilestonesListProps {
  initialMilestones: MilestoneWithNextDate[];
}

const MILESTONE_ICONS = ["💍", "🎂", "✈️", "💕", "🏠", "🎉", "💒", "🌟", "🎁", "🎄"];

export function MilestonesList({ initialMilestones }: MilestonesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithNextDate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalDate, setOriginalDate] = useState("");
  const [icon, setIcon] = useState("🎉");
  const [recurrence, setRecurrence] = useState<RecurrenceType>("yearly");
  const [reminderDays, setReminderDays] = useState("7");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOriginalDate("");
    setIcon("🎉");
    setRecurrence("yearly");
    setReminderDays("7");
    setEditingMilestone(null);
    setError(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (milestone: MilestoneWithNextDate) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description ?? "");
    setOriginalDate(milestone.originalDate);
    setIcon(milestone.icon ?? "🎉");
    setRecurrence(milestone.recurrence);
    setReminderDays(milestone.reminderDaysBefore.toString());
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !originalDate) {
      setError("Título y fecha son obligatorios");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        if (editingMilestone) {
          const result = await updateMilestoneAction(editingMilestone.id.toString(), {
            title,
            description: description || null,
            originalDate,
            icon,
            recurrence,
            reminderDaysBefore: parseInt(reminderDays),
          });

          if (result.success) {
            router.refresh();
            setShowForm(false);
            resetForm();
          } else {
            setError(result.error ?? "Error al actualizar");
          }
        } else {
          const result = await createMilestoneAction({
            title,
            description: description || undefined,
            originalDate,
            icon,
            recurrence,
            reminderDaysBefore: parseInt(reminderDays),
          });

          if (result.success) {
            router.refresh();
            setShowForm(false);
            resetForm();
          } else {
            setError(result.error ?? "Error al crear");
          }
        }
      } catch (err) {
        setError("Error inesperado");
      }
    });
  };

  const handleDelete = (milestone: MilestoneWithNextDate) => {
    if (!confirm("¿Seguro que quieres eliminar este hito?")) return;

    startTransition(async () => {
      const result = await deleteMilestoneAction(milestone.id.toString());
      if (result.success) {
        router.refresh();
      }
    });
  };

  // Group milestones by upcoming and past
  const upcomingMilestones = milestones.filter((m) => m.daysUntil >= 0);
  const sortedMilestones = [...upcomingMilestones].sort(
    (a, b) => a.daysUntil - b.daysUntil
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-700">Nuestros Hitos</h2>
          <p className="text-sm text-gray-500">
            Fechas especiales que celebramos juntos
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-gradient-to-r from-amber-400 to-rose-400 text-white"
        >
          <Plus className="mr-1 h-4 w-4" />
          Añadir
        </Button>
      </div>

      {/* Milestones List */}
      {milestones.length > 0 ? (
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.id.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100 text-2xl">
                  {milestone.icon ?? "🎉"}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-700">{milestone.title}</h3>
                  {milestone.description && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {milestone.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(milestone.nextDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                    {milestone.yearsAgo !== undefined && milestone.yearsAgo > 0 && (
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-600">
                        {milestone.yearsAgo} años
                      </span>
                    )}
                    {milestone.daysUntil <= 7 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {milestone.daysUntil === 0
                          ? "¡Hoy!"
                          : milestone.daysUntil === 1
                            ? "Mañana"
                            : `En ${milestone.daysUntil} días`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEditForm(milestone)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(milestone)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
            <Star className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">No hay hitos aún</h3>
          <p className="mt-1 text-sm text-gray-500">
            Añade vuestro aniversario, cumpleaños y otras fechas especiales
          </p>
          <Button
            onClick={openCreateForm}
            className="mt-4 bg-gradient-to-r from-amber-400 to-rose-400 text-white"
          >
            <Plus className="mr-1 h-4 w-4" />
            Añadir primer hito
          </Button>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Editar hito" : "Nuevo hito"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ej: Nuestro aniversario"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ej: El día que empezamos a salir"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={originalDate}
                onChange={(e) => setOriginalDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Icono</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {MILESTONE_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                      icon === emoji
                        ? "bg-amber-100 ring-2 ring-amber-400"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Repetición</Label>
                <Select
                  value={recurrence}
                  onValueChange={(v) => setRecurrence(v as RecurrenceType)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Cada año</SelectItem>
                    <SelectItem value="monthly">Cada mes</SelectItem>
                    <SelectItem value="once">Una vez</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Recordatorio</Label>
                <Select value={reminderDays} onValueChange={setReminderDays}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">El mismo día</SelectItem>
                    <SelectItem value="1">1 día antes</SelectItem>
                    <SelectItem value="3">3 días antes</SelectItem>
                    <SelectItem value="7">1 semana antes</SelectItem>
                    <SelectItem value="14">2 semanas antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingMilestone ? (
                  "Guardar cambios"
                ) : (
                  "Crear hito"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
