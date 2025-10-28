"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Filter,
  X,
  Check,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon,
  Map as MapIcon,
  User,
  Bed,
  Bath,
  FilterX,
  MapPin,
  DollarSign,
  Ruler,
  Home,
  Tag,
  Key,
  Search,
} from "lucide-react";
import { PropertySearch } from "./property-search";
import { useRouter, useSearchParams } from "next/navigation";
import { TwoLevelLocationSelect } from "~/components/ui/two-level-location-select";
import { searchContactsForFormWithAuth } from "~/server/queries/contact";

interface PropertyFilterProps {
  view: "grid" | "table" | "map";
  agents?: Array<{ id: string; name: string }>;
  cities?: string[];
  priceRange?: { minPrice: number; maxPrice: number };
  areaRange?: { minArea: number; maxArea: number };
}

export function PropertyFilter({
  view,
  agents = [],
  cities = [],
  priceRange = { minPrice: 50000, maxPrice: 1000000 },
  areaRange = { minArea: 20, maxArea: 500 },
}: PropertyFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilters, setPropertyFilters] = useState({
    status: [] as string[],
    type: [] as string[],
    city: "",
    neighborhood: "",
    minBedrooms: undefined as number | undefined,
    minBathrooms: undefined as number | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minSquareMeter: undefined as number | undefined,
    maxSquareMeter: undefined as number | undefined,
    hasKeys: undefined as boolean | undefined,
    publishToWebsite: undefined as boolean | undefined,
  });
  const [agentFilters, setAgentFilters] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [ownerSearchInput, setOwnerSearchInput] = useState(""); // Local state for typing
  const [ownerDisplayName, setOwnerDisplayName] = useState(""); // Separate state for selected owner name
  const [ownerSearchResults, setOwnerSearchResults] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isSearchingOwners, setIsSearchingOwners] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const ownerInputRef = useRef<HTMLInputElement>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    location: false,
    rooms: false,
    price: false,
    area: false,
    status: false,
    type: false,
    other: false,
    owner: false,
  });
  const [priceSliderValues, setPriceSliderValues] = useState<number[]>([
    priceRange.minPrice,
    priceRange.maxPrice,
  ]);
  const [areaSliderValues, setAreaSliderValues] = useState<number[]>([
    areaRange.minArea,
    areaRange.maxArea,
  ]);
  const [isPriceSliderTouched, setIsPriceSliderTouched] = useState(false);
  const [isAreaSliderTouched, setIsAreaSliderTouched] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const agent = searchParams.get("agent");
    const ownerId = searchParams.get("ownerId");
    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const neighborhood = searchParams.get("neighborhood");
    const minBedrooms = searchParams.get("minBedrooms");
    const minBathrooms = searchParams.get("minBathrooms");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minSize = searchParams.get("minSize");
    const maxSize = searchParams.get("maxSize");
    const hasKeys = searchParams.get("hasKeys");
    const publishToWebsite = searchParams.get("publishToWebsite");

    setPropertyFilters({
      // Default to showing 'En Venta' and 'En Alquiler' if no status filter in URL
      status: status ? status.split(",") : ["for-sale", "for-rent"],
      type: type ? type.split(",") : [],
      city: city ?? "",
      neighborhood: neighborhood ?? "",
      minBedrooms: minBedrooms ? parseInt(minBedrooms) : undefined,
      minBathrooms: minBathrooms ? parseInt(minBathrooms) : undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      minSquareMeter: minSize ? parseInt(minSize) : undefined,
      maxSquareMeter: maxSize ? parseInt(maxSize) : undefined,
      hasKeys:
        hasKeys === "true" ? true : hasKeys === "false" ? false : undefined,
      publishToWebsite:
        publishToWebsite === "true"
          ? true
          : publishToWebsite === "false"
            ? false
            : undefined,
    });
    setAgentFilters(agent ? agent.split(",") : []);
    setOwnerFilter(ownerId ?? null);
    setSearchQuery(q ?? "");

    // Update slider values if they're in the URL
    if (minPrice || maxPrice) {
      setPriceSliderValues([
        minPrice ? parseInt(minPrice) : priceRange.minPrice,
        maxPrice ? parseInt(maxPrice) : priceRange.maxPrice,
      ]);
      setIsPriceSliderTouched(true);
    }
    if (minSize || maxSize) {
      setAreaSliderValues([
        minSize ? parseInt(minSize) : areaRange.minArea,
        maxSize ? parseInt(maxSize) : areaRange.maxArea,
      ]);
      setIsAreaSliderTouched(true);
    }
  }, [searchParams, priceRange, areaRange]);

  // Search owner contacts on button click
  const performOwnerSearch = async (searchValue?: string) => {
    const valueToSearch = searchValue ?? ownerSearchInput;

    if (!valueToSearch.trim()) {
      setOwnerSearchResults([]);
      setShowOwnerDropdown(false);
      return;
    }

    try {
      setIsSearchingOwners(true);
      const results = await searchContactsForFormWithAuth(valueToSearch, 6);
      setOwnerSearchResults(
        results.map((contact) => ({
          id: contact.id.toString(),
          name: contact.name,
        })),
      );
      setShowOwnerDropdown(results.length > 0);
    } catch (error) {
      console.error("Error searching owner contacts:", error);
      setOwnerSearchResults([]);
      setShowOwnerDropdown(false);
    } finally {
      setIsSearchingOwners(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".owner-search-container")) {
        setShowOwnerDropdown(false);
      }
    };

    if (showOwnerDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOwnerDropdown]);

  const updateUrlParams = (
    newPropertyFilters: typeof propertyFilters,
    newAgentFilters: string[],
    newOwnerFilter: string | null,
    newSearchQuery: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update search query
    if (newSearchQuery) {
      params.set("q", newSearchQuery);
    } else {
      params.delete("q");
    }

    // Update status
    if (newPropertyFilters.status.length > 0) {
      params.set("status", newPropertyFilters.status.join(","));
    } else {
      params.delete("status");
    }

    // Update type
    if (newPropertyFilters.type.length > 0) {
      params.set("type", newPropertyFilters.type.join(","));
    } else {
      params.delete("type");
    }

    // Update agent
    if (newAgentFilters.length > 0) {
      params.set("agent", newAgentFilters.join(","));
    } else {
      params.delete("agent");
    }

    // Update owner ID filter
    if (newOwnerFilter) {
      params.set("ownerId", newOwnerFilter);
    } else {
      params.delete("ownerId");
    }

    // Update city
    if (newPropertyFilters.city) {
      params.set("city", newPropertyFilters.city);
    } else {
      params.delete("city");
    }

    // Update neighborhood
    if (newPropertyFilters.neighborhood) {
      params.set("neighborhood", newPropertyFilters.neighborhood);
    } else {
      params.delete("neighborhood");
    }

    // Update bedrooms
    if (newPropertyFilters.minBedrooms !== undefined) {
      params.set("minBedrooms", newPropertyFilters.minBedrooms.toString());
    } else {
      params.delete("minBedrooms");
    }

    // Update bathrooms
    if (newPropertyFilters.minBathrooms !== undefined) {
      params.set("minBathrooms", newPropertyFilters.minBathrooms.toString());
    } else {
      params.delete("minBathrooms");
    }

    // Update price range (only if slider was touched)
    if (newPropertyFilters.minPrice !== undefined && isPriceSliderTouched) {
      params.set("minPrice", newPropertyFilters.minPrice.toString());
    } else {
      params.delete("minPrice");
    }
    if (newPropertyFilters.maxPrice !== undefined && isPriceSliderTouched) {
      params.set("maxPrice", newPropertyFilters.maxPrice.toString());
    } else {
      params.delete("maxPrice");
    }

    // Update area range (only if slider was touched)
    if (
      newPropertyFilters.minSquareMeter !== undefined &&
      isAreaSliderTouched
    ) {
      params.set("minSize", newPropertyFilters.minSquareMeter.toString());
    } else {
      params.delete("minSize");
    }
    if (
      newPropertyFilters.maxSquareMeter !== undefined &&
      isAreaSliderTouched
    ) {
      params.set("maxSize", newPropertyFilters.maxSquareMeter.toString());
    } else {
      params.delete("maxSize");
    }

    // Update boolean filters
    if (newPropertyFilters.hasKeys !== undefined) {
      params.set("hasKeys", newPropertyFilters.hasKeys.toString());
    } else {
      params.delete("hasKeys");
    }
    if (newPropertyFilters.publishToWebsite !== undefined) {
      params.set(
        "publishToWebsite",
        newPropertyFilters.publishToWebsite.toString(),
      );
    } else {
      params.delete("publishToWebsite");
    }

    // Reset to first page when filters change
    params.set("page", "1");

    router.push(`/propiedades?${params.toString()}`);
  };

  const togglePropertyFilter = (category: "status" | "type", value: string) => {
    const currentValues = propertyFilters[category];
    const newFilters = {
      ...propertyFilters,
      [category]: currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value],
    };
    setPropertyFilters(newFilters);
    updateUrlParams(newFilters, agentFilters, ownerFilter, searchQuery);
  };

  const toggleAgentFilter = (value: string) => {
    const newFilters = agentFilters.includes(value)
      ? agentFilters.filter((v) => v !== value)
      : [...agentFilters, value];
    setAgentFilters(newFilters);
    updateUrlParams(propertyFilters, newFilters, ownerFilter, searchQuery);
  };

  // Handle selecting an owner from dropdown
  const handleSelectOwner = (ownerId: string, ownerName: string) => {
    setOwnerFilter(ownerId);
    setOwnerDisplayName(ownerName);
    setOwnerSearchInput(ownerName);
    updateUrlParams(propertyFilters, agentFilters, ownerId, searchQuery);
    setShowOwnerDropdown(false);
    setOwnerSearchResults([]);
  };

  // Clear owner filter
  const clearOwnerFilter = () => {
    setOwnerFilter(null);
    setOwnerDisplayName("");
    setOwnerSearchInput("");
    if (ownerInputRef.current) {
      ownerInputRef.current.value = ""; // Clear the uncontrolled input
    }
    setOwnerSearchResults([]);
    updateUrlParams(propertyFilters, agentFilters, null, searchQuery);
  };

  const toggleBooleanFilter = (key: "hasKeys" | "publishToWebsite") => {
    const currentValue = propertyFilters[key];
    const newFilters = {
      ...propertyFilters,
      [key]:
        currentValue === undefined
          ? true
          : currentValue === true
            ? false
            : undefined,
    };
    setPropertyFilters(newFilters);
    updateUrlParams(newFilters, agentFilters, ownerFilter, searchQuery);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const updateLocationFilter = (city: string, neighborhood: string) => {
    const newFilters = {
      ...propertyFilters,
      city,
      neighborhood,
    };
    setPropertyFilters(newFilters);
    updateUrlParams(newFilters, agentFilters, ownerFilter, searchQuery);
  };

  const updateSelectFilter = (
    key: "minBedrooms" | "minBathrooms",
    value: string,
  ) => {
    const newFilters = {
      ...propertyFilters,
      [key]: value === "" ? undefined : parseInt(value),
    };
    setPropertyFilters(newFilters);
    updateUrlParams(newFilters, agentFilters, ownerFilter, searchQuery);
  };

  const handlePriceSliderChange = (values: number[]) => {
    setPriceSliderValues(values);
    setIsPriceSliderTouched(true);
    const newFilters = {
      ...propertyFilters,
      minPrice: values[0],
      maxPrice: values[1],
    };
    setPropertyFilters(newFilters);
  };

  const handleAreaSliderChange = (values: number[]) => {
    setAreaSliderValues(values);
    setIsAreaSliderTouched(true);
    const newFilters = {
      ...propertyFilters,
      minSquareMeter: values[0],
      maxSquareMeter: values[1],
    };
    setPropertyFilters(newFilters);
  };

  const applySliderFilters = () => {
    updateUrlParams(propertyFilters, agentFilters, ownerFilter, searchQuery);
  };

  const clearPropertyFilters = () => {
    const newFilters = {
      status: [],
      type: [],
      city: "",
      neighborhood: "",
      minBedrooms: undefined,
      minBathrooms: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minSquareMeter: undefined,
      maxSquareMeter: undefined,
      hasKeys: undefined,
      publishToWebsite: undefined,
    };
    setPropertyFilters(newFilters);
    setPriceSliderValues([priceRange.minPrice, priceRange.maxPrice]);
    setAreaSliderValues([areaRange.minArea, areaRange.maxArea]);
    setIsPriceSliderTouched(false);
    setIsAreaSliderTouched(false);
    setOwnerFilter(null);
    setOwnerSearchInput("");
    setOwnerSearchResults([]);
    updateUrlParams(newFilters, agentFilters, null, searchQuery);
  };

  const clearAgentFilters = () => {
    setAgentFilters([]);
    updateUrlParams(propertyFilters, [], ownerFilter, searchQuery);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateUrlParams(propertyFilters, agentFilters, ownerFilter, value);
  };

  // Check if current filters are the default ones
  const isDefaultStatusFilter =
    propertyFilters.status.length === 2 &&
    propertyFilters.status.includes("for-sale") &&
    propertyFilters.status.includes("for-rent") &&
    propertyFilters.type.length === 0;

  // Only count as active filters if they differ from defaults
  const activePropertyFiltersCount =
    (isDefaultStatusFilter
      ? 0
      : propertyFilters.status.length + propertyFilters.type.length) +
    (propertyFilters.city ? 1 : 0) +
    (propertyFilters.neighborhood ? 1 : 0) +
    (propertyFilters.minBedrooms !== undefined ? 1 : 0) +
    (propertyFilters.minBathrooms !== undefined ? 1 : 0) +
    (isPriceSliderTouched ? 1 : 0) +
    (isAreaSliderTouched ? 1 : 0) +
    (propertyFilters.hasKeys !== undefined ? 1 : 0) +
    (propertyFilters.publishToWebsite !== undefined ? 1 : 0);

  const FilterOption = ({
    value,
    label,
    category,
    isAgent = false,
  }: {
    value: string;
    label: string;
    category?: "status" | "type";
    isAgent?: boolean;
  }) => {
    const isSelected = isAgent
      ? agentFilters.includes(value)
      : category
        ? propertyFilters[category].includes(value)
        : false;

    return (
      <div
        className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
        onClick={() =>
          isAgent
            ? toggleAgentFilter(value)
            : category
              ? togglePropertyFilter(category, value)
              : undefined
        }
      >
        <div
          className={`flex h-3 w-3 items-center justify-center rounded border ${
            isSelected ? "border-primary bg-primary" : "border-input"
          }`}
        >
          {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
        </div>
        <span className={`text-[12px] ${isSelected ? "font-medium" : ""}`}>
          {label}
        </span>
      </div>
    );
  };

  const FilterCategory = ({
    title,
    category,
    icon: Icon,
    children,
  }: {
    title: string;
    category: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1">
      <div
        className="group flex cursor-pointer items-center gap-1"
        onClick={() => toggleCategory(category)}
      >
        <Icon className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-foreground" />
        <h5 className="text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {title}
        </h5>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${
            expandedCategories[category] ? "rotate-180" : ""
          }`}
        />
      </div>
      {expandedCategories[category] && (
        <div className="space-y-0.5">{children}</div>
      )}
    </div>
  );

  const handleViewChange = (newView: "grid" | "table" | "map") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <PropertySearch
            onSearchChange={handleSearchChange}
            onSearch={() =>
              updateUrlParams(
                propertyFilters,
                agentFilters,
                ownerFilter,
                searchQuery,
              )
            }
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="relative h-8 w-8 p-0"
              >
                <User className="h-3.5 w-3.5" />
                {agentFilters.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
                  >
                    {agentFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="flex flex-col">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3 p-3">
                    <div className="space-y-0.5">
                      {agents.map((agent) => (
                        <FilterOption
                          key={agent.id.toString()}
                          value={agent.id.toString()}
                          label={agent.name}
                          isAgent={true}
                        />
                      ))}
                    </div>
                  </div>
                </ScrollArea>
                {agentFilters.length > 0 && (
                  <div className="border-t p-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAgentFilters}
                      className="h-6 w-full text-[12px]"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Borrar
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-0.5 rounded-md bg-white p-0.5 shadow">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("grid")}
              title="Cuadrícula"
              className="h-7 w-7 p-0"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("table")}
              title="Tabla"
              className="h-7 w-7 p-0"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "map" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("map")}
              title="Mapa"
              className="h-7 w-7 p-0"
            >
              <MapIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="relative h-8 text-xs"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {activePropertyFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 rounded-full px-1 text-[12px] font-normal"
              >
                {activePropertyFiltersCount}
              </Badge>
            )}
            <ChevronDown
              className={`ml-1 h-3 w-3 transition-transform ${
                isFiltersOpen ? "rotate-180 transform" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-lg bg-card p-2 shadow-md">
            <div className="space-y-2">
              {/* Row 1: Location, Rooms, Price, Area */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FilterCategory
                  title="Ubicación"
                  category="location"
                  icon={MapPin}
                >
                  <div className="pt-1">
                    <TwoLevelLocationSelect
                      cities={cities}
                      selectedCity={propertyFilters.city}
                      selectedNeighborhood={propertyFilters.neighborhood}
                      onCityChange={(city) => updateLocationFilter(city, "")}
                      onNeighborhoodChange={(neighborhood) =>
                        updateLocationFilter(propertyFilters.city, neighborhood)
                      }
                      cityPlaceholder="Ciudad"
                      neighborhoodPlaceholder="Barrio"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Habitaciones y Baños"
                  category="rooms"
                  icon={Bed}
                >
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Select
                      value={propertyFilters.minBedrooms?.toString() ?? "any"}
                      onValueChange={(value) =>
                        updateSelectFilter(
                          "minBedrooms",
                          value === "any" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        id="bedrooms"
                        className="h-8 text-xs"
                        isPlaceholder={
                          propertyFilters.minBedrooms === undefined
                        }
                      >
                        <SelectValue placeholder="Hab." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="1">
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            <span>1+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            <span>2+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            <span>3+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            <span>4+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-3 w-3" />
                            <span>5+</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={propertyFilters.minBathrooms?.toString() ?? "any"}
                      onValueChange={(value) =>
                        updateSelectFilter(
                          "minBathrooms",
                          value === "any" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        id="bathrooms"
                        className="h-8 text-xs"
                        isPlaceholder={
                          propertyFilters.minBathrooms === undefined
                        }
                      >
                        <SelectValue placeholder="Baños" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Cualquiera</SelectItem>
                        <SelectItem value="1">
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-3 w-3" />
                            <span>1+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-3 w-3" />
                            <span>2+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-3 w-3" />
                            <span>3+</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="4">
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-3 w-3" />
                            <span>4+</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Precio"
                  category="price"
                  icon={DollarSign}
                >
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      placeholder="Min"
                      defaultValue={
                        isPriceSliderTouched ? priceSliderValues[0] : undefined
                      }
                      onBlur={(e) => {
                        const val =
                          e.target.value === ""
                            ? priceRange.minPrice
                            : parseInt(e.target.value);
                        handlePriceSliderChange([
                          val,
                          priceSliderValues[1] ?? priceRange.maxPrice,
                        ]);
                        applySliderFilters();
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-[12px] text-muted-foreground">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      defaultValue={
                        isPriceSliderTouched ? priceSliderValues[1] : undefined
                      }
                      onBlur={(e) => {
                        const val =
                          e.target.value === ""
                            ? priceRange.maxPrice
                            : parseInt(e.target.value);
                        handlePriceSliderChange([
                          priceSliderValues[0] ?? priceRange.minPrice,
                          val,
                        ]);
                        applySliderFilters();
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Superficie (m²)"
                  category="area"
                  icon={Ruler}
                >
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      placeholder="Min"
                      defaultValue={
                        isAreaSliderTouched ? areaSliderValues[0] : undefined
                      }
                      onBlur={(e) => {
                        const val =
                          e.target.value === ""
                            ? areaRange.minArea
                            : parseInt(e.target.value);
                        handleAreaSliderChange([
                          val,
                          areaSliderValues[1] ?? areaRange.maxArea,
                        ]);
                        applySliderFilters();
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <span className="text-[12px] text-muted-foreground">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      defaultValue={
                        isAreaSliderTouched ? areaSliderValues[1] : undefined
                      }
                      onBlur={(e) => {
                        const val =
                          e.target.value === ""
                            ? areaRange.maxArea
                            : parseInt(e.target.value);
                        handleAreaSliderChange([
                          areaSliderValues[0] ?? areaRange.minArea,
                          val,
                        ]);
                        applySliderFilters();
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </FilterCategory>
              </div>

              {/* Separator */}
              <div className="border-t" />

              {/* Row 2: Status, Type, Other & Clear Button */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FilterCategory title="Estado" category="status" icon={Tag}>
                  <div className="grid grid-cols-2 gap-x-2">
                    <FilterOption
                      value="for-sale"
                      label="En Venta"
                      category="status"
                    />
                    <FilterOption
                      value="for-rent"
                      label="En Alquiler"
                      category="status"
                    />
                    <FilterOption
                      value="sold"
                      label="Vendido"
                      category="status"
                    />
                    <FilterOption
                      value="rented"
                      label="Alquilado"
                      category="status"
                    />
                    <FilterOption
                      value="discarded"
                      label="Descartado"
                      category="status"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory title="Tipo" category="type" icon={Home}>
                  <div className="grid grid-cols-2 gap-x-2">
                    <FilterOption value="piso" label="Piso" category="type" />
                    <FilterOption value="casa" label="Casa" category="type" />
                    <FilterOption value="local" label="Local" category="type" />
                    <FilterOption value="solar" label="Solar" category="type" />
                    <FilterOption
                      value="garaje"
                      label="Garaje"
                      category="type"
                    />
                  </div>
                </FilterCategory>

                <FilterCategory title="Otros" category="other" icon={Key}>
                  <div className="grid grid-cols-1 gap-y-0.5">
                    <div
                      className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                      onClick={() => toggleBooleanFilter("hasKeys")}
                    >
                      <div
                        className={`flex h-3 w-3 items-center justify-center rounded border ${
                          propertyFilters.hasKeys === true
                            ? "border-primary bg-primary"
                            : "border-input"
                        }`}
                      >
                        {propertyFilters.hasKeys === true && (
                          <Check className="h-2 w-2 text-primary-foreground" />
                        )}
                      </div>
                      <span
                        className={`text-[12px] ${propertyFilters.hasKeys === true ? "font-medium" : ""}`}
                      >
                        Con llaves
                      </span>
                    </div>
                    <div
                      className="flex cursor-pointer items-center space-x-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-accent"
                      onClick={() => toggleBooleanFilter("publishToWebsite")}
                    >
                      <div
                        className={`flex h-3 w-3 items-center justify-center rounded border ${
                          propertyFilters.publishToWebsite === true
                            ? "border-primary bg-primary"
                            : "border-input"
                        }`}
                      >
                        {propertyFilters.publishToWebsite === true && (
                          <Check className="h-2 w-2 text-primary-foreground" />
                        )}
                      </div>
                      <span
                        className={`text-[12px] ${propertyFilters.publishToWebsite === true ? "font-medium" : ""}`}
                      >
                        Visible en web
                      </span>
                    </div>
                  </div>
                </FilterCategory>

                <FilterCategory
                  title="Propietario"
                  category="owner"
                  icon={User}
                >
                  <div className="owner-search-container relative pt-1">
                    <div className="flex items-center gap-1">
                      <input
                        ref={ownerInputRef}
                        type="text"
                        placeholder="Buscar propietario..."
                        key={ownerFilter ?? "no-owner"} // Force re-mount when owner changes
                        defaultValue={ownerSearchInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const target = e.target as HTMLInputElement;
                            const searchValue = target.value;
                            setOwnerSearchInput(searchValue);
                            void performOwnerSearch(searchValue);
                          }
                        }}
                        className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-[12px] placeholder:text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={() => {
                          if (ownerInputRef.current) {
                            const searchValue = ownerInputRef.current.value;
                            setOwnerSearchInput(searchValue);
                            void performOwnerSearch(searchValue);
                          }
                        }}
                        disabled={isSearchingOwners}
                        className="flex h-8 items-center justify-center rounded-md bg-primary px-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        title="Buscar"
                      >
                        <Search className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Dropdown with search results */}
                    {showOwnerDropdown && (
                      <div className="absolute left-0 right-0 z-50 mt-1 rounded-md border border-input bg-background shadow-lg">
                        <ScrollArea className="max-h-[200px]">
                          {isSearchingOwners ? (
                            <div className="py-3 text-center text-[12px] text-muted-foreground">
                              Buscando contactos...
                            </div>
                          ) : ownerSearchResults.length === 0 ? (
                            <div className="py-3 text-center text-[12px] text-muted-foreground">
                              No se encontraron contactos
                            </div>
                          ) : (
                            <div className="p-1">
                              {ownerSearchResults.map((owner) => (
                                <button
                                  key={owner.id}
                                  onClick={() =>
                                    handleSelectOwner(owner.id, owner.name)
                                  }
                                  className="w-full rounded px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-accent"
                                >
                                  {owner.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    )}

                    {ownerFilter && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          Filtrado por:
                        </span>
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {ownerDisplayName}
                          <button
                            onClick={clearOwnerFilter}
                            className="ml-1 rounded-full hover:bg-accent"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      </div>
                    )}
                  </div>
                </FilterCategory>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activePropertyFiltersCount > 0 && (
            <div className="flex items-center justify-end px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearPropertyFilters}
                className="h-auto px-2 py-1 text-[12px]"
              >
                <FilterX className="mr-1 h-3 w-3" />
                Borrar filtros
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
