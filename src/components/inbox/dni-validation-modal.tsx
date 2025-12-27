"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Search, User, AlertCircle, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export interface DNIAnalysisData {
  fullName?: string;
  documentNumber?: string;
  birthDate?: string;
  expiryDate?: string;
  address?: string;
}

interface Contact {
  contactId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  nif?: string | null;
}

interface DNIValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: DNIAnalysisData;
  suggestedContactId?: number;
  onConfirm: (contactId: number, data: DNIAnalysisData) => Promise<void>;
}

type ModalStep = "review" | "select-contact" | "saving" | "success";

export function DNIValidationModal({
  isOpen,
  onClose,
  analysisData,
  suggestedContactId,
  onConfirm,
}: DNIValidationModalProps) {
  const [step, setStep] = useState<ModalStep>("review");
  const [editedData, setEditedData] = useState<DNIAnalysisData>(analysisData);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    suggestedContactId ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("review");
      setEditedData(analysisData);
      setIsEditing(false);
      setSelectedContactId(suggestedContactId ?? null);
      setSearchQuery("");
      setContacts([]);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, analysisData, suggestedContactId]);

  // Fetch contacts when searching
  useEffect(() => {
    if (step !== "select-contact") return;

    const fetchContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }
        params.set("limit", "20");

        const response = await fetch(`/api/contacts/search?${params.toString()}`);
        if (response.ok) {
          const data = (await response.json()) as { contacts: Contact[] };
          setContacts(data.contacts);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    const debounce = setTimeout(() => {
      void fetchContacts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [step, searchQuery]);

  const handleEditField = (field: keyof DNIAnalysisData, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleConfirmReview = () => {
    if (selectedContactId) {
      // Already have a contact selected, proceed to save
      void handleSave();
    } else {
      // Need to select a contact
      setStep("select-contact");
    }
  };

  const handleSelectContact = (contactId: number) => {
    setSelectedContactId(contactId);
  };

  const handleConfirmContact = () => {
    if (selectedContactId) {
      void handleSave();
    }
  };

  const handleSave = async () => {
    if (!selectedContactId) {
      setError("Por favor, selecciona un contacto");
      return;
    }

    setStep("saving");
    setIsSaving(true);
    setError(null);

    try {
      await onConfirm(selectedContactId, editedData);
      setStep("success");
      toast.success("Datos del DNI guardados correctamente");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar los datos";
      setError(errorMessage);
      toast.error("Error al guardar", { description: errorMessage });
      setStep("review");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnyData =
    editedData.fullName ??
    editedData.documentNumber ??
    editedData.birthDate ??
    editedData.expiryDate ??
    editedData.address;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "review" && "Datos extraídos del DNI/NIE"}
            {step === "select-contact" && "Seleccionar contacto"}
            {step === "saving" && "Guardando..."}
            {step === "success" && "Guardado"}
          </DialogTitle>
          <DialogDescription>
            {step === "review" &&
              "Revisa los datos extraídos y confirma para guardarlos"}
            {step === "select-contact" &&
              "Selecciona el contacto que quieres actualizar"}
          </DialogDescription>
        </DialogHeader>

        {/* Review Step */}
        {step === "review" && (
          <div className="space-y-4">
            {!hasAnyData ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No se pudieron extraer datos del documento.
                  <br />
                  Asegúrate de que es un DNI/NIE legible.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isEditing
                      ? "Edita los campos que necesites corregir"
                      : "Haz clic en el botón de editar para modificar"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-8"
                  >
                    <Edit2 className="mr-1 h-3 w-3" />
                    {isEditing ? "Listo" : "Editar"}
                  </Button>
                </div>

                <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Nombre completo
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedData.fullName ?? ""}
                        onChange={(e) =>
                          handleEditField("fullName", e.target.value)
                        }
                        placeholder="Nombre completo"
                      />
                    ) : (
                      <p className="font-medium">
                        {editedData.fullName ?? "-"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Número DNI/NIE
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedData.documentNumber ?? ""}
                        onChange={(e) =>
                          handleEditField("documentNumber", e.target.value)
                        }
                        placeholder="12345678A"
                      />
                    ) : (
                      <p className="font-medium">
                        {editedData.documentNumber ?? "-"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Fecha de nacimiento
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.birthDate ?? ""}
                          onChange={(e) =>
                            handleEditField("birthDate", e.target.value)
                          }
                          placeholder="DD/MM/YYYY"
                        />
                      ) : (
                        <p className="font-medium">
                          {editedData.birthDate ?? "-"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Fecha de caducidad
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.expiryDate ?? ""}
                          onChange={(e) =>
                            handleEditField("expiryDate", e.target.value)
                          }
                          placeholder="DD/MM/YYYY"
                        />
                      ) : (
                        <p className="font-medium">
                          {editedData.expiryDate ?? "-"}
                        </p>
                      )}
                    </div>
                  </div>

                  {(isEditing || editedData.address) && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Dirección
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedData.address ?? ""}
                          onChange={(e) =>
                            handleEditField("address", e.target.value)
                          }
                          placeholder="Dirección"
                        />
                      ) : (
                        <p className="font-medium">{editedData.address}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Suggested contact - show option to change */}
                {suggestedContactId && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="text-sm text-muted-foreground">
                      Guardar en el contacto asociado al hilo
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => {
                        setSelectedContactId(null);
                        setStep("select-contact");
                      }}
                    >
                      Seleccionar otro contacto
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Select Contact Step */}
        {step === "select-contact" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contacto..."
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron contactos"
                    : "Busca un contacto para comenzar"}
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {contacts.map((contact) => {
                    const isSelected = selectedContactId === contact.contactId;
                    return (
                      <Card
                        key={contact.contactId}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary/40",
                          isSelected &&
                            "border-primary border-2 bg-primary/5 ring-2 ring-primary/20"
                        )}
                        onClick={() => handleSelectContact(contact.contactId)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {contact.email ?? contact.phone ?? "Sin contacto"}
                              </p>
                            </div>
                            {contact.nif && (
                              <span className="text-xs text-muted-foreground">
                                {contact.nif}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Saving Step */}
        {step === "saving" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Guardando datos del DNI/NIE...
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-green-600">
              Datos guardados correctamente
            </p>
          </div>
        )}

        {/* Footer */}
        {step === "review" && hasAnyData && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReview} disabled={isSaving}>
              {suggestedContactId ? "Guardar" : "Seleccionar contacto"}
            </Button>
          </DialogFooter>
        )}

        {step === "review" && !hasAnyData && (
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        )}

        {step === "select-contact" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("review")}>
              Atrás
            </Button>
            <Button
              onClick={handleConfirmContact}
              disabled={!selectedContactId || isSaving}
            >
              Guardar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
