"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  CalendarIcon,
  Check,
  Clock,
  X,
  Handshake,
  CalendarPlus,
  UserX,
  ThumbsUp,
  ThumbsDown,
  Mail,
  Phone,
  MessageCircle,
  Loader,
  FileText,
} from "lucide-react";
import type { ContactSheetData, OwnerContact } from "~/types/activity";
import { navigateToPage } from "~/lib/navigation";
import { deactivateListingContactAction, updateOfferStatusAction, addOfferToListingContactAction } from "~/server/actions/listing-contacts";

interface ContactDetailSheetProps {
  contact: ContactSheetData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void | Promise<void>;
  listingId: bigint;
  listingPrice: string;
  ownerContact: OwnerContact | null;
  permissions: {
    canEditContacts: boolean;
  };
}

// Mini component to display offer comparison
interface OfferComparisonCardProps {
  offer: number;
  listingPrice: string;
}

function OfferComparisonCard({ offer, listingPrice }: OfferComparisonCardProps) {
  const listingPriceNum = parseFloat(listingPrice);
  const difference = offer - listingPriceNum;
  const percentageDiff = ((difference / listingPriceNum) * 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDifferenceColor = () => {
    if (difference < 0) return "text-green-600";
    if (difference > 0) return "text-red-600";
    return "text-gray-600";
  };

  const getDifferenceSign = () => {
    if (difference > 0) return "+";
    return "";
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Comparación de Oferta</h4>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Oferta</p>
          <p className="font-semibold text-gray-900">{formatCurrency(offer)}</p>
        </div>

        <div>
          <p className="text-muted-foreground">Precio de Venta</p>
          <p className="font-semibold text-gray-900">{formatCurrency(listingPriceNum)}</p>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-muted-foreground">Diferencia</p>
        <p className={`font-semibold ${getDifferenceColor()}`}>
          {getDifferenceSign()}{formatCurrency(Math.abs(difference))} ({getDifferenceSign()}{Math.abs(percentageDiff).toFixed(2)}%)
        </p>
      </div>
    </div>
  );
}

// Mini component for offer input
interface OfferInputCardProps {
  label: string;
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting: boolean;
}

function OfferInputCard({ label, onSubmit, isSubmitting }: OfferInputCardProps) {
  const [inputValue, setInputValue] = useState("");
  const [rawValue, setRawValue] = useState<number>(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const numericValue = e.target.value.replace(/\D/g, "");
    const numberValue = numericValue === "" ? 0 : parseInt(numericValue, 10);

    setRawValue(numberValue);

    // Format for display
    if (numericValue === "") {
      setInputValue("");
    } else {
      setInputValue(formatCurrency(numberValue));
    }
  };

  const handleSubmit = async () => {
    if (rawValue <= 0) {
      toast.error("Por favor, ingresa una oferta válida");
      return;
    }

    await onSubmit(rawValue);

    // Clear input on success
    setInputValue("");
    setRawValue(0);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="0 €"
          value={inputValue}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="flex-1 h-9 bg-gray-50 border-gray-200"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || rawValue <= 0}
          className="h-9 w-9 p-0"
        >
          {isSubmitting ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ContactDetailSheet({
  contact,
  isOpen,
  onClose,
  onUpdate,
  listingId,
  listingPrice,
  ownerContact,
  permissions,
}: ContactDetailSheetProps) {
  const router = useRouter();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  if (!contact) return null;

  const contactName = `${contact.contact.firstName} ${contact.contact.lastName ?? ""}`.trim();

  // Handle deactivating the contact
  const handleDeactivateContact = async () => {
    if (!confirm("¿Estás seguro de que deseas dar de baja este contacto?")) {
      return;
    }

    setIsDeactivating(true);

    // Optimistically close the sheet and trigger parent update
    onClose();
    if (onUpdate) {
      await onUpdate();
    }

    try {
      const result = await deactivateListingContactAction(
        contact.listingContactId,
        listingId
      );

      if (result.success) {
        toast.success("Contacto dado de baja correctamente");
      } else {
        toast.error(result.error ?? "Error al dar de baja el contacto");
        // On error, trigger update again to revert optimistic change
        if (onUpdate) {
          await onUpdate();
        }
      }
    } catch (error) {
      console.error("Error deactivating contact:", error);
      toast.error("Error al dar de baja el contacto");
      // On error, trigger update again to revert optimistic change
      if (onUpdate) {
        await onUpdate();
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handle accepting or rejecting an offer
  const handleUpdateOfferStatus = async (accepted: boolean | null) => {
    setIsUpdatingOffer(true);

    try {
      const result = await updateOfferStatusAction(
        contact.listingContactId,
        accepted,
        listingId,
        contact.contact.contactId
      );

      if (result.success) {
        const message = accepted === null
          ? "Decisión revocada correctamente"
          : accepted
            ? "Oferta aceptada correctamente"
            : "Oferta rechazada";
        toast.success(message);

        // Refresh the contact data after successful update
        if (onUpdate) {
          await onUpdate();
        }

        onClose();
      } else {
        toast.error(result.error ?? "Error al actualizar el estado de la oferta");
      }
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast.error("Error al actualizar el estado de la oferta");
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  // Handle adding an offer
  const handleAddOffer = async (amount: number) => {
    setIsSubmittingOffer(true);

    try {
      const result = await addOfferToListingContactAction(
        contact.listingContactId,
        amount,
        listingId,
        contact.contact.contactId
      );

      if (result.success) {
        toast.success("Oferta registrada correctamente");

        // Refresh the contact data after successful update
        if (onUpdate) {
          await onUpdate();
        }
      } else {
        toast.error(result.error ?? "Error al registrar la oferta");
      }
    } catch (error) {
      console.error("Error adding offer:", error);
      toast.error("Error al registrar la oferta");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Determine badge type and config
  let badgeType: string;
  let badgeConfig: { color: string; icon: React.ReactElement; title: string };

  if (contact.hasUpcomingVisit) {
    badgeType = "upcoming";
    badgeConfig = {
      color: "bg-blue-100 text-blue-800",
      icon: <CalendarIcon className="h-4 w-4" />,
      title: "Visita Pendiente",
    };
  } else if (contact.offerAccepted === true) {
    badgeType = "offerAccepted";
    badgeConfig = {
      color: "bg-green-100 text-green-800",
      icon: <ThumbsUp className="h-4 w-4" />,
      title: "Oferta Aceptada",
    };
  } else if (contact.offerAccepted === false) {
    badgeType = "offerRejected";
    badgeConfig = {
      color: "bg-rose-100 text-rose-800",
      icon: <ThumbsDown className="h-4 w-4" />,
      title: "Oferta Rechazada",
    };
  } else if (contact.hasOffer) {
    badgeType = "offer";
    badgeConfig = {
      color: "bg-amber-100 text-amber-800",
      icon: <Handshake className="h-4 w-4" />,
      title: "Oferta Pendiente",
    };
  } else if (contact.hasCancelledVisit) {
    badgeType = "cancelled";
    badgeConfig = {
      color: "bg-orange-100 text-orange-800",
      icon: <X className="h-4 w-4" />,
      title: "Visita Cancelada",
    };
  } else if (contact.hasMissedVisit) {
    badgeType = "missed";
    badgeConfig = {
      color: "bg-red-100 text-red-800",
      icon: <Clock className="h-4 w-4" />,
      title: "Visita Perdida",
    };
  } else if (contact.hasCompletedVisit) {
    badgeType = "completed";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700",
      icon: <Check className="h-4 w-4" />,
      title: "Visita Completada",
    };
  } else {
    badgeType = "none";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700",
      icon: <CalendarPlus className="h-4 w-4" />,
      title: "Sin Visitas",
    };
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{contactName}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Badge Status - Only show if not "none" */}
          {badgeType !== "none" && (
            <div className="flex items-center justify-between">
              <Badge className={badgeConfig.color}>
                <span className="flex items-center gap-1">
                  {badgeConfig.icon}
                  {badgeConfig.title}
                </span>
              </Badge>
            </div>
          )}

          {/* Content based on badge type */}
          <div className="space-y-4">
            {/* Offer Input for Visita Pendiente (upcoming visit) */}
            {badgeType === "upcoming" && !contact.hasOffer && permissions.canEditContacts && (
              <OfferInputCard
                label="Registrar Oferta"
                onSubmit={handleAddOffer}
                isSubmitting={isSubmittingOffer}
              />
            )}

            {badgeType === "offer" && contact.offer && (
              <OfferComparisonCard
                offer={contact.offer}
                listingPrice={listingPrice}
              />
            )}

            {badgeType === "offerAccepted" && contact.offer && (
              <div className="space-y-3">
                <OfferComparisonCard
                  offer={contact.offer}
                  listingPrice={listingPrice}
                />
                {permissions.canEditContacts && (
                  <div className="space-y-2 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}&type=Firma`;
                        navigateToPage(calendarUrl, router);
                        onClose();
                      }}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Programar Firma
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        // TODO: Implement contract generation
                        toast.error("Funcionalidad en desarrollo");
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generar Contrato Arras
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => {
                        if (confirm("¿Estás seguro de que deseas revocar la aceptación de esta oferta?")) {
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
                      Revocar Decisión
                    </Button>
                  </div>
                )}
              </div>
            )}

            {badgeType === "offerRejected" && contact.offer && (
              <div className="space-y-3">
                <OfferComparisonCard
                  offer={contact.offer}
                  listingPrice={listingPrice}
                />
                {permissions.canEditContacts && (
                  <div className="space-y-3 pt-3 border-t">
                    {/* New Offer Input for Rejected Offer */}
                    <OfferInputCard
                      label="Nueva Oferta"
                      onSubmit={handleAddOffer}
                      isSubmitting={isSubmittingOffer}
                    />
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        onClick={() => {
                          if (confirm("¿Estás seguro de que deseas revocar el rechazo de esta oferta?")) {
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
                        Revocar Decisión
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          void handleDeactivateContact();
                        }}
                        disabled={isDeactivating}
                      >
                        {isDeactivating ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="mr-2 h-4 w-4" />
                        )}
                        Dar de baja
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {badgeType === "cancelled" && (
              <div className="space-y-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Añadir visita
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4" />
                    )}
                    Dar de baja
                  </Button>
                )}
              </div>
            )}

            {badgeType === "missed" && (
              <div className="space-y-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Añadir visita
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4" />
                    )}
                    Dar de baja
                  </Button>
                )}
              </div>
            )}

            {badgeType === "completed" && (
              <div className="space-y-3">
                {/* Offer Input for Visita Completada */}
                {!contact.hasOffer && permissions.canEditContacts && (
                  <OfferInputCard
                    label="Registrar Oferta"
                    onSubmit={handleAddOffer}
                    isSubmitting={isSubmittingOffer}
                  />
                )}
                {permissions.canEditContacts && (
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        void handleDeactivateContact();
                      }}
                      disabled={isDeactivating}
                    >
                      {isDeactivating ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="mr-2 h-4 w-4" />
                      )}
                      Dar de baja
                    </Button>
                  </div>
                )}
              </div>
            )}

            {badgeType === "none" && (
              <div className="space-y-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Añadir visita
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4" />
                    )}
                    Dar de baja
                  </Button>
                )}
              </div>
            )}

            {/* Owner Contact Section */}
            {ownerContact && (
              <div className="space-y-3 pt-4 border-t">
                <h5 className="text-sm font-medium text-muted-foreground">Contactar Propietario</h5>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    {ownerContact.firstName} {ownerContact.lastName ?? ""}
                  </p>

                  {ownerContact.email && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => window.open(`mailto:${ownerContact.email}`, "_blank")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                        title="Enviar email"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                          {ownerContact.email}
                        </span>
                      </button>
                    </div>
                  )}

                  {ownerContact.phone && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => window.open(`tel:${ownerContact.phone}`, "_blank")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                        title="Llamar"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="underline decoration-dotted underline-offset-2 hover:decoration-solid">
                          {ownerContact.phone}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          const cleanPhone = (ownerContact.phone ?? "").replace(/\D/g, "");
                          window.open(`https://wa.me/${cleanPhone}`, "_blank");
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-600 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Accept/Reject Offer Buttons - Only show when there's an offer */}
                {badgeType === "offer" && permissions.canEditContacts && (
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-center gap-2 h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100 shadow-sm hover:shadow-md transition-all"
                      onClick={() => {
                        void handleUpdateOfferStatus(true);
                      }}
                      disabled={isUpdatingOffer}
                    >
                      {isUpdatingOffer ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Aceptar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-center gap-2 h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100 shadow-sm hover:shadow-md transition-all"
                      onClick={() => {
                        void handleUpdateOfferStatus(false);
                      }}
                      disabled={isUpdatingOffer}
                    >
                      {isUpdatingOffer ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
