import { notFound } from "next/navigation";
import {
  getContactDocumentsData,
  getContactDocuments,
} from "~/server/queries/document";
import { ContactBreadcrumb } from "~/components/contactos/detail/contact-breadcrumb";
import { ContactDocumentsSection } from "~/components/contactos/detail/contact-documents-section";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContratosPage({ params }: DocumentPageProps) {
  const unwrappedParams = await params;
  const contactId = parseInt(unwrappedParams.id);

  // Get contact data and contract documents
  const [contactData, contactDocs] = await Promise.all([
    getContactDocumentsData(contactId),
    getContactDocuments(contactId, true, "uploadedAt"),
  ]);

  if (!contactData) {
    notFound();
  }

  // Filter by contract document tags and serialize for client component
  const contractDocs = contactDocs
    .filter(
      (doc) =>
        doc.documentTag === "contrato-arras" ||
        doc.documentTag === "contrato-alquiler",
    )
    .map((doc) => ({
      docId: doc.docId.toString(),
      filename: doc.filename,
      fileType: doc.fileType,
      fileUrl: doc.fileUrl,
      uploadedAt: doc.uploadedAt,
      documentKey: doc.documentKey,
      propertyId: doc.propertyId?.toString() ?? null,
      contactId: doc.contactId?.toString() ?? null,
      listingId: doc.listingId?.toString() ?? null,
      listingContactId: doc.listingContactId?.toString() ?? null,
      dealId: doc.dealId?.toString() ?? null,
      appointmentId: doc.appointmentId?.toString() ?? null,
      prospectId: doc.prospectId?.toString() ?? null,
      listingTitle: null,
      listingStreet: null,
      listingPropertyType: null,
      listingCity: null,
      listingReferenceNumber: null,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ContactBreadcrumb
        firstName={contactData.firstName}
        lastName={contactData.lastName}
        contactId={contactData.contactId.toString()}
        documentFolder={{
          name: "Contratos",
          contactId: contactData.contactId.toString(),
        }}
      />

      {/* Section header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Contratos</h3>
        <p className="text-gray-600">
          Contratos de arras y alquiler del contacto.
        </p>
      </div>

      <ContactDocumentsSection
        contactId={contactData.contactId}
        folderType="contratos"
        initialDocuments={contractDocs}
      />
    </div>
  );
}
