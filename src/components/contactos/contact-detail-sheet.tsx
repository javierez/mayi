"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { ListingContactActivityTimeline } from "~/components/contactos/listing-contact-activity-timeline";
import { AddListingContactActivityModal } from "~/components/contactos/add-listing-contact-activity-modal";
import { getListingContactActivityByListingContactIdWithAuth } from "~/server/queries/listing-contact-activity";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import { deleteListingContactActivityAction } from "~/server/actions/listing-contact-activity";
import { canDeleteAllTasks } from "~/app/actions/permissions/check-permissions";
import { Plus } from "lucide-react";
import AppointmentModal from "~/components/appointments/appointment-modal";
import { getDealIdAction } from "~/server/actions/arras";

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
  const [activeTab, setActiveTab] = useState<"comments" | "actions">("actions");
  const [activities, setActivities] = useState<ListingContactActivityWithUser[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [hasDeleteAllPermission, setHasDeleteAllPermission] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentInitialData, setAppointmentInitialData] = useState<{
    contactId?: bigint;
    listingId?: bigint;
    appointmentType?: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje";
  }>({});

  // Fetch comments when sheet opens
  useEffect(() => {
    if (isOpen && contact) {
      console.log("📄 [ContactDetailSheet] Sheet opened with contact data:", {
        contactName: `${contact.contact.firstName} ${contact.contact.lastName ?? ""}`,
        listingContactId: contact.listingContactId.toString(),
        contactId: contact.contact.contactId.toString(),
        hasUpcomingVisit: contact.hasUpcomingVisit,
        upcomingAppointmentId: contact.upcomingAppointmentId?.toString(),
        hasMissedVisit: contact.hasMissedVisit,
        missedAppointmentId: contact.missedAppointmentId?.toString(),
        hasCompletedVisit: contact.hasCompletedVisit,
        hasCancelledVisit: contact.hasCancelledVisit,
        hasOffer: contact.hasOffer,
        offer: contact.offer,
        offerAccepted: contact.offerAccepted,
        isActive: contact.isActive,
      });
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

  // Fetch delete permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const deleteAllPerm = await canDeleteAllTasks();
        setHasDeleteAllPermission(deleteAllPerm);
      } catch (error) {
        console.error("Error fetching delete permissions:", error);
        setHasDeleteAllPermission(false);
      }
    };
    void fetchPermissions();
  }, []);

  // Fetch activities when Actions tab is active
  useEffect(() => {
    if (isOpen && contact && activeTab === "actions") {
      setIsLoadingActivities(true);
      getListingContactActivityByListingContactIdWithAuth(contact.listingContactId)
        .then((data) => setActivities(data))
        .catch((error) => {
          console.error("Error loading activities:", error);
          toast.error("Error al cargar las actividades");
        })
        .finally(() => setIsLoadingActivities(false));
    }
  }, [isOpen, contact, activeTab]);

  // Refresh activities handler
  const handleRefreshActivities = async () => {
    if (!contact) return;
    setIsLoadingActivities(true);
    try {
      const data = await getListingContactActivityByListingContactIdWithAuth(
        contact.listingContactId,
      );
      setActivities(data);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      toast.error("Error al actualizar las actividades");
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Delete activity handler
  const handleDeleteActivity = async (activityId: bigint, activityType: "listing" | "contact") => {
    let result;

    if (activityType === "listing") {
      result = await deleteListingContactActivityAction(activityId);
    } else {
      // Import the delete contact activity action
      const { deleteContactActivityAction } = await import("~/server/actions/contact-activity");
      result = await deleteContactActivityAction(activityId);
    }

    if (result.success) {
      // Refresh activities after deletion
      await handleRefreshActivities();
    } else {
      throw new Error(result.error ?? "Error al eliminar la actividad");
    }
  };

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

  // Handle opening appointment modal
  const handleOpenAppointmentModal = (type?: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje") => {
    setAppointmentInitialData({
      contactId: contact?.contact.contactId,
      listingId,
      appointmentType: type ?? "Visita",
    });
    setIsAppointmentModalOpen(true);
  };

  // Handle appointment modal success
  const handleAppointmentSuccess = async () => {
    // Refresh activities and contact data
    await handleRefreshActivities();
    if (onUpdate) {
      await onUpdate();
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

  console.log("🔍 [Badge Status] Starting status determination for contact:", {
    contactName,
    listingContactId: contact.listingContactId.toString(),
    isActive: contact.isActive,
    hasUpcomingVisit: contact.hasUpcomingVisit,
    offerAccepted: contact.offerAccepted,
    hasOffer: contact.hasOffer,
    offer: contact.offer,
    hasCancelledVisit: contact.hasCancelledVisit,
    hasMissedVisit: contact.hasMissedVisit,
    hasCompletedVisit: contact.hasCompletedVisit,
  });

  // Badge priority based on LATEST visit status (not counts)
  // Priority: inactive > upcoming > offer accepted > offer rejected > offer pending > completed > cancelled > missed > none
  if (contact.isActive === false) {
    console.log("✅ [Badge Status] Matched: INACTIVE");
    badgeType = "inactive";
    badgeConfig = {
      color: "bg-gray-200 text-gray-600 border border-gray-400 hover:bg-gray-300",
      icon: <UserX className="h-4 w-4" />,
      title: "Inactivo",
    };
  } else if (contact.hasUpcomingVisit) {
    console.log("✅ [Badge Status] Matched: UPCOMING VISIT", {
      skippedOfferAccepted: contact.offerAccepted,
      skippedHasOffer: contact.hasOffer,
    });
    badgeType = "upcoming";
    badgeConfig = {
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      icon: <CalendarIcon className="h-4 w-4" />,
      title: "Visita Pendiente",
    };
  } else if (contact.offerAccepted === true) {
    console.log("✅ [Badge Status] Matched: OFFER ACCEPTED");
    badgeType = "offerAccepted";
    badgeConfig = {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      icon: <ThumbsUp className="h-4 w-4" />,
      title: "Oferta Aceptada",
    };
  } else if (contact.offerAccepted === false) {
    console.log("✅ [Badge Status] Matched: OFFER REJECTED");
    badgeType = "offerRejected";
    badgeConfig = {
      color: "bg-rose-100 text-rose-800 hover:bg-rose-200",
      icon: <ThumbsDown className="h-4 w-4" />,
      title: "Oferta Rechazada",
    };
  } else if (contact.hasOffer) {
    console.log("✅ [Badge Status] Matched: OFFER PENDING");
    badgeType = "offer";
    badgeConfig = {
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      icon: <Handshake className="h-4 w-4" />,
      title: "Oferta Pendiente",
    };
  } else if (contact.hasCompletedVisit) {
    console.log("✅ [Badge Status] Matched: COMPLETED VISIT", {
      hasOffer: contact.hasOffer,
      offerAccepted: contact.offerAccepted,
    });
    badgeType = "completed";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      icon: <Check className="h-4 w-4" />,
      title: "Visita Completada",
    };
  } else if (contact.hasCancelledVisit) {
    console.log("✅ [Badge Status] Matched: CANCELLED VISIT");
    badgeType = "cancelled";
    badgeConfig = {
      color: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      icon: <X className="h-4 w-4" />,
      title: "Visita Cancelada",
    };
  } else if (contact.hasMissedVisit) {
    console.log("✅ [Badge Status] Matched: MISSED VISIT");
    badgeType = "missed";
    badgeConfig = {
      color: "bg-red-100 text-red-800 hover:bg-red-200",
      icon: <Clock className="h-4 w-4" />,
      title: "Visita Perdida",
    };
  } else {
    console.log("✅ [Badge Status] Matched: NONE (no visits)");
    badgeType = "none";
    badgeConfig = {
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      icon: <CalendarPlus className="h-4 w-4" />,
      title: "Sin Visitas",
    };
  }

  console.log("🏷️ [ContactDetailSheet] Badge type determined:", {
    badgeType,
    badgeTitle: badgeConfig.title,
    contactHasUpcomingVisit: contact.hasUpcomingVisit,
    upcomingAppointmentId: contact.upcomingAppointmentId?.toString(),
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full max-w-full sm:max-w-md md:max-w-2xl p-0 [&>button]:hidden">
        <SheetHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2 text-base sm:text-lg break-words min-w-0 flex-1">
              <button
                onClick={() => {
                  navigateToPage(`/contactos/${contact.contact.contactId}`, router);
                  onClose();
                }}
                className="text-left hover:text-gray-600 transition-colors underline decoration-dotted underline-offset-2 hover:decoration-solid"
                title="Ver perfil completo"
              >
                {contactName}
              </button>
            </SheetTitle>

            {/* Custom Close Button */}
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-1 sm:mt-2">
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
            {badgeType === "upcoming" && (
              <div className="space-y-1">
                {(() => {
                  console.log("🔍 [Registrar Visita Button] Checking conditions:", {
                    badgeType,
                    hasUpcomingAppointmentId: !!contact.upcomingAppointmentId,
                    upcomingAppointmentId: contact.upcomingAppointmentId?.toString(),
                  });
                  return null;
                })()}
                {contact.upcomingAppointmentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                    onClick={() => {
                      console.log("🔘 [Registrar Visita] Button clicked, navigating to:", `/calendario/visita/${contact.upcomingAppointmentId}`);
                      navigateToPage(
                        `/calendario/visita/${contact.upcomingAppointmentId}`,
                        router,
                      );
                      onClose();
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Registrar Visita</span>
                  </Button>
                )}
                {!contact.hasOffer && permissions.canEditContacts && (
                  <div className="mt-2">
                    <OfferInputCard
                      label="Registrar Oferta"
                      onSubmit={handleAddOffer}
                      isSubmitting={isSubmittingOffer}
                    />
                  </div>
                )}
              </div>
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
                      onClick={() => handleOpenAppointmentModal("Firma")}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">Programar Firma</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
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
                          onClose();
                        } else {
                          toast.error(
                            result.error ?? "No se pudo obtener el deal",
                          );
                        }
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
                        onClick={() => handleOpenAppointmentModal("Visita")}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">Añadir Nueva Visita</span>
                      </Button>
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
              <div className="space-y-1 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => handleOpenAppointmentModal("Visita")}
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
              <div className="space-y-1">
                {(() => {
                  console.log("🔍 [Registrar Visita Button - Missed] Checking conditions:", {
                    badgeType,
                    hasMissedAppointmentId: !!contact.missedAppointmentId,
                    missedAppointmentId: contact.missedAppointmentId?.toString(),
                  });
                  return null;
                })()}
                {contact.missedAppointmentId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                    onClick={() => {
                      console.log("🔘 [Registrar Visita - Missed] Button clicked, navigating to:", `/calendario/visita/${contact.missedAppointmentId}`);
                      navigateToPage(
                        `/calendario/visita/${contact.missedAppointmentId}`,
                        router,
                      );
                      onClose();
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Registrar Visita</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => handleOpenAppointmentModal("Visita")}
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
              <div className="space-y-1">
                {/* Offer Input for Visita Completada */}
                {!contact.hasOffer && permissions.canEditContacts && (
                  <div className="mt-2">
                    <OfferInputCard
                      label="Registrar Oferta"
                      onSubmit={handleAddOffer}
                      isSubmitting={isSubmittingOffer}
                    />
                  </div>
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
              <div className="space-y-1 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:h-9"
                  onClick={() => handleOpenAppointmentModal("Visita")}
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

            {/* Tabs Section: Comments and Actions */}
            <div className="border-t pt-4 mt-4">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "comments" | "actions")}>
                <div className="flex items-center gap-2 mb-4">
                  <TabsList className="grid w-full grid-cols-2 flex-1">
                    <TabsTrigger value="actions">Acciones</TabsTrigger>
                    <TabsTrigger value="comments">Comentarios</TabsTrigger>
                  </TabsList>
                  {activeTab === "actions" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddActivityModalOpen(true)}
                      className="h-8 w-8 p-0 shrink-0 hover:bg-gray-100"
                      title="Agregar actividad"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <TabsContent value="comments" className="mt-4">
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
                </TabsContent>

                <TabsContent value="actions" className="mt-4">
                  {/* Activities Timeline */}
                  <ListingContactActivityTimeline
                    activities={activities}
                    loading={isLoadingActivities}
                    onDelete={async (activityId) => handleDeleteActivity(activityId, "listing")}
                    canDeleteAll={hasDeleteAllPermission}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Add Activity Modal */}
            <AddListingContactActivityModal
              open={isAddActivityModalOpen}
              onOpenChange={setIsAddActivityModalOpen}
              listingContactId={contact.listingContactId}
              onSuccess={handleRefreshActivities}
            />

            {/* Appointment Modal */}
            <AppointmentModal
              open={isAppointmentModalOpen}
              onOpenChange={setIsAppointmentModalOpen}
              initialData={appointmentInitialData}
              onSuccess={handleAppointmentSuccess}
              mode="create"
            />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
