"use client";

import { useState, useEffect } from "react";
import { useSession } from "~/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { LogoUpload } from "~/components/ui/logo-upload";
import {
  removeBackground,
  canRemoveBackground,
  cleanupUrls,
} from "~/lib/background-removal";
import { extractColorPalette, getHexColors } from "~/lib/color-extraction";
import {
  uploadBrandAsset,
  getBrandAsset,
  deleteBrandAsset,
  updateColorPalette,
} from "~/app/actions/brand-upload";
import { getColorAdjustmentPreviews } from "~/lib/color-adjustment";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import { useToast } from "~/components/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Palette,
  RefreshCw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import type { BrandAsset, LogoUploadProgress } from "~/types/brand";
import Image from "next/image";

export const AccountBranding = () => {
  const { data: session } = useSession();
  const { toast } = useToast();

  // State management
  const [accountId, setAccountId] = useState<string | null>(null);
  const [brandAsset, setBrandAsset] = useState<BrandAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    LogoUploadProgress | undefined
  >();
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showColorAdjustment, setShowColorAdjustment] = useState(false);
  const [isUpdatingColors, setIsUpdatingColors] = useState(false);
  const [workingPalette, setWorkingPalette] = useState<string[]>([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [colorVariations, setColorVariations] = useState<
    Record<string, string>
  >({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // Load account data on mount
  useEffect(() => {
    async function loadAccountData() {
      if (session?.user?.id) {
        try {
          const userAccountId = await getCurrentUserAccountIdAction();
          if (userAccountId) {
            const accountIdStr = userAccountId.toString();
            setAccountId(accountIdStr);

            // Load existing brand asset if available
            const existingBrand = await getBrandAsset(accountIdStr);
            if (existingBrand) {
              setBrandAsset(existingBrand);
              setColorPalette(existingBrand.colorPalette);
            }
          }
        } catch (error) {
          console.error("Error loading account data:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la información de la cuenta",
            variant: "destructive",
          });
        }
      }
    }
    void loadAccountData();
  }, [session, toast]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrls.length > 0) {
        cleanupUrls(previewUrls);
      }
    };
  }, [previewUrls]);

  // Client-side progress simulation with smooth animation
  const simulateProgress = () => {
    const stages = [
      {
        stage: "uploading" as const,
        message: "Iniciando subida...",
        duration: 7000,
      },
      {
        stage: "processing" as const,
        message: "Removiendo fondo automáticamente...",
        duration: 7000,
      },
      {
        stage: "extracting" as const,
        message: "Extrayendo colores de marca...",
        duration: 7000,
      },
      {
        stage: "saving" as const,
        message: "Guardando en almacenamiento...",
        duration: 0,
      }, // Final stage waits for server
    ];

    let currentStageIndex = 0;
    let stageTimeout: NodeJS.Timeout;

    const runStage = () => {
      if (currentStageIndex >= stages.length) {
        return;
      }

      const currentStage = stages[currentStageIndex];
      if (!currentStage) return;

      // Set progress immediately (synchronously)
      setUploadProgress({
        stage: currentStage.stage,
        percentage: 25 * (currentStageIndex + 1),
        message: currentStage.message,
      });

      // If it's the final stage, don't auto-advance (wait for server completion)
      if (currentStage.duration > 0) {
        stageTimeout = setTimeout(() => {
          currentStageIndex++;
          runStage();
        }, currentStage.duration);
      }
    };

    // Start immediately
    runStage();

    // Return cleanup function
    return () => {
      if (stageTimeout) {
        clearTimeout(stageTimeout);
      }
    };
  };

  // Main logo upload handler
  const handleLogoUpload = async (file: File) => {
    if (!accountId) {
      toast({
        title: "Error",
        description: "ID de cuenta no disponible",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const tempUrls: string[] = [];

    // Start independent client-side progress simulation immediately
    const cleanupProgress = simulateProgress();

    try {
      // Step 1: Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Por favor selecciona un archivo de imagen válido");
      }

      // Step 2: Remove background (runs independently of progress animation)
      const bgRemovalResult = await removeBackground(file);
      tempUrls.push(
        bgRemovalResult.originalUrl,
        bgRemovalResult.transparentUrl,
      );

      // Step 3: Extract colors from original (runs independently of progress animation)
      const colorPaletteResult = await extractColorPalette(
        bgRemovalResult.originalUrl,
      );
      const hexColors = getHexColors(colorPaletteResult.colors);

      // Step 4: Upload both versions to S3
      const uploadResult = await uploadBrandAsset(
        bgRemovalResult.originalBlob,
        bgRemovalResult.transparentBlob,
        accountId,
        hexColors,
        file.name,
      );

      // Server processing complete - update to final stage
      setUploadProgress({
        stage: "complete",
        percentage: 100,
        message: "Completado exitosamente",
      });

      // Step 5: Update UI state
      setBrandAsset(uploadResult);
      setColorPalette(hexColors);
      setPreviewUrls(tempUrls);

      toast({
        title: "¡Éxito!",
        description: "Logo subido y procesado correctamente",
      });
    } catch (error) {
      console.error("Logo upload failed:", error);

      // Clean up progress animation and temporary URLs on error
      cleanupProgress();
      cleanupUrls(tempUrls);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al procesar el logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(undefined);
      }, 2000);
    }
  };

  // Delete brand asset
  const handleDelete = async () => {
    if (!accountId || !brandAsset) return;

    setIsDeleting(true);
    try {
      await deleteBrandAsset(accountId);

      // Clear all brand-related state
      setBrandAsset(null);
      setColorPalette([]);
      setWorkingPalette([]);
      setColorVariations({});
      cleanupUrls(previewUrls);
      setPreviewUrls([]);

      toast({
        title: "Eliminado",
        description: "Logo y paleta de colores eliminados correctamente",
      });
    } catch (error) {
      console.error("Error deleting brand asset:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el logo",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Browser compatibility check
  const browserSupported = canRemoveBackground();

  return (
    <div className="space-y-6">
      {/* Browser compatibility warning */}
      {!browserSupported && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu navegador no soporta la remoción automática de fondos. Por favor
            actualiza tu navegador o usa Chrome 88+, Firefox 79+, Safari 14.1+,
            o Edge 88+.
          </AlertDescription>
        </Alert>
      )}

      {/* Main branding card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {brandAsset && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Configurado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload/Preview Section */}
          {brandAsset ? (
            <div className="flex justify-center">
              <div className="group relative">
                <div className="relative h-64 w-64 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {brandAsset.logoTransparentUrl &&
                  brandAsset.logoTransparentUrl !== "" ? (
                    <Image
                      src={brandAsset.logoTransparentUrl}
                      alt="Logo sin fondo"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <span>Logo no disponible</span>
                    </div>
                  )}

                  {/* Hover buttons - same pattern as Hero section */}
                  {brandAsset.logoOriginalUrl &&
                    brandAsset.logoOriginalUrl !== "" && (
                      <button
                        type="button"
                        className="absolute left-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                        onClick={() =>
                          window.open(brandAsset.logoOriginalUrl, "_blank")
                        }
                        aria-label="Ver original"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}

                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isDeleting}
                    aria-label="Eliminar logo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {brandAsset.logoTransparentUrl &&
                    brandAsset.logoTransparentUrl !== "" && (
                      <button
                        type="button"
                        className="absolute bottom-2 left-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = brandAsset.logoTransparentUrl;
                          a.download = "logo-transparente.png";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        aria-label="Descargar logo"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}

                  <button
                    type="button"
                    className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                    onClick={() => setShowReplaceDialog(true)}
                    aria-label="Reemplazar logo"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-center">
                  <Badge variant="secondary">Fondo Transparente</Badge>
                </div>
              </div>
            </div>
          ) : (
            <LogoUpload
              onUpload={handleLogoUpload}
              isUploading={isUploading}
              progress={uploadProgress}
              className="mx-auto max-w-lg"
            />
          )}
        </CardContent>
      </Card>

      {/* Color Palette Section */}
      {colorPalette.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Paleta de Colores</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">Consejos para tu Logo:</p>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            Usa imágenes de alta calidad (mínimo 300x300
                            píxeles)
                          </li>
                          <li>
                            Los logos con fondos sólidos se procesan mejor
                          </li>
                          <li>
                            El sistema extrae automáticamente los 6 colores más
                            prominentes
                          </li>
                          <li>
                            La versión sin fondo es perfecta para diferentes
                            fondos
                          </li>
                          <li>
                            Los colores te ayudarán a mantener consistencia
                            visual
                          </li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Initialize working palette and generate variations for first color
                  setWorkingPalette([...colorPalette]);
                  setSelectedColorIndex(0);

                  // Generate variations for the first color
                  const firstColor = colorPalette[0];
                  if (firstColor) {
                    const previews = getColorAdjustmentPreviews([firstColor]);
                    const variations: Record<string, string> = {};
                    Object.entries(previews).forEach(([strategy, colors]) => {
                      if (colors[0]) variations[strategy] = colors[0];
                    });
                    setColorVariations(variations);
                  }

                  setShowColorAdjustment(true);
                }}
                className="flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                Ajustar Paleta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {colorPalette.slice(0, 6).map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className="flex flex-col items-center space-y-2"
                >
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(color);
                        toast({
                          title: "¡Copiado!",
                          description: `Color ${color} copiado al portapapeles`,
                        });
                      } catch (error) {
                        console.error("Failed to copy color:", error);
                      }
                    }}
                    className="group relative h-16 w-full min-w-16 rounded-lg border-2 border-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    style={{ backgroundColor: color }}
                    title={`Color ${index + 1}: ${color} (Click para copiar)`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                        Copiar
                      </div>
                    </div>
                  </button>
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground">
                      Color {index + 1}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {color.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Adjustment Modal */}
      <Dialog open={showColorAdjustment} onOpenChange={setShowColorAdjustment}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Ajustar Paleta de Colores</DialogTitle>
            <DialogDescription>
              Selecciona cada color individualmente y elige su variación
              preferida
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Palette Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Paleta Actual</Label>
              <div className="flex gap-2">
                {workingPalette.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedColorIndex(index);
                      // Generate variations for the selected color
                      const previews = getColorAdjustmentPreviews([color]);
                      const variations: Record<string, string> = {};
                      Object.entries(previews).forEach(([strategy, colors]) => {
                        if (colors[0]) variations[strategy] = colors[0];
                      });
                      setColorVariations(variations);
                    }}
                    className={`relative h-16 w-16 rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedColorIndex === index
                        ? "scale-110 border-primary ring-2 ring-primary/30"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColorIndex === index && (
                      <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                        {index + 1}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Click en un color para ver sus variaciones
              </div>
            </div>

            {/* Color Variations for Selected Color */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Variaciones para Color {selectedColorIndex + 1}
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(colorVariations).map(([strategy, color]) => (
                  <button
                    key={strategy}
                    onClick={() => {
                      // Update the working palette with the selected variation
                      const newPalette = [...workingPalette];
                      newPalette[selectedColorIndex] = color;
                      setWorkingPalette(newPalette);
                    }}
                    className="space-y-2 rounded-lg border p-3 transition-all hover:border-primary hover:bg-accent"
                  >
                    <div
                      className="h-12 w-full rounded-md shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-xs font-medium">
                      {strategy === "original"
                        ? "Original"
                        : strategy === "pastel"
                          ? "Pastel"
                          : strategy === "muted"
                            ? "Apagado"
                            : strategy === "soft"
                              ? "Suave"
                              : strategy === "warm"
                                ? "Cálido"
                                : strategy === "cool"
                                  ? "Frío"
                                  : strategy === "balanced"
                                    ? "Balanceado"
                                    : strategy}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {color}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Final Preview */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium">Vista Previa Final</Label>
              <div className="flex gap-2">
                {workingPalette.map((color, index) => (
                  <div key={index} className="text-center">
                    <div
                      className="h-14 w-14 rounded-lg border-2 border-white shadow-md"
                      style={{ backgroundColor: color }}
                    />
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {color.slice(0, 7)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowColorAdjustment(false);
                setWorkingPalette([]);
              }}
              disabled={isUpdatingColors}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Reset working palette to original
                setWorkingPalette([...colorPalette]);
              }}
              disabled={isUpdatingColors}
            >
              Restaurar Original
            </Button>
            <Button
              onClick={async () => {
                setIsUpdatingColors(true);
                try {
                  if (!accountId) return;

                  const result = await updateColorPalette(
                    accountId,
                    workingPalette,
                  );
                  if (result.success) {
                    setColorPalette(result.colorPalette);
                    toast({
                      title: "¡Colores actualizados!",
                      description:
                        "La paleta de colores ha sido personalizada exitosamente",
                    });
                    setShowColorAdjustment(false);
                    setWorkingPalette([]);
                  }
                } catch (error) {
                  console.error("Error updating colors:", error);
                  toast({
                    title: "Error",
                    description: "No se pudieron actualizar los colores",
                    variant: "destructive",
                  });
                } finally {
                  setIsUpdatingColors(false);
                }
              }}
              disabled={
                isUpdatingColors ||
                JSON.stringify(workingPalette) === JSON.stringify(colorPalette)
              }
            >
              {isUpdatingColors ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente el logo y la
              paleta de colores de tu marca?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              ⚠️ Esta acción no se puede deshacer
            </p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              Se eliminarán todos los archivos del logo y los datos de la paleta
              de colores asociados.
            </p>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowDeleteConfirmation(false);
                await handleDelete();
              }}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Logo Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reemplazar Logo</DialogTitle>
            <DialogDescription>
              Selecciona un nuevo logo para reemplazar el actual. El sistema
              procesará automáticamente el fondo y extraerá los colores.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LogoUpload
              onUpload={async (file) => {
                setShowReplaceDialog(false);
                await handleLogoUpload(file);
              }}
              isUploading={isUploading}
              progress={uploadProgress}
              className="mx-auto max-w-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
