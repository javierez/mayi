"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import {
  MapPin,
  CalendarIcon,
  Check,
  Clock,
  X,
  Handshake,
  CalendarPlus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { PaginationControls } from "~/components/ui/pagination-controls";
import { cn } from "~/lib/utils";
import type { LeadStatus } from "~/lib/constants/lead-statuses";
import { useRouter } from "next/navigation";
import { ContactDetailSheet } from "~/components/contactos/contact-detail-sheet";
import type { ContactSheetData, OwnerContact } from "~/types/activity";

// Lead type with joined data (based on what we expect from queries)
export type LeadWithDetails = {
  leadId: bigint;
  contactId: bigint;
  listingId?: bigint | null;
  prospectId?: bigint | null;
  source: string;
  status: LeadStatus;
  offer?: string | null;
  offerAccepted?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  // Visit status flags
  visitCount?: number;
  hasUpcomingVisit?: boolean;
  hasMissedVisit?: boolean;
  hasCompletedVisit?: boolean;
  hasCancelledVisit?: boolean;
  hasOffer?: boolean;
  // Joined contact data
  contact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  // Joined listing data (optional)
  listing?: {
    listingId: bigint;
    referenceNumber?: string | null;
    title?: string | null;
    street?: string | null;
    price: string;
    listingType?: string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    squareMeter?: number | null;
  } | null;
  // Joined owner data (optional)
  owner?: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  // Joined agent data (optional)
  agent?: {
    id: string;
    name: string;
  } | null;
};

interface LeadTableProps {
  leads: LeadWithDetails[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLeadUpdate?: () => void;
  onPrefetchPage?: (page: number) => Promise<void>;
}

export function LeadTable({
  leads,
  currentPage,
  totalPages,
  onPageChange,
  onLeadUpdate,
  onPrefetchPage,
}: LeadTableProps) {
  const router = useRouter();
  const [visibleRows, setVisibleRows] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactSheetData | null>(null);

  // Memoize unique leads to prevent infinite re-renders
  const uniqueLeads = useMemo(() => {
    return leads.reduce((acc, lead) => {
      const key = lead.leadId?.toString();
      if (
        key &&
        !acc.some((existingLead) => existingLead.leadId?.toString() === key)
      ) {
        acc.push(lead);
      } else if (!key) {
        // Keep leads without leadId (shouldn't happen, but just in case)
        acc.push(lead);
      }
      return acc;
    }, [] as LeadWithDetails[]);
  }, [leads]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleViewListing = (listingId: bigint | null | undefined) => {
    if (listingId) {
      router.push(`/propiedades/${listingId.toString()}`);
    }
  };

  const handleRowClick = (lead: LeadWithDetails) => {
    // Convert offer from string to number if it exists
    const offerAmount = lead.offer ? parseFloat(lead.offer) : null;

    const contactSheet: ContactSheetData = {
      listingContactId: lead.leadId,
      contact: {
        contactId: lead.contact.contactId,
        firstName: lead.contact.firstName,
        lastName: lead.contact.lastName ?? null,
        email: lead.contact.email ?? null,
        phone: lead.contact.phone ?? null,
        createdAt: lead.createdAt,
      },
      hasUpcomingVisit: lead.hasUpcomingVisit ?? false,
      hasMissedVisit: lead.hasMissedVisit ?? false,
      hasCompletedVisit: lead.hasCompletedVisit ?? false,
      hasCancelledVisit: lead.hasCancelledVisit ?? false,
      hasOffer: lead.hasOffer ?? false,
      offer: offerAmount,
      offerAccepted: lead.offerAccepted ?? null,
      isActive: lead.isActive ?? true,
    };
    setSelectedContact(contactSheet);
  };

  const getBadgeConfig = (lead: LeadWithDetails) => {
    // Highest priority: Check if lead is inactive
    if (lead.isActive === false) {
      return {
        color: "bg-transparent text-gray-500 border border-gray-300",
        icon: <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Inactivo",
      };
    }

    // Priority matching activity tab exactly
    if (lead.hasUpcomingVisit) {
      return {
        color: "bg-blue-100 text-blue-800",
        icon: <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita pendiente",
      };
    } else if (lead.offerAccepted === true) {
      return {
        color: "bg-green-100 text-green-800",
        icon: <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Oferta aceptada",
      };
    } else if (lead.offerAccepted === false) {
      return {
        color: "bg-rose-100 text-rose-800",
        icon: <ThumbsDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Oferta rechazada",
      };
    } else if (lead.hasOffer && lead.offerAccepted === null) {
      return {
        color: "bg-amber-100 text-amber-800",
        icon: <Handshake className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Oferta pendiente",
      };
    } else if (
      lead.hasCancelledVisit &&
      !lead.hasUpcomingVisit &&
      !lead.hasOffer
    ) {
      return {
        color:
          "bg-white text-orange-700 border-2 border-dashed border-orange-400",
        icon: <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita cancelada",
      };
    } else if (
      lead.hasMissedVisit &&
      !lead.hasUpcomingVisit &&
      !lead.hasCancelledVisit &&
      !lead.hasOffer
    ) {
      return {
        color:
          "bg-white text-amber-700 border-2 border-dashed border-amber-400",
        icon: <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita perdida",
      };
    } else if (
      lead.hasCompletedVisit &&
      !lead.hasOffer &&
      !lead.hasUpcomingVisit &&
      !lead.hasMissedVisit &&
      !lead.hasCancelledVisit
    ) {
      return {
        color: "bg-gray-100 text-gray-700",
        icon: <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita completada",
      };
    } else {
      return {
        color: "bg-gray-100 text-gray-700",
        icon: <CalendarPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Sin visitas",
      };
    }
  };

  // No need for double memoization - uniqueLeads is already memoized

  // Track observed elements to prevent re-observing
  const observedElements = useRef<Set<string>>(new Set());
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Store ref callbacks to prevent recreation
  const refCallbacks = useRef<
    Map<string, (el: HTMLTableRowElement | null) => void>
  >(new Map());

  const getRefCallback = useCallback((leadId: string) => {
    if (!refCallbacks.current.has(leadId)) {
      refCallbacks.current.set(leadId, (el: HTMLTableRowElement | null) => {
        if (el) {
          el.dataset.leadId = leadId;
          rowRefs.current.set(leadId, el);
        } else {
          rowRefs.current.delete(leadId);
        }
      });
    }
    return refCallbacks.current.get(leadId)!;
  }, []);

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const leadId = entry.target.getAttribute("data-lead-id");
          if (!leadId) return;

          if (entry.isIntersecting) {
            setVisibleRows((prev) => {
              const newSet = new Set(prev);
              newSet.add(leadId);
              return newSet;
            });
          }
        });
      },
      {
        root: null,
        rootMargin: "100px", // Start loading content 100px before they come into view
        threshold: 0.1,
      },
    );

    // Copy ref values to variables for cleanup
    const observedElementsSet = observedElements.current;
    const rowRefsMap = rowRefs.current;
    const refCallbacksMap = refCallbacks.current;

    // Clean up observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      observedElementsSet.clear();
      rowRefsMap.clear();
      refCallbacksMap.clear();
    };
  }, []);

  // Initialize visible rows for first few items (above fold) and observe all rows
  useEffect(() => {
    const initialVisibleIds = uniqueLeads
      .slice(0, 5)
      .map((lead) => lead.leadId?.toString() ?? "");
    setVisibleRows(new Set(initialVisibleIds));

    // Observe all rows
    if (observerRef.current) {
      rowRefs.current.forEach((element, leadId) => {
        if (!observedElements.current.has(leadId)) {
          observedElements.current.add(leadId);
          observerRef.current?.observe(element);
        }
      });
    }
  }, [uniqueLeads]);

  // Smart prefetching - preload next page when user is near the end
  useEffect(() => {
    if (!onPrefetchPage || currentPage >= totalPages) return;

    let hasTriggeredPrefetch = false;

    const prefetchNextPage = () => {
      if (hasTriggeredPrefetch) return;

      // Prefetch next page when user scrolls to 80% of current content
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight * 0.8) {
        hasTriggeredPrefetch = true;
        console.log(`Triggering prefetch for page ${currentPage + 1}`);
        onPrefetchPage(currentPage + 1).catch(console.error);
      }
    };

    const handleScroll = () => {
      requestAnimationFrame(prefetchNextPage);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, totalPages, onPrefetchPage]);

  // Prefetch adjacent pages on component mount
  useEffect(() => {
    if (!onPrefetchPage) return;

    const prefetchAdjacentPages = async () => {
      const pagesToPrefetch = [];

      // Prefetch next page
      if (currentPage < totalPages) {
        pagesToPrefetch.push(currentPage + 1);
      }

      // Prefetch previous page
      if (currentPage > 1) {
        pagesToPrefetch.push(currentPage - 1);
      }

      // Prefetch in background without blocking UI
      pagesToPrefetch.forEach((page) => {
        setTimeout(() => {
          onPrefetchPage(page).catch(() => {
            // Silently handle prefetch errors
          });
        }, 1000); // Wait 1 second after initial load
      });
    };

    void prefetchAdjacentPages();
  }, [currentPage, totalPages, onPrefetchPage]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Propiedad</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueLeads.map((lead) => {
                const leadId = lead.leadId?.toString() ?? "";
                const isVisible = visibleRows.has(leadId);

                const badgeConfig = getBadgeConfig(lead);

                return (
                  <TableRow
                    key={leadId}
                    ref={getRefCallback(leadId)}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(lead)}
                  >
                    {/* Contact */}
                    <TableCell>
                      {isVisible ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-pointer">
                              <div className="font-medium">
                                {lead.contact.firstName} {lead.contact.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {lead.contact.email ?? "Sin email"}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p>
                                <strong>Email:</strong>{" "}
                                {lead.contact.email ?? "No disponible"}
                              </p>
                              <p>
                                <strong>Teléfono:</strong>{" "}
                                {lead.contact.phone ?? "No disponible"}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Skeleton className="h-10 w-full" />
                      )}
                    </TableCell>

                    {/* Property */}
                    <TableCell>
                      {isVisible ? (
                        lead.listing ? (
                          <div
                            className="cursor-pointer rounded-lg bg-gray-50 p-2 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewListing(lead.listingId);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                  {lead.listing.title ?? "Sin título"}
                                </div>
                                <div className="flex items-center truncate text-xs text-muted-foreground">
                                  <MapPin className="mr-1 h-3 w-3 flex-shrink-0 text-gray-400" />
                                  {lead.listing.street ?? "Sin dirección"}
                                </div>
                              </div>
                              <div className="ml-2 text-right">
                                <div className="text-xs font-medium text-gray-900">
                                  {lead.listing.price
                                    ? new Intl.NumberFormat("es-ES").format(
                                        Number(lead.listing.price),
                                      ) + "€"
                                    : "Sin precio"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lead.listing.bedrooms
                                    ? `${lead.listing.bedrooms}hab`
                                    : ""}
                                  {lead.listing.squareMeter
                                    ? ` • ${lead.listing.squareMeter}m²`
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground">
                            Sin propiedad
                          </div>
                        )
                      ) : (
                        <Skeleton className="h-16 w-full rounded-lg" />
                      )}
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      {isVisible ? (
                        lead.owner ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <div className="font-medium">
                                  {lead.owner.firstName} {lead.owner.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lead.owner.email ?? "Sin email"}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p>
                                  <strong>Email:</strong>{" "}
                                  {lead.owner.email ?? "No disponible"}
                                </p>
                                <p>
                                  <strong>Teléfono:</strong>{" "}
                                  {lead.owner.phone ?? "No disponible"}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="text-muted-foreground">
                            No disponible
                          </div>
                        )
                      ) : (
                        <Skeleton className="h-10 w-full" />
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isVisible ? (
                        <Badge
                          className={cn(
                            badgeConfig.color,
                            "text-[10px] sm:text-xs",
                          )}
                        >
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            {badgeConfig.icon}
                            <span className="max-w-[15ch] truncate">
                              {badgeConfig.title}
                            </span>
                          </span>
                        </Badge>
                      ) : (
                        <Skeleton className="h-6 w-32" />
                      )}
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      {isVisible ? (
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                      ) : (
                        <Skeleton className="h-6 w-20" />
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-xs">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        isOpen={selectedContact !== null}
        onClose={() => setSelectedContact(null)}
        onUpdate={onLeadUpdate}
        listingId={
          selectedContact?.contact
            ? (leads.find(
                (l) =>
                  l.contact.contactId === selectedContact.contact.contactId,
              )?.listingId ?? BigInt(0))
            : BigInt(0)
        }
        listingPrice={
          selectedContact?.contact
            ? (leads.find(
                (l) =>
                  l.contact.contactId === selectedContact.contact.contactId,
              )?.listing?.price ?? "0")
            : "0"
        }
        ownerContact={
          selectedContact?.contact
            ? ((leads.find(
                (l) =>
                  l.contact.contactId === selectedContact.contact.contactId,
              )?.owner as OwnerContact | null) ?? null)
            : null
        }
        permissions={{
          canEditContacts: true, // TODO: Add proper permission check
        }}
      />
    </TooltipProvider>
  );
}
