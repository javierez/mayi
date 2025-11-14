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
import { Button } from "~/components/ui/button";
import { Euro, Bed, Bath, Square, ChevronDown, MapPin } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PROSPECT_STATUSES } from "~/types/operations";
import { updateProspectWithAuth } from "~/server/queries/prospect";
import { updateListingWithAuth } from "~/server/queries/operations-listings";
import { PaginationControls } from "~/components/ui/pagination-controls";
import { cn } from "~/lib/utils";
import type { ListingWithDetails } from "~/server/queries/operations-listings";
import { useSearchParams } from "next/navigation";

// Unified type for operations (prospects and listings)
type OperationItem = {
  id: string;
  type: "prospect" | "listing";
  operationType: string; // "Búsqueda de Alquiler de Piso" or "Venta de Casa" etc
  contact: {
    id: bigint;
    name: string;
    email?: string;
  } | null;
  status: string;
  location: string;
  summary: string; // Formatted summary like "€1,200 • 3 hab • 2 baños • 85m²"
  createdAt: Date;
  rawData: ProspectWithContact | ListingWithDetails;
};

// Default column widths (in pixels)
const DEFAULT_COLUMN_WIDTHS = {
  operacion: 180,
  contacto: 140,
  estado: 130,
  ubicacion: 120,
  resumen: 160,
  creado: 70,
} as const;

// Minimum column widths
const MIN_COLUMN_WIDTHS = {
  operacion: 120,
  contacto: 100,
  estado: 100,
  ubicacion: 100,
  resumen: 120,
  creado: 60,
} as const;

// Simple type for prospect with contact data (matching ACTUAL database structure)
type ProspectWithContact = {
  prospects: {
    id: bigint;
    contactId: bigint;
    status: string;
    listingType: string | null;
    propertyType: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    preferredAreas: unknown;
    minBedrooms: number | null;
    minBathrooms: number | null;
    minSquareMeters: number | null;
    maxSquareMeters: number | null;
    moveInBy: Date | null;
    extras: unknown;
    urgencyLevel: number | null;
    fundingReady: boolean | null;
    notesInternal: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  contacts: {
    contactId: bigint;
    accountId: bigint;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    additionalInfo: unknown;
    orgId: bigint | null;
    isActive: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

interface ProspectTableProps {
  prospects: ProspectWithContact[];
  listings?: ListingWithDetails[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onProspectUpdate?: () => void;
  onPrefetchPage?: (page: number) => Promise<void>;
}

export function ProspectTable({
  prospects,
  listings = [],
  currentPage,
  totalPages,
  onPageChange,
  onProspectUpdate,
  onPrefetchPage,
}: ProspectTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, string>
  >({});
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [visibleRows, setVisibleRows] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Helper functions for parsing and display
  const parsePreferredAreas = (preferredAreas: unknown): string[] => {
    if (!preferredAreas) return [];

    try {
      // Handle if it's already an array
      if (Array.isArray(preferredAreas)) {
        return (preferredAreas as Array<{ name: string }>)
          .filter((area) => area && typeof area === "object" && "name" in area)
          .map((area) => area.name);
      }

      // Handle if it's a string that needs parsing
      if (typeof preferredAreas === "string") {
        const parsed = JSON.parse(preferredAreas) as unknown;
        if (Array.isArray(parsed)) {
          return (parsed as Array<{ name: string }>)
            .filter(
              (area) => area && typeof area === "object" && "name" in area,
            )
            .map((area) => area.name);
        }
      }
    } catch (error) {
      console.error("Error parsing preferred areas:", error);
    }

    return [];
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
      case "nuevo":
        return "En búsqueda";
      case "working":
      case "en proceso":
      case "en seguimiento":
        return "En preparación";
      case "qualified":
      case "calificado":
        return "Finalizado";
      case "archived":
      case "archivado":
        return "Archivado";
      // If it's already one of our 4 final statuses, keep it
      case "en búsqueda":
        return "En búsqueda";
      case "en preparación":
        return "En preparación";
      case "finalizado":
        return "Finalizado";
      case "archivado":
        return "Archivado";
      default:
        return "En búsqueda"; // Default fallback
    }
  };

  // Transform prospects and listings into unified format
  const transformToOperations = useCallback(
    (
      prospects: ProspectWithContact[],
      listings: ListingWithDetails[],
    ): OperationItem[] => {
      // Deduplicate prospects and listings by ID to prevent duplicate keys
      const uniqueProspects = Array.from(
        new Map(prospects.map((prospect) => [prospect.prospects.id.toString(), prospect])).values()
      );
      const uniqueListings = Array.from(
        new Map(listings.map((listing) => [listing.listings.id.toString(), listing])).values()
      );

      const prospectOperations: OperationItem[] = uniqueProspects.map((prospect) => {
        const operationId = `prospect-${prospect.prospects.id}`;
        const optimisticStatus = optimisticStatuses[operationId];

        return {
          id: operationId,
          type: "prospect" as const,
          operationType: getOperationTypeDisplay(
            prospect.prospects.listingType,
            prospect.prospects.propertyType,
          ),
          contact: {
            id: prospect.contacts.contactId,
            name: `${prospect.contacts.firstName} ${prospect.contacts.lastName}`,
            email: prospect.contacts.email ?? undefined,
          },
          status: optimisticStatus
            ? getStatusDisplay(optimisticStatus)
            : getStatusDisplay(prospect.prospects.status),
          location:
            parsePreferredAreas(prospect.prospects.preferredAreas).join(", ") ||
            "Sin especificar",
          summary: createProspectSummary(prospect),
          createdAt: prospect.prospects.createdAt,
          rawData: prospect,
        };
      });

      const listingOperations: OperationItem[] = uniqueListings.map((listing) => {
        const operationId = `listing-${listing.listings.id}`;
        const optimisticStatus = optimisticStatuses[operationId];

        return {
          id: operationId,
          type: "listing" as const,
          operationType: getListingOperationType(
            listing.listings.listingType,
            listing.properties.propertyType,
          ),
          contact: listing.ownerContact
            ? {
                id: listing.ownerContact.contactId,
                name: `${listing.ownerContact.firstName} ${listing.ownerContact.lastName}`,
                email: listing.ownerContact.email ?? undefined,
              }
            : null,
          status: optimisticStatus
            ? getListingStatus(optimisticStatus)
            : getListingStatus(
                listing.listings.prospectStatus,
                listing.listings.status,
              ),
          location: listing.locations.neighborhood || "Sin especificar",
          summary: createListingSummary(listing),
          createdAt: listing.listings.createdAt,
          rawData: listing,
        };
      });

      // Combine and sort by creation date (newest first)
      return [...prospectOperations, ...listingOperations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    [optimisticStatuses],
  );

  // Helper functions for operation type display
  const getOperationTypeDisplay = (
    listingType: string | null,
    propertyType: string | null,
  ) => {
    let baseType = "Búsqueda";
    if (listingType) {
      switch (listingType) {
        case "Sale":
          baseType = "Demanda de Venta";
          break;
        case "Rent":
          baseType = "Búsqueda de Alquiler";
          break;
      }
    }

    if (propertyType) {
      const capitalizedPropertyType =
        propertyType.charAt(0).toUpperCase() +
        propertyType.slice(1).toLowerCase();
      return `${baseType} de ${capitalizedPropertyType}`;
    }

    return baseType;
  };

  const getListingOperationType = (
    listingType: string,
    propertyType: string | null,
  ) => {
    const baseType = listingType === "Sale" ? "Venta" : "Alquiler";

    if (propertyType) {
      const capitalizedPropertyType =
        propertyType.charAt(0).toUpperCase() +
        propertyType.slice(1).toLowerCase();
      return `${baseType} de ${capitalizedPropertyType}`;
    }

    return baseType;
  };

  const getListingStatus = (
    prospectStatus: string | null | undefined,
    fallbackStatus?: string,
  ) => {
    // If we have a prospect status, use it directly (it's already in Spanish)
    if (prospectStatus) {
      return prospectStatus;
    }

    // Fall back to the original status mapping
    if (!fallbackStatus) return "En búsqueda";

    switch (fallbackStatus) {
      case "Preparation":
        return "En preparación";
      case "Valuation":
        return "En valoración";
      case "Presign":
        return "Listo para firma";
      case "Active":
        return "En búsqueda";
      default:
        return fallbackStatus;
    }
  };

  // Grid 2x2 summary component with icons
  const SummaryComponent = ({ operation }: { operation: OperationItem }) => {
    if (operation.type === "prospect") {
      const prospect = operation.rawData as ProspectWithContact;
      const hasData =
        prospect.prospects.maxPrice ??
        prospect.prospects.minBedrooms ??
        prospect.prospects.minBathrooms ??
        prospect.prospects.minSquareMeters;

      if (!hasData) {
        return (
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      // Default bathroom to 1 if 0
      const minBathrooms =
        prospect.prospects.minBathrooms === 0
          ? 1
          : prospect.prospects.minBathrooms;

      return (
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Price */}
            {prospect.prospects.maxPrice ? (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-xs">&lt;</span>
                <Euro className="h-3 w-3" />
                <span>
                  {prospect.prospects.listingType === "Sale"
                    ? `${Math.round(parseFloat(prospect.prospects.maxPrice) / 1000)}k`
                    : parseFloat(prospect.prospects.maxPrice).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Euro className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Bedrooms */}
            {prospect.prospects.minBedrooms ? (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-xs">&gt;</span>
                <Bed className="h-3 w-3" />
                <span>{prospect.prospects.minBedrooms}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Bed className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Bathrooms */}
            {minBathrooms ? (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-xs">&gt;</span>
                <Bath className="h-3 w-3" />
                <span>{Math.floor(minBathrooms)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Bath className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Square meters */}
            {prospect.prospects.minSquareMeters ? (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-xs">&gt;</span>
                <Square className="h-3 w-3" />
                <span>{prospect.prospects.minSquareMeters}m²</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Square className="h-3 w-3" />
                <span>-</span>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      const listing = operation.rawData as ListingWithDetails;
      const hasData =
        listing.listings.price ??
        listing.properties.bedrooms ??
        listing.properties.bathrooms ??
        listing.properties.squareMeter;

      if (!hasData) {
        return (
          <div className="rounded-lg bg-gray-50 p-2 text-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      return (
        <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Price */}
            {listing.listings.price ? (
              <div className="flex items-center gap-1 text-gray-700">
                <Euro className="h-3 w-3" />
                <span>
                  {listing.listings.listingType === "Sale"
                    ? `${Math.round(parseFloat(listing.listings.price) / 1000)}k`
                    : parseFloat(listing.listings.price).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Euro className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Bedrooms */}
            {listing.properties.bedrooms ? (
              <div className="flex items-center gap-1 text-gray-700">
                <Bed className="h-3 w-3" />
                <span>{listing.properties.bedrooms}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Bed className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Bathrooms */}
            {listing.properties.bathrooms ? (
              <div className="flex items-center gap-1 text-gray-700">
                <Bath className="h-3 w-3" />
                <span>{Math.floor(listing.properties.bathrooms)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Bath className="h-3 w-3" />
                <span>-</span>
              </div>
            )}

            {/* Square meters */}
            {(listing.properties.squareMeter ?? listing.properties.builtSurfaceArea) ? (
              <div className="flex items-center gap-1 text-gray-700">
                <Square className="h-3 w-3" />
                <span>{(listing.properties.squareMeter ?? listing.properties.builtSurfaceArea)}m²</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Square className="h-3 w-3" />
                <span>-</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // Helper function to create summary for prospects (showing requirements)
  const createProspectSummary = (_prospect: ProspectWithContact): string => {
    return "compact"; // This will be replaced by the component
  };

  // Helper function to create summary for listings (showing actual property)
  const createListingSummary = (_listing: ListingWithDetails): string => {
    return "compact"; // This will be replaced by the component
  };

  // Get combined operations (memoized)
  const allOperations = useMemo(
    () => transformToOperations(prospects, listings),
    [prospects, listings, transformToOperations],
  );

  // Filter operations based on URL filters
  const searchParams = useSearchParams();
  const prospectTypeFilter = searchParams.get("prospectType");
  const listingTypeFilter = searchParams.get("listingType");
  const statusFilter = searchParams.get("status");
  const urgencyLevelFilter = searchParams.get("urgencyLevel");

  const filteredOperations = useMemo(
    () =>
      allOperations.filter((operation) => {
        // Filter by prospectType (search/listing)
        if (prospectTypeFilter && prospectTypeFilter !== "all") {
          const filterValues = prospectTypeFilter.split(",");
          const showProspects = filterValues.includes("search");
          const showListings = filterValues.includes("listing");

          if (operation.type === "prospect" && !showProspects) return false;
          if (operation.type === "listing" && !showListings) return false;
        }

        // Filter by listingType (Sale/Rent)
        if (listingTypeFilter && listingTypeFilter !== "all") {
          const filterValues = listingTypeFilter.split(",");

          if (operation.type === "prospect") {
            const prospect = operation.rawData as ProspectWithContact;
            if (!filterValues.includes(prospect.prospects.listingType ?? ""))
              return false;
          } else {
            const listing = operation.rawData as ListingWithDetails;
            if (!filterValues.includes(listing.listings.listingType))
              return false;
          }
        }

        // Filter by status
        if (statusFilter && statusFilter !== "all") {
          const filterValues = statusFilter.split(",");

          if (operation.type === "prospect") {
            const prospect = operation.rawData as ProspectWithContact;
            // Map the filter status values to database status values
            const mappedStatuses = filterValues.map((status) => {
              switch (status) {
                case "En búsqueda":
                  return "new";
                case "En preparación":
                  return "working";
                case "Finalizado":
                  return "qualified";
                case "Archivado":
                  return "archived";
                default:
                  return status.toLowerCase();
              }
            });
            if (
              !mappedStatuses.includes(prospect.prospects.status.toLowerCase())
            )
              return false;
          } else {
            const listing = operation.rawData as ListingWithDetails;
            // Check prospect status first, fall back to mapped regular status
            if (listing.listings.prospectStatus) {
              // If we have a prospect status, check against it directly
              if (!filterValues.includes(listing.listings.prospectStatus))
                return false;
            } else {
              // Fall back to mapping regular status to display status for comparison
              const displayStatus = getListingStatus(
                listing.listings.prospectStatus,
                listing.listings.status,
              );
              if (!filterValues.includes(displayStatus)) return false;
            }
          }
        }

        // Filter by urgency level (prospects only)
        if (
          urgencyLevelFilter &&
          urgencyLevelFilter !== "all" &&
          operation.type === "prospect"
        ) {
          const filterValues = urgencyLevelFilter
            .split(",")
            .map((v) => parseInt(v, 10));
          const prospect = operation.rawData as ProspectWithContact;
          if (prospect.prospects.urgencyLevel === null) return false;
          if (!filterValues.includes(prospect.prospects.urgencyLevel))
            return false;
        }

        return true;
      }),
    [
      allOperations,
      prospectTypeFilter,
      listingTypeFilter,
      statusFilter,
      urgencyLevelFilter,
    ],
  );

  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleStatusUpdate = async (
    operationId: string,
    operationType: "prospect" | "listing",
    newStatus: string,
  ) => {
    // Optimistic update - show change immediately
    setOptimisticStatuses((prev) => ({
      ...prev,
      [operationId]: newStatus,
    }));

    setUpdatingStatus(operationId);

    try {
      const [, id] = operationId.split("-");
      if (!id) return;

      const numericId = BigInt(id);

      if (operationType === "prospect") {
        await updateProspectWithAuth(numericId, { status: newStatus });
      } else if (operationType === "listing") {
        await updateListingWithAuth(numericId, { prospectStatus: newStatus });
      }

      // Clear optimistic status after successful update
      setOptimisticStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[operationId];
        return newStatuses;
      });

      // Trigger refresh
      if (onProspectUpdate) {
        onProspectUpdate();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert optimistic update on error
      setOptimisticStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[operationId];
        return newStatuses;
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

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

  const ResizeHandle = ({ column }: { column: string }) => (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 transition-colors hover:bg-primary/50 hover:opacity-100",
        isResizing === column && "bg-primary opacity-100",
      )}
      onMouseDown={(e) => handleResizeStart(column, e)}
    />
  );

  // Intersection Observer for lazy loading
  const observeRow = useCallback(
    (element: HTMLElement | null, operationId: string) => {
      if (!element || !observerRef.current) return;

      // Add dataset to track which operation this element represents
      element.dataset.operationId = operationId;
      observerRef.current.observe(element);
    },
    [],
  );

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const operationId = entry.target.getAttribute("data-operation-id");
          if (!operationId) return;

          if (entry.isIntersecting) {
            setVisibleRows((prev) => new Set(prev).add(operationId));
          }
        });
      },
      {
        root: null,
        rootMargin: "100px", // Start loading content 100px before they come into view
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
    const initialVisibleIds = allOperations.slice(0, 5).map((op) => op.id);
    setVisibleRows(new Set(initialVisibleIds));
  }, [allOperations]);

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
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="relative"
                  style={getColumnStyle("operacion")}
                >
                  <div className="truncate">Operación</div>
                  <ResizeHandle column="operacion" />
                </TableHead>
                <TableHead
                  className="relative"
                  style={getColumnStyle("contacto")}
                >
                  <div className="truncate">Contacto</div>
                  <ResizeHandle column="contacto" />
                </TableHead>
                <TableHead
                  className="relative"
                  style={getColumnStyle("estado")}
                >
                  <div className="truncate">Estado</div>
                  <ResizeHandle column="estado" />
                </TableHead>
                <TableHead
                  className="relative"
                  style={getColumnStyle("ubicacion")}
                >
                  <div className="truncate">Ubicación</div>
                  <ResizeHandle column="ubicacion" />
                </TableHead>
                <TableHead
                  className="relative"
                  style={getColumnStyle("resumen")}
                >
                  <div className="truncate">Resumen</div>
                  <ResizeHandle column="resumen" />
                </TableHead>
                <TableHead
                  className="relative"
                  style={getColumnStyle("creado")}
                >
                  <div className="truncate">Creado</div>
                  <ResizeHandle column="creado" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron operaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredOperations.map((operation) => {
                  const isVisible = visibleRows.has(operation.id);

                  return (
                    <TableRow
                      key={operation.id}
                      ref={(el) => observeRow(el, operation.id)}
                      className={
                        operation.type === "listing"
                          ? "cursor-pointer hover:bg-gray-50"
                          : ""
                      }
                      onClick={() => {
                        if (operation.type === "listing") {
                          const listing =
                            operation.rawData as ListingWithDetails;
                          window.location.href = `/propiedades/${listing.listings.id}`;
                        }
                      }}
                    >
                      {/* Operación Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("operacion")}
                      >
                        <div className="truncate">
                          <span className="text-sm font-medium text-gray-900">
                            {operation.operationType}
                          </span>
                        </div>
                      </TableCell>

                      {/* Contacto Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("contacto")}
                      >
                        <div className="truncate">
                          {operation.contact ? (
                            <div
                              className="-m-2 cursor-pointer rounded-lg p-2 transition-all duration-200 hover:scale-[1.01] hover:bg-gray-100 hover:shadow-md"
                              onClick={() =>
                                (window.location.href = `/contactos/${operation.contact?.id}`)
                              }
                            >
                              <div className="truncate font-medium text-gray-900">
                                {operation.contact.name}
                              </div>
                              {operation.contact.email && (
                                <div className="truncate text-sm text-gray-500">
                                  {operation.contact.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Sin contacto
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("estado")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="truncate">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="group h-8 px-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                                disabled={updatingStatus === operation.id}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">
                                  {operation.status}
                                </span>
                                <ChevronDown className="ml-1 h-3 w-3 opacity-40 transition-opacity group-hover:opacity-70" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {operation.type === "prospect"
                                ? // Prospect status options
                                  PROSPECT_STATUSES.map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() =>
                                        handleStatusUpdate(
                                          operation.id,
                                          operation.type,
                                          status,
                                        )
                                      }
                                      disabled={updatingStatus === operation.id}
                                    >
                                      {getStatusDisplay(status)}
                                    </DropdownMenuItem>
                                  ))
                                : // Listing status options (custom for listings)
                                  [
                                    "Completar datos",
                                    "Visita o llaves pendiente",
                                    "Valoración pendiente",
                                    "Firma encargo pendiente",
                                  ].map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() =>
                                        handleStatusUpdate(
                                          operation.id,
                                          operation.type,
                                          status,
                                        )
                                      }
                                      disabled={updatingStatus === operation.id}
                                    >
                                      {status}
                                    </DropdownMenuItem>
                                  ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>

                      {/* Ubicación Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("ubicacion")}
                      >
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            {operation.type === "prospect" ? (
                              (() => {
                                const areas = parsePreferredAreas(
                                  (operation.rawData as ProspectWithContact)
                                    .prospects.preferredAreas,
                                );

                                if (areas.length === 0) {
                                  return (
                                    <span className="text-xs text-muted-foreground">
                                      Sin especificar
                                    </span>
                                  );
                                }

                                if (areas.length === 1) {
                                  return (
                                    <div
                                      className="truncate text-xs"
                                      title={areas[0]}
                                    >
                                      {areas[0]}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-0.5">
                                    {areas.slice(0, 2).map((area, index) => (
                                      <div
                                        key={index}
                                        className="truncate text-xs"
                                        title={area}
                                      >
                                        • {area}
                                      </div>
                                    ))}
                                    {areas.length > 2 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{areas.length - 2} más
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <div
                                className="truncate text-xs"
                                title={operation.location}
                              >
                                {operation.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Resumen Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("resumen")}
                      >
                        {isVisible ? (
                          <SummaryComponent operation={operation} />
                        ) : (
                          <Skeleton className="h-16 w-full rounded-lg" />
                        )}
                      </TableCell>

                      {/* Creado Column */}
                      <TableCell
                        className="overflow-hidden text-xs text-muted-foreground"
                        style={getColumnStyle("creado")}
                      >
                        <div className="truncate">
                          {formatDate(operation.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="mt-4"
        />
      )}
    </div>
  );
}
