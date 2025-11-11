"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProspectFilter } from "~/components/prospects/prospect-filter";
import { ProspectKanban } from "~/components/prospects/prospect-kanban";
import { ProspectTable } from "~/components/prospects/prospect-table";
import { ConexionesPotenciales } from "~/components/prospects/conexiones-potenciales";
import { ProspectCardSkeleton } from "~/components/prospects/prospect-card-skeleton";
import { NoResults } from "~/components/prospects/no-results";
import { getAllProspectsWithAuth } from "~/server/queries/prospect";
import { getAllListingsWithAuth } from "~/server/queries/operations-listings";
import { getMatchesForProspectsWithAuth } from "~/server/queries/connection-matches";
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
  const [filteredProspects, setFilteredProspects] = useState<ProspectWithContact[]>([]);
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
  const hasMatchesParam = searchParams.get("hasMatches");
  const typeParam = searchParams.get("type"); // "sale" or "rent"

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

        // Apply filters based on URL params
        let filtered = prospectsResult;

        // Filter by listing type (Sale/Rent) if typeParam is provided
        if (typeParam === "sale" || typeParam === "rent") {
          const listingType = typeParam === "sale" ? "Sale" : "Rent";
          filtered = filtered.filter(
            (p) => p.prospects.listingType === listingType,
          );
        }

        // Filter by hasMatches if param is provided
        if (hasMatchesParam !== null) {
          const shouldHaveMatches = hasMatchesParam === "true";

          // Fetch matches
          const matchResults = await getMatchesForProspectsWithAuth({
            filters: {
              accountScope: "current",
              includeNearStrict: true,
              propertyTypes: [],
              locationIds: [],
              prospectTypes: [],
              listingTypes: [],
              statuses: [],
              urgencyLevels: [],
            },
            pagination: {
              offset: 0,
              limit: 10000,
            },
          });

          // Build set of prospect IDs that have matches
          const prospectIdsWithMatches = new Set<string>();
          matchResults.matches.forEach((match) => {
            prospectIdsWithMatches.add(match.prospectId.toString());
          });

          // Filter based on whether prospect has matches
          filtered = filtered.filter((p) => {
            const hasMatch = prospectIdsWithMatches.has(
              p.prospects.id.toString(),
            );
            return shouldHaveMatches ? hasMatch : !hasMatch;
          });
        }

        setFilteredProspects(filtered);

        // Calculate total pages based on filtered results and listings
        const totalItems = filtered.length + listingsResult.length;
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
  }, [searchParams, hasMatchesParam, typeParam]);

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold sm:text-2xl">Ofertas y Demandas</h1>
        </div>
      </div>

      {isLoading ? (
        view === "kanban" ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Informacion basica",
              "En busqueda",
              "Valoracion",
              "Hoja de encargo",
            ].map((status, _idx) => (
              <div key={status} className="space-y-3 sm:space-y-4">
                <div className="h-10 animate-pulse rounded bg-gray-200 sm:h-12" />
                <div className="space-y-2 sm:space-y-3">
                  {Array.from({ length: 3 }).map((_, cardIdx) => (
                    <ProspectCardSkeleton key={cardIdx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 animate-pulse rounded bg-gray-100 sm:h-16"
              />
            ))}
          </div>
        )
      ) : error ? (
        <NoResults message={error} />
      ) : view === "kanban" ? (
        <ProspectKanban
          prospects={filteredProspects.length > 0 ? filteredProspects : prospects}
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
                setFilteredProspects(prospectsResult);
              } catch (error) {
                console.error("Error refreshing prospects:", error);
              }
            };
            void fetchData();
          }}
        />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <ConexionesPotenciales />

          {/* Hidden for now - Table below conexiones-potenciales */}
          <div className="hidden">
            <ProspectFilter view={view} onViewChange={handleViewChange} />

            <ProspectTable
              prospects={filteredProspects.length > 0 ? filteredProspects : prospects}
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
                    setFilteredProspects(prospectsResult);
                  } catch (error) {
                    console.error("Error refreshing prospects:", error);
                  }
                };
                void fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
