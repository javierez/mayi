import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Loader, User } from "lucide-react";
import { createContact } from "~/server/queries/contact";
import { DuplicateWarningDialog } from "~/components/contactos/duplicate-warning-dialog";
import type { DuplicateContact } from "~/lib/contact-duplicate-detection";
import { getContactByIdWithAuth } from "~/server/queries/contact";

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: (contact: unknown) => void; // Use 'unknown' instead of 'any' for type safety
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

const initialFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

export default function ContactPopup({
  isOpen,
  onClose,
  onContactCreated,
}: ContactPopupProps) {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isCreating, setIsCreating] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateContacts, setDuplicateContacts] = useState<
    DuplicateContact[]
  >([]);

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
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        additionalInfo: undefined,
        orgId: BigInt(1), // Default org ID
        isActive: true,
      };

      // Create contact using the simple createContact function
      const result = await createContact(contactData, bypassDuplicateCheck);

      // Check if result is a duplicate error
      if ("error" in result && result.error === "DUPLICATE_FOUND") {
        setDuplicateContacts(result.duplicates);
        setShowDuplicateDialog(true);
        setIsCreating(false);
        return;
      }

      const newContact = result;
      console.log("Contact created:", newContact);

      // Reset form
      setFormData(initialFormData);

      // Notify parent component
      onContactCreated(newContact);

      // Close popup
      onClose();
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Error al crear el contacto. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExistingContact = async (contactId: number) => {
    try {
      // Fetch the full contact details
      const existingContact = await getContactByIdWithAuth(contactId);

      if (existingContact) {
        // Reset form
        setFormData(initialFormData);

        // Notify parent component with existing contact
        onContactCreated(existingContact);

        // Close both dialogs
        setShowDuplicateDialog(false);
        onClose();
      }
    } catch (error) {
      console.error("Error fetching existing contact:", error);
      alert("Error al cargar el contacto existente.");
    }
  };

  const handleCreateAnyway = () => {
    // Retry creation with bypass flag
    setShowDuplicateDialog(false);
    void handleCreateContact(true);
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData(initialFormData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600" />
            <DialogTitle>Crear Nuevo Contacto</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleEventInputChange("notes")}
              placeholder="Información adicional sobre el contacto..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="text-xs text-gray-500">
            * Campos obligatorios. Debe introducir al menos email o teléfono.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleCreateContact()}
            disabled={isCreating}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {isCreating ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Contacto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        duplicates={duplicateContacts}
        onUseExisting={handleUseExistingContact}
        onCreateAnyway={handleCreateAnyway}
      />
    </Dialog>
  );
}
