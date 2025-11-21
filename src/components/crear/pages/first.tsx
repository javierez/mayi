import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { ChevronLeft, ChevronRight, Info, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { formFormatters } from "~/lib/utils";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useFormContext } from "../form-context";
// import FormSkeleton from "./form-skeleton"; // Removed - using single loading state
import { QuickContactModal } from "~/components/contactos/quick-contact-modal";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import { searchContactsForFormWithAuth } from "~/server/queries/contact";
import { getListingContactsByIdWithAuth } from "~/server/queries/listing";

// Type definitions
interface Contact {
  id: number;
  name: string;
}

interface Agent {
  id: string; // Changed from number to match users.id type
  name: string;
}

interface NewContact {
  contactId: number | string;
  firstName: string;
  lastName: string;
}

interface FirstPageProps {
  listingId?: string; // Now actively used for fetching listing contacts
  onNext: () => void;
  onBack?: () => void;
}

// Form data interface for first page
interface FirstPageFormData {
  price: string;
  listingType: string;
  propertyType: string;
  propertySubtype: string;
  agentId: string;
  selectedContactIds: string[];
  selectedContacts: Contact[];
}

export default function FirstPage({
  listingId,
  onNext,
  onBack,
}: FirstPageProps) {
  const { state, updateFormData } = useFormContext();
  const [showListingTypeTooltip, setShowListingTypeTooltip] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [listingContacts, setListingContacts] = useState<Contact[]>([]);

  // Fallback price formatting functions in case formFormatters is undefined
  const formatPriceInput = (value: string | number): string => {
    if (!value) return "";

    const strValue = typeof value === "string" ? value : value.toString();

    // Split by decimal point to handle integer and decimal parts separately
    const parts = strValue.split(".");
    let integerPart = parts[0] ?? "";
    const decimalPart = parts[1];

    // Remove any existing formatting from integer part
    integerPart = integerPart.replace(/[^\d]/g, "");

    if (!integerPart) return "";

    // Add thousand separators to integer part only
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Don't show decimal part if it's "00"
    const finalResult =
      decimalPart && decimalPart !== "00"
        ? `${formatted},${decimalPart}`
        : formatted;
    return finalResult;
  };

  const getNumericPrice = (formattedValue: string): string => {
    // Handle format like "21.000.00" where last period is decimal separator
    let result = formattedValue;

    // Find the last period - this is the decimal separator
    const lastPeriodIndex = result.lastIndexOf(".");

    if (lastPeriodIndex !== -1) {
      // Split into integer and decimal parts
      const integerPart = result.substring(0, lastPeriodIndex);
      const decimalPart = result.substring(lastPeriodIndex + 1);

      // Remove thousand separators from integer part, keep only digits
      const cleanInteger = integerPart.replace(/[^\d]/g, "");

      // Keep only digits in decimal part
      const cleanDecimal = decimalPart.replace(/[^\d]/g, "");

      // Reconstruct as standard decimal format
      result = cleanDecimal ? `${cleanInteger}.${cleanDecimal}` : cleanInteger;
    } else {
      // No decimal point, just remove non-digits
      result = result.replace(/[^\d]/g, "");
    }

    return result;
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".tooltip-container")) {
        setShowListingTypeTooltip(false);
      }
    };

    if (showListingTypeTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showListingTypeTooltip]);

  // Debounced contact search
  const performContactSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchContactsForFormWithAuth(query, 6);
      setSearchResults(
        results.map((contact) => ({
          id: Number(contact.id),
          name: contact.name,
        })),
      );
    } catch (error) {
      console.error("Error searching contacts:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input with debouncing
  const handleContactSearchChange = useCallback(
    (value: string) => {
      setContactSearch(value);

      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout for debounced search
      const timeout = setTimeout(() => {
        void performContactSearch(value);
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout, performContactSearch],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Get current form data from context
  const formData = {
    price: state.formData.price ?? "",
    listingType: state.formData.listingType ?? "Sale",
    propertyType: state.formData.propertyType ?? "piso",
    propertySubtype: state.formData.propertySubtype ?? "",
    agentId: state.formData.agentId ?? "",
    selectedContactIds: state.formData.selectedContactIds ?? [],
    selectedContacts: state.formData.selectedContacts ?? [],
  };

  // Update form data helper
  const updateField = useCallback(
    (field: keyof FirstPageFormData, value: string | string[] | Contact[]) => {
      updateFormData({ [field]: value });
    },
    [updateFormData],
  );

  // Initialize form data with defaults if not already set
  useEffect(() => {
    // Only set defaults if form data is empty (first load)
    if (!state.formData.price && !state.formData.listingType) {
      updateField("listingType", "Sale");
      updateField("propertyType", "piso");
      updateField("propertySubtype", "Piso");
      updateField("selectedContactIds", state.currentContacts ?? []);
    }
  }, [
    state.currentContacts,
    state.formData.price,
    state.formData.listingType,
    updateField,
  ]);

  // Fetch and populate listing contacts when listingId is available
  useEffect(() => {
    const fetchListingContacts = async () => {
      console.log(
        "🔍 [FirstPage] Checking listing contacts for listingId:",
        listingId,
      );

      if (!listingId) {
        console.log(
          "❌ [FirstPage] No listingId provided, skipping listing contacts fetch",
        );
        return;
      }

      try {
        console.log(
          "📞 [FirstPage] Fetching listing contacts for listingId:",
          listingId,
        );
        const listingContacts = await getListingContactsByIdWithAuth(
          Number(listingId),
        );
        console.log(
          "📋 [FirstPage] Received listing contacts:",
          listingContacts,
        );

        if (listingContacts && listingContacts.length > 0) {
          // Convert to Contact format for UI display
          const contactsForUI: Contact[] = listingContacts.map((contact) => ({
            id: Number(contact.contactId),
            name: `${contact.firstName} ${contact.lastName}`,
          }));

          // Store in state for UI display
          setListingContacts(contactsForUI);

          // Update selected contacts in formData (only if not already set)
          if (
            !formData.selectedContactIds ||
            formData.selectedContactIds.length === 0
          ) {
            const contactIds = listingContacts.map((contact) =>
              contact.contactId.toString(),
            );
            console.log("✅ [FirstPage] Converting to contactIds:", contactIds);
            updateFormData({
              selectedContactIds: contactIds,
              selectedContacts: contactsForUI,
            });
            console.log(
              "💾 [FirstPage] Updated selectedContactIds and selectedContacts with listing contacts",
            );
          }
        } else {
          console.log(
            "⚠️ [FirstPage] No listing contacts found or empty array",
          );
        }
      } catch (error) {
        console.error("❌ [FirstPage] Error fetching listing contacts:", error);
      }
    };

    void fetchListingContacts();
  }, [listingId, updateFormData, formData.selectedContactIds]);

  // Handle price input with formatting
  const handlePriceChange = (value: string) => {
    const numericValue =
      formFormatters?.getNumericPrice(value) || getNumericPrice(value);
    updateField("price", numericValue);
  };

  // Get contacts to display - combine listing contacts with search results, avoid duplicates
  const contactsToDisplay = useMemo(() => {
    if (contactSearch.trim()) {
      // When searching, show search results + listing contacts (avoid duplicates)
      const searchContactIds = new Set(searchResults.map((c) => c.id));
      const uniqueListingContacts = listingContacts.filter(
        (c) => !searchContactIds.has(c.id),
      );
      return [...searchResults, ...uniqueListingContacts];
    } else {
      // When not searching, show only listing contacts
      return listingContacts;
    }
  }, [searchResults, listingContacts, contactSearch]);

  // Update the toggle logic and state management
  const handleListingTypeTab = (type: string) => {
    // Reset all secondary toggles
    updateField("listingType", type);
  };

  const handleNext = () => {
    // Auto-set price to 0 if blank
    if (!formData.price.trim()) {
      updateField("price", "0");
    }

    if (!formData.agentId) {
      alert("Por favor, selecciona un agente.");
      return;
    }

    if (formData.selectedContactIds.length === 0) {
      alert("Por favor, selecciona al menos un contacto.");
      return;
    }

    // Navigate immediately - no saves, completely instant!
    onNext();
  };

  // Helper function to toggle contact selection
  const toggleContact = (contactId: string) => {
    const currentIds = formData.selectedContactIds;
    const currentContacts = formData.selectedContacts;

    if (currentIds.includes(contactId)) {
      // Remove from both arrays
      updateFormData({
        selectedContactIds: currentIds.filter((id) => id !== contactId),
        selectedContacts: currentContacts.filter(
          (c) => c.id.toString() !== contactId,
        ),
      });
    } else {
      // Find contact in available sources
      const contact = [...listingContacts, ...searchResults].find(
        (c) => c.id.toString() === contactId,
      );
      if (contact) {
        // Add to both arrays
        updateFormData({
          selectedContactIds: [...currentIds, contactId],
          selectedContacts: [...currentContacts, contact],
        });
      }
    }
  };

  const handleContactCreated = (contact: unknown) => {
    console.log("New contact created:", contact);

    // Type guard to check if contact has the expected properties
    const isValidContact = (obj: unknown): obj is NewContact => {
      return (
        typeof obj === "object" &&
        obj !== null &&
        "contactId" in obj &&
        "firstName" in obj &&
        "lastName" in obj
      );
    };

    // Immediately add the new contact to search results for instant UI update
    if (isValidContact(contact)) {
      const newContactForList: Contact = {
        id: Number(contact.contactId),
        name: `${contact.firstName} ${contact.lastName}`,
      };

      setSearchResults((prev) => [newContactForList, ...prev].slice(0, 6));

      // Auto-select the new contact in form context
      const currentIds = formData.selectedContactIds;
      const currentContacts = formData.selectedContacts;
      const contactIdStr = contact.contactId.toString();

      updateFormData({
        selectedContactIds: [...currentIds, contactIdStr],
        selectedContacts: [...currentContacts, newContactForList],
      });
    }

    // Note: No need to refresh search results
  };

  // Main form already handles loading state with spinner
  // No need for skeleton since data is in formData
  // if (!state.formData) {
  //   return <FormSkeleton />;
  // }

  return (
    <div className="space-y-6">
      {/* Price Section */}
      <FloatingLabelInput
        id="price"
        value={formatPriceInput(formData.price)}
        onChange={handlePriceChange}
        placeholder="Precio (€)"
        type="text"
      />

      {/* Listing Type Section */}
      <div className="space-y-2">
        <div className="mb-4 flex items-center space-x-3">
          <h3 className="text-md font-medium text-gray-900">Tipo de Anuncio</h3>
          <div className="tooltip-container relative">
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
              onClick={() => setShowListingTypeTooltip(!showListingTypeTooltip)}
            >
              <Info className="h-3 w-3" />
            </button>
            {showListingTypeTooltip && (
              <div className="absolute left-0 top-0 z-10 w-72 rounded-lg bg-black p-3 text-xs text-white shadow-lg">
                <p>
                  Al final del proceso podrás duplicar el anuncio para ponerlo
                  en alquiler o venta
                </p>
                <div className="absolute left-3 top-3 h-2 w-2 rotate-45 transform bg-black"></div>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
          <motion.div
            className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
            animate={{
              x:
                formData.listingType === "Sale" ||
                formData.listingType === "Transfer"
                  ? 0
                  : "calc(100% - 5px)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="relative flex h-full">
            <button
              onClick={() => handleListingTypeTab("Sale")}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.listingType === "Sale" ||
                  formData.listingType === "Transfer"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Venta
            </button>
            <button
              onClick={() => handleListingTypeTab("Rent")}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.listingType === "Rent" ||
                  formData.listingType === "RentWithOption" ||
                  formData.listingType === "RoomSharing"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Alquiler
            </button>
          </div>
        </div>
      </div>
      {/* Replace the secondary toggles with checkboxes */}
      {["Rent", "RentWithOption", "RoomSharing"].includes(
        formData.listingType,
      ) && (
        <div className="mb-6 ml-6 flex flex-row items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="roomSharing"
              checked={formData.listingType === "RoomSharing"}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField("listingType", "RoomSharing");
                } else {
                  updateField("listingType", "Rent");
                }
              }}
            />
            <label
              htmlFor="roomSharing"
              className="cursor-pointer select-none text-xs text-gray-700"
            >
              Compartir habitación
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rentWithOption"
              checked={formData.listingType === "RentWithOption"}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField("listingType", "RentWithOption");
                } else {
                  updateField("listingType", "Rent");
                }
              }}
            />
            <label
              htmlFor="rentWithOption"
              className="cursor-pointer select-none text-xs text-gray-700"
            >
              Alquiler con opción a compra
            </label>
          </div>
        </div>
      )}
      {["Sale", "Transfer"].includes(formData.listingType) && (
        <div className="mb-6 ml-6 flex flex-row items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="transfer"
              checked={formData.listingType === "Transfer"}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField("listingType", "Transfer");
                } else {
                  updateField("listingType", "Sale");
                }
              }}
            />
            <label
              htmlFor="transfer"
              className="cursor-pointer select-none text-xs text-gray-700"
            >
              Transferencia
            </label>
          </div>
        </div>
      )}

      {/* Property Type Section */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-gray-900">Tipo de Propiedad</h3>
        {/* Desktop: Single row with animation */}
        <div className="relative hidden h-10 rounded-lg bg-gray-100 p-1 sm:block">
          <motion.div
            className="absolute left-1 top-1 h-8 w-[calc(20%-2px)] rounded-md bg-white shadow-sm"
            animate={{
              x:
                formData.propertyType === "piso"
                  ? 0
                  : formData.propertyType === "casa"
                    ? "100%"
                    : formData.propertyType === "local"
                      ? "200%"
                      : formData.propertyType === "solar"
                        ? "300%"
                        : "400%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="relative flex h-full">
            <button
              onClick={() => {
                updateField("propertyType", "piso");
                updateField("propertySubtype", "Piso");
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.propertyType === "piso"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Piso
            </button>
            <button
              onClick={() => {
                updateField("propertyType", "casa");
                updateField("propertySubtype", "Casa");
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.propertyType === "casa"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Casa
            </button>
            <button
              onClick={() => {
                updateField("propertyType", "local");
                updateField("propertySubtype", "Otros");
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.propertyType === "local"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Local
            </button>
            <button
              onClick={() => {
                updateField("propertyType", "solar");
                updateField("propertySubtype", "Suelo residencial");
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.propertyType === "solar"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Solar
            </button>
            <button
              onClick={() => {
                updateField("propertyType", "garaje");
                updateField("propertySubtype", "Individual");
              }}
              className={cn(
                "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                formData.propertyType === "garaje"
                  ? "text-gray-900"
                  : "text-gray-600",
              )}
            >
              Garaje
            </button>
          </div>
        </div>
        {/* Mobile: Grid layout without animation */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          <button
            onClick={() => {
              updateField("propertyType", "piso");
              updateField("propertySubtype", "Piso");
            }}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-all duration-200",
              formData.propertyType === "piso"
                ? "bg-white text-gray-900 shadow-md"
                : "bg-gray-100 text-gray-600",
            )}
          >
            Piso
          </button>
          <button
            onClick={() => {
              updateField("propertyType", "casa");
              updateField("propertySubtype", "Casa");
            }}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-all duration-200",
              formData.propertyType === "casa"
                ? "bg-white text-gray-900 shadow-md"
                : "bg-gray-100 text-gray-600",
            )}
          >
            Casa
          </button>
          <button
            onClick={() => {
              updateField("propertyType", "local");
              updateField("propertySubtype", "Otros");
            }}
            className={cn(
              "h-10 rounded-lg text-sm font-medium transition-all duration-200",
              formData.propertyType === "local"
                ? "bg-white text-gray-900 shadow-md"
                : "bg-gray-100 text-gray-600",
            )}
          >
            Local
          </button>
          <button
            onClick={() => {
              updateField("propertyType", "solar");
              updateField("propertySubtype", "Suelo residencial");
            }}
            className={cn(
              "col-span-1 h-10 rounded-lg text-sm font-medium transition-all duration-200",
              formData.propertyType === "solar"
                ? "bg-white text-gray-900 shadow-md"
                : "bg-gray-100 text-gray-600",
            )}
          >
            Solar
          </button>
          <button
            onClick={() => {
              updateField("propertyType", "garaje");
              updateField("propertySubtype", "Individual");
            }}
            className={cn(
              "col-span-2 h-10 rounded-lg text-sm font-medium transition-all duration-200",
              formData.propertyType === "garaje"
                ? "bg-white text-gray-900 shadow-md"
                : "bg-gray-100 text-gray-600",
            )}
          >
            Garaje
          </button>
        </div>
      </div>

      {/* Property Subtype Section */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-gray-900">
          Subtipo de Propiedad
        </h3>
        <Select
          value={
            formData.propertySubtype ||
            (formData.propertyType === "piso"
              ? "Piso"
              : formData.propertyType === "casa"
                ? "Casa"
                : formData.propertyType === "local"
                  ? "Otros"
                  : formData.propertyType === "solar"
                    ? "Suelo residencial"
                    : formData.propertyType === "garaje"
                      ? "Individual"
                      : "")
          }
          onValueChange={(value) => updateField("propertySubtype", value)}
        >
          <SelectTrigger className="h-10 border-0 shadow-md">
            <SelectValue placeholder="Seleccionar subtipo" />
          </SelectTrigger>
          <SelectContent>
            {formData.propertyType === "piso" && (
              <>
                <SelectItem value="Tríplex">Tríplex</SelectItem>
                <SelectItem value="Dúplex">Dúplex</SelectItem>
                <SelectItem value="Ático">Ático</SelectItem>
                <SelectItem value="Estudio">Estudio</SelectItem>
                <SelectItem value="Loft">Loft</SelectItem>
                <SelectItem value="Piso">Piso</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Bajo">Bajo</SelectItem>
              </>
            )}
            {formData.propertyType === "casa" && (
              <>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Casa adosada">Casa adosada</SelectItem>
                <SelectItem value="Casa pareada">Casa pareada</SelectItem>
                <SelectItem value="Chalet">Chalet</SelectItem>
                <SelectItem value="Casa rústica">Casa rústica</SelectItem>
                <SelectItem value="Bungalow">Bungalow</SelectItem>
              </>
            )}
            {formData.propertyType === "local" && (
              <>
                <SelectItem value="Residencial">Residencial</SelectItem>
                <SelectItem value="Otros">Otros</SelectItem>
                <SelectItem value="Mixto residencial">
                  Mixto residencial
                </SelectItem>
                <SelectItem value="Oficinas">Oficinas</SelectItem>
                <SelectItem value="Hotel">Hotel</SelectItem>
              </>
            )}
            {formData.propertyType === "solar" && (
              <>
                <SelectItem value="Suelo residencial">
                  Suelo residencial
                </SelectItem>
                <SelectItem value="Suelo industrial">
                  Suelo industrial
                </SelectItem>
                <SelectItem value="Suelo rústico">Suelo rústico</SelectItem>
              </>
            )}
            {formData.propertyType === "garaje" && (
              <>
                <SelectItem value="Moto">Moto</SelectItem>
                <SelectItem value="Doble">Doble</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Agent Section */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-gray-900">Agente</h3>
        <Select
          value={formData.agentId}
          onValueChange={(value) => updateField("agentId", value)}
        >
          <SelectTrigger className="h-10 border-0 shadow-md">
            <SelectValue placeholder="Seleccionar agente" />
          </SelectTrigger>
          <SelectContent>
            {state.agents?.map((agent: Agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900">Propietarios</h3>
          <Button
            variant="outline"
            size="sm"
            className="flex h-8 items-center space-x-2"
            onClick={() => setShowContactPopup(true)}
          >
            <Plus className="h-3 w-3" />
            <span>Agregar</span>
          </Button>
        </div>

        {/* Contact Select with Search */}
        <Select
          value={formData.selectedContactIds[0]} // We'll handle multiple selection differently
          onValueChange={(value) => {
            if (!formData.selectedContactIds.includes(value)) {
              // Find the contact to add
              const contact = contactsToDisplay.find(
                (c) => c.id.toString() === value,
              );
              if (contact) {
                updateFormData({
                  selectedContactIds: [...formData.selectedContactIds, value],
                  selectedContacts: [...formData.selectedContacts, contact],
                });
              }
            }
          }}
        >
          <SelectTrigger className="h-10 border-0 shadow-md">
            <SelectValue placeholder="Añadir propietario" />
          </SelectTrigger>
          <SelectContent>
            <div className="flex items-center px-3 pb-2">
              <input
                className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Buscar por nombre, email, teléfono o DNI..."
                value={contactSearch}
                onChange={(e) => handleContactSearchChange(e.target.value)}
              />
            </div>
            <Separator className="mb-2" />
            {isSearching ? (
              <div className="py-3 text-center text-sm text-gray-500">
                Buscando contactos...
              </div>
            ) : contactsToDisplay.length === 0 && contactSearch.trim() ? (
              <div className="py-3 text-center text-sm text-gray-500">
                No se encontraron contactos
              </div>
            ) : contactsToDisplay.length === 0 ? (
              <div className="py-3 text-center text-sm text-gray-500">
                Escribe para buscar contactos
              </div>
            ) : (
              contactsToDisplay.map((contact: Contact) => (
                <SelectItem
                  key={contact.id}
                  value={contact.id.toString()}
                  disabled={formData.selectedContactIds.includes(
                    contact.id.toString(),
                  )}
                >
                  {contact.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Display selected contacts */}
        {formData.selectedContacts.length > 0 && (
          <div className="mt-2 space-y-1">
            {formData.selectedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-md bg-gradient-to-r from-amber-50/50 to-rose-50/50 px-3 py-2 shadow-md transition-all duration-200 hover:from-amber-50/40 hover:to-rose-50/40"
              >
                <span className="text-sm font-semibold">{contact.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => toggleContact(contact.id.toString())}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleNext}
            className="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Contact Creation Popup */}
      <QuickContactModal
        open={showContactPopup}
        onOpenChange={setShowContactPopup}
        onSuccess={handleContactCreated}
      />
    </div>
  );
}
