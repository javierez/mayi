"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Mic, AlertCircle, Loader2, User, Building } from "lucide-react";
import { createTaskWithAuth } from "~/server/queries/task";
import { searchContactsWithAuth } from "~/server/queries/contact";
import { getContactListingsForTasksWithAuth } from "~/server/queries/user-comments";
import { useSession } from "~/lib/auth-client";

interface Contact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string;
}

interface ContactListing {
  listingContactId: number;
  listingId: number;
  contactType: string;
  street: string | null;
  city: string | null;
  province: string | null;
  propertyType: string | null;
  listingType: string | null;
  price: string | null;
  status: string | null;
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
  const [step, setStep] = useState<1 | 2>(1);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [contactListings, setContactListings] = useState<ContactListing[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
      setStep(1);
      setSelectedContact(null);
      setContactListings([]);
      setSaveError(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, session?.user?.id]);

  // Search contacts when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      void searchContacts(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

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

  const loadContactListings = async (contactId: bigint) => {
    setLoading((prev) => ({ ...prev, listings: true }));
    try {
      const listings = await getContactListingsForTasksWithAuth(contactId);
      setContactListings(listings);
    } catch (error) {
      console.error("Error loading contact listings:", error);
      setContactListings([]);
    } finally {
      setLoading((prev) => ({ ...prev, listings: false }));
    }
  };

  const handleContactSelect = async (contactId: string) => {
    const contact = searchResults.find(
      (c) => c.contactId.toString() === contactId,
    );
    if (contact) {
      setSelectedContact(contact);
      setFormData((prev) => ({ ...prev, contactId }));
      await loadContactListings(contact.contactId);
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.contactId
    ) {
      setSaveError("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading((prev) => ({ ...prev, saving: true }));
    setSaveError(null);

    try {
      const selectedUserId = formData.agentId ?? session?.user?.id ?? "";

      const taskData = {
        userId: selectedUserId,
        title: formData.title,
        description: formData.description,
        completed: false,
        isActive: true,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dueTime: formData.dueDate ? formData.dueTime || "00:00" : undefined,
        // Entity associations
        contactId: BigInt(formData.contactId),
        listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
        listingContactId: formData.listingId
          ? BigInt(
              contactListings.find(
                (l) => l.listingId.toString() === formData.listingId,
              )?.listingContactId ?? 0,
            )
          : undefined,
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

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setFormData((prev) => ({ ...prev, listingId: "" }));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
    setSelectedContact(null);
    setContactListings([]);
    setSaveError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Crear Tarea - Seleccionar Contacto"
              : "Crear Tarea - Detalles"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Selecciona el contacto para quien quieres crear la tarea"
              : "Completa los detalles de la tarea"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-search">Buscar Contacto *</Label>
                <Input
                  id="contact-search"
                  type="text"
                  placeholder="Escribe para buscar contactos por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                  <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
                    {loading.searching && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">
                          Buscando contactos...
                        </span>
                      </div>
                    )}

                    {!loading.searching && searchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <User className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          No se encontraron contactos para &quot;{searchQuery}
                          &quot;
                        </p>
                      </div>
                    )}

                    {!loading.searching &&
                      searchResults.map((contact) => (
                        <div
                          key={contact.contactId.toString()}
                          onClick={() =>
                            handleContactSelect(contact.contactId.toString())
                          }
                          className="flex cursor-pointer items-center gap-3 border-b p-3 transition-colors last:border-b-0 hover:bg-gray-50"
                        >
                          <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </div>
                            {contact.email && (
                              <div className="truncate text-xs text-gray-500">
                                {contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Escribe al menos 2 caracteres para buscar
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Selected contact info */}
              {selectedContact && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    Cambiar
                  </Button>
                </div>
              )}

              <Input
                placeholder="Título de la tarea *"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />

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
                <button
                  type="button"
                  className="absolute right-2 top-2 p-1 text-gray-400 transition-colors hover:text-gray-600"
                  title="Próximamente: Grabación de voz"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="space-y-2">
                  <Label htmlFor="listing-select">Propiedad (opcional)</Label>
                  <Select
                    value={formData.listingId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, listingId: value }))
                    }
                    disabled={loading.listings}
                  >
                    <SelectTrigger className="h-8 text-gray-500">
                      <SelectValue
                        placeholder={
                          loading.listings
                            ? "Cargando propiedades..."
                            : "Sin propiedad específica"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contactListings.length === 0 ? (
                        <SelectItem value="no-properties" disabled>
                          No hay propiedades asociadas
                        </SelectItem>
                      ) : (
                        contactListings.map((listing) => (
                          <SelectItem
                            key={listing.listingContactId}
                            value={listing.listingId.toString()}
                          >
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 opacity-60" />
                              <div className="flex flex-col">
                                <span>
                                  {listing.street ?? "Sin dirección"} -{" "}
                                  {listing.city}, {listing.province}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({listing.contactType})
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              {saveError && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{saveError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
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
            </div>
          )}
        </div>
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
