import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Settings, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { migrateExclusivityToContractType } from "~/lib/nota-encargo-helpers";
import type { ContractType } from "~/types/hoja-encargo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  getAccountDetailsAction,
  getCurrentUserAccountId,
} from "~/app/actions/account-settings";
import { useSession } from "~/lib/auth-client";

const termsSchema = z.object({
  commission: z.number().min(0).max(100),
  min_commission: z.number().min(0),
  duration: z.number().min(1),
  contractType: z.enum(["normal", "zona", "exclusiva"]),
  zona_commission_percentage: z.number().min(0).max(100).optional(),
  zona_min_commission: z.number().min(0).optional(),
  communications: z.boolean(),
  allowSignage: z.boolean(),
  allowVisits: z.boolean(),
  allowKeyDelivery: z.boolean(),
  allowPortalPublication: z.boolean(),
});

type TermsFormData = z.infer<typeof termsSchema>;

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (terms: TermsFormData) => void;
}

export function TermsModal({ isOpen, onClose, onContinue }: TermsModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: session } = useSession();

  const form = useForm<TermsFormData>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      commission: 3.0,
      min_commission: 1500,
      duration: 12,
      contractType: "normal",
      zona_commission_percentage: 1,
      zona_min_commission: 500,
      communications: false,
      allowSignage: true,
      allowVisits: true,
      allowKeyDelivery: false,
      allowPortalPublication: true,
    },
  });

  const loadAccountTerms = useCallback(async () => {
    console.log("loadAccountTerms called, session:", session?.user?.id);
    if (!session?.user?.id) {
      console.log("No session found, skipping account terms load");
      return;
    }

    try {
      setIsLoadingTerms(true);
      const userAccountId = await getCurrentUserAccountId(session.user.id);
      if (!userAccountId) {
        setError("No se pudo obtener la información de la cuenta");
        return;
      }

      const accountResult = await getAccountDetailsAction(userAccountId);

      if (accountResult.success && accountResult.data?.terms) {
        const terms = accountResult.data.terms;
        form.reset({
          commission: (terms.commission as number) ?? 3.0,
          min_commission: (terms.min_commission as number) ?? 1500,
          duration: (terms.duration as number) ?? 12,
          // Backwards compatibility: migrate exclusivity boolean to contractType
          contractType: migrateExclusivityToContractType(
            terms.exclusivity as boolean | undefined,
            terms.contractType as ContractType | undefined,
          ),
          zona_commission_percentage: (terms.zona_commission_percentage as number) ?? 1,
          zona_min_commission: (terms.zona_min_commission as number) ?? 500,
          communications: (terms.communications as boolean) ?? false,
          allowSignage: (terms.allowSignage as boolean) ?? true,
          allowVisits: (terms.allowVisits as boolean) ?? true,
          allowKeyDelivery: (terms.allowKeyDelivery as boolean) ?? false,
          allowPortalPublication: (terms.allowPortalPublication as boolean) ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading account terms:", error);
      setError("Error al cargar los términos de la cuenta");
    } finally {
      setIsLoadingTerms(false);
    }
  }, [session?.user?.id, form]);

  // Load account data and terms when modal opens
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      console.log("Modal opened, loading account terms...");
      void loadAccountTerms();
    }
  }, [isOpen, session?.user?.id, loadAccountTerms]);

  const onSubmit = async (data: TermsFormData) => {
    console.log("Modal onSubmit called with data:", data);
    setIsGenerating(true);
    setError(null);

    try {
      // Generate contract with the selected terms (keep modal open with animation)
      onContinue(data);
      // Close modal only after successful generation
      onClose();
    } catch (error) {
      console.error("Error generating contract:", error);
      setError("Error al generar el contrato");
    } finally {
      setIsGenerating(false);
    }
  };

  console.log("TermsModal render - isOpen:", isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Términos del Contrato
          </DialogTitle>
          <DialogDescription>
            Revisa y ajusta los términos para esta hoja de encargo específica.
          </DialogDescription>
        </DialogHeader>

        {isLoadingTerms ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">
              Cargando términos...
            </span>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Icon container with animation like the old button */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-700 ease-in-out">
              <FileText className="h-8 w-8 scale-110 text-white transition-all duration-700 ease-in-out" />
            </div>

            {/* Loading state with spinner */}
            <div className="animate-in fade-in slide-in-from-bottom-2 flex items-center justify-center gap-2 text-gray-600 transition-all duration-300 ease-in-out">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generando documento...</span>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  <FormField
                    control={form.control}
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comisión (%)</FormLabel>
                        <FormDescription>
                          Porcentaje de comisión sobre el precio de venta
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comisión mínima (€)</FormLabel>
                        <FormDescription>
                          Comisión mínima garantizada
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (meses)</FormLabel>
                        <FormDescription>
                          Duración del contrato en meses
                        </FormDescription>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 12)
                            }
                            value={field.value || 12}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-3">
                        <FormLabel>Tipo de contrato</FormLabel>
                        <FormDescription>
                          Selecciona el tipo de encargo
                        </FormDescription>
                        <FormControl>
                          <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                            <motion.div
                              className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                              animate={{
                                width: "calc(33.333% - 4px)",
                                x: field.value === "normal"
                                  ? "0%"
                                  : field.value === "zona"
                                    ? "100%"
                                    : "200%",
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <div className="relative flex h-full">
                              <button
                                type="button"
                                onClick={() => field.onChange("normal")}
                                className={cn(
                                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                  field.value === "normal" ? "text-gray-900" : "text-gray-600",
                                )}
                              >
                                Normal
                              </button>
                              <button
                                type="button"
                                onClick={() => field.onChange("zona")}
                                className={cn(
                                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                  field.value === "zona" ? "text-gray-900" : "text-gray-600",
                                )}
                              >
                                Zona
                              </button>
                              <button
                                type="button"
                                onClick={() => field.onChange("exclusiva")}
                                className={cn(
                                  "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                  field.value === "exclusiva" ? "text-gray-900" : "text-gray-600",
                                )}
                              >
                                Exclusiva
                              </button>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Zona-specific commission fields */}
                  {form.watch("contractType") === "zona" && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="zona_commission_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comisión Zona (%)</FormLabel>
                            <FormDescription>
                              Venta por propietario/terceros
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                value={field.value ?? 1}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zona_min_commission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mínimo Zona (€)</FormLabel>
                            <FormDescription>
                              Comisión mínima zona
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 500)}
                                value={field.value ?? 500}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="communications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Comunicaciones</FormLabel>
                          <FormDescription>
                            Autorizar comunicaciones comerciales
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowSignage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Colocación de cartel</FormLabel>
                          <FormDescription>
                            Autorizar la colocación de cartel publicitario
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowVisits"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Autorización para visitas</FormLabel>
                          <FormDescription>
                            Autorizar visitas de posibles compradores
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowKeyDelivery"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Entrega de llaves</FormLabel>
                          <FormDescription>
                            Autorizar la entrega de llaves para visitas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowPortalPublication"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Publicación en portales</FormLabel>
                          <FormDescription>
                            Autorizar publicación en portales inmobiliarios
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {!isGenerating && (
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                  >
                    Generar
                  </Button>
                </DialogFooter>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
