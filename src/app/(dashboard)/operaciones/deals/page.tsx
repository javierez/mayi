"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DealFilter } from "~/components/deals/deal-filter";
import { DealTable } from "~/components/deals/deal-table";
import type { DealWithDetails } from "~/components/deals/deal-table";
import {
  DealPageSkeleton,
  EmptyDealsState,
} from "~/components/deals/deal-skeletons";
import { listDealsWithDetailsAuth } from "~/server/queries/deal";
import { getAllAgentsWithAuth } from "~/server/queries/listing";
import { toast } from "~/components/hooks/use-toast";

const ITEMS_PER_PAGE = 20;

export default function DealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [deals, setDeals] = useState<DealWithDetails[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

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
    const fetchDeals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get all filter parameters from URL
        const page = parseInt(searchParams.get("page") ?? "1");
        const search = searchParams.get("search") ?? "";
        const statusFilters = searchParams.get("status")?.split(",") ?? [];
        const agentFilters = searchParams.get("agent")?.split(",") ?? [];

        setCurrentPage(page);

        // Call the enhanced query with filtering support
        const result = await listDealsWithDetailsAuth(
          page,
          ITEMS_PER_PAGE,
          search || undefined,
          statusFilters.length > 0 ? statusFilters : undefined,
          agentFilters.length > 0 ? agentFilters : undefined,
          undefined, // closeDateFrom
          undefined, // closeDateTo
          undefined, // minAmount
          undefined, // maxAmount
        );

        // Handle enhanced query response with proper structure
        if (result && "deals" in result) {
          /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
          setDeals(
            result.deals.map((item: any) => ({
              dealId: item.dealId,
              listingId: item.listingId,
              listingContactId: item.listingContactId ?? null,
              status: item.status,
              closeDate: item.closeDate ?? null,
              finalPrice: item.finalPrice ?? null,
              commissionPercentage: item.commissionPercentage ?? null,
              commissionAmount: item.commissionAmount ?? null,
              arrasAmount: item.arrasAmount ?? null,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
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
                    neighborhood: item.listing.neighborhood,
                  }
                : undefined,
              buyer: item.buyer?.contactId
                ? {
                    contactId: item.buyer.contactId,
                    firstName: item.buyer.firstName,
                    lastName: item.buyer.lastName,
                    email: item.buyer.email,
                    phone: item.buyer.phone,
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
              agent: item.agent?.id
                ? {
                    id: item.agent.id,
                    name: item.agent.name,
                  }
                : undefined,
              participants: item.participants ?? [],
            })),
          );
          /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

          setTotalPages(result.totalPages);
        } else {
          setDeals([]);
          setTotalPages(1);
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error("Unknown error");
        console.error("Error fetching deals:", errorObj);
        const errorMessage = errorObj.message;
        setError(errorMessage);
        toast({
          title: "Error al cargar acuerdos",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDeals();
  }, [searchParams]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/operaciones/deals?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading state
  if (isLoading) {
    return <DealPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Acuerdos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los acuerdos y transacciones en curso
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-red-800">
            <p className="font-medium">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!deals.length && !searchParams.toString()) {
    return <EmptyDealsState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Acuerdos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los acuerdos y transacciones en curso
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <DealFilter agents={agents} />

      {/* Content */}
      <DealTable
        deals={deals}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
