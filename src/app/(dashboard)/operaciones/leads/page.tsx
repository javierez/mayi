"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { TrendingUp, Plus, Info } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { LeadFilter } from "~/components/leads/lead-filter";
import { LeadTable } from "~/components/leads/lead-table";
import type { LeadWithDetails } from "~/components/leads/lead-table";
import {
  LeadPageSkeleton,
  EmptyLeadsState,
} from "~/components/leads/lead-skeletons";
import { LeadsInfoModal } from "~/components/leads/leads-info-modal";
import { listLeadsWithAuth } from "~/server/queries/lead";
import { getAllAgentsWithAuth } from "~/server/queries/listing";
import { toast } from "~/components/hooks/use-toast";
import type { LeadStatus } from "~/lib/constants/lead-statuses";

const ITEMS_PER_PAGE = 20;

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<LeadWithDetails[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const prefetchCacheRef = useRef<Map<number, LeadWithDetails[]>>(new Map());
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Get view mode from URL (default to list since Kanban is disabled)
  const view = (searchParams.get("view") ?? "list") as "kanban" | "list";

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const allAgents = await getAllAgentsWithAuth();
        setAgents(allAgents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    void fetchAgents();
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get all filter parameters from URL
        const page = parseInt(searchParams.get("page") ?? "1");
        const search = searchParams.get("search") ?? "";
        const badgeStatusFilters =
          searchParams.get("badgeStatus")?.split(",") ?? [];
        const sourceFilters = searchParams.get("source")?.split(",") ?? [];
        const agentFilters = searchParams.get("agent")?.split(",") ?? [];
        const isActiveParam = searchParams.get("isActive");

        // Parse isActive filter - if multiple values selected, use the first one
        // If "true" is included, show active leads; if "false" is included, show inactive
        const isActiveFilters = isActiveParam?.split(",") ?? ["true"];
        let isActiveFilter: boolean | undefined = undefined;
        if (isActiveFilters.length === 1) {
          isActiveFilter = isActiveFilters[0] === "true";
        }
        // If both true and false are selected, pass undefined to show all

        setCurrentPage(page);

        // Use enhanced query with filtering support
        const result = await listLeadsWithAuth(
          page,
          ITEMS_PER_PAGE,
          search || undefined,
          badgeStatusFilters.length > 0 ? badgeStatusFilters : undefined,
          sourceFilters.length > 0 ? sourceFilters : undefined,
          agentFilters.length > 0 ? agentFilters : undefined,
          isActiveFilter,
        );

        // Handle enhanced query response with proper structure
        if (result && "leads" in result) {
          // Enhanced query response with pagination data
          /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
          setLeads(
            result.leads.map((item: any) => ({
              leadId: item.listingContactId,
              contactId: item.contactId,
              listingId: item.listingId ?? null,
              prospectId: item.prospectId ?? null,
              source: item.source,
              status: item.status as LeadStatus,
              offer: item.offer ?? null,
              offerAccepted: item.offerAccepted ?? null,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              isActive: item.isActive ?? true,
              visitCount: item.visitCount ?? 0,
              hasUpcomingVisit: item.hasUpcomingVisit ?? false,
              hasMissedVisit: item.hasMissedVisit ?? false,
              hasCompletedVisit: item.hasCompletedVisit ?? false,
              hasCancelledVisit: item.hasCancelledVisit ?? false,
              hasOffer: item.hasOffer ?? false,
              contact: item.contact,
              listing: item.listing?.listingId
                ? {
                    listingId: item.listing.listingId,
                    referenceNumber: item.listing.referenceNumber,
                    title: item.listing.title,
                    street: item.listing.street,
                    price: item.listing.price ?? "0",
                    listingType: item.listing.listingType,
                    propertyType: item.listing.propertyType,
                    bedrooms: item.listing.bedrooms,
                    squareMeter: item.listing.squareMeter,
                  }
                : undefined,
              owner: item.owner?.contactId
                ? {
                    contactId: item.owner.contactId,
                    firstName: item.owner.firstName,
                    lastName: item.owner.lastName,
                    email: item.owner.email,
                    phone: item.owner.phone,
                  }
                : undefined,
            })),
          );
          /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

          setTotalPages(result.totalPages);
        } else {
          setLeads([]);
          setTotalPages(1);
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error("Unknown error");
        console.error("Error fetching leads:", errorObj);
        const errorMessage = errorObj.message;
        setError(errorMessage);
        toast({
          title: "Error al cargar leads",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLeads();
  }, [searchParams]);

  // Prefetch handler
  const handlePrefetchPage = useCallback(
    async (page: number) => {
      // Check if already cached
      if (prefetchCacheRef.current.has(page)) {
        console.log(`Page ${page} already cached`);
        return;
      }

      try {
        console.log(`Prefetching page ${page}`);
        const search = searchParams.get("search") ?? "";
        const badgeStatusFilters =
          searchParams.get("badgeStatus")?.split(",") ?? [];
        const sourceFilters = searchParams.get("source")?.split(",") ?? [];
        const agentFilters = searchParams.get("agent")?.split(",") ?? [];
        const isActiveParam = searchParams.get("isActive");

        // Parse isActive filter - if multiple values selected, use the first one
        const isActiveFilters = isActiveParam?.split(",") ?? ["true"];
        let isActiveFilter: boolean | undefined = undefined;
        if (isActiveFilters.length === 1) {
          isActiveFilter = isActiveFilters[0] === "true";
        }

        const result = await listLeadsWithAuth(
          page,
          ITEMS_PER_PAGE,
          search || undefined,
          badgeStatusFilters.length > 0 ? badgeStatusFilters : undefined,
          sourceFilters.length > 0 ? sourceFilters : undefined,
          agentFilters.length > 0 ? agentFilters : undefined,
          isActiveFilter,
        );

        if (result && "leads" in result) {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
          const processedLeads = result.leads.map((item: any) => ({
            leadId: item.listingContactId,
            contactId: item.contactId,
            listingId: item.listingId ?? null,
            prospectId: item.prospectId ?? null,
            source: item.source,
            status: item.status as LeadStatus,
            offer: item.offer ?? null,
            offerAccepted: item.offerAccepted ?? null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            isActive: item.isActive ?? true,
            visitCount: item.visitCount ?? 0,
            hasUpcomingVisit: item.hasUpcomingVisit ?? false,
            hasMissedVisit: item.hasMissedVisit ?? false,
            hasCompletedVisit: item.hasCompletedVisit ?? false,
            hasCancelledVisit: item.hasCancelledVisit ?? false,
            hasOffer: item.hasOffer ?? false,
            contact: item.contact,
            listing: item.listing?.listingId
              ? {
                  listingId: item.listing.listingId,
                  referenceNumber: item.listing.referenceNumber,
                  title: item.listing.title,
                  street: item.listing.street,
                  price: item.listing.price ?? "0",
                  listingType: item.listing.listingType,
                  propertyType: item.listing.propertyType,
                  bedrooms: item.listing.bedrooms,
                  squareMeter: item.listing.squareMeter,
                }
              : undefined,
            owner: item.owner?.contactId
              ? {
                  contactId: item.owner.contactId,
                  firstName: item.owner.firstName,
                  lastName: item.owner.lastName,
                  email: item.owner.email,
                  phone: item.owner.phone,
                }
              : undefined,
          }));
          /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

          prefetchCacheRef.current.set(page, processedLeads);
          console.log(`Successfully prefetched page ${page}`);
        }
      } catch (error) {
        console.error(`Failed to prefetch page ${page}:`, error);
      }
    },
    [searchParams],
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/operaciones/leads?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewChange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view === "kanban" ? "list" : "kanban");
    router.push(`/operaciones/leads?${params.toString()}`);
  };

  const handleLeadUpdate = () => {
    // Refresh data when a lead is updated
    window.location.reload();
  };

  // Loading state
  if (isLoading) {
    return <LeadPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold sm:text-2xl">Conexiones</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInfoModalOpen(true)}
                className="h-8 w-8 p-0"
                title="¿Qué son las conexiones?"
              >
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Gestiona las conexiones entre demandantes y propietarios
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
          <div className="text-red-800">
            <p className="text-sm font-medium sm:text-base">Error al cargar datos</p>
            <p className="mt-1 break-words text-xs sm:text-sm">{error}</p>
          </div>
        </div>

        {/* Info Modal */}
        <LeadsInfoModal
          open={infoModalOpen}
          onOpenChange={setInfoModalOpen}
        />
      </div>
    );
  }

  // Empty state
  if (!leads.length && !searchParams.toString()) {
    return <EmptyLeadsState />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold sm:text-2xl">Conexiones</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInfoModalOpen(true)}
              className="h-8 w-8 p-0"
              title="¿Qué son las conexiones?"
            >
              <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Gestiona las conexiones entre demandantes y propietarios
          </p>
        </div>

        {/* Future: Add create lead button */}
        <div className="flex gap-2">
          <Button variant="outline" disabled className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Crear lead</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <LeadFilter view={view} onViewChange={handleViewChange} agents={agents} />

      {/* Content */}
      {view === "list" ? (
        <LeadTable
          leads={leads}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onLeadUpdate={handleLeadUpdate}
        />
      ) : (
        // Future: Kanban view will be implemented here
        <div className="rounded-lg border bg-gray-50 p-6 text-center sm:p-12">
          <TrendingUp className="mx-auto h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
          <h3 className="mt-4 text-base font-medium sm:text-lg">Vista Kanban</h3>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            La vista Kanban para conexiones estará disponible próximamente.
          </p>
        </div>
      )}

      {/* Info Modal */}
      <LeadsInfoModal
        open={infoModalOpen}
        onOpenChange={setInfoModalOpen}
      />
    </div>
  );
}
