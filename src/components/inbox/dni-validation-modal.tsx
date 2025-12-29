"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Search, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { AddressAutocomplete, type LocationData } from "~/components/propiedades/form/address-autocomplete";
import { Badge } from "~/components/ui/badge";

export interface DNIAnalysisData {
  fullName?: string;
  documentNumber?: string;
  birthDate?: string;
  expiryDate?: string;
  // Address fields (separated)
  address?: string; // Full formatted address for display
  street?: string; // Street name with number
  addressDetails?: string; // Floor, door, etc.
  city?: string;
  postalCode?: string;
  province?: string;
}

interface Contact {
  contactId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  nif?: string | null;
}

interface RecommendedContact extends Contact {
  matchReason: "dni" | "name";
}

interface DNIValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: DNIAnalysisData;
  suggestedContactId?: number;
  onConfirm: (contactId: number, data: DNIAnalysisData) => Promise<void>;
}

type ModalStep = "review" | "saving" | "success";

// Floating Label Address Field - wrapper for AddressAutocomplete with floating label style
function FloatingLabelAddressField({
  value,
  onChange,
  onLocationSelected,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onLocationSelected: (data: LocationData) => void;
  placeholder: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldShowLabel = isFocused || hasValue;

  return (
    <motion.div
      className="relative"
      animate={{
        marginTop: shouldShowLabel ? "32px" : "10px",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <AnimatePresence>
        {shouldShowLabel && (
          <motion.label
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -12 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute -top-2 left-0 z-10 px-2 text-xs font-medium text-gray-600"
          >
            {placeholder}
          </motion.label>
        )}
      </AnimatePresence>
      <div
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <AddressAutocomplete
          value={value}
          onChange={onChange}
          onLocationSelected={onLocationSelected}
          placeholder={shouldShowLabel ? "" : placeholder}
          className="h-10 border border-gray-200 shadow-md transition-all duration-200"
        />
      </div>
    </motion.div>
  );
}

export function DNIValidationModal({
  isOpen,
  onClose,
  analysisData,
  suggestedContactId,
  onConfirm,
}: DNIValidationModalProps) {
  const [step, setStep] = useState<ModalStep>("review");
  const [editedData, setEditedData] = useState<DNIAnalysisData>(analysisData);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    suggestedContactId ?? null
  );

  // Recommended contact state
  const [recommendedContact, setRecommendedContact] = useState<RecommendedContact | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("review");

      // Combine all address fields into "street" for Google autocomplete to work
      // Leave other address fields blank until autocomplete fills them
      const fullAddressForAutocomplete = [
        analysisData.street,
        analysisData.addressDetails,
        analysisData.postalCode,
        analysisData.city,
        analysisData.province,
        // Fallback to the full address if no individual fields
        !analysisData.street && analysisData.address,
      ].filter(Boolean).join(", ");

      setEditedData({
        ...analysisData,
        street: fullAddressForAutocomplete || undefined,
        addressDetails: undefined,
        city: undefined,
        postalCode: undefined,
        province: undefined,
        address: undefined,
      });

      setSelectedContactId(suggestedContactId ?? null);
      setRecommendedContact(null);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, analysisData, suggestedContactId]);

  // Auto-search for recommended contact when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (suggestedContactId) return; // Already have a suggested contact

    const searchForRecommendedContact = async () => {
      const documentNumber = analysisData.documentNumber;
      const fullName = analysisData.fullName;

      if (!documentNumber && !fullName) return;

      setIsLoadingRecommendation(true);

      try {
        // First, try to find by DNI number (more precise)
        if (documentNumber) {
          const params = new URLSearchParams();
          params.set("search", documentNumber);
          params.set("limit", "5");

          const response = await fetch(`/api/contacts/search?${params.toString()}`);
          if (response.ok) {
            const data = (await response.json()) as { contacts: Contact[] };
            if (data.contacts.length > 0) {
              // Find exact NIF match
              const exactMatch = data.contacts.find(
                c => c.nif?.toLowerCase() === documentNumber.toLowerCase()
              );
              if (exactMatch) {
                setRecommendedContact({ ...exactMatch, matchReason: "dni" });
                setSelectedContactId(exactMatch.contactId);
                setIsLoadingRecommendation(false);
                return;
              }
            }
          }
        }

        // If no DNI match, try by name
        if (fullName) {
          const params = new URLSearchParams();
          params.set("search", fullName);
          params.set("limit", "5");

          const response = await fetch(`/api/contacts/search?${params.toString()}`);
          if (response.ok) {
            const data = (await response.json()) as { contacts: Contact[] };
            if (data.contacts.length > 0) {
              const firstMatch = data.contacts[0];
              if (firstMatch) {
                setRecommendedContact({ ...firstMatch, matchReason: "name" });
                setSelectedContactId(firstMatch.contactId);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error searching for recommended contact:", err);
      } finally {
        setIsLoadingRecommendation(false);
      }
    };

    void searchForRecommendedContact();
  }, [isOpen, analysisData.documentNumber, analysisData.fullName, suggestedContactId]);

  // Search contacts when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchContacts = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        params.set("search", searchQuery.trim());
        params.set("limit", "10");

        const response = await fetch(`/api/contacts/search?${params.toString()}`);
        if (response.ok) {
          const data = (await response.json()) as { contacts: Contact[] };
          setSearchResults(data.contacts);
        }
      } catch (err) {
        console.error("Error searching contacts:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(() => {
      void searchContacts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleEditField = (field: keyof DNIAnalysisData, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleAddressSelected = (data: LocationData) => {
    const { addressComponents } = data;
    // Build street with number
    const street = [addressComponents.route, addressComponents.streetNumber]
      .filter(Boolean)
      .join(" ");

    const newCity = addressComponents.locality || undefined;
    const newPostalCode = addressComponents.postalCode || undefined;
    const newProvince = addressComponents.administrativeAreaLevel1 || undefined;
    const newAddressDetails = addressComponents.subpremise || undefined;

    // Build full address from components
    const addressParts = [
      street,
      newAddressDetails,
      [newPostalCode, newCity].filter(Boolean).join(" "),
      newProvince,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : undefined;

    setEditedData((prev) => ({
      ...prev,
      address: fullAddress,
      street: street || undefined,
      addressDetails: newAddressDetails,
      city: newCity,
      postalCode: newPostalCode,
      province: newProvince,
    }));
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContactId(contact.contactId);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleSave = async () => {
    if (!selectedContactId) {
      setError("Por favor, selecciona un contacto");
      return;
    }

    setStep("saving");
    setIsSaving(true);
    setError(null);

    try {
      await onConfirm(selectedContactId, editedData);
      setStep("success");
      toast.success("Datos del DNI guardados correctamente");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar los datos";
      setError(errorMessage);
      toast.error("Error al guardar", { description: errorMessage });
      setStep("review");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnyData =
    editedData.fullName ??
    editedData.documentNumber ??
    editedData.birthDate ??
    editedData.expiryDate ??
    editedData.address;

  // Get the currently selected contact info for display
  const getSelectedContactDisplay = (): Contact | null => {
    if (!selectedContactId) return null;

    // Check if it's the recommended contact
    if (recommendedContact?.contactId === selectedContactId) {
      return recommendedContact;
    }

    // Check in search results
    return searchResults.find(c => c.contactId === selectedContactId) ?? null;
  };

  const selectedContact = getSelectedContactDisplay();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto backdrop-blur-sm" overlayClassName="bg-black/20 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "review" && "Datos extraídos del DNI/NIE"}
            {step === "saving" && "Guardando..."}
            {step === "success" && "Guardado"}
          </DialogTitle>
          <DialogDescription>
            {step === "review" &&
              "Revisa los datos y selecciona el contacto para guardarlos"}
          </DialogDescription>
        </DialogHeader>

        {/* Review Step - Single Page */}
        {step === "review" && (
          <div className="space-y-5">
            {!hasAnyData ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No se pudieron extraer datos del documento.
                  <br />
                  Asegúrate de que es un DNI/NIE legible.
                </p>
              </div>
            ) : (
              <>
                {/* DNI Data Fields */}
                <div className="space-y-2">
                  <FloatingLabelInput
                    id="fullName"
                    value={editedData.fullName ?? ""}
                    onChange={(value) => handleEditField("fullName", value)}
                    placeholder="Nombre completo"
                  />

                  <FloatingLabelInput
                    id="documentNumber"
                    value={editedData.documentNumber ?? ""}
                    onChange={(value) => handleEditField("documentNumber", value)}
                    placeholder="DNI/NIE"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FloatingLabelInput
                      id="birthDate"
                      value={editedData.birthDate ?? ""}
                      onChange={(value) => handleEditField("birthDate", value)}
                      placeholder="Fecha nacimiento"
                    />
                    <FloatingLabelInput
                      id="expiryDate"
                      value={editedData.expiryDate ?? ""}
                      onChange={(value) => handleEditField("expiryDate", value)}
                      placeholder="Fecha caducidad"
                    />
                  </div>

                  {/* Address Fields */}
                  <FloatingLabelAddressField
                    value={editedData.street ?? ""}
                    onChange={(value) => handleEditField("street", value)}
                    onLocationSelected={handleAddressSelected}
                    placeholder="Calle y número"
                  />

                  <FloatingLabelInput
                    id="addressDetails"
                    value={editedData.addressDetails ?? ""}
                    onChange={(value) => handleEditField("addressDetails", value)}
                    placeholder="Piso, puerta (ej: 3º B)"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FloatingLabelInput
                      id="postalCode"
                      value={editedData.postalCode ?? ""}
                      onChange={(value) => handleEditField("postalCode", value)}
                      placeholder="Código postal"
                    />
                    <FloatingLabelInput
                      id="city"
                      value={editedData.city ?? ""}
                      onChange={(value) => handleEditField("city", value)}
                      placeholder="Ciudad"
                    />
                  </div>

                  <FloatingLabelInput
                    id="province"
                    value={editedData.province ?? ""}
                    onChange={(value) => handleEditField("province", value)}
                    placeholder="Provincia"
                  />
                </div>

                {/* Contact Selection Section */}
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700">
                    Guardar en contacto
                  </p>

                  {/* Loading state for recommendation */}
                  {isLoadingRecommendation && (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando contacto...
                    </div>
                  )}

                  {/* Recommended/Selected Contact Card */}
                  {!isLoadingRecommendation && selectedContact && (
                    <div className="relative flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      {recommendedContact?.contactId === selectedContact.contactId && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0">
                          Recomendado
                        </Badge>
                      )}
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {selectedContact.firstName} {selectedContact.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedContact.nif && `${selectedContact.nif} · `}
                          {selectedContact.email ?? selectedContact.phone ?? ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No contact selected message */}
                  {!isLoadingRecommendation && !selectedContact && !showSearchResults && (
                    <p className="text-sm text-muted-foreground py-2">
                      No se encontró ningún contacto. Busca uno a continuación.
                    </p>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      placeholder={selectedContact ? "Buscar otro contacto..." : "Buscar contacto..."}
                      className="pl-10"
                    />
                  </div>

                  {/* Search Results */}
                  {showSearchResults && searchQuery.trim() && (
                    <ScrollArea className="h-[150px] rounded-md border">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No se encontraron contactos
                        </div>
                      ) : (
                        <div className="space-y-1 p-2">
                          {searchResults.map((contact) => {
                            const isSelected = selectedContactId === contact.contactId;
                            return (
                              <div
                                key={contact.contactId}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/10"
                                    : "hover:bg-gray-100"
                                )}
                                onClick={() => handleSelectContact(contact)}
                              >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                                  <User className="h-3 w-3 text-gray-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm truncate">
                                    {contact.firstName} {contact.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {contact.nif ?? contact.email ?? contact.phone ?? ""}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Guardando datos del DNI/NIE...
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-green-600">
              Datos guardados correctamente
            </p>
          </div>
        )}

        {/* Footer */}
        {step === "review" && hasAnyData && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !selectedContactId}
            >
              Guardar
            </Button>
          </DialogFooter>
        )}

        {step === "review" && !hasAnyData && (
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
