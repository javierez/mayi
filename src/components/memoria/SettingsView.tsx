"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  User,
  Users,
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
import type { CoupleWithPartners } from "~/types/memoria";

interface SettingsViewProps {
  couple: CoupleWithPartners | null;
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function SettingsView({ couple, currentUser }: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEditCouple, setShowEditCouple] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [coupleName, setCoupleName] = useState(couple?.name ?? "");
  const [anniversaryDate, setAnniversaryDate] = useState(
    couple?.anniversaryDate ?? ""
  );

  const partner = couple?.partners?.find((p) => p.id !== currentUser.id);
  const hasPartner = !!partner;

  const handleCopyInviteCode = async () => {
    if (!couple?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(couple.inviteCode);
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

  const handleSaveCouple = () => {
    startTransition(async () => {
      const result = await updateCoupleAction({
        name: coupleName || undefined,
        anniversaryDate: anniversaryDate || undefined,
      });

      if (result.success) {
        setShowEditCouple(false);
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
        <p className="text-sm text-gray-500">Configuración de la pareja y perfil</p>
      </div>

      {/* Couple Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" />
            <h3 className="font-medium text-gray-700">Nuestra Pareja</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditCouple(true)}
          >
            Editar
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Nombre</p>
            <p className="text-sm font-medium text-gray-700">
              {couple?.name ?? "Sin nombre"}
            </p>
          </div>

          {couple?.anniversaryDate && (
            <div>
              <p className="text-xs text-gray-500">Aniversario</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(couple.anniversaryDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Partners */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-white/80 p-4 shadow-lg backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          <h3 className="font-medium text-gray-700">Miembros</h3>
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

          {/* Partner or invite */}
          {hasPartner ? (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-400">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {partner.firstName} {partner.lastName}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4">
              <p className="mb-2 text-center text-sm text-gray-500">
                Invita a tu pareja a unirse
              </p>
              {couple?.inviteCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-center font-mono text-sm">
                      {couple.inviteCode.slice(0, 16)}...
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

      {/* Edit Couple Dialog */}
      <Dialog open={showEditCouple} onOpenChange={setShowEditCouple}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar pareja</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="coupleName">Nombre de la pareja</Label>
              <Input
                id="coupleName"
                placeholder="Ej: Javi & María"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="anniversary">Aniversario</Label>
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
                onClick={() => setShowEditCouple(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCouple}
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
