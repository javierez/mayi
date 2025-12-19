"use client";

import { useState, useEffect, useTransition } from "react";
import { useSession } from "~/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import Image from "next/image";
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

const navigationItems: (PortalTab & { color?: string; logo?: string })[] = [
  {
    id: "fotocasa",
    label: "Fotocasa",
    description: "Activar portal",
    icon: Globe,
    color: "text-orange-500",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
  },
  {
    id: "idealista",
    label: "Idealista",
    description: "Activar portal",
    icon: Globe,
    color: "text-green-500",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
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
      fotocasa: { enabled: false, apiKey: "", publisherId: "" },
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
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex min-w-fit items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-gray-900 shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {item.logo ? (
                <div className="relative h-5 w-16">
                  <Image
                    src={item.logo}
                    alt={item.label}
                    fill
                    className="object-contain object-left"
                  />
                </div>
              ) : (
                <Icon className={cn("h-4 w-4", item.color)} />
              )}
              {!item.logo && item.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <Form {...form}>
        <form className="space-y-6">
            {/* Fotocasa Section */}
            {activeSection === "fotocasa" && (
              <div className="space-y-6">
                {/* Header Card with Logo */}
                <div className="rounded-2xl bg-white p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="relative h-16 w-40 flex-shrink-0">
                      <Image
                        src="https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png"
                        alt="Fotocasa"
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="fotocasa.enabled"
                      render={({ field }) => (
                        <FormItem>
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
                </div>

                {/* API Key & Publisher ID Cards */}
                {form.watch("fotocasa.enabled") && (
                  <div className="space-y-4">
                    {/* API Key Card */}
                    <div className="rounded-2xl bg-white p-6 shadow-md">
                      <FormField
                        control={form.control}
                        name="fotocasa.apiKey"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Key className="h-4 w-4 text-gray-500" />
                              API Key
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Introduce tu clave API de Fotocasa para publicar propiedades
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="text"
                                placeholder="Introduce tu API Key de Fotocasa"
                                className="h-10 font-mono"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Publisher ID Card */}
                    <div className="rounded-2xl bg-white p-6 shadow-md">
                      <FormField
                        control={form.control}
                        name="fotocasa.publisherId"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Globe className="h-4 w-4 text-gray-500" />
                              Publisher ID
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Tu identificador de publisher para recibir leads de Fotocasa
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="text"
                                placeholder="ej: 25f21de9-87f3-4c6f-9f55-742dc8e85551"
                                className="h-10 font-mono"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Info Card */}
                    <div className="rounded-2xl bg-blue-50 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <ExternalLink className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-blue-900">
                            ¿No tienes estos datos? Solicítalos desde tu cuenta de Fotocasa
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Idealista Section */}
            {activeSection === "idealista" && (
              <div className="space-y-6">
                {/* Header Card with Logo */}
                <div className="rounded-2xl bg-white p-6 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="relative h-16 w-40 flex-shrink-0">
                      <Image
                        src="https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png"
                        alt="Idealista"
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="idealista.enabled"
                      render={({ field }) => (
                        <FormItem>
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
                </div>

                {/* API Key Card */}
                {form.watch("idealista.enabled") && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white p-6 shadow-md">
                      <FormField
                        control={form.control}
                        name="idealista.apiKey"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Key className="h-4 w-4 text-gray-500" />
                              API Key
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Introduce tu clave API de Idealista para conectar tu cuenta
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="text"
                                placeholder="Introduce tu API Key de Idealista"
                                className="h-10 font-mono"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Info Card */}
                    <div className="rounded-2xl bg-blue-50 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <ExternalLink className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-blue-900">
                            ¿No tienes una API Key? Solicítala desde tu cuenta de Idealista
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Section */}
            {activeSection === "general" && (
              <div className="space-y-6">
                {/* Watermark Card */}
                <div className="rounded-2xl bg-white p-6 shadow-md">
                  <FormField
                    control={form.control}
                    name="general.watermarkEnabled"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Droplet className="h-4 w-4 text-blue-500" />
                              Marca de agua
                            </FormLabel>
                            <FormDescription className="text-sm text-gray-500">
                              Añade tu logo como marca de agua en todas las imágenes publicadas
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
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending || !hasUnsavedChanges}
              className="min-w-[120px] shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : hasUnsavedChanges ? (
                "Guardar cambios"
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
  );
}
