"use client";

import { ContactSolicitudes } from "../contact-solicitudes";

interface ContactSolicitudesTabProps {
  contactId: bigint;
}

export function ContactSolicitudesTab({ contactId }: ContactSolicitudesTabProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <ContactSolicitudes contactId={contactId} />
    </div>
  );
}
