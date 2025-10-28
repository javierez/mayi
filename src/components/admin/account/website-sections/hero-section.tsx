"use client";

import { useEffect, useState } from "react";
import { Home, RefreshCw, Eye, Trash2, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { HeroImageUpload } from "~/components/ui/hero-image-upload";
import {
  uploadHeroImage,
  deleteHeroImage,
  uploadHeroVideo,
  deleteHeroVideo,
} from "~/app/actions/hero-upload";
import { useToast } from "~/components/hooks/use-toast";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { HeroSectionProps } from "../types/website-sections";

export function HeroSection({
  form,
  isActive,
  onUnsavedChanges,
}: HeroSectionProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  // Watch for form changes to detect unsaved changes - PRESERVE existing logic
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("heroProps")) {
        onUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Handle hero media upload (image or video)
  const handleHeroMediaUpload = async (file: File, type: "image" | "video") => {
    setIsUploading(true);
    try {
      const accountId = await getCurrentUserAccountIdAction();
      if (!accountId) {
        throw new Error("No se pudo obtener el ID de la cuenta");
      }

      if (type === "image") {
        const result = await uploadHeroImage(
          file,
          accountId.toString(),
          file.name,
        );

        // Update form with new image URL
        form.setValue("heroProps.backgroundImage", result.imageUrl);
        form.setValue("heroProps.backgroundType", "image");
        onUnsavedChanges(true);
        setShowUploadDialog(false);

        toast({
          title: "¡Éxito!",
          description: "Imagen de fondo actualizada correctamente",
        });
      } else {
        const result = await uploadHeroVideo(
          file,
          accountId.toString(),
          file.name,
        );

        // Update form with new video URL
        form.setValue("heroProps.backgroundVideo", result.videoUrl);
        form.setValue("heroProps.backgroundType", "video");
        onUnsavedChanges(true);
        setShowUploadDialog(false);

        toast({
          title: "¡Éxito!",
          description: "Video de fondo actualizado correctamente",
        });
      }
    } catch (error) {
      console.error("Error uploading hero media:", error);
      toast({
        title: "Error",
        description: `No se pudo subir ${type === "image" ? "la imagen" : "el video"}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle hero media deletion
  const handleHeroMediaDelete = async () => {
    setIsDeleting(true);
    try {
      const accountId = await getCurrentUserAccountIdAction();
      if (!accountId) {
        throw new Error("No se pudo obtener el ID de la cuenta");
      }

      const backgroundType = form.watch("heroProps.backgroundType") ?? "image";

      if (backgroundType === "video") {
        await deleteHeroVideo(accountId.toString());
        form.setValue("heroProps.backgroundVideo", "");
        toast({
          title: "Eliminado",
          description: "Video de fondo eliminado correctamente",
        });
      } else {
        await deleteHeroImage(accountId.toString());
        form.setValue("heroProps.backgroundImage", "");
        toast({
          title: "Eliminado",
          description: "Imagen de fondo eliminada correctamente",
        });
      }

      onUnsavedChanges(true);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting hero media:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Only render when active section
  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Home className="h-5 w-5 text-gray-500" />
          Sección Principal
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          La primera sección que ven los visitantes
        </p>
      </div>

      <div className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="heroProps.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Principal</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Encuentra Tu Casa Ideal" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Subtitle Field */}
        <FormField
          control={form.control}
          name="heroProps.subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Te ayudamos a encontrar la propiedad perfecta"
                  rows={2}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Background Media Field - Updated to support both image and video */}
        <div>
          <FormLabel>Imagen o Video de Fondo</FormLabel>
          {form.watch("heroProps.backgroundImage") ||
          form.watch("heroProps.backgroundVideo") ? (
            <div className="mt-3 flex justify-center">
              <div className="group relative">
                <div className="relative h-48 w-96 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {form.watch("heroProps.backgroundType") === "video" &&
                  form.watch("heroProps.backgroundVideo") ? (
                    <video
                      src={form.watch("heroProps.backgroundVideo") ?? ""}
                      className="h-full w-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <Image
                      src={form.watch("heroProps.backgroundImage") ?? ""}
                      alt="Hero background"
                      fill
                      className="object-cover"
                    />
                  )}

                  {/* Hover buttons - same pattern as branding */}
                  <button
                    type="button"
                    className="absolute left-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                    onClick={() => {
                      const url =
                        form.watch("heroProps.backgroundType") === "video"
                          ? form.watch("heroProps.backgroundVideo")
                          : form.watch("heroProps.backgroundImage");
                      window.open(url, "_blank");
                    }}
                    aria-label="Ver archivo"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isDeleting}
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    className="absolute bottom-2 left-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                    onClick={() => {
                      const isVideo =
                        form.watch("heroProps.backgroundType") === "video";
                      const a = document.createElement("a");
                      a.href = isVideo
                        ? (form.watch("heroProps.backgroundVideo") ?? "")
                        : (form.watch("heroProps.backgroundImage") ?? "");
                      a.download = isVideo
                        ? "hero-background.mp4"
                        : "hero-background.jpg";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    aria-label="Descargar archivo"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                    onClick={() => setShowUploadDialog(true)}
                    aria-label="Reemplazar archivo"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
              className="mt-3"
            >
              Configurar imagen o video de fondo
            </Button>
          )}
        </div>

        {/* Primary Button Text Field */}
        <FormField
          control={form.control}
          name="heroProps.findPropertyButton"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto Botón Principal</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Explorar Propiedades" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Secondary Button Text Field */}
        <FormField
          control={form.control}
          name="heroProps.contactButton"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto Botón Secundario</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Contáctanos" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Imagen o Video de Fondo</DialogTitle>
            <DialogDescription>
              Selecciona una imagen o video para usar como fondo de la sección
              principal
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <HeroImageUpload
              onUpload={handleHeroMediaUpload}
              isUploading={isUploading}
              acceptVideo={true}
            />
          </div>
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
              ¿Estás seguro de que deseas eliminar{" "}
              {form.watch("heroProps.backgroundType") === "video"
                ? "el video"
                : "la imagen"}{" "}
              de fondo?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              ⚠️ Esta acción no se puede deshacer
            </p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {form.watch("heroProps.backgroundType") === "video"
                ? "El video"
                : "La imagen"}{" "}
              será eliminado permanentemente del servidor.
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
                await handleHeroMediaDelete();
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
    </div>
  );
}
