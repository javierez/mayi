"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useSession } from "~/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
  Info,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAccountDetailsAction,
  updateAccountConfigurationAction,
  getCurrentUserAccountId,
  getAgentsForAccountAction,
  uploadAccountSignatureAction,
  updateSignatureSettingsAction,
} from "~/app/actions/account-settings";
import {
  accountConfigurationSchema,
  type AccountConfigurationInput,
} from "~/types/account-settings";
import { SignaturePad } from "~/components/visits/signature-pad";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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
    label: "Condiciones de Servicio",
    description: "Configuraciones adicionales",
    icon: Settings,
  },
  {
    id: "signature",
    label: "Firma",
    description: "Tipo de cuenta y firma",
    icon: PenTool,
  },
];

interface Agent {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
}

export function AccountConfiguration() {
  const { data: session } = useSession();
  const [accountId, setAccountId] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [showLogoInput, setShowLogoInput] = useState(false);
  const [visibleDescriptions, setVisibleDescriptions] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const toggleDescription = useCallback((fieldName: string) => {
    setVisibleDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  }, []);

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
      accountType: "company",
      defaultSigningAgentId: "",
      signatureUrl: "",
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

        // Load account details and agents in parallel
        const [accountResult, agentsResult] = await Promise.all([
          getAccountDetailsAction(userAccountId),
          getAgentsForAccountAction(userAccountId),
        ]);

        if (accountResult.success && accountResult.data) {
          const data = accountResult.data;
          form.reset({
            name: data.name,
            shortName: data.shortName ?? "",
            legalName: data.legalName ?? "",
            logo: data.logo ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
            accountType: (data.accountType as "company" | "person") ?? "company",
            defaultSigningAgentId: data.defaultSigningAgentId ?? "",
            signatureUrl: data.signatureUrl ?? "",
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
          setCurrentSignatureUrl(data.signatureUrl ?? null);
        }

        if (agentsResult.success && agentsResult.data) {
          setAgents(agentsResult.data);
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

  // Handle signature upload
  const handleSignatureChange = async (signatureDataUrl: string | null) => {
    if (!signatureDataUrl || !accountId) return;

    setIsUploadingSignature(true);
    try {
      const result = await uploadAccountSignatureAction(accountId, signatureDataUrl);
      if (result.success && result.signatureUrl) {
        setCurrentSignatureUrl(result.signatureUrl);
        form.setValue("signatureUrl", result.signatureUrl);
        setShowSignaturePad(false);
        toast.success("Firma guardada correctamente");
      } else {
        toast.error(result.error ?? "Error al guardar la firma");
      }
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error("Error al subir la firma");
    } finally {
      setIsUploadingSignature(false);
    }
  };

  // Handle account type change - saves immediately
  const handleAccountTypeChange = async (newType: "company" | "person") => {
    if (!accountId) return;

    form.setValue("accountType", newType);

    try {
      const result = await updateSignatureSettingsAction(accountId, { accountType: newType });
      if (!result.success) {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving account type:", error);
    }
  };

  // Handle agent selection change - saves immediately
  const handleAgentChange = async (agentId: string) => {
    if (!accountId) return;

    form.setValue("defaultSigningAgentId", agentId);

    try {
      const result = await updateSignatureSettingsAction(accountId, { defaultSigningAgentId: agentId });
      if (result.success) {
        toast.success("Agente guardado");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving agent:", error);
    }
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
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Building className="h-4 w-4 text-gray-500" />
                    Información Básica
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Información principal de tu cuenta
                  </p>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel>Nombre de la Empresa *</FormLabel>
                          <button
                            type="button"
                            onClick={() => toggleDescription("name")}
                            className="focus:outline-none"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                          </button>
                        </div>
                        {visibleDescriptions.has("name") && (
                          <FormDescription className="text-xs">
                            Nombre principal que se mostrará en el sistema
                          </FormDescription>
                        )}
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Nombre Corto</FormLabel>
                          <button
                            type="button"
                            onClick={() => toggleDescription("shortName")}
                            className="focus:outline-none"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                          </button>
                        </div>
                        {visibleDescriptions.has("shortName") && (
                          <FormDescription className="text-xs">
                            Versión abreviada del nombre para espacios reducidos
                          </FormDescription>
                        )}
                        <FormControl>
                          <Input {...field} placeholder="MI" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <div className="flex items-center gap-1">
                      <FormLabel>Logo</FormLabel>
                      <button
                        type="button"
                        onClick={() => toggleDescription("logo")}
                        className="focus:outline-none"
                      >
                        <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                      </button>
                    </div>
                    {visibleDescriptions.has("logo") && (
                      <FormDescription className="mb-3 text-xs">
                        Logo de tu empresa que aparecerá en el sistema
                      </FormDescription>
                    )}
                    {form.watch("logo") && !showLogoInput ? (
                      <div className="group relative mt-3 inline-block">
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
                        className="mt-3"
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
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Información de Contacto
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
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
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Shield className="h-4 w-4 text-gray-500" />
                    Información Legal
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Número de Colegiado</FormLabel>
                          <button
                            type="button"
                            onClick={() => toggleDescription("collegiateNumber")}
                            className="focus:outline-none"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                          </button>
                        </div>
                        {visibleDescriptions.has("collegiateNumber") && (
                          <FormDescription className="text-xs">
                            Número de colegiado API (Agente de la Propiedad Inmobiliaria)
                          </FormDescription>
                        )}
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
                        <div className="flex items-center gap-1">
                          <FormLabel>Email DPO</FormLabel>
                          <button
                            type="button"
                            onClick={() => toggleDescription("dpoEmail")}
                            className="focus:outline-none"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                          </button>
                        </div>
                        {visibleDescriptions.has("dpoEmail") && (
                          <FormDescription className="text-xs">
                            Delegado de Protección de Datos
                          </FormDescription>
                        )}
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
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Settings className="h-4 w-4 text-gray-500" />
                    Preferencias
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Configuraciones adicionales del sistema
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-200 p-6">
                    <h3 className="mb-4 text-base font-medium text-gray-900">
                      Términos por Defecto
                    </h3>
                    <p className="mb-6 text-xs text-gray-600">
                      Configuración de términos y condiciones para contratos
                    </p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="terms.commission"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-1">
                                <FormLabel>Comisión (%)</FormLabel>
                                <button
                                  type="button"
                                  onClick={() => toggleDescription("terms.commission")}
                                  className="focus:outline-none"
                                >
                                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                                </button>
                              </div>
                              {visibleDescriptions.has("terms.commission") && (
                                <FormDescription className="text-xs">
                                  Porcentaje de comisión por defecto
                                </FormDescription>
                              )}
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
                              <div className="flex items-center gap-1">
                                <FormLabel>Comisión Mínima (€)</FormLabel>
                                <button
                                  type="button"
                                  onClick={() => toggleDescription("terms.min_commission")}
                                  className="focus:outline-none"
                                >
                                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                                </button>
                              </div>
                              {visibleDescriptions.has("terms.min_commission") && (
                                <FormDescription className="text-xs">
                                  Cantidad mínima de comisión
                                </FormDescription>
                              )}
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
                            <div className="flex items-center gap-1">
                              <FormLabel>Duración (meses)</FormLabel>
                              <button
                                type="button"
                                onClick={() => toggleDescription("terms.duration")}
                                className="focus:outline-none"
                              >
                                <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                              </button>
                            </div>
                            {visibleDescriptions.has("terms.duration") && (
                              <FormDescription className="text-xs">
                                Duración por defecto del contrato en meses
                              </FormDescription>
                            )}
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
                            <FormItem className="rounded-lg p-4 shadow-md">
                              <div className="flex items-center gap-1.5 mb-2">
                                <FormLabel className="text-base">
                                  Tipo de contrato
                                </FormLabel>
                                <button
                                  type="button"
                                  onClick={() => toggleDescription("terms.exclusivity")}
                                  className="focus:outline-none"
                                >
                                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                                </button>
                              </div>
                              {visibleDescriptions.has("terms.exclusivity") && (
                                <FormDescription className="text-xs mb-2">
                                  Contrato de exclusividad por defecto
                                </FormDescription>
                              )}
                              <FormControl>
                                <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                                  <motion.div
                                    className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                                    animate={{
                                      width: "calc(50% - 4px)",
                                      x: field.value ? "100%" : "0%",
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                  <div className="relative flex h-full">
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(false)}
                                      className={cn(
                                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                        !field.value ? "text-gray-900" : "text-gray-600",
                                      )}
                                    >
                                      Normal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(true)}
                                      className={cn(
                                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                        field.value ? "text-gray-900" : "text-gray-600",
                                      )}
                                    >
                                      Exclusividad
                                    </button>
                                  </div>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="terms.communications"
                          render={({ field }) => (
                            <FormItem className="rounded-lg p-4 shadow-md">
                              <div className="flex items-center gap-1.5 mb-2">
                                <FormLabel className="text-base">
                                  Comunicaciones comerciales
                                </FormLabel>
                                <button
                                  type="button"
                                  onClick={() => toggleDescription("terms.communications")}
                                  className="focus:outline-none"
                                >
                                  <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                                </button>
                              </div>
                              {visibleDescriptions.has("terms.communications") && (
                                <FormDescription className="text-xs mb-2">
                                  Permitir comunicaciones comerciales por defecto
                                </FormDescription>
                              )}
                              <FormControl>
                                <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                                  <motion.div
                                    className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                                    animate={{
                                      width: "calc(50% - 4px)",
                                      x: field.value ? "0%" : "100%",
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  />
                                  <div className="relative flex h-full">
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(true)}
                                      className={cn(
                                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                        field.value ? "text-gray-900" : "text-gray-600",
                                      )}
                                    >
                                      Sí
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(false)}
                                      className={cn(
                                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                        !field.value ? "text-gray-900" : "text-gray-600",
                                      )}
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
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

            {/* Signature Section */}
            {activeSection === "signature" && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <PenTool className="h-4 w-4 text-gray-500" />
                    Configuración de Firma
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Tipo de cuenta y firma para documentos
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Account Type Toggle */}
                  <div className="rounded-lg border border-gray-200 p-6">
                    <h3 className="mb-4 text-base font-medium text-gray-900">
                      Tipo de Cuenta
                    </h3>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          ¿Cómo opera tu cuenta?
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDescription("accountType")}
                          className="focus:outline-none"
                        >
                          <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                        </button>
                      </div>
                      {visibleDescriptions.has("accountType") && (
                        <p className="text-xs text-gray-500 mb-2">
                          Empresa: se mostrará el nombre de la empresa en documentos.
                          Persona Física: se mostrará tu nombre personal.
                        </p>
                      )}
                      <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                        <motion.div
                          className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                          animate={{
                            width: "calc(50% - 4px)",
                            x: form.watch("accountType") === "person" ? "100%" : "0%",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <div className="relative flex h-full">
                          <button
                            type="button"
                            onClick={() => handleAccountTypeChange("company")}
                            className={cn(
                              "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                              form.watch("accountType") === "company" ? "text-gray-900" : "text-gray-600",
                            )}
                          >
                            Empresa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccountTypeChange("person")}
                            className={cn(
                              "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                              form.watch("accountType") === "person" ? "text-gray-900" : "text-gray-600",
                            )}
                          >
                            Persona Física
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Default Signing Agent - only for Persona Física */}
                  {form.watch("accountType") === "person" && (
                    <div className="rounded-lg border border-gray-200 p-6">
                      <h3 className="mb-4 text-base font-medium text-gray-900">
                        Agente Firmante
                      </h3>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm font-medium">Agente por defecto</span>
                          <button
                            type="button"
                            onClick={() => toggleDescription("defaultSigningAgentId")}
                            className="focus:outline-none"
                          >
                            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                          </button>
                        </div>
                        {visibleDescriptions.has("defaultSigningAgentId") && (
                          <p className="text-xs text-gray-500 mb-2">
                            Este agente será el firmante por defecto en los documentos
                          </p>
                        )}
                        <Select
                          value={form.watch("defaultSigningAgentId") ?? ""}
                          onValueChange={handleAgentChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar agente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {agents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Signature Pad */}
                  <div className="rounded-lg border border-gray-200 p-6">
                    <h3 className="mb-4 text-base font-medium text-gray-900">
                      Firma Digital
                    </h3>
                    <p className="mb-4 text-sm text-gray-500">
                      Esta firma se usará como predeterminada en los documentos generados.
                    </p>

                    {currentSignatureUrl && !showSignaturePad ? (
                      <div className="group relative inline-block">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentSignatureUrl}
                            alt="Firma actual"
                            className="max-h-24 object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSignaturePad(true)}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        >
                          <RefreshCw className="h-6 w-6 text-white" />
                          <span className="ml-2 text-sm text-white">Actualizar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        {isUploadingSignature && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                            <span className="ml-2 text-sm text-gray-500">Guardando firma...</span>
                          </div>
                        )}
                        <SignaturePad
                          label="Dibujar firma"
                          onSignatureChange={handleSignatureChange}
                          required={false}
                        />
                        {currentSignatureUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSignaturePad(false)}
                            className="mt-2"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    )}
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
