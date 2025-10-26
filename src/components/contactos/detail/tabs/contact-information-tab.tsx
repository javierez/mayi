"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { ContactBasicInfoCard } from "../cards/contact-basic-info-card";
import { ContactDetailsCard } from "../cards/contact-details-card";
import { ContactNotesCard } from "../cards/contact-notes-card";
import { DeleteConfirmationModal } from "~/components/ui/delete-confirmation-modal";
import { updateContactWithAuth, softDeleteContactWithAuth, deleteContactWithAuth } from "~/server/queries/contact";
import { canDeleteContacts } from "~/app/actions/permissions/check-permissions";

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";

interface ModuleState {
  saveState: SaveState;
  hasChanges: boolean;
  lastSaved?: Date;
}

type ModuleName = "basicInfo" | "contactDetails" | "notes";

interface ContactInformationTabProps {
  contact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    nif?: string;
    source?: string;
    email?: string;
    phone?: string;
    phoneNotes?: string;
    secondaryPhone?: string;
    secondaryPhoneNotes?: string;
    additionalInfo?: {
      notes?: string;
      [key: string]: unknown;
    };
  };
  canEdit: boolean;
}

export function ContactInformationTab({ contact, canEdit }: ContactInformationTabProps) {
  const router = useRouter();

  // Module states
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({
    basicInfo: { saveState: "idle", hasChanges: false },
    contactDetails: { saveState: "idle", hasChanges: false },
    notes: { saveState: "idle", hasChanges: false },
  });

  // Form states
  const [firstName, setFirstName] = useState(contact.firstName ?? "");
  const [lastName, setLastName] = useState(contact.lastName ?? "");
  const [nif, setNif] = useState(contact.nif ?? "");
  const [source, setSource] = useState(contact.source ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [phoneNotes, setPhoneNotes] = useState(contact.phoneNotes ?? "");
  const [secondaryPhone, setSecondaryPhone] = useState(contact.secondaryPhone ?? "");
  const [secondaryPhoneNotes, setSecondaryPhoneNotes] = useState(contact.secondaryPhoneNotes ?? "");
  const additionalInfo = contact.additionalInfo ?? {};

  // Notes state
  const [notes, setNotes] = useState(additionalInfo.notes ?? "");

  // Permission states
  const [canDelete, setCanDelete] = useState<boolean>(false);

  // Modal states
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Function to update module state
  const updateModuleState = (moduleName: ModuleName, hasChanges: boolean) => {
    setModuleStates((prev) => ({
      ...prev,
      [moduleName]: {
        saveState: hasChanges ? "modified" : "idle",
        hasChanges,
        lastSaved: prev[moduleName]?.lastSaved,
      },
    }));
  };

  // Function to save module data
  const saveModule = async (moduleName: ModuleName) => {
    setModuleStates((prev) => ({
      ...prev,
      [moduleName]: {
        saveState: "saving",
        hasChanges: prev[moduleName]?.hasChanges ?? false,
        lastSaved: prev[moduleName]?.lastSaved,
      },
    }));

    try {
      const contactId = Number(contact.contactId);
      let contactData = {};

      switch (moduleName) {
        case "basicInfo":
          contactData = { firstName, lastName, nif, source };
          break;
        case "contactDetails":
          contactData = { email, phone, phoneNotes, secondaryPhone, secondaryPhoneNotes };
          break;
        case "notes":
          contactData = {
            additionalInfo: { ...additionalInfo, notes },
          };
          break;
      }

      await updateContactWithAuth(contactId, contactData);

      setModuleStates((prev) => ({
        ...prev,
        [moduleName]: {
          saveState: "saved",
          hasChanges: false,
          lastSaved: new Date(),
        },
      }));

      toast.success("Cambios guardados correctamente");

      setTimeout(() => {
        setModuleStates((prev) => ({
          ...prev,
          [moduleName]: {
            saveState: "idle",
            hasChanges: prev[moduleName]?.hasChanges ?? false,
            lastSaved: prev[moduleName]?.lastSaved,
          },
        }));
      }, 2000);
    } catch (error) {
      console.error(`Error saving ${moduleName}:`, error);

      setModuleStates((prev) => ({
        ...prev,
        [moduleName]: {
          saveState: "error",
          hasChanges: prev[moduleName]?.hasChanges ?? false,
          lastSaved: prev[moduleName]?.lastSaved,
        },
      }));

      toast.error("Error al guardar los cambios");

      setTimeout(() => {
        setModuleStates((prev) => {
          const currentModule = prev[moduleName];
          return {
            ...prev,
            [moduleName]: {
              saveState: currentModule?.hasChanges ? "modified" : "idle",
              hasChanges: currentModule?.hasChanges ?? false,
              lastSaved: currentModule?.lastSaved,
            },
          };
        });
      }, 3000);
    }
  };

  const getCardStyles = (moduleName: ModuleName) => {
    const state = moduleStates[moduleName]?.saveState;
    switch (state) {
      case "modified":
        return "ring-2 ring-yellow-500/20 shadow-lg shadow-yellow-500/10 border-yellow-500/20";
      case "saving":
        return "ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 border-amber-500/20";
      case "saved":
        return "ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 border-emerald-500/20";
      case "error":
        return "ring-2 ring-red-500/20 shadow-lg shadow-red-500/10 border-red-500/20";
      default:
        return "hover:shadow-lg transition-all duration-300";
    }
  };

  // Fetch delete permission on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const hasDeletePermission = await canDeleteContacts();
        setCanDelete(hasDeletePermission);
      } catch (error) {
        console.error("❌ Error fetching delete permission:", error);
        setCanDelete(false);
      }
    };

    void fetchPermissions();
  }, []);

  // Handler for deactivating contact (soft delete)
  const handleDeactivateContact = async () => {
    if (!contact.contactId) {
      toast.error("No se pudo encontrar el contacto a dar de baja");
      return;
    }

    setIsDeactivating(true);

    try {
      const result = await softDeleteContactWithAuth(Number(contact.contactId));

      if (result.success) {
        toast.success("Contacto dado de baja correctamente");
        // Redirect to contacts list after successful deactivation
        router.push("/contactos");
      } else {
        toast.error("Error al dar de baja el contacto");
      }
    } catch (error) {
      console.error("Error deactivating contact:", error);
      toast.error("Error al dar de baja el contacto");
    } finally {
      setIsDeactivating(false);
      setIsDeactivateModalOpen(false);
    }
  };

  // Handler for permanently deleting contact
  const handleDeleteContact = async () => {
    if (!contact.contactId) {
      toast.error("No se pudo encontrar el contacto a eliminar");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteContactWithAuth(Number(contact.contactId));

      if (result.success) {
        toast.success("Contacto eliminado correctamente");
        // Redirect to contacts list after successful deletion
        router.push("/contactos");
      } else {
        toast.error("Error al eliminar el contacto");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Error al eliminar el contacto");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Basic Information */}
        <ContactBasicInfoCard
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          nif={nif}
          setNif={setNif}
          source={source}
          setSource={setSource}
          saveState={moduleStates.basicInfo?.saveState ?? "idle"}
          onSave={() => saveModule("basicInfo")}
          onUpdateModule={(hasChanges) => updateModuleState("basicInfo", hasChanges)}
          getCardStyles={getCardStyles}
          canEdit={canEdit}
        />

        {/* Contact Details */}
        <ContactDetailsCard
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          phoneNotes={phoneNotes}
          setPhoneNotes={setPhoneNotes}
          secondaryPhone={secondaryPhone}
          setSecondaryPhone={setSecondaryPhone}
          secondaryPhoneNotes={secondaryPhoneNotes}
          setSecondaryPhoneNotes={setSecondaryPhoneNotes}
          saveState={moduleStates.contactDetails?.saveState ?? "idle"}
          onSave={() => saveModule("contactDetails")}
          onUpdateModule={(hasChanges) => updateModuleState("contactDetails", hasChanges)}
          getCardStyles={getCardStyles}
          canEdit={canEdit}
        />
      </div>

      {/* Notes Section */}
      <ContactNotesCard
        notes={notes}
        setNotes={setNotes}
        saveState={moduleStates.notes?.saveState ?? "idle"}
        onSave={() => saveModule("notes")}
        onUpdateModule={(hasChanges) => updateModuleState("notes", hasChanges)}
        getCardStyles={getCardStyles}
        canEdit={canEdit}
      />

      {/* Action Buttons - Deactivate and Delete Contact */}
      {(canEdit || canDelete) && (
        <div className="mt-6">
          <div className="flex justify-center gap-4 flex-wrap">
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeactivateModalOpen(true)}
                className="text-gray-600 hover:text-gray-800"
              >
                Dar de baja
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Eliminar contacto
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onConfirm={handleDeactivateContact}
        title="¿Dar de baja contacto?"
        description="Esta acción marcará el contacto como inactivo. Podrás reactivarlo más tarde si es necesario. No se eliminarán datos."
        confirmText="Dar de baja"
        loadingText="Dando de baja..."
        variant="default"
        isDeleting={isDeactivating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteContact}
        title="¿Eliminar contacto?"
        description="Esta acción eliminará permanentemente el contacto y todos sus datos asociados. No se puede deshacer."
        confirmText="Eliminar"
        loadingText="Eliminando..."
        variant="destructive"
        isDeleting={isDeleting}
      />
    </div>
  );
}
