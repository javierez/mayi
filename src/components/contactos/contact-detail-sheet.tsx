"use client";

import { useState, useEffect } from "react";
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
import { ScrollArea } from "~/components/ui/scroll-area";
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
import {
  deactivateListingContactAction,
  reactivateListingContactAction,
  updateOfferStatusAction,
  addOfferToListingContactAction,
} from "~/server/actions/listing-contacts";
import { OfferComparisonCard } from "~/components/offer-comparison-card";
import { ListingContactComments } from "~/components/contactos/listing-contact-comments";
import { getListingContactCommentsByIdWithAuth } from "~/server/queries/listing-contact-comments";
import {
  createListingContactCommentAction,
  updateListingContactCommentAction,
  deleteListingContactCommentAction,
} from "~/server/actions/listing-contact-comments";
import type { ListingContactCommentWithUser } from "~/types/listing-contact-comments";
import { useSession } from "~/lib/auth-client";

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

// Mini component for offer input
interface OfferInputCardProps {
  label: string;
  onSubmit: (amount: number) => Promise<void>;
  isSubmitting: boolean;
}

function OfferInputCard({
  label,
  onSubmit,
  isSubmitting,
}: OfferInputCardProps) {
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
          className="h-9 min-w-0 flex-1 border-gray-200 bg-gray-50"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || rawValue <= 0}
          className="h-9 w-9 shrink-0 p-0"
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
  const { data: session } = useSession();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [comments, setComments] = useState<ListingContactCommentWithUser[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Fetch comments when sheet opens
  useEffect(() => {
    if (isOpen && contact) {
      setIsLoadingComments(true);
      getListingContactCommentsByIdWithAuth(contact.listingContactId)
        .then((data) => setComments(data))
        .catch((error) => {
          console.error("Error loading comments:", error);
          toast.error("Error al cargar las notas");
        })
        .finally(() => setIsLoadingComments(false));
    }
  }, [isOpen, contact]);

  // Comment handlers
  const handleAddComment = async (tempComment: ListingContactCommentWithUser) => {
    try {
      const result = await createListingContactCommentAction({
        listingContactId: tempComment.listingContactId,
        content: tempComment.content,
        category: tempComment.category ?? null,
        parentId: tempComment.parentId,
      });

      if (result.success) {
        // Refresh comments
        const freshComments = await getListingContactCommentsByIdWithAuth(
          tempComment.listingContactId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error adding comment:", error);
      return { success: false, error: "Error al crear el comentario" };
    }
  };

  const handleEditComment = async (
    commentId: bigint,
    content: string,
    category?: string | null,
  ) => {
    try {
      const result = await updateListingContactCommentAction({
        commentId,
        content,
        category,
      });

      if (result.success && contact) {
        // Refresh comments
        const freshComments = await getListingContactCommentsByIdWithAuth(
          contact.listingContactId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error editing comment:", error);
      return { success: false, error: "Error al editar el comentario" };
    }
  };

  const handleDeleteComment = async (commentId: bigint) => {
    try {
      const result = await deleteListingContactCommentAction(commentId);

      if (result.success && contact) {
        // Refresh comments
        const freshComments = await getListingContactCommentsByIdWithAuth(
          contact.listingContactId,
        );
        setComments(freshComments);
      }

      return result;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: "Error al eliminar el comentario" };
    }
  };

  if (!contact) return null;

  const contactName =
    `${contact.contact.firstName} ${contact.contact.lastName ?? ""}`.trim();

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
        listingId,
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

  // Handle reactivating the contact
  const handleReactivateContact = async () => {
    if (
      !confirm("¿Estás seguro de que deseas reactivar este contacto?")
    ) {
      return;
    }

    setIsReactivating(true);

    try {
      const result = await reactivateListingContactAction(
        contact.listingContactId,
        listingId,
      );

      if (result.success) {
        toast.success("Contacto reactivado correctamente");

        // Refresh the contact data after successful update
        if (onUpdate) {
          await onUpdate();
        }

        onClose();
      } else {
        toast.error(result.error ?? "Error al reactivar el contacto");
      }
    } catch (error) {
      console.error("Error reactivating contact:", error);
      toast.error("Error al reactivar el contacto");
    } finally {
      setIsReactivating(false);
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
        contact.contact.contactId,
      );

      if (result.success) {
        const message =
          accepted === null
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

  // Handle adding an offer
  const handleAddOffer = async (amount: number) => {
    setIsSubmittingOffer(true);

    try {
      const result = await addOfferToListingContactAction(
        contact.listingContactId,
        amount,
        listingId,
        contact.contact.contactId,
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

  // Highest priority: Check if contact is inactive
  if (contact.isActive === false) {
    badgeType = "inactive";
    badgeConfig = {
      color: "bg-gray-200 text-gray-600 border border-gray-400 hover:bg-gray-300",
      icon: <UserX className="h-4 w-4" />,
      title: "Inactivo",
    };
  } else if (contact.hasUpcomingVisit) {
    badgeType = "upcoming";
    badgeConfig = {
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      icon: <CalendarIcon className="h-4 w-4" />,
      title: "Visita Pendiente",
    };
  } else if (contact.offerAccepted === true) {
    badgeType = "offerAccepted";
    badgeConfig = {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      icon: <ThumbsUp className="h-4 w-4" />,
      title: "Oferta Aceptada",
    };
  } else if (contact.offerAccepted === false) {
    badgeType = "offerRejected";
    badgeConfig = {
      color: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      icon: <ThumbsDown className="h-4 w-4" />,
      title: "Oferta Rechazada",
    };
  } else if (contact.hasOffer) {
    badgeType = "offer";
    badgeConfig = {
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      icon: <Handshake className="h-4 w-4" />,
      title: "Oferta Pendiente",
    };
  } else if (contact.hasCancelledVisit) {
    badgeType = "cancelled";
    badgeConfig = {
      color: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      icon: <X className="h-4 w-4" />,
      title: "Visita Cancelada",
    };
  } else if (contact.hasMissedVisit) {
    badgeType = "missed";
    badgeConfig = {
      color: "bg-red-100 text-red-800 hover:bg-red-200",
      icon: <Clock className="h-4 w-4" />,
      title: "Visita Perdida",
    };
  } else if (contact.hasCompletedVisit) {
    badgeType = "completed";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      icon: <Check className="h-4 w-4" />,
      title: "Visita Completada",
    };
  } else {
    badgeType = "none";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      icon: <CalendarPlus className="h-4 w-4" />,
      title: "Sin Visitas",
    };
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full max-w-full sm:max-w-md md:max-w-2xl p-0">
        <SheetHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg break-words">
            <span>{contactName}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-3 sm:mt-4">
          <div className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
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
              {/* Inactive Contact - Show only reactivate option */}
              {badgeType === "inactive" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    Este contacto está inactivo. No se mostrará en la lista de
                    contactos activos de la propiedad.
                  </p>
                </div>
                {permissions.canEditContacts && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-10 w-full sm:h-9"
                    onClick={() => {
                      void handleReactivateContact();
                    }}
                    disabled={isReactivating}
                  >
                    {isReactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Reactivar Contacto
                  </Button>
                )}
              </div>
            )}

            {/* Offer Input for Visita Pendiente (upcoming visit) */}
            {badgeType === "upcoming" &&
              !contact.hasOffer &&
              permissions.canEditContacts && (
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
                  <div className="space-y-2 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                      onClick={() => {
                        const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}&type=Firma`;
                        navigateToPage(calendarUrl, router);
                        onClose();
                      }}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">Programar Firma</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                      onClick={() => {
                        // TODO: Implement contract generation
                        toast.error("Funcionalidad en desarrollo");
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">Generar Contrato Arras</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                      onClick={() => {
                        if (
                          confirm(
                            "¿Estás seguro de que deseas revocar la aceptación de esta oferta?",
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
                        <X className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">Revocar Decisión</span>
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
                  <div className="space-y-3 border-t pt-3">
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
                        className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                        onClick={() => {
                          if (
                            confirm(
                              "¿Estás seguro de que deseas revocar el rechazo de esta oferta?",
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
                          <X className="mr-2 h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">Revocar Decisión</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9"
                        onClick={() => {
                          void handleDeactivateContact();
                        }}
                        disabled={isDeactivating}
                      >
                        {isDeactivating ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="mr-2 h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">Dar de baja</span>
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
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Añadir visita</span>
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">Dar de baja</span>
                  </Button>
                )}
              </div>
            )}

            {badgeType === "missed" && (
              <div className="space-y-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Añadir visita</span>
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">Dar de baja</span>
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
                      className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9"
                      onClick={() => {
                        void handleDeactivateContact();
                      }}
                      disabled={isDeactivating}
                    >
                      {isDeactivating ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">Dar de baja</span>
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
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => {
                    const calendarUrl = `/calendario?new=true&listingId=${listingId}&contactId=${contact.contact.contactId}`;
                    navigateToPage(calendarUrl, router);
                    onClose();
                  }}
                >
                  <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Añadir visita</span>
                </Button>
                {permissions.canEditContacts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9"
                    onClick={() => {
                      void handleDeactivateContact();
                    }}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserX className="mr-2 h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">Dar de baja</span>
                  </Button>
                )}
              </div>
            )}

            {/* Owner Contact Section */}
            {ownerContact && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-gray-900 break-words">
                  {ownerContact.firstName} {ownerContact.lastName ?? ""}
                </p>

                {ownerContact.email && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        window.open(`mailto:${ownerContact.email}`, "_blank")
                      }
                      className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                      title="Enviar email"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                        {ownerContact.email}
                      </span>
                    </button>
                  </div>
                )}

                {ownerContact.phone && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      onClick={() =>
                        window.open(`tel:${ownerContact.phone}`, "_blank")
                      }
                      className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
                      title="Llamar"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
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
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-green-600"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                )}

                {/* Accept/Reject Offer Buttons - Only show when there's an offer */}
                {badgeType === "offer" && permissions.canEditContacts && (
                  <div className="flex items-center gap-2 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 min-w-0 flex-1 justify-center gap-2 text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-md sm:h-9"
                      onClick={() => {
                        void handleUpdateOfferStatus(true);
                      }}
                      disabled={isUpdatingOffer}
                    >
                      {isUpdatingOffer ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">Aceptar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 min-w-0 flex-1 justify-center gap-2 text-gray-700 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 hover:shadow-md sm:h-9"
                      onClick={() => {
                        void handleUpdateOfferStatus(false);
                      }}
                      disabled={isUpdatingOffer}
                    >
                      {isUpdatingOffer ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">Rechazar</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Listing Contact Comments Section */}
            <div className="border-t pt-4 mt-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <ListingContactComments
                  listingContactId={contact.listingContactId}
                  initialComments={comments}
                  currentUserId={session?.user?.id}
                  currentUser={session?.user ? {
                    id: session.user.id,
                    name: session.user.name ?? undefined,
                    image: session.user.image ?? undefined,
                  } : undefined}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}
            </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
