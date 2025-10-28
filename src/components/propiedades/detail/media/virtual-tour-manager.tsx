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
  Glasses,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { PropertyImage } from "~/lib/data";
import {
  addVirtualTourLink,
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

interface VirtualTourManagerProps {
  virtualTours: PropertyImage[];
  propertyId: bigint;
  referenceNumber: string;
  onVirtualTourAdded?: (tour: PropertyImage) => void;
  canEdit?: boolean;
}

export function VirtualTourManager({
  virtualTours: initialVirtualTours,
  propertyId,
  referenceNumber,
  onVirtualTourAdded,
  canEdit = true,
}: VirtualTourManagerProps) {
  const [virtualTours, setVirtualTours] =
    useState<PropertyImage[]>(initialVirtualTours);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<PropertyImage | null>(null);
  const [tourUrl, setTourUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTours, setSelectedTours] = useState<Set<number>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState<Set<number>>(
    new Set(),
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingTours, setPendingTours] = useState<PropertyImage[]>([]);

  const handleAddVirtualTour = async () => {
    if (!tourUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const newTour = await addVirtualTourLink(
        tourUrl,
        propertyId,
        referenceNumber,
      );
      setVirtualTours((prev) => [...prev, newTour]);
      onVirtualTourAdded?.(newTour);
      setTourUrl("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding virtual tour:", error);
      alert(
        error instanceof Error ? error.message : "Error adding virtual tour",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTour = (tour: PropertyImage) => {
    setEditingTour(tour);
    setTourUrl(tour.imageUrl);
  };

  const handleUpdateTour = async () => {
    if (!editingTour || !tourUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const newTour = await addVirtualTourLink(
        tourUrl,
        propertyId,
        referenceNumber,
      );
      // Delete the old tour
      await deletePropertyImage(editingTour.imageKey, propertyId);
      // Update the list
      setVirtualTours((prev) =>
        prev.map((tour) =>
          tour.propertyImageId === editingTour.propertyImageId ? newTour : tour,
        ),
      );
      setEditingTour(null);
      setTourUrl("");
    } catch (error) {
      console.error("Error updating virtual tour:", error);
      alert(
        error instanceof Error ? error.message : "Error updating virtual tour",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTour = async (index: number) => {
    const tourToRemove = virtualTours[index];
    if (!tourToRemove) return;

    setIsDeleting(true);
    try {
      await deletePropertyImage(tourToRemove.imageKey, propertyId);
      setVirtualTours(virtualTours.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting virtual tour:", error);
    } finally {
      setIsDeleting(false);
      setTourToDelete(null);
    }
  };

  const toggleTourSelection = (index: number) => {
    setSelectedTours((prev) => {
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
    const selectedToursList = Array.from(selectedTours);
    setIsDeleting(true);
    try {
      for (const index of selectedToursList) {
        const tour = virtualTours[index];
        if (tour) {
          await deletePropertyImage(tour.imageKey, propertyId);
        }
      }
      setVirtualTours(virtualTours.filter((_, i) => !selectedTours.has(i)));
    } catch (error) {
      console.error("Error deleting virtual tours:", error);
    } finally {
      setIsDeleting(false);
      setSelectedTours(new Set());
      setIsSelectMode(false);
    }
  };

  const handleToggleVisibility = async (index: number) => {
    const tour = virtualTours[index];
    if (!tour) return;

    const newActiveStatus = !tour.isActive;

    setIsTogglingVisibility((prev) => new Set([...prev, index]));

    setVirtualTours((prev) =>
      prev.map((tr, i) =>
        i === index ? { ...tr, isActive: newActiveStatus } : tr,
      ),
    );

    try {
      await togglePropertyImageVisibility(
        tour.propertyImageId,
        newActiveStatus,
      );
    } catch (error) {
      console.error("Error toggling virtual tour visibility:", error);
      setVirtualTours((prev) =>
        prev.map((tr, i) =>
          i === index ? { ...tr, isActive: !newActiveStatus } : tr,
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

    const newTours = [...virtualTours];
    const draggedTour = newTours[draggedIndex];

    if (!draggedTour) return;

    newTours.splice(draggedIndex, 1);
    newTours.splice(dropIndex, 0, draggedTour);

    setVirtualTours(newTours);
    setPendingTours(newTours);
    setHasUnsavedChanges(true);

    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!hasUnsavedChanges || pendingTours.length === 0) return;

    setIsUpdatingOrder(true);

    try {
      const updates = pendingTours.map((tour, index) => ({
        propertyImageId: tour.propertyImageId,
        imageOrder: index + 1,
      }));

      await updateImageOrders(updates);

      setHasUnsavedChanges(false);
      setPendingTours([]);
    } catch (error) {
      console.error("Error updating virtual tour order:", error);
      setVirtualTours(initialVirtualTours);
      setHasUnsavedChanges(false);
      setPendingTours([]);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    setVirtualTours(initialVirtualTours);
    setHasUnsavedChanges(false);
    setPendingTours([]);
  };

  if (virtualTours.length === 0 && !isAddDialogOpen) {
    return (
      <div className="border-t pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Glasses className="h-8 w-8 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Tours Virtuales
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {canEdit && (
            <div
              onClick={() => setIsAddDialogOpen(true)}
              className="group relative flex h-40 w-full min-w-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50"
            >
              <Plus className="mb-1 h-5 w-5 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
              <span className="text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
                Añadir URL
              </span>
              <span className="text-xs text-gray-400">de tour virtual</span>
            </div>
          )}
        </div>

        {/* Add Virtual Tour Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Tour Virtual</DialogTitle>
              <DialogDescription>
                Introduce la URL del tour virtual que quieres añadir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tour-url">URL del Tour Virtual</Label>
                <Input
                  id="tour-url"
                  type="url"
                  value={tourUrl}
                  onChange={(e) => setTourUrl(e.target.value)}
                  placeholder="https://my.matterport.com/show/?m=..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setTourUrl("");
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddVirtualTour} disabled={isSubmitting}>
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
        <Glasses className="h-8 w-8 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Tours Virtuales</h3>
      </div>

      {/* Help text for drag and drop */}
      {virtualTours.length > 1 && (
        <p className="mb-4 text-center text-sm text-gray-500">
          Arrastra y suelta los tours para reordenarlos
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {virtualTours.map((tour, idx) => {
          return (
            <div
              key={tour.propertyImageId.toString()}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-100 transition-all duration-200",
                isSelectMode && "cursor-pointer",
                selectedTours.has(idx) && "ring-2 ring-primary/50",
                dragOverIndex === idx && "scale-105 ring-2 ring-blue-400",
                draggedIndex === idx && "scale-95 opacity-50",
                !isSelectMode && "cursor-move",
                !tour.isActive && "opacity-50",
              )}
              draggable={!isSelectMode && !isUpdatingOrder}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => isSelectMode && toggleTourSelection(idx)}
            >
              {/* Mock Preview Content */}
              <div className="relative h-40 w-full">
                {/* 360° Circle Pattern - positioned higher */}
                <div className="absolute inset-0 -mt-4 flex items-center justify-center">
                  <div className="relative">
                    {/* Outer circle representing 360° view */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-blue-300">
                      {/* Inner content */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                        <Glasses className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Four directional indicators around the circle */}
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-blue-400" />
                    <div className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-blue-400" />
                    <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rounded-full bg-blue-400" />
                    <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full bg-blue-400" />
                  </div>
                </div>

                {/* Label - positioned at bottom with more space */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform">
                  <div className="text-center">
                    <div className="text-xs font-medium text-blue-700">
                      Tour Virtual
                    </div>
                    <div className="text-xs text-blue-500">360°</div>
                  </div>
                </div>

                {/* Simple hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors duration-200 hover:bg-black/10 hover:opacity-100">
                  <span className="rounded bg-black/60 px-2 py-1 text-sm font-medium text-white">
                    Ver tour
                  </span>
                </div>
              </div>

              {isSelectMode ? (
                <div className="absolute left-2 top-2 rounded-full bg-white/80 p-1">
                  {selectedTours.has(idx) ? (
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
                      window.open(tour.imageUrl, "_blank");
                    }}
                    aria-label="Abrir tour virtual"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-white opacity-0 transition-all duration-200 hover:bg-red-500 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTourToDelete(idx);
                      }}
                      disabled={isDeleting}
                      aria-label="Eliminar tour"
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
                        handleEditTour(tour);
                      }}
                      aria-label="Editar tour"
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
                        tour.isActive ? "Ocultar tour" : "Mostrar tour"
                      }
                    >
                      {isTogglingVisibility.has(idx) ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : tour.isActive ? (
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

        {/* Add Virtual Tour Placeholder */}
        {canEdit && (
          <div
            onClick={() => setIsAddDialogOpen(true)}
            className="group relative flex h-40 w-full min-w-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-white transition-all duration-200 hover:bg-gray-50"
          >
            <Plus className="mb-1 h-5 w-5 text-gray-400 transition-colors duration-200 group-hover:text-gray-500" />
            <span className="text-sm font-medium text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
              Añadir URL
            </span>
            <span className="text-xs text-gray-400">de tour virtual</span>
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
                  setSelectedTours(new Set());
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
                disabled={selectedTours.size === 0 || isDeleting}
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
            <DialogTitle>Añadir Tour Virtual</DialogTitle>
            <DialogDescription>
              Introduce la URL del tour virtual que quieres añadir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tour-url">URL del Tour Virtual</Label>
              <Input
                id="tour-url"
                type="url"
                value={tourUrl}
                onChange={(e) => setTourUrl(e.target.value)}
                placeholder="https://my.matterport.com/show/?m=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setTourUrl("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddVirtualTour} disabled={isSubmitting}>
              {isSubmitting ? "Añadiendo..." : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTour}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTour(null);
            setTourUrl("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tour Virtual</DialogTitle>
            <DialogDescription>
              Modifica la URL del tour virtual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tour-url">URL del Tour Virtual</Label>
              <Input
                id="edit-tour-url"
                type="url"
                value={tourUrl}
                onChange={(e) => setTourUrl(e.target.value)}
                placeholder="https://my.matterport.com/show/?m=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTour(null);
                setTourUrl("");
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateTour} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={tourToDelete !== null}
        onOpenChange={() => setTourToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar tour virtual?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El tour virtual se eliminará
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTourToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                tourToDelete !== null && handleRemoveTour(tourToDelete)
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
