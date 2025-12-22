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
import { FilePlus, Loader2, Check, Search } from "lucide-react";
import { generateArrasContractAction } from "~/server/actions/listing-contacts";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface Deal {
  dealId: string;
  listingId: string;
  listingContactId: string | null;
  status: string;
  buyerName: string;
  offer: number | null;
}

interface ContactWithoutDeal {
  listingContactId: string;
  listingId: string;
  contactId: string;
  contactType: string | null;
  offer: number | null;
  offerAccepted: boolean | null;
  buyerName: string;
}

interface ContractSelectionCardsProps {
  listingId: number;
  listingPrice: number;
  deals: Deal[];
  contactsWithoutDeals: ContactWithoutDeal[];
}

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ContractSelectionCards({
  listingId,
  listingPrice,
  deals,
  contactsWithoutDeals,
}: ContractSelectionCardsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter deals and contacts based on search query
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const query = searchQuery.toLowerCase();
    return deals.filter((deal) =>
      deal.buyerName.toLowerCase().includes(query)
    );
  }, [deals, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactsWithoutDeals;
    const query = searchQuery.toLowerCase();
    return contactsWithoutDeals.filter((contact) =>
      contact.buyerName.toLowerCase().includes(query)
    );
  }, [contactsWithoutDeals, searchQuery]);

  // Reset search when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery("");
    }
  };

  // If no deals and no contacts, show nothing
  if (deals.length === 0 && contactsWithoutDeals.length === 0) {
    return null;
  }

  // Handle selecting a deal (already has a deal, go directly)
  const handleSelectDeal = (dealId: string) => {
    setLoadingId(`deal-${dealId}`);
    router.push(`/propiedades/${listingId}/contrato-arras/${dealId}`);
  };

  // Handle selecting a contact (needs to create deal first)
  const handleSelectContact = async (contact: ContactWithoutDeal) => {
    setLoadingId(`contact-${contact.listingContactId}`);

    try {
      const result = await generateArrasContractAction(
        BigInt(contact.listingContactId),
        BigInt(contact.listingId),
        BigInt(contact.contactId),
        listingPrice,
        {
          reactivateFirst: false,
          autoCompleteVisit: false,
        },
      );

      if (result.success && result.dealId) {
        router.push(`/propiedades/${listingId}/contrato-arras/${result.dealId}`);
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
        <Button onClick={() => setIsOpen(true)} variant="outline" className="rounded-2xl">
          <FilePlus className="mr-2 h-4 w-4" />
          Generar Contrato de Arras
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar comprador</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Scrollable list */}
          <div className="max-h-64 divide-y overflow-y-auto">
            {/* Deals first (ordered by creation date from query) */}
            {filteredDeals.map((deal) => {
              const isLoading = loadingId === `deal-${deal.dealId}`;
              return (
                <button
                  key={`deal-${deal.dealId}`}
                  onClick={() => handleSelectDeal(deal.dealId)}
                  disabled={loadingId !== null}
                  className={cn(
                    "flex w-full items-center justify-between px-2 py-3 text-left transition-colors",
                    "hover:bg-gray-50 disabled:opacity-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {deal.buyerName || "Sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Oferta: {formatPrice(deal.offer)}
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

            {/* Contacts without deals (ordered by creation date from query) */}
            {filteredContacts.map((contact) => {
              const isLoading = loadingId === `contact-${contact.listingContactId}`;
              return (
                <button
                  key={`contact-${contact.listingContactId}`}
                  onClick={() => handleSelectContact(contact)}
                  disabled={loadingId !== null}
                  className={cn(
                    "flex w-full items-center justify-between px-2 py-3 text-left transition-colors",
                    "hover:bg-gray-50 disabled:opacity-50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {contact.buyerName || "Sin nombre"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {contact.offer
                        ? `Oferta: ${formatPrice(contact.offer)}`
                        : `Precio listado: ${formatPrice(listingPrice)}`}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
