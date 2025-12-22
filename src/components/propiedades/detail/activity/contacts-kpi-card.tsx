"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { ContactsKPIProps } from "~/types/activity";
import { CreateContactModal } from "~/components/contactos/create-contact-modal";
import type { Contact } from "~/lib/data";

interface ContactsKPICardProps extends ContactsKPIProps {
  isActive: boolean;
  onClick: () => void;
  listingId: bigint;
  onContactCreated?: () => void | Promise<void>;
}

export function ContactsKPICard({
  contactsWithVisitsCount,
  contactsWithoutVisitsCount,
  contactsInOfferStageCount,
  totalContactsCount,
  isActive,
  onClick,
  listingId,
  onContactCreated,
}: ContactsKPICardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleAddContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreateModalOpen(true);
  };

  const handleContactSuccess = async (contact: Contact) => {
    console.log("Contact created:", contact);
    setIsCreateModalOpen(false);
    if (onContactCreated) {
      await onContactCreated();
    }
  };

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full flex-col items-center rounded-2xl p-6 transition-all duration-200 ${
          isActive ? "bg-gray-100 shadow-xl" : "bg-white shadow hover:shadow-lg"
        }`}
        onClick={onClick}
        type="button"
      >
        {/* Total */}
        <div className="mb-4">
          <span className="text-4xl font-bold text-primary">
            {totalContactsCount}
          </span>
        </div>

        {/* Label */}
        <span className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Conexiones
        </span>

        {/* Breakdown Stats */}
        <div className="flex w-full items-center justify-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-rose-400 to-orange-400" />
            <span className="text-[10px] uppercase tracking-wide text-gray-600">
              {contactsWithVisitsCount} en visita
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
            <span className="text-[10px] uppercase tracking-wide text-gray-600">
              {contactsInOfferStageCount} negociación
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
            <span className="text-[10px] uppercase tracking-wide text-gray-600">
              {contactsWithoutVisitsCount} visita pendiente
            </span>
          </div>
        </div>
      </motion.button>

      {/* Quick Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddContact}
        className="flex w-full flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
        type="button"
      >
        <Plus className="mb-2 h-6 w-6" />
        <span className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-600">
          Añadir Contacto
        </span>
      </motion.button>

      {/* Create Contact Modal */}
      <CreateContactModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleContactSuccess}
        initialData={{
          listingId,
          contactType: "buyer",
        }}
      />
    </div>
  );
}
