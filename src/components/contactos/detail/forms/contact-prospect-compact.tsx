import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Pencil, MapPin, Banknote, Home, Bed, Bath } from "lucide-react";
import { prospectUtils } from "~/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { getLocationByNeighborhoodId } from "~/server/queries/locations";

interface ProspectData {
  id: bigint;
  contactId: bigint;
  status: string;
  listingType: string | null;
  propertyType: string | null;
  maxPrice: string | null;
  preferredCities: string[] | null;
  preferredAreas: Array<{ neighborhoodId?: number; name?: string }> | null;
  minBedrooms: number | null;
  minBathrooms: number | null;
  minSquareMeters: number | null;
  moveInBy: Date | null;
  extras: Record<string, unknown> | null;
  urgencyLevel: number | null;
  fundingReady: boolean | null;
  notesInternal: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactProspectCompactProps {
  prospect: ProspectData;
  onEdit: (prospect: ProspectData) => void;
  onDelete?: (prospectId: bigint) => void;
}

interface LocationData {
  neighborhoodId: bigint;
  city: string;
  province: string;
  municipality: string;
  neighborhood: string;
}

export function ContactProspectCompact({
  prospect,
  onEdit,
  onDelete: _onDelete,
}: ContactProspectCompactProps) {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [title, setTitle] = useState<string>("");

  const generateTitle = useCallback(
    (locations: LocationData[]) => {
      const generatedTitle = prospectUtils.generateProspectTitle(
        prospect.listingType,
        prospect.propertyType,
        locations,
        prospect.preferredCities,
      );
      setTitle(generatedTitle);
      return generatedTitle;
    },
    [prospect.listingType, prospect.propertyType, prospect.preferredCities],
  );

  useEffect(() => {
    const fetchLocationData = async () => {
      if (!prospect.preferredAreas || !Array.isArray(prospect.preferredAreas)) {
        generateTitle([]);
        return;
      }

      const locationPromises = prospect.preferredAreas
        .filter((area) => area.neighborhoodId)
        .map((area) => getLocationByNeighborhoodId(area.neighborhoodId!));

      try {
        const locations = await Promise.all(locationPromises);
        const validLocations = locations.filter(
          (loc) => loc !== undefined,
        ) as LocationData[];
        setLocationData(validLocations);
        generateTitle(validLocations);
      } catch (error) {
        console.error("Error fetching location data:", error);
        generateTitle([]);
      }
    };

    void fetchLocationData();
  }, [
    prospect.preferredAreas,
    prospect.listingType,
    prospect.propertyType,
    generateTitle,
  ]);

  const formatPrice = prospectUtils.formatCurrency;

  return (
    <Card className="group border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          {title && (
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          )}
          <p className="mt-0.5 text-xs text-gray-500">
            Creado {prospect.createdAt.toLocaleDateString("es-ES")}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(prospect)}
          className="h-6 w-6 p-0 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3 text-gray-400" />
        </Button>
      </div>

      <div className="space-y-3 text-sm">
        {/* All Characteristics in One Line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-700">
            {/* Budget */}
            <div className="flex items-center space-x-1">
              <Banknote className="h-4 w-4" />
              <span>&lt;{formatPrice(prospect.maxPrice)}</span>
            </div>

            <Separator orientation="vertical" className="mx-4 h-4" />

            {/* Property Size */}
            {prospect.minSquareMeters && (
              <div className="flex items-center space-x-1">
                <Home className="h-4 w-4" />
                <span>&gt;{prospect.minSquareMeters} m²</span>
              </div>
            )}

            <Separator orientation="vertical" className="mx-4 h-4" />

            {/* Rooms */}
            <div className="flex items-center space-x-3">
              {prospect.minBedrooms && (
                <div className="flex items-center space-x-1">
                  <Bed className="h-4 w-4" />
                  <span>{prospect.minBedrooms}+</span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Bath className="h-4 w-4" />
                <span>{prospect.minBathrooms ?? 1}+</span>
              </div>
            </div>
          </div>

          {prospect.fundingReady && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-xs text-green-700"
            >
              Financiación lista
            </Badge>
          )}
        </div>

        {/* Preferred Areas */}
        {locationData.length > 0 && (
          <div className="flex items-start space-x-2 text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {locationData.slice(0, 3).map((location, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="h-auto px-1.5 py-0.5 text-xs"
                >
                  {location.neighborhood}
                </Badge>
              ))}
              {locationData.length > 3 && (
                <Badge
                  variant="outline"
                  className="h-auto px-1.5 py-0.5 text-xs"
                >
                  +{locationData.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {prospect.notesInternal && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="line-clamp-2 text-xs text-gray-600">
            {prospect.notesInternal}
          </p>
        </div>
      )}
    </Card>
  );
}
