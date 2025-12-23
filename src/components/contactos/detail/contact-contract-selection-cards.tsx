"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FilePlus, Loader2, Check, Search, Home } from "lucide-react";
import { generateArrasContractAction } from "~/server/actions/listing-contacts";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface DealWithListing {
  dealId: string;
  listingId: string;
  listingContactId: string | null;
  status: string;
  title: string | null;
  street: string | null;
  city: string | null;
  referenceNumber: string | null;
  propertyType: string | null;
  offer: number | null;
  price: string | null;
}

interface ListingWithoutDeal {
  listingContactId: string;
  listingId: string;
  contactId: string;
  contactType: string | null;
  offer: number | null;
  offerAccepted: boolean | null;
  title: string | null;
  street: string | null;
  city: string | null;
  referenceNumber: string | null;
  propertyType: string | null;
  price: string | null;
  listingType: string | null;
}

interface ContactContractSelectionCardsProps {
  deals: DealWithListing[];
  listingsWithoutDeals: ListingWithoutDeal[];
}

function formatPrice(price: number | string | null): string {
  if (price === null) return "—";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

function getPropertyTypeLabel(type: string | null): string {
  if (!type) return "";
  const types: Record<string, string> = {
    apartment: "Piso",
    house: "Casa",
    villa: "Chalet",
    studio: "Estudio",
    duplex: "Dúplex",
    penthouse: "Ático",
    land: "Terreno",
    commercial: "Local",
    office: "Oficina",
    garage: "Garaje",
    storage: "Trastero",
  };
  return types[type] ?? type;
}

export function ContactContractSelectionCards({
  deals,
  listingsWithoutDeals,
}: ContactContractSelectionCardsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter deals and listings based on search query
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const query = searchQuery.toLowerCase();
    return deals.filter(
      (deal) =>
        Boolean(deal.title?.toLowerCase().includes(query)) ||
        Boolean(deal.street?.toLowerCase().includes(query)) ||
        Boolean(deal.referenceNumber?.toLowerCase().includes(query)) ||
        Boolean(deal.city?.toLowerCase().includes(query)),
    );
  }, [deals, searchQuery]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listingsWithoutDeals;
    const query = searchQuery.toLowerCase();
    return listingsWithoutDeals.filter(
      (listing) =>
        Boolean(listing.title?.toLowerCase().includes(query)) ||
        Boolean(listing.street?.toLowerCase().includes(query)) ||
        Boolean(listing.referenceNumber?.toLowerCase().includes(query)) ||
        Boolean(listing.city?.toLowerCase().includes(query)),
    );
  }, [listingsWithoutDeals, searchQuery]);

  // Reset search when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
    }
  };

  // If no deals and no listings, show nothing
  if (deals.length === 0 && listingsWithoutDeals.length === 0) {
    return null;
  }

  // Handle selecting a deal (already has a deal, go directly)
  const handleSelectDeal = (deal: DealWithListing) => {
    setLoadingId(`deal-${deal.dealId}`);
    router.push(`/propiedades/${deal.listingId}/contrato-arras/${deal.dealId}`);
  };

  // Handle selecting a listing (needs to create deal first)
  const handleSelectListing = async (listing: ListingWithoutDeal) => {
    setLoadingId(`listing-${listing.listingContactId}`);

    try {
      const listingPrice = parseFloat(listing.price ?? "0");
      const result = await generateArrasContractAction(
        BigInt(listing.listingContactId),
        BigInt(listing.listingId),
        BigInt(listing.contactId),
        listingPrice,
        {
          reactivateFirst: false,
          autoCompleteVisit: false,
        },
      );

      if (result.success && result.dealId) {
        router.push(
          `/propiedades/${listing.listingId}/contrato-arras/${result.dealId}`,
        );
      } else {
        toast.error(result.error ?? "Error al crear el contrato");
        setLoadingId(null);
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      toast.error("Error al generar el contrato");
      setLoadingId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="rounded-2xl"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          Generar Contrato de Arras
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar propiedad</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por referencia, dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Scrollable list */}
          <div className="max-h-80 divide-y overflow-y-auto">
            {/* Deals first (already have ongoing deals) */}
            {filteredDeals.map((deal) => {
              const isLoading = loadingId === `deal-${deal.dealId}`;
              return (
                <button
                  key={`deal-${deal.dealId}`}
                  onClick={() => handleSelectDeal(deal)}
                  disabled={loadingId !== null}
                  className={cn(
                    "flex w-full items-center gap-3 px-2 py-3 text-left transition-colors",
                    "hover:bg-gray-50 disabled:opacity-50",
                  )}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {deal.referenceNumber ?? "Sin ref."} -{" "}
                      {getPropertyTypeLabel(deal.propertyType)}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {deal.street ?? deal.title ?? "Sin dirección"}
                      {deal.city ? `, ${deal.city}` : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {deal.offer
                        ? `Oferta: ${formatPrice(deal.offer)}`
                        : `Precio: ${formatPrice(deal.price)}`}
                    </p>
                  </div>
                  {isLoading ? (
                    <Loader2 className="ml-2 h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
                  ) : (
                    <Check className="ml-2 h-4 w-4 flex-shrink-0 text-transparent" />
                  )}
                </button>
              );
            })}

            {/* Listings without deals */}
            {filteredListings.map((listing) => {
              const isLoading =
                loadingId === `listing-${listing.listingContactId}`;
              return (
                <button
                  key={`listing-${listing.listingContactId}`}
                  onClick={() => handleSelectListing(listing)}
                  disabled={loadingId !== null}
                  className={cn(
                    "flex w-full items-center gap-3 px-2 py-3 text-left transition-colors",
                    "hover:bg-gray-50 disabled:opacity-50",
                  )}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Home className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {listing.referenceNumber ?? "Sin ref."} -{" "}
                      {getPropertyTypeLabel(listing.propertyType)}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {listing.street ?? listing.title ?? "Sin dirección"}
                      {listing.city ? `, ${listing.city}` : ""}
                    </p>
                    <p className="text-sm text-gray-500">
                      {listing.offer
                        ? `Oferta: ${formatPrice(listing.offer)}`
                        : `Precio: ${formatPrice(listing.price)}`}
                    </p>
                  </div>
                  {isLoading ? (
                    <Loader2 className="ml-2 h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
                  ) : (
                    <Check className="ml-2 h-4 w-4 flex-shrink-0 text-transparent" />
                  )}
                </button>
              );
            })}

            {/* Empty state when no results */}
            {filteredDeals.length === 0 && filteredListings.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                No se encontraron propiedades
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
