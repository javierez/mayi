"use client";

import React from "react";
import { Euro, Bed, Bath, MapPin } from "lucide-react";
import type { ProspectMatch, MatchAction } from "~/types/connection-matches";
import { MatchCard } from "./match-card";

interface ProspectMatchGroupProps {
  prospectType: string;
  prospectDetails: {
    minPrice?: string | null;
    maxPrice?: string | null;
    minBedrooms?: number | null;
    minBathrooms?: number | null;
    preferredAreas?: string[];
  };
  matches: ProspectMatch[];
  onAction: (action: MatchAction, match: ProspectMatch) => Promise<void>;
}

export function ProspectMatchGroup({
  prospectType,
  prospectDetails,
  matches,
  onAction,
}: ProspectMatchGroupProps) {
  const matchCount = matches.length;

  // Sort matches: active matches first, then existing leads at the end
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.hasExistingLead === b.hasExistingLead) return 0;
    return a.hasExistingLead ? 1 : -1;
  });

  // Format price range
  const getPriceDisplay = () => {
    if (!prospectDetails.minPrice && !prospectDetails.maxPrice) return null;

    const formatPrice = (price: string) => {
      const num = parseFloat(price);
      if (num >= 1000) {
        return `€${Math.round(num / 1000)}k`;
      }
      return `€${Math.round(num)}`;
    };

    if (prospectDetails.minPrice && prospectDetails.maxPrice) {
      return `${formatPrice(prospectDetails.minPrice)} - ${formatPrice(prospectDetails.maxPrice)}`;
    }
    if (prospectDetails.minPrice) {
      return `> ${formatPrice(prospectDetails.minPrice)}`;
    }
    if (prospectDetails.maxPrice) {
      return `< ${formatPrice(prospectDetails.maxPrice)}`;
    }
    return null;
  };

  const priceDisplay = getPriceDisplay();

  return (
    <div className="space-y-3">
      {/* Prospect Header with Criteria Summary */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
          <span className="text-xs font-medium text-gray-700">
            {prospectType}
          </span>
          {priceDisplay && (
            <div className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              <span>{priceDisplay}</span>
            </div>
          )}
          {prospectDetails.minBedrooms !== null &&
            prospectDetails.minBedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                <span>≥ {prospectDetails.minBedrooms}</span>
              </div>
            )}
          {prospectDetails.minBathrooms !== null &&
            prospectDetails.minBathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                <span>≥ {Math.floor(prospectDetails.minBathrooms)}</span>
              </div>
            )}
          {prospectDetails.preferredAreas &&
            prospectDetails.preferredAreas.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {prospectDetails.preferredAreas.slice(0, 2).join(", ")}
                  {prospectDetails.preferredAreas.length > 2 &&
                    ` +${prospectDetails.preferredAreas.length - 2}`}
                </span>
              </div>
            )}
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">
          {matchCount} {matchCount === 1 ? "match" : "matches"}
        </span>
      </div>

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sortedMatches.map((match) => (
          <MatchCard
            key={`${match.prospectId}-${match.listingId}`}
            match={match}
            onAction={onAction}
            showActions={true}
          />
        ))}
      </div>
    </div>
  );
}
