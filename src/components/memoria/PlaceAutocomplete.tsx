"use client";

import { useEffect, useState, useRef } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMapsApi } from "~/lib/google-maps-loader";
import { cn } from "~/lib/utils";
import type { LocationData } from "~/types/memoria";
import Image from "next/image";

// Extended location data with all available photos for selection
export interface PlaceDataWithPhotos extends LocationData {
  availablePhotos?: string[]; // All photo URLs from Google Places
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (data: PlaceDataWithPhotos) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Buscar restaurante, playa, café...",
  className,
  disabled = false,
}: PlaceAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const serviceElementRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps API on component mount
  useEffect(() => {
    let mounted = true;

    loadGoogleMapsApi()
      .then(() => {
        if (mounted) {
          setIsApiLoaded(true);
          setIsLoadingApi(false);
          // Create a hidden element for PlacesService (required by Google Maps API)
          if (!serviceElementRef.current) {
            serviceElementRef.current = document.createElement("div");
          }
          placesServiceRef.current = new google.maps.places.PlacesService(
            serviceElementRef.current
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load Google Maps API:", error);
        if (mounted) {
          setIsLoadingApi(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    initOnMount: isApiLoaded,
    requestOptions: {
      types: ["establishment"], // Search for places like restaurants, cafes, beaches
      // No country restriction - for worldwide vacation memories
    },
    debounce: 300,
    cache: 24 * 60 * 60,
  });

  // Sync external value with internal state
  useEffect(() => {
    if (isApiLoaded && ready && value !== inputValue) {
      setValue(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchPlaceDetails = async (
    placeId: string,
    placeName: string,
    placeAddress: string
  ): Promise<PlaceDataWithPhotos> => {
    return new Promise((resolve, reject) => {
      if (!placesServiceRef.current) {
        reject(new Error("PlacesService not initialized"));
        return;
      }

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ["name", "formatted_address", "geometry", "photos"],
        },
        (result, placeStatus) => {
          if (
            placeStatus === google.maps.places.PlacesServiceStatus.OK &&
            result
          ) {
            const lat = result.geometry?.location?.lat() ?? 0;
            const lng = result.geometry?.location?.lng() ?? 0;

            // Get all photo URLs (up to 10 from Google Places)
            const availablePhotos: string[] = [];
            if (result.photos && result.photos.length > 0) {
              for (const photo of result.photos) {
                availablePhotos.push(
                  photo.getUrl({ maxWidth: 400, maxHeight: 400 })
                );
              }
            }

            // First photo as default
            const photoUrl = availablePhotos[0];

            resolve({
              name: result.name ?? placeName,
              address: result.formatted_address ?? placeAddress,
              lat,
              lng,
              googlePlaceId: placeId,
              photoUrl,
              availablePhotos,
            });
          } else {
            // Fallback: use geocoding to get coordinates
            getGeocode({ address: placeAddress })
              .then((results) => {
                if (results[0]) {
                  const { lat, lng } = getLatLng(results[0]);
                  resolve({
                    name: placeName,
                    address: placeAddress,
                    lat,
                    lng,
                    googlePlaceId: placeId,
                  });
                } else {
                  resolve({
                    name: placeName,
                    address: placeAddress,
                    lat: 0,
                    lng: 0,
                    googlePlaceId: placeId,
                  });
                }
              })
              .catch(() => {
                resolve({
                  name: placeName,
                  address: placeAddress,
                  lat: 0,
                  lng: 0,
                  googlePlaceId: placeId,
                });
              });
          }
        }
      );
    });
  };

  const handleSelect =
    (suggestion: google.maps.places.AutocompletePrediction) => async () => {
      const placeName = suggestion.structured_formatting.main_text;
      const placeAddress = suggestion.description;

      setValue(placeName, false);
      onChange(placeName);
      setOpen(false);
      clearSuggestions();
      setIsLoadingDetails(true);

      try {
        const locationData = await fetchPlaceDetails(
          suggestion.place_id,
          placeName,
          placeAddress
        );
        onPlaceSelected(locationData);
      } catch (error) {
        console.error("Error fetching place details:", error);
        // Still call onPlaceSelected with basic data
        onPlaceSelected({
          name: placeName,
          address: placeAddress,
          lat: 0,
          lng: 0,
          googlePlaceId: suggestion.place_id,
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (isApiLoaded && ready) {
      setValue(newValue);
      if (newValue.length >= 2) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  };

  return (
    <Popover open={open && status === "OK"} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            type="text"
            value={value}
            onChange={handleInputChange}
            disabled={disabled || isLoadingDetails}
            placeholder={
              isLoadingApi
                ? "Cargando..."
                : isLoadingDetails
                  ? "Obteniendo detalles..."
                  : isApiLoaded && ready
                    ? placeholder
                    : "Escribir nombre del lugar..."
            }
            className={cn("pr-8", className)}
            onFocus={() => {
              if (value.length >= 2 && status === "OK" && isApiLoaded) {
                setOpen(true);
              }
            }}
          />
          {(isLoadingApi || isLoadingDetails) && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {status === "OK" && data.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              No se encontraron lugares
            </div>
          )}
          {status === "OK" &&
            data.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={handleSelect(suggestion)}
                className="flex w-full items-start gap-2 border-b p-3 text-left transition-colors last:border-b-0 hover:bg-accent"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">
                    {suggestion.structured_formatting.main_text}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {suggestion.structured_formatting.secondary_text}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PlacePreviewProps {
  locationData: LocationData;
  className?: string;
}

export function PlacePreview({ locationData, className }: PlacePreviewProps) {
  if (!locationData.photoUrl) {
    return null;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <Image
        src={locationData.photoUrl}
        alt={locationData.name}
        width={400}
        height={200}
        className="h-32 w-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-sm font-medium text-white">{locationData.name}</p>
        {locationData.address && (
          <p className="truncate text-xs text-white/80">{locationData.address}</p>
        )}
      </div>
    </div>
  );
}
