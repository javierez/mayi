"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  User,
  Users,
  Home,
  UserPlus,
  Calendar,
  Copy,
  RefreshCw,
  Check,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  updateCoupleAction,
  generateInviteCodeAction,
} from "~/server/actions/memoria/couples";
import { authClient } from "~/lib/auth-client";
import type { CircleWithMembers } from "~/types/memoria";
import {
  CIRCLE_TYPE_LABELS,
  CIRCLE_TYPE_ICONS,
} from "~/types/memoria";

interface SettingsViewProps {
  circle: CircleWithMembers | null;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function SettingsView({ circle, currentUser }: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEditCircle, setShowEditCircle] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [circleName, setCircleName] = useState(circle?.name ?? "");
  const [circleDescription, setCircleDescription] = useState(circle?.description ?? "");
  const [anniversaryDate, setAnniversaryDate] = useState(
    circle?.anniversaryDate ?? ""
  );

  const circleType = circle?.type ?? "couple";
  const otherMembers = circle?.members?.filter((m) => m.id !== currentUser.id) ?? [];
  const hasOtherMembers = otherMembers.length > 0;
  const maxMembers = circle?.maxMembers;
  const canInviteMore = maxMembers === null || (circle?.members?.length ?? 0) < maxMembers;

  // Get circle type icon component
  const getCircleIcon = () => {
    switch (circleType) {
      case "couple":
        return <Heart className="h-5 w-5 text-rose-400" />;
      case "friends":
        return <Users className="h-5 w-5 text-blue-400" />;
      case "family":
        return <Home className="h-5 w-5 text-green-400" />;
      case "group":
        return <UserPlus className="h-5 w-5 text-purple-400" />;
      default:
        return <Users className="h-5 w-5 text-amber-400" />;
    }
  };

  // Get label based on circle type
  const getCircleLabel = () => CIRCLE_TYPE_LABELS[circleType] ?? "Grupo";
  const getMembersLabel = () => {
    switch (circleType) {
      case "couple":
        return "Pareja";
      case "friends":
        return "Amigos";
      case "family":
        return "Familia";
      case "group":
        return "Miembros";
      default:
        return "Miembros";
    }
  };
  const getInviteLabel = () => {
    switch (circleType) {
      case "couple":
        return "Invita a tu pareja";
      case "friends":
        return "Invita a tus amigos";
      case "family":
        return "Invita a tu familia";
      default:
        return "Invita a nuevos miembros";
    }
  };

  const handleCopyInviteCode = async () => {
    if (!circle?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(circle.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleGenerateNewCode = () => {
    startTransition(async () => {
      const result = await generateInviteCodeAction();
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleSaveCircle = () => {
    startTransition(async () => {
      const result = await updateCoupleAction({
        name: circleName || undefined,
        description: circleDescription || undefined,
        anniversaryDate: anniversaryDate || undefined,
      });

      if (result.success) {
        setShowEditCircle(false);
        router.refresh();
      }
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/signin");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-gray-700">Ajustes</h2>
        <p className="text-sm text-gray-500">
          Configuración de {getCircleLabel().toLowerCase()} y perfil
        </p>
      </div>

      {/* Circle Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getCircleIcon()}
            <h3 className="font-medium text-gray-700">
              {circle?.emoji && <span className="mr-1">{circle.emoji}</span>}
              {getCircleLabel()}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditCircle(true)}
          >
            Editar
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Nombre</p>
            <p className="text-sm font-medium text-gray-700">
              {circle?.name ?? "Sin nombre"}
            </p>
          </div>

          {circle?.description && (
            <div>
              <p className="text-xs text-gray-500">Descripción</p>
              <p className="text-sm text-gray-600">{circle.description}</p>
            </div>
          )}

          {circle?.anniversaryDate && (
            <div>
              <p className="text-xs text-gray-500">
                {circleType === "couple" ? "Aniversario" : "Fecha de inicio"}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(circle.anniversaryDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            <h3 className="font-medium text-gray-700">{getMembersLabel()}</h3>
          </div>
          {maxMembers && (
            <span className="text-xs text-gray-400">
              {circle?.members?.length ?? 0}/{maxMembers}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Current user */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-700">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              Tú
            </span>
          </div>

          {/* Other members */}
          {otherMembers.map((member, index) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${
                index % 2 === 0 ? "from-rose-400 to-pink-400" : "from-blue-400 to-indigo-400"
              }`}>
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.firstName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {member.firstName} {member.lastName}
                </p>
                {member.birthDate && (
                  <p className="text-xs text-gray-500">
                    {new Date(member.birthDate).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Invite section - only if can invite more */}
          {canInviteMore && (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
              <p className="mb-2 text-center text-sm text-gray-500">
                {getInviteLabel()}
              </p>
              {circle?.inviteCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-center font-mono text-sm">
                      {circle.inviteCode.slice(0, 16)}...
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyInviteCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={handleGenerateNewCode}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Generar nuevo código
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateNewCode}
                  disabled={isPending}
                >
                  Generar código de invitación
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </motion.div>

      {/* Edit Circle Dialog */}
      <Dialog open={showEditCircle} onOpenChange={setShowEditCircle}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {getCircleLabel().toLowerCase()}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="circleName">Nombre</Label>
              <Input
                id="circleName"
                placeholder={circleType === "couple" ? "Ej: Javi & María" : "Ej: Los aventureros"}
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="circleDescription">Descripción (opcional)</Label>
              <Textarea
                id="circleDescription"
                placeholder="Una breve descripción..."
                value={circleDescription}
                onChange={(e) => setCircleDescription(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="anniversary">
                {circleType === "couple" ? "Aniversario" : "Fecha de inicio"}
              </Label>
              <Input
                id="anniversary"
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditCircle(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCircle}
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
