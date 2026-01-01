"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, UserPlus, Link2, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";
import { listListingsCompactWithAuth } from "~/server/queries/listing";
import type { InboxContact, ThreadContext } from "./inbox-types";

interface Listing {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  listingType: string;
  propertyType: string | null;
  city: string | null;
  imageUrl: string | null;
}

interface CreateContactFromEmailModalProps {
  contact: InboxContact | null;
  threadId: string;
  currentContext?: ThreadContext; // Current thread context (if any)
  isOpen: boolean;
  onClose: () => void;
  // For new contacts: creates contact + optional listing link + thread context
  onCreateContact: (
    contact: InboxContact,
    threadId: string,
    listingId?: bigint,
    contactType?: "owner" | "buyer",
  ) => Promise<void>;
  // For existing contacts: assigns listing to thread
  onAssignListing: (
    threadId: string,
    contactId: bigint,
    listingId: bigint | null,
    contactType?: "owner" | "buyer",
  ) => Promise<boolean>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseNameParts(displayName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "Sin nombre", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// Debounce hook
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function CreateContactFromEmailModal({
  contact,
  threadId,
  currentContext,
  isOpen,
  onClose,
  onCreateContact,
  onAssignListing,
}: CreateContactFromEmailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [contactType, setContactType] = useState<"owner" | "buyer">("buyer");
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Determine if contact is already linked (existing contact)
  const isLinkedContact = contact?.isLinked ?? false;

  // Reset state and fetch recent listings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setListings([]);
      setSelectedListing(null);
      // Set contact type from current context or default to buyer
      const contextType = currentContext?.contactType;
      setContactType((contextType === "owner" || contextType === "buyer") ? contextType : "buyer");
      setIsProcessing(false);

      // Fetch 5 recent listings (ordered by createdAt DESC by default)
      // Exclude listings the contact is already linked to
      const fetchRecentListings = async () => {
        setIsLoadingRecent(true);
        try {
          const listingsData = await listListingsCompactWithAuth({
            limit: 5,
            excludeListingsForContactId: contact?.contactId
              ? BigInt(contact.contactId)
              : undefined,
          });
          setRecentListings(listingsData);
        } catch (error) {
          console.error("Error fetching recent listings:", error);
          setRecentListings([]);
        } finally {
          setIsLoadingRecent(false);
        }
      };

      void fetchRecentListings();
    }
  }, [isOpen, currentContext?.contactType, contact?.contactId]);

  // Fetch listings when search query changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchListings = async () => {
      if (debouncedSearchQuery.length < 2) {
        setListings([]);
        return;
      }

      setIsLoadingListings(true);
      try {
        const listingsData = await listListingsCompactWithAuth({
          searchQuery: debouncedSearchQuery.trim(),
          excludeListingsForContactId: contact?.contactId
            ? BigInt(contact.contactId)
            : undefined,
        });
        setListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setIsLoadingListings(false);
      }
    };

    void fetchListings();
  }, [isOpen, debouncedSearchQuery, contact?.contactId]);

  // Determine which listings to display
  const displayListings = searchQuery.length >= 2 ? listings : recentListings;
  const isLoading = searchQuery.length >= 2 ? isLoadingListings : isLoadingRecent;

  if (!contact) return null;

  const { firstName, lastName } = parseNameParts(contact.name);
  const email = contact.email ?? contact.id;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (isLinkedContact) {
        // Existing contact - assign listing to thread
        const contactId = contact.contactId;
        if (!contactId) {
          console.error("Contact ID not found for linked contact");
          return;
        }

        await onAssignListing(
          threadId,
          BigInt(contactId),
          selectedListing?.listingId ?? null,
          selectedListing ? contactType : undefined,
        );
      } else {
        // New contact - create contact + optional listing link
        await onCreateContact(
          contact,
          threadId,
          selectedListing?.listingId,
          selectedListing ? contactType : undefined,
        );
      }
      onClose();
    } catch (error) {
      console.error("Error processing:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    setSearchQuery("");
    setListings([]);
  };

  const handleClearListing = () => {
    setSelectedListing(null);
  };

  // Modal title and description based on mode
  const modalTitle = isLinkedContact ? "Vincular Propiedad" : "Crear Contacto";
  const modalDescription = isLinkedContact
    ? "Vincula esta conversación a una propiedad"
    : "Se creara un nuevo contacto con los siguientes datos:";
  const confirmButtonText = isLinkedContact
    ? selectedListing
      ? "Vincular Propiedad"
      : "Quitar Vinculación"
    : "Crear Contacto";
  const processingText = isLinkedContact ? "Vinculando..." : "Creando...";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLinkedContact ? (
              <Link2 className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-rose-500" />
            )}
            {modalTitle}
          </DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          {/* Contact Info */}
          <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                className={cn(
                  isLinkedContact
                    ? "bg-primary/10 text-primary"
                    : "bg-rose-100 text-rose-700"
                )}
              >
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {firstName} {lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          {/* Current Context (if thread already has a listing) */}
          {isLinkedContact && currentContext?.listing ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Propiedad actual
              </Label>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-start gap-3">
                  {currentContext.listing.imageUrl ? (
                    <Image
                      src={currentContext.listing.imageUrl}
                      alt={currentContext.listing.title ?? "Property"}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover shrink-0"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {currentContext.listing.title ?? "Sin título"}
                    </div>
                    {currentContext.listing.referenceNumber ? (
                      <div className="text-xs text-muted-foreground truncate">
                        Ref: {currentContext.listing.referenceNumber}
                      </div>
                    ) : null}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {currentContext.contactType === "owner"
                        ? "Propietario"
                        : "Demandante"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Listing Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {isLinkedContact
                ? currentContext?.listing
                  ? "Cambiar a otra propiedad"
                  : "Seleccionar propiedad"
                : "Propiedad relacionada (opcional)"}
            </Label>

            {selectedListing ? (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 overflow-hidden">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {selectedListing.imageUrl ? (
                      <Image
                        src={selectedListing.imageUrl}
                        alt={selectedListing.title ?? "Property"}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover shrink-0"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-sm font-medium truncate">
                        {selectedListing.title ?? "Sin título"}
                      </div>
                      {selectedListing.referenceNumber ? (
                        <div className="text-xs text-muted-foreground truncate">
                          Ref: {selectedListing.referenceNumber}
                        </div>
                      ) : null}
                      {selectedListing.city ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {selectedListing.city}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearListing}
                    className="h-6 w-6 shrink-0 p-0"
                    title="Quitar propiedad"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar propiedades..."
                    className="pl-10"
                  />
                </div>

                {/* Show recent listings label when not searching */}
                {searchQuery.length < 2 && recentListings.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Propiedades recientes:
                  </p>
                ) : null}

                <ScrollArea className="h-[150px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : displayListings.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {searchQuery.length >= 2
                        ? "No se encontraron propiedades"
                        : "No hay propiedades disponibles"}
                    </div>
                  ) : (
                    <div className="space-y-1.5 pr-3">
                      {displayListings.map((listing) => (
                        <div
                          key={listing.listingId.toString()}
                          className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-2 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm overflow-hidden"
                          onClick={() => handleListingSelect(listing)}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {listing.imageUrl ? (
                              <Image
                                src={listing.imageUrl}
                                alt={listing.title ?? "Property"}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded object-cover shrink-0"
                              />
                            ) : null}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="text-sm font-medium text-gray-600 truncate">
                                {listing.title ?? "Sin título"}
                              </div>
                              {listing.referenceNumber ? (
                                <div className="text-xs text-gray-400 truncate">
                                  Ref: {listing.referenceNumber}
                                </div>
                              ) : null}
                              {listing.city ? (
                                <div className="text-xs text-gray-400 truncate">
                                  {listing.city}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Contact Type Toggle (only when listing selected) */}
          {selectedListing ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Relación con la propiedad
              </Label>
              <div className="relative h-10 w-full max-w-xs rounded-lg border border-gray-200 bg-gray-50 p-1">
                <motion.div
                  className="absolute left-1 top-1 h-8 w-[calc(50%-4px)] rounded-md bg-primary shadow-sm"
                  animate={{
                    x: contactType === "owner" ? 0 : "100%",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div className="relative flex h-full">
                  <button
                    type="button"
                    onClick={() => setContactType("owner")}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      contactType === "owner"
                        ? "text-primary-foreground"
                        : "text-gray-500",
                    )}
                  >
                    Propietario
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType("buyer")}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      contactType === "buyer"
                        ? "text-primary-foreground"
                        : "text-gray-500",
                    )}
                  >
                    Demandante
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {processingText}
              </>
            ) : (
              confirmButtonText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
