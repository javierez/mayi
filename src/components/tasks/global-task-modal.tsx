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
import { AlertCircle, Loader2, Search, X, Mail, Phone, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { getInitials } from "~/lib/operations/task-utils";
import { createTaskWithAuth, updateTaskWithAuth } from "~/server/queries/task";
import { searchContactsWithAuth, getContactByIdWithAuth } from "~/server/queries/contact";
import { createAppointmentAction } from "~/server/actions/appointments";
import { listListingsForContactWithAuth, listContactsForListingWithAuth, listListingsCompactWithAuth, getListingCompactByIdWithAuth } from "~/server/queries/listing";
import { findListingContactIdAction } from "~/server/actions/contact-activity";
import { useSession } from "~/lib/auth-client";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { createListingContactRelationshipAction } from "~/server/actions/contact-activity";
import { QuickContactModal } from "~/components/contactos/quick-contact-modal";
import Image from "next/image";

interface Contact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  contactType?: "owner" | "buyer" | null;
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
  initialListingId?: bigint;
  initialContactId?: bigint;
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
  initialListingId,
  initialContactId,
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
    urgency: "" as "" | "1" | "2" | "3" | "4" | "5",
    createInCalendar: false,
  });

  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; firstName?: string; lastName?: string }>>([]);

  // Confirmation dialog state for creating listing-contact relationship
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [, setPendingSubmit] = useState(false);

  // Quick contact modal state
  const [showContactPopup, setShowContactPopup] = useState(false);

  // Debounce search queries to prevent excessive API calls
  const debouncedContactSearchQuery = useDebounce(contactSearchQuery, 300);
  const debouncedPropertySearchQuery = useDebounce(propertySearchQuery, 300);

  // Fetch agents when modal opens
  useEffect(() => {
    if (open) {
      const fetchAgents = async () => {
        try {
          const agentsData = await getAgentsForSelectionWithAuth();
          const formattedAgents = agentsData.map((agent) => ({
            id: agent.id,
            name: agent.name,
            firstName: agent.firstName,
            lastName: agent.lastName ?? undefined,
          }));
          setAgents(formattedAgents);
        } catch (error) {
          console.error("Error fetching agents:", error);
          // Fallback to current user if fetch fails
          if (session?.user) {
            setAgents([
              {
                id: session.user.id,
                name: session.user.name || "",
                firstName: session.user.name?.split(" ")[0] ?? undefined,
                lastName: session.user.name?.split(" ")[1] ?? undefined,
              },
            ]);
          }
        }
      };
      void fetchAgents();
    }
  }, [open, session?.user]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        contactId: initialContactId ? initialContactId.toString() : "",
        listingId: initialListingId ? initialListingId.toString() : "",
        agentId: session?.user?.id ?? "",
        urgency: "",
        createInCalendar: false,
      });
      setSelectedContact(null);
      setSelectedListing(null);
      setListings([]);
      setSaveError(null);
      setContactSearchQuery("");
      setPropertySearchQuery("");
      setSearchResults([]);
      setShowConfirmDialog(false);
      setPendingSubmit(false);
      setShowContactPopup(false);
    }
  }, [open, session?.user?.id, initialListingId, initialContactId]);

  // Fetch and set initial listing when provided
  useEffect(() => {
    if (!open || !initialListingId) return;

    const fetchInitialListingAndContacts = async () => {
      setLoading((prev) => ({ ...prev, listings: true, searching: true }));
      try {
        // Fetch listing data
        const listingData = await getListingCompactByIdWithAuth(initialListingId);

        if (listingData) {
          const listing: Listing = {
            listingId: listingData.listingId,
            title: listingData.title,
            referenceNumber: listingData.referenceNumber,
            price: listingData.price ?? "",
            listingType: listingData.listingType ?? "",
            propertyType: listingData.propertyType,
            bedrooms: listingData.bedrooms,
            bathrooms: listingData.bathrooms,
            squareMeter: listingData.squareMeter,
            city: listingData.city,
            agentName: listingData.agentName,
            imageUrl: listingData.imageUrl,
          };
          setSelectedListing(listing);
          setFormData((prev) => ({
            ...prev,
            listingId: initialListingId.toString()
          }));

          // Also fetch contacts for this listing
          try {
            const contactsData = await listContactsForListingWithAuth(
              initialListingId,
              undefined,
            );
            setSearchResults(contactsData);
          } catch (error) {
            console.error("Error loading contacts for listing:", error);
            setSearchResults([]);
          }
        }
      } catch (error) {
        console.error("Error fetching initial listing:", error);
      } finally {
        setLoading((prev) => ({ ...prev, listings: false, searching: false }));
      }
    };

    void fetchInitialListingAndContacts();
  }, [open, initialListingId]);

  // Fetch and set initial contact when provided
  useEffect(() => {
    if (!open || !initialContactId) return;

    const fetchInitialContactAndListings = async () => {
      setLoading((prev) => ({ ...prev, searching: true, listings: true }));
      try {
        // Fetch contact data
        const contactData = await getContactByIdWithAuth(Number(initialContactId));

        if (contactData) {
          const contact: Contact = {
            contactId: contactData.contactId,
            firstName: contactData.firstName,
            lastName: contactData.lastName ?? "",
            email: contactData.email,
            phone: contactData.phone,
          };
          setSelectedContact(contact);
          setFormData((prev) => ({
            ...prev,
            contactId: initialContactId.toString()
          }));

          // Also fetch listings for this contact
          try {
            const listingsData = await listListingsForContactWithAuth(
              initialContactId,
              undefined,
            );
            setListings(listingsData);
          } catch (error) {
            console.error("Error loading listings for contact:", error);
            setListings([]);
          }
        }
      } catch (error) {
        console.error("Error fetching initial contact:", error);
      } finally {
        setLoading((prev) => ({ ...prev, searching: false, listings: false }));
      }
    };

    void fetchInitialContactAndListings();
  }, [open, initialContactId]);

  // Search contacts when debounced query changes
  useEffect(() => {
    if (!open) return;

    if (debouncedContactSearchQuery.length >= 2) {
      void searchContacts(debouncedContactSearchQuery);
    } else {
      // If a listing is selected, load contacts for that listing
      if (selectedListing && !debouncedContactSearchQuery) {
        void loadContactsForListing();
      } else {
        setSearchResults([]);
      }
    }
    // loadContactsForListing is defined later and is stable, safe to use without adding to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContactSearchQuery, open, selectedListing]);

  // Fetch listings when contact is selected or when debounced property search query changes
  useEffect(() => {
    if (!open) return;

    const fetchListings = async () => {
      setLoading((prev) => ({ ...prev, listings: true }));
      try {
        if (debouncedPropertySearchQuery.length >= 2) {
          // If user is actively searching, search ALL listings regardless of contact selection
          const allListings = await listListingsCompactWithAuth({
            searchQuery: debouncedPropertySearchQuery.trim(),
          });
          setListings(allListings);
        } else if (selectedContact) {
          // If contact selected but no search query, fetch their related listings
          const contactListings = await listListingsForContactWithAuth(
            selectedContact.contactId,
            undefined,
          );
          setListings(contactListings);
        } else {
          setListings([]);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setLoading((prev) => ({ ...prev, listings: false }));
      }
    };

    if (selectedContact || debouncedPropertySearchQuery.length >= 2) {
      void fetchListings();
    } else {
      setListings([]);
    }
  }, [open, selectedContact, debouncedPropertySearchQuery]);

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
          email: contact.email ?? null,
          phone: contact.phone ?? null,
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

  const loadContactsForListing = async () => {
    if (!selectedListing) return;

    setLoading((prev) => ({ ...prev, searching: true }));
    try {
      const contactsData = await listContactsForListingWithAuth(
        selectedListing.listingId,
        debouncedContactSearchQuery.trim() || undefined,
      );
      setSearchResults(contactsData);
    } catch (error) {
      console.error("Error loading contacts for listing:", error);
      setSearchResults([]);
    } finally {
      setLoading((prev) => ({ ...prev, searching: false }));
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({ ...prev, contactId: contact.contactId.toString() }));
    setContactSearchQuery("");
    setSearchResults([]);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setFormData((prev) => ({ ...prev, contactId: "" }));
    setContactSearchQuery("");
    setSearchResults([]);
    // Listings will be updated by the effect
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    setFormData((prev) => ({ ...prev, listingId: listing.listingId.toString() }));
    setPropertySearchQuery("");
    setListings([]);
  };

  const handleClearListing = () => {
    setSelectedListing(null);
    setFormData((prev) => ({ ...prev, listingId: "" }));
    setPropertySearchQuery("");
    setListings([]);
    // Contacts will be updated by the effect
  };

  // Handle contact creation from popup
  const handleContactCreated = (contact: unknown) => {
    // Type guard to check if contact has the expected properties
    interface NewContact {
      contactId: number | bigint;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
    }

    const isValidContact = (obj: unknown): obj is NewContact => {
      return (
        typeof obj === "object" &&
        obj !== null &&
        "contactId" in obj &&
        "firstName" in obj &&
        "lastName" in obj
      );
    };

    if (isValidContact(contact)) {
      const newContactForList: Contact = {
        contactId: typeof contact.contactId === "bigint"
          ? contact.contactId
          : BigInt(contact.contactId),
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
      };

      // Add to contacts list at the top
      setSearchResults((prev) => [newContactForList, ...prev]);

      // Auto-select the new contact
      handleContactSelect(newContactForList);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setSaveError("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading((prev) => ({ ...prev, saving: true }));
    setSaveError(null);

    try {
      const selectedUserId = formData.agentId || session?.user?.id;

      if (!selectedUserId) {
        setSaveError("No se pudo determinar el usuario asignado");
        setLoading((prev) => ({ ...prev, saving: false }));
        return;
      }

      // Get listingContactId if both contact and listing are selected
      let listingContactId: bigint | undefined;
      if (formData.contactId && formData.listingId) {
        const result = await findListingContactIdAction(
          BigInt(formData.contactId),
          BigInt(formData.listingId),
        );

        // If relationship not found, show confirmation dialog
        if (result.notFound) {
          setShowConfirmDialog(true);
          setPendingSubmit(true);
          setLoading((prev) => ({ ...prev, saving: false }));
          return;
        }

        if (result.success && result.listingContactId) {
          listingContactId = result.listingContactId;
        }
      }

      // Create appointment FIRST if requested (so we can link it to the task)
      let appointmentId: bigint | undefined;
      if (formData.createInCalendar && formData.dueDate && formData.dueTime) {
        try {
          const startDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // Add 30 minutes

          const appointmentResult = await createAppointmentAction({
            startDate: formData.dueDate,
            startTime: formData.dueTime,
            endDate: endDateTime.toISOString().split('T')[0] ?? formData.dueDate,
            endTime: endDateTime.toTimeString().slice(0, 5),
            title: formData.title,
            notes: formData.description,
            appointmentType: "Tarea",
            assignedTo: selectedUserId,
            contactId: formData.contactId ? BigInt(formData.contactId) : undefined,
            listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
            listingContactId,
          });

          if (appointmentResult.success && appointmentResult.appointmentId) {
            appointmentId = BigInt(appointmentResult.appointmentId);
          }
        } catch (appointmentError) {
          console.error("Error creating appointment:", appointmentError);
          // Continue with task creation even if appointment fails
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
        urgency: formData.urgency ? parseInt(formData.urgency) : undefined,
        createdBy: session?.user?.id,
        // Entity associations (all optional)
        contactId: formData.contactId ? BigInt(formData.contactId) : undefined,
        listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
        listingContactId,
        dealId: undefined,
        appointmentId, // Now included directly when creating the task
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

  const handleConfirmCreateRelationship = async () => {
    if (!formData.contactId || !formData.listingId) return;

    setShowConfirmDialog(false);
    setLoading((prev) => ({ ...prev, saving: true }));

    try {
      // Create the relationship
      const createResult = await createListingContactRelationshipAction(
        BigInt(formData.contactId),
        BigInt(formData.listingId),
      );

      if (!createResult.success || !createResult.listingContactId) {
        setSaveError(createResult.error ?? "Error al crear la relación");
        setLoading((prev) => ({ ...prev, saving: false }));
        return;
      }

      // Now create the task with the new relationship
      const selectedUserId = formData.agentId || session?.user?.id;
      
      if (!selectedUserId) {
        setSaveError("No se pudo determinar el usuario asignado");
        setLoading((prev) => ({ ...prev, saving: false }));
        return;
      }

      // Create appointment FIRST if requested (so we can link it to the task)
      let appointmentId: bigint | undefined;
      if (formData.createInCalendar && formData.dueDate && formData.dueTime) {
        try {
          const startDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
          const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // Add 30 minutes

          const appointmentResult = await createAppointmentAction({
            startDate: formData.dueDate,
            startTime: formData.dueTime,
            endDate: endDateTime.toISOString().split('T')[0] ?? formData.dueDate,
            endTime: endDateTime.toTimeString().slice(0, 5),
            title: formData.title,
            notes: formData.description,
            appointmentType: "Tarea",
            assignedTo: selectedUserId,
            contactId: BigInt(formData.contactId),
            listingId: BigInt(formData.listingId),
            listingContactId: createResult.listingContactId,
          });

          if (appointmentResult.success && appointmentResult.appointmentId) {
            appointmentId = BigInt(appointmentResult.appointmentId);
          }
        } catch (appointmentError) {
          console.error("Error creating appointment:", appointmentError);
          // Continue with task creation even if appointment fails
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
        urgency: formData.urgency ? parseInt(formData.urgency) : undefined,
        createdBy: session?.user?.id,
        contactId: BigInt(formData.contactId),
        listingId: BigInt(formData.listingId),
        listingContactId: createResult.listingContactId,
        dealId: undefined,
        appointmentId, // Now included directly when creating the task
        prospectId: undefined,
      };

      const savedTask = await createTaskWithAuth(taskData);

      if (!savedTask) {
        throw new Error("Failed to save task");
      }

      // Success - close modal and call success callback
      setPendingSubmit(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating relationship and task:", error);
      setSaveError(
        error instanceof Error ? error.message : "Error al crear la relación y la tarea",
      );
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleCancelCreateRelationship = () => {
    setShowConfirmDialog(false);
    setPendingSubmit(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[600px] [&>button]:hidden">
        <DialogHeader className="space-y-0 -mb-6">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex-1">
              Crear Tarea
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
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
            <div className="flex items-center justify-between gap-2">
              <Label>Contacto</Label>
              {!initialContactId && !selectedContact && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex h-6 items-center space-x-1 px-2 text-xs"
                  onClick={() => setShowContactPopup(true)}
                >
                  <Plus className="h-3 w-3" />
                  <span>Agregar</span>
                </Button>
              )}
            </div>

            {loading.searching && initialContactId ? (
              <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando contacto...</span>
              </div>
            ) : selectedContact ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                        {getInitials(selectedContact.firstName, selectedContact.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">
                          {selectedContact.firstName} {selectedContact.lastName}
                        </div>
                        {selectedContact.contactType === "owner" && (
                          <Badge variant="secondary" className="shrink-0 text-xs ml-auto">
                            En Propiedad
                          </Badge>
                        )}
                        {selectedContact.contactType === "buyer" && (
                          <Badge className="shrink-0 text-xs ml-auto bg-amber-500 hover:bg-amber-600">
                            Interés
                          </Badge>
                        )}
                      </div>
                      {selectedContact.email && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="text-xs text-muted-foreground truncate">
                            {selectedContact.email}
                          </div>
                        </div>
                      )}
                      {selectedContact.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="text-xs text-muted-foreground truncate">
                            {selectedContact.phone}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!initialContactId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearContact}
                      className="h-6 w-6 shrink-0 p-0"
                      title="Quitar contacto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ) : !initialContactId ? (
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

                {(contactSearchQuery.length >= 2 || selectedListing) && (
                  <ScrollArea className="h-[200px]">
                    {loading.searching ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron contactos
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResults.map((contact, index) => (
                          <div
                            key={`${contact.contactId}-${contact.contactType ?? index}`}
                            className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-3 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                            onClick={() => handleContactSelect(contact)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                  {getInitials(contact.firstName, contact.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {contact.firstName} {contact.lastName}
                                  </div>
                                  {contact.contactType === "owner" && (
                                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 ml-auto">
                                      En Propiedad
                                    </Badge>
                                  )}
                                  {contact.contactType === "buyer" && (
                                    <Badge className="shrink-0 text-[10px] px-1.5 py-0 ml-auto bg-amber-500 hover:bg-amber-600">
                                      Interés
                                    </Badge>
                                  )}
                                </div>
                                {contact.email && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                    <div className="truncate text-xs text-gray-500">
                                      {contact.email}
                                    </div>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                    <div className="truncate text-xs text-gray-500">
                                      {contact.phone}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Contacto pre-seleccionado
              </div>
            )}
          </div>

          {/* Property Selection */}
          <div className="space-y-2">
            <Label>Propiedad</Label>

            {loading.listings && initialListingId ? (
              <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando propiedad...</span>
              </div>
            ) : selectedListing ? (
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">
                          {selectedListing.title ?? "Sin título"}
                        </div>
                        {selectedListing.contactType === "owner" && (
                          <Badge variant="secondary" className="shrink-0 text-xs ml-auto">
                            En Propiedad
                          </Badge>
                        )}
                        {selectedListing.contactType === "buyer" && (
                          <Badge className="shrink-0 text-xs ml-auto bg-amber-500 hover:bg-amber-600">
                            Interés
                          </Badge>
                        )}
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
                  {!initialListingId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearListing}
                      className="h-6 w-6 shrink-0 p-0"
                      title="Quitar propiedad"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ) : !initialListingId ? (
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

                {(propertySearchQuery.length >= 2 || selectedContact) && (
                  <ScrollArea className="h-[200px]">
                    {loading.listings ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : listings.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron propiedades
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {listings.map((listing, index) => (
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
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="text-sm font-medium text-gray-600 truncate">
                                    {listing.title ?? "Sin título"}
                                  </div>
                                  {listing.contactType === "owner" && (
                                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 ml-auto">
                                      En Propiedad
                                    </Badge>
                                  )}
                                  {listing.contactType === "buyer" && (
                                    <Badge className="shrink-0 text-[10px] px-1.5 py-0 ml-auto bg-amber-500 hover:bg-amber-600">
                                      Interés
                                    </Badge>
                                  )}
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
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Propiedad pre-seleccionada
              </div>
            )}
          </div>

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
                {agents.map((agent) => {
                  const displayName = agent.name ??
                    (agent.firstName && agent.lastName
                      ? `${agent.firstName} ${agent.lastName}`
                      : agent.firstName ?? agent.lastName ?? agent.id);
                  return (
                    <SelectItem key={agent.id} value={agent.id}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency-select">Urgencia</Label>
            <Select
              value={formData.urgency}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, urgency: value as "" | "1" | "2" | "3" | "4" | "5" }))
              }
            >
              <SelectTrigger className="h-8 text-gray-500">
                <SelectValue placeholder="Seleccionar urgencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Muy Baja</SelectItem>
                <SelectItem value="2">Baja</SelectItem>
                <SelectItem value="3">Media</SelectItem>
                <SelectItem value="4">Alta</SelectItem>
                <SelectItem value="5">Crítica</SelectItem>
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

          {/* Create in Calendar Option (shows when both date and time are set) */}
          {formData.dueDate && formData.dueTime && (
            <div className="space-y-2">
              <Label htmlFor="create-calendar">Crear en calendario</Label>
              <Select
                value={formData.createInCalendar ? "yes" : "no"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, createInCalendar: value === "yes" }))
                }
              >
                <SelectTrigger className="h-8 text-gray-500">
                  <SelectValue placeholder="Seleccionar opción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

      {/* Confirmation dialog for creating listing-contact relationship */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Crear relación con la propiedad"
        description="No se ha encontrado relación entre el contacto y la propiedad. ¿Deseas crearla?"
        confirmText="Sí, crear relación"
        cancelText="Cancelar"
        confirmVariant="default"
        onConfirm={handleConfirmCreateRelationship}
        onCancel={handleCancelCreateRelationship}
      />

      {/* Quick Contact Creation Modal */}
      <QuickContactModal
        open={showContactPopup}
        onOpenChange={setShowContactPopup}
        onSuccess={handleContactCreated}
      />
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
