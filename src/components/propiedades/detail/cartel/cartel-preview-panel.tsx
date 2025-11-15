import React from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Download,
  Eye,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
  SavedCartelConfiguration,
} from "~/types/template-data";
import { SavedConfigurations } from "./saved-configurations";

interface CartelPreviewPanelProps {
  // Preview state
  showPreview: boolean;
  previewZoom: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;

  // Template data
  TemplateComponent: React.ComponentType<{
    data: ExtendedTemplatePropertyData;
    config: TemplateConfiguration;
    className?: string;
  }>;
  propertyData: ExtendedTemplatePropertyData;
  config: TemplateConfiguration;
  templateImages: string[];

  // Action states
  isGenerating: boolean;
  isSavingCartel: boolean;
  lastGeneratedPdf: string | null;
  selectedImageIndices: number[];
  listingId: number | null;

  // Saved configurations
  savedConfigurations: SavedCartelConfiguration[];
  selectedConfigurationId: string | null;
  isLoadingConfigurations: boolean;
  onLoadConfiguration: (config: SavedCartelConfiguration) => void;

  // Handlers
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomChange: (value: number) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onGeneratePDF: () => void;
  onSaveCartel: () => void;
  onPreviewTemplate: () => void;
  onShowSaveModal: () => void;
}

export function CartelPreviewPanel({
  showPreview,
  previewZoom,
  panX,
  panY,
  isDragging,
  previewRef,
  TemplateComponent,
  propertyData,
  config,
  templateImages,
  isGenerating,
  isSavingCartel,
  lastGeneratedPdf,
  selectedImageIndices,
  listingId,
  savedConfigurations,
  selectedConfigurationId,
  isLoadingConfigurations,
  onLoadConfiguration,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomChange,
  onMouseDown,
  onGeneratePDF,
  onSaveCartel,
  onPreviewTemplate,
  onShowSaveModal,
}: CartelPreviewPanelProps) {
  if (!showPreview) {
    return null;
  }

  return (
    <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Previsualización
            </div>
            <div className="flex items-center gap-2">
              {/* Saved Configurations Dropdown - inline with zoom controls */}
              <SavedConfigurations
                savedConfigurations={savedConfigurations}
                selectedConfigurationId={selectedConfigurationId}
                isLoading={isLoadingConfigurations}
                onLoadConfiguration={onLoadConfiguration}
              />
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomOut}
                  disabled={previewZoom <= 0.2}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[60px] text-center text-sm font-medium">
                  {Math.round(previewZoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onZoomIn}
                  disabled={previewZoom >= 1.0}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetZoom}
                  title="Reset zoom and position"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={previewRef}
            className={`border border-gray-300 bg-gray-100 p-2 md:p-4 ${previewZoom > 0.4 ? "overflow-auto" : "overflow-hidden"}`}
            style={{
              height: "60vh",
              minHeight: "400px",
              maxHeight: "90vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              cursor: isDragging ? "grabbing" : "grab",
              paddingTop: "20px",
            }}
            onMouseDown={onMouseDown}
          >
            <div
              style={{
                transform: `scale(${previewZoom}) translate(${panX}px, ${panY}px)`,
                transformOrigin: "top center",
                border: "1px solid #ccc",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                transition: isDragging ? "none" : "transform 0.2s ease-in-out",
                maxWidth: "100%",
                overflow: "visible",
              }}
            >
              <TemplateComponent
                data={{
                  ...propertyData,
                  images: templateImages,
                }}
                config={config}
                className="print-preview"
              />
            </div>
          </div>
          
          {/* Subtle action controls below preview */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 pt-4">
            <Button
              onClick={onGeneratePDF}
              disabled={isGenerating || selectedImageIndices.length < 1}
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              title={
                selectedImageIndices.length < 1
                  ? "Selecciona al menos 1 imagen"
                  : "Generar PDF"
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Generar PDF
                </>
              )}
            </Button>

            <Button
              onClick={onSaveCartel}
              disabled={
                isSavingCartel ||
                !listingId ||
                selectedImageIndices.length < 1
              }
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              title={
                !listingId
                  ? "ID de listing no disponible"
                  : selectedImageIndices.length < 1
                    ? "Selecciona al menos 1 imagen"
                    : "Guardar Cartel"
              }
            >
              {isSavingCartel ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <HardDrive className="mr-1.5 h-3.5 w-3.5" />
                  Guardar Cartel
                </>
              )}
            </Button>

            <Button
              onClick={onShowSaveModal}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              title="Guardar Plantilla"
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Guardar Configuración
            </Button>

            <Button
              onClick={onPreviewTemplate}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              title="Vista Rápida"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Vista Rápida
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
