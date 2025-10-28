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
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { Nombre } from "../table-components/list-elements/nombre";
import { Contacto } from "../table-components/list-elements/contacto";
import { Propiedades } from "../table-components/list-elements/propiedades";
import { Recordatorios } from "../table-components/list-elements/recordatorios";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, Download } from "lucide-react";
import { CONTACT_SOURCES, CONTACT_SOURCE_LABELS } from "~/types/contact-source";
import { updateContactWithAuth } from "~/server/queries/contact";

// Default column widths (in pixels)
const DEFAULT_COLUMN_WIDTHS = {
  nombre: 160,
  contacto: 160,
  propiedades: 160,
  recordatorios: 160,
  origen: 140,
} as const;

// Minimum column widths
const MIN_COLUMN_WIDTHS = {
  nombre: 80,
  contacto: 80,
  propiedades: 100,
  recordatorios: 100,
  origen: 80,
} as const;

// Extended Contact type
interface ExtendedContact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  isActive: boolean;
  ownerCount?: number;
  buyerCount?: number;
  prospectCount?: number;
  isOwner?: boolean;
  isBuyer?: boolean;
  isInteresado?: boolean;
  additionalInfo?: {
    demandType?: string;
    propertiesCount?: number;
    propertyTypes?: string[];
    budget?: number;
    location?: string;
    notes?: string;
  };
  lastContact?: Date;
  createdAt: Date;
  updatedAt: Date;
  prospectTitles?: string[];
  allListings?: Array<{
    listingId: bigint;
    contactType: string;
    street?: string;
    city?: string;
    propertyType?: string;
    listingType?: string;
    status?: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
  }>;
}

interface ContactSpreadsheetTableProps {
  contacts: ExtendedContact[];
  currentFilter?: string[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onExport?: () => Promise<void>;
}

export function ContactSpreadsheetTable({
  contacts,
  currentFilter = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onExport,
}: ContactSpreadsheetTableProps) {
  const router = useRouter();
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const [visibleRows, setVisibleRows] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isHoveringTable, setIsHoveringTable] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [optimisticSources, setOptimisticSources] = useState<Record<string, string>>({});

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
  const observeRow = useCallback((element: HTMLElement | null, contactId: string) => {
    if (!element || !observerRef.current) return;

    // Add dataset to track which contact this element represents
    element.dataset.contactId = contactId;
    observerRef.current.observe(element);
  }, []);

  // Initialize Intersection Observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const contactId = entry.target.getAttribute('data-contact-id');
          if (!contactId) return;

          if (entry.isIntersecting) {
            setVisibleRows((prev) => new Set(prev).add(contactId));
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // Start loading content 100px before they come into view
        threshold: 0.1,
      }
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
    const initialVisibleIds = contacts.slice(0, 5).map(c => c.contactId.toString());
    setVisibleRows(new Set(initialVisibleIds));
  }, [contacts]);

  // Close source editor on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingSourceId) {
        // Check if click is outside the source editor
        const target = event.target as HTMLElement;
        const isInsideSourceEditor = target.closest('[data-source-editor]');

        if (!isInsideSourceEditor) {
          setEditingSourceId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingSourceId]);

  // Export contacts to CSV
  const handleExport = useCallback(async () => {
    if (onExport) {
      // Use parent-provided export function (exports ALL filtered data)
      await onExport();
    } else {
      // Fallback: export only current page data
      const headers = ["Nombre", "Email", "Teléfono", "Tipo", "Propiedades", "Última Actualización"];

      const rows = contacts.map(contact => {
        const types = [];
        if (contact.isOwner) types.push("Propietario");
        if (contact.isBuyer) types.push("Comprador");
        if (contact.isInteresado) types.push("Interesado");

        const propertiesCount = (contact.ownerCount ?? 0) + (contact.buyerCount ?? 0) + (contact.prospectCount ?? 0);

        return [
          `"${contact.firstName} ${contact.lastName}"`,
          contact.email ?? "",
          contact.phone ?? "",
          types.join(", "),
          propertiesCount.toString(),
          contact.updatedAt.toLocaleDateString(),
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `contactos-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [contacts, onExport]);

  // Handle source update with optimistic UI
  const handleSourceUpdate = useCallback(async (contactId: bigint, newSource: string) => {
    const contactIdStr = contactId.toString();

    // Optimistically update the UI
    setOptimisticSources((prev) => ({
      ...prev,
      [contactIdStr]: newSource,
    }));
    setEditingSourceId(null);

    try {
      await updateContactWithAuth(Number(contactId), { source: newSource });
      // Success - the optimistic update is now confirmed
    } catch (error) {
      console.error("Failed to update contact source:", error);
      // Rollback optimistic update on error
      setOptimisticSources((prev) => {
        const newState = { ...prev };
        delete newState[contactIdStr];
        return newState;
      });
    }
  }, []);

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
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
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
                        : "text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
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
      className="relative rounded-md border"
      onMouseEnter={() => setIsHoveringTable(true)}
      onMouseLeave={() => setIsHoveringTable(false)}
    >
      {/* Export Button - Appears on hover */}
      <div
        className={cn(
          "absolute right-2 top-2 z-10 transition-all duration-300",
          isHoveringTable ? "opacity-60 hover:opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title="Exportar contactos a CSV"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table ref={tableRef}>
          <TableHeader>
            <TableRow>
              <TableHead className="relative" style={getColumnStyle("nombre")}>
                <div className="truncate">Nombre</div>
                <ResizeHandle column="nombre" />
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
                style={getColumnStyle("propiedades")}
              >
                <div className="truncate">
                  {currentFilter.includes("buyer") ||
                  currentFilter.includes("interested")
                    ? "Demandas"
                    : "Propiedades"}
                </div>
                <ResizeHandle column="propiedades" />
              </TableHead>
              <TableHead
                className="relative"
                style={getColumnStyle("origen")}
              >
                <div className="truncate">Origen</div>
                <ResizeHandle column="origen" />
              </TableHead>
              <TableHead
                className="relative"
                style={getColumnStyle("recordatorios")}
              >
                <div className="truncate">Recordatorios</div>
                <ResizeHandle column="recordatorios" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const contactId = contact.contactId.toString();
              const isVisible = visibleRows.has(contactId);
              // Use optimistic source if available, otherwise use contact source
              const displaySource = optimisticSources[contactId] ?? contact.source;

              return (
              <TableRow
                key={contactId}
                ref={(el) => observeRow(el, contactId)}
                className={cn(
                  "cursor-pointer transition-colors",
                  contact.isActive
                    ? "hover:bg-muted/50"
                    : "opacity-60 hover:bg-gray-100/50",
                )}
                onClick={() => router.push(`/contactos/${contact.contactId}`)}
              >
                <TableCell
                  className="overflow-hidden py-2.5"
                  style={getColumnStyle("nombre")}
                >
                  <div className="truncate">
                    <Nombre
                      firstName={contact.firstName}
                      lastName={contact.lastName}
                      isActive={contact.isActive}
                      lastContact={contact.lastContact}
                      updatedAt={contact.updatedAt}
                      isOwner={contact.isOwner}
                      isBuyer={contact.isBuyer}
                      isInteresado={contact.isInteresado}
                      notes={contact.additionalInfo?.notes}
                    />
                  </div>
                </TableCell>

                <TableCell
                  className="overflow-hidden py-2.5"
                  style={getColumnStyle("contacto")}
                >
                  <div className="truncate">
                    <Contacto
                      email={contact.email}
                      phone={contact.phone}
                      isActive={contact.isActive}
                      contactId={contact.contactId}
                    />
                  </div>
                </TableCell>

                <TableCell
                  className="overflow-hidden py-2.5"
                  style={getColumnStyle("propiedades")}
                >
                  <div className="truncate">
                    {isVisible ? (
                      <Propiedades
                        isActive={contact.isActive}
                        allListings={contact.allListings}
                        currentFilter={currentFilter}
                        prospectTitles={contact.prospectTitles}
                      />
                    ) : (
                      <Skeleton className="h-8 w-full" />
                    )}
                  </div>
                </TableCell>

                <TableCell
                  className="group/source relative overflow-visible py-2.5"
                  style={getColumnStyle("origen")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex items-center justify-start" data-source-editor>
                    {/* Current source display */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSourceId(editingSourceId === contactId ? null : contactId);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all",
                        displaySource
                          ? "bg-muted/50 text-muted-foreground hover:bg-muted"
                          : "text-muted-foreground/40 hover:bg-muted/30",
                        editingSourceId === contactId && "bg-muted"
                      )}
                    >
                      {displaySource ? (
                        CONTACT_SOURCE_LABELS[displaySource as keyof typeof CONTACT_SOURCE_LABELS] ?? displaySource
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          <span className="text-xs">Añadir</span>
                        </>
                      )}
                    </button>

                    {/* Inline source options */}
                    {editingSourceId === contactId && (
                      <div
                        className="absolute left-0 top-full z-50 mt-1 flex flex-col gap-0.5 rounded-md border bg-background p-1 shadow-lg min-w-[140px]"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {CONTACT_SOURCES.map((sourceOption) => (
                          <button
                            key={sourceOption}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSourceUpdate(contact.contactId, sourceOption);
                            }}
                            className={cn(
                              "rounded px-2.5 py-1.5 text-xs text-left transition-colors hover:bg-muted",
                              displaySource === sourceOption
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {CONTACT_SOURCE_LABELS[sourceOption]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell
                  className="overflow-hidden py-2.5"
                  style={getColumnStyle("recordatorios")}
                >
                  <div className="truncate">
                    {isVisible ? (
                      <Recordatorios isActive={contact.isActive} tasks={contact.tasks} />
                    ) : (
                      <Skeleton className="h-8 w-full" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>
      <PaginationControls />
    </div>
  );
}
