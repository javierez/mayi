"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { loadGoogleMapsApi } from "~/lib/google-maps-loader";
import { formatCityName } from "~/lib/city-name-formatter";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Buscar ciudad...",
  className = "",
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (!inputRef.current) return;

      try {
        // Load Google Maps API
        await loadGoogleMapsApi();

        // Create autocomplete instance restricted to cities
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["(cities)"], // Restrict to cities only
            fields: ["address_components", "name"], // Only fetch what we need
          },
        );

        // Listen for place selection (only fires when user selects from dropdown)
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();

          if (place?.address_components) {
            // Extract city name from address components
            const cityComponent = place.address_components.find(
              (component) =>
                component.types.includes("locality") ||
                component.types.includes("administrative_area_level_3"),
            );

            if (cityComponent) {
              // Format the city name to proper title case
              const formattedCity = formatCityName(cityComponent.long_name);
              setInputValue(formattedCity);
              onChange(formattedCity); // Only call onChange when Google option selected
            } else if (place.name) {
              // Fallback to place name if no city component found
              const formattedCity = formatCityName(place.name);
              setInputValue(formattedCity);
              onChange(formattedCity); // Only call onChange when Google option selected
            }
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing city autocomplete:", error);
        setIsLoading(false);
      }
    };

    void initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  // Sync inputValue with value prop when it changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)} // Only update local state while typing
      placeholder={isLoading ? "Cargando..." : placeholder}
      disabled={isLoading}
      className={className}
    />
  );
}
