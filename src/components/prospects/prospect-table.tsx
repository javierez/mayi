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
import { PaginationControls } from "~/components/ui/pagination-controls";
import { cn } from "~/lib/utils";
import { useSearchParams } from "next/navigation";
import { ProspectDetailSheet } from "~/components/prospects/prospect-detail-sheet";

// Type for prospect items
type ProspectItem = {
  id: string;
  operationType: string; // "Búsqueda de Alquiler de Piso" or "Demanda de Venta de Casa" etc
  contact: {
    id: bigint;
    name: string;
    email?: string;
  };
  status: string;
  location: string;
  createdAt: Date;
  rawData: ProspectWithContact;
};

// Default column widths (in pixels)
const DEFAULT_COLUMN_WIDTHS = {
  operacion: 100,
  contacto: 140,
  estado: 100,
  ubicacion: 100,
  resumen: 130,
  conexiones: 150,
} as const;

// Minimum column widths
const MIN_COLUMN_WIDTHS = {
  operacion: 80,
  contacto: 100,
  estado: 80,
  ubicacion: 80,
  resumen: 100,
  conexiones: 120,
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
    preferredCities: unknown;
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
  matchCounts: {
    high: number;
    medium: number;
    low: number;
    total: number;
  } | null;
};

interface ProspectTableProps {
  prospects: ProspectWithContact[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onProspectUpdate?: () => void;
  onPrefetchPage?: (page: number) => Promise<void>;
}

export function ProspectTable({
  prospects,
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
  const [selectedProspectId, setSelectedProspectId] = useState<bigint | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  const parsePreferredCities = (preferredCities: unknown): string[] => {
    if (!preferredCities) return [];

    try {
      // Handle if it's already an array of strings
      if (Array.isArray(preferredCities)) {
        return (preferredCities as string[]).filter(
          (city) => typeof city === "string" && city.length > 0,
        );
      }

      // Handle if it's a string that needs parsing
      if (typeof preferredCities === "string") {
        const parsed = JSON.parse(preferredCities) as unknown;
        if (Array.isArray(parsed)) {
          return (parsed as string[]).filter(
            (city) => typeof city === "string" && city.length > 0,
          );
        }
      }
    } catch (error) {
      console.error("Error parsing preferred cities:", error);
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
      case "en preparación":
        return "En búsqueda"; // Map old "En preparación" to "En búsqueda"
      case "qualified":
      case "calificado":
        return "Finalizado";
      case "archived":
      case "archivado":
        return "Archivado";
      // If it's already one of our 3 final statuses, keep it
      case "en búsqueda":
        return "En búsqueda";
      case "finalizado":
        return "Finalizado";
      case "archivado":
        return "Archivado";
      default:
        return "En búsqueda"; // Default fallback
    }
  };

  // Transform prospects into display format
  const transformToProspectItems = useCallback(
    (prospects: ProspectWithContact[]): ProspectItem[] => {
      // Deduplicate prospects by ID to prevent duplicate keys
      const uniqueProspects = Array.from(
        new Map(
          prospects.map((prospect) => [
            prospect.prospects.id.toString(),
            prospect,
          ]),
        ).values(),
      );

      return uniqueProspects
        .map((prospect) => {
          const prospectId = `prospect-${prospect.prospects.id}`;
          const optimisticStatus = optimisticStatuses[prospectId];

          const areas = parsePreferredAreas(prospect.prospects.preferredAreas);
          const cities = parsePreferredCities(prospect.prospects.preferredCities);
          const location = areas.length > 0
            ? areas.join(", ")
            : cities.length > 0
              ? cities.join(", ")
              : "Sin especificar";

          return {
            id: prospectId,
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
            location,
            createdAt: prospect.prospects.createdAt,
            rawData: prospect,
          };
        })
        .sort((a, b) => {
          // Primary sort: by quality-weighted score (descending - best matches first)
          // Formula: (Excelente × 3) + (Buena × 2) + (Aceptable × 1)
          const aMatches = a.rawData.matchCounts;
          const bMatches = b.rawData.matchCounts;

          const aScore = aMatches
            ? (aMatches.high * 3) + (aMatches.medium * 2) + (aMatches.low * 1)
            : 0;
          const bScore = bMatches
            ? (bMatches.high * 3) + (bMatches.medium * 2) + (bMatches.low * 1)
            : 0;

          if (bScore !== aScore) {
            return bScore - aScore;
          }

          // Secondary sort: by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
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
          baseType = "Demanda de Compra";
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


  // Match badges component
  const MatchBadges = ({ matchCounts }: { matchCounts: { high: number; medium: number; low: number; total: number } | null }) => {
    if (!matchCounts || matchCounts.total === 0) {
      return (
        <div className="text-xs text-gray-400">Sin conexiones</div>
      );
    }

    const badges = [];

    if (matchCounts.high > 0) {
      badges.push(
        <span key="high" className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
          {matchCounts.high} - Excelentes
        </span>
      );
    }

    if (matchCounts.medium > 0) {
      badges.push(
        <span key="medium" className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
          {matchCounts.medium} - Buenas
        </span>
      );
    }

    if (matchCounts.low > 0) {
      badges.push(
        <span key="low" className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
          {matchCounts.low} - Aceptables
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {badges}
      </div>
    );
  };

  // Grid 2x2 summary component with icons
  const SummaryComponent = ({ prospect }: { prospect: ProspectItem }) => {
    const prospectData = prospect.rawData;
    const hasData =
      prospectData.prospects.maxPrice ??
      prospectData.prospects.minBedrooms ??
      prospectData.prospects.minBathrooms ??
      prospectData.prospects.minSquareMeters;

    if (!hasData) {
      return (
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <span className="text-xs text-gray-400">-</span>
        </div>
      );
    }

    // Default bathroom to 1 if 0
    const minBathrooms =
      prospectData.prospects.minBathrooms === 0
        ? 1
        : prospectData.prospects.minBathrooms;

    return (
      <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-100 p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Price */}
          {prospectData.prospects.maxPrice ? (
            <div className="flex items-center gap-1 text-gray-700">
              <span className="text-xs">&lt;</span>
              <Euro className="h-3 w-3" />
              <span>
                {prospectData.prospects.listingType === "Sale"
                  ? `${Math.round(parseFloat(prospectData.prospects.maxPrice) / 1000)}k`
                  : parseFloat(prospectData.prospects.maxPrice).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Euro className="h-3 w-3" />
              <span>-</span>
            </div>
          )}

          {/* Bedrooms */}
          {prospectData.prospects.minBedrooms ? (
            <div className="flex items-center gap-1 text-gray-700">
              <span className="text-xs">&gt;</span>
              <Bed className="h-3 w-3" />
              <span>{prospectData.prospects.minBedrooms}</span>
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
          {prospectData.prospects.minSquareMeters ? (
            <div className="flex items-center gap-1 text-gray-700">
              <span className="text-xs">&gt;</span>
              <Square className="h-3 w-3" />
              <span>{prospectData.prospects.minSquareMeters}m²</span>
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
  };

  // Get transformed prospect items (memoized)
  const allProspects = useMemo(
    () => transformToProspectItems(prospects),
    [prospects, transformToProspectItems],
  );

  // Filter prospects based on URL filters
  const searchParams = useSearchParams();
  const listingTypeFilter = searchParams.get("listingType");
  const statusFilter = searchParams.get("status");
  const urgencyLevelFilter = searchParams.get("urgencyLevel");

  const filteredProspects = useMemo(
    () =>
      allProspects.filter((prospect) => {
        // Filter by listingType (Sale/Rent)
        if (listingTypeFilter && listingTypeFilter !== "all") {
          const filterValues = listingTypeFilter.split(",");
          if (!filterValues.includes(prospect.rawData.prospects.listingType ?? ""))
            return false;
        }

        // Filter by status
        if (statusFilter && statusFilter !== "all") {
          const filterValues = statusFilter.split(",");
          // Map the filter status values to database status values
          const mappedStatuses = filterValues.map((status) => {
            switch (status) {
              case "En búsqueda":
                return "new";
              case "Finalizado":
                return "qualified";
              case "Archivado":
                return "archived";
              default:
                return status.toLowerCase();
            }
          });
          if (
            !mappedStatuses.includes(prospect.rawData.prospects.status.toLowerCase())
          )
            return false;
        }

        // Filter by urgency level
        if (urgencyLevelFilter && urgencyLevelFilter !== "all") {
          const filterValues = urgencyLevelFilter
            .split(",")
            .map((v) => parseInt(v, 10));
          if (prospect.rawData.prospects.urgencyLevel === null) return false;
          if (!filterValues.includes(prospect.rawData.prospects.urgencyLevel))
            return false;
        }

        return true;
      }),
    [allProspects, listingTypeFilter, statusFilter, urgencyLevelFilter],
  );

  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const handleStatusUpdate = async (
    prospectId: string,
    newStatus: string,
  ) => {
    // Optimistic update - show change immediately
    setOptimisticStatuses((prev) => ({
      ...prev,
      [prospectId]: newStatus,
    }));

    setUpdatingStatus(prospectId);

    try {
      const [, id] = prospectId.split("-");
      if (!id) return;

      const numericId = BigInt(id);
      await updateProspectWithAuth(numericId, { status: newStatus });

      // Clear optimistic status after successful update
      setOptimisticStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[prospectId];
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
        delete newStatuses[prospectId];
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

  // Handle row click to open detail sheet
  const handleRowClick = (prospectId: bigint) => {
    setSelectedProspectId(prospectId);
    setIsSheetOpen(true);
  };

  // Handle sheet close
  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedProspectId(null);
  };

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
    const initialVisibleIds = allProspects.slice(0, 5).map((p) => p.id);
    setVisibleRows(new Set(initialVisibleIds));
  }, [allProspects]);

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
        <div className="custom-scrollbar max-h-[600px] overflow-x-auto overflow-y-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="relative"
                  style={getColumnStyle("operacion")}
                >
                  <div className="truncate">Demanda</div>
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
                  style={getColumnStyle("conexiones")}
                >
                  <div className="truncate">Conexiones</div>
                  <ResizeHandle column="conexiones" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No se encontraron prospectos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => {
                  const isVisible = visibleRows.has(prospect.id);

                  return (
                    <TableRow
                      key={prospect.id}
                      ref={(el) => observeRow(el, prospect.id)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => handleRowClick(prospect.rawData.prospects.id)}
                    >
                      {/* Operación Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("operacion")}
                      >
                        <div className="line-clamp-2">
                          <span className="text-sm font-medium leading-tight text-gray-900">
                            {prospect.operationType}
                          </span>
                        </div>
                      </TableCell>

                      {/* Contacto Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("contacto")}
                      >
                        <div className="truncate">
                          <div
                            className="-m-2 cursor-pointer rounded-lg p-2 transition-all duration-200 hover:scale-[1.01] hover:bg-gray-100 hover:shadow-md"
                            onClick={() =>
                              (window.location.href = `/contactos/${prospect.contact.id}`)
                            }
                          >
                            <div className="truncate font-medium text-gray-900">
                              {prospect.contact.name}
                            </div>
                            {prospect.contact.email && (
                              <div className="truncate text-sm text-gray-500">
                                {prospect.contact.email}
                              </div>
                            )}
                          </div>
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
                                disabled={updatingStatus === prospect.id}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">
                                  {prospect.status}
                                </span>
                                <ChevronDown className="ml-1 h-3 w-3 opacity-40 transition-opacity group-hover:opacity-70" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {PROSPECT_STATUSES.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() =>
                                    handleStatusUpdate(prospect.id, status)
                                  }
                                  disabled={updatingStatus === prospect.id}
                                >
                                  {getStatusDisplay(status)}
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
                          <div className="min-w-0 flex-1">
                            {(() => {
                              const areas = parsePreferredAreas(
                                prospect.rawData.prospects.preferredAreas,
                              );
                              const cities = parsePreferredCities(
                                prospect.rawData.prospects.preferredCities,
                              );

                              // Show areas if available
                              if (areas.length > 0) {
                                if (areas.length === 1) {
                                  return (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                      <div
                                        className="truncate text-xs"
                                        title={areas[0]}
                                      >
                                        {areas[0]}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-0.5">
                                    {areas.slice(0, 2).map((area, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-1"
                                      >
                                        <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                        <div
                                          className="truncate text-xs"
                                          title={area}
                                        >
                                          {area}
                                        </div>
                                      </div>
                                    ))}
                                    {areas.length > 2 && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0 opacity-50" />
                                        <span>+{areas.length - 2} más</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Fallback to cities if no areas
                              if (cities.length > 0) {
                                if (cities.length === 1) {
                                  return (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                      <div
                                        className="truncate text-xs"
                                        title={cities[0]}
                                      >
                                        {cities[0]}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-0.5">
                                    {cities.slice(0, 2).map((city, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-1"
                                      >
                                        <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                        <div
                                          className="truncate text-xs"
                                          title={city}
                                        >
                                          {city}
                                        </div>
                                      </div>
                                    ))}
                                    {cities.length > 2 && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 flex-shrink-0 opacity-50" />
                                        <span>+{cities.length - 2} más</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // No areas or cities
                              return (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                  <span className="text-xs text-muted-foreground">
                                    Sin especificar
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </TableCell>

                      {/* Resumen Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("resumen")}
                      >
                        {isVisible ? (
                          <SummaryComponent prospect={prospect} />
                        ) : (
                          <Skeleton className="h-16 w-full rounded-lg" />
                        )}
                      </TableCell>

                      {/* Conexiones Column */}
                      <TableCell
                        className="overflow-hidden"
                        style={getColumnStyle("conexiones")}
                      >
                        {isVisible ? (
                          <MatchBadges matchCounts={prospect.rawData.matchCounts} />
                        ) : (
                          <Skeleton className="h-8 w-full rounded-lg" />
                        )}
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

      {/* Prospect Detail Sheet */}
      <ProspectDetailSheet
        prospectId={selectedProspectId}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onUpdate={onProspectUpdate}
      />
    </div>
  );
}
