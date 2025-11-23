"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "~/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { ChevronDown, Loader, X } from "lucide-react";
import { ProspectContactCard } from "./prospect-contact-card";
import { ProspectPropertyCard } from "./prospect-property-card";
import { getProspectWithMatchesWithAuth } from "~/server/queries/prospect";
import { updateProspectWithAuth } from "~/server/queries/prospect";
import { PROSPECT_STATUSES } from "~/types/operations";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface ProspectDetailSheetProps {
  prospectId: bigint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void | Promise<void>;
}

type MatchData = {
  matchId: bigint;
  matchType: string;
  priceMatch: number | null;
  isCrossAccount: boolean;
  toleranceReasons: unknown;
  listingId: bigint;
  listingAccountId: bigint;
  price: string | null;
  listingType: string | null;
  propertyId: bigint;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  street: string | null;
  imageUrl: string | null;
  city: string | null;
  neighborhood: string | null;
};

type ProspectData = {
  prospect: {
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
  contact: {
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
  matches: MatchData[];
};

export function ProspectDetailSheet({
  prospectId,
  isOpen,
  onClose,
  onUpdate,
}: ProspectDetailSheetProps) {
  const router = useRouter();
  const [data, setData] = useState<ProspectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  // Fetch prospect data when sheet opens
  useEffect(() => {
    if (isOpen && prospectId) {
      console.log("🔍 [ProspectDetailSheet] Fetching data for prospectId:", prospectId.toString());
      setIsLoading(true);
      getProspectWithMatchesWithAuth(prospectId)
        .then((result) => {
          console.log("✅ [ProspectDetailSheet] Data fetched successfully:", {
            prospectId: result.prospect.id.toString(),
            contactId: result.contact.contactId.toString(),
            matchesCount: result.matches.length,
            matches: result.matches,
          });
          setData(result);
        })
        .catch((error) => {
          console.error("❌ [ProspectDetailSheet] Error loading prospect:", error);
          toast.error("Error al cargar el prospect");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, prospectId]);

  if (!prospectId) return null;

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!data) return;

    setOptimisticStatus(newStatus);
    setIsUpdatingStatus(true);

    try {
      await updateProspectWithAuth(data.prospect.id, { status: newStatus });
      toast.success("Estado actualizado correctamente");

      if (onUpdate) {
        await onUpdate();
      }

      // Refresh data
      const refreshedData = await getProspectWithMatchesWithAuth(prospectId);
      setData(refreshedData);
      setOptimisticStatus(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
      setOptimisticStatus(null);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Get prospect type display
  const getOperationTypeDisplay = (
    listingType: string | null,
    propertyType: string | null,
  ) => {
    let baseType = "Búsqueda";
    if (listingType) {
      switch (listingType) {
        case "Sale":
          baseType = "Demanda de Venta";
          break;
        case "Rent":
          baseType = "Búsqueda de Alquiler";
          break;
      }
    }

    if (propertyType) {
      const capitalizedPropertyType =
        propertyType.charAt(0).toUpperCase() +
        propertyType.slice(1).toLowerCase();
      return `${baseType} de ${capitalizedPropertyType}`;
    }

    return baseType;
  };

  // Get status display label
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
      case "nuevo":
      case "working":
      case "en proceso":
      case "en seguimiento":
      case "en preparación":
      case "en búsqueda":
        return "En búsqueda";
      case "qualified":
      case "calificado":
      case "finalizado":
        return "Finalizado";
      case "archived":
      case "archivado":
        return "Archivado";
      default:
        return "En búsqueda";
    }
  };

  // Get match quality based on priceMatch score
  const getMatchQuality = (
    priceMatch: number | null,
  ): "high" | "medium" | "low" => {
    if (priceMatch === null || priceMatch >= 90) return "high";
    if (priceMatch >= 70) return "medium";
    return "low";
  };

  const currentStatus = optimisticStatus ?? data?.prospect.status ?? "";
  const prospectTypeDisplay = getOperationTypeDisplay(
    data?.prospect.listingType ?? null,
    data?.prospect.propertyType ?? null,
  );

  // Group matches by internal/external and sort by quality
  const internalMatches = (data?.matches.filter((m) => !m.isCrossAccount) ?? [])
    .sort((a, b) => (b.priceMatch ?? 0) - (a.priceMatch ?? 0));

  const externalMatches = (data?.matches.filter((m) => m.isCrossAccount) ?? [])
    .sort((a, b) => (b.priceMatch ?? 0) - (a.priceMatch ?? 0));

  console.log("📊 [ProspectDetailSheet] Grouping matches:", {
    totalMatches: data?.matches.length ?? 0,
    internalCount: internalMatches.length,
    externalCount: externalMatches.length,
    hasData: !!data,
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex w-full max-w-full flex-col p-0 sm:max-w-md md:max-w-2xl [&>button]:hidden">
        <SheetHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="min-w-0 flex-1 break-words text-base sm:text-lg">
              {prospectTypeDisplay}
            </SheetTitle>

            {/* Status Dropdown */}
            {data && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    disabled={isUpdatingStatus}
                  >
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5",
                        currentStatus.toLowerCase() === "en búsqueda" &&
                          "bg-gray-100 text-gray-700",
                        currentStatus.toLowerCase() === "finalizado" &&
                          "bg-gray-200 text-gray-800",
                        currentStatus.toLowerCase() === "archivado" &&
                          "bg-gray-50 text-gray-400 line-through",
                      )}
                    >
                      {getStatusDisplay(currentStatus)}
                    </span>
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {PROSPECT_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => {
                        void handleStatusUpdate(status);
                      }}
                      disabled={isUpdatingStatus}
                    >
                      {getStatusDisplay(status)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Custom Close Button */}
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="mt-3 flex-1 sm:mt-4">
          <div className="space-y-3 px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : data ? (
              <>
                {/* Contact Card */}
                <ProspectContactCard
                  contactId={data.contact.contactId}
                  firstName={data.contact.firstName}
                  lastName={data.contact.lastName}
                  email={data.contact.email}
                  phone={data.contact.phone}
                  onNameClick={() => {
                    router.push(`/contactos/${data.contact.contactId}`);
                    onClose();
                  }}
                />

                {/* Property Matches Section */}
                {(internalMatches.length > 0 || externalMatches.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Propiedades Disponibles ({data.matches.length})
                    </h3>

                    {/* Internal Matches */}
                    {internalMatches.length > 0 && (
                      <div className="space-y-2">
                        {internalMatches.map((match) => (
                          <ProspectPropertyCard
                            key={match.matchId.toString()}
                            listingId={match.listingId}
                            price={match.price}
                            propertyType={match.propertyType}
                            bedrooms={match.bedrooms}
                            bathrooms={match.bathrooms}
                            squareMeter={match.squareMeter}
                            street={match.street}
                            city={match.city}
                            imageUrl={match.imageUrl}
                            listingType={match.listingType ?? undefined}
                            isExternal={false}
                            matchQuality={getMatchQuality(match.priceMatch)}
                            onClick={() => {
                              console.log(
                                "TODO: Open property action modal for listing:",
                                match.listingId,
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* External Matches */}
                    {externalMatches.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-500">
                          Externas ({externalMatches.length})
                        </h4>
                        {externalMatches.map((match) => (
                          <ProspectPropertyCard
                            key={match.matchId.toString()}
                            listingId={match.listingId}
                            price={match.price}
                            propertyType={match.propertyType}
                            bedrooms={match.bedrooms}
                            bathrooms={match.bathrooms}
                            squareMeter={match.squareMeter}
                            street={match.street}
                            city={match.city}
                            imageUrl={match.imageUrl}
                            listingType={match.listingType ?? undefined}
                            isExternal={true}
                            matchQuality={getMatchQuality(match.priceMatch)}
                            onClick={() => {
                              console.log(
                                "TODO: Open external property modal for listing:",
                                match.listingId,
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {data.matches.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">
                      No hay propiedades disponibles que coincidan con este
                      prospect
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
