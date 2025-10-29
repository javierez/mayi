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
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Contactos y sus Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contacts.map((contact) => {
            const contactId = contact.contactId;
            const isOpen = openContacts.has(contactId);
            const contactListings = getListingsForContact(contact.contactId);

            return (
              <Collapsible
                key={contactId}
                open={isOpen}
                onOpenChange={() => toggleContact(contactId)}
              >
                <Card className="border">
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <Link
                            href={`/contactos/${contact.contactId}`}
                            className="font-medium hover:underline"
                          >
                            {contact.firstName} {contact.lastName}
                          </Link>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {contact.email && (
                              <span>{contact.email}</span>
                            )}
                            {contact.phone && (
                              <span>{contact.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {contactListings.length}{" "}
                        {contactListings.length === 1
                          ? "propiedad"
                          : "propiedades"}
                      </Badge>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-2 border-t bg-muted/20 p-4">
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
                              <Card className="border">
                                <CollapsibleTrigger className="w-full">
                                  <CardContent className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                      {isListingOpen ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      <div className="text-left">
                                        <Link
                                          href={`/propiedades/${listing.listingId}`}
                                          className="text-sm font-medium hover:underline"
                                        >
                                          {listing.title ??
                                            `${listing.street ?? ""} ${listing.addressDetails ?? ""}`}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">
                                          {formatPrice(listing.price)} • {listing.listingType}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {getStatusText(listing.status)}
                                    </Badge>
                                  </CardContent>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                  <CardContent className="space-y-3 border-t bg-muted/10 p-3">
                                    {/* Listing Contacts */}
                                    {contacts.length > 0 && (
                                      <div>
                                        <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                                          Interesados
                                        </h4>
                                        <div className="space-y-1">
                                          {contacts.map((lc) => (
                                            <div
                                              key={lc.listingContactId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-center justify-between">
                                                <Link
                                                  href={`/contactos/${lc.contactId}`}
                                                  className="font-medium hover:underline"
                                                >
                                                  {lc.firstName} {lc.lastName}
                                                </Link>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {lc.contactType === "buyer"
                                                    ? "Comprador"
                                                    : "Visitante"}
                                                </Badge>
                                              </div>
                                              {lc.status && (
                                                <p className="text-muted-foreground">
                                                  Estado: {lc.status}
                                                </p>
                                              )}
                                              {lc.offer && (
                                                <p className="text-muted-foreground">
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
                                        <div className="space-y-1">
                                          {listingTasks.map((task) => (
                                            <div
                                              key={task.taskId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-center justify-between">
                                                <p className="font-medium">
                                                  {task.title}
                                                </p>
                                                {task.dueDate && (
                                                  <span className="text-muted-foreground">
                                                    {formatDate(task.dueDate)}
                                                  </span>
                                                )}
                                              </div>
                                              {task.description && (
                                                <p className="mt-1 text-muted-foreground">
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
                                        <div className="space-y-1">
                                          {listingAppointments.map((appt) => (
                                            <div
                                              key={appt.appointmentId}
                                              className="rounded-md border bg-background p-2 text-xs"
                                            >
                                              <div className="flex items-center justify-between">
                                                <p className="font-medium">
                                                  {appt.type ?? "Cita"}
                                                </p>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {appt.status}
                                                </Badge>
                                              </div>
                                              <p className="text-muted-foreground">
                                                Con: {appt.contactName}
                                              </p>
                                              <p className="text-muted-foreground">
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
          })}
        </CardContent>
      </Card>
    </div>
  );
}
