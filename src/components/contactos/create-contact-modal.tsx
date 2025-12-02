"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ScrollArea } from "~/components/ui/scroll-area";
import { Loader2, ArrowLeft, Search, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { DuplicateWarningDialog } from "~/components/contactos/duplicate-warning-dialog";
import { createContact, createContactWithListings } from "~/server/queries/contact";
import { listListingsCompactWithAuth } from "~/server/queries/listing";
import { createAppointmentTaskAction } from "~/app/actions/create-appointment-task";
import type { DuplicateContact } from "~/lib/contact-duplicate-detection";
import type { Contact } from "~/lib/data";
import { cn } from "~/lib/utils";
import { CityAutocomplete } from "~/components/contactos/detail/forms/city-autocomplete";
import { formatCityName } from "~/lib/city-name-formatter";
import { fetchNeighborhoodsByCity } from "~/lib/nominatim-service";
import {
  createProspectWithAuth,
  type CreateProspectInput,
} from "~/server/queries/prospect";
import { RoomSelector } from "~/components/crear/pages/elements/room_selector";
import { Slider } from "~/components/ui/slider";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contact: Contact) => void;
  sourceContext?: "propiedades" | "operaciones";
  initialData?: {
    listingId?: bigint;
    contactType?: "owner" | "buyer" | "demand";
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  source: string;
  selectedListings: bigint[];
  contactType: "owner" | "buyer" | "demand";
  // Prospect/Demand fields
  demandType?: "Sale" | "Rent";
  maxPrice?: number;
  selectedCities?: string[];
  selectedNeighborhoods?: Array<{
    neighborhood: string;
    city: string;
    municipality: string;
    province: string;
  }>;
  propertyTypes?: string[];
  minBedrooms?: number;
  minBathrooms?: number;
  minSquareMeters?: number;
  urgencyLevel?: number;
  fundingReady?: boolean;
  moveInBy?: string;
  extras?: Record<string, boolean>;
}

interface Listing {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  listingType: string;
  propertyType: string | null;
  city: string | null;
  imageUrl: string | null;
  isOwned: boolean;
}

const initialFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  source: "",
  selectedListings: [],
  contactType: "buyer",
  // Prospect/Demand fields
  demandType: "Sale",
  maxPrice: 200000,
  selectedCities: [],
  selectedNeighborhoods: [],
  propertyTypes: ["piso"],
  minBedrooms: 0,
  minBathrooms: 0,
  minSquareMeters: 80,
  urgencyLevel: 3,
  fundingReady: false,
  moveInBy: "",
  extras: {},
};

export function CreateContactModal({
  open,
  onOpenChange,
  onSuccess,
  sourceContext,
  initialData,
}: CreateContactModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"personal" | "property">("personal");
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState({
    listings: false,
    creating: false,
    creatingTask: false,
  });
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateContacts, setDuplicateContacts] = useState<DuplicateContact[]>([]);
  const [showOwnershipDialog, setShowOwnershipDialog] = useState(false);
  const [ownershipAction, setOwnershipAction] = useState<"change" | "add" | null>(null);
  const initializedRef = useRef(false);

  // Prospect form states
  const [selectedCity, setSelectedCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<
    Array<{
      neighborhood: string;
      city: string;
      municipality: string;
      province: string;
    }>
  >([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && !initializedRef.current) {
      // Only initialize once when modal opens
      setFormData({
        ...initialFormData,
        firstName: initialData?.firstName ?? "",
        lastName: initialData?.lastName ?? "",
        email: initialData?.email ?? "",
        phone: initialData?.phone ?? "",
        contactType: initialData?.contactType ?? "buyer",
        selectedListings: initialData?.listingId ? [initialData.listingId] : [],
      });
      setStep("personal");
      setListings([]);
      setSearchQuery("");
      setShowDuplicateDialog(false);
      setDuplicateContacts([]);
      setShowOwnershipDialog(false);
      setOwnershipAction(null);
      initializedRef.current = true;
    } else if (!open) {
      // Reset when modal closes
      setFormData(initialFormData);
      setListings([]);
      setSearchQuery("");
      setShowDuplicateDialog(false);
      setDuplicateContacts([]);
      setShowOwnershipDialog(false);
      setOwnershipAction(null);
      initializedRef.current = false;
    }
  }, [open, initialData]);

  // Fetch listings when on property step
  useEffect(() => {
    if (!open || step !== "property") return;

    const fetchListings = async () => {
      setLoading((prev) => ({ ...prev, listings: true }));
      try {
        const listingsData = await listListingsCompactWithAuth({
          searchQuery: searchQuery.trim() || undefined,
        });
        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setLoading((prev) => ({ ...prev, listings: false }));
      }
    };

    const debounceTimer = setTimeout(() => {
      void fetchListings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [open, step, searchQuery]);

  // Load neighborhoods when city changes (for prospect form)
  useEffect(() => {
    if (selectedCity) {
      setLoadingNeighborhoods(true);

      const timeoutId = setTimeout(() => {
        const loadNeighborhoods = async () => {
          try {
            const neighborhoodsList = await fetchNeighborhoodsByCity(
              selectedCity,
              "es",
            );
            setNeighborhoods(neighborhoodsList);
          } catch (error) {
            console.error("Error loading neighborhoods:", error);
            setNeighborhoods([]);
            toast.error(
              "Error al cargar los barrios. Por favor, espera unos segundos e intenta de nuevo.",
            );
          } finally {
            setLoadingNeighborhoods(false);
          }
        };
        void loadNeighborhoods();
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        setLoadingNeighborhoods(false);
      };
    } else {
      setNeighborhoods([]);
      setLoadingNeighborhoods(false);
    }
  }, [selectedCity]);

  // Filter neighborhoods based on search
  const filteredNeighborhoods = neighborhoods.filter(
    (neighborhood) =>
      neighborhood.neighborhood
        .toLowerCase()
        .includes(neighborhoodSearch.toLowerCase()) ||
      neighborhood.municipality
        .toLowerCase()
        .includes(neighborhoodSearch.toLowerCase()),
  );

  const updateFormData = (field: keyof ContactFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange =
    (field: keyof ContactFormData) => (value: string) => {
      updateFormData(field, value);
    };

  const handleEventInputChange =
    (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateFormData(field, e.target.value);
    };

  const handleListingSelection = (listingId: bigint) => {
    setFormData((prev) => {
      const currentArray = prev.selectedListings;
      if (currentArray.includes(listingId)) {
        return {
          ...prev,
          selectedListings: currentArray.filter((item) => item !== listingId),
        };
      } else {
        return { ...prev, selectedListings: [...currentArray, listingId] };
      }
    });
  };

  const validatePersonalStep = () => {
    if (!formData.firstName.trim()) {
      alert("Por favor, introduce el nombre.");
      return false;
    }
    if (!formData.lastName.trim()) {
      alert("Por favor, introduce el apellido.");
      return false;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      alert("Por favor, introduce al menos un email o teléfono.");
      return false;
    }
    // Basic email validation if provided
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      alert("Por favor, introduce un email válido.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === "personal") {
      if (!validatePersonalStep()) return;
      setStep("property");
    }
  };

  const handleBack = () => {
    if (step === "property") {
      setStep("personal");
    }
  };

  const createContactProcess = async (bypassDuplicateCheck = false) => {
    try {
      setLoading((prev) => ({ ...prev, creating: true }));

      // Prepare contact data
      const contactData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nif: undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        source: formData.source || undefined,
        additionalInfo: {
          notes: formData.notes.trim() || undefined,
          selectedListings: formData.selectedListings.length > 0
            ? formData.selectedListings.map((id) => id.toString())
            : undefined,
          contactType: formData.selectedListings.length > 0
            ? formData.contactType
            : undefined,
          ownershipAction: ownershipAction ?? undefined,
        },
        orgId: BigInt(1),
        isActive: true,
      };

      let result;

      if (formData.selectedListings.length === 0) {
        // Create contact without listing relationships
        result = await createContact(
          contactData as Omit<Contact, "contactId" | "createdAt" | "updatedAt">,
          bypassDuplicateCheck,
        );
      } else {
        // Create contact with listing relationships
        // TypeScript narrowing: at this point contactType can only be "owner" or "buyer"
        // because "demand" type doesn't select listings
        const contactType = formData.contactType as "owner" | "buyer";
        result = await createContactWithListings(
          contactData as Omit<Contact, "contactId" | "createdAt" | "updatedAt">,
          formData.selectedListings,
          contactType,
          ownershipAction ?? undefined,
          bypassDuplicateCheck,
        );
      }

      // Check if result is a duplicate error
      if ("error" in result && result.error === "DUPLICATE_FOUND") {
        setDuplicateContacts(result.duplicates);
        setShowDuplicateDialog(true);
        setLoading((prev) => ({ ...prev, creating: false }));
        return;
      }

      // At this point, result is a Contact
      const newContact = result as Contact;

      // If contact type is "demand", create a prospect
      if (newContact.contactId && formData.contactType === "demand") {
        try {
          const preferredAreas =
            formData.selectedNeighborhoods?.map((neighborhood) => ({
              name: neighborhood.neighborhood,
            })) ?? [];

          const prospectData: CreateProspectInput = {
            contactId: newContact.contactId,
            status: "active",
            prospectType: "search",
            listingType: formData.demandType ?? undefined,
            propertyType: formData.propertyTypes?.[0] ?? "",
            maxPrice: (formData.maxPrice ?? 0).toString(),
            preferredCities: formData.selectedCities ?? [],
            preferredAreas: preferredAreas,
            minBedrooms: formData.minBedrooms ?? 0,
            minBathrooms: formData.minBathrooms ?? 0,
            minSquareMeters: formData.minSquareMeters ?? 0,
            moveInBy: formData.moveInBy ? new Date(formData.moveInBy) : undefined,
            extras: formData.extras ?? {},
            urgencyLevel: formData.urgencyLevel ?? 3,
            fundingReady: formData.fundingReady ?? false,
            notesInternal: formData.notes ?? "",
          };

          await createProspectWithAuth(prospectData);
          toast.success("Contacto y demanda creados exitosamente");
        } catch (prospectError) {
          console.error("Error creating prospect:", prospectError);
          toast.error("Contacto creado, pero hubo un error al crear la demanda");
          // Don't block the flow if prospect creation fails
        }
      }

      // If contact is a buyer, automatically create appointment task
      if (newContact.contactId && formData.contactType === "buyer") {
        try {
          setLoading((prev) => ({ ...prev, creatingTask: true }));
          const contactName = `${formData.firstName} ${formData.lastName}`.trim();
          const taskResult = await createAppointmentTaskAction(
            newContact.contactId,
            contactName,
            formData.notes.trim(),
            formData.selectedListings,
          );

          if (!taskResult.success) {
            console.error("Failed to create appointment task:", taskResult.error);
          }
        } catch (taskError) {
          console.error("Error creating appointment task:", taskError);
          // Don't block the flow if task creation fails
        } finally {
          setLoading((prev) => ({ ...prev, creatingTask: false }));
        }
      }

      // Success - close modal and call callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newContact);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error al crear el contacto. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading((prev) => ({ ...prev, creating: false, creatingTask: false }));
      setShowOwnershipDialog(false);
      setOwnershipAction(null);
    }
  };

  const handleCreateContact = async () => {
    // If no properties selected, proceed directly
    if (formData.selectedListings.length === 0) {
      await createContactProcess();
      return;
    }

    // Check if any selected listing is owned
    const ownedListings = formData.selectedListings.filter((listingId) => {
      const listing = listings.find((l) => l.listingId === listingId);
      return listing?.isOwned;
    });

    // Only show ownership dialog if owned listings AND contact type is owner
    if (ownedListings.length > 0 && formData.contactType === "owner") {
      setShowOwnershipDialog(true);
      return;
    }

    // Proceed with contact creation
    await createContactProcess();
  };

  const handleOwnershipAction = (action: "change" | "add") => {
    setOwnershipAction(action);
    setShowOwnershipDialog(false);
    void createContactProcess();
  };

  const handleUseExistingContact = (contactId: number) => {
    setShowDuplicateDialog(false);
    onOpenChange(false);
    router.push(`/contactos/${contactId}`);
  };

  const handleCreateAnyway = () => {
    setShowDuplicateDialog(false);
    void createContactProcess(true);
  };

  const filteredListings = listings.filter((listing) => {
    if (formData.selectedListings.includes(listing.listingId)) {
      return false;
    }
    return true;
  });

  const selectedListingsData = listings.filter((listing) =>
    formData.selectedListings.includes(listing.listingId)
  );

  const isCreatingOrTasking = loading.creating || loading.creatingTask;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden [&>button]:hidden">
          <DialogHeader className="space-y-0 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {step === "personal"
                    ? "Crear Contacto - Información Personal"
                    : "Seleccionar Propiedades"}
                </DialogTitle>
                <DialogDescription className="mt-1.5">
                  {step === "personal"
                    ? "Completa la información básica del contacto"
                    : "Asocia propiedades al contacto o continúa sin seleccionar"}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pt-2 pb-4">
            {step === "personal" ? (
              /* Step 1: Personal Information */
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingLabelInput
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    placeholder="Nombre"
                    required
                  />
                  <FloatingLabelInput
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    placeholder="Apellidos"
                    required
                  />
                </div>

                <FloatingLabelInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Email"
                />

                <FloatingLabelInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  placeholder="Teléfono"
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-900"
                  >
                    Notas adicionales
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={handleEventInputChange("notes")}
                      placeholder="Información adicional sobre el contacto..."
                      rows={4}
                      className="resize-none border-gray-200 pr-10 focus:border-amber-300 focus:ring-amber-200"
                    />
                    <div className="absolute right-2 top-2">
                      <PushToTalkWhisperButton
                        onTranscript={(text) => {
                          handleEventInputChange("notes")({
                            target: {
                              value: formData.notes
                                ? `${formData.notes} ${text}`.trim()
                                : text,
                            },
                          } as React.ChangeEvent<HTMLTextAreaElement>);
                        }}
                        language="es"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="source"
                    className="text-sm font-medium text-gray-900"
                  >
                    Origen
                  </Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => updateFormData("source", value)}
                  >
                    <SelectTrigger
                      id="source"
                      className="border-gray-200 focus:border-amber-300 focus:ring-amber-200"
                      isPlaceholder={!formData.source}
                    >
                      <SelectValue placeholder="Selecciona el origen del contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Sitio Web</SelectItem>
                      <SelectItem value="Walk-In">Visita Presencial</SelectItem>
                      <SelectItem value="Referral">Referido</SelectItem>
                      <SelectItem value="Phone Call">Llamada Telefónica</SelectItem>
                      <SelectItem value="Email">Correo Electrónico</SelectItem>
                      <SelectItem value="Social Media">Redes Sociales</SelectItem>
                      <SelectItem value="Portal">Portal Inmobiliario</SelectItem>
                      <SelectItem value="Other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              /* Step 2: Property Selection */
              <>
                {/* Contact Type Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900">
                    {sourceContext === "operaciones"
                      ? "Tipo de contacto"
                      : "Relación con las propiedades"}
                  </Label>
                  <div className="relative inline-flex h-10 w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-1">
                    {formData.contactType && (
                      <motion.div
                        className="absolute left-1 top-1 h-8 rounded-md bg-primary shadow-sm"
                        animate={{
                          width:
                            sourceContext === "operaciones"
                              ? "calc(33.333% - 4px)"
                              : "calc(50% - 4px)",
                          x:
                            sourceContext === "operaciones"
                              ? formData.contactType === "owner"
                                ? "0%"
                                : formData.contactType === "buyer"
                                  ? "100%"
                                  : "200%"
                              : formData.contactType === "owner"
                                ? "0%"
                                : "100%",
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className="relative flex h-full w-full">
                      <button
                        type="button"
                        onClick={() => updateFormData("contactType", "owner")}
                        className={cn(
                          "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                          formData.contactType === "owner"
                            ? "text-primary-foreground"
                            : "text-gray-500",
                        )}
                      >
                        Propietario
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("contactType", "buyer")}
                        className={cn(
                          "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                          formData.contactType === "buyer"
                            ? "text-primary-foreground"
                            : "text-gray-500",
                        )}
                      >
                        Demandante
                      </button>
                      {sourceContext === "operaciones" && (
                        <button
                          type="button"
                          onClick={() => updateFormData("contactType", "demand")}
                          className={cn(
                            "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                            formData.contactType === "demand"
                              ? "text-primary-foreground"
                              : "text-gray-500",
                          )}
                        >
                          Nueva Demanda
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Selection or Prospect Form based on contactType */}
                {formData.contactType === "demand" ? (
                  /* Prospect/Demand Form */
                  <ScrollArea className="h-[600px] pr-4 custom-scrollbar">
                    <div className="space-y-6 px-1">
                      {/* Transaction Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de operación</Label>
                        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
                          <motion.div
                            className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
                            animate={{
                              x: formData.demandType === "Sale" ? 0 : "calc(100% - 5px)",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                          <div className="relative flex h-full">
                            <button
                              type="button"
                              onClick={() => {
                                updateFormData("demandType", "Sale");
                                updateFormData("maxPrice", 200000);
                              }}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.demandType === "Sale"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Compra
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateFormData("demandType", "Rent");
                                updateFormData("maxPrice", 500);
                              }}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.demandType === "Rent"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Alquiler
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Max Price */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Precio máximo (€)</Label>
                        <div className="space-y-4">
                          {(() => {
                            const propertyType = formData.propertyTypes?.[0] ?? "";
                            const isPisoOrCasa =
                              propertyType === "piso" || propertyType === "casa";
                            const isRent = formData.demandType === "Rent";

                            let minLimit, maxLimit, step, defaultValue, placeholder;

                            if (isRent) {
                              minLimit = 300;
                              maxLimit = 5000;
                              step = 50;
                              defaultValue = 500;
                              placeholder = "€500";
                            } else {
                              minLimit = isPisoOrCasa ? 50000 : 0;
                              maxLimit = isPisoOrCasa ? 2500000 : 2000000;
                              step = 10000;
                              defaultValue = 200000;
                              placeholder = "€200.000";
                            }

                            return (
                              <>
                                <div className="relative">
                                  <Slider
                                    value={[formData.maxPrice ?? defaultValue]}
                                    onValueChange={(value) => {
                                      const newMaxPrice = value[0] ?? defaultValue;
                                      updateFormData("maxPrice", newMaxPrice);
                                    }}
                                    max={maxLimit}
                                    min={minLimit}
                                    step={step}
                                    className="w-full"
                                  />
                                </div>
                                <div className="flex justify-center">
                                  <div className="w-32">
                                    <Input
                                      type="text"
                                      value={`${(formData.maxPrice ?? defaultValue).toLocaleString("es-ES")}${isRent ? "/mes" : ""}`}
                                      onChange={(e) => {
                                        const value =
                                          parseInt(e.target.value.replace(/\D/g, "")) ??
                                          defaultValue;
                                        updateFormData("maxPrice", value);
                                      }}
                                      className="h-8 text-center text-sm"
                                      placeholder={`${placeholder}${isRent ? "/mes" : ""}`}
                                    />
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* City & Neighborhood Selection - Continuing prospect form */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Ciudad y Barrio</Label>

                        {/* City Selection */}
                        <div className="space-y-2">
                          <CityAutocomplete
                            value={selectedCity}
                            onChange={(city) => {
                              setNeighborhoodSearch("");

                              if (city?.trim()) {
                                const formattedCity = formatCityName(city);
                                const alreadyAdded = formData.selectedCities?.some(
                                  (c) => c.toLowerCase() === formattedCity.toLowerCase(),
                                );

                                if (!alreadyAdded) {
                                  updateFormData("selectedCities", [
                                    ...(formData.selectedCities ?? []),
                                    formattedCity,
                                  ]);
                                }

                                setSelectedCity(city);
                              }
                            }}
                            placeholder="Buscar ciudad..."
                            className="h-9 text-gray-500"
                          />

                          {/* Display selected cities */}
                          {formData.selectedCities &&
                            formData.selectedCities.length > 0 && (
                              <div className="space-y-1">
                                {formData.selectedCities.map((city) => (
                                  <div
                                    key={city}
                                    className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1"
                                  >
                                    <span className="text-sm font-medium text-blue-900">
                                      {city} (toda la ciudad)
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => {
                                        const updatedCities =
                                          formData.selectedCities?.filter(
                                            (c) => c !== city,
                                          ) ?? [];
                                        updateFormData("selectedCities", updatedCities);
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Neighborhood Selection */}
                          {selectedCity && (
                            <div className="space-y-2">
                              <Select
                                value=""
                                onValueChange={(value) => {
                                  const neighborhood = neighborhoods.find(
                                    (n) => n.neighborhood === value,
                                  );
                                  if (
                                    neighborhood &&
                                    !formData.selectedNeighborhoods?.some(
                                      (n) =>
                                        n.neighborhood === neighborhood.neighborhood &&
                                        n.city === selectedCity,
                                    )
                                  ) {
                                    const newNeighborhood = {
                                      ...neighborhood,
                                      city: selectedCity,
                                    };
                                    updateFormData("selectedNeighborhoods", [
                                      ...(formData.selectedNeighborhoods ?? []),
                                      newNeighborhood,
                                    ]);
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className="h-9 text-gray-500"
                                  disabled={loadingNeighborhoods}
                                >
                                  <SelectValue
                                    placeholder={
                                      loadingNeighborhoods
                                        ? "Cargando barrios..."
                                        : "Añadir barrio"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent
                                  position="popper"
                                  side="bottom"
                                  align="start"
                                  sideOffset={4}
                                >
                                  {loadingNeighborhoods ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                      <span className="ml-2 text-sm text-gray-500">
                                        Cargando barrios...
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center px-3 pb-2">
                                        <input
                                          className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                          placeholder="Buscar barrio..."
                                          value={neighborhoodSearch}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setNeighborhoodSearch(e.target.value);
                                          }}
                                          onKeyDown={(e) => {
                                            e.stopPropagation();
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                        />
                                      </div>
                                      <Separator className="mb-2" />
                                      {filteredNeighborhoods.length === 0 ? (
                                        <div className="py-4 text-center text-sm text-gray-500">
                                          No se encontraron barrios
                                        </div>
                                      ) : (
                                        filteredNeighborhoods.map((neighborhood) => (
                                          <SelectItem
                                            key={neighborhood.neighborhood}
                                            value={neighborhood.neighborhood}
                                            disabled={formData.selectedNeighborhoods?.some(
                                              (n) =>
                                                n.neighborhood ===
                                                  neighborhood.neighborhood &&
                                                n.city === selectedCity,
                                            )}
                                          >
                                            {neighborhood.neighborhood} (
                                            {neighborhood.municipality})
                                          </SelectItem>
                                        ))
                                      )}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Display selected neighborhoods */}
                          {formData.selectedNeighborhoods &&
                            formData.selectedNeighborhoods.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {formData.selectedNeighborhoods.map((neighborhood) => (
                                  <div
                                    key={`${neighborhood.neighborhood}-${neighborhood.city}`}
                                    className="flex items-center justify-between rounded-md px-2 py-1 bg-gray-50"
                                  >
                                    <span className="text-sm">
                                      {neighborhood.neighborhood} ({neighborhood.city})
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => {
                                        const updatedNeighborhoods =
                                          formData.selectedNeighborhoods?.filter(
                                            (n) =>
                                              n.neighborhood !==
                                                neighborhood.neighborhood ||
                                              n.city !== neighborhood.city,
                                          ) ?? [];
                                        updateFormData(
                                          "selectedNeighborhoods",
                                          updatedNeighborhoods,
                                        );
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Property Type */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de propiedad</Label>
                        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
                          <motion.div
                            className="absolute left-1 top-1 h-8 w-[calc(20%-2px)] rounded-md bg-white shadow-sm"
                            animate={{
                              x:
                                formData.propertyTypes?.[0] === "piso"
                                  ? 0
                                  : formData.propertyTypes?.[0] === "casa"
                                    ? "100%"
                                    : formData.propertyTypes?.[0] === "local"
                                      ? "200%"
                                      : formData.propertyTypes?.[0] === "solar"
                                        ? "300%"
                                        : "400%",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                          <div className="relative flex h-full">
                            <button
                              type="button"
                              onClick={() => updateFormData("propertyTypes", ["piso"])}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.propertyTypes?.[0] === "piso"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Piso
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFormData("propertyTypes", ["casa"])}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.propertyTypes?.[0] === "casa"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Casa
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFormData("propertyTypes", ["local"])}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.propertyTypes?.[0] === "local"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Local
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFormData("propertyTypes", ["solar"])}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.propertyTypes?.[0] === "solar"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Solar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateFormData("propertyTypes", ["garaje"])}
                              className={cn(
                                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                                formData.propertyTypes?.[0] === "garaje"
                                  ? "text-gray-900"
                                  : "text-gray-600",
                              )}
                            >
                              Garaje
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Rooms (if applicable) */}
                      {(() => {
                        const propertyType = formData.propertyTypes?.[0] ?? "";
                        const shouldShowRooms =
                          propertyType !== "garaje" && propertyType !== "solar";

                        if (shouldShowRooms) {
                          return (
                            <div className="grid grid-cols-2 gap-4">
                              <RoomSelector
                                type="bedrooms"
                                value={formData.minBedrooms ?? 0}
                                onChange={(value) =>
                                  updateFormData("minBedrooms", value)
                                }
                                label="Habitaciones mínimas"
                                max={6}
                              />

                              <RoomSelector
                                type="bathrooms"
                                value={formData.minBathrooms ?? 0}
                                onChange={(value) =>
                                  updateFormData("minBathrooms", value)
                                }
                                label="Baños mínimos"
                                max={4}
                              />
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Square Meters */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Metros cuadrados mínimos (m²)
                        </Label>
                        <div className="space-y-4">
                          <div className="relative">
                            <Slider
                              value={[formData.minSquareMeters ?? 80]}
                              onValueChange={(value) => {
                                const newMinSquareMeters = value[0] ?? 80;
                                updateFormData("minSquareMeters", newMinSquareMeters);
                              }}
                              max={500}
                              min={20}
                              step={10}
                              className="w-full"
                            />
                          </div>
                          <div className="flex justify-center">
                            <div className="w-24">
                              <Input
                                type="text"
                                value={formData.minSquareMeters ?? 80}
                                onChange={(e) => {
                                  const value =
                                    parseInt(e.target.value.replace(/\D/g, "")) ?? 80;
                                  updateFormData("minSquareMeters", value);
                                }}
                                className="h-8 text-center text-sm"
                                placeholder="80m²"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Move-in Date */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Fecha deseada</Label>
                        <Input
                          type="date"
                          value={formData.moveInBy ?? ""}
                          onChange={(e) => updateFormData("moveInBy", e.target.value)}
                          className="h-9 text-gray-500"
                        />
                      </div>

                      {/* Urgency Level */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Nivel de urgencia</Label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((level) => {
                            const isSelected = formData.urgencyLevel === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => updateFormData("urgencyLevel", level)}
                                className={cn(
                                  "h-8 w-8 rounded-full text-sm font-medium transition-colors",
                                  isSelected
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                )}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Sin prisa</span>
                          <span>Urgente</span>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  /* Property Selection (Owner/Buyer) */
                  <>
                    {/* Selected Properties */}
                    {selectedListingsData.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-900">
                          Propiedades seleccionadas ({selectedListingsData.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedListingsData.map((listing) => (
                            <div
                              key={listing.listingId.toString()}
                              className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3"
                            >
                              {listing.imageUrl && (
                                <Image
                                  src={listing.imageUrl}
                                  alt={listing.title ?? "Property"}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {listing.title ?? "Sin título"}
                                </div>
                                {listing.referenceNumber && (
                                  <div className="text-xs text-muted-foreground">
                                    Ref: {listing.referenceNumber}
                                  </div>
                                )}
                                {listing.city && (
                                  <div className="text-xs text-muted-foreground">
                                    {listing.city}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleListingSelection(listing.listingId)}
                                className="h-6 w-6 shrink-0 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Property Search */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-900">
                        Buscar propiedades
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por título, referencia o ciudad..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Property List */}
                    <ScrollArea className="h-[300px] custom-scrollbar">
                      {loading.listings ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : filteredListings.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No se encontraron propiedades
                        </div>
                      ) : (
                        <div className="space-y-2 pr-4">
                          {filteredListings.map((listing) => {
                            const isSelected = formData.selectedListings.includes(
                              listing.listingId,
                            );
                            return (
                              <div
                                key={listing.listingId.toString()}
                                className={cn(
                                  "cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/30",
                                )}
                                onClick={() => handleListingSelection(listing.listingId)}
                              >
                                <div className="flex items-start gap-3">
                                  {listing.imageUrl && (
                                    <Image
                                      src={listing.imageUrl}
                                      alt={listing.title ?? "Property"}
                                      width={48}
                                      height={48}
                                      className="h-12 w-12 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-medium truncate">
                                        {listing.title ?? "Sin título"}
                                      </div>
                                    </div>
                                    {listing.referenceNumber && (
                                      <div className="text-xs text-muted-foreground">
                                        Ref: {listing.referenceNumber}
                                      </div>
                                    )}
                                    {listing.city && (
                                      <div className="text-xs text-muted-foreground">
                                        {listing.city}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter className="shrink-0">
            {step === "property" && (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isCreatingOrTasking}
                className="mr-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingOrTasking}
            >
              Cancelar
            </Button>
            {step === "personal" ? (
              <Button onClick={handleNextStep} disabled={isCreatingOrTasking}>
                Continuar
              </Button>
            ) : (
              <Button
                onClick={() => void handleCreateContact()}
                disabled={isCreatingOrTasking}
              >
                {loading.creating && !loading.creatingTask ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando contacto...
                  </>
                ) : loading.creatingTask ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando tarea...
                  </>
                ) : (
                  "Crear Contacto"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        duplicates={duplicateContacts}
        onUseExisting={handleUseExistingContact}
        onCreateAnyway={handleCreateAnyway}
      />

      {/* Ownership Confirmation Dialog */}
      <Dialog open={showOwnershipDialog} onOpenChange={setShowOwnershipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>¿Cambiar o agregar propietario?</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Estas propiedades ya tienen un propietario. ¿Qué quieres hacer?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="flex h-auto flex-col items-start space-y-2 p-4 text-left"
                onClick={() => handleOwnershipAction("change")}
              >
                <div className="font-medium text-gray-900">
                  Cambiar propietario
                </div>
                <div className="text-sm text-gray-500">
                  Sustituir el propietario actual por este nuevo contacto
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex h-auto flex-col items-start space-y-2 p-4 text-left"
                onClick={() => handleOwnershipAction("add")}
              >
                <div className="font-medium text-gray-900">
                  Añadir otro propietario
                </div>
                <div className="text-sm text-gray-500">
                  Mantener el propietario actual y añadir este contacto
                </div>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOwnershipDialog(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
