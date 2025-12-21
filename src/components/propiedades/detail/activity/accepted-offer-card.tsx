"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import {
  Loader,
  FileText,
  ThumbsUp,
  Mail,
  Phone,
  MessageCircle,
  CalendarPlus,
  X,
} from "lucide-react";
import { OfferComparisonCard } from "~/components/offer-comparison-card";
import AppointmentModal from "~/components/appointments/appointment-modal";
import { AppointmentTimeline } from "~/components/appointment-timeline";
import { updateOfferStatusAction } from "~/server/actions/listing-contacts";
import { getDealIdAction } from "~/server/actions/arras";
import { navigateToPage } from "~/lib/navigation";
import type { ContactWithDetails, OwnerContact } from "~/types/activity";
import type { VisitData } from "./visits-section";

export interface AcceptedOfferCardProps {
  contact: ContactWithDetails;
  listingId: bigint;
  listingPrice: string;
  ownerContact: OwnerContact | null;
  visits: VisitData[];
  onUpdate: () => void | Promise<void>;
  permissions: {
    canEditContacts: boolean;
  };
}

export function AcceptedOfferCard({
  contact,
  listingId,
  listingPrice,
  ownerContact,
  visits,
  onUpdate,
  permissions,
}: AcceptedOfferCardProps) {
  const router = useRouter();
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const contactName = `${contact.firstName} ${contact.lastName ?? ""}`.trim();

  // Handle opening appointment modal for "Programar Firma"
  const handleScheduleFirma = () => {
    setIsAppointmentModalOpen(true);
  };

  // Handle appointment success
  const handleAppointmentSuccess = async () => {
    await onUpdate();
  };

  // Handle accepting or rejecting an offer
  const handleUpdateOfferStatus = async (accepted: boolean | null) => {
    setIsUpdatingOffer(true);

    try {
      const result = await updateOfferStatusAction(
        contact.listingContactId,
        accepted,
        listingId,
        contact.contactId,
      );

      if (result.success) {
        const message =
          accepted === null
            ? "Oferta cancelada correctamente"
            : accepted
              ? "Oferta aceptada correctamente"
              : "Oferta rechazada";
        toast.success(message);

        // Refresh the contact data after successful update
        if (onUpdate) {
          await onUpdate();
        }
      } else {
        toast.error(
          result.error ?? "Error al actualizar el estado de la oferta",
        );
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast.error("Error al actualizar el estado de la oferta");
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  if (!contact.offer) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3 transition-all hover:shadow-md sm:space-y-4 sm:p-4">
      {/* Header with name and badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="min-w-0 truncate text-base font-semibold text-gray-900 sm:text-lg">
          {contactName}
        </h3>
        <Badge className="w-fit shrink-0 bg-green-100 text-xs text-green-800">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            Oferta Aceptada
          </span>
        </Badge>
      </div>

      {/* Buyer Contact Information */}
      <div className="space-y-1.5 border-b pb-3 sm:pb-4">
        {contact.email && (
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
              className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Enviar email"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {contact.email}
              </span>
            </button>
          </div>
        )}

        {contact.phone && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.open(`tel:${contact.phone}`, "_blank")}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Llamar"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {contact.phone}
              </span>
            </button>
            <button
              onClick={() => {
                const cleanPhone = (contact.phone ?? "").replace(/\D/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-green-600"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">WhatsApp</span>
            </button>
          </div>
        )}
      </div>

      {/* Offer Comparison with Bars */}
      <div className="border-b pb-3 sm:pb-4">
        <OfferComparisonCard offer={contact.offer} listingPrice={listingPrice} />
      </div>

      {/* Action Buttons */}
      {permissions.canEditContacts && (
        <div className="space-y-2 border-b pb-3 sm:pb-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleScheduleFirma}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Programar Firma
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={async () => {
              const result = await getDealIdAction(
                Number(listingId),
                Number(contact.listingContactId),
              );
              if (result.success && result.dealId) {
                navigateToPage(
                  `/propiedades/${listingId}/contrato-arras/${result.dealId}`,
                  router,
                );
              } else {
                toast.error(result.error ?? "No se pudo obtener el deal");
              }
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generar Contrato Arras
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => {
              if (
                confirm(
                  "¿Estás seguro de que deseas cancelar esta oferta?",
                )
              ) {
                void handleUpdateOfferStatus(null);
              }
            }}
            disabled={isUpdatingOffer}
          >
            {isUpdatingOffer ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Cancelar oferta
          </Button>
        </div>
      )}

      {/* Owner Contact Section */}
      {ownerContact && (
        <div className="space-y-1.5">
          <p className="truncate text-sm font-medium text-gray-900">
            {ownerContact.firstName} {ownerContact.lastName ?? ""}
          </p>

          {ownerContact.email && (
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() =>
                  window.open(`mailto:${ownerContact.email}`, "_blank")
                }
                className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                title="Enviar email"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  {ownerContact.email}
                </span>
              </button>
            </div>
          )}

          {ownerContact.phone && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  window.open(`tel:${ownerContact.phone}`, "_blank")
                }
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                title="Llamar"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  {ownerContact.phone}
                </span>
              </button>
              <button
                onClick={() => {
                  const cleanPhone = (ownerContact.phone ?? "").replace(
                    /\D/g,
                    "",
                  );
                  window.open(`https://wa.me/${cleanPhone}`, "_blank");
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-green-600"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visit History Timeline */}
      {visits.length > 0 && (
        <div className="border-t pt-3 sm:pt-4">
          <div className="mb-3">
            <h4 className="mb-1 text-sm font-medium text-gray-900">
              Historial de {contact.firstName} {contact.lastName ?? ""}
            </h4>
            <p className="text-xs text-muted-foreground">
              {visits.length} {visits.length === 1 ? "visita" : "visitas"}{" "}
              registradas
            </p>
          </div>
          <AppointmentTimeline appointments={visits} />
        </div>
      )}

      {/* Appointment Modal for Firma */}
      <AppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={setIsAppointmentModalOpen}
        initialData={{
          listingId,
          contactId: contact.contactId,
          appointmentType: "Firma",
        }}
        mode="create"
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
}
