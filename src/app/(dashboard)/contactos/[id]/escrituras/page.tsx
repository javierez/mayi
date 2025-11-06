import { notFound } from "next/navigation";
import {
  getContactDocumentsData,
  getContactOwnerDocumentsGroupedByListing,
} from "~/server/queries/document";
import { ContactBreadcrumb } from "~/components/contactos/detail/contact-breadcrumb";
import { ContactDocumentsSection } from "~/components/contactos/detail/contact-documents-section";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EscriturasPage({ params }: DocumentPageProps) {
  const unwrappedParams = await params;
  const contactId = parseInt(unwrappedParams.id);

  // Get contact data and documents
  const [contactData, documents] = await Promise.all([
    getContactDocumentsData(contactId),
    getContactOwnerDocumentsGroupedByListing(contactId, "escrituras"),
  ]);

  if (!contactData) {
    notFound();
  }

  // Serialize documents for client component
  const serializedDocuments = documents.map((doc) => ({
    ...doc,
    docId: doc.docId.toString(),
    propertyId: doc.propertyId?.toString() ?? null,
    contactId: doc.contactId?.toString() ?? null,
    listingId: doc.listingId?.toString() ?? null,
    listingContactId: doc.listingContactId?.toString() ?? null,
    dealId: doc.dealId?.toString() ?? null,
    appointmentId: doc.appointmentId?.toString() ?? null,
    prospectId: doc.prospectId?.toString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ContactBreadcrumb
        firstName={contactData.firstName}
        lastName={contactData.lastName}
        contactId={contactData.contactId.toString()}
        documentFolder={{
          name: "Escrituras",
          contactId: contactData.contactId.toString(),
        }}
      />

      {/* Section header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Escrituras
        </h3>
        <p className="text-gray-600">
          Nota simple y escrituras de las propiedades donde este contacto es
          propietario.
        </p>
      </div>

      <ContactDocumentsSection
        contactId={contactData.contactId}
        folderType="escrituras"
        initialDocuments={serializedDocuments}
      />
    </div>
  );
}

