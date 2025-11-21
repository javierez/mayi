"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { loadGoogleMapsApi } from "~/lib/google-maps-loader";
import { formatCityName } from "~/lib/city-name-formatter";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

interface Prediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Buscar ciudad...",
  className = "",
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Initialize Google Maps services
  useEffect(() => {
    const initServices = async () => {
      try {
        await loadGoogleMapsApi();

        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();

        // Create a dummy div for PlacesService (it requires a map or div)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing city autocomplete:", error);
        setIsLoading(false);
      }
    };

    void initServices();
  }, []);

  // Sync inputValue with value prop when it changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Get predictions from Google Maps
  useEffect(() => {
    if (!inputValue || inputValue.length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);

      void autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: inputValue,
          types: ["(cities)"],
        },
        (results, status) => {
          setIsSearching(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results as Prediction[]);
            setShowDropdown(true);
            setSelectedIndex(-1);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePredictionSelect = (prediction: Prediction) => {
    // Get place details to extract proper city name
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["address_components", "name"],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const cityComponent = place.address_components?.find(
              (component) =>
                component.types.includes("locality") ||
                component.types.includes("administrative_area_level_3"),
            );

            const cityName = cityComponent?.long_name ?? place.name ?? prediction.structured_formatting.main_text;
            const formattedCity = formatCityName(cityName);

            setInputValue(formattedCity);
            onChange(formattedCity);
            setShowDropdown(false);
            setPredictions([]);
          }
        }
      );
    } else {
      // Fallback if PlacesService is not available
      const formattedCity = formatCityName(prediction.structured_formatting.main_text);
      setInputValue(formattedCity);
      onChange(formattedCity);
      setShowDropdown(false);
      setPredictions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handlePredictionSelect(predictions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setPredictions([]);
        break;
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) {
            setShowDropdown(true);
          }
        }}
        placeholder={isLoading ? "Cargando..." : placeholder}
        disabled={isLoading}
        className={className}
      />

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[100000] mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {isSearching && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          {!isSearching && predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              onClick={() => handlePredictionSelect(prediction)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                "hover:bg-gray-50",
                selectedIndex === index && "bg-gray-50"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
