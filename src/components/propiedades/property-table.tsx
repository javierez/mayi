"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatPrice } from "~/lib/utils";
import {
  Map,
  Bath,
  Bed,
  Square,
  User,
  Briefcase,
  Share2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import type { ListingOverview } from "~/types/listing";
import { PropertyImagePlaceholder } from "./PropertyImagePlaceholder";
import { SharePropertyModal } from "./share-property-modal";

interface PropertyTableProps {
  listings: ListingOverview[];
  accountWebsite?: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPrefetchPage?: (page: number) => Promise<void>;
  onExport?: () => Promise<void>;
  onPublishToggled?: () => void;
}

// Default column widths (in pixels)
const DEFAULT_COLUMN_WIDTHS = {
  imagen: 100,
  propiedad: 250,
  contactos: 180,
  estado: 120,
  precio: 150,
  caracteristicas: 200,
} as const;

// Minimum column widths
const MIN_COLUMN_WIDTHS = {
  imagen: 80,
  propiedad: 150,
  contactos: 120,
  estado: 80,
  precio: 100,
  caracteristicas: 150,
} as const;

// Valid status values with their corresponding colors
const statusColors = {
  "En Venta": "bg-amber-50 text-amber-700 border-amber-200",
  "En Alquiler": "bg-rose-50 text-rose-700 border-rose-200",
  Vendido: "bg-gray-50 text-gray-600 border-amber-200",
  Alquilado: "bg-gray-50 text-gray-600 border-rose-200",
  Descartado: "bg-gray-50 text-gray-600 border-gray-200",
} as const;

// Valid status type
type ValidStatus = keyof typeof statusColors;

export const PropertyTable = React.memo(function PropertyTable({
  listings,
  accountWebsite,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onPrefetchPage,
  onExport,
  onPublishToggled,
}: PropertyTableProps) {
  const router = useRouter();
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(
    new Set(),
  );
  const [failedImages, setFailedImages] = React.useState<Set<string>>(
    new Set(),
  );
  const [visibleRows, setVisibleRows] = React.useState<Set<string>>(new Set());
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isHoveringTable, setIsHoveringTable] = React.useState(false);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [selectedProperty, setSelectedProperty] =
    React.useState<ListingOverview | null>(null);

  const handleResizeStart = useCallback(
    (column: string, e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(column);
      resizeStartRef.current = {
        x: e.clientX,
        width: columnWidths[column as keyof typeof columnWidths],
      };
    },
    [columnWidths],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const newWidth = Math.max(
        MIN_COLUMN_WIDTHS[isResizing as keyof typeof MIN_COLUMN_WIDTHS],
        resizeStartRef.current.width + deltaX,
      );

      setColumnWidths((prev) => ({
        ...prev,
        [isResizing]: newWidth,
      }));
    },
    [isResizing],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
    resizeStartRef.current = null;
  }, []);

  // Global mouse events for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const getColumnStyle = (column: keyof typeof columnWidths) => ({
    width: `${columnWidths[column]}px`,
    minWidth: `${columnWidths[column]}px`,
    maxWidth: `${columnWidths[column]}px`,
  });

  const handleImageLoad = React.useCallback((listingId: string) => {
    setLoadedImages((prev) => new Set(prev).add(listingId));
  }, []);

  // Intersection Observer for lazy loading
  const observeRow = useCallback(
    (element: HTMLElement | null, listingId: string) => {
      if (!element || !observerRef.current) return;

      // Add dataset to track which listing this element represents
      element.dataset.listingId = listingId;
      observerRef.current.observe(element);
    },
    [],
  );

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const listingId = entry.target.getAttribute("data-listing-id");
          if (!listingId) return;

          if (entry.isIntersecting) {
            setVisibleRows((prev) => new Set(prev).add(listingId));
          }
        });
      },
      {
        root: null,
        rootMargin: "100px", // Start loading images 100px before they come into view
        threshold: 0.1,
      },
    );

    // Clean up observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Initialize visible rows for first few items (above fold)
  useEffect(() => {
    const initialVisibleIds = listings
      .slice(0, 5)
      .map((l) => l.listingId.toString());
    setVisibleRows(new Set(initialVisibleIds));
  }, [listings]);

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

  const handleShareOpen = React.useCallback(
    (listing: ListingOverview, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setSelectedProperty(listing);
      setShareModalOpen(true);
    },
    [],
  );

  // Export properties to CSV
  const handleExport = React.useCallback(async () => {
    if (onExport) {
      // Use parent-provided export function (exports ALL filtered data)
      await onExport();
    } else {
      // Fallback: export only current page data
      const headers = [
        "Referencia",
        "Título",
        "Tipo",
        "Estado",
        "Precio",
        "Ciudad",
        "Dormitorios",
        "Baños",
        "M²",
        "Propietario",
        "Agente",
      ];

      const rows = listings.map((listing) => {
        return [
          listing.referenceNumber ?? "",
          `"${listing.title ?? ""}"`,
          listing.propertyType ?? "",
          listing.status ?? "",
          listing.price?.toString() ?? "",
          listing.city ?? "",
          listing.bedrooms?.toString() ?? "",
          listing.bathrooms
            ? Math.floor(Number(listing.bathrooms)).toString()
            : "",
          listing.squareMeter?.toString() ?? "",
          listing.ownerName ?? "",
          listing.agentName ?? "",
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `propiedades-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [listings, onExport]);

  const ResizeHandle = ({ column }: { column: string }) => (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 transition-colors hover:bg-primary/50 hover:opacity-100",
        isResizing === column && "bg-primary opacity-100",
      )}
      onMouseDown={(e) => handleResizeStart(column, e)}
    />
  );

  // Pagination controls component
  const PaginationControls = () => {
    if (!onPageChange || totalPages <= 1) return null;

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
      <div className="flex items-center justify-between border-t bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
          >
            Siguiente
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrevious}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }

                const isCurrentPage = pageNum === currentPage;

                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                      isCurrentPage
                        ? "z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        : "text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
                    )}
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative rounded-lg border"
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
          title="Exportar propiedades a CSV"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table ref={tableRef}>
          <TableHeader>
            <TableRow>
              <TableHead className="relative" style={getColumnStyle("imagen")}>
                <div className="truncate">Imagen</div>
                <ResizeHandle column="imagen" />
              </TableHead>
              <TableHead
                className="relative"
                style={getColumnStyle("propiedad")}
              >
                <div className="truncate">Propiedad</div>
                <ResizeHandle column="propiedad" />
              </TableHead>
              <TableHead
                className="relative"
                style={getColumnStyle("contactos")}
              >
                <div className="truncate">Contactos</div>
                <ResizeHandle column="contactos" />
              </TableHead>
              <TableHead className="relative" style={getColumnStyle("estado")}>
                <div className="truncate">Estado</div>
                <ResizeHandle column="estado" />
              </TableHead>
              <TableHead className="relative" style={getColumnStyle("precio")}>
                <div className="truncate text-left">Precio</div>
                <ResizeHandle column="precio" />
              </TableHead>
              <TableHead
                className="relative"
                style={getColumnStyle("caracteristicas")}
              >
                <div className="truncate">Características</div>
                <ResizeHandle column="caracteristicas" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => {
              const listingId = listing.listingId.toString();
              const isVisible = visibleRows.has(listingId);

              return (
                <TableRow
                  key={listingId}
                  ref={(el) => observeRow(el, listingId)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() =>
                    router.push(`/propiedades/${listing.listingId}`)
                  }
                >
                  <TableCell
                    className="overflow-hidden py-0"
                    style={getColumnStyle("imagen")}
                  >
                    <div className="truncate">
                      <div className="group relative h-[48px] w-[72px] overflow-hidden rounded-md">
                        {isVisible &&
                        listing.imageUrl &&
                        !listing.imageUrl.includes("youtube.com") &&
                        !listing.imageUrl.includes("youtu.be") &&
                        !failedImages.has(listingId) ? (
                          <>
                            {!loadedImages.has(listingId) && (
                              <Skeleton className="absolute inset-0 z-10" />
                            )}
                            <Image
                              src={listing.imageUrl}
                              alt={listing.title ?? "Property image"}
                              fill
                              priority={false}
                              quality={30}
                              sizes="72px"
                              className={cn(
                                "object-cover transition-opacity duration-200",
                                loadedImages.has(listingId)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                              onLoad={() => handleImageLoad(listingId)}
                              onError={() => {
                                setFailedImages((prev) =>
                                  new Set(prev).add(listingId),
                                );
                              }}
                            />
                          </>
                        ) : isVisible ? (
                          <PropertyImagePlaceholder
                            propertyType={listing.propertyType}
                            className="h-full w-full rounded-md"
                          />
                        ) : (
                          <Skeleton className="h-full w-full rounded-md" />
                        )}

                        {/* Hover overlay with share icon - only render when visible */}
                        {isVisible && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
                              onClick={(e) => handleShareOpen(listing, e)}
                              title="Compartir propiedad"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className="overflow-hidden"
                    style={getColumnStyle("propiedad")}
                  >
                    <div className="truncate">
                      <div className="flex flex-col">
                        <span className="truncate font-medium">
                          {listing.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-light tracking-wide text-muted-foreground">
                            {listing.referenceNumber}
                          </span>
                          {listing.city && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                •
                              </span>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Map className="mr-1 h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{listing.city}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className="overflow-hidden"
                    style={getColumnStyle("contactos")}
                  >
                    <div className="truncate">
                      <div className="flex flex-col gap-1.5">
                        {listing.ownerName && listing.ownerId && (
                          <Link
                            href={`/contactos/${listing.ownerId}`}
                            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs hover:underline">
                              {listing.ownerName}
                            </span>
                          </Link>
                        )}
                        {listing.ownerName && !listing.ownerId && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs">
                              {listing.ownerName}
                            </span>
                          </div>
                        )}
                        {listing.agentName && (
                          <Link
                            href="/operaciones"
                            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs hover:underline">
                              {listing.agentName}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className="overflow-hidden"
                    style={getColumnStyle("estado")}
                  >
                    <div className="truncate">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal",
                          statusColors[listing.status as ValidStatus] ||
                            "border-gray-200 bg-gray-50 text-gray-600",
                        )}
                      >
                        <span className="truncate">{listing.status}</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell
                    className="overflow-hidden text-left"
                    style={getColumnStyle("precio")}
                  >
                    <div className="truncate font-medium">
                      {formatPrice(listing.price)}€
                      {["Rent", "RentWithOption", "RoomSharing"].includes(
                        listing.listingType,
                      )
                        ? "/mes"
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell
                    className="overflow-hidden"
                    style={getColumnStyle("caracteristicas")}
                  >
                    <div className="truncate">
                      <div className="flex items-center space-x-4">
                        {listing.propertyType !== "local" &&
                          listing.propertyType !== "garaje" &&
                          listing.bedrooms !== null && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Bed className="mr-1 h-4 w-4 flex-shrink-0" />
                              <span>{listing.bedrooms}</span>
                            </div>
                          )}
                        {listing.propertyType !== "local" &&
                          listing.propertyType !== "garaje" &&
                          listing.bathrooms !== null && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Bath className="mr-1 h-4 w-4 flex-shrink-0" />
                              <span>
                                {Math.floor(Number(listing.bathrooms))}
                              </span>
                            </div>
                          )}
                        {(listing.squareMeter ?? listing.builtSurfaceArea) !== null && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Square className="mr-1 h-4 w-4 flex-shrink-0" />
                            <span>{Math.round(Number(listing.squareMeter ?? listing.builtSurfaceArea))}m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls />

      {/* Share Modal */}
      {selectedProperty && (
        <SharePropertyModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          property={selectedProperty}
          accountWebsite={accountWebsite}
          onPublishToggled={onPublishToggled}
        />
      )}
    </div>
  );
});
