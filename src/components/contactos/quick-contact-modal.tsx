"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Loader2, X } from "lucide-react";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import { DuplicateWarningDialog } from "~/components/contactos/duplicate-warning-dialog";
import { createContact } from "~/server/queries/contact";
import type { DuplicateContact } from "~/lib/contact-duplicate-detection";
import type { Contact } from "~/lib/data";

interface QuickContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contact: Contact) => void;
  initialData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  source: string;
}

const initialFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  source: "",
};

export function QuickContactModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: QuickContactModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateContacts, setDuplicateContacts] = useState<DuplicateContact[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: initialData?.firstName ?? "",
        lastName: initialData?.lastName ?? "",
        email: initialData?.email ?? "",
        phone: initialData?.phone ?? "",
        notes: "",
        source: "",
      });
      setShowDuplicateDialog(false);
      setDuplicateContacts([]);
    } else {
      setFormData(initialFormData);
      setShowDuplicateDialog(false);
      setDuplicateContacts([]);
    }
  }, [open, initialData]);

  const updateFormData = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange =
    (field: keyof ContactFormData) => (value: string) => {
      updateFormData(field, value);
    };

  const handleEventInputChange =
    (field: keyof ContactFormData) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateFormData(field, e.target.value);
    };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      alert("Por favor, introduce el nombre.");
      return false;
    }
    if (!formData.lastName.trim()) {
      alert("Por favor, introduce el apellido.");
      return false;
    }
    if (!formData.email.trim() && !formData.phone.trim()) {
      alert("Por favor, introduce al menos un email o teléfono.");
      return false;
    }
    // Basic email validation if provided
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      alert("Por favor, introduce un email válido.");
      return false;
    }
    return true;
  };

  const handleCreateContact = async (bypassDuplicateCheck = false) => {
    if (!validateForm()) return;

    try {
      setIsCreating(true);

      // Prepare contact data
      const contactData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nif: undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        source: formData.source || undefined,
        additionalInfo: {
          notes: formData.notes.trim() || undefined,
        },
        orgId: BigInt(1),
        isActive: true,
      };

      const result = await createContact(
        contactData as Omit<Contact, "contactId" | "createdAt" | "updatedAt">,
        bypassDuplicateCheck,
      );

      // Check if result is a duplicate error
      if ("error" in result && result.error === "DUPLICATE_FOUND") {
        setDuplicateContacts(result.duplicates);
        setShowDuplicateDialog(true);
        setIsCreating(false);
        return;
      }

      // At this point, result is a Contact
      const newContact = result as Contact;

      // Success - close modal and call callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newContact);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error al crear el contacto. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExistingContact = (contactId: number) => {
    // Close modals and navigate to existing contact
    setShowDuplicateDialog(false);
    onOpenChange(false);
    router.push(`/contactos/${contactId}`);
  };

  const handleCreateAnyway = () => {
    setShowDuplicateDialog(false);
    // Retry creation with bypass flag
    void handleCreateContact(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Crear Contacto
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2 pb-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FloatingLabelInput
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                placeholder="Nombre"
                required
              />
              <FloatingLabelInput
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                placeholder="Apellidos"
                required
              />
            </div>

            {/* Contact Info */}
            <FloatingLabelInput
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="Email"
            />

            <FloatingLabelInput
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              placeholder="Teléfono"
            />

            {/* Notes with Voice Input */}
            <div className="space-y-2">
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-900"
              >
                Notas adicionales
              </Label>
              <div className="relative">
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleEventInputChange("notes")}
                  placeholder="Información adicional sobre el contacto..."
                  rows={4}
                  className="resize-none border-gray-200 pr-10 focus:border-amber-300 focus:ring-amber-200"
                />
                <div className="absolute right-2 top-2">
                  <PushToTalkWhisperButton
                    onTranscript={(text) => {
                      handleEventInputChange("notes")({
                        target: {
                          value: formData.notes
                            ? `${formData.notes} ${text}`.trim()
                            : text,
                        },
                      } as React.ChangeEvent<HTMLTextAreaElement>);
                    }}
                    language="es"
                  />
                </div>
              </div>
            </div>

            {/* Source Dropdown */}
            <div className="space-y-2">
              <Label
                htmlFor="source"
                className="text-sm font-medium text-gray-900"
              >
                Origen
              </Label>
              <Select
                value={formData.source}
                onValueChange={(value) => updateFormData("source", value)}
              >
                <SelectTrigger
                  id="source"
                  className="border-gray-200 focus:border-amber-300 focus:ring-amber-200"
                  isPlaceholder={!formData.source}
                >
                  <SelectValue placeholder="Selecciona el origen del contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Sitio Web</SelectItem>
                  <SelectItem value="Walk-In">Visita Presencial</SelectItem>
                  <SelectItem value="Referral">Referido</SelectItem>
                  <SelectItem value="Phone Call">Llamada Telefónica</SelectItem>
                  <SelectItem value="Email">Correo Electrónico</SelectItem>
                  <SelectItem value="Social Media">Redes Sociales</SelectItem>
                  <SelectItem value="Portal">Portal Inmobiliario</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleCreateContact(false)}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Contacto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        duplicates={duplicateContacts}
        onUseExisting={handleUseExistingContact}
        onCreateAnyway={handleCreateAnyway}
      />
    </>
  );
}
