"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Filter, Check, ChevronDown, X } from "lucide-react";
import { ExpandableSection } from "./expandable-section";
import { CompactContactCard } from "./compact-contact-card";
import { EmptyState } from "./empty-states";
import { AcceptedOfferCard } from "./accepted-offer-card";
import type { VisitData } from "./visits-section";
import type {
  ContactSheetData,
  ContactWithDetails,
  OwnerContact,
} from "~/types/activity";

const CONTACT_FLAG_LABELS: Record<string, string> = {
  hasUpcomingVisit: "Visita Pendiente",
  hasMissedVisit: "Visita Perdida",
  hasCancelledVisit: "Visita Cancelada",
  hasCompletedVisit: "Visita Completada",
  offerAccepted: "Oferta Aceptada",
  offerRejected: "Oferta Rechazada",
  hasOffer: "Oferta Pendiente",
  noVisits: "Sin Visitas",
};

const ALL_CONTACT_FLAGS = [
  "hasUpcomingVisit",
  "hasMissedVisit",
  "hasCancelledVisit",
  "hasCompletedVisit",
  "offerAccepted",
  "offerRejected",
  "hasOffer",
  "noVisits",
];

interface ContactsSectionProps {
  contacts: ContactWithDetails[];
  visits: VisitData[];
  listingId: bigint;
  listingPrice: string;
  ownerContact: OwnerContact | null;
  hasEditContactsPermission: boolean;
  onContactClick: (contact: ContactSheetData) => void;
  onUpdate: () => void | Promise<void>;
}

export function ContactsSection({
  contacts,
  visits,
  listingId,
  listingPrice,
  ownerContact,
  hasEditContactsPermission,
  onContactClick,
  onUpdate,
}: ContactsSectionProps) {
  const [selectedContactFlags, setSelectedContactFlags] = useState<Set<string>>(
    new Set(ALL_CONTACT_FLAGS),
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    contactStatus: true,
  });

  // Find all contacts with accepted offers, ordered by earliest deal first
  const acceptedOfferContacts = useMemo(
    () =>
      contacts
        .filter((c) => c.offerAccepted === true)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [contacts],
  );
  const hasAcceptedOffer = acceptedOfferContacts.length > 0;

  // Track which accepted offer contact is selected
  const [selectedAcceptedOfferId, setSelectedAcceptedOfferId] = useState<bigint | null>(
    acceptedOfferContacts[0]?.contactId ?? null,
  );

  // Get the currently selected accepted offer contact
  const selectedAcceptedContact = acceptedOfferContacts.find(
    (c) => c.contactId === selectedAcceptedOfferId,
  ) ?? acceptedOfferContacts[0] ?? null;

  // Contact view mode - switch between accepted offer view and all contacts
  const [contactViewMode, setContactViewMode] = useState<"accepted" | "all">(
    hasAcceptedOffer ? "accepted" : "all",
  );

  // Update selected contact if it's no longer in the accepted offers list
  useEffect(() => {
    if (hasAcceptedOffer) {
      // If selected contact is no longer in the list, select the first one
      const isSelectedInList = acceptedOfferContacts.some(
        (c) => c.contactId === selectedAcceptedOfferId,
      );
      if (!isSelectedInList) {
        setSelectedAcceptedOfferId(acceptedOfferContacts[0]?.contactId ?? null);
      }
    } else {
      // No accepted offers - switch to all view and clear selection
      setContactViewMode("all");
      setSelectedAcceptedOfferId(null);
    }
  }, [hasAcceptedOffer, acceptedOfferContacts, selectedAcceptedOfferId]);

  // Filter visits for the selected accepted offer contact
  const acceptedOfferVisits = useMemo(() => {
    if (!selectedAcceptedContact) return [];
    return visits
      .filter(
        (v) =>
          v.contactId?.toString() === selectedAcceptedContact.contactId.toString(),
      )
      .sort(
        (a, b) =>
          new Date(b.datetimeStart).getTime() -
          new Date(a.datetimeStart).getTime(),
      );
  }, [visits, selectedAcceptedContact]);

  // Get the flag for a contact
  const getContactFlag = (c: ContactWithDetails): string => {
    if (c.hasUpcomingVisit) return "hasUpcomingVisit";
    if (c.offerAccepted === true) return "offerAccepted";
    if (c.offerAccepted === false) return "offerRejected";
    if (c.hasOffer) return "hasOffer";
    if (c.hasMissedVisit && !c.hasCancelledVisit) return "hasMissedVisit";
    if (c.hasCancelledVisit) return "hasCancelledVisit";
    if (c.hasCompletedVisit) return "hasCompletedVisit";
    return "noVisits";
  };

  // Filter contacts by badge flags
  const filteredContacts = contacts.filter((c) => {
    const contactFlag = getContactFlag(c);
    return selectedContactFlags.has(contactFlag);
  });

  // Sorting logic for contacts - Sales funnel priority
  const sortedContacts = [...filteredContacts].sort((a, b) => {
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
    if (a.hasMissedVisit !== b.hasMissedVisit) return a.hasMissedVisit ? -1 : 1;

    // 6. ATTENTION: Has cancelled visit (needs rescheduling)
    if (a.hasCancelledVisit !== b.hasCancelledVisit)
      return a.hasCancelledVisit ? -1 : 1;

    // 7. ENGAGEMENT: Visit count (more visits = warmer lead)
    if (a.visitCount !== b.visitCount) return b.visitCount - a.visitCount;

    // 8. RECENCY: Most recent first (fresher leads)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // New contacts with same sorting
  const newContacts = sortedContacts.filter((c) => c.isNew);

  const toggleContactFlag = (flag: string) => {
    const newFlags = new Set(selectedContactFlags);
    if (newFlags.has(flag)) {
      newFlags.delete(flag);
    } else {
      newFlags.add(flag);
    }
    setSelectedContactFlags(newFlags);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearContactFilters = () => {
    setSelectedContactFlags(new Set(ALL_CONTACT_FLAGS));
  };

  const activeContactFilterCount = ALL_CONTACT_FLAGS.length - selectedContactFlags.size;

  return (
    <div className="animate-in fade-in space-y-4 duration-300">
      {/* Tab Toggle - Only show when there's an accepted offer */}
      {hasAcceptedOffer && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 sm:gap-2">
          <button
            onClick={() => setContactViewMode("accepted")}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
              contactViewMode === "accepted"
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Ofertas Aceptadas
            {acceptedOfferContacts.length > 1 && (
              <Badge variant="secondary" className="ml-2 rounded-sm px-1.5 text-xs">
                {acceptedOfferContacts.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setContactViewMode("all")}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
              contactViewMode === "all"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Todos los Contactos
          </button>
        </div>
      )}

      {/* Contact Filter Button - Only show in "all" view */}
      {contactViewMode === "all" && (
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative h-8">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeContactFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-sm px-1 font-normal"
                  >
                    {activeContactFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="flex flex-col">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-6 p-4">
                    {/* Contact Badge Filters */}
                    <div className="space-y-2">
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => toggleCategory("contactStatus")}
                      >
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Estado de Visita
                        </h5>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCategories.contactStatus ? "rotate-180 transform" : ""}`}
                        />
                      </div>
                      {expandedCategories.contactStatus && (
                        <div className="space-y-1">
                          {ALL_CONTACT_FLAGS.map((flag) => (
                            <div
                              key={flag}
                              className="flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent"
                              onClick={() => toggleContactFlag(flag)}
                            >
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border ${selectedContactFlags.has(flag) ? "border-primary bg-primary" : "border-input"}`}
                              >
                                {selectedContactFlags.has(flag) && (
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="text-sm">
                                {CONTACT_FLAG_LABELS[flag]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                {activeContactFilterCount > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearContactFilters}
                      className="h-7 w-full text-xs"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Borrar filtros
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Accepted Offer View */}
      {contactViewMode === "accepted" && selectedAcceptedContact && (
        <>
          {/* Contact Selector - Only show if multiple accepted offers */}
          {acceptedOfferContacts.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {acceptedOfferContacts.map((contact) => (
                <button
                  key={contact.contactId.toString()}
                  onClick={() => setSelectedAcceptedOfferId(contact.contactId)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    selectedAcceptedOfferId === contact.contactId
                      ? "bg-green-50 text-green-700 shadow-md"
                      : "bg-white text-gray-500 shadow hover:text-gray-700 hover:shadow-md"
                  }`}
                >
                  {contact.firstName} {contact.lastName}
                </button>
              ))}
            </div>
          )}

          <AcceptedOfferCard
            contact={selectedAcceptedContact}
            listingId={listingId}
            listingPrice={listingPrice}
            ownerContact={ownerContact}
            visits={acceptedOfferVisits}
            onUpdate={onUpdate}
            permissions={{
              canEditContacts: hasEditContactsPermission,
            }}
          />
        </>
      )}

      {/* All Contacts View */}
      {contactViewMode === "all" && (
        <div className="space-y-6">
          {/* No contacts at all */}
          {filteredContacts.length === 0 && <EmptyState type="new-contacts" />}

          {/* New Contacts Section */}
          {newContacts.length > 0 && (
            <div className="space-y-2">
              {newContacts.map((contact) => (
                <CompactContactCard
                  key={contact.contactId.toString()}
                  listingContactId={contact.listingContactId}
                  contact={{
                    contactId: contact.contactId,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    createdAt: contact.createdAt,
                  }}
                  listingContact={{
                    source: contact.source,
                    status: contact.status,
                    contactType: contact.contactType as
                      | "buyer"
                      | "owner"
                      | "viewer",
                  }}
                  hasUpcomingVisit={contact.hasUpcomingVisit}
                  upcomingAppointmentId={contact.upcomingAppointmentId}
                  missedAppointmentId={contact.missedAppointmentId}
                  hasMissedVisit={contact.hasMissedVisit}
                  hasCompletedVisit={contact.hasCompletedVisit}
                  hasCancelledVisit={contact.hasCancelledVisit}
                  hasOffer={contact.hasOffer}
                  offer={contact.offer}
                  offerAccepted={contact.offerAccepted}
                  visitCount={contact.visitCount}
                  listingId={listingId}
                  onContactClick={onContactClick}
                  hasAcceptedOfferInList={hasAcceptedOffer}
                />
              ))}
            </div>
          )}

          {/* All Contacts Section */}
          {sortedContacts.length > newContacts.length && (
            <ExpandableSection
              title="Todos los Contactos"
              count={sortedContacts.length}
              defaultExpanded={false}
              storageKey={`activity-all-contacts-${listingId}`}
            >
              <div className="space-y-2">
                {sortedContacts.map((contact) => (
                  <CompactContactCard
                    key={contact.contactId.toString()}
                    listingContactId={contact.listingContactId}
                    contact={{
                      contactId: contact.contactId,
                      firstName: contact.firstName,
                      lastName: contact.lastName,
                      email: contact.email,
                      phone: contact.phone,
                      createdAt: contact.createdAt,
                    }}
                    listingContact={{
                      source: contact.source,
                      status: contact.status,
                      contactType: contact.contactType as
                        | "buyer"
                        | "owner"
                        | "viewer",
                    }}
                    hasUpcomingVisit={contact.hasUpcomingVisit}
                    upcomingAppointmentId={contact.upcomingAppointmentId}
                    missedAppointmentId={contact.missedAppointmentId}
                    hasMissedVisit={contact.hasMissedVisit}
                    hasCompletedVisit={contact.hasCompletedVisit}
                    hasCancelledVisit={contact.hasCancelledVisit}
                    hasOffer={contact.hasOffer}
                    offer={contact.offer}
                    offerAccepted={contact.offerAccepted}
                    visitCount={contact.visitCount}
                    listingId={listingId}
                    onContactClick={onContactClick}
                    hasAcceptedOfferInList={hasAcceptedOffer}
                  />
                ))}
              </div>
            </ExpandableSection>
          )}
        </div>
      )}
    </div>
  );
}
