"use client";

import React, { useState } from "react";
import {
  MapPin,
  Building,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { formatListingType } from "../../contact-config";

// Contact Listing type
interface ContactListing {
  listingId: bigint;
  contactType: string;
  street?: string;
  city?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  createdAt?: Date;
}

interface PropiedadesProps {
  isActive: boolean;
  allListings?: ContactListing[];
  currentFilter?: string[];
  prospectTitles?: string[];
}

export function Propiedades({
  isActive,
  allListings,
  currentFilter = [],
  prospectTitles = [],
}: PropiedadesProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProspectsExpanded, setIsProspectsExpanded] = useState(false);

  // Use allListings directly - no fallback needed since we always provide it
  const displayListings = allListings ?? [];

  // Check if we should show prospects (when filter is set to demandante/buyer/interested)
  const shouldShowProspects =
    currentFilter.includes("buyer") || currentFilter.includes("interested");
  const hasProspects = prospectTitles.length > 0;

  // If no listings and no prospects to show
  if (displayListings.length === 0 && (!shouldShowProspects || !hasProspects)) {
    const isDemandanteFilter =
      currentFilter.includes("buyer") || currentFilter.includes("interested");
    return (
      <div
        className={cn(
          "text-sm",
          isActive ? "text-muted-foreground" : "text-gray-400",
        )}
      >
        {isDemandanteFilter ? "Sin demandas" : "Sin propiedades"}
      </div>
    );
  }

  // Function to render a single prospect
  const renderProspect = (title: string, index: number) => (
    <div
      key={`prospect-${index}`}
      className={cn(
        "mx-3 flex items-center rounded-lg p-1.5 text-xs",
        isActive ? "text-muted-foreground" : "text-gray-400",
      )}
    >
      <HelpCircle
        className={cn(
          "mr-2 h-3 w-3 flex-shrink-0",
          isActive ? "text-muted-foreground" : "text-gray-300",
        )}
      />
      <span className="truncate">{title}</span>
    </div>
  );

  // If only prospects and no listings - display prospects directly
  if (displayListings.length === 0 && shouldShowProspects && hasProspects) {
    if (prospectTitles.length === 1) {
      // Single prospect - display directly
      return renderProspect(prospectTitles[0]!, 0);
    }

    // Multiple prospects - display with expand/collapse
    return (
      <div className="my-2 space-y-1">
        {/* First prospect display */}
        {renderProspect(prospectTitles[0]!, 0)}

        {/* Toggle button for additional prospects - inline */}
        {!isProspectsExpanded && prospectTitles.length > 1 && (
          <button
            className={cn(
              "ml-2 inline-flex cursor-pointer items-center rounded p-0.5 text-xs transition-colors",
              isActive
                ? "text-muted-foreground hover:bg-gray-100"
                : "text-gray-400 hover:bg-gray-200",
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsProspectsExpanded(!isProspectsExpanded);
            }}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        )}

        {/* Expanded prospects container */}
        {isProspectsExpanded && (
          <>
            <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-32 overflow-y-auto">
              <div className="space-y-0.5 pr-2">
                {prospectTitles
                  .slice(1)
                  .map((title, index) => renderProspect(title, index + 1))}
              </div>
            </div>

            {/* Toggle button at the bottom when expanded */}
            <button
              className={cn(
                "ml-2 inline-flex cursor-pointer items-center rounded p-0.5 text-xs transition-colors",
                isActive
                  ? "text-muted-foreground hover:bg-gray-100"
                  : "text-gray-400 hover:bg-gray-200",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsProspectsExpanded(!isProspectsExpanded);
              }}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    );
  }

  // Calculate total items (listings + prospects)
  const totalItems =
    displayListings.length +
    (shouldShowProspects && hasProspects ? prospectTitles.length : 0);

  if (totalItems === 1) {
    // Single item (either listing or prospect) - display directly
    if (displayListings.length === 1) {
      const listing = displayListings[0];
      if (!listing) return null;

      const isDraft = listing.status === "Draft";

      return (
        <div
          className={cn(
            "mx-2 my-0.5 cursor-pointer rounded-lg p-1.5 transition-all duration-200 hover:shadow-md active:scale-[0.98]",
            isDraft
              ? "border border-dashed border-orange-300 bg-orange-50/50 opacity-75"
              : isActive
                ? "active:bg-gray-100"
                : "active:bg-gray-200",
          )}
          onClick={(e) => {
            e.stopPropagation();
            const targetRoute = isDraft
              ? `/propiedades/registro/${listing.listingId}`
              : `/propiedades/${listing.listingId}`;
            router.push(targetRoute);
          }}
        >
          <div className="space-y-0.5">
            {(listing.street ?? listing.city) && (
              <div
                className={cn(
                  "flex items-center text-sm",
                  isDraft ? "text-orange-600" : isActive ? "" : "text-gray-400",
                )}
              >
                <MapPin
                  className={cn(
                    "mr-2 h-4 w-4 flex-shrink-0",
                    isDraft
                      ? "text-orange-500"
                      : isActive
                        ? "text-muted-foreground"
                        : "text-gray-300",
                  )}
                />
                <span className="truncate">
                  {listing.street}{" "}
                  {listing.city && (
                    <span
                      className={
                        isDraft
                          ? "text-orange-500"
                          : isActive
                            ? "text-muted-foreground"
                            : "text-gray-400"
                      }
                    >
                      ({listing.city})
                    </span>
                  )}
                </span>
              </div>
            )}
            {(listing.propertyType ?? listing.listingType) && (
              <div
                className={cn(
                  "flex items-center text-sm",
                  isDraft ? "text-orange-600" : isActive ? "" : "text-gray-400",
                )}
              >
                <Building
                  className={cn(
                    "mr-2 h-4 w-4 flex-shrink-0",
                    isDraft
                      ? "text-orange-500"
                      : isActive
                        ? "text-muted-foreground"
                        : "text-gray-300",
                  )}
                />
                <span className="truncate">
                  {listing.propertyType && (
                    <span className="capitalize">{listing.propertyType}</span>
                  )}
                  {listing.propertyType && listing.listingType && (
                    <span
                      className={
                        isDraft
                          ? "text-orange-500"
                          : isActive
                            ? "text-muted-foreground"
                            : "text-gray-400"
                      }
                    >
                      {" "}
                      •{" "}
                    </span>
                  )}
                  {listing.listingType && (
                    <span>{formatListingType(listing.listingType)}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Single prospect only
      return renderProspect(prospectTitles[0]!, 0);
    }
  }

  // Multiple items (listings + prospects) - display with expand/collapse
  const firstListing = displayListings[0];
  const remainingListings = displayListings.slice(1);
  const prospectsToShow =
    shouldShowProspects && hasProspects ? prospectTitles : [];

  return (
    <div className="relative my-0.5 space-y-1">
      {/* First listing display */}
      {firstListing &&
        (() => {
          const isDraft = firstListing.status === "Draft";
          return (
            <div
              className={cn(
                "mx-2 my-0.5 cursor-pointer rounded-lg p-1.5 transition-all duration-200 hover:shadow-md active:scale-[0.98]",
                isDraft
                  ? "border border-dashed border-orange-300 bg-orange-50/50 opacity-75"
                  : isActive
                    ? "active:bg-gray-100"
                    : "active:bg-gray-200",
              )}
              onClick={(e) => {
                e.stopPropagation();
                const targetRoute = isDraft
                  ? `/propiedades/registro/${firstListing.listingId}`
                  : `/propiedades/${firstListing.listingId}`;
                router.push(targetRoute);
              }}
            >
              <div className="space-y-0.5">
                {(firstListing.street ?? firstListing.city) && (
                  <div
                    className={cn(
                      "flex items-center text-sm",
                      isDraft
                        ? "text-orange-600"
                        : isActive
                          ? ""
                          : "text-gray-400",
                    )}
                  >
                    <MapPin
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        isDraft
                          ? "text-orange-500"
                          : isActive
                            ? "text-muted-foreground"
                            : "text-gray-300",
                      )}
                    />
                    <span className="truncate">
                      {firstListing.street}{" "}
                      {firstListing.city && (
                        <span
                          className={
                            isDraft
                              ? "text-orange-500"
                              : isActive
                                ? "text-muted-foreground"
                                : "text-gray-400"
                          }
                        >
                          ({firstListing.city})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {(firstListing.propertyType ?? firstListing.listingType) && (
                  <div
                    className={cn(
                      "flex items-center text-sm",
                      isDraft
                        ? "text-orange-600"
                        : isActive
                          ? ""
                          : "text-gray-400",
                    )}
                  >
                    <Building
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        isDraft
                          ? "text-orange-500"
                          : isActive
                            ? "text-muted-foreground"
                            : "text-gray-300",
                      )}
                    />
                    <span className="truncate">
                      {firstListing.propertyType && (
                        <span className="capitalize">
                          {firstListing.propertyType}
                        </span>
                      )}
                      {firstListing.propertyType &&
                        firstListing.listingType && (
                          <span
                            className={
                              isDraft
                                ? "text-orange-500"
                                : isActive
                                  ? "text-muted-foreground"
                                  : "text-gray-400"
                            }
                          >
                            {" "}
                            •{" "}
                          </span>
                        )}
                      {firstListing.listingType && (
                        <span>
                          {formatListingType(firstListing.listingType)}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Toggle button for additional items - positioned at bottom right of first item */}
      {!isExpanded && totalItems > 1 && (
        <button
          className={cn(
            "absolute bottom-1 right-3 inline-flex cursor-pointer items-center rounded-full p-0.5 shadow-sm transition-all hover:shadow-md",
            isActive
              ? "bg-gray-50 text-gray-600 hover:bg-gray-100"
              : "bg-gray-200 text-gray-500 hover:bg-gray-300",
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      {/* Expanded container with remaining listings + all prospects */}
      {isExpanded && (
        <>
          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-32 overflow-y-auto">
            <div className="space-y-1 pr-2">
              {/* Remaining listings */}
              {remainingListings.map((listing) => {
                const isDraft = listing.status === "Draft";
                return (
                  <div
                    key={listing.listingId.toString()}
                    className={cn(
                      "mx-2 my-0.5 cursor-pointer rounded-lg p-1.5 transition-all duration-200 hover:shadow-md active:scale-[0.98]",
                      isDraft
                        ? "border border-dashed border-orange-300 bg-orange-50/50 opacity-75"
                        : isActive
                          ? "active:bg-gray-100"
                          : "active:bg-gray-200",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetRoute = isDraft
                        ? `/propiedades/registro/${listing.listingId}`
                        : `/propiedades/${listing.listingId}`;
                      router.push(targetRoute);
                    }}
                  >
                    <div className="space-y-0.5">
                      {(listing.street ?? listing.city) && (
                        <div
                          className={cn(
                            "flex items-center text-sm",
                            isDraft
                              ? "text-orange-600"
                              : isActive
                                ? ""
                                : "text-gray-400",
                          )}
                        >
                          <MapPin
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              isDraft
                                ? "text-orange-500"
                                : isActive
                                  ? "text-muted-foreground"
                                  : "text-gray-300",
                            )}
                          />
                          <span className="truncate">
                            {listing.street}{" "}
                            {listing.city && (
                              <span
                                className={
                                  isDraft
                                    ? "text-orange-500"
                                    : isActive
                                      ? "text-muted-foreground"
                                      : "text-gray-400"
                                }
                              >
                                ({listing.city})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {(listing.propertyType ?? listing.listingType) && (
                        <div
                          className={cn(
                            "flex items-center text-sm",
                            isDraft
                              ? "text-orange-600"
                              : isActive
                                ? ""
                                : "text-gray-400",
                          )}
                        >
                          <Building
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              isDraft
                                ? "text-orange-500"
                                : isActive
                                  ? "text-muted-foreground"
                                  : "text-gray-300",
                            )}
                          />
                          <span className="truncate">
                            {listing.propertyType && (
                              <span className="capitalize">
                                {listing.propertyType}
                              </span>
                            )}
                            {listing.propertyType && listing.listingType && (
                              <span
                                className={
                                  isDraft
                                    ? "text-orange-500"
                                    : isActive
                                      ? "text-muted-foreground"
                                      : "text-gray-400"
                                }
                              >
                                {" "}
                                •{" "}
                              </span>
                            )}
                            {listing.listingType && (
                              <span>
                                {formatListingType(listing.listingType)}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* All prospects */}
              {prospectsToShow.map((title, index) =>
                renderProspect(title, index),
              )}
            </div>
          </div>

          {/* Toggle button at the bottom when expanded */}
          <button
            className={cn(
              "ml-2 inline-flex cursor-pointer items-center rounded p-0.5 text-xs transition-colors",
              isActive
                ? "text-muted-foreground hover:bg-gray-100"
                : "text-gray-400 hover:bg-gray-200",
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
