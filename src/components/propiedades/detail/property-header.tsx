"use client";

import { MapPin, Check, X, MoreVertical } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatPrice, cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { updatePropertyTitle } from "~/app/actions/property-settings";
import { updateListingStatus, updateListingOpportunity, updateListingFeatured } from "~/app/actions/listing-settings";
import { toast } from "sonner";
import { formatListingType } from "../../contactos/contact-config";
import { generatePropertyTitle } from "~/lib/property-title";
import { CompletionTrackerModal } from "../completion-tracker-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { calculateCompletion } from "~/lib/properties/completion-tracker";

const statusColors: Record<string, string> = {
  Sale: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-200 hover:text-amber-900 hover:border-amber-400 hover:shadow-lg hover:scale-105",
  Rent: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-200 hover:text-rose-900 hover:border-rose-400 hover:shadow-lg hover:scale-105",
  Sold: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-200 hover:text-gray-800 hover:border-gray-400 hover:shadow-lg hover:scale-105",
  RoomSharing:
    "bg-gradient-to-r from-amber-50 to-rose-50 text-rose-600 border-rose-200 hover:from-amber-200 hover:to-rose-200 hover:text-rose-900 hover:border-rose-400 hover:shadow-lg hover:scale-105",
  Transfer:
    "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-300 hover:text-amber-900 hover:border-amber-500 hover:shadow-lg hover:scale-105",
  RentWithOption:
    "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-300 hover:text-rose-900 hover:border-rose-500 hover:shadow-lg hover:scale-105",
};

interface PropertyHeaderProps {
  title?: string;
  propertyId?: bigint;
  listingId?: bigint; // Add listingId for status updates
  propertyType?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  referenceNumber?: string;
  price: string;
  listingType: string;
  status?: string; // 'En Venta' | 'En Alquiler' | 'Vendido' | 'Draft'
  isBankOwned?: boolean;
  isFeatured?: boolean;
  isOpportunity?: boolean;
  neighborhood?: string;
  // Optional props for dynamic title generation
  dynamicTitle?: boolean; // If true, generate title dynamically instead of using title prop
  // Full listing object for completion tracking
  listing?: Record<string, unknown>;
}

export function PropertyHeader({
  title = "",
  propertyId,
  listingId,
  propertyType,
  street,
  city,
  province,
  postalCode,
  referenceNumber: _referenceNumber,
  price,
  listingType,
  status,
  isBankOwned = false,
  isFeatured: initialIsFeatured = false,
  isOpportunity: initialIsOpportunity = false,
  neighborhood,
  dynamicTitle = false,
  listing,
}: PropertyHeaderProps) {
  // Generate dynamic title if enabled, otherwise use provided title
  const displayTitle =
    dynamicTitle && propertyType
      ? generatePropertyTitle(propertyType, street, neighborhood ?? "")
      : title;

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(displayTitle);
  const [currentTitle, setCurrentTitle] = useState(displayTitle);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenUpdated, setHasBeenUpdated] = useState(false);

  // Status toggle state
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Opportunity toggle state
  const [isOpportunity, setIsOpportunity] = useState(initialIsOpportunity);
  const [isUpdatingOpportunity, setIsUpdatingOpportunity] = useState(false);

  // Featured toggle state
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);

  // Completion tracker modal state
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  // Check if we're on the main property page (not a sub-page)
  const pathname = usePathname();
  const isMainPropertyPage = pathname
    ? /^\/propiedades\/\d+\/?$/.test(pathname)
    : false;

  // Calculate completion percentage from listing data
  const completion = listing ? calculateCompletion(listing) : null;

  // Use ONLY mandatory fields for the percentage ring
  const mandatoryTotal = completion?.mandatory.total ?? 0;
  const mandatoryCompleted = completion?.mandatory.completedCount ?? 0;
  const completionPercentage =
    mandatoryTotal > 0
      ? Math.round((mandatoryCompleted / mandatoryTotal) * 100)
      : 0;

  // Determine color based on mandatory fields completion (green when all mandatory are complete)
  const completionColor = completion?.canPublishToPortals
    ? "#10b981" // green - all mandatory complete
    : completionPercentage >= 50
      ? "#f59e0b" // amber
      : "#ef4444"; // red

  // Calculate circle dash properties for SVG
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (completionPercentage / 100) * circumference;

  // Update titles when displayTitle changes (for dynamic mode) but only if we haven't manually updated the title
  useEffect(() => {
    if (!isEditing && !hasBeenUpdated) {
      setCurrentTitle(displayTitle);
      setEditedTitle(displayTitle);
    }
  }, [displayTitle, isEditing, hasBeenUpdated]);

  const handleSave = async () => {
    if (!editedTitle.trim() || !propertyId) return;

    setIsLoading(true);
    try {
      const result = await updatePropertyTitle(propertyId, editedTitle);

      if (result.success) {
        setCurrentTitle(result.title!);
        setHasBeenUpdated(true); // Mark that we've manually updated the title
        setIsEditing(false);
        toast.success("Título actualizado correctamente");
      } else {
        toast.error(result.error ?? "Error al actualizar el título");
        setEditedTitle(currentTitle); // Reset on error
      }
    } catch (error) {
      console.error("Error updating title:", error);
      toast.error("Error al actualizar el título");
      setEditedTitle(currentTitle); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(currentTitle);
    setIsEditing(false);
  };

  // Toggle logic function - only changes status, listingType stays constant
  const getToggledStatus = (type: string, currentStat: string | undefined) => {
    // Determine if we're currently in "active" or "completed" state
    const isCompleted =
      currentStat === "Vendido" || currentStat === "Alquilado";

    if (isCompleted) {
      // Toggle back to active state
      if (currentStat === "Alquilado") {
        return {
          status: "En Alquiler",
          displayText: "Alquiler",
        };
      } else {
        return {
          status: "En Venta",
          displayText: "Venta",
        };
      }
    } else {
      // Toggle to completed state
      if (
        type === "Rent" ||
        type === "RentWithOption" ||
        type === "RoomSharing"
      ) {
        return {
          status: "Alquilado",
          displayText: "Alquilado",
        };
      } else {
        return {
          status: "Vendido",
          displayText: "Vendido",
        };
      }
    }
  };

  // Helper function to get display text based on listingType + status combination
  const getDisplayText = (type: string, stat: string | undefined) => {
    // For completed states, show the completion status
    if (stat === "Alquilado") {
      return "Alquilado";
    } else if (stat === "Vendido") {
      return "Vendido";
    } else {
      // For active states, show based on listingType
      return formatListingType(type);
    }
  };

  const handleStatusToggle = async () => {
    if (!listingId || isUpdatingStatus) return;

    const toggledState = getToggledStatus(listingType, currentStatus);

    // Optimistic update
    setCurrentStatus(toggledState.status);
    setIsUpdatingStatus(true);

    try {
      const result = await updateListingStatus(listingId, toggledState.status);

      if (result.success) {
        toast.success(`Estado actualizado a ${toggledState.displayText}`, {
          description: "El cambio se ha guardado correctamente",
        });
      } else {
        // Rollback on error
        setCurrentStatus(status);
        toast.error(result.error ?? "Error al actualizar el estado");
      }
    } catch (error) {
      // Rollback on error
      setCurrentStatus(status);
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpportunityToggle = async () => {
    if (!listingId || isUpdatingOpportunity) return;

    const newValue = !isOpportunity;

    // Optimistic update
    setIsOpportunity(newValue);
    setIsUpdatingOpportunity(true);

    try {
      const result = await updateListingOpportunity(listingId, newValue);

      if (result.success) {
        toast.success(
          newValue ? "Marcado como oportunidad" : "Oportunidad desmarcada",
        );
      } else {
        // Rollback on error
        setIsOpportunity(!newValue);
        toast.error(result.error ?? "Error al actualizar");
      }
    } catch (error) {
      // Rollback on error
      setIsOpportunity(!newValue);
      console.error("Error updating opportunity:", error);
      toast.error("Error al actualizar");
    } finally {
      setIsUpdatingOpportunity(false);
    }
  };

  const handleFeaturedToggle = async () => {
    if (!listingId || isUpdatingFeatured) return;

    const newValue = !isFeatured;

    // Optimistic update
    setIsFeatured(newValue);
    setIsUpdatingFeatured(true);

    try {
      const result = await updateListingFeatured(listingId, newValue);

      if (result.success) {
        toast.success(
          newValue ? "Marcado como destacado" : "Destacado desmarcado",
        );
      } else {
        // Rollback on error
        setIsFeatured(!newValue);
        toast.error(result.error ?? "Error al actualizar");
      }
    } catch (error) {
      // Rollback on error
      setIsFeatured(!newValue);
      console.error("Error updating featured:", error);
      toast.error("Error al actualizar");
    } finally {
      setIsUpdatingFeatured(false);
    }
  };

  return (
    <div className="mb-4 py-2 sm:mb-6 sm:py-3">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="group flex items-start gap-2">
            {isEditing ? (
              <div className="flex w-full max-w-4xl flex-col gap-3">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="h-auto w-full border border-input bg-background px-3 py-2 text-xl font-bold focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl md:text-3xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSave();
                    } else if (e.key === "Escape") {
                      handleCancel();
                    }
                  }}
                  disabled={isLoading}
                  autoFocus
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSave}
                    disabled={isLoading || !editedTitle.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                    <span className="inline break-words">{currentTitle}</span>
                    {(Boolean(propertyId) || Boolean(listingId)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-1.5 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 p-0 transition-all hover:bg-muted/90 sm:ml-2"
                            aria-label="Opciones"
                          >
                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          sideOffset={8}
                          className="min-w-[200px] rounded-lg border border-border/50 bg-popover/95 p-1.5 shadow-lg backdrop-blur-sm"
                        >
                          {propertyId && (
                            <DropdownMenuItem
                              onClick={() => setIsEditing(true)}
                              className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
                            >
                              Editar título
                            </DropdownMenuItem>
                          )}
                          {propertyId && listingId && <DropdownMenuSeparator className="my-1.5" />}
                          {listingId && (
                            <>
                              <DropdownMenuItem
                                onClick={handleOpportunityToggle}
                                disabled={isUpdatingOpportunity}
                                className={cn(
                                  "cursor-pointer rounded-md px-3 py-2 text-sm",
                                  isOpportunity && "font-semibold text-foreground",
                                )}
                              >
                                {isOpportunity ? "Quitar oportunidad" : "Marcar como oportunidad"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={handleFeaturedToggle}
                                disabled={isUpdatingFeatured}
                                className={cn(
                                  "cursor-pointer rounded-md px-3 py-2 text-sm",
                                  isFeatured && "font-semibold text-foreground",
                                )}
                              >
                                {isFeatured ? "Quitar destacado" : "Marcar como destacado"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </h1>
                  {isBankOwned && (
                    <Badge
                      variant="secondary"
                      className="flex-shrink-0 bg-amber-500 text-xs text-white sm:text-sm"
                    >
                      Piso de Banco
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 min-w-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${street}, ${city}, ${province} ${postalCode}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 max-w-full items-center text-sm text-muted-foreground transition-colors hover:text-primary sm:text-base"
            >
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate group-hover:underline">
                {street}, {city}, {province} {postalCode}
              </span>
            </a>
          </div>
        </div>
        <div className="mt-2 flex flex-col items-start gap-1.5 sm:mt-0 sm:items-end md:flex-shrink-0">
          {/* Price - prominent on mobile */}
          <div
            className={cn(
              "whitespace-nowrap text-2xl font-bold transition-colors sm:text-2xl md:text-3xl",
              listingId ? "cursor-pointer hover:text-primary" : "",
              isUpdatingStatus && "opacity-50",
              (currentStatus === "Vendido" || currentStatus === "Alquilado") &&
                "line-through decoration-2",
            )}
            onClick={listingId ? handleStatusToggle : undefined}
            title={listingId ? "Haz clic para cambiar el estado" : undefined}
          >
            {formatPrice(price)}€
            {["Rent", "RentWithOption", "RoomSharing"].includes(listingType) ||
            currentStatus === "Alquilado"
              ? "/mes"
              : ""}
          </div>

          {/* Badge and completion tracker - below price on mobile */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "flex-shrink-0 text-xs font-normal transition-all duration-200 sm:text-sm",
                statusColors[listingType],
                listingId ? "cursor-pointer hover:scale-105" : "",
                isUpdatingStatus && "opacity-50",
              )}
              onClick={listingId ? handleStatusToggle : undefined}
              title={listingId ? "Haz clic para cambiar el estado" : undefined}
            >
              {getDisplayText(listingType, currentStatus)}
            </Badge>

            {/* Completion Tracker Button - only show on main property page */}
            {isMainPropertyPage && (
              <button
                onClick={() => {
                  setIsCompletionModalOpen(!isCompletionModalOpen);
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent"
                title="Ver estado de registro"
              >
                {/* Circular progress ring - dynamic percentage */}
                <svg width="20" height="20" className="-rotate-90 transform">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke={completionColor}
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs font-medium text-muted-foreground">
                  {completionPercentage}%
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Tracker Modal - only show on main property page */}
      {listing && isMainPropertyPage && (
        <CompletionTrackerModal
          listing={
            listing as {
              propertyId?: bigint | number | string;
              [key: string]: unknown;
            }
          }
          isOpen={isCompletionModalOpen}
          onClose={() => setIsCompletionModalOpen(false)}
        />
      )}
    </div>
  );
}
