"use client";

import { CreateContactFromEmailModal } from "./create-contact-from-email-modal";
import type { InboxContact } from "./inbox-types";

interface QuickLinkContactModalProps {
  contact: InboxContact | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    contact: InboxContact,
    listingId?: bigint,
    contactType?: "owner" | "buyer",
  ) => Promise<void>;
}

export function QuickLinkContactModal({
  contact,
  isOpen,
  onClose,
  onConfirm,
}: QuickLinkContactModalProps) {
  return (
    <CreateContactFromEmailModal
      contact={contact}
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
