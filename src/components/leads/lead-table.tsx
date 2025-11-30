"use client";

import React, {
  useState,
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
import { Button } from "~/components/ui/button";
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
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
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
import Image from "next/image";

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
}

// Portal logo configuration
const PORTAL_LOGOS: Record<string, string> = {
  idealista: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
  fotocasa: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
  habitaclia: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
  milanuncios: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-milanuncios.png",
  "pisos.com": "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
  yaencontre: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-yaencontre.png",
  enalquiler: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-ena.svg",
  kyero: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/kyerologo.webp",
};

export const LeadTable = React.memo(function LeadTable({
  leads,
  currentPage,
  totalPages,
  onPageChange,
  onLeadUpdate,
}: LeadTableProps) {
  const router = useRouter();
  const [selectedContact, setSelectedContact] =
    useState<ContactSheetData | null>(null);
  const [isHoveringTable, setIsHoveringTable] = useState(false);

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

  const formatDate = React.useCallback((date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, []);

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
      upcomingAppointmentId: undefined,
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

  // Helper function to render source logo or text
  const renderSource = (source: string | null | undefined) => {
    if (!source) {
      return (
        <Badge variant="outline" className="text-xs">
          N/A
        </Badge>
      );
    }

    const sourceLower = source.toLowerCase();
    const logoUrl = PORTAL_LOGOS[sourceLower];

    if (logoUrl) {
      return (
        <div className="flex items-center justify-center">
          <Image
            src={logoUrl}
            alt={source}
            width={80}
            height={24}
            className="h-6 w-auto object-contain"
            unoptimized={logoUrl.endsWith(".svg")}
          />
        </div>
      );
    }

    // Fallback to text badge if no logo found
    return (
      <Badge variant="outline" className="text-xs">
        {source}
      </Badge>
    );
  };

  const getBadgeConfig = React.useCallback((lead: LeadWithDetails) => {
    // Highest priority: Check if lead is inactive
    if (lead.isActive === false) {
      return {
        color: "bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50 hover:border-gray-400",
        icon: <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Inactivo",
      };
    }

    // Priority matching activity tab exactly
    if (lead.hasUpcomingVisit) {
      return {
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        icon: <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita pendiente",
      };
    } else if (lead.offerAccepted === true) {
      return {
        color: "bg-green-100 text-green-800 hover:bg-green-200",
        icon: <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Oferta aceptada",
      };
    } else if (lead.offerAccepted === false) {
      return {
        color: "bg-rose-100 text-rose-800 hover:bg-rose-200",
        icon: <ThumbsDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Oferta rechazada",
      };
    } else if (lead.hasOffer && lead.offerAccepted === null) {
      return {
        color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
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
          "bg-white text-orange-700 border-2 border-dashed border-orange-400 hover:bg-orange-50",
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
          "bg-white text-amber-700 border-2 border-dashed border-amber-400 hover:bg-amber-50",
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
        color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        icon: <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Visita completada",
      };
    } else {
      return {
        color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        icon: <CalendarPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
        title: "Sin visitas",
      };
    }
  }, []);

  // Export leads to Excel
  const handleExport = React.useCallback(() => {
    const headers = [
      "Contacto",
      "Email",
      "Teléfono",
      "Propiedad",
      "Referencia",
      "Precio",
      "Propietario",
      "Estado",
      "Origen",
      "Creado",
    ];

    const rows = uniqueLeads.map((lead) => {
      const badgeConfig = getBadgeConfig(lead);
      return [
        `${lead.contact.firstName} ${lead.contact.lastName}`,
        lead.contact.email ?? "",
        lead.contact.phone ?? "",
        lead.listing?.title ?? "Sin propiedad",
        lead.listing?.referenceNumber ?? "",
        lead.listing?.price ? parseFloat(lead.listing.price) : "",
        lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : "",
        badgeConfig.title,
        lead.source ?? "",
        formatDate(lead.createdAt),
      ];
    });

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    // Auto-size columns
    const colWidths = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map((row) => String(row[i] ?? "").length),
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(
      workbook,
      `leads-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }, [uniqueLeads, getBadgeConfig, formatDate]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div
          className="relative custom-scrollbar overflow-x-auto rounded-lg border"
          onMouseEnter={() => setIsHoveringTable(true)}
          onMouseLeave={() => setIsHoveringTable(false)}
        >
          {/* Export Button - Appears on hover */}
          <div
            className={cn(
              "absolute right-2 top-2 z-10 transition-all duration-300",
              isHoveringTable
                ? "opacity-60 hover:opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Exportar leads a Excel"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Contacto</TableHead>
                <TableHead className="min-w-[200px] md:min-w-[280px]">Propiedad</TableHead>
                <TableHead className="hidden min-w-[120px] lg:table-cell">Propietario</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="hidden min-w-[90px] sm:table-cell">Origen</TableHead>
                <TableHead className="min-w-[90px]">Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniqueLeads.map((lead) => {
                const leadId = lead.leadId?.toString() ?? "";
                const badgeConfig = getBadgeConfig(lead);

                return (
                  <TableRow
                    key={leadId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(lead)}
                  >
                    {/* Contact */}
                    <TableCell className="min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="min-w-0 cursor-pointer">
                            <div className="truncate text-sm font-medium md:text-base">
                              {lead.contact.firstName} {lead.contact.lastName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
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
                    </TableCell>

                    {/* Property */}
                    <TableCell className="min-w-0">
                      {lead.listing ? (
                        <div
                          className="cursor-pointer rounded-lg bg-gray-50 p-1.5 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md md:p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewListing(lead.listingId);
                          }}
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium sm:text-sm">
                                {lead.listing.title ?? "Sin título"}
                              </div>
                              <div className="flex items-center truncate text-xs text-muted-foreground">
                                <MapPin className="mr-1 h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
                                <span className="truncate">{lead.listing.street ?? "Sin dirección"}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-left sm:ml-2 sm:text-right">
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
                      )}
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="hidden min-w-0 lg:table-cell">
                      {lead.owner ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="min-w-0 cursor-pointer">
                              <div className="truncate text-sm font-medium">
                                {lead.owner.firstName} {lead.owner.lastName}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
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
                        <div className="text-sm text-muted-foreground">
                          No disponible
                        </div>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="min-w-0">
                      <Badge
                        className={cn(
                          badgeConfig.color,
                          "text-[10px] sm:text-xs",
                        )}
                      >
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          {badgeConfig.icon}
                          <span className="max-w-[12ch] truncate sm:max-w-[15ch]">
                            {badgeConfig.title}
                          </span>
                        </span>
                      </Badge>
                    </TableCell>

                    {/* Source */}
                    <TableCell className="hidden sm:table-cell">
                      {renderSource(lead.source)}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-xs sm:text-sm">
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
          <div className="px-2 sm:px-0">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
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
});
