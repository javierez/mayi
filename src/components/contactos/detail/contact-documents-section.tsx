"use client";

import { ContactDocumentsPage } from "./contact-documents-page";

interface ContactDocumentsSectionProps {
  contactId: bigint;
  folderType:
    | "documentacion-inicial"
    | "visitas"
    | "otros"
    | "planos"
    | "certificado-energetico"
    | "escrituras"
    | "carteles"
    | "documentos-personales";
  initialDocuments?: Array<{
    docId: string;
    filename: string;
    fileType: string;
    fileUrl: string;
    uploadedAt: Date | string;
    documentKey: string;
    listingId: string | null;
    propertyId: string | null;
    listingTitle: string | null;
    listingStreet: string | null;
    listingPropertyType: string | null;
    listingCity: string | null;
    listingReferenceNumber: string | null;
  }>;
}

export function ContactDocumentsSection({
  contactId,
  folderType,
  initialDocuments,
}: ContactDocumentsSectionProps) {
  // For contacts, we only display documents (no upload functionality)
  // Documents are uploaded via property endpoints
  return (
    <div>
      <ContactDocumentsPage
        contactId={contactId}
        folderType={folderType}
        initialDocuments={initialDocuments}
      />
    </div>
  );
}

