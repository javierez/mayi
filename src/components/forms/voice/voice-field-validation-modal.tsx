"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type {
  ExtractedFieldResult,
  EnhancedExtractedPropertyData,
} from "~/types/textract-enhanced";
import { saveVoiceProperty } from "~/server/queries/forms/voice/save-voice-property";
import { searchContactsForFormWithAuth } from "~/server/queries/contact";
import { QuickContactModal } from "~/components/contactos/quick-contact-modal";

// Type definitions for contact selection
interface Contact {
  id: number;
  name: string;
}

interface NewContact {
  contactId: number | string;
  firstName: string;
  lastName: string;
}

// Spanish field labels mapping
const FIELD_LABELS: Record<string, string> = {
  // Basic Information
  title: "Título",
  description: "Descripción",
  propertyType: "Tipo de Propiedad",
  propertySubtype: "Subtipo",

  // Specifications
  bedrooms: "Dormitorios",
  bathrooms: "Baños",
  squareMeter: "Metros Cuadrados",
  yearBuilt: "Año de Construcción",
  builtSurfaceArea: "Superficie Construida",
  conservationStatus: "Estado de Conservación",

  // Location
  street: "Dirección",
  addressDetails: "Detalles de Dirección",
  postalCode: "Código Postal",

  // Energy
  energyConsumptionScale: "Certificado Energético",
  energyConsumptionValue: "Consumo Energético",
  emissionsScale: "Escala de Emisiones",

  // Basic Amenities
  hasElevator: "Ascensor",
  hasGarage: "Garaje",
  hasStorageRoom: "Trastero",

  // Features
  terrace: "Terraza",
  pool: "Piscina",
  garden: "Jardín",
  gym: "Gimnasio",
  communityPool: "Piscina Comunitaria",
  privatePool: "Piscina Privada",

  // Property Condition
  furnished: "Amueblado",
  brandNew: "Nuevo",
  needsRenovation: "Necesita Reforma",

  // Kitchen
  kitchenType: "Tipo de Cocina",
  openKitchen: "Cocina Abierta",
  furnishedKitchen: "Cocina Amueblada",

  // Appliances
  oven: "Horno",
  microwave: "Microondas",
  washingMachine: "Lavadora",
  fridge: "Frigorífico",
  tv: "Televisión",
  dishwasher: "Lavavajillas",
  stoneware: "Vajilla",
  appliancesIncluded: "Electrodomésticos Incluidos",

  // Listing Details
  price: "Precio",
  listingType: "Tipo de Operación",
  isFurnished: "Amueblado",
  hasKeys: "Con Llaves",
  petsAllowed: "Mascotas Permitidas",
  studentFriendly: "Para Estudiantes",
  internet: "Internet",

  // Additional
  orientation: "Orientación",
  airConditioningType: "Aire Acondicionado",
  heatingType: "Tipo de Calefacción",
};

interface VoiceFieldValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedFields: ExtractedFieldResult[];
  onConfirm: (confirmedData: EnhancedExtractedPropertyData) => void;
}

export function VoiceFieldValidationModal({
  isOpen,
  onClose,
  extractedFields,
  onConfirm,
}: VoiceFieldValidationModalProps) {
  // Initialize all fields as checked
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Contact selection state
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showContactPopup, setShowContactPopup] = useState(false);

  // Initialize checked fields when modal opens or fields change
  useEffect(() => {
    if (isOpen && extractedFields.length > 0) {
      const allFieldIds = extractedFields.map(
        (field) => `${field.dbTable}.${field.dbColumn}`,
      );
      setCheckedFields(new Set(allFieldIds));
    }
  }, [isOpen, extractedFields]);

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

  // Helper function to toggle contact selection
  const toggleContact = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      setSelectedContactIds(
        selectedContactIds.filter((id) => id !== contactId),
      );
    } else {
      setSelectedContactIds([...selectedContactIds, contactId]);
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

      // Auto-select the new contact
      setSelectedContactIds([
        ...selectedContactIds,
        contact.contactId.toString(),
      ]);
    }
  };

  // Format field value for display
  const formatFieldValue = (field: ExtractedFieldResult) => {
    if (typeof field.value === "boolean") {
      return field.value ? "Sí" : "No";
    }

    if (field.dbColumn === "price" && typeof field.value === "number") {
      return field.value.toLocaleString("es-ES", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      });
    }

    if (
      (field.dbColumn === "squareMeter" ||
        field.dbColumn === "builtSurfaceArea") &&
      typeof field.value === "number"
    ) {
      return `${field.value} m²`;
    }

    if (field.dbColumn === "bedrooms" && typeof field.value === "number") {
      return `${field.value} dormitorio${field.value !== 1 ? "s" : ""}`;
    }

    if (field.dbColumn === "bathrooms" && typeof field.value === "number") {
      return `${field.value} baño${field.value !== 1 ? "s" : ""}`;
    }

    if (field.dbColumn === "yearBuilt" && typeof field.value === "number") {
      return `Año ${field.value}`;
    }

    if (field.dbColumn === "listingType" && typeof field.value === "string") {
      const typeMap: Record<string, string> = {
        Sale: "Venta",
        Rent: "Alquiler",
        RentWithOption: "Alquiler con Opción",
        Transfer: "Traspaso",
        RoomSharing: "Compartir Habitación",
      };
      return typeMap[field.value] ?? field.value;
    }

    if (field.dbColumn === "propertyType" && typeof field.value === "string") {
      const typeMap: Record<string, string> = {
        piso: "Piso",
        casa: "Casa",
        chalet: "Chalet",
        apartamento: "Apartamento",
        local: "Local",
        garaje: "Garaje",
        estudio: "Estudio",
        loft: "Loft",
        dúplex: "Dúplex",
        ático: "Ático",
      };
      return typeMap[field.value] ?? field.value;
    }

    if (
      field.dbColumn === "energyConsumptionScale" &&
      typeof field.value === "string"
    ) {
      return `Certificado ${field.value}`;
    }

    if (
      field.dbColumn === "conservationStatus" &&
      typeof field.value === "number"
    ) {
      const statusMap: Record<number, string> = {
        1: "Excelente",
        2: "Bueno",
        3: "Regular",
        4: "Malo",
        6: "Obra Nueva",
      };
      return statusMap[field.value] ?? field.value.toString();
    }

    if (field.dbColumn === "orientation" && typeof field.value === "string") {
      const orientationMap: Record<string, string> = {
        norte: "Norte",
        sur: "Sur",
        este: "Este",
        oeste: "Oeste",
        noreste: "Noreste",
        noroeste: "Noroeste",
        sureste: "Sureste",
        suroeste: "Suroeste",
      };
      return orientationMap[field.value] ?? field.value;
    }

    return String(field.value);
  };

  // Handle checkbox toggle
  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    setCheckedFields((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      return newSet;
    });
  };

  // Build final data object with only checked fields
  const buildConfirmedData = (): EnhancedExtractedPropertyData => {
    const data: EnhancedExtractedPropertyData = {};
    extractedFields.forEach((field) => {
      const fieldId = `${field.dbTable}.${field.dbColumn}`;
      if (checkedFields.has(fieldId) && field.dbTable === "properties") {
        (data as Record<string, unknown>)[field.dbColumn] = field.value;
      }
    });
    return data;
  };

  // Handle confirm and create property
  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      // Validate contact selection
      if (selectedContactIds.length === 0) {
        toast.error("Por favor, selecciona al menos un contacto.");
        setIsLoading(false);
        return;
      }

      // Filter only checked fields
      const fieldsToSave = extractedFields.filter((field) => {
        const fieldId = `${field.dbTable}.${field.dbColumn}`;
        return checkedFields.has(fieldId);
      });

      // Save property with voice data and contact IDs
      const result = await saveVoiceProperty(fieldsToSave, selectedContactIds);

      if (result.success && result.propertyId) {
        toast.success("Propiedad creada exitosamente");

        // Call the original onConfirm for compatibility
        const confirmedData = buildConfirmedData();
        onConfirm(confirmedData);

        // Redirect to property detail page
        if (result.listingId) {
          router.push(`/propiedades/${result.listingId}`);
        } else {
          router.push("/propiedades");
        }
      } else {
        toast.error(result.error ?? "Error al crear la propiedad");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Error al crear la propiedad");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            Campos identificados
          </DialogTitle>
        </DialogHeader>

        {/* Contact Selection Section */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium text-gray-900">Contactos</h3>
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

          {/* Contact Search */}
          <Input
            placeholder="Escribe para buscar contactos..."
            value={contactSearch}
            onChange={(e) => handleContactSearchChange(e.target.value)}
            className="h-10 border-0 shadow-md"
          />

          {/* Contact List */}
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg p-2 shadow-md">
            {isSearching ? (
              <p className="py-3 text-center text-sm text-gray-500">
                Buscando contactos...
              </p>
            ) : searchResults.length === 0 && contactSearch.trim() ? (
              <p className="py-3 text-center text-sm text-gray-500">
                No se encontraron contactos
              </p>
            ) : searchResults.length === 0 ? (
              <p className="py-3 text-center text-sm text-gray-500">
                Escribe para buscar contactos
              </p>
            ) : (
              searchResults.map((contact: Contact) => (
                <div
                  key={contact.id}
                  className={cn(
                    "flex cursor-pointer items-center space-x-2 rounded-md p-2 transition-colors",
                    selectedContactIds.includes(contact.id.toString())
                      ? "bg-gray-100"
                      : "hover:bg-gray-50",
                  )}
                  onClick={() => toggleContact(contact.id.toString())}
                >
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{contact.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fields Checklist */}
        <div className="flex-1 overflow-y-auto py-4">
          {extractedFields.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No se encontraron campos
            </div>
          ) : (
            <div className="space-y-2">
              {extractedFields.map((field) => {
                const fieldId = `${field.dbTable}.${field.dbColumn}`;
                const isChecked = checkedFields.has(fieldId);

                return (
                  <div
                    key={fieldId}
                    className="flex items-center space-x-3 rounded-lg bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                  >
                    <Checkbox
                      id={fieldId}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(fieldId, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={fieldId}
                      className="flex flex-1 cursor-pointer items-center justify-between"
                    >
                      <span className="text-sm font-normal text-gray-600">
                        {FIELD_LABELS[field.dbColumn] ?? field.dbColumn}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatFieldValue(field)}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleConfirm}
            disabled={checkedFields.size === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Crear Propiedad
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Contact Creation Popup */}
      <QuickContactModal
        open={showContactPopup}
        onOpenChange={setShowContactPopup}
        onSuccess={handleContactCreated}
      />
    </Dialog>
  );
}
