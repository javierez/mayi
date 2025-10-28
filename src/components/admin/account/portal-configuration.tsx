"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "~/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Globe,
  Settings,
  Loader2,
  Droplet,
  Check,
  ChevronRight,
  Key,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPortalConfigurationAction,
  updatePortalConfigurationAction,
  getCurrentUserAccountIdAction,
} from "~/app/actions/settings";
import {
  portalConfigurationSchema,
  type PortalConfigurationInput,
  type PortalTab,
} from "~/types/portal-settings";

const navigationItems: (PortalTab & { color?: string })[] = [
  {
    id: "fotocasa",
    label: "Fotocasa",
    description: "Activar portal",
    icon: Globe,
    color: "text-orange-500",
  },
  {
    id: "idealista",
    label: "Idealista",
    description: "Activar portal",
    icon: Globe,
    color: "text-green-500",
  },
  {
    id: "general",
    label: "General",
    description: "Ajustes generales",
    icon: Settings,
  },
];

export function PortalConfiguration() {
  const { data: session } = useSession();
  const [accountId, setAccountId] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState("fotocasa");

  const form = useForm<PortalConfigurationInput>({
    resolver: zodResolver(portalConfigurationSchema),
    defaultValues: {
      fotocasa: { enabled: false, apiKey: "" },
      idealista: { enabled: false, apiKey: "" },
      general: { watermarkEnabled: false },
    },
  });

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const userAccountId = await getCurrentUserAccountIdAction();

        if (!userAccountId) {
          setError("No se pudo obtener el ID de la cuenta");
          return;
        }

        setAccountId(BigInt(userAccountId));
        const result = await getPortalConfigurationAction(
          BigInt(userAccountId),
        );

        if (result.success && result.data) {
          form.reset(result.data);
        }
      } catch (error) {
        console.error("Error loading portal configuration:", error);
        setError("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [session, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (data: PortalConfigurationInput) => {
    if (!accountId) {
      setError("No se pudo identificar la cuenta");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const result = await updatePortalConfigurationAction(accountId, data);

        if (result.success) {
          toast.success("Configuración guardada correctamente");
          setHasUnsavedChanges(false);
        } else {
          setError(result.error ?? "Error al guardar la configuración");
        }
      } catch (error) {
        console.error("Error updating portal configuration:", error);
        setError("Error inesperado al guardar la configuración");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!accountId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error al cargar la configuración</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative flex h-auto flex-col overflow-hidden rounded-2xl bg-white shadow-sm lg:h-[600px] lg:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full border-b border-r-0 border-gray-100 bg-gray-50/50 lg:min-h-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Configuración de Portales
          </h3>
        </div>

        <div className="flex gap-2 space-y-1 overflow-x-auto px-2 pb-2 lg:block lg:gap-0 lg:space-y-1 lg:overflow-x-visible lg:pb-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full min-w-fit items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-all lg:min-w-0",
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:bg-white/60 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-4 w-4", item.color)} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="hidden text-xs text-gray-500 lg:block">
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight className="hidden h-4 w-4 text-gray-400 lg:block" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Save Button - Small at bottom right of main content - Desktop only */}
      <div className="absolute bottom-4 right-4 z-10 hidden lg:block">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isPending || !hasUnsavedChanges}
          size="sm"
          className="min-w-[100px] shadow-lg"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : hasUnsavedChanges ? (
            "Guardar"
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Guardado
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 overflow-y-auto">
        <Form {...form}>
          <form className="p-4 pb-16 lg:p-8 lg:pb-8">
            {/* Fotocasa Section */}
            {activeSection === "fotocasa" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Globe className="h-5 w-5 text-orange-500" />
                    Fotocasa
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configura la integración con el portal Fotocasa
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fotocasa.enabled"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">
                              Activar Portal
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Activar la publicación automática en Fotocasa
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("fotocasa.enabled") && (
                    <FormField
                      control={form.control}
                      name="fotocasa.apiKey"
                      render={({ field }) => (
                        <FormItem className="rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200">
                          <FormLabel className="flex items-center gap-2 text-base font-medium">
                            <Key className="h-4 w-4 text-gray-500" />
                            API Key
                          </FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Introduce tu clave API de Fotocasa para conectar tu
                            cuenta
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••••••••••"
                              className="font-mono"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("fotocasa.enabled") && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-600">
                        Conecta tu cuenta de Fotocasa para empezar a publicar
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!form.watch("fotocasa.apiKey")}
                        onClick={() => {
                          // TODO: Implement activation logic
                          toast.success(
                            "Cuenta de Fotocasa activada correctamente",
                          );
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Activar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Idealista Section */}
            {activeSection === "idealista" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Globe className="h-5 w-5 text-green-500" />
                    Idealista
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configura la integración con el portal Idealista
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="idealista.enabled"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <FormLabel className="text-base font-medium">
                              Activar Portal
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Activar la publicación automática en Idealista
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("idealista.enabled") && (
                    <FormField
                      control={form.control}
                      name="idealista.apiKey"
                      render={({ field }) => (
                        <FormItem className="rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200">
                          <FormLabel className="flex items-center gap-2 text-base font-medium">
                            <Key className="h-4 w-4 text-gray-500" />
                            API Key
                          </FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Introduce tu clave API de Idealista para conectar tu
                            cuenta
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••••••••••"
                              className="font-mono"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("idealista.enabled") && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div className="text-sm text-gray-600">
                        Conecta tu cuenta de Idealista para empezar a publicar
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!form.watch("idealista.apiKey")}
                        onClick={() => {
                          // TODO: Implement activation logic
                          toast.success(
                            "Cuenta de Idealista activada correctamente",
                          );
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Activar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Section */}
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Configuración General
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Ajustes que aplican a todos los portales
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="general.watermarkEnabled"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border border-gray-100 p-6 transition-colors hover:border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <FormLabel className="flex items-center gap-2 text-base font-medium">
                              <Droplet className="h-4 w-4 text-blue-500" />
                              Marca de agua
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Añade tu logo como marca de agua en todas las
                              imágenes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Save Button for Mobile - at bottom of form */}
            <div className="mt-8 flex justify-end lg:hidden">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isPending || !hasUnsavedChanges}
                size="sm"
                className="min-w-[100px]"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : hasUnsavedChanges ? (
                  "Guardar"
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Guardado
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
