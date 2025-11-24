"use client";

import { Mail, Phone, Copy, Check, MessageCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import type { CompactContactCardProps } from "~/types/activity";
import { navigateToPage } from "~/lib/navigation";

export function CompactContactCard({
  listingContactId,
  contact,
  listingContact: _listingContact,
  hasUpcomingVisit,
  upcomingAppointmentId,
  missedAppointmentId,
  hasMissedVisit,
  hasCompletedVisit,
  hasCancelledVisit,
  hasOffer,
  offer,
  offerAccepted,
  visitCount: _visitCount,
  listingId,
  onContactClick,
  hasAcceptedOfferInList = false,
}: CompactContactCardProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const openPhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, "_blank");
  };

  const openWhatsApp = (phone: string) => {
    // Remove any non-digit characters and ensure it starts with country code
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCreateVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToPage(
      `/calendario?new=true&contactId=${contact.contactId}&listingId=${listingId}`,
      router,
    );
  };

  const handleCardClick = () => {
    if (onContactClick) {
      const contactSheetData = {
        listingContactId,
        contact,
        hasUpcomingVisit,
        upcomingAppointmentId,
        missedAppointmentId,
        hasMissedVisit,
        hasCompletedVisit,
        hasCancelledVisit,
        hasOffer,
        offer,
        offerAccepted,
      };
      console.log("📋 [CompactContactCard] Opening contact sheet with data:", {
        contactName: `${contact.firstName} ${contact.lastName ?? ""}`,
        hasUpcomingVisit,
        upcomingAppointmentId: upcomingAppointmentId?.toString(),
        hasMissedVisit,
        missedAppointmentId: missedAppointmentId?.toString(),
        listingContactId: listingContactId.toString(),
        contactId: contact.contactId.toString(),
      });
      onContactClick(contactSheetData);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "calendar-event relative cursor-pointer rounded-lg border bg-white p-2.5 transition-all duration-200 hover:shadow-md",
        // Subtle shadow for accepted offers
        offerAccepted === true && "shadow-lg",
        // Ghosted effect for other cards when an offer is accepted in the list
        hasAcceptedOfferInList &&
          offerAccepted !== true &&
          "opacity-50 hover:opacity-75",
      )}
    >
      {/* Main content */}
      <div className="pr-28">
        {" "}
        {/* Add right padding to avoid overlap with badges */}
        {/* Contact name */}
        <div className="mb-1 text-sm font-medium text-gray-900">
          {contact.firstName} {contact.lastName ?? ""}
          <span className="ml-2 text-xs font-normal text-gray-500">
            (
            {formatDistance(contact.createdAt, new Date(), {
              addSuffix: true,
              locale: es,
            })}
            )
          </span>
        </div>
        {/* Contact Info - Email and Phone */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {contact.email && (
            <div className="group flex items-center">
              <div className="mr-1 flex items-center">
                <button
                  className="rounded p-1 transition-colors hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEmail(contact.email!);
                  }}
                  title="Enviar email"
                >
                  <Mail className="h-3 w-3 text-muted-foreground" />
                </button>
                <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:w-auto group-hover:opacity-100">
                  <button
                    className="duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100"
                    style={{ transitionDelay: "200ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(
                        contact.email!,
                        `email-${contact.contactId}`,
                      );
                    }}
                    title="Copiar email"
                  >
                    {copiedField === `email-${contact.contactId}` ? (
                      <Check className="h-3 w-3 text-green-900" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <span className="truncate transition-all group-hover:font-bold">
                {contact.email}
              </span>
            </div>
          )}
          {contact.email && contact.phone && <span>•</span>}
          {contact.phone && (
            <div className="group flex items-center">
              <div className="mr-1 flex items-center">
                <button
                  className="rounded p-1 transition-colors hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhoneCall(contact.phone!);
                  }}
                  title="Llamar"
                >
                  <Phone className="h-3 w-3 text-muted-foreground" />
                </button>
                <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:w-auto group-hover:opacity-100">
                  <button
                    className="duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100"
                    style={{ transitionDelay: "200ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(contact.phone!);
                    }}
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    className="duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100"
                    style={{ transitionDelay: "300ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(
                        contact.phone!,
                        `phone-${contact.contactId}`,
                      );
                    }}
                    title="Copiar teléfono"
                  >
                    {copiedField === `phone-${contact.contactId}` ? (
                      <Check className="h-3 w-3 text-green-900" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <span className="truncate transition-all group-hover:font-bold">
                {contact.phone}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Badge - Top right */}
      <div className="absolute right-2 top-2">
        {/* Visit status badge */}
        <span
          onClick={
            (!hasUpcomingVisit &&
              !hasMissedVisit &&
              !hasCompletedVisit &&
              !hasCancelledVisit &&
              !hasOffer &&
              offerAccepted === null) ||
            (hasMissedVisit &&
              !hasUpcomingVisit &&
              !hasOffer &&
              offerAccepted === null) ||
            (hasCancelledVisit &&
              !hasUpcomingVisit &&
              !hasOffer &&
              offerAccepted === null)
              ? handleCreateVisit
              : undefined
          }
          className={cn(
            "inline-flex h-5 min-w-[120px] items-center justify-center gap-1 rounded-full px-2 py-0 text-xs font-medium",
            // Visita pendiente - upcoming visit scheduled (highest priority)
            hasUpcomingVisit && "bg-blue-100 text-blue-800",
            // Oferta aceptada - offer accepted (deal closing!)
            offerAccepted === true && "bg-green-100 text-green-800",
            // Oferta rechazada - offer rejected
            offerAccepted === false && "bg-rose-100 text-rose-800",
            // Oferta pendiente - has pending offer (needs decision)
            hasOffer &&
              !hasUpcomingVisit &&
              offerAccepted === null &&
              "bg-amber-100 text-amber-800",
            // Visita cancelada - has cancelled visit, clickable to reschedule
            hasCancelledVisit &&
              !hasUpcomingVisit &&
              !hasOffer &&
              offerAccepted === null &&
              "cursor-pointer border-2 border-dashed border-orange-400 bg-white text-orange-700 transition-colors hover:border-orange-500 hover:bg-orange-50",
            // Visita perdida - missed visit, clickable to reschedule
            hasMissedVisit &&
              !hasUpcomingVisit &&
              !hasCancelledVisit &&
              !hasOffer &&
              offerAccepted === null &&
              "cursor-pointer border-2 border-dashed border-amber-400 bg-white text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-50",
            // Visita completada - completed visit without offer yet
            hasCompletedVisit &&
              !hasOffer &&
              !hasUpcomingVisit &&
              !hasMissedVisit &&
              !hasCancelledVisit &&
              offerAccepted === null &&
              "bg-gray-100 text-gray-700",
            // Sin visitas - no visits at all and no offer
            !hasUpcomingVisit &&
              !hasMissedVisit &&
              !hasCompletedVisit &&
              !hasCancelledVisit &&
              !hasOffer &&
              offerAccepted === null &&
              "bg-gray-100 text-gray-700",
          )}
        >
          {hasUpcomingVisit && "Visita pendiente"}
          {offerAccepted === true && "Oferta aceptada"}
          {offerAccepted === false && "Oferta rechazada"}
          {hasOffer &&
            !hasUpcomingVisit &&
            offerAccepted === null &&
            "Oferta pendiente"}
          {hasCancelledVisit &&
            !hasUpcomingVisit &&
            !hasOffer &&
            offerAccepted === null &&
            "Visita cancelada"}
          {hasMissedVisit &&
            !hasUpcomingVisit &&
            !hasCancelledVisit &&
            !hasOffer &&
            offerAccepted === null &&
            "Visita perdida"}
          {hasCompletedVisit &&
            !hasOffer &&
            !hasUpcomingVisit &&
            !hasMissedVisit &&
            !hasCancelledVisit &&
            offerAccepted === null &&
            "Visita completada"}
          {!hasUpcomingVisit &&
            !hasMissedVisit &&
            !hasCompletedVisit &&
            !hasCancelledVisit &&
            !hasOffer &&
            offerAccepted === null &&
            "Sin visitas"}
        </span>
      </div>
    </div>
  );
}
