"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { ContactFilter } from "~/components/contactos/table-components/contact-filter";
import { ContactSpreadsheetTable } from "~/components/contactos/table/contact-table";
import {
  listContactsOwnerDataWithAuth,
  listContactsBuyerDataWithAuth,
} from "~/server/queries/contact";
import type { Contact } from "~/lib/data";
import { CreateContactModal } from "~/components/contactos/create-contact-modal";

// Extended Contact type to include contactType for the UI
interface ExtendedContact extends Omit<Contact, "contactType"> {
  ownerCount?: number;
  buyerCount?: number;
  prospectCount?: number;
  // Server-provided role flags
  isOwner?: boolean;
  isBuyer?: boolean;
  isInteresado?: boolean;
  // All prospect titles (array)
  prospectTitles?: string[];
  // All listings for this contact
  allListings?: Array<{
    listingId: bigint;
    contactType: string;
    street?: string;
    city?: string;
    propertyType?: string;
    listingType?: string;
    status?: string;
  }>;
  // Tasks for this contact
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
  }>;
}

// Type for a contact returned by optimized queries - only fields we actually fetch and use
type DbContact = {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  additionalInfo?: Record<string, unknown> | null;
  isActive: boolean;
  updatedAt: Date;
  // Computed role counts and flags
  ownerCount?: number;
  buyerCount?: number;
  prospectCount?: number;
  isOwner?: boolean;
  isBuyer?: boolean;
  isInteresado?: boolean;
  // Additional processed data
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
  // Tasks for this contact
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
  }>;
};

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Simplified single-state approach since URL changes trigger re-fetch anyway
  const [contacts, setContacts] = useState<ExtendedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get filter parameters from URL
  const getFiltersFromUrl = useCallback(() => {
    const roles = searchParams.get("roles");
    const q = searchParams.get("q");
    const lastContact = searchParams.get("lastContact");
    const sources = searchParams.get("sources");
    const ratings = searchParams.get("ratings");
    const statuses = searchParams.get("statuses");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    return {
      roles: roles ? roles.split(",") : ["owner"],
      searchQuery: q ?? "",
      lastContactFilter: lastContact ?? "all",
      sources: sources ? sources.split(",") : [],
      ratings: ratings ? ratings.split(",").map(Number) : [],
      statuses: statuses ? statuses.split(",").map((s) => s === "true") : [],
      sortBy: sortBy ?? "updatedAt",
      sortOrder: (sortOrder ?? "desc") as "asc" | "desc",
    };
  }, [searchParams]);

  // Helper function to process raw contact data
  const processContactsData = useCallback(
    (rawContacts: DbContact[]): ExtendedContact[] => {
      // Transform to ExtendedContact format - NO SORTING (done in database)
      const extendedContacts: ExtendedContact[] = rawContacts.map(
        (contact) => ({
          contactId: contact.contactId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? undefined,
          phone: contact.phone ?? undefined,
          source: contact.source ?? undefined,
          additionalInfo: contact.additionalInfo ?? undefined,
          isActive: contact.isActive,
          createdAt: new Date(), // Default value since not fetched
          updatedAt: contact.updatedAt,
          ownerCount: contact.ownerCount,
          buyerCount: contact.buyerCount,
          prospectCount: contact.prospectCount,
          isOwner: contact.isOwner,
          isBuyer: contact.isBuyer,
          isInteresado: contact.isInteresado,
          prospectTitles: contact.prospectTitles ?? [],
          allListings: contact.allListings ?? [],
          tasks: contact.tasks ?? [],
        }),
      );

      return extendedContacts;
    },
    [],
  );

  // Fetch contacts for a specific page
  const fetchContactsForPage = useCallback(
    async (page: number, filters: ReturnType<typeof getFiltersFromUrl>) => {
      const isOwnerView = filters.roles.includes("owner");
      const pageSize = 50; // Items per page

      // Use the appropriate optimized query based on view
      const result = isOwnerView
        ? await listContactsOwnerDataWithAuth(page, pageSize, {
            searchQuery: filters.searchQuery,
            roles: ["owner"],
            lastContactFilter: filters.lastContactFilter,
            sources: filters.sources,
            ratings: filters.ratings,
            statuses: filters.statuses,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          })
        : await listContactsBuyerDataWithAuth(page, pageSize, {
            searchQuery: filters.searchQuery,
            roles: ["buyer"],
            lastContactFilter: filters.lastContactFilter,
            sources: filters.sources,
            ratings: filters.ratings,
            statuses: filters.statuses,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          });

      // Process contacts from the result (already sorted by database)
      const processedContacts = processContactsData(
        result.contacts as DbContact[],
      );

      return {
        contacts: processedContacts,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
      };
    },
    [processContactsData],
  );

  // Page change handler
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sort change handler
  const handleSortChange = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      // Reset to page 1 when sort changes - use router.push to trigger re-render
      router.push(`?${params.toString()}`);
      setCurrentPage(1);
    },
    [searchParams, router],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    const filters = getFiltersFromUrl();

    // Fetch appropriate data based on current URL filter and page
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch from server
        const result = await fetchContactsForPage(currentPage, filters);
        setContacts(result.contacts);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [searchParams, currentPage, getFiltersFromUrl, fetchContactsForPage]); // Re-fetch when URL parameters or page change

  // Get current filter for passing to table component
  const currentFilter = getFiltersFromUrl().roles;

  // Show skeleton only if loading and no data exists
  const showSkeleton = isLoading && contacts.length === 0;

  const handleFilterChange = (_filters: {
    searchQuery: string;
    roles: string[];
    lastContactFilter: string;
    sources: string[];
    ratings: number[];
    statuses: boolean[];
  }) => {
    // The filtering is now handled by the database query and URL parameters
    // This function is called by the ContactFilter component to update the URL
    // The useEffect above will re-fetch data when URL changes
  };

  // Export all filtered contacts to CSV
  const handleExport = useCallback(async () => {
    const filters = getFiltersFromUrl();

    try {
      // Fetch ALL contacts with current filters (no pagination)
      const isOwnerView = filters.roles.includes("owner");
      const result = isOwnerView
        ? await listContactsOwnerDataWithAuth(1, 100000, {
            // Large limit to get all
            searchQuery: filters.searchQuery,
            roles: ["owner"],
            lastContactFilter: filters.lastContactFilter,
            sources: filters.sources,
            ratings: filters.ratings,
            statuses: filters.statuses,
          })
        : await listContactsBuyerDataWithAuth(1, 100000, {
            // Large limit to get all
            searchQuery: filters.searchQuery,
            roles: ["buyer"],
            lastContactFilter: filters.lastContactFilter,
            sources: filters.sources,
            ratings: filters.ratings,
            statuses: filters.statuses,
          });

      const allContacts = processContactsData(result.contacts as DbContact[]);

      // Create CSV headers
      const headers = [
        "Nombre",
        "Email",
        "Teléfono",
        "Tipo",
        "Propiedades",
        "Última Actualización",
      ];

      // Create CSV rows
      const rows = allContacts.map((contact) => {
        const types = [];
        if (contact.isOwner) types.push("Propietario");
        if (contact.isBuyer) types.push("Comprador");
        if (contact.isInteresado) types.push("Interesado");

        const propertiesCount =
          (contact.ownerCount ?? 0) +
          (contact.buyerCount ?? 0) +
          (contact.prospectCount ?? 0);

        return [
          `"${contact.firstName} ${contact.lastName}"`,
          contact.email ?? "",
          contact.phone ?? "",
          types.join(", "),
          propertiesCount.toString(),
          contact.updatedAt.toLocaleDateString(),
        ].join(",");
      });

      // Combine headers and rows
      const csv = [headers.join(","), ...rows].join("\n");

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `contactos-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting contacts:", error);
      alert("Error al exportar contactos");
    }
  }, [getFiltersFromUrl, processContactsData]);

  return (
    <>
      <div className="space-y-4">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Contactos</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Crear Contacto</span>
              <span className="sm:hidden">Crear</span>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contactos/borradores">
                <FileText className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      <div className="space-y-2">
        <ContactFilter onFilterChange={handleFilterChange} />

        {showSkeleton ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <ContactSpreadsheetTable
            contacts={contacts}
            currentFilter={currentFilter}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onExport={handleExport}
            currentSortBy={getFiltersFromUrl().sortBy}
            currentSortOrder={getFiltersFromUrl().sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
        )}
      </div>
    </div>

      <CreateContactModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        sourceContext="operaciones"
        onSuccess={() => {
          setIsCreateModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
