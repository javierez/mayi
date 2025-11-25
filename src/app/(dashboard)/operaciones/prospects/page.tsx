"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProspectFilter } from "~/components/prospects/prospect-filter";
import { ProspectTable } from "~/components/prospects/prospect-table";
import { NoResults } from "~/components/prospects/no-results";
import { getAllProspectsWithAuth } from "~/server/queries/prospect";
import { getMatchesForProspectsWithAuth } from "~/server/queries/connection-matches";
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

const ITEMS_PER_PAGE = 20;

export default function ProspectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculatingMatches, setIsCalculatingMatches] = useState(false);
  const [prospects, setProspects] = useState<ProspectWithContact[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<ProspectWithContact[]>([]);
  const [currentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const prefetchCacheRef = useRef<
    Map<number, { prospects: ProspectWithContact[] }>
  >(new Map());

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

        const prospectsResult = await getAllProspectsWithAuth();

        setProspects(prospectsResult);

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

        // Calculate total pages based on filtered results
        const totalItems = filtered.length;
        setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE) || 1);

        // If no results found, show a message
        if (totalItems === 0) {
          setError(
            "No se encontraron prospectos con los filtros seleccionados",
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
      const prospectsResult = await getAllProspectsWithAuth();

      prefetchCacheRef.current.set(page, {
        prospects: prospectsResult,
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

  const handleRefreshComplete = useCallback(async () => {
    // Refresh prospects data after match recalculation
    try {
      const prospectsResult = await getAllProspectsWithAuth();
      setProspects(prospectsResult);

      // Reapply filters
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
    } catch (error) {
      console.error("Error refreshing prospects:", error);
    }
  }, [hasMatchesParam, typeParam]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold sm:text-2xl">Demandas</h1>
      </div>

      {isCalculatingMatches && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <div>
              <p className="font-medium text-blue-900">
                Calculando coincidencias...
              </p>
              <p className="text-sm text-blue-700">
                Esto puede tardar unos segundos
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-14 animate-pulse rounded bg-gray-100 sm:h-16"
            />
          ))}
        </div>
      ) : error ? (
        <NoResults message={error} />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <ProspectFilter onRefreshComplete={handleRefreshComplete} />

          <ProspectTable
            prospects={filteredProspects.length > 0 ? filteredProspects : prospects}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onPrefetchPage={handlePrefetchPage}
            onProspectUpdate={() => {
              // Refresh data when prospects are updated
              const fetchData = async () => {
                setIsCalculatingMatches(true);
                try {
                  // Trigger match calculation
                  const response = await fetch("/api/matches/calculate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clearStale: true }),
                  });

                  if (!response.ok) {
                    console.error("Failed to calculate matches");
                  }

                  // Then refresh prospects
                  const prospectsResult = await getAllProspectsWithAuth();
                  setProspects(prospectsResult);
                  setFilteredProspects(prospectsResult);
                } catch (error) {
                  console.error("Error refreshing prospects:", error);
                } finally {
                  setIsCalculatingMatches(false);
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
