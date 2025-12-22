"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { SignaturePad } from "~/components/visits/signature-pad";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { ShareHojaEncargoModal } from "./share-hoja-encargo-modal";
import { toast } from "sonner";
import {
  createHojaEncargoAction,
  updateOwnerContactFromHojaEncargoAction,
} from "~/server/actions/hoja-encargo";
import {
  ConfirmChangesModal,
  type FieldChange,
} from "~/components/arras/confirm-changes-modal";
import { Loader, Eye, Download, Share2, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { HojaEncargoPageData } from "~/types/hoja-encargo";
import {
  AddressAutocomplete,
  type LocationData,
} from "~/components/propiedades/form/address-autocomplete";

interface ValidationErrors {
  ownerName?: string;
  ownerNif?: string;
  ownerAddress?: string;
  commissionPercentage?: string;
  minimumCommission?: string;
  durationMonths?: string;
  signingLocation?: string;
}

interface HojaEncargoFormProps {
  data: HojaEncargoPageData;
}

export function HojaEncargoForm({ data }: HojaEncargoFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Owner form state
  const [ownerName, setOwnerName] = useState(
    data.owner
      ? `${data.owner.firstName ?? ""} ${data.owner.lastName ?? ""}`.trim()
      : "",
  );
  const [ownerNif, setOwnerNif] = useState(data.owner?.nif ?? "");
  const [ownerAddress, setOwnerAddress] = useState(data.owner?.address ?? "");
  const [ownerCity, setOwnerCity] = useState("");
  const [ownerPostalCode, setOwnerPostalCode] = useState("");
  const [ownerPhone, setOwnerPhone] = useState(data.owner?.phone ?? "");
  const [ownerEmail, setOwnerEmail] = useState(data.owner?.email ?? "");

  // Terms state (with defaults from account)
  const [commissionPercentage, setCommissionPercentage] = useState(
    data.terms?.commission ?? 3,
  );
  const [minimumCommission, setMinimumCommission] = useState(
    data.terms?.minCommission ?? 1500,
  );
  const [durationMonths, setDurationMonths] = useState(
    data.terms?.duration ?? 12,
  );
  const [exclusivity, setExclusivity] = useState(
    data.terms?.exclusivity ?? false,
  );

  // Authorizations
  const [allowSignage, setAllowSignage] = useState(
    data.terms?.allowSignage ?? true,
  );
  const [allowVisits, setAllowVisits] = useState(
    data.terms?.allowVisits ?? true,
  );
  const [gdprConsent, setGdprConsent] = useState(
    data.terms?.communications ?? false,
  );

  // Timeline
  const [signingDate] = useState(new Date());
  const [signingLocation, setSigningLocation] = useState(
    data.property.city ?? "",
  );

  // Signatures (optional)
  const [ownerSignature, setOwnerSignature] = useState<string | null>(null);
  const [agentSignature, setAgentSignature] = useState<string | null>(null);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDocumentUrl, setShareDocumentUrl] = useState<string | null>(null);

  // Confirm changes modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<FieldChange[]>([]);

  // Track original values for change detection
  const originalValues = useMemo(
    () => ({
      owner: data.owner
        ? {
            contactId: data.owner.contactId,
            nif: data.owner.nif ?? "",
            address: data.owner.address ?? "",
            phone: data.owner.phone ?? "",
            email: data.owner.email ?? "",
          }
        : null,
    }),
    [data],
  );

  // Detect changes: newlyFilled vs modified
  const detectChanges = useMemo(() => {
    const newlyFilled: FieldChange[] = [];
    const modified: FieldChange[] = [];

    if (!originalValues.owner) return { newlyFilled, modified };

    const checkField = (
      field: "nif" | "address" | "phone" | "email",
      label: string,
      original: string,
      current: string,
    ) => {
      const trimmedOriginal = original.trim();
      const trimmedCurrent = current.trim();

      if (!trimmedOriginal && trimmedCurrent) {
        newlyFilled.push({
          field,
          label,
          originalValue: trimmedOriginal,
          newValue: trimmedCurrent,
          contactType: "seller", // Using seller type for owner
          contactId: originalValues.owner!.contactId,
        });
      } else if (trimmedOriginal && trimmedCurrent !== trimmedOriginal) {
        modified.push({
          field,
          label,
          originalValue: trimmedOriginal,
          newValue: trimmedCurrent,
          contactType: "seller",
          contactId: originalValues.owner!.contactId,
        });
      }
    };

    checkField("nif", "NIF Propietario", originalValues.owner.nif, ownerNif);
    checkField("address", "Dirección Propietario", originalValues.owner.address, ownerAddress);
    checkField("phone", "Teléfono Propietario", originalValues.owner.phone, ownerPhone);
    checkField("email", "Email Propietario", originalValues.owner.email, ownerEmail);

    return { newlyFilled, modified };
  }, [originalValues, ownerNif, ownerAddress, ownerPhone, ownerEmail]);

  // Validation
  const validationErrors = useMemo((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!ownerName.trim()) errors.ownerName = "Nombre del propietario requerido";
    if (!ownerNif.trim()) errors.ownerNif = "NIF del propietario requerido";
    if (!ownerAddress.trim()) errors.ownerAddress = "Dirección del propietario requerida";
    if (commissionPercentage <= 0) errors.commissionPercentage = "Comisión debe ser mayor a 0";
    if (minimumCommission < 0) errors.minimumCommission = "Comisión mínima inválida";
    if (durationMonths <= 0) errors.durationMonths = "Duración debe ser mayor a 0";
    if (!signingLocation.trim()) errors.signingLocation = "Lugar de firma requerido";

    return errors;
  }, [ownerName, ownerNif, ownerAddress, commissionPercentage, minimumCommission, durationMonths, signingLocation]);

  const isFormValid = Object.keys(validationErrors).length === 0;
  const errorCount = Object.keys(validationErrors).length;

  // Handle back navigation
  const handleBack = () => {
    router.push(`/propiedades/${data.listing.listingId}/documentacion-inicial`);
  };

  // Handle Google Places autocomplete selection for owner address
  const handleOwnerAddressSelected = (locationData: LocationData) => {
    // Build the full address with street + number
    const streetWithNumber =
      locationData.addressComponents.streetNumber &&
      locationData.addressComponents.route
        ? `${locationData.addressComponents.route} ${locationData.addressComponents.streetNumber}`
        : locationData.addressComponents.route ?? locationData.address;

    setOwnerAddress(streetWithNumber);

    // Auto-fill city and postal code if available
    if (locationData.addressComponents.locality) {
      setOwnerCity(locationData.addressComponents.locality);
    }
    if (locationData.addressComponents.postalCode) {
      setOwnerPostalCode(locationData.addressComponents.postalCode);
    }
  };

  // Generate PDF for download (without saving to S3)
  const handleGeneratePdf = async () => {
    if (!isFormValid) {
      const errorMessages = Object.values(validationErrors).join(", ");
      toast.error(`Faltan campos obligatorios: ${errorMessages}`);
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const response = await fetch("/api/nota-encargo/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: data.listing.listingId.toString(),
          formData: getFormData(),
          saveToS3: false,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Hoja-Encargo-${data.listing.listingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF descargado correctamente");
      } else {
        toast.error("Error al generar el PDF");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Get form data object
  const getFormData = () => ({
    listingId: data.listing.listingId,
    ownerContactId: data.owner?.contactId ?? BigInt(0),
    ownerName,
    ownerNif,
    ownerAddress,
    ownerCity,
    ownerPostalCode,
    ownerPhone,
    ownerEmail,
    commissionPercentage,
    minimumCommission,
    durationMonths,
    exclusivity,
    allowSignage,
    allowVisits,
    gdprConsent,
    ownerSignature: ownerSignature ?? undefined,
    agentSignature: agentSignature ?? undefined,
    signingDate,
    signingLocation,
  });

  // Save contact changes and submit
  const saveContactChangesAndSubmit = async (changesToSave: FieldChange[]) => {
    setIsLoading(true);

    try {
      // Update owner contact if there are changes
      if (changesToSave.length > 0 && originalValues.owner) {
        const fields: Partial<{ nif: string; address: string; phone: string; email: string }> = {};
        for (const change of changesToSave) {
          fields[change.field] = change.newValue;
        }

        const updateResult = await updateOwnerContactFromHojaEncargoAction({
          contactId: originalValues.owner.contactId.toString(),
          fields,
        });

        if (updateResult.success) {
          toast.success("Datos del propietario actualizados");
        }
      }

      // Create hoja encargo (upload signatures if provided)
      if (ownerSignature ?? agentSignature) {
        await createHojaEncargoAction(getFormData());
      }

      // Generate PDF and save to S3
      const response = await fetch("/api/nota-encargo/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: data.listing.listingId.toString(),
          formData: getFormData(),
          saveToS3: true,
        }),
      });

      if (response.ok) {
        const pdfData = (await response.json()) as {
          success: boolean;
          documentUrl: string;
        };

        if (pdfData.success && pdfData.documentUrl) {
          setShareDocumentUrl(pdfData.documentUrl);
          setShareModalOpen(true);
          toast.success("Hoja de encargo generada correctamente");
        } else {
          toast.info("Documento guardado. Redirigiendo...");
          router.push(`/propiedades/${data.listing.listingId}/documentacion-inicial`);
        }
      } else {
        toast.error("Error al generar el documento");
      }
    } catch (error) {
      console.error("Error creating hoja encargo:", error);
      toast.error("Error al crear la hoja de encargo");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm changes from modal
  const handleConfirmChanges = () => {
    setShowConfirmModal(false);
    const allChanges = [...detectChanges.newlyFilled, ...detectChanges.modified];
    void saveContactChangesAndSubmit(allChanges);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      const errorMessages = Object.values(validationErrors).join(", ");
      toast.error(`Faltan campos obligatorios: ${errorMessages}`);
      return;
    }

    // Check for modified fields (not just newly filled)
    if (detectChanges.modified.length > 0) {
      setPendingChanges(detectChanges.modified);
      setShowConfirmModal(true);
      return;
    }

    // If only newly filled or no changes, proceed directly
    const allChanges = [...detectChanges.newlyFilled];
    void saveContactChangesAndSubmit(allChanges);
  };

  // Build property full address
  const propertyFullAddress = [
    data.property.street,
    data.property.addressDetails,
    data.property.postalCode,
    data.property.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <PropertyBreadcrumb
            propertyType={data.property.propertyType ?? ""}
            street={data.property.street ?? ""}
            referenceNumber={data.property.referenceNumber ?? ""}
            documentFolder={{
              name: "Hoja de Encargo",
              propertyId: data.listing.listingId.toString(),
            }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error summary */}
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errorCount} campo(s) por completar</span>
            </div>
          )}

          {/* Section 1: Agency Info (read-only) */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Agente Inmobiliario
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">Nombre / Razón Social</p>
                <p className="text-sm text-gray-900">
                  {data.agency.accountType === "company"
                    ? data.agency.name
                    : `Dª ${data.agency.agentPersonName ?? data.agency.name}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">NIF/CIF</p>
                <p className="text-sm text-gray-900">{data.agency.taxId ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Número de colegiado</p>
                <p className="text-sm text-gray-900">{data.agency.collegiateNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Teléfono</p>
                <p className="text-sm text-gray-900">{data.agency.phone ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Owner Info (editable) */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Propietario
            </h2>
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <FloatingLabelInput
                id="ownerName"
                value={ownerName}
                onChange={setOwnerName}
                placeholder="Nombre completo"
                required
                className={validationErrors.ownerName ? "border-red-500" : ""}
              />
              <FloatingLabelInput
                id="ownerNif"
                value={ownerNif}
                onChange={setOwnerNif}
                placeholder="NIF/DNI"
                required
                className={validationErrors.ownerNif ? "border-red-500" : ""}
              />
              <div className="sm:col-span-2">
                <label htmlFor="ownerAddress" className="mb-1 block text-xs text-gray-500">
                  Dirección *
                </label>
                <AddressAutocomplete
                  value={ownerAddress}
                  onChange={setOwnerAddress}
                  onLocationSelected={handleOwnerAddressSelected}
                  placeholder="Buscar dirección del propietario..."
                  className={cn(
                    "h-10 border-0 shadow-md",
                    validationErrors.ownerAddress && "ring-1 ring-red-500",
                  )}
                />
              </div>
              <FloatingLabelInput
                id="ownerPhone"
                value={ownerPhone}
                onChange={setOwnerPhone}
                placeholder="Teléfono"
              />
              <FloatingLabelInput
                id="ownerEmail"
                value={ownerEmail}
                onChange={setOwnerEmail}
                placeholder="Email"
                type="email"
              />
            </div>
          </div>

          {/* Section 3: Property Info (read-only) */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Inmueble
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">Dirección</p>
                <p className="text-sm text-gray-900">{propertyFullAddress || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Referencia catastral</p>
                <p className="text-sm text-gray-900">{data.property.cadastralReference ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Superficie</p>
                <p className="text-sm text-gray-900">
                  {data.property.builtSurfaceArea ?? data.property.squareMeters ?? "—"} m²
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tipo de operación</p>
                <p className="text-sm text-gray-900">
                  {data.listing.listingType === "Rent" ? "Alquiler" : "Venta"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio</p>
                <p className="text-sm text-gray-900">
                  {data.listing.price
                    ? `${new Intl.NumberFormat("es-ES").format(Number(data.listing.price))} €`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Terms */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Condiciones del Encargo
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="commissionPercentage" className="mb-1 block text-xs text-gray-500">
                  Comisión (%)
                </label>
                <Input
                  id="commissionPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                  className={`h-10 border-0 shadow-md ${validationErrors.commissionPercentage ? "ring-1 ring-red-500" : ""}`}
                />
              </div>
              <div>
                <label htmlFor="minimumCommission" className="mb-1 block text-xs text-gray-500">
                  Comisión mínima (€)
                </label>
                <Input
                  id="minimumCommission"
                  type="number"
                  min="0"
                  value={minimumCommission}
                  onChange={(e) => setMinimumCommission(parseInt(e.target.value) || 0)}
                  className="h-10 border-0 shadow-md"
                />
              </div>
              <div>
                <label htmlFor="durationMonths" className="mb-1 block text-xs text-gray-500">
                  Duración (meses)
                </label>
                <Input
                  id="durationMonths"
                  type="number"
                  min="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 12)}
                  className={`h-10 border-0 shadow-md ${validationErrors.durationMonths ? "ring-1 ring-red-500" : ""}`}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-500">Tipo de contrato</p>
              <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                <motion.div
                  className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                  animate={{
                    width: "calc(50% - 4px)",
                    x: exclusivity ? "100%" : "0%",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div className="relative flex h-full">
                  <button
                    type="button"
                    onClick={() => setExclusivity(false)}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      !exclusivity ? "text-gray-900" : "text-gray-600",
                    )}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setExclusivity(true)}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      exclusivity ? "text-gray-900" : "text-gray-600",
                    )}
                  >
                    Exclusividad
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Authorizations */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Autorizaciones
            </h2>
            <div className="space-y-4">
              {/* Colocación de cartel */}
              <div>
                <p className="mb-2 text-xs text-gray-500">Colocación de cartel publicitario</p>
                <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                  <motion.div
                    className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                    animate={{
                      width: "calc(50% - 4px)",
                      x: allowSignage ? "0%" : "100%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <div className="relative flex h-full">
                    <button
                      type="button"
                      onClick={() => setAllowSignage(true)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        allowSignage ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowSignage(false)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        !allowSignage ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Visitas */}
              <div>
                <p className="mb-2 text-xs text-gray-500">Autorizar visitas de interesados</p>
                <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                  <motion.div
                    className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                    animate={{
                      width: "calc(50% - 4px)",
                      x: allowVisits ? "0%" : "100%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <div className="relative flex h-full">
                    <button
                      type="button"
                      onClick={() => setAllowVisits(true)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        allowVisits ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowVisits(false)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        !allowVisits ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Comunicaciones comerciales */}
              <div>
                <p className="mb-2 text-xs text-gray-500">Comunicaciones comerciales (RGPD)</p>
                <div className="relative h-10 w-full rounded-lg bg-gray-100 p-1">
                  <motion.div
                    className="absolute left-1 top-1 h-8 rounded-md bg-white shadow-sm"
                    animate={{
                      width: "calc(50% - 4px)",
                      x: gdprConsent ? "0%" : "100%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <div className="relative flex h-full">
                    <button
                      type="button"
                      onClick={() => setGdprConsent(true)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        gdprConsent ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setGdprConsent(false)}
                      className={cn(
                        "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                        !gdprConsent ? "text-gray-900" : "text-gray-600",
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Signing Location */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Lugar de Firma
            </h2>
            <FloatingLabelInput
              id="signingLocation"
              value={signingLocation}
              onChange={setSigningLocation}
              placeholder="Ciudad"
              required
              className={validationErrors.signingLocation ? "border-red-500" : ""}
            />
          </div>

          {/* Section 7: Signatures (optional) */}
          <div className="rounded-lg bg-white p-5 shadow-md">
            <h2 className="mb-4 font-mono text-sm font-medium uppercase tracking-widest text-gray-400">
              Firmas (opcional)
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Las firmas son opcionales. Puede generar el documento sin firmas.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <SignaturePad
                label="Firma del Propietario"
                onSignatureChange={setOwnerSignature}
                required={false}
              />
              <SignaturePad
                label="Firma del Agente"
                onSignatureChange={setAgentSignature}
                required={false}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-4 flex flex-col gap-2 rounded-lg bg-white p-4 shadow-xl sm:flex-row sm:flex-wrap sm:gap-3">
            <div className="flex flex-col gap-3 sm:order-2 sm:ml-auto sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={() => {
                  window.open(
                    `/templates/nota-encargo?listingId=${data.listing.listingId}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                disabled={isGeneratingPdf || isLoading}
              >
                <Eye className="h-4 w-4" />
                <span>Vista Previa</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || isLoading || !isFormValid}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:order-1 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full sm:w-auto sm:min-w-[150px]"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Confirm Changes Modal */}
        <ConfirmChangesModal
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
          changes={pendingChanges}
          onConfirm={handleConfirmChanges}
          isLoading={isLoading}
        />

        {/* Share Modal */}
        {shareDocumentUrl && (
          <ShareHojaEncargoModal
            open={shareModalOpen}
            onOpenChange={(open) => {
              setShareModalOpen(open);
              if (!open) {
                router.push(`/propiedades/${data.listing.listingId}/documentacion-inicial`);
              }
            }}
            documentUrl={shareDocumentUrl}
            contractData={{
              ownerName,
              ownerPhone,
              ownerEmail,
              propertyAddress: propertyFullAddress,
              commissionPercentage: commissionPercentage.toString(),
              durationMonths: durationMonths.toString(),
            }}
          />
        )}
      </div>
    </div>
  );
}
