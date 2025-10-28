import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useState, useEffect } from "react";
import { X, Save, Check, Loader2, Trash2 } from "lucide-react";
import { Textarea } from "~/components/ui/textarea";
import { Slider } from "~/components/ui/slider";
import { Separator } from "~/components/ui/separator";
import { motion } from "framer-motion";
import { RoomSelector } from "~/components/crear/pages/elements/room_selector";
import {
  createProspectWithAuth,
  updateProspectWithAuth,
  deleteProspectWithAuth,
  type CreateProspectInput,
  type UpdateProspectInput,
} from "~/server/queries/prospect";
import { toast } from "sonner";
import { CityAutocomplete } from "./city-autocomplete";
import { formatCityName } from "~/lib/city-name-formatter";
import { fetchNeighborhoodsByCity } from "~/lib/nominatim-service";

export interface InterestFormData {
  id: string;
  demandType: string;
  maxPrice: number;
  preferredArea: string;
  selectedCities: string[];
  selectedNeighborhoods: Array<{
    neighborhood: string;
    city: string;
    municipality: string;
    province: string;
  }>;
  propertyTypes: string[];
  minBedrooms: number;
  minBathrooms: number;
  minSquareMeters: number;
  urgencyLevel: number;
  fundingReady: boolean;
  moveInBy: string;
  extras: Record<string, boolean>;
  notes: string;
}

interface ContactInterestFormProps {
  data: InterestFormData;
  onUpdate: (data: InterestFormData) => void;
  onRemove?: () => void;
  isRemovable?: boolean;
  index: number;
  contactId: bigint;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export function ContactInterestForm({
  data,
  onUpdate,
  onRemove,
  isRemovable = false,
  index: _index,
  contactId,
  onSaved,
  onDeleted,
}: ContactInterestFormProps) {
  const [localData, setLocalData] = useState<InterestFormData>(data);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [characteristicsSearch, setCharacteristicsSearch] = useState("");

  // Location selection states
  const [selectedCity, setSelectedCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState<
    Array<{
      neighborhood: string;
      city: string;
      municipality: string;
      province: string;
    }>
  >([]);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Initialize selectedNeighborhoods and selectedCities if not present
  useEffect(() => {
    if (!localData.selectedNeighborhoods || !localData.selectedCities) {
      setLocalData({
        ...localData,
        selectedNeighborhoods: localData.selectedNeighborhoods ?? [],
        selectedCities: localData.selectedCities ?? [],
      });
    }
  }, [localData]);

  // Load neighborhoods when city changes with debouncing to prevent API spam
  useEffect(() => {
    if (selectedCity) {
      setLoadingNeighborhoods(true);

      // Debounce the API call to avoid rate limiting
      const timeoutId = setTimeout(() => {
        const loadNeighborhoods = async () => {
          try {
            const neighborhoodsList = await fetchNeighborhoodsByCity(selectedCity, "es");
            setNeighborhoods(neighborhoodsList);
          } catch (error) {
            console.error("Error loading neighborhoods:", error);
            setNeighborhoods([]);
            toast.error("Error al cargar los barrios. Por favor, espera unos segundos e intenta de nuevo.");
          } finally {
            setLoadingNeighborhoods(false);
          }
        };
        void loadNeighborhoods();
      }, 1000); // Wait 1 second after user stops typing

      return () => {
        clearTimeout(timeoutId);
        setLoadingNeighborhoods(false);
      };
    } else {
      setNeighborhoods([]);
      setLoadingNeighborhoods(false);
    }
  }, [selectedCity]);

  // Filter neighborhoods based on search
  const filteredNeighborhoods = neighborhoods.filter(
    (neighborhood) =>
      neighborhood.neighborhood
        .toLowerCase()
        .includes(neighborhoodSearch.toLowerCase()) ||
      neighborhood.municipality
        .toLowerCase()
        .includes(neighborhoodSearch.toLowerCase()),
  );

  const updateLocalData = (updates: Partial<InterestFormData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onUpdate(newData);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // Convert selectedNeighborhoods to preferredAreas format (just neighborhood names)
      const preferredAreas =
        localData.selectedNeighborhoods?.map((neighborhood) => ({
          name: neighborhood.neighborhood,
        })) || [];

      const prospectData: CreateProspectInput = {
        contactId: contactId,
        status: "active",
        prospectType: "search", // Traditional buyer/renter prospect
        listingType: localData.demandType || undefined,
        propertyType: localData.propertyTypes[0] ?? "",
        maxPrice: localData.maxPrice.toString(),
        preferredCities: localData.selectedCities ?? [],
        preferredAreas: preferredAreas,
        minBedrooms: localData.minBedrooms ?? 0,
        minBathrooms: localData.minBathrooms ?? 0,
        minSquareMeters: localData.minSquareMeters ?? 0,
        moveInBy: localData.moveInBy ? new Date(localData.moveInBy) : undefined,
        extras: localData.extras ?? {},
        urgencyLevel: localData.urgencyLevel ?? 3,
        fundingReady: localData.fundingReady ?? false,
        notesInternal: localData.notes ?? "",
      };

      // Check if this is an existing prospect (ID starts with "prospect-")
      if (localData.id.startsWith("prospect-")) {
        const prospectId = localData.id.replace("prospect-", "");
        await updateProspectWithAuth(
          BigInt(prospectId),
          prospectData as UpdateProspectInput,
        );
      } else {
        await createProspectWithAuth(prospectData);
      }

      setSaveStatus("saved");
      toast.success("Solicitud guardada exitosamente");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);

      if (onSaved) {
        void onSaved();
      }
    } catch (error) {
      console.error("Error saving prospect:", error);
      setSaveStatus("error");
      toast.error("Error al guardar la solicitud");

      // Reset to idle after 3 seconds on error
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };

  const handleDelete = async () => {
    if (!localData.id.startsWith("prospect-")) {
      // If it's a new form, just remove it
      if (onRemove) {
        onRemove();
      }
      return;
    }

    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const prospectId = localData.id.replace("prospect-", "");
      await deleteProspectWithAuth(BigInt(prospectId));
      toast.success("Solicitud eliminada exitosamente");
      setShowDeleteDialog(false);

      if (onDeleted) {
        void onDeleted();
      }
    } catch (error) {
      console.error("Error deleting prospect:", error);
      toast.error("Error al eliminar la solicitud");
    }
  };

  return (
    <Card className="border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Transaction Details */}
        <Card className="border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de operación</Label>
              <div className="relative h-10 rounded-lg bg-gray-100 p-1">
                <motion.div
                  className="absolute left-1 top-1 h-8 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
                  animate={{
                    x: localData.demandType === "Sale" ? 0 : "calc(100% - 5px)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div className="relative flex h-full">
                  <button
                    onClick={() => {
                      // Always set default sale price when switching to Compra
                      updateLocalData({
                        demandType: "Sale",
                        maxPrice: 200000
                      });
                    }}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.demandType === "Sale"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Compra
                  </button>
                  <button
                    onClick={() => {
                      // Always set default rent price when switching to Alquiler
                      updateLocalData({
                        demandType: "Rent",
                        maxPrice: 500
                      });
                    }}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.demandType === "Rent"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Alquiler
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Precio máximo (€)</Label>
              <div className="space-y-4">
                {(() => {
                  const propertyType = localData.propertyTypes[0] ?? "";
                  const isPisoOrCasa =
                    propertyType === "piso" || propertyType === "casa";
                  const isRent = localData.demandType === "Rent";

                  // Set different limits based on operation type (sale vs rent)
                  let minLimit, maxLimit, step, defaultValue, placeholder;

                  if (isRent) {
                    // Rental properties: much lower price range
                    minLimit = 300;
                    maxLimit = 5000;
                    step = 50;
                    defaultValue = 500;
                    placeholder = "€500";
                  } else {
                    // Sale properties: original logic
                    minLimit = isPisoOrCasa ? 50000 : 0;
                    maxLimit = isPisoOrCasa ? 2500000 : 2000000;
                    step = 10000;
                    defaultValue = 200000;
                    placeholder = "€200.000";
                  }

                  return (
                    <>
                      <div className="relative">
                        <Slider
                          value={[localData.maxPrice]}
                          onValueChange={(value) => {
                            const newMaxPrice = value[0] ?? defaultValue;
                            updateLocalData({ maxPrice: newMaxPrice });
                          }}
                          max={maxLimit}
                          min={minLimit}
                          step={step}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-center">
                        <div className="w-32">
                          <Input
                            type="text"
                            value={`${localData.maxPrice.toLocaleString("es-ES")}${isRent ? "/mes" : ""}`}
                            onChange={(e) => {
                              const value =
                                parseInt(e.target.value.replace(/\D/g, "")) ??
                                defaultValue;
                              updateLocalData({ maxPrice: value });
                            }}
                            className="h-8 text-center text-sm"
                            placeholder={`${placeholder}${isRent ? "/mes" : ""}`}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Card>

        {/* Property Requirements */}
        <Card className="border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de propiedad</Label>
              <div className="relative h-10 rounded-lg bg-gray-100 p-1">
                <motion.div
                  className="absolute left-1 top-1 h-8 w-[calc(20%-2px)] rounded-md bg-white shadow-sm"
                  animate={{
                    x:
                      localData.propertyTypes[0] === "piso"
                        ? 0
                        : localData.propertyTypes[0] === "casa"
                          ? "100%"
                          : localData.propertyTypes[0] === "local"
                            ? "200%"
                            : localData.propertyTypes[0] === "solar"
                              ? "300%"
                              : "400%",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div className="relative flex h-full">
                  <button
                    onClick={() => updateLocalData({ propertyTypes: ["piso"] })}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.propertyTypes[0] === "piso"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Piso
                  </button>
                  <button
                    onClick={() => updateLocalData({ propertyTypes: ["casa"] })}
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.propertyTypes[0] === "casa"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Casa
                  </button>
                  <button
                    onClick={() =>
                      updateLocalData({ propertyTypes: ["local"] })
                    }
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.propertyTypes[0] === "local"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Local
                  </button>
                  <button
                    onClick={() =>
                      updateLocalData({ propertyTypes: ["solar"] })
                    }
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.propertyTypes[0] === "solar"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Solar
                  </button>
                  <button
                    onClick={() =>
                      updateLocalData({ propertyTypes: ["garaje"] })
                    }
                    className={cn(
                      "relative z-10 flex-1 rounded-md text-sm font-medium transition-colors duration-200",
                      localData.propertyTypes[0] === "garaje"
                        ? "text-gray-900"
                        : "text-gray-600",
                    )}
                  >
                    Garaje
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const propertyType = localData.propertyTypes[0] ?? "";
              const shouldShowRooms =
                propertyType !== "garaje" &&
                propertyType !== "solar";

              if (shouldShowRooms) {
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <RoomSelector
                      type="bedrooms"
                      value={localData.minBedrooms}
                      onChange={(value) =>
                        updateLocalData({ minBedrooms: value })
                      }
                      label="Habitaciones mínimas"
                      max={6}
                    />

                    <RoomSelector
                      type="bathrooms"
                      value={localData.minBathrooms}
                      onChange={(value) =>
                        updateLocalData({ minBathrooms: value })
                      }
                      label="Baños mínimos"
                      max={4}
                    />
                  </div>
                );
              }
              return null;
            })()}

            {/* Square Meters Minimum */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Metros cuadrados mínimos (m²)
              </Label>
              <div className="space-y-4">
                <div className="relative">
                  <Slider
                    value={[localData.minSquareMeters ?? 80]}
                    onValueChange={(value) => {
                      const newMinSquareMeters = value[0] ?? 80;
                      updateLocalData({ minSquareMeters: newMinSquareMeters });
                    }}
                    max={500}
                    min={20}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-center">
                  <div className="w-24">
                    <Input
                      type="text"
                      value={localData.minSquareMeters ?? 80}
                      onChange={(e) => {
                        const value =
                          parseInt(e.target.value.replace(/\D/g, "")) ?? 80;
                        updateLocalData({ minSquareMeters: value });
                      }}
                      className="h-8 text-center text-sm"
                      placeholder="80m²"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Location & Timeline */}
        <Card className="border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Zonas preferidas</Label>

              {/* City Selection */}
              <div className="space-y-2">
                <CityAutocomplete
                  value={selectedCity}
                  onChange={(city) => {
                    // This now only fires when user selects from Google dropdown
                    setNeighborhoodSearch("");

                    // Auto-add city to selectedCities if not empty and not already added
                    if (city?.trim()) {
                      const formattedCity = formatCityName(city);
                      const alreadyAdded = localData.selectedCities?.some(
                        (c) => c.toLowerCase() === formattedCity.toLowerCase()
                      );

                      if (!alreadyAdded) {
                        updateLocalData({
                          selectedCities: [...(localData.selectedCities ?? []), formattedCity],
                        });
                      }

                      // Set selectedCity for neighborhood loading
                      setSelectedCity(city);
                    }
                  }}
                  placeholder="Buscar ciudad..."
                  className="h-9 text-gray-500"
                />

                {/* Display selected cities */}
                {localData.selectedCities && localData.selectedCities.length > 0 && (
                  <div className="space-y-1">
                    {localData.selectedCities.map((city) => (
                      <div
                        key={city}
                        className="flex items-center justify-between rounded-md bg-blue-50 px-2 py-1"
                      >
                        <span className="text-sm font-medium text-blue-900">
                          {city} (toda la ciudad)
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            const updatedCities = localData.selectedCities?.filter(
                              (c) => c !== city,
                            ) ?? [];
                            updateLocalData({
                              selectedCities: updatedCities,
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Neighborhood Selection */}
                {selectedCity && (
                  <div className="space-y-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const neighborhood = neighborhoods.find(
                          (n) => n.neighborhood === value,
                        );
                        if (
                          neighborhood &&
                          !localData.selectedNeighborhoods?.some(
                            (n) =>
                              n.neighborhood === neighborhood.neighborhood &&
                              n.city === selectedCity,
                          )
                        ) {
                          const newNeighborhood = {
                            ...neighborhood,
                            city: selectedCity,
                          };
                          updateLocalData({
                            selectedNeighborhoods: [
                              ...(localData.selectedNeighborhoods || []),
                              newNeighborhood,
                            ],
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-gray-500" disabled={loadingNeighborhoods}>
                        <SelectValue placeholder={loadingNeighborhoods ? "Cargando barrios..." : "Añadir barrio"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingNeighborhoods ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">Cargando barrios...</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center px-3 pb-2">
                              <input
                                className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Buscar barrio..."
                                value={neighborhoodSearch}
                                onChange={(e) =>
                                  setNeighborhoodSearch(e.target.value)
                                }
                              />
                            </div>
                            <Separator className="mb-2" />
                            {filteredNeighborhoods.length === 0 ? (
                              <div className="py-4 text-center text-sm text-gray-500">
                                No se encontraron barrios
                              </div>
                            ) : (
                              filteredNeighborhoods.map((neighborhood) => (
                          <SelectItem
                            key={neighborhood.neighborhood}
                            value={neighborhood.neighborhood}
                            disabled={localData.selectedNeighborhoods?.some(
                              (n) =>
                                n.neighborhood === neighborhood.neighborhood &&
                                n.city === selectedCity,
                            )}
                          >
                            {neighborhood.neighborhood} (
                            {neighborhood.municipality})
                          </SelectItem>
                              ))
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Display selected neighborhoods */}
                {localData.selectedNeighborhoods &&
                  localData.selectedNeighborhoods.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {localData.selectedNeighborhoods.map((neighborhood) => (
                        <div
                          key={`${neighborhood.neighborhood}-${neighborhood.city}`}
                          className="flex items-center justify-between rounded-md px-2 py-1"
                        >
                          <span className="text-sm">
                            {neighborhood.neighborhood} ({neighborhood.city})
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              const updatedNeighborhoods =
                                localData.selectedNeighborhoods?.filter(
                                  (n) =>
                                    n.neighborhood !== neighborhood.neighborhood ||
                                    n.city !== neighborhood.city,
                                ) || [];
                              updateLocalData({
                                selectedNeighborhoods: updatedNeighborhoods,
                              });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Fecha deseada</Label>
              <Input
                type="date"
                value={localData.moveInBy}
                onChange={(e) => updateLocalData({ moveInBy: e.target.value })}
                className="h-9 text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Nivel de urgencia</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isSelected = localData.urgencyLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateLocalData({ urgencyLevel: level })}
                      className={cn(
                        "h-8 w-8 rounded-full text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                      )}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Sin prisa</span>
                <span className="mr-64">Urgente</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Features & Extras */}
        <Card className="border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Características deseadas
              </Label>

              {/* Search input for characteristics */}
              <Input
                type="text"
                placeholder="Buscar características..."
                value={characteristicsSearch}
                onChange={(e) => setCharacteristicsSearch(e.target.value)}
                className="h-8 text-sm"
              />

              <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                {[
                  // Basic amenities
                  { key: "elevator", label: "Ascensor" },
                  { key: "garaje", label: "Garaje" },
                  { key: "terrace", label: "Terraza" },
                  { key: "pool", label: "Piscina" },
                  { key: "garden", label: "Jardín" },
                  { key: "airConditioning", label: "Aire acondicionado" },
                  { key: "heating", label: "Calefacción" },
                  { key: "furnished", label: "Amueblado" },
                  { key: "storageRoom", label: "Trastero" },
                  { key: "balcony", label: "Balcón" },

                  // Building features
                  { key: "concierge", label: "Portero" },
                  { key: "securityGuard", label: "Vigilante" },
                  { key: "videoIntercom", label: "Videoportero" },
                  { key: "alarm", label: "Alarma" },
                  { key: "securityDoor", label: "Puerta blindada" },
                  { key: "doubleGlazing", label: "Doble acristalamiento" },
                  { key: "disabledAccess", label: "Acceso discapacitados" },

                  // Property condition
                  { key: "brandNew", label: "Nuevo" },
                  { key: "newConstruction", label: "Nueva construcción" },
                  { key: "underConstruction", label: "En construcción" },
                  { key: "needsRenovation", label: "Necesita reforma" },
                  { key: "lastRenovation", label: "Reformado recientemente" },

                  // Kitchen features
                  { key: "openKitchen", label: "Cocina abierta" },
                  { key: "frenchKitchen", label: "Cocina francesa" },
                  { key: "furnishedKitchen", label: "Cocina amueblada" },
                  { key: "pantry", label: "Despensa" },

                  // Appliances
                  { key: "oven", label: "Horno" },
                  { key: "microwave", label: "Microondas" },
                  { key: "washingMachine", label: "Lavadora" },
                  { key: "fridge", label: "Frigorífico" },
                  { key: "tv", label: "TV" },
                  { key: "dishwasher", label: "Lavavajillas" },

                  // Views and orientation
                  { key: "exterior", label: "Exterior" },
                  { key: "bright", label: "Luminoso" },
                  { key: "mountainViews", label: "Vistas a montaña" },
                  { key: "seaViews", label: "Vistas al mar" },
                  { key: "beachfront", label: "Primera línea de playa" },

                  // Luxury features
                  { key: "jacuzzi", label: "Jacuzzi" },
                  { key: "hydromassage", label: "Hidromasaje" },
                  { key: "homeAutomation", label: "Domótica" },
                  { key: "musicSystem", label: "Sistema de música" },
                  { key: "fireplace", label: "Chimenea" },
                  { key: "wineCellar", label: "Bodega" },

                  // Community amenities
                  { key: "communityPool", label: "Piscina comunitaria" },
                  { key: "privatePool", label: "Piscina privada" },
                  { key: "tennisCourt", label: "Pista de tenis" },
                  { key: "gym", label: "Gimnasio" },
                  { key: "sportsArea", label: "Zona deportiva" },
                  { key: "childrenArea", label: "Zona infantil" },

                  // Additional features
                  { key: "laundryRoom", label: "Lavadero" },
                  { key: "coveredClothesline", label: "Tendedero cubierto" },
                  { key: "suiteBathroom", label: "Baño suite" },
                  { key: "builtInWardrobes", label: "Armarios empotrados" },
                  {
                    key: "nearbyPublicTransport",
                    label: "Transporte público cercano",
                  },
                  { key: "satelliteDish", label: "Antena parabólica" },
                  { key: "stoneware", label: "Gresite" },

                  // Pet and student friendly
                  { key: "petsAllowed", label: "Mascotas permitidas" },
                  { key: "studentFriendly", label: "Apto para estudiantes" },

                  // Internet and connectivity
                  { key: "internet", label: "Internet incluido" },

                  // VPO and special conditions
                  { key: "vpo", label: "VPO" },
                ]
                  .filter((extra) =>
                    extra.label
                      .toLowerCase()
                      .includes(characteristicsSearch.toLowerCase()),
                  )
                  .map((extra) => (
                    <div
                      key={extra.key}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`${data.id}-${extra.key}`}
                        checked={localData.extras[extra.key] ?? false}
                        onCheckedChange={(checked) => {
                          const newExtras = {
                            ...localData.extras,
                            [extra.key]: checked === true,
                          };
                          updateLocalData({ extras: newExtras });
                        }}
                      />
                      <Label
                        htmlFor={`${data.id}-${extra.key}`}
                        className="text-sm"
                      >
                        {extra.label}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notas adicionales</Label>
              <Textarea
                value={localData.notes}
                onChange={(e) => updateLocalData({ notes: e.target.value })}
                className="min-h-[80px] resize-y border-gray-200 transition-colors focus:border-gray-400 focus:ring-gray-300"
                placeholder="Notas específicas para este interés..."
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {/* Close/Cancel button */}
        {isRemovable && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}

        {/* Delete button for existing prospects */}
        {localData.id.startsWith("prospect-") && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar solicitud
          </Button>
        )}

        {/* Save button */}
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={cn(
            "flex items-center gap-2 transition-all",
            saveStatus === "saving" && "bg-amber-600 hover:bg-amber-700",
            saveStatus === "saved" && "bg-emerald-600 hover:bg-emerald-700",
            saveStatus === "error" && "bg-red-600 hover:bg-red-700",
          )}
        >
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-4 w-4" />
              Guardado
            </>
          )}
          {(saveStatus === "idle" || saveStatus === "error") && (
            <>
              <Save className="h-4 w-4" />
              Guardar solicitud
            </>
          )}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Eliminar solicitud
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar esta solicitud? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
