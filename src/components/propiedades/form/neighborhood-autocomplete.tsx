"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { searchNeighborhoods } from "~/server/queries/locations";

export interface NeighborhoodResult {
  neighborhoodId: bigint;
  neighborhood: string;
  city: string;
  municipality: string;
  province: string;
}

interface NeighborhoodAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onNeighborhoodSelected?: (data: NeighborhoodResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function NeighborhoodAutocomplete({
  value,
  onChange,
  onNeighborhoodSelected,
  placeholder = "Buscar barrio...",
  className,
  disabled = false,
}: NeighborhoodAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NeighborhoodResult[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search neighborhoods with debounce
  const searchWithDebounce = useCallback((query: string) => {
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search for very short queries
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setIsLoading(true);

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const searchResults = await searchNeighborhoods(query, 10);
          setResults(searchResults);
          setOpen(searchResults.length > 0);
        } catch (error) {
          console.error("Error searching neighborhoods:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 300);
  }, []);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchWithDebounce(newValue);
  };

  const handleSelect = (result: NeighborhoodResult) => {
    onChange(result.neighborhood);
    setOpen(false);
    setResults([]);

    if (onNeighborhoodSelected) {
      onNeighborhoodSelected(result);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            type="text"
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder={placeholder}
            className={cn("h-8 text-gray-500", className)}
            onFocus={() => {
              if (value.length >= 2 && results.length > 0) {
                setOpen(true);
              }
            }}
          />
          {isLoading && (
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {results.length === 0 && !isLoading && (
            <div className="p-3 text-sm text-muted-foreground">
              No se encontraron barrios
            </div>
          )}
          {results.map((result) => (
            <button
              key={result.neighborhoodId.toString()}
              type="button"
              onClick={() => handleSelect(result)}
              className="flex w-full items-start gap-1.5 border-b px-2 py-1.5 text-left transition-colors last:border-b-0 hover:bg-accent"
            >
              <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-medium">
                  {result.neighborhood}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {result.city}
                  {result.municipality !== result.city && (
                    <span>, {result.municipality}</span>
                  )}
                  {result.province && <span> ({result.province})</span>}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
