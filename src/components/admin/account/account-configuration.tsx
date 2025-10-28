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
  FormMessage,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Building,
  Phone,
  Shield,
  Settings,
  Loader2,
  Check,
  ChevronRight,
  RefreshCw,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAccountDetailsAction,
  updateAccountConfigurationAction,
  getCurrentUserAccountId,
} from "~/app/actions/account-settings";
import {
  accountConfigurationSchema,
  type AccountConfigurationInput,
} from "~/types/account-settings";

interface AccountTab {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: AccountTab[] = [
  {
    id: "basic",
    label: "Información Básica",
    description: "Nombre y datos principales",
    icon: Building,
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Dirección, teléfono y email",
    icon: Phone,
  },
  {
    id: "legal",
    label: "Información Legal",
    description: "Datos legales y fiscales",
    icon: Shield,
  },
  {
    id: "preferences",
    label: "Preferencias",
    description: "Configuraciones adicionales",
    icon: Settings,
  },
];

export function AccountConfiguration() {
  const { data: session } = useSession();
  const [accountId, setAccountId] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [showLogoInput, setShowLogoInput] = useState(false);

  const form = useForm<AccountConfigurationInput>({
    resolver: zodResolver(accountConfigurationSchema),
    defaultValues: {
      name: "",
      shortName: "",
      legalName: "",
      logo: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxId: "",
      collegiateNumber: "",
      registryDetails: "",
      legalEmail: "",
      jurisdiction: "",
      privacyEmail: "",
      dpoEmail: "",
      preferences: {},
      terms: {
        commission: 0,
        min_commission: 0,
        duration: 12,
        exclusivity: false,
        communications: false,
      },
    },
  });

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const userAccountId = await getCurrentUserAccountId(session.user.id);

        if (!userAccountId) {
          setError("No se pudo obtener el ID de la cuenta");
          return;
        }

        setAccountId(userAccountId);
        const result = await getAccountDetailsAction(userAccountId);

        if (result.success && result.data) {
          const data = result.data;
          form.reset({
            name: data.name,
            shortName: data.shortName ?? "",
            legalName: data.legalName ?? "",
            logo: data.logo ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
            taxId: data.taxId ?? "",
            collegiateNumber: data.collegiateNumber ?? "",
            registryDetails: data.registryDetails ?? "",
            legalEmail: data.legalEmail ?? "",
            jurisdiction: data.jurisdiction ?? "",
            privacyEmail: data.privacyEmail ?? "",
            dpoEmail: data.dpoEmail ?? "",
            preferences: data.preferences ?? {},
            terms: data.terms ?? {
              commission: 0,
              min_commission: 0,
              duration: 12,
              exclusivity: false,
              communications: false,
            },
          });
        }
      } catch (error) {
        console.error("Error loading account configuration:", error);
        setError("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [session, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!isPending) {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isPending]);

  // Reset input visibility when changing sections
  useEffect(() => {
    setShowLogoInput(false);
  }, [activeSection]);

  const onSubmit = () => {
    const formData = form.getValues();

    if (!accountId) {
      setError("No se pudo identificar la cuenta");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);

        const result = await updateAccountConfigurationAction(
          accountId,
          formData,
        );

        if (result.success) {
          toast.success("Configuración guardada correctamente");
          setHasUnsavedChanges(false);
        } else {
          setError(result.error ?? "Error al guardar la configuración");
          toast.error(result.error ?? "Error al guardar la configuración");
        }
      } catch (error) {
        console.error("Error during save:", error);
        setError("Error inesperado al guardar la configuración");
        toast.error("Error inesperado al guardar la configuración");
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
            Configuración de la Cuenta
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
                <Icon className="h-4 w-4 text-gray-500" />
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

      {/* Save Button */}
      <div className="absolute bottom-4 right-4 z-10 hidden lg:block">
        <Button
          onClick={onSubmit}
          disabled={isPending || !hasUnsavedChanges}
          size="sm"
          className="min-w-[120px] bg-primary text-white shadow-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : hasUnsavedChanges ? (
            "Guardar Cambios"
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
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information Section */}
            {activeSection === "basic" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Building className="h-5 w-5 text-gray-500" />
                    Información Básica
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Información principal de tu cuenta
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa *</FormLabel>
                        <FormDescription>
                          Nombre principal que se mostrará en el sistema
                        </FormDescription>
                        <FormControl>
                          <Input {...field} placeholder="Mi Inmobiliaria" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Corto</FormLabel>
                        <FormDescription>
                          Versión abreviada del nombre para espacios reducidos
                        </FormDescription>
                        <FormControl>
                          <Input {...field} placeholder="MI" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Logo</FormLabel>
                    <FormDescription className="mb-3">
                      Logo de tu empresa que aparecerá en el sistema
                    </FormDescription>
                    {form.watch("logo") && !showLogoInput ? (
                      <div className="group relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.watch("logo")}
                          alt="Logo preview"
                          className="max-h-24 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                        <p className="hidden text-sm text-red-500">
                          Error al cargar la imagen
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowLogoInput(true)}
                          className="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        >
                          <RefreshCw className="h-6 w-6 text-white" />
                        </button>
                      </div>
                    ) : !form.watch("logo") && !showLogoInput ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogoInput(true)}
                      >
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image className="mr-2 h-4 w-4" />
                        Configurar logo
                      </Button>
                    ) : (
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://ejemplo.com/logo.png"
                              />
                            </FormControl>
                            <FormMessage />
                            {showLogoInput && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowLogoInput(false)}
                                className="mt-2"
                              >
                                Cancelar
                              </Button>
                            )}
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Section */}
            {activeSection === "contact" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Phone className="h-5 w-5 text-gray-500" />
                    Información de Contacto
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Datos de contacto de tu empresa
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Calle Principal 123, Ciudad, Provincia, Código Postal"
                            rows={3}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+34 123 456 789" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="info@miempresa.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://www.miempresa.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Legal Information Section */}
            {activeSection === "legal" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Shield className="h-5 w-5 text-gray-500" />
                    Información Legal
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Datos legales y fiscales de tu empresa
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Mi Inmobiliaria S.L."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CIF/NIF</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="B12345678" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collegiateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Colegiado</FormLabel>
                        <FormDescription>
                          Número de colegiado API (Agente de la Propiedad
                          Inmobiliaria)
                        </FormDescription>
                        <FormControl>
                          <Input {...field} placeholder="API-12345" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jurisdicción</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="España" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registryDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datos Registrales</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Inscrita en el Registro Mercantil de..."
                            rows={3}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="legalEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Legal</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="legal@miempresa.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Privacidad</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="privacidad@miempresa.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dpoEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email DPO</FormLabel>
                        <FormDescription>
                          Delegado de Protección de Datos
                        </FormDescription>
                        <FormControl>
                          <Input {...field} placeholder="dpo@miempresa.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Preferencias
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configuraciones adicionales del sistema
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                      Términos por Defecto
                    </h3>
                    <p className="mb-6 text-sm text-gray-600">
                      Configuración de términos y condiciones para contratos
                    </p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="terms.commission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comisión (%)</FormLabel>
                              <FormDescription>
                                Porcentaje de comisión por defecto
                              </FormDescription>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) ?? 0,
                                    )
                                  }
                                  value={field.value ?? 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="terms.min_commission"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comisión Mínima (€)</FormLabel>
                              <FormDescription>
                                Cantidad mínima de comisión
                              </FormDescription>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) ?? 0,
                                    )
                                  }
                                  value={field.value ?? 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="terms.duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duración (meses)</FormLabel>
                            <FormDescription>
                              Duración por defecto del contrato en meses
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) ?? 12)
                                }
                                value={field.value ?? 12}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="terms.exclusivity"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Exclusividad
                                </FormLabel>
                                <FormDescription>
                                  Contrato de exclusividad por defecto
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
                          name="terms.communications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Comunicaciones
                                </FormLabel>
                                <FormDescription>
                                  Permitir comunicaciones comerciales por
                                  defecto
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
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
