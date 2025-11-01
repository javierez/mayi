"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Search,
} from "lucide-react";
import { ContactInfoModal } from "./contact-info-modal";

interface Contact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Listing {
  listingId: string;
  propertyId: string;
  title: string | null;
  street: string | null;
  addressDetails: string | null;
  price: string;
  status: string;
  listingType: string;
  isActive: boolean | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

interface ListingContact {
  listingContactId: string;
  listingId: string | null;
  contactId: string;
  contactType: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  offer: number | null;
  offerAccepted: boolean | null;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean | null;
  listingId: string | null;
  listingContactId: string | null;
  dealId: string | null;
  appointmentId: string | null;
  entityName: string | null;
}

interface Appointment {
  appointmentId: string;
  datetimeStart: string;
  datetimeEnd: string;
  status: string;
  type: string | null;
  contactName: string;
  propertyAddress: string | null;
  listingId: string | null;
}

interface AgentHierarchyViewProps {
  contacts: Contact[];
  listings: Listing[];
  listingContacts: ListingContact[];
  tasks: Task[];
  appointments: Appointment[];
}

function getStatusText(status: string) {
  return status;
}

function formatPrice(price: string) {
  const numPrice = parseFloat(price);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function AgentHierarchyView({
  contacts,
  listings,
  listingContacts,
  tasks,
  appointments,
}: AgentHierarchyViewProps) {
  const [openContacts, setOpenContacts] = useState<Set<string>>(new Set());
  const [openListings, setOpenListings] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleContact = (contactId: string) => {
    const newOpen = new Set(openContacts);
    if (newOpen.has(contactId)) {
      newOpen.delete(contactId);
    } else {
      newOpen.add(contactId);
    }
    setOpenContacts(newOpen);
  };

  const toggleListing = (listingId: string) => {
    const newOpen = new Set(openListings);
    if (newOpen.has(listingId)) {
      newOpen.delete(listingId);
    } else {
      newOpen.add(listingId);
    }
    setOpenListings(newOpen);
  };

  const handleContactInfoClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const email = (contact.email ?? "").toLowerCase();
    const phone = (contact.phone ?? "").toLowerCase();

    return fullName.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Get listings for a contact (owner)
  const getListingsForContact = (contactId: string) => {
    return listings.filter(
      (listing) =>
        listing.ownerFirstName &&
        contacts.find(
          (c) =>
            c.contactId === contactId &&
            c.firstName === listing.ownerFirstName &&
            c.lastName === listing.ownerLastName,
        ),
    );
  };

  // Get listing contacts for a listing
  const getListingContactsForListing = (listingId: string) => {
    return listingContacts.filter(
      (lc) =>
        lc.listingId === listingId &&
        (lc.contactType === "buyer" || lc.contactType === "viewer"),
    );
  };

  // Get tasks for a listing
  const getTasksForListing = (listingId: string) => {
    return tasks.filter((task) => task.listingId === listingId);
  };

  // Get appointments for a listing
  const getAppointmentsForListing = (listingId: string) => {
    return appointments.filter((appt) => appt.listingId === listingId);
  };

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No hay contactos propietarios para mostrar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 px-4 md:px-6">
          <CardTitle className="text-base font-semibold">
            Cartera de Clientes
          </CardTitle>
        </CardHeader>
        <div className="px-4 md:px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Buscar contacto..."
              className="h-8 w-full pl-8 text-sm border-muted bg-muted/20 focus-visible:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="space-y-0 pt-0 divide-y divide-gray-100">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No se encontraron contactos que coincidan con tu búsqueda.
            </p>
          ) : (
            filteredContacts.map((contact) => {
              const contactId = contact.contactId;
              const isOpen = openContacts.has(contactId);
              const contactListings = getListingsForContact(contact.contactId);

            return (
              <Collapsible
                key={contactId}
                open={isOpen}
                onOpenChange={() => toggleContact(contactId)}
              >
                <Card className="border-0 shadow-none">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between py-2.5 px-3 md:px-4 hover:bg-muted/30 transition-all duration-200 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="text-left min-w-0 flex-1">
                          <Link
                            href={`/contactos/${contact.contactId}`}
                            className="text-sm font-medium hover:underline transition-colors break-words"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.firstName} {contact.lastName}
                          </Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 font-mono">
                          <div className="text-[10px] font-medium tabular-nums text-gray-400">
                            {contactListings.length}
                          </div>
                          <div className="text-[10px] text-gray-400 hidden sm:block">
                            {contactListings.length === 1
                              ? "propiedad"
                              : "propiedades"}
                          </div>
                        </div>
                        <div
                          className="h-5 w-5 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                          onClick={(e) => handleContactInfoClick(contact, e)}
                        >
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-2 border-t bg-muted/20 py-3 px-3 md:px-4">
                      {contactListings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay propiedades asociadas.
                        </p>
                      ) : (
                        contactListings.map((listing) => {
                          const listingId = listing.listingId;
                          const isListingOpen = openListings.has(listingId);
                          const contacts = getListingContactsForListing(
                            listing.listingId,
                          );
                          const listingTasks = getTasksForListing(
                            listing.listingId,
                          );
                          const listingAppointments =
                            getAppointmentsForListing(listing.listingId);

                          return (
                            <Collapsible
                              key={listingId}
                              open={isListingOpen}
                              onOpenChange={() => toggleListing(listingId)}
                            >
                              <Card className="border shadow-none">
                                <CollapsibleTrigger className="w-full">
                                  <CardContent className="flex items-start sm:items-center justify-between gap-2 py-2 px-2.5 md:px-3 hover:bg-muted/50 transition-colors min-w-0">
                                    <div className="flex items-start gap-2 min-w-0 flex-1">
                                      <div className="flex-shrink-0 mt-0.5">
                                        {isListingOpen ? (
                                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="text-left min-w-0 flex-1">
                                        <Link
                                          href={`/propiedades/${listing.listingId}`}
                                          className="text-sm font-medium hover:underline break-words line-clamp-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {listing.title ??
                                            `${listing.street ?? ""} ${listing.addressDetails ?? ""}`.trim()}
                                        </Link>
                                        <p className="text-xs text-muted-foreground whitespace-normal break-words mt-0.5">
                                          {formatPrice(listing.price)} • {listing.listingType}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {getStatusText(listing.status)}
                                    </Badge>
                                  </CardContent>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <CardContent className="space-y-3 border-t bg-muted/10 p-2.5 md:p-3">
                                    {/* Listing Contacts */}
                                    {contacts.length > 0 && (
                                      <div>
                                        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                          Interesados
                                        </h4>
                                        <div className="space-y-1.5">
                                          {contacts.map((lc) => (
                                            <div
                                              key={lc.listingContactId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2 min-w-0">
                                                <Link
                                                  href={`/contactos/${lc.contactId}`}
                                                  className="font-medium hover:underline break-words min-w-0 flex-1"
                                                >
                                                  {lc.firstName} {lc.lastName}
                                                </Link>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs flex-shrink-0"
                                                >
                                                  {lc.contactType === "buyer"
                                                    ? "Comprador"
                                                    : "Visitante"}
                                                </Badge>
                                              </div>
                                              {lc.status && (
                                                <p className="text-muted-foreground mt-1 break-words">
                                                  Estado: {lc.status}
                                                </p>
                                              )}
                                              {lc.offer && (
                                                <p className="text-muted-foreground mt-1">
                                                  Oferta: {formatPrice(String(lc.offer))}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tasks */}
                                    {listingTasks.length > 0 && (
                                      <div>
                                        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                          Tareas
                                        </h4>
                                        <div className="space-y-1.5">
                                          {listingTasks.map((task) => (
                                            <div
                                              key={task.taskId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2 min-w-0">
                                                <p className="font-medium break-words min-w-0 flex-1">
                                                  {task.title}
                                                </p>
                                                {task.dueDate && (
                                                  <span className="text-muted-foreground flex-shrink-0 text-[10px] sm:text-xs">
                                                    {formatDate(task.dueDate)}
                                                  </span>
                                                )}
                                              </div>
                                              {task.description && (
                                                <p className="mt-1 text-muted-foreground break-words">
                                                  {task.description}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Appointments */}
                                    {listingAppointments.length > 0 && (
                                      <div>
                                        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                          Citas
                                        </h4>
                                        <div className="space-y-1.5">
                                          {listingAppointments.map((appt) => (
                                            <div
                                              key={appt.appointmentId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-start sm:items-center justify-between gap-2 min-w-0">
                                                <p className="font-medium break-words min-w-0 flex-1">
                                                  {appt.type ?? "Cita"}
                                                </p>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs flex-shrink-0"
                                                >
                                                  {appt.status}
                                                </Badge>
                                              </div>
                                              <p className="text-muted-foreground mt-1 break-words">
                                                Con: {appt.contactName}
                                              </p>
                                              <p className="text-muted-foreground mt-0.5">
                                                {formatDateTime(
                                                  appt.datetimeStart,
                                                )}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {contacts.length === 0 &&
                                      listingTasks.length === 0 &&
                                      listingAppointments.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          No hay actividad para esta propiedad.
                                        </p>
                                      )}
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })
          )}
        </CardContent>
      </Card>

      <ContactInfoModal
        contact={selectedContact}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
