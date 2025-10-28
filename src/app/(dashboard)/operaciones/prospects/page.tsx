"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ProspectFilter } from "~/components/prospects/prospect-filter";
import { ProspectKanban } from "~/components/prospects/prospect-kanban";
import { ProspectTable } from "~/components/prospects/prospect-table";
import { ConexionesPotenciales } from "~/components/prospects/conexiones-potenciales";
import { ProspectCardSkeleton } from "~/components/prospects/prospect-card-skeleton";
import { NoResults } from "~/components/prospects/no-results";
import { getAllProspectsWithAuth } from "~/server/queries/prospect";
import { getAllListingsWithAuth } from "~/server/queries/operations-listings";
import type { ListingWithDetails } from "~/server/queries/operations-listings";
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

const ITEMS_PER_PAGE = 20;

export default function ProspectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [prospects, setProspects] = useState<ProspectWithContact[]>([]);
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [currentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const prefetchCacheRef = useRef<
    Map<
      number,
      { prospects: ProspectWithContact[]; listings: ListingWithDetails[] }
    >
  >(new Map());

  const view = (searchParams.get("view") ?? "list") as "kanban" | "list";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get all filter parameters from URL
        const filters: Record<string, unknown> = {};
        for (const [key, value] of searchParams.entries()) {
          if (key === "page" || key === "view") continue;
          if (key === "q") {
            filters.searchQuery = value;
          } else if (key === "listingType") {
            filters.listingType = value === "all" ? "all" : value;
          } else if (key === "prospectType") {
            filters.prospectType = value === "all" ? "all" : value;
          } else if (key === "status") {
            filters.status = value;
          } else if (key === "urgencyLevel") {
            filters.urgencyLevel = Number(value);
          } else {
            filters[key] = value;
          }
        }

        const [prospectsResult, listingsResult] = await Promise.all([
          getAllProspectsWithAuth(),
          getAllListingsWithAuth(),
        ]);

        setProspects(prospectsResult);
        setListings(listingsResult);

        // Calculate total pages based on combined results
        const totalItems = prospectsResult.length + listingsResult.length;
        setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE) || 1);

        // If no results found, show a message
        if (totalItems === 0) {
          setError(
            "No se encontraron operaciones con los filtros seleccionados",
          );
        }
      } catch (error) {
        console.error("Error fetching prospects:", error);
        setError("Error al cargar los prospectos");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [searchParams]);

  // Prefetch handler
  const handlePrefetchPage = useCallback(async (page: number) => {
    // Check if already cached
    if (prefetchCacheRef.current.has(page)) {
      console.log(`Page ${page} already cached`);
      return;
    }

    try {
      console.log(`Prefetching page ${page}`);
      const [prospectsResult, listingsResult] = await Promise.all([
        getAllProspectsWithAuth(),
        getAllListingsWithAuth(),
      ]);

      prefetchCacheRef.current.set(page, {
        prospects: prospectsResult,
        listings: listingsResult,
      });
      console.log(`Successfully prefetched page ${page}`);
    } catch (error) {
      console.error(`Failed to prefetch page ${page}:`, error);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/operaciones/prospects?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewChange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view === "kanban" ? "list" : "kanban");
    router.push(`/operaciones/prospects?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Demandas y Prospectos</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="default" disabled>
            <Users className="mr-2 h-4 w-4" />
            Demandas
          </Button>
          <Button asChild>
            <Link href="/leads">
              <Users className="mr-2 h-4 w-4" />
              Conexiones
            </Link>
          </Button>
          <Button asChild>
            <Link href="/deals">
              <Briefcase className="mr-2 h-4 w-4" />
              Operaciones
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        view === "kanban" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Informacion basica",
              "En busqueda",
              "Valoracion",
              "Hoja de encargo",
            ].map((status, _idx) => (
              <div key={status} className="space-y-4">
                <div className="h-12 animate-pulse rounded bg-gray-200" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, cardIdx) => (
                    <ProspectCardSkeleton key={cardIdx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-16 animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        )
      ) : error ? (
        <NoResults message={error} />
      ) : view === "kanban" ? (
        <ProspectKanban
          prospects={prospects}
          onProspectUpdate={() => {
            // Refresh data when prospects are updated
            const fetchData = async () => {
              try {
                const [prospectsResult, listingsResult] = await Promise.all([
                  getAllProspectsWithAuth(),
                  getAllListingsWithAuth(),
                ]);
                setProspects(prospectsResult);
                setListings(listingsResult);
              } catch (error) {
                console.error("Error refreshing prospects:", error);
              }
            };
            void fetchData();
          }}
        />
      ) : (
        <div className="space-y-6">
          <ConexionesPotenciales />

          <ProspectFilter view={view} onViewChange={handleViewChange} />

          <ProspectTable
            prospects={prospects}
            listings={listings}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPrefetchPage={handlePrefetchPage}
            onProspectUpdate={() => {
              // Refresh data when prospects are updated
              const fetchData = async () => {
                try {
                  const [prospectsResult, listingsResult] = await Promise.all([
                    getAllProspectsWithAuth(),
                    getAllListingsWithAuth(),
                  ]);
                  setProspects(prospectsResult);
                  setListings(listingsResult);
                } catch (error) {
                  console.error("Error refreshing prospects:", error);
                }
              };
              void fetchData();
            }}
          />
        </div>
      )}
    </div>
  );
}
