"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  createCoupleAction,
  joinCoupleAction,
  validateInviteCodeAction,
} from "~/server/actions/memoria/couples";

type OnboardingStep = "choice" | "create" | "join";

interface CoupleOnboardingProps {
  userName?: string;
}

export function CoupleOnboarding({ userName }: CoupleOnboardingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<OnboardingStep>("choice");
  const [error, setError] = useState<string | null>(null);

  // Create couple form
  const [coupleName, setCoupleName] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");

  // Join couple form
  const [inviteCode, setInviteCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<string | null>(null);

  const handleCreateCouple = () => {
    console.log("[Onboarding] handleCreateCouple called");
    setError(null);
    startTransition(async () => {
      try {
        console.log("[Onboarding] Calling createCoupleAction...");
        const result = await createCoupleAction({
          name: coupleName || undefined,
          anniversaryDate: anniversaryDate || undefined,
        });
        console.log("[Onboarding] Result:", result);

        if (result.success) {
          console.log("[Onboarding] Success, reloading...");
          // Hard reload to get fresh session with new coupleId
          window.location.reload();
        } else {
          console.log("[Onboarding] Failed:", result.error);
          setError(result.error ?? "Error al crear");
        }
      } catch (err) {
        console.error("[Onboarding] Error:", err);
        setError("Error inesperado");
      }
    });
  };

  const handleValidateCode = async (code: string) => {
    if (code.length < 10) {
      setCodeValid(null);
      setPartnerInfo(null);
      return;
    }

    setValidatingCode(true);
    try {
      const result = await validateInviteCodeAction(code);
      if (result.success && result.data) {
        setCodeValid(true);
        setPartnerInfo(result.data.coupleName ?? "Válido");
      } else {
        setCodeValid(false);
        setPartnerInfo(null);
      }
    } catch {
      setCodeValid(false);
      setPartnerInfo(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleJoinCouple = () => {
    if (!codeValid) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await joinCoupleAction(inviteCode);

        if (result.success) {
          router.refresh();
        } else {
          setError(result.error ?? "Error al unirse");
        }
      } catch (err) {
        console.error("Error joining couple:", err);
        setError("Error inesperado");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50/50 to-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-sm space-y-6"
            >
              {/* Header */}
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-medium text-gray-800">
                  {userName ? `Hola, ${userName}` : "Bienvenido"}
                </h1>
                <p className="text-sm text-gray-500">
                  Crea o únete a un grupo para empezar
                </p>
              </div>

              {/* Options - Bento style */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("create")}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl bg-slate-200/80 p-4 text-center transition-colors hover:bg-slate-300/80"
                >
                  <span className="text-sm font-medium text-gray-700">Crear nuevo</span>
                  <span className="mt-1 text-[11px] text-gray-500">
                    Invita después
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("join")}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl bg-slate-200/80 p-4 text-center transition-colors hover:bg-slate-300/80"
                >
                  <span className="text-sm font-medium text-gray-700">Tengo código</span>
                  <span className="mt-1 text-[11px] text-gray-500">
                    Únete a alguien
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <button
                onClick={() => setStep("choice")}
                className="text-sm text-gray-400 transition-colors hover:text-gray-600"
              >
                ← Volver
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-medium text-gray-800">Crear espacio</h2>
                <p className="text-sm text-gray-500">
                  Podrás invitar a alguien después
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="space-y-2">
                  <Label htmlFor="coupleName" className="text-sm text-gray-600">
                    Nombre (opcional)
                  </Label>
                  <Input
                    id="coupleName"
                    placeholder="Ej: Familia García"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    disabled={isPending}
                    className="bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anniversary" className="text-sm text-gray-600">
                    Fecha especial (opcional)
                  </Label>
                  <Input
                    id="anniversary"
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    disabled={isPending}
                    className="bg-slate-50/50"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  onClick={handleCreateCouple}
                  disabled={isPending}
                  className="w-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Crear"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-sm space-y-4"
            >
              <button
                onClick={() => setStep("choice")}
                className="text-sm text-gray-400 transition-colors hover:text-gray-600"
              >
                ← Volver
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-medium text-gray-800">Unirse</h2>
                <p className="text-sm text-gray-500">
                  Introduce el código de invitación
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-sm text-gray-600">
                    Código
                  </Label>
                  <Input
                    id="inviteCode"
                    placeholder="Pega el código aquí"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      void handleValidateCode(e.target.value);
                    }}
                    disabled={isPending}
                    className="bg-slate-50/50"
                  />
                  {validatingCode && (
                    <p className="text-xs text-gray-400">Verificando...</p>
                  )}
                  {codeValid === true && (
                    <p className="text-xs text-green-600">✓ {partnerInfo}</p>
                  )}
                  {codeValid === false && (
                    <p className="text-xs text-red-500">Código inválido</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  onClick={handleJoinCouple}
                  disabled={isPending || !codeValid}
                  className="w-full bg-slate-800 text-white hover:bg-slate-700"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Unirme"
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
