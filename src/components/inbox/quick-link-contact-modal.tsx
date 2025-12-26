"use client";

import { CreateContactFromEmailModal } from "./create-contact-from-email-modal";
import type { InboxContact, ThreadContext } from "./inbox-types";

interface QuickLinkContactModalProps {
  contact: InboxContact | null;
  threadId: string;
  currentContext?: ThreadContext;
  isOpen: boolean;
  onClose: () => void;
  onCreateContact: (
    contact: InboxContact,
    threadId: string,
    listingId?: bigint,
    contactType?: "owner" | "buyer",
  ) => Promise<void>;
  onAssignListing: (
    threadId: string,
    contactId: bigint,
    listingId: bigint | null,
    contactType?: "owner" | "buyer",
  ) => Promise<boolean>;
}

export function QuickLinkContactModal({
  contact,
  threadId,
  currentContext,
  isOpen,
  onClose,
  onCreateContact,
  onAssignListing,
}: QuickLinkContactModalProps) {
  return (
    <CreateContactFromEmailModal
      contact={contact}
      threadId={threadId}
      currentContext={currentContext}
      isOpen={isOpen}
      onClose={onClose}
      onCreateContact={onCreateContact}
      onAssignListing={onAssignListing}
    />
  );
}
