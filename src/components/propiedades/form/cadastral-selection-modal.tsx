"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Loader, MapPin, Calendar, Square } from "lucide-react";

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

interface CadastralSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: CadastralSearchResult[];
  isLoading: boolean;
  onSelect: (result: CadastralSearchResult) => void;
}

export function CadastralSelectionModal({
  isOpen,
  onClose,
  searchResults,
  isLoading,
  onSelect,
}: CadastralSelectionModalProps) {
  // Extract common information from the first result (all units share the same building info)
  const commonInfo =
    searchResults.length > 0
      ? {
          street: searchResults[0]?.street ?? "",
          municipality: searchResults[0]?.municipality ?? "",
          province: searchResults[0]?.province ?? "",
          yearBuilt: searchResults[0]?.yearBuilt ?? 0,
        }
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:max-h-[80vh] sm:w-full sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            Seleccionar Propiedad en Catastro
          </DialogTitle>
          <DialogDescription className="text-sm">
            Se encontraron {searchResults.length}{" "}
            {searchResults.length === 1 ? "unidad" : "unidades"} en esta
            dirección. Selecciona la unidad específica de tu propiedad.
          </DialogDescription>
        </DialogHeader>

        {/* Common information header */}
        {commonInfo && searchResults.length > 0 && (
          <div className="mb-3 space-y-2 rounded-lg bg-muted/50 p-3 sm:mb-4 sm:p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-medium sm:text-base">
                  {commonInfo.street}
                </div>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  {commonInfo.municipality}, {commonInfo.province}
                </div>
              </div>
            </div>
            {commonInfo.yearBuilt > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                <span className="text-muted-foreground">
                  Año de construcción:
                </span>
                <span className="font-medium">{commonInfo.yearBuilt}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Loader className="mb-3 h-8 w-8 animate-spin sm:h-10 sm:w-10" />
              <span className="text-sm text-muted-foreground sm:text-base">
                Buscando referencias catastrales...
              </span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center sm:py-12">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
              <h3 className="mb-2 text-base font-medium sm:text-lg">
                No se encontraron referencias
              </h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron referencias catastrales para esta dirección.
                Verifica que los datos sean correctos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {searchResults.map((result, index) => (
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
                        <span className="text-xs sm:text-sm">Superficie</span>
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

        <div className="mt-3 flex justify-end border-t pt-3 sm:mt-4 sm:pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs sm:text-sm"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
