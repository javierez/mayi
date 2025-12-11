"use client";

import React, { useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Loader,
  MapPin,
  Calendar,
  Square,
  Search,
  X,
  Building2,
  ChevronLeft,
  Home,
} from "lucide-react";

// Types imported from server - duplicated here for client component
interface CadastralSearchResult {
  cadastralReference: string;
  street: string;
  addressDetails: string;
  postalCode: string;
  city?: string;
  province?: string;
  municipality: string;
  builtSurfaceArea: number;
  yearBuilt: number;
}

interface CadastralParcel {
  cadastralReference: string;
  street: string;
  municipality: string;
  province?: string;
  unitCount: number;
}

interface CadastralSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: CadastralParcel[];
  isLoading: boolean;
  onSelect: (result: CadastralSearchResult) => void;
  onExpandParcel: (
    parcel: CadastralParcel,
  ) => Promise<CadastralSearchResult[]>;
}

export function CadastralSelectionModal({
  isOpen,
  onClose,
  parcels,
  isLoading,
  onSelect,
  onExpandParcel,
}: CadastralSelectionModalProps) {
  const [step, setStep] = useState<"parcels" | "units">("parcels");
  const [selectedParcel, setSelectedParcel] = useState<CadastralParcel | null>(
    null,
  );
  const [units, setUnits] = useState<CadastralSearchResult[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset state when modal closes
  const handleClose = () => {
    setStep("parcels");
    setSelectedParcel(null);
    setUnits([]);
    setSearchQuery("");
    onClose();
  };

  // Handle parcel selection - expand to units
  const handleParcelSelect = async (parcel: CadastralParcel) => {
    setSelectedParcel(parcel);
    setIsLoadingUnits(true);
    setStep("units");
    setSearchQuery("");

    try {
      const expandedUnits = await onExpandParcel(parcel);
      setUnits(expandedUnits);
    } catch (error) {
      console.error("Error expanding parcel:", error);
      setUnits([]);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  // Go back to parcel selection
  const handleBack = () => {
    setStep("parcels");
    setSelectedParcel(null);
    setUnits([]);
    setSearchQuery("");
  };

  // Filter parcels based on search query
  const filteredParcels = useMemo(() => {
    if (!searchQuery.trim()) return parcels;
    const query = searchQuery.toLowerCase();
    return parcels.filter(
      (parcel) =>
        parcel.street.toLowerCase().includes(query) ||
        parcel.municipality.toLowerCase().includes(query),
    );
  }, [parcels, searchQuery]);

  // Filter units based on search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return units;
    const query = searchQuery.toLowerCase();
    return units.filter((unit) =>
      unit.addressDetails.toLowerCase().includes(query),
    );
  }, [units, searchQuery]);

  // Extract common info from units
  const commonInfo =
    units.length > 0
      ? {
          street: units[0]?.street ?? "",
          municipality: units[0]?.municipality ?? "",
          province: units[0]?.province ?? "",
          yearBuilt: units[0]?.yearBuilt ?? 0,
        }
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl p-0 sm:max-h-[80vh] sm:w-full [&>button]:hidden">
        <div className="flex max-h-[90vh] flex-col sm:max-h-[80vh]">
          <DialogHeader className="space-y-2 border-b p-4 sm:space-y-3 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 sm:space-y-3">
                {step === "parcels" ? (
                  <>
                    <DialogTitle className="text-lg sm:text-xl">
                      Seleccionar Parcela Catastral
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Se encontraron {parcels.length}{" "}
                      {parcels.length === 1 ? "parcela" : "parcelas"} cerca de
                      esta ubicación. Selecciona la parcela de tu propiedad.
                    </DialogDescription>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <DialogTitle className="text-lg sm:text-xl">
                        Seleccionar Unidad
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                      {isLoadingUnits
                        ? "Cargando unidades..."
                        : `Se encontraron ${units.length} ${units.length === 1 ? "unidad" : "unidades"} en esta parcela. Selecciona tu propiedad.`}
                    </DialogDescription>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Search input */}
            {((step === "parcels" && parcels.length > 0 && !isLoading) ||
              (step === "units" && units.length > 0 && !isLoadingUnits)) && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={
                    step === "parcels"
                      ? "Buscar por dirección..."
                      : "Buscar por planta/puerta..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* STEP 1: Parcel Selection */}
            {step === "parcels" && (
              <div className="space-y-3 sm:space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Loader className="mb-3 h-8 w-8 animate-spin sm:h-10 sm:w-10" />
                    <span className="text-sm text-muted-foreground sm:text-base">
                      Buscando parcelas catastrales...
                    </span>
                  </div>
                ) : parcels.length === 0 ? (
                  <div className="px-4 py-8 text-center sm:py-12">
                    <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                    <h3 className="mb-2 text-base font-medium sm:text-lg">
                      No se encontraron parcelas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No se encontraron parcelas catastrales en un radio de 50
                      metros. Verifica que la dirección sea correcta.
                    </p>
                  </div>
                ) : filteredParcels.length === 0 ? (
                  <div className="px-4 py-8 text-center sm:py-12">
                    <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                    <h3 className="mb-2 text-base font-medium sm:text-lg">
                      No se encontraron resultados
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No hay parcelas que coincidan con &ldquo;{searchQuery}
                      &rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {filteredParcels.map((parcel, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => void handleParcelSelect(parcel)}
                      >
                        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <CardTitle className="break-words text-base font-semibold sm:text-lg">
                                  {parcel.street}
                                </CardTitle>
                              </div>
                              <div className="text-xs text-muted-foreground sm:text-sm">
                                {parcel.municipality}
                                {parcel.province ? `, ${parcel.province}` : ""}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0"
                            >
                              <Home className="mr-1 h-3 w-3" />
                              {parcel.unitCount}{" "}
                              {parcel.unitCount === 1 ? "unidad" : "unidades"}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-2 p-3 pt-0 sm:space-y-3 sm:p-6">
                          <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground sm:text-sm">
                            <span>Ref. Catastral:</span>
                            <span className="font-mono">
                              {parcel.cadastralReference}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            className="mt-2 h-8 w-full text-xs sm:h-9 sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleParcelSelect(parcel);
                            }}
                          >
                            Ver unidades
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Unit Selection */}
            {step === "units" && (
              <div className="space-y-3 sm:space-y-4">
                {/* Selected parcel info */}
                {selectedParcel && !isLoadingUnits && (
                  <div className="mb-3 space-y-2 rounded-lg bg-muted/50 p-3 sm:mb-4 sm:p-4">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-medium sm:text-base">
                          {selectedParcel.street}
                        </div>
                        <div className="text-xs text-muted-foreground sm:text-sm">
                          {selectedParcel.municipality}
                          {selectedParcel.province
                            ? `, ${selectedParcel.province}`
                            : ""}
                        </div>
                      </div>
                    </div>
                    {commonInfo && commonInfo.yearBuilt > 0 && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                        <span className="text-muted-foreground">
                          Año de construcción:
                        </span>
                        <span className="font-medium">
                          {commonInfo.yearBuilt}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isLoadingUnits ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Loader className="mb-3 h-8 w-8 animate-spin sm:h-10 sm:w-10" />
                    <span className="text-sm text-muted-foreground sm:text-base">
                      Cargando unidades de la parcela...
                    </span>
                  </div>
                ) : units.length === 0 ? (
                  <div className="px-4 py-8 text-center sm:py-12">
                    <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                    <h3 className="mb-2 text-base font-medium sm:text-lg">
                      No se encontraron unidades
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No se pudieron cargar las unidades de esta parcela.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="mt-4"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Volver a parcelas
                    </Button>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="px-4 py-8 text-center sm:py-12">
                    <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                    <h3 className="mb-2 text-base font-medium sm:text-lg">
                      No se encontraron resultados
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No hay unidades que coincidan con &ldquo;{searchQuery}
                      &rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {filteredUnits.map((result, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                        onClick={() => onSelect(result)}
                      >
                        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <CardTitle className="break-words text-base font-semibold sm:text-lg">
                                {result.addressDetails || `Unidad ${index + 1}`}
                              </CardTitle>
                              <div className="break-all font-mono text-xs text-muted-foreground">
                                {result.cadastralReference}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-2 p-3 pt-0 sm:space-y-3 sm:p-6">
                          {/* Surface Area */}
                          <div className="flex items-center justify-between border-b py-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                              <Square className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">
                                Superficie
                              </span>
                            </div>
                            <div className="text-xs font-medium sm:text-sm">
                              {result.builtSurfaceArea > 0 ? (
                                `${result.builtSurfaceArea} m²`
                              ) : (
                                <span className="text-muted-foreground">
                                  No disponible
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Postal Code */}
                          {result.postalCode && (
                            <div className="flex items-center justify-between border-b py-2">
                              <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">
                                  Código Postal
                                </span>
                              </div>
                              <div className="text-xs font-medium sm:text-sm">
                                {result.postalCode}
                              </div>
                            </div>
                          )}

                          <Button
                            size="sm"
                            className="mt-2 h-8 w-full text-xs sm:h-9 sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(result);
                            }}
                          >
                            Seleccionar esta unidad
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-4 sm:p-6">
            <div className="flex justify-between">
              {step === "units" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="text-xs sm:text-sm"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Volver
                </Button>
              )}
              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="text-xs sm:text-sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
