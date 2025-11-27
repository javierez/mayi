"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { PropertyCardSkeleton } from "~/components/property-card-skeleton";
import { PropertyTableSkeleton } from "~/components/property-table-skeleton";
import { PropertyMapSkeleton } from "~/components/property-map-skeleton";
import { PropertyFilter } from "~/components/propiedades/property-filter";
import { PropertyTable } from "~/components/propiedades/property-table";
import { PropertyGrid } from "~/components/propiedades/property-grid";
import { PropertyMap } from "~/components/propiedades/maps/property-map";
import { NoResults } from "~/components/propiedades/no-results";
import {
  listListingsWithAuth,
  getAllAgentsWithAuth,
  getAccountWebsiteWithAuth,
} from "~/server/queries/listing";
import { getCitiesFromAccountPropertiesWithAuth } from "~/server/queries/locations";
import type { ListingOverview } from "~/types/listing";
import { useSearchParams, useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 21;

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<ListingOverview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused variable: totalCount
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [accountWebsite, setAccountWebsite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefetchedPages, setPrefetchedPages] = useState<Set<number>>(
    new Set(),
  );
  const [cities, setCities] = useState<string[]>([]);
  const [priceRange] = useState({ minPrice: 50000, maxPrice: 1000000 });
  const [areaRange] = useState({ minArea: 20, maxArea: 500 });

  const view = (searchParams.get("view") ?? "table") as
    | "grid"
    | "table"
    | "map";

  // Fetch agents, cities, and account website independently
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [allAgents, website, allCities] = await Promise.all([
          getAllAgentsWithAuth(),
          getAccountWebsiteWithAuth(),
          getCitiesFromAccountPropertiesWithAuth(),
        ]);
        setAgents(allAgents);
        setAccountWebsite(website);
        setCities(allCities);
      } catch (error) {
        console.error("Error fetching static data:", error);
        setError("Error al cargar los datos");
      }
    };
    void fetchStaticData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const page = Number(searchParams.get("page") ?? 1);
        // Get all filter parameters from URL
        const filters: Record<string, unknown> = {};
        // Check if status is explicitly in the URL
        let hasStatusParam = false;

        for (const [key, value] of searchParams.entries()) {
          if (key === "page") continue;
          if (key === "q") {
            filters.searchQuery = value;
          } else if (key === "status") {
            hasStatusParam = true;
            // Map status values from URL to database status
            const statusMap: Record<string, string> = {
              "for-sale": "En Venta",
              "for-rent": "En Alquiler",
              sold: "Vendido",
              rented: "Alquilado",
              discarded: "Descartado",
            };
            filters.status = value.split(",").map((v) => statusMap[v] ?? v);
          } else if (key === "type") {
            filters.propertyType = value.split(",");
          } else if (key === "agent") {
            filters.agentId = value.split(",");
          } else if (key === "ownerId") {
            filters.ownerId = value;
          } else if (
            [
              "minPrice",
              "maxPrice",
              "minBedrooms",
              "minBathrooms",
              "maxBathrooms",
              "minSize",
              "maxSize",
            ].includes(key)
          ) {
            // Map minSize/maxSize to minSquareMeter/maxSquareMeter
            if (key === "minSize") {
              filters.minSquareMeter = Number(value);
            } else if (key === "maxSize") {
              filters.maxSquareMeter = Number(value);
            } else {
              filters[key] = Number(value);
            }
          } else if (
            [
              "hasGarage",
              "hasElevator",
              "hasStorageRoom",
              "brandNew",
              "needsRenovation",
            ].includes(key)
          ) {
            filters[key] = value === "true";
          } else {
            filters[key] = value;
          }
        }

        // If no status filter was provided in URL, don't set it (backend will use default)
        // This allows the backend to apply the default filter without showing filter badges
        if (!hasStatusParam) {
          // Don't set filters.status - let the backend apply the default
        }

        // For map view, fetch all listings; for table/grid, use pagination
        const limit = view === "map" ? 10000 : ITEMS_PER_PAGE;
        const result = await listListingsWithAuth(page, limit, filters, view);

        setCurrentPage(page);

        console.log("Raw result from listListingsWithAuth:", result);
        console.log("Number of listings:", result.listings.length);
        console.log("First listing:", result.listings[0]);

        setListings(
          result.listings.map((listing) => ({
            ...listing,
            // Ensure listingType is cast to ListingType union
            listingType: listing.listingType as ListingOverview["listingType"],
            // Convert builtSurfaceArea from string to number
            builtSurfaceArea: listing.builtSurfaceArea
              ? Number(listing.builtSurfaceArea)
              : null,
          })),
        );
        setTotalPages(result.totalPages);
        // Removed setTotalCount since totalCount is unused

        // If no results found, show a message
        if (result.totalCount === 0) {
          setError(
            "No se encontraron propiedades con los filtros seleccionados",
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error al cargar las propiedades");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [searchParams, view]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/propiedades?${params.toString()}`);
  };

  // Smart prefetching function
  // Export all filtered properties to CSV
  const handleExport = async () => {
    try {
      // Get all filter parameters from URL
      const filters: Record<string, unknown> = {};
      let hasStatusParam = false;

      for (const [key, value] of searchParams.entries()) {
        if (key === "page") continue;
        if (key === "q") {
          filters.searchQuery = value;
        } else if (key === "status") {
          hasStatusParam = true;
          const statusMap: Record<string, string> = {
            "for-sale": "En Venta",
            "for-rent": "En Alquiler",
            sold: "Vendido",
            rented: "Alquilado",
            discarded: "Descartado",
          };
          filters.status = value.split(",").map((v) => statusMap[v] ?? v);
        } else if (key === "type") {
          filters.propertyType = value.split(",");
        } else if (key === "agent") {
          filters.agentId = value.split(",");
        } else if (key === "ownerId") {
          filters.ownerId = value;
        } else if (
          [
            "minPrice",
            "maxPrice",
            "minBedrooms",
            "minBathrooms",
            "maxBathrooms",
            "minSize",
            "maxSize",
          ].includes(key)
        ) {
          if (key === "minSize") {
            filters.minSquareMeter = Number(value);
          } else if (key === "maxSize") {
            filters.maxSquareMeter = Number(value);
          } else {
            filters[key] = Number(value);
          }
        } else if (
          [
            "hasGarage",
            "hasElevator",
            "hasStorageRoom",
            "brandNew",
            "needsRenovation",
          ].includes(key)
        ) {
          filters[key] = value === "true";
        } else {
          filters[key] = value;
        }
      }

      if (!hasStatusParam) {
        // Let backend apply default filter
      }

      // Fetch ALL listings with current filters (no pagination)
      // Always use 'table' view for export to get all necessary fields
      const result = await listListingsWithAuth(
        1,
        100000, // Large limit to get all
        filters,
        "table",
      );

      const allListings = result.listings.map((listing) => ({
        ...listing,
        listingType: listing.listingType as ListingOverview["listingType"],
        builtSurfaceArea: listing.builtSurfaceArea
          ? Number(listing.builtSurfaceArea)
          : null,
      })) as ListingOverview[];

      // Create CSV headers
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

      // Create CSV rows
      const rows = allListings.map((listing) => {
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

      // Combine headers and rows
      const csv = [headers.join(","), ...rows].join("\n");

      // Create blob and download
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
    } catch (error) {
      console.error("Error exporting properties:", error);
      alert("Error al exportar propiedades");
    }
  };

  const prefetchPage = async (pageNum: number) => {
    if (prefetchedPages.has(pageNum) || pageNum < 1 || pageNum > totalPages) {
      return;
    }

    try {
      setPrefetchedPages((prev) => new Set(prev).add(pageNum));

      // Get current filters
      const filters: Record<string, unknown> = {};
      let hasStatusParam = false;

      for (const [key, value] of searchParams.entries()) {
        if (key === "page") continue;
        if (key === "q") {
          filters.searchQuery = value;
        } else if (key === "status") {
          hasStatusParam = true;
          const statusMap: Record<string, string> = {
            "for-sale": "En Venta",
            "for-rent": "En Alquiler",
            sold: "Vendido",
            rented: "Alquilado",
            discarded: "Descartado",
          };
          filters.status = value.split(",").map((v) => statusMap[v] ?? v);
        } else if (key === "type") {
          filters.propertyType = value.split(",");
        } else if (key === "agent") {
          filters.agentId = value.split(",");
        } else if (key === "ownerName") {
          filters.ownerName = value;
        } else if (
          [
            "minPrice",
            "maxPrice",
            "minBedrooms",
            "minBathrooms",
            "maxBathrooms",
            "minSize",
            "maxSize",
          ].includes(key)
        ) {
          // Map minSize/maxSize to minSquareMeter/maxSquareMeter
          if (key === "minSize") {
            filters.minSquareMeter = Number(value);
          } else if (key === "maxSize") {
            filters.maxSquareMeter = Number(value);
          } else {
            filters[key] = Number(value);
          }
        } else if (
          [
            "hasGarage",
            "hasElevator",
            "hasStorageRoom",
            "brandNew",
            "needsRenovation",
          ].includes(key)
        ) {
          filters[key] = value === "true";
        } else {
          filters[key] = value;
        }
      }

      if (!hasStatusParam) {
        // Apply default filter if no status param
      }

      // Prefetch in background
      await listListingsWithAuth(pageNum, ITEMS_PER_PAGE, filters, view);

      console.log(`Prefetched page ${pageNum}`);
    } catch (error) {
      console.error(`Error prefetching page ${pageNum}:`, error);
      // Remove from prefetched set if failed
      setPrefetchedPages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pageNum);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Propiedades</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/propiedades/registro">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar Propiedad</span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/propiedades/borradores">
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <PropertyFilter
          view={view}
          agents={agents}
          cities={cities}
          priceRange={priceRange}
          areaRange={areaRange}
        />

        {isLoading ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <PropertyCardSkeleton key={index} />
            ))}
          </div>
        ) : view === "map" ? (
          <PropertyMapSkeleton />
        ) : (
          <PropertyTableSkeleton />
        )
      ) : error ? (
        <NoResults message={error} />
      ) : view === "grid" ? (
        <PropertyGrid
          listings={listings}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          accountWebsite={accountWebsite}
        />
      ) : view === "map" ? (
        <PropertyMap listings={listings} accountWebsite={accountWebsite} />
      ) : (
        <PropertyTable
          listings={listings}
          accountWebsite={accountWebsite}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onExport={handleExport}
        />
        )}
      </div>
    </div>
  );
}
