"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  // X,
  CheckSquare2,
  Square,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { PropertyImage } from "~/lib/data";
import {
  addYouTubeLink,
  deletePropertyImage,
  updateImageOrders,
  togglePropertyImageVisibility,
} from "~/app/actions/upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import Image from "next/image";

interface YouTubeLinkManagerProps {
  youtubeLinks: PropertyImage[];
  propertyId: bigint;
  referenceNumber: string;
  onYouTubeLinkAdded?: (link: PropertyImage) => void;
  canEdit?: boolean;
}

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = regExp.exec(url);
  return match?.[2] && match[2].length === 11 ? match[2] : null;
};

export function YouTubeLinkManager({
  youtubeLinks: initialYouTubeLinks,
  propertyId,
  referenceNumber,
  onYouTubeLinkAdded,
  canEdit = true,
}: YouTubeLinkManagerProps) {
  const [youtubeLinks, setYoutubeLinks] =
    useState<PropertyImage[]>(initialYouTubeLinks);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PropertyImage | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState<Set<number>>(
    new Set(),
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingLinks, setPendingLinks] = useState<PropertyImage[]>([]);

  const handleAddYouTubeLink = async () => {
    if (!youtubeUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const newLink = await addYouTubeLink(
        youtubeUrl,
        propertyId,
        referenceNumber,
      );
      setYoutubeLinks((prev) => [...prev, newLink]);
      onYouTubeLinkAdded?.(newLink);
      setYoutubeUrl("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding YouTube link:", error);
      alert(
        error instanceof Error ? error.message : "Error adding YouTube link",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLink = (link: PropertyImage) => {
    setEditingLink(link);
    setYoutubeUrl(link.imageUrl);
  };

  const handleUpdateLink = async () => {
    if (!editingLink || !youtubeUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const newLink = await addYouTubeLink(
        youtubeUrl,
        propertyId,
        referenceNumber,
      );
      // Delete the old link
      await deletePropertyImage(editingLink.imageKey, propertyId);
      // Update the list
      setYoutubeLinks((prev) =>
        prev.map((link) =>
          link.propertyImageId === editingLink.propertyImageId ? newLink : link,
        ),
      );
      setEditingLink(null);
      setYoutubeUrl("");
    } catch (error) {
      console.error("Error updating YouTube link:", error);
      alert(
        error instanceof Error ? error.message : "Error updating YouTube link",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLink = async (index: number) => {
    const linkToRemove = youtubeLinks[index];
    if (!linkToRemove) return;

    setIsDeleting(true);
    try {
      await deletePropertyImage(linkToRemove.imageKey, propertyId);
      setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting YouTube link:", error);
    } finally {
      setIsDeleting(false);
      setLinkToDelete(null);
    }
  };

  const toggleLinkSelection = (index: number) => {
    setSelectedLinks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    const selectedLinksList = Array.from(selectedLinks);
    setIsDeleting(true);
    try {
      for (const index of selectedLinksList) {
        const link = youtubeLinks[index];
        if (link) {
          await deletePropertyImage(link.imageKey, propertyId);
        }
      }
      setYoutubeLinks(youtubeLinks.filter((_, i) => !selectedLinks.has(i)));
    } catch (error) {
      console.error("Error deleting YouTube links:", error);
    } finally {
      setIsDeleting(false);
      setSelectedLinks(new Set());
      setIsSelectMode(false);
    }
  };

  const handleToggleVisibility = async (index: number) => {
    const link = youtubeLinks[index];
    if (!link) return;

    const newActiveStatus = !link.isActive;

    setIsTogglingVisibility((prev) => new Set([...prev, index]));

    setYoutubeLinks((prev) =>
      prev.map((lnk, i) =>
        i === index ? { ...lnk, isActive: newActiveStatus } : lnk,
      ),
    );

    try {
      await togglePropertyImageVisibility(
        link.propertyImageId,
        newActiveStatus,
      );
    } catch (error) {
      console.error("Error toggling YouTube link visibility:", error);
      setYoutubeLinks((prev) =>
        prev.map((lnk, i) =>
          i === index ? { ...lnk, isActive: !newActiveStatus } : lnk,
        ),
      );
    } finally {
      setIsTogglingVisibility((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSelectMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const newLinks = [...youtubeLinks];
    const draggedLink = newLinks[draggedIndex];

    if (!draggedLink) return;

    newLinks.splice(draggedIndex, 1);
    newLinks.splice(dropIndex, 0, draggedLink);

    setYoutubeLinks(newLinks);
    setPendingLinks(newLinks);
    setHasUnsavedChanges(true);

    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!hasUnsavedChanges || pendingLinks.length === 0) return;

    setIsUpdatingOrder(true);

    try {
      const updates = pendingLinks.map((link, index) => ({
        propertyImageId: link.propertyImageId,
        imageOrder: index + 1,
      }));

      await updateImageOrders(updates);

      setHasUnsavedChanges(false);
      setPendingLinks([]);
    } catch (error) {
      console.error("Error updating YouTube link order:", error);
      setYoutubeLinks(initialYouTubeLinks);
      setHasUnsavedChanges(false);
      setPendingLinks([]);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setYoutubeLinks(initialYouTubeLinks);
    setHasUnsavedChanges(false);
    setPendingLinks([]);
  };

  if (youtubeLinks.length === 0 && !isAddDialogOpen) {
    return (
      <div className="border-t pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Youtube_logo.png"
              alt="YouTube"
              width={32}
              height={23}
              className="object-contain"
            />
            <h3 className="text-lg font-medium text-gray-900">
              Vídeos de YouTube
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {canEdit && (
            <div
              onClick={() => setIsAddDialogOpen(true)}
              className="group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50"
              style={{ aspectRatio: "16 / 9" }}
            >
              <Plus className="mb-1 h-5 w-5 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
              <span className="text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
                Añadir URL
              </span>
              <span className="text-xs text-gray-400">de YouTube</span>
            </div>
          )}
        </div>

        {/* Add YouTube Link Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Vídeo de YouTube</DialogTitle>
              <DialogDescription>
                Introduce la URL del vídeo de YouTube que quieres añadir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="youtube-url">URL de YouTube</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setYoutubeUrl("");
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddYouTubeLink} disabled={isSubmitting}>
                {isSubmitting ? "Añadiendo..." : "Añadir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <div className="mb-4 flex items-center gap-3">
        <Image
          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Youtube_logo.png"
          alt="YouTube"
          width={32}
          height={23}
          className="object-contain"
        />
        <h3 className="text-lg font-medium text-gray-900">Vídeos de YouTube</h3>
      </div>

      {/* Help text for drag and drop */}
      {youtubeLinks.length > 1 && (
        <p className="mb-4 text-center text-sm text-gray-500">
          Arrastra y suelta los vídeos para reordenarlos
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {youtubeLinks.map((link, idx) => {
          const videoId = extractVideoId(link.imageUrl);

          return (
            <div
              key={link.propertyImageId.toString()}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-white transition-all duration-200",
                isSelectMode && "cursor-pointer",
                selectedLinks.has(idx) && "ring-2 ring-primary/50",
                dragOverIndex === idx && "scale-105 ring-2 ring-blue-400",
                draggedIndex === idx && "scale-95 opacity-50",
                !isSelectMode && "cursor-move",
                !link.isActive && "opacity-50",
              )}
              style={{ aspectRatio: "16 / 9" }}
              draggable={!isSelectMode && !isUpdatingOrder}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => isSelectMode && toggleLinkSelection(idx)}
            >
              {videoId && (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full rounded-t-lg"
                />
              )}

              {isSelectMode ? (
                <div className="absolute left-2 top-2 rounded-full bg-white/80 p-1">
                  {selectedLinks.has(idx) ? (
                    <CheckSquare2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.imageUrl, "_blank");
                    }}
                    aria-label="Abrir en YouTube"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLinkToDelete(idx);
                      }}
                      disabled={isDeleting}
                      aria-label="Eliminar vídeo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className="absolute bottom-2 left-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditLink(link);
                      }}
                      aria-label="Editar vídeo"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-black/60 disabled:opacity-50 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleVisibility(idx);
                      }}
                      disabled={isTogglingVisibility.has(idx)}
                      aria-label={
                        link.isActive ? "Ocultar vídeo" : "Mostrar vídeo"
                      }
                    >
                      {isTogglingVisibility.has(idx) ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : link.isActive ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Loading overlay for order updates */}
              {isUpdatingOrder && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add YouTube Link Placeholder */}
        {canEdit && (
          <div
            onClick={() => setIsAddDialogOpen(true)}
            className="group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50"
            style={{ aspectRatio: "16 / 9" }}
          >
            <Plus className="mb-1 h-5 w-5 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
            <span className="text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
              Añadir URL
            </span>
            <span className="text-xs text-gray-400">de YouTube</span>
          </div>
        )}
      </div>

      {/* Controls */}
      {canEdit && (
        <div className="mt-4 flex items-center space-x-2">
          {isSelectMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLinks(new Set());
                  setIsSelectMode(false);
                }}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedLinks.size === 0 || isDeleting}
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Eliminar
              </Button>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelOrder}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveOrder}
                disabled={isUpdatingOrder}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                {isUpdatingOrder ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelectMode(true)}
              className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <CheckSquare2 className="mr-1.5 h-4 w-4" />
              Seleccionar
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Vídeo de YouTube</DialogTitle>
            <DialogDescription>
              Introduce la URL del vídeo de YouTube que quieres añadir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">URL de YouTube</Label>
              <Input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setYoutubeUrl("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddYouTubeLink} disabled={isSubmitting}>
              {isSubmitting ? "Añadiendo..." : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingLink}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLink(null);
            setYoutubeUrl("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Vídeo de YouTube</DialogTitle>
            <DialogDescription>
              Modifica la URL del vídeo de YouTube.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-youtube-url">URL de YouTube</Label>
              <Input
                id="edit-youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingLink(null);
                setYoutubeUrl("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateLink} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={linkToDelete !== null}
        onOpenChange={() => setLinkToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar vídeo de YouTube?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El vídeo se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                linkToDelete !== null && handleRemoveLink(linkToDelete)
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
