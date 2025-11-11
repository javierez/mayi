"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { RefreshCw, Search, AlertCircle, Users, Info } from "lucide-react";
import { ExternalAccountCard } from "./external-account-card";
import { ContactMatchGroup } from "./contact-match-group";
import { ProspectMatchGroup } from "./prospect-match-group";
import { ShareListingModal } from "./share-listing-modal";
import { CrucesInfoModal } from "./cruces-info-modal";
import {
  getMatchesForProspectsWithAuth,
  saveMatchWithAuth,
  dismissMatchWithAuth,
  contactMatchWithAuth,
  createLeadFromMatchWithAuth,
} from "~/server/queries/connection-matches";
import { getAccountWebsiteWithAuth } from "~/server/queries/listing";
import type {
  MatchResults,
  MatchFilters as MatchFiltersType,
  ProspectMatch,
  MatchAction,
} from "~/types/connection-matches";

interface ConexionesPotencialesProps {
  // Props can be extended based on requirements
  className?: string;
}

export function ConexionesPotenciales({
  className,
}: ConexionesPotencialesProps) {
  const searchParams = useSearchParams();

  // State management
  const [matches, setMatches] = useState<MatchResults | null>(null);
  const [externalMatches, setExternalMatches] = useState<MatchResults | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExternalLoading, setIsExternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFiltersType>({
    accountScope: "current",
    includeNearStrict: true,
    propertyTypes: [],
    locationIds: [],
    prospectTypes: [],
    listingTypes: [],
    statuses: [],
    urgencyLevels: [],
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<
    "internal" | "external" | null
  >("internal");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ProspectMatch | null>(
    null,
  );
  const [accountWebsite, setAccountWebsite] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    internalMatches: 0,
    externalMatches: 0,
  });

  // Fetch account website
  useEffect(() => {
    const fetchAccountWebsite = async () => {
      try {
        const website = await getAccountWebsiteWithAuth();
        setAccountWebsite(website);
      } catch (error) {
        console.error("Error fetching account website:", error);
      }
    };
    void fetchAccountWebsite();
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const prospectType = searchParams.get("prospectType");
    const listingType = searchParams.get("listingType");
    const status = searchParams.get("status");
    const urgencyLevel = searchParams.get("urgencyLevel");

    setFilters((prev) => ({
      ...prev,
      prospectTypes:
        prospectType && prospectType !== "all" ? prospectType.split(",") : [],
      listingTypes:
        listingType && listingType !== "all" ? listingType.split(",") : [],
      statuses: status ? status.split(",") : [],
      urgencyLevels: urgencyLevel ? urgencyLevel.split(",") : [],
    }));
  }, [searchParams]);

  // Fetch internal matches data
  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMatchesForProspectsWithAuth({
        filters: { ...filters, accountScope: "current" },
        pagination: {
          offset: 0,
          limit: 1000,
        },
      });

      console.log("🔍 Internal matches result:", result);
      console.log("📊 Internal matches count:", result.matches.length);
      console.log("🎯 Internal total count:", result.totalCount);

      setMatches(result);
    } catch (err) {
      console.error("Error fetching internal matches:", err);
      setError("Error al cargar las conexiones internas. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch external matches data
  const fetchExternalMatches = useCallback(async () => {
    setIsExternalLoading(true);

    try {
      const result = await getMatchesForProspectsWithAuth({
        filters: { ...filters, accountScope: "cross-account" },
        pagination: {
          offset: 0,
          limit: 1000,
        },
      });

      console.log("🌐 External matches result:", result);
      console.log("📊 External matches count:", result.matches.length);
      console.log("🎯 External total count:", result.totalCount);

      setExternalMatches(result);
    } catch (err) {
      console.error("Error fetching external matches:", err);
      // Don't set error for external matches, just log it
    } finally {
      setIsExternalLoading(false);
    }
  }, [filters]);

  // Effect to fetch data when filters or page change
  useEffect(() => {
    void fetchMatches();
    void fetchExternalMatches();
  }, [fetchMatches, fetchExternalMatches]);

  // Update stats when matches change
  useEffect(() => {
    const internalMatches = matches?.totalCount ?? 0;
    const externalMatchesCount = (externalMatches?.matches ?? []).filter(
      (match) => match.isCrossAccount,
    ).length;

    setStats({
      internalMatches,
      externalMatches: externalMatchesCount,
    });
  }, [matches, externalMatches]);

  // Handle match actions
  const handleMatchAction = async (
    action: MatchAction,
    match: ProspectMatch,
  ) => {
    const actionKey = `${action}-${match.prospectId}-${match.listingId}`;
    setActionLoading(actionKey);

    try {
      let result;

      switch (action) {
        case "save":
          result = await saveMatchWithAuth(match.prospectId, match.listingId);
          break;
        case "dismiss":
          result = await dismissMatchWithAuth(
            match.prospectId,
            match.listingId,
          );
          break;
        case "contact":
        case "request-contact":
          result = await contactMatchWithAuth(
            match.prospectId,
            match.listingId,
          );
          break;
        case "create-lead":
          result = await createLeadFromMatchWithAuth(
            match.prospectId,
            match.listingId,
          );
          break;
        case "share":
          // Open share modal instead of direct action
          setSelectedMatch(match);
          setShareModalOpen(true);
          setActionLoading(null);
          return; // Early return, don't process as server action
        default:
          throw new Error(`Acción no soportada: ${String(action)}`);
      }

      if (result.success) {
        // Show success message or update UI
        console.log(
          result.message || `Acción ${action} completada exitosamente`,
        );

        // Refresh matches to reflect changes
        if (action === "dismiss" || action === "create-lead") {
          void fetchMatches();
          void fetchExternalMatches();
        }
      } else {
        throw new Error(
          result.message || `Error al ejecutar la acción ${action}`,
        );
      }
    } catch (err) {
      console.error(`Error executing action ${action}:`, err);
      const actionMessages: Record<string, string> = {
        save: "guardar",
        dismiss: "descartar",
        contact: "contactar",
        "request-contact": "contactar",
        "create-lead": "crear lead para",
        share: "compartir",
      };

      setError(`Error al ${actionMessages[action] ?? action} la coincidencia`);
    } finally {
      setActionLoading(null);
    }
  };

  // Group external matches by account
  const groupMatchesByAccount = (matches: ProspectMatch[]) => {
    const grouped = matches.reduce(
      (acc, match) => {
        const accountId = match.listingAccountId?.toString() || "unknown";
        acc[accountId] ??= [];
        acc[accountId].push(match);
        return acc;
      },
      {} as Record<string, ProspectMatch[]>,
    );
    return grouped;
  };

  // Group internal matches by contact
  const groupMatchesByContact = (matches: ProspectMatch[]) => {
    const grouped = matches.reduce(
      (acc, match) => {
        const contactId = match.prospect.contacts.contactId.toString();
        acc[contactId] ??= [];
        acc[contactId].push(match);
        return acc;
      },
      {} as Record<string, ProspectMatch[]>,
    );
    return grouped;
  };

  // Group matches by prospect within a contact's matches
  const groupMatchesByProspect = (matches: ProspectMatch[]) => {
    const grouped = matches.reduce(
      (acc, match) => {
        const prospectId = match.prospectId.toString();
        acc[prospectId] ??= [];
        acc[prospectId].push(match);
        return acc;
      },
      {} as Record<string, ProspectMatch[]>,
    );
    return grouped;
  };

  // Handle external account contact request
  const handleExternalContactRequest = async (
    accountId: string,
    matches: ProspectMatch[],
  ) => {
    console.log(
      `📞 Contact request for account ${accountId} with ${matches.length} matches`,
    );
    // TODO: Implement external contact request logic
    setError(
      `Funcionalidad de contacto externo próximamente disponible para la cuenta ${accountId}`,
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    void fetchMatches();
    void fetchExternalMatches();
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="h-36 w-full sm:h-48" />
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-3 h-4 w-1/2 sm:mb-4" />
            <div className="flex flex-wrap justify-between gap-2">
              <Skeleton className="h-4 w-14 sm:w-16" />
              <Skeleton className="h-4 w-14 sm:w-16" />
              <Skeleton className="h-4 w-14 sm:w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render statistics
  const renderStats = () => (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
      <Card
        className={`cursor-pointer border-0 shadow-sm transition-all hover:shadow-md ${
          selectedView === "internal" ? "bg-gray-100 ring-2 ring-gray-800" : ""
        }`}
        onClick={() => setSelectedView("internal")}
      >
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 sm:text-lg">
                {stats.internalMatches}
              </p>
              <p className="truncate text-xs text-muted-foreground">Internas</p>
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer border-0 shadow-sm transition-all hover:shadow-md ${
          selectedView === "external" ? "bg-gray-100 ring-2 ring-gray-800" : ""
        }`}
        onClick={() => setSelectedView("external")}
      >
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 sm:text-lg">
                {stats.externalMatches}
              </p>
              <p className="truncate text-xs text-muted-foreground">Externas</p>
            </div>
            <Users className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Card className="py-8 text-center sm:py-12">
      <CardContent>
        <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground sm:mb-4 sm:h-16 sm:w-16" />
        <h3 className="mb-2 text-base font-semibold sm:text-lg">
          No se encontraron coincidencias
        </h3>
        <p className="text-sm text-muted-foreground sm:text-base">
          No hay propiedades que coincidan con los criterios actuales.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl">
            Buscador de Cruces
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInfoModalOpen(true)}
            className="h-8 w-8 p-0"
            title="¿Qué son los cruces?"
          >
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-14 sm:h-16" />
              ))}
            </div>
            {renderLoadingSkeleton()}
          </>
        ) : (
          <>
            {/* Statistics */}
            {matches && matches.matches.length > 0 && renderStats()}

            {/* Matches Grid */}
            {selectedView === "internal" &&
            matches &&
            matches.matches.length > 0 ? (
              <>
                <div className="space-y-4">
                  {Object.entries(
                    groupMatchesByContact(
                      matches.matches.filter((match) => !match.isCrossAccount),
                    ),
                  ).map(([contactId, contactMatches]) => {
                    const contact = contactMatches[0]?.prospect.contacts;
                    if (!contact) return null;

                    const contactName = `${contact.firstName} ${contact.lastName}`;

                    return (
                      <ContactMatchGroup
                        key={contactId}
                        contactId={contactId}
                        contactName={contactName}
                        matches={contactMatches}
                      >
                        {Object.entries(
                          groupMatchesByProspect(contactMatches),
                        ).map(([prospectId, prospectMatches]) => {
                          const prospect =
                            prospectMatches[0]?.prospect.prospects;
                          if (!prospect) return null;

                          // Build prospect type display
                          const listingTypeText =
                            prospect.listingType === "Sale"
                              ? "Demanda de Venta"
                              : "Búsqueda de Alquiler";
                          const propertyTypeText = prospect.propertyType
                            ? ` de ${prospect.propertyType.charAt(0).toUpperCase()}${prospect.propertyType.slice(1).toLowerCase()}`
                            : "";
                          const prospectType = `${listingTypeText}${propertyTypeText}`;

                          // Parse preferred areas
                          const parsePreferredAreas = (
                            preferredAreas: unknown,
                          ): string[] => {
                            if (!preferredAreas) return [];
                            try {
                              if (Array.isArray(preferredAreas)) {
                                return (
                                  preferredAreas as Array<{ name: string }>
                                ).map((area) => area.name);
                              }
                              if (typeof preferredAreas === "string") {
                                const parsed = JSON.parse(
                                  preferredAreas,
                                ) as unknown;
                                if (Array.isArray(parsed)) {
                                  return (
                                    parsed as Array<{ name: string }>
                                  ).map((area) => area.name);
                                }
                              }
                            } catch {
                              return [];
                            }
                            return [];
                          };

                          return (
                            <ProspectMatchGroup
                              key={prospectId}
                              prospectType={prospectType}
                              prospectDetails={{
                                minPrice: prospect.minPrice,
                                maxPrice: prospect.maxPrice,
                                minBedrooms: prospect.minBedrooms,
                                minBathrooms: prospect.minBathrooms,
                                preferredAreas: parsePreferredAreas(
                                  prospect.preferredAreas,
                                ),
                              }}
                              matches={prospectMatches}
                              onAction={handleMatchAction}
                            />
                          );
                        })}
                      </ContactMatchGroup>
                    );
                  })}
                </div>
              </>
            ) : selectedView === "external" ? (
              isExternalLoading ? (
                renderLoadingSkeleton()
              ) : externalMatches &&
                externalMatches.matches.filter((match) => match.isCrossAccount)
                  .length > 0 ? (
                <>
                  <div className="space-y-4">
                    {Object.entries(
                      groupMatchesByAccount(
                        externalMatches.matches.filter(
                          (match) => match.isCrossAccount,
                        ),
                      ),
                    ).map(([accountId, matches]) => (
                      <ExternalAccountCard
                        key={accountId}
                        accountId={accountId}
                        matches={matches}
                        onRequestContact={handleExternalContactRequest}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center sm:py-12">
                  <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground sm:mb-4 sm:h-16 sm:w-16" />
                  <h3 className="mb-2 text-base font-semibold sm:text-lg">
                    Sin coincidencias externas
                  </h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    No se encontraron propiedades de otras cuentas que coincidan
                    con los criterios
                  </p>
                </div>
              )
            ) : selectedView === "internal" &&
              matches &&
              matches.matches.filter((m) => !m.isCrossAccount).length === 0 ? (
              /* Empty State for internal matches */
              renderEmptyState()
            ) : null}
          </>
        )}

        {/* Action Loading Indicator */}
        {actionLoading && (
          <div className="fixed bottom-3 right-3 rounded-lg border bg-background p-2.5 shadow-lg sm:bottom-4 sm:right-4 sm:p-3">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
              <span className="text-xs sm:text-sm">Procesando acción...</span>
            </div>
          </div>
        )}

        {/* Share Listing Modal */}
        {selectedMatch && (
          <ShareListingModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            match={selectedMatch}
            accountWebsite={accountWebsite}
          />
        )}

        {/* Cruces Info Modal */}
        <CrucesInfoModal
          open={infoModalOpen}
          onOpenChange={setInfoModalOpen}
        />
      </CardContent>
    </Card>
  );
}
