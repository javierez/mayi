"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
import { Label } from "~/components/ui/label";
import { AlertCircle, Loader2, User, Search, X } from "lucide-react";
import { createTaskWithAuth } from "~/server/queries/task";
import { searchContactsWithAuth } from "~/server/queries/contact";
import { listListingsForContactWithAuth } from "~/server/queries/listing";
import { findListingContactIdAction } from "~/server/actions/contact-activity";
import { useSession } from "~/lib/auth-client";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { ScrollArea } from "~/components/ui/scroll-area";
import Image from "next/image";

interface Contact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Listing {
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
  contactType?: "owner" | "buyer" | null;
}

interface GlobalTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export function GlobalTaskModal({
  open,
  onOpenChange,
  onSuccess,
}: GlobalTaskModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState({
    listings: false,
    saving: false,
    searching: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    contactId: "",
    listingId: "",
    agentId: "",
  });

  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showPropertySearch, setShowPropertySearch] = useState(false);

  // Debounce search queries to prevent excessive API calls
  const debouncedContactSearchQuery = useDebounce(contactSearchQuery, 300);

  // Agents list - simplified to just current user
  const agents = session?.user
    ? [
        {
          id: session.user.id,
          name: session.user.name || "",
          firstName: session.user.name?.split(" ")[0] ?? undefined,
          lastName: session.user.name?.split(" ")[1] ?? undefined,
        },
      ]
    : [];

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        contactId: "",
        listingId: "",
        agentId: session?.user?.id ?? "",
      });
      setSelectedContact(null);
      setSelectedListing(null);
      setListings([]);
      setSaveError(null);
      setContactSearchQuery("");
      setPropertySearchQuery("");
      setSearchResults([]);
      setShowContactSearch(false);
      setShowPropertySearch(false);
    }
  }, [open, session?.user?.id]);

  // Search contacts when debounced query changes
  useEffect(() => {
    if (!open || !showContactSearch) return;

    if (debouncedContactSearchQuery.length >= 2) {
      void searchContacts(debouncedContactSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedContactSearchQuery, open, showContactSearch]);

  // Fetch listings when contact is selected and property search is shown
  useEffect(() => {
    if (!open || !selectedContact || !showPropertySearch) return;

    const fetchListings = async () => {
      setLoading((prev) => ({ ...prev, listings: true }));
      try {
        const contactListings = await listListingsForContactWithAuth(
          selectedContact.contactId,
          undefined,
        );
        setListings(contactListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setLoading((prev) => ({ ...prev, listings: false }));
      }
    };

    void fetchListings();
  }, [open, selectedContact, showPropertySearch]);

  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading((prev) => ({ ...prev, searching: true }));
    try {
      const contactsData = await searchContactsWithAuth(query);
      // Transform the data to match our interface
      const formattedContacts: Contact[] = contactsData.map((contact) => {
        const [firstName, ...lastNameParts] = contact.name.split(" ");
        return {
          contactId: contact.id,
          firstName: firstName ?? "",
          lastName: lastNameParts.join(" ") ?? "",
          email: undefined,
        };
      });
      setSearchResults(formattedContacts);
    } catch (error) {
      console.error("Error searching contacts:", error);
      setSearchResults([]);
    } finally {
      setLoading((prev) => ({ ...prev, searching: false }));
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({ ...prev, contactId: contact.contactId.toString() }));
    setShowContactSearch(false);
    setContactSearchQuery("");
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setFormData((prev) => ({ ...prev, contactId: "", listingId: "" }));
    setSelectedListing(null);
    setContactSearchQuery("");
    setShowPropertySearch(false);
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    setFormData((prev) => ({ ...prev, listingId: listing.listingId.toString() }));
    setShowPropertySearch(false);
    setPropertySearchQuery("");
  };

  const handleClearListing = () => {
    setSelectedListing(null);
    setFormData((prev) => ({ ...prev, listingId: "" }));
    setPropertySearchQuery("");
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setSaveError("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading((prev) => ({ ...prev, saving: true }));
    setSaveError(null);

    try {
      const selectedUserId = formData.agentId ?? session?.user?.id ?? "";

      // Get listingContactId if both contact and listing are selected
      let listingContactId: bigint | undefined;
      if (formData.contactId && formData.listingId) {
        const result = await findListingContactIdAction(
          BigInt(formData.contactId),
          BigInt(formData.listingId),
        );
        if (result.success && result.listingContactId) {
          listingContactId = result.listingContactId;
        }
      }

      const taskData = {
        userId: selectedUserId,
        title: formData.title,
        description: formData.description,
        completed: false,
        isActive: true,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dueTime: formData.dueDate ? formData.dueTime || "00:00" : undefined,
        // Entity associations (all optional)
        contactId: formData.contactId ? BigInt(formData.contactId) : undefined,
        listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
        listingContactId,
        dealId: undefined,
        appointmentId: undefined,
        prospectId: undefined,
      };

      const savedTask = await createTaskWithAuth(taskData);

      if (!savedTask) {
        throw new Error("Failed to save task");
      }

      // Success - close modal and call success callback
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving task:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save task",
      );
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedContact(null);
    setSelectedListing(null);
    setListings([]);
    setSaveError(null);
    setShowContactSearch(false);
    setShowPropertySearch(false);
  };

  // Filter listings based on search query
  const filteredListings = listings.filter((listing) => {
    if (
      selectedListing &&
      listing.listingId.toString() === selectedListing.listingId.toString()
    ) {
      return false;
    }

    if (propertySearchQuery.length === 0) {
      return true;
    }

    const query = propertySearchQuery.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.referenceNumber?.toLowerCase().includes(query) ||
      listing.city?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Tarea</DialogTitle>
          <DialogDescription>
            Completa los detalles de la nueva tarea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <Input
            placeholder="Título de la tarea *"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          {/* Description */}
          <div className="relative">
            <Textarea
              placeholder="Descripción de la tarea *"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-[80px] pr-10"
            />
            <div className="absolute right-2 top-2">
              <PushToTalkWhisperButton
                onTranscript={(text) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: prev.description
                      ? `${prev.description} ${text}`.trim()
                      : text,
                  }));
                }}
                language="es"
                disabled={loading.saving}
              />
            </div>
          </div>

          {/* Contact Selection */}
          <div className="space-y-2">
            <Label>Contacto (opcional)</Label>

            {selectedContact ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-4 w-4 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {selectedContact.firstName} {selectedContact.lastName}
                      </div>
                      {selectedContact.email && (
                        <div className="text-xs text-muted-foreground truncate">
                          {selectedContact.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearContact}
                    className="h-6 w-6 shrink-0 p-0"
                    title="Quitar contacto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : !showContactSearch ? (
              <Button
                variant="outline"
                onClick={() => setShowContactSearch(true)}
                className="w-full justify-start text-gray-500"
              >
                <User className="mr-2 h-4 w-4" />
                Añadir contacto
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Buscar contactos..."
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[200px]">
                  {loading.searching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : contactSearchQuery.length < 2 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Escribe al menos 2 caracteres para buscar
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No se encontraron contactos
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchResults.map((contact) => (
                        <div
                          key={contact.contactId.toString()}
                          className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-3 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                          onClick={() => handleContactSelect(contact)}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {contact.firstName} {contact.lastName}
                              </div>
                              {contact.email && (
                                <div className="truncate text-xs text-gray-500">
                                  {contact.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowContactSearch(false);
                    setContactSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Property Selection */}
          {selectedContact && (
            <div className="space-y-2">
              <Label>Propiedad (opcional)</Label>

              {selectedListing ? (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      {selectedListing.imageUrl && (
                        <Image
                          src={selectedListing.imageUrl}
                          alt={selectedListing.title ?? "Property"}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {selectedListing.title ?? "Sin título"}
                        </div>
                        {selectedListing.referenceNumber && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {selectedListing.referenceNumber}
                          </div>
                        )}
                        {selectedListing.city && (
                          <div className="text-xs text-muted-foreground">
                            {selectedListing.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearListing}
                      className="h-6 w-6 shrink-0 p-0"
                      title="Quitar propiedad"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : !showPropertySearch ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPropertySearch(true)}
                  className="w-full justify-start text-gray-500"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Añadir propiedad
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={propertySearchQuery}
                      onChange={(e) => setPropertySearchQuery(e.target.value)}
                      placeholder="Buscar propiedades..."
                      className="pl-10"
                    />
                  </div>

                  <ScrollArea className="h-[200px]">
                    {loading.listings ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : filteredListings.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron propiedades
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredListings.map((listing, index) => (
                          <div
                            key={`${listing.listingId.toString()}-${index}`}
                            className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-2 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                            onClick={() => handleListingSelect(listing)}
                          >
                            <div className="flex items-start gap-2">
                              {listing.imageUrl && (
                                <Image
                                  src={listing.imageUrl}
                                  alt={listing.title ?? "Property"}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded object-cover shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-600 truncate">
                                  {listing.title ?? "Sin título"}
                                </div>
                                {listing.referenceNumber && (
                                  <div className="text-xs text-gray-400">
                                    Ref: {listing.referenceNumber}
                                  </div>
                                )}
                                {listing.city && (
                                  <div className="text-xs text-gray-400">
                                    {listing.city}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPropertySearch(false);
                      setPropertySearchQuery("");
                    }}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Agent Assignment */}
          <div className="space-y-2">
            <Label htmlFor="agent-select">Asignar a</Label>
            <Select
              value={formData.agentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, agentId: value }))
              }
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name ?? agent.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Fecha límite</Label>
              <Input
                id="due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className="h-8 text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-time">Hora límite</Label>
              <Input
                id="due-time"
                type="time"
                value={formData.dueTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueTime: e.target.value,
                  }))
                }
                className="h-8 text-gray-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{saveError}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">* Campos requeridos</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading.saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  loading.saving ||
                  !formData.title.trim() ||
                  !formData.description.trim()
                }
              >
                {loading.saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Tarea"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing the modal state
export function useGlobalTaskModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
  };
}

// Simple trigger component for opening the modal
interface GlobalTaskModalTriggerProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function GlobalTaskModalTrigger({
  children,
  onSuccess,
}: GlobalTaskModalTriggerProps) {
  const { isOpen, openModal, closeModal } = useGlobalTaskModal();

  return (
    <>
      <div onClick={openModal} className="cursor-pointer">
        {children}
      </div>
      <GlobalTaskModal
        open={isOpen}
        onOpenChange={closeModal}
        onSuccess={onSuccess}
      />
    </>
  );
}
