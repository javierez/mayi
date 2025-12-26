"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building,
  Home,
  Store,
  Car,
  MapPin,
  Layers,
  Loader2,
} from "lucide-react";
import {
  createPropertyDescriptionExample,
  updatePropertyDescriptionExample,
  deletePropertyDescriptionExample,
  togglePropertyDescriptionExampleActive,
  type PropertyDescriptionExample,
} from "~/server/queries/property-description-examples";
import { analyzeDescriptionExamples } from "~/server/actions/description-analyzer";
import { useToast } from "~/components/hooks/use-toast";

const PROPERTY_TYPES = [
  { value: "all", label: "Todos los tipos", icon: Layers },
  { value: "piso", label: "Piso", icon: Building },
  { value: "casa", label: "Casa", icon: Home },
  { value: "local", label: "Local", icon: Store },
  { value: "garaje", label: "Garaje", icon: Car },
  { value: "solar", label: "Solar", icon: MapPin },
] as const;

const LISTING_TYPES = [
  { value: "all", label: "Todos" },
  { value: "Sale", label: "Venta" },
  { value: "Rent", label: "Alquiler" },
] as const;

interface Props {
  initialExamples: PropertyDescriptionExample[];
}

export default function EjemplosDescripcionClient({ initialExamples }: Props) {
  const { toast } = useToast();
  const [examples, setExamples] =
    useState<PropertyDescriptionExample[]>(initialExamples);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedListingType, setSelectedListingType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExample, setEditingExample] =
    useState<PropertyDescriptionExample | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("piso");
  const [formListingType, setFormListingType] = useState<string | null>(null);
  const [formExampleText, setFormExampleText] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Track which examples are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter examples by selected property type and listing type
  const filteredExamples = examples.filter((ex) => {
    const matchesPropertyType =
      selectedPropertyType === "all" ||
      ex.propertyType === selectedPropertyType ||
      ex.propertyType === "all";
    const matchesListingType =
      selectedListingType === "all" ||
      ex.listingType === selectedListingType ||
      ex.listingType === null;
    return matchesPropertyType && matchesListingType;
  });

  // Count examples per property type
  const getCountForPropertyType = (type: string) => {
    const filtered = examples.filter((ex) => {
      const matchesListingType =
        selectedListingType === "all" ||
        ex.listingType === selectedListingType ||
        ex.listingType === null;
      if (!matchesListingType) return false;
      if (type === "all") return true;
      return ex.propertyType === type || ex.propertyType === "all";
    });
    return filtered.length;
  };

  // Count examples per listing type
  const getCountForListingType = (type: string) => {
    const filtered = examples.filter((ex) => {
      const matchesPropertyType =
        selectedPropertyType === "all" ||
        ex.propertyType === selectedPropertyType ||
        ex.propertyType === "all";
      if (!matchesPropertyType) return false;
      if (type === "all") return true;
      return ex.listingType === type || ex.listingType === null;
    });
    return filtered.length;
  };

  const selectedPropertyTypeLabel =
    PROPERTY_TYPES.find((t) => t.value === selectedPropertyType)?.label ?? "Todos";
  const selectedListingTypeLabel =
    LISTING_TYPES.find((t) => t.value === selectedListingType)?.label ?? "Todos";

  // Check if any examples are missing metadata
  const hasExamplesWithoutMetadata = examples.some(
    (ex) => !ex.metadata || Object.keys(ex.metadata).length === 0
  );

  const handleAnalyzeDescriptions = async () => {
    setAnalyzing(true);
    try {
      // Get IDs of examples without metadata
      const idsToAnalyze = examples
        .filter((ex) => !ex.metadata || Object.keys(ex.metadata).length === 0)
        .map((ex) => ex.id);

      const result = await analyzeDescriptionExamples(idsToAnalyze);

      if (result.success) {
        toast({
          title: "Análisis completado",
          description: `Se analizaron ${result.totalAnalyzed} ejemplos y se encontraron ${result.totalFieldsFound} campos`,
        });
        // Refresh the page to get updated metadata
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: result.error ?? "Error al analizar las descripciones",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing descriptions:", error);
      toast({
        title: "Error",
        description: "Error inesperado al analizar las descripciones",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormPropertyType("piso");
    setFormListingType(null);
    setFormExampleText("");
    setFormIsActive(true);
    setEditingExample(null);
  };

  const openAddDialog = () => {
    resetForm();
    // Pre-fill with current filters
    setFormPropertyType(selectedPropertyType === "all" ? "piso" : selectedPropertyType);
    setFormListingType(selectedListingType === "all" ? null : selectedListingType);
    setDialogOpen(true);
  };

  const openEditDialog = (example: PropertyDescriptionExample) => {
    setEditingExample(example);
    setFormTitle(example.title ?? "");
    setFormPropertyType(example.propertyType);
    setFormListingType(example.listingType);
    setFormExampleText(example.exampleText);
    setFormIsActive(example.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formExampleText.trim()) {
      toast({
        title: "Error",
        description: "El texto del ejemplo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingExample) {
        // Update existing
        const result = await updatePropertyDescriptionExample(
          editingExample.id,
          {
            title: formTitle || null,
            propertyType: formPropertyType,
            listingType: formListingType,
            exampleText: formExampleText,
            isActive: formIsActive,
          },
        );

        if (result.success) {
          setExamples((prev) =>
            prev.map((ex) =>
              ex.id === editingExample.id
                ? {
                    ...ex,
                    title: formTitle || null,
                    propertyType: formPropertyType,
                    listingType: formListingType,
                    exampleText: formExampleText,
                    isActive: formIsActive,
                    updatedAt: new Date(),
                  }
                : ex,
            ),
          );
          toast({ title: "Ejemplo actualizado correctamente" });
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        // Create new
        const result = await createPropertyDescriptionExample({
          title: formTitle || null,
          propertyType: formPropertyType,
          listingType: formListingType,
          exampleText: formExampleText,
          isActive: formIsActive,
        });

        if (result.success) {
          // Refresh the page to get the new example with its ID
          window.location.reload();
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        }
      }

      setDialogOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este ejemplo?")) {
      return;
    }

    const result = await deletePropertyDescriptionExample(id);
    if (result.success) {
      setExamples((prev) => prev.filter((ex) => ex.id !== id));
      toast({ title: "Ejemplo eliminado correctamente" });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: bigint, currentActive: boolean) => {
    const result = await togglePropertyDescriptionExampleActive(
      id,
      !currentActive,
    );
    if (result.success) {
      setExamples((prev) =>
        prev.map((ex) =>
          ex.id === id ? { ...ex, isActive: !currentActive } : ex,
        ),
      );
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ejemplos de Descripción
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los ejemplos que usa la IA para generar descripciones de
            propiedades
          </p>
        </div>
        <div className="flex gap-2">
          {hasExamplesWithoutMetadata && examples.length > 0 && (
            <Button
              variant="outline"
              onClick={handleAnalyzeDescriptions}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar descripciones"
              )}
            </Button>
          )}
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ejemplo
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Property Types */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tipo de Propiedad</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {PROPERTY_TYPES.map((type) => {
                  const count = getCountForPropertyType(type.value);
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedPropertyType(type.value)}
                      className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                        selectedPropertyType === type.value ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          selectedPropertyType === type.value
                            ? "font-medium text-gray-900"
                            : "text-gray-600"
                        }`}>
                          {type.label}
                        </span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Listing Types */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tipo de Operación</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {LISTING_TYPES.map((type) => {
                  const count = getCountForListingType(type.value);
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedListingType(type.value)}
                      className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                        selectedListingType === type.value ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          selectedListingType === type.value
                            ? "font-medium text-gray-900"
                            : "text-gray-600"
                        }`}>
                          {type.label}
                        </span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Examples List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedPropertyType === "all" && selectedListingType === "all"
                  ? "Todos los ejemplos"
                  : `Ejemplos: ${selectedPropertyTypeLabel}${selectedListingType !== "all" ? ` · ${selectedListingTypeLabel}` : ""}`}
              </CardTitle>
              <CardDescription>
                {filteredExamples.length} ejemplo
                {filteredExamples.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExamples.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">
                    No hay ejemplos para este tipo de propiedad
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={openAddDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir ejemplo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExamples.map((example) => {
                    const exampleId = String(example.id);
                    const isExpanded = expandedIds.has(exampleId);
                    const textLines = example.exampleText.split("\n");
                    const hasMoreLines = textLines.length > 3;

                    return (
                      <div
                        key={exampleId}
                        className={`rounded border transition-all ${
                          example.isActive
                            ? "border-gray-200"
                            : "border-gray-100 opacity-60"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400 font-mono truncate">
                              {example.title ?? "SIN TÍTULO"}
                            </span>
                            {example.propertyType === "all" && (
                              <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-blue-500">
                                todos
                              </span>
                            )}
                            {example.listingType && (
                              <span className={`flex-shrink-0 text-[10px] uppercase tracking-wide ${
                                example.listingType === "Sale" ? "text-green-600" : "text-orange-500"
                              }`}>
                                {example.listingType === "Sale" ? "venta" : "alquiler"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Switch
                              checked={example.isActive}
                              onCheckedChange={() =>
                                handleToggleActive(example.id, example.isActive)
                              }
                              className="scale-90 data-[state=checked]:bg-slate-600"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(example)}
                            >
                              <Edit className="h-3.5 w-3.5 text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(example.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Description text */}
                        <div className="border-t border-gray-100 px-4 py-3">
                          <p
                            className={`whitespace-pre-wrap text-sm text-gray-600 leading-relaxed ${
                              !isExpanded && hasMoreLines ? "line-clamp-3" : ""
                            }`}
                          >
                            {example.exampleText}
                          </p>

                          {/* Show more/less toggle */}
                          {hasMoreLines && (
                            <button
                              onClick={() => toggleExpanded(exampleId)}
                              className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                            >
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                              {isExpanded ? "ver menos" : "ver más"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExample ? "Editar Ejemplo" : "Nuevo Ejemplo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej: Piso moderno centro ciudad"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyType">Tipo de Propiedad</Label>
                <Select
                  value={formPropertyType}
                  onValueChange={setFormPropertyType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="listingType">Tipo de Operación</Label>
                <Select
                  value={formListingType ?? "none"}
                  onValueChange={(v) => setFormListingType(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ambos (Venta y Alquiler)</SelectItem>
                    <SelectItem value="Sale">Solo Venta</SelectItem>
                    <SelectItem value="Rent">Solo Alquiler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Selecciona &quot;Todos los tipos&quot; y &quot;Ambos&quot; para que el ejemplo se use en cualquier propiedad
            </p>
            <div>
              <Label htmlFor="exampleText">Texto del Ejemplo</Label>
              <Textarea
                id="exampleText"
                value={formExampleText}
                onChange={(e) => setFormExampleText(e.target.value)}
                rows={10}
                placeholder="Escribe aquí un ejemplo de descripción de propiedad que quieras que la IA use como referencia de estilo..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
                className="data-[state=checked]:bg-slate-600"
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
