import React from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Slider } from "~/components/ui/slider";
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
} from "lucide-react";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";

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
          <div className="mt-2 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <Slider
                value={[previewZoom]}
                onValueChange={([value]) => onZoomChange(value!)}
                max={1.0}
                min={0.2}
                step={0.05}
                className="w-16 md:w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Below Preview */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={onGeneratePDF}
              disabled={isGenerating || selectedImageIndices.length < 1}
              size="lg"
              title={
                selectedImageIndices.length < 1
                  ? "Selecciona al menos 1 imagen"
                  : ""
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
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
              className="flex items-center gap-2"
              title={
                !listingId
                  ? "ID de listing no disponible"
                  : selectedImageIndices.length < 1
                    ? "Selecciona al menos 1 imagen"
                    : ""
              }
            >
              {isSavingCartel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cartel
                </>
              )}
            </Button>

            <Button
              onClick={onShowSaveModal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Plantilla
            </Button>

            <Button onClick={onPreviewTemplate} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Vista Rápida
            </Button>

            {lastGeneratedPdf && (
              <Button
                onClick={() => window.open(lastGeneratedPdf, "_blank")}
                variant="secondary"
                className="col-span-2"
              >
                <FileText className="mr-2 h-4 w-4" />
                Abrir último PDF generado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
