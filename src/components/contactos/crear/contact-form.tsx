"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card } from "~/components/ui/card";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Home,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createContact,
  createContactWithListings,
} from "~/server/queries/contact";
import { createAppointmentTaskAction } from "~/app/actions/create-appointment-task";
import { listListingsCompactWithAuth } from "~/server/queries/listing";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { matchesSearch } from "~/lib/search-utils";
// import { CompactPropertyCard } from "~/components/propiedades/compact-property-card";
import { DuplicateWarningDialog } from "../duplicate-warning-dialog";
import type { DuplicateContact } from "~/lib/contact-duplicate-detection";
import type { Contact } from "~/lib/data";

// Contact form data interface
interface ContactFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  nif: string;
  email: string;
  phone: string;
  notes: string;
  source: string;

  // Property Selection
  selectedListings: bigint[];
  contactType: "owner" | "buyer";
}

const initialFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  nif: "",
  email: "",
  phone: "",
  notes: "",
  source: "",
  selectedListings: [],
  contactType: "owner",
};

// Step definitions
interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "personal",
    title: "Información Personal",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "property",
    title: "Seleccionar Propiedades",
    icon: <Home className="h-5 w-5" />,
  },
];

// Interface for listing data structure
interface ListingData {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  listingType: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  city: string | null;
  agentName: string | null;
  imageUrl: string | null;
}

const statusLabels: Record<string, string> = {
  Sale: "En Venta",
  Rent: "En Alquiler",
  Sold: "Vendido",
};

export default function ContactForm() {
  const searchParams = useSearchParams();
  const listingIdParam = searchParams.get("listingId");

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    listingType: [] as string[],
    propertyType: [] as string[],
  });
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [showOwnershipDialog, setShowOwnershipDialog] = useState(false);
  const [ownershipAction, setOwnershipAction] = useState<
    "change" | "add" | null
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateContacts, setDuplicateContacts] = useState<
    DuplicateContact[]
  >([]);
  const router = useRouter();

  // Filter steps based on whether listingId is present
  const visibleSteps = listingIdParam
    ? steps.filter((step) => step.id === "personal")
    : steps;

  // Initialize form data with listingId from URL if present
  useEffect(() => {
    if (listingIdParam) {
      const listingIdBigInt = BigInt(listingIdParam);
      setFormData((prev) => ({
        ...prev,
        selectedListings: [listingIdBigInt],
        contactType: "buyer",
      }));
    }
  }, [listingIdParam]);

  // Fetch listings on component mount
  useEffect(() => {
    const fetchListings = async () => {
      setIsLoadingListings(true);
      try {
        const listingsData = await listListingsCompactWithAuth();
        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    void fetchListings();
  }, []);

  const updateFormData = (field: keyof ContactFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange =
    (field: keyof ContactFormData) => (value: string) => {
      updateFormData(field, value);
    };

  const handleEventInputChange =
    (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateFormData(field, e.target.value);
    };

  const handleListingSelection = (listingId: bigint, _checked: boolean) => {
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

  const validatePropertyStep = () => {
    // Property selection is now optional
    setValidationError(null);
    return true;
  };

  const handleCreateContact = async () => {
    if (!validatePropertyStep()) return;

    // Proceed with contact creation
    await createContactProcess();
  };

  const createContactProcess = async (bypassDuplicateCheck = false) => {
    try {
      setIsCreating(true);

      // Prepare additional info based on form data
      const additionalInfo: Record<string, unknown> = {};
      // Store selected listings and contact type for reference if listings are selected
      if (formData.selectedListings.length > 0) {
        additionalInfo.selectedListings = formData.selectedListings.map((id) =>
          id.toString(),
        );
        additionalInfo.contactType = formData.contactType;
        // Add ownership action if specified
        if (ownershipAction) {
          additionalInfo.ownershipAction = ownershipAction;
        }
      }
      // Add notes if provided
      if (formData.notes.trim()) {
        additionalInfo.notes = formData.notes.trim();
      }

      const contactData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nif: formData.nif.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        source: formData.source || undefined,
        additionalInfo,
        orgId: BigInt(1), // Default org ID - you might want to make this dynamic
        isActive: true,
      };

      let result;

      if (formData.selectedListings.length === 0) {
        // Create contact without listing relationships
        result = await createContact(contactData, bypassDuplicateCheck);
      } else {
        // Create contact with listing relationships
        result = await createContactWithListings(
          contactData,
          formData.selectedListings,
          formData.contactType,
          ownershipAction ?? undefined,
          bypassDuplicateCheck,
        );
      }

      // Check if result is a duplicate error
      if ("error" in result && result.error === "DUPLICATE_FOUND") {
        setDuplicateContacts(result.duplicates);
        setShowDuplicateDialog(true);
        setIsCreating(false);
        return;
      }

      // At this point, result is guaranteed to be a Contact
      const newContact = result as Contact;
      console.log("Contact created:", newContact);

      // If contact is a demandante (buyer), automatically create appointment task
      if (newContact.contactId && formData.contactType === "buyer") {
        try {
          setIsCreatingTask(true);
          const contactName =
            `${formData.firstName} ${formData.lastName}`.trim();
          const taskResult = await createAppointmentTaskAction(
            newContact.contactId,
            contactName,
            formData.notes.trim(),
            formData.selectedListings,
          );

          if (taskResult.success) {
            console.log("Appointment task created:", taskResult.task);
          } else {
            console.error(
              "Failed to create appointment task:",
              taskResult.error,
            );
          }
        } catch (taskError) {
          console.error("Error creating appointment task:", taskError);
          // Don't block the flow if task creation fails
        } finally {
          setIsCreatingTask(false);
        }
      }

      // Redirect based on context
      if (listingIdParam) {
        // If contact was created from a property page, redirect back to that property's activity tab
        router.push(`/propiedades/${listingIdParam}?tab=actividad`);
      } else if (newContact.contactId) {
        // Otherwise, redirect to the contact detail page
        router.push(`/contactos/${newContact.contactId}`);
      } else {
        router.push("/contactos");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error al crear el contacto. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
      setIsCreatingTask(false);
      setShowOwnershipDialog(false);
      setOwnershipAction(null);
    }
  };

  const handleOwnershipAction = (action: "change" | "add") => {
    setOwnershipAction(action);
    setShowOwnershipDialog(false);
    // Proceed with contact creation
    void createContactProcess();
  };

  const handleUseExistingContact = (contactId: number) => {
    // Redirect to the existing contact's detail page
    router.push(`/contactos/${contactId}`);
  };

  const handleCreateAnyway = () => {
    // Retry creation with bypass flag
    void createContactProcess(true);
  };

  const nextStep = async () => {
    if (currentStep === 0) {
      if (!validatePersonalStep()) return;

      // If listingId is present in URL, skip step 2 and create contact directly
      if (listingIdParam) {
        await handleCreateContact();
      } else {
        setDirection("forward");
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      await handleCreateContact();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getPropertyTypeLabel = (type: string | null) => {
    switch (type) {
      case "piso":
        return "Piso";
      case "casa":
        return "Casa";
      case "local":
        return "Local";
      case "solar":
        return "Solar";
      case "garaje":
        return "Garaje";
      default:
        return type;
    }
  };

  // Filter listings based on search and filters
  const filteredListings = listings.filter((listing: ListingData) => {
    // Use normalized search for case-insensitive and accent-insensitive matching
    const matchesSearchQuery =
      !searchQuery ||
      matchesSearch(listing.title, searchQuery) ||
      matchesSearch(listing.referenceNumber, searchQuery) ||
      matchesSearch(listing.city, searchQuery);

    const matchesListingType =
      filters.listingType.length === 0 ||
      filters.listingType.includes(listing.listingType);

    const matchesPropertyType =
      filters.propertyType.length === 0 ||
      filters.propertyType.includes(listing.propertyType ?? "");

    return matchesSearchQuery && matchesListingType && matchesPropertyType;
  });

  const toggleFilter = (
    filterType: "listingType" | "propertyType",
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((v) => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    if (!step) {
      return <div>Step not found</div>;
    }

    switch (step.id) {
      case "personal":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FloatingLabelInput
                id="nif"
                value={formData.nif}
                onChange={handleInputChange("nif")}
                placeholder="DNI (opcional)"
              />
              <FloatingLabelInput
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange("phone")}
                placeholder="Teléfono"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FloatingLabelInput
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="Email"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-900 sm:text-base"
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
                className="text-sm font-medium text-gray-900 sm:text-base"
              >
                Origen (opcional)
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
          </div>
        );

      case "property":
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Relación con las propiedades
              </Label>
              <div className="relative inline-flex h-10 w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-1">
                {formData.contactType && (
                  <motion.div
                    className="absolute left-1 top-1 h-8 rounded-md bg-primary shadow-sm"
                    animate={{
                      width: "calc(50% - 4px)",
                      x: formData.contactType === "owner" ? "0%" : "100%",
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
                </div>
              </div>
            </div>

            {/* Property Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-0 sm:space-x-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Buscar propiedades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-amber-200 hover:border-amber-300 hover:bg-amber-50 sm:w-auto"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      <span className="text-xs sm:text-sm">Filtros</span>
                      {filters.listingType.length +
                        filters.propertyType.length >
                        0 && (
                        <Badge className="ml-2 rounded-sm bg-gradient-to-r from-amber-400 to-rose-400 px-1 text-xs font-normal text-white">
                          {filters.listingType.length +
                            filters.propertyType.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Estado</h5>
                          {["Sale", "Rent", "Sold"].map((type) => (
                            <div
                              key={type}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`listing-${type}`}
                                checked={filters.listingType.includes(type)}
                                onCheckedChange={(_checked) =>
                                  toggleFilter("listingType", type)
                                }
                              />
                              <Label
                                htmlFor={`listing-${type}`}
                                className="text-sm"
                              >
                                {statusLabels[type]}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Tipo</h5>
                          {["piso", "casa", "local", "solar", "garaje"].map(
                            (type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`property-${type}`}
                                  checked={filters.propertyType.includes(type)}
                                  onCheckedChange={(_checked) =>
                                    toggleFilter("propertyType", type)
                                  }
                                />
                                <Label
                                  htmlFor={`property-${type}`}
                                  className="text-sm"
                                >
                                  {getPropertyTypeLabel(type)}
                                </Label>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Property List */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <div className="break-words text-xs text-gray-600 sm:text-sm">
                  {formData.selectedListings.length > 0 ? (
                    <span>
                      {formData.selectedListings.length} propiedades
                      seleccionadas
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Selecciona propiedades para asociar al contacto (opcional)
                    </span>
                  )}
                </div>
                {validationError && (
                  <div className="flex items-center space-x-2 text-xs text-red-600 sm:text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{validationError}</span>
                  </div>
                )}
              </div>
              <ScrollArea className="h-[300px] sm:h-[400px]">
                <div className="space-y-3 px-1 pb-2 pr-2 pt-1 sm:pr-4">
                  {isLoadingListings ? (
                    <div className="flex justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredListings.length > 0 ? (
                    filteredListings.map((listing: ListingData) => {
                      const isSelected = formData.selectedListings.includes(
                        listing.listingId,
                      );
                      return (
                        <div
                          key={listing.listingId.toString()}
                          className={cn(
                            "cursor-pointer rounded-lg p-4 shadow-sm transition-all duration-200",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-white hover:shadow-md",
                          )}
                          onClick={() =>
                            handleListingSelection(
                              listing.listingId,
                              !isSelected,
                            )
                          }
                        >
                          {/* TODO: Replace with proper CompactPropertyCard component */}
                          <div className="text-sm font-medium">
                            {listing.referenceNumber}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              isSelected ? "text-primary-foreground/80" : "text-gray-500",
                            )}
                          >
                            {listing.title}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <Home className="mx-auto mb-2 h-6 w-6 text-gray-300 sm:h-8 sm:w-8" />
                      <p className="text-xs sm:text-sm">
                        No se encontraron propiedades
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        );

      default:
        return <div>Contenido no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="mx-auto max-w-2xl">
        <Card className="border-0 bg-white p-4 shadow-xl sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-6 text-center text-xl font-semibold text-gray-900 sm:mb-8 sm:text-2xl">
              CREAR NUEVO CONTACTO
            </h1>

            {/* Progress indicator - only show when not coming from listing */}
            {!listingIdParam && (
              <div className="mb-6 flex items-center justify-center sm:mb-8">
                {visibleSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 ${
                        index <= currentStep
                          ? "scale-110 border-transparent bg-gradient-to-r from-amber-400 to-rose-400 text-white shadow-lg"
                          : "border-2 border-gray-300 bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step.icon}
                    </div>
                    {index < visibleSteps.length - 1 && (
                      <div
                        className={`mx-2 h-1 w-12 rounded-full transition-all duration-300 sm:mx-3 sm:w-16 ${
                          index < currentStep
                            ? "bg-gradient-to-r from-amber-400 to-rose-400 shadow-sm"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="mb-4 text-center text-lg font-medium text-gray-900 sm:mb-6 sm:text-xl">
              {visibleSteps[currentStep]?.title}
            </h2>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isCreating || isCreatingTask}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </Button>

            <Button
              onClick={nextStep}
              disabled={isCreating || isCreatingTask}
              className="flex items-center space-x-2"
            >
              {isCreating || isCreatingTask ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>
                    {isCreating && !isCreatingTask && "Creando contacto..."}
                    {isCreating && isCreatingTask && "Creando contacto..."}
                    {!isCreating &&
                      isCreatingTask &&
                      "Creando tarea de seguimiento..."}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {currentStep === visibleSteps.length - 1
                      ? "Crear Contacto"
                      : "Siguiente"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

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

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        duplicates={duplicateContacts}
        onUseExisting={handleUseExistingContact}
        onCreateAnyway={handleCreateAnyway}
      />
    </div>
  );
}
