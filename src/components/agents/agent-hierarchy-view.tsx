"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";
import type { ContactSheetData } from "~/types/activity";

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
  hasUpcomingVisit: boolean;
  hasMissedVisit: boolean;
  hasCompletedVisit: boolean;
  hasCancelledVisit: boolean;
  visitCount: number;
  hasOffer: boolean;
  createdAt: string;
  upcomingAppointmentId: string | null;
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
  appointments: Appointment[];
}

function getStatusText(status: string) {
  return status;
}

// Helper function to determine contact status badge (matching activity-tab-content logic)
function getContactStatusBadge(contact: {
  hasUpcomingVisit: boolean;
  offerAccepted: boolean | null;
  hasOffer: boolean;
  hasMissedVisit: boolean;
  hasCancelledVisit: boolean;
  hasCompletedVisit: boolean;
}) {
  // Priority order matches activity-tab-content.tsx lines 522-547
  if (contact.hasUpcomingVisit) {
    return {
      text: "Visita Pendiente",
      className: "bg-blue-100 text-blue-800 text-[9px] font-normal",
    };
  } else if (contact.offerAccepted === true) {
    return {
      text: "Oferta Aceptada",
      className: "bg-green-100 text-green-800 text-[9px] font-normal",
    };
  } else if (contact.offerAccepted === false) {
    return {
      text: "Oferta Rechazada",
      className: "bg-rose-100 text-rose-800 text-[9px] font-normal",
    };
  } else if (contact.hasOffer) {
    return {
      text: "Oferta Pendiente",
      className: "bg-amber-100 text-amber-800 text-[9px] font-normal",
    };
  } else if (contact.hasMissedVisit && !contact.hasCancelledVisit) {
    return {
      text: "Visita Perdida",
      className: "bg-amber-50 text-amber-700 text-[9px] font-normal border-amber-200",
    };
  } else if (contact.hasCancelledVisit) {
    return {
      text: "Visita Cancelada",
      className: "bg-orange-50 text-orange-700 text-[9px] font-normal border-orange-200",
    };
  } else if (contact.hasCompletedVisit) {
    return {
      text: "Visita Completada",
      className: "bg-gray-100 text-gray-700 text-[9px] font-normal",
    };
  } else {
    return {
      text: "Sin Visitas",
      className: "bg-gray-100 text-gray-700 text-[9px] font-normal",
    };
  }
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

function formatTime(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function AgentHierarchyView({
  contacts,
  listings,
  listingContacts,
  appointments,
}: AgentHierarchyViewProps) {
  const router = useRouter();
  const [openContacts, setOpenContacts] = useState<Set<string>>(new Set());
  const [openListings, setOpenListings] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for ContactDetailSheet
  const [selectedContactSheet, setSelectedContactSheet] = useState<ContactSheetData | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

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

  // Handle contact card click to open ContactDetailSheet
  const handleContactCardClick = (lc: ListingContact, listing: Listing) => {
    const contactSheetData: ContactSheetData = {
      listingContactId: BigInt(lc.listingContactId),
      contact: {
        contactId: BigInt(lc.contactId),
        firstName: lc.firstName,
        lastName: lc.lastName,
        email: lc.email,
        phone: lc.phone,
        createdAt: new Date(lc.createdAt),
      },
      hasUpcomingVisit: lc.hasUpcomingVisit,
      upcomingAppointmentId: lc.upcomingAppointmentId ? BigInt(lc.upcomingAppointmentId) : undefined,
      hasMissedVisit: lc.hasMissedVisit,
      hasCompletedVisit: lc.hasCompletedVisit,
      hasCancelledVisit: lc.hasCancelledVisit,
      hasOffer: lc.hasOffer,
      offer: lc.offer,
      offerAccepted: lc.offerAccepted,
    };

    setSelectedContactSheet(contactSheetData);
    setSelectedListing(listing);
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

  // Get listing contacts for a listing with priority-based sorting
  const getListingContactsForListing = (listingId: string) => {
    const contacts = listingContacts.filter(
      (lc) =>
        lc.listingId === listingId &&
        (lc.contactType === "buyer" || lc.contactType === "viewer"),
    );

    // Sort by sales funnel priority (matching activity-tab-content lines 550-582)
    return contacts.sort((a, b) => {
      // 1. HIGHEST: Offer accepted (deal closing - highest priority)
      const aOfferAccepted = a.offerAccepted === true;
      const bOfferAccepted = b.offerAccepted === true;
      if (aOfferAccepted !== bOfferAccepted) return aOfferAccepted ? -1 : 1;

      // 2. HIGH: Has pending offer (potential deal in progress)
      const aHasPendingOffer = a.hasOffer && a.offerAccepted === null;
      const bHasPendingOffer = b.hasOffer && b.offerAccepted === null;
      if (aHasPendingOffer !== bHasPendingOffer) return aHasPendingOffer ? -1 : 1;

      // 3. IMPORTANT: Offer rejected (needs follow-up or re-engagement)
      const aOfferRejected = a.offerAccepted === false;
      const bOfferRejected = b.offerAccepted === false;
      if (aOfferRejected !== bOfferRejected) return aOfferRejected ? -1 : 1;

      // 4. URGENT: Has upcoming visit (scheduled, needs preparation)
      if (a.hasUpcomingVisit !== b.hasUpcomingVisit)
        return a.hasUpcomingVisit ? -1 : 1;

      // 5. ATTENTION: Has missed visit (needs immediate follow-up)
      if (a.hasMissedVisit !== b.hasMissedVisit)
        return a.hasMissedVisit ? -1 : 1;

      // 6. ATTENTION: Has cancelled visit (needs rescheduling)
      if (a.hasCancelledVisit !== b.hasCancelledVisit)
        return a.hasCancelledVisit ? -1 : 1;

      // 7. ENGAGEMENT: Visit count (more visits = warmer lead)
      if (a.visitCount !== b.visitCount) return b.visitCount - a.visitCount;

      // 8. Final tiebreaker: alphabetical by last name, then first name
      const lastNameCompare = a.lastName.localeCompare(b.lastName, "es");
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName, "es");
    });
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
                                        <p className="text-xs text-muted-foreground whitespace-normal break-words mt-0.5 font-mono">
                                          {formatPrice(listing.price)}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge className="text-[9px] flex-shrink-0 font-normal font-mono uppercase">
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
                                          {contacts.map((lc) => {
                                            const statusBadge = getContactStatusBadge({
                                              hasUpcomingVisit: lc.hasUpcomingVisit,
                                              offerAccepted: lc.offerAccepted,
                                              hasOffer: lc.hasOffer,
                                              hasMissedVisit: lc.hasMissedVisit,
                                              hasCancelledVisit: lc.hasCancelledVisit,
                                              hasCompletedVisit: lc.hasCompletedVisit,
                                            });

                                            return (
                                              <div
                                                key={lc.listingContactId}
                                                className="flex items-center justify-between gap-2 rounded-lg border bg-white p-2 transition-all duration-200 hover:shadow-md cursor-pointer"
                                                onClick={() => handleContactCardClick(lc, listing)}
                                              >
                                                {/* Contact name */}
                                                <div className="min-w-0 flex-1">
                                                  <div className="text-xs font-medium text-gray-900 break-words">
                                                    {lc.firstName} {lc.lastName}
                                                  </div>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="flex-shrink-0">
                                                  <Badge className={statusBadge.className}>
                                                    {statusBadge.text}
                                                  </Badge>
                                                </div>
                                              </div>
                                            );
                                          })}
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
                                              className="relative rounded-md border bg-background p-2.5 text-xs"
                                            >
                                              {/* Type Badge - top right */}
                                              <div className="absolute right-2 top-2 flex items-center gap-2">
                                                <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400 font-mono">
                                                  {appt.type ?? "cita"}
                                                </span>
                                              </div>

                                              {/* Date and Time - bottom right */}
                                              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 font-mono">
                                                <div className="text-[10px] text-gray-500">
                                                  {formatShortDate(appt.datetimeStart)}
                                                </div>
                                                <div className="text-[10px] text-gray-400">•</div>
                                                <div className="text-[10px] font-medium tabular-nums text-gray-600">
                                                  {formatTime(appt.datetimeStart)}
                                                </div>
                                                <div className="text-[10px] text-gray-400">—</div>
                                                <div className="text-[10px] tabular-nums text-gray-500">
                                                  {formatTime(appt.datetimeEnd)}
                                                </div>
                                              </div>

                                              {/* Main content */}
                                              <div className="pr-16">
                                                {/* Contact name */}
                                                <h3 className="mb-1 text-xs font-medium text-gray-700 break-words">
                                                  {appt.contactName}
                                                </h3>

                                                {/* Address */}
                                                {appt.propertyAddress && (
                                                  <div className="flex items-start gap-1 min-w-0">
                                                    <span className="line-clamp-2 text-[10px] leading-tight text-gray-500 break-words min-w-0">
                                                      {appt.propertyAddress}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {contacts.length === 0 &&
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

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContactSheet}
        isOpen={selectedContactSheet !== null}
        onClose={() => {
          setSelectedContactSheet(null);
          setSelectedListing(null);
        }}
        onUpdate={async () => {
          router.refresh();
        }}
        listingId={selectedListing ? BigInt(selectedListing.listingId) : BigInt(0)}
        listingPrice={selectedListing?.price ?? "0"}
        ownerContact={
          selectedListing?.ownerFirstName
            ? {
                contactId: BigInt(0), // Owner contact ID not available in listing data
                firstName: selectedListing.ownerFirstName,
                lastName: selectedListing.ownerLastName,
                email: selectedListing.ownerEmail,
                phone: selectedListing.ownerPhone,
              }
            : null
        }
        permissions={{
          canEditContacts: true, // TODO: Use proper permissions check
        }}
      />
    </div>
  );
}
