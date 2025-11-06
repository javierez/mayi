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

export default async function CertificadoEnergeticoPage({
  params,
}: DocumentPageProps) {
  const unwrappedParams = await params;
  const contactId = parseInt(unwrappedParams.id);

  // Get contact data and documents
  const [contactData, documents] = await Promise.all([
    getContactDocumentsData(contactId),
    getContactOwnerDocumentsGroupedByListing(contactId, "energy_certificate"),
  ]);

  if (!contactData) {
    notFound();
  }

  // Serialize documents for client component
  const serializedDocuments = documents.map((doc) => ({
    ...doc,
    docId: doc.docId.toString(),
    propertyId: doc.propertyId?.toString(),
    contactId: doc.contactId?.toString(),
    listingId: doc.listingId?.toString(),
    listingContactId: doc.listingContactId?.toString(),
    dealId: doc.dealId?.toString(),
    appointmentId: doc.appointmentId?.toString(),
    prospectId: doc.prospectId?.toString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <ContactBreadcrumb
        firstName={contactData.firstName}
        lastName={contactData.lastName}
        contactId={contactData.contactId.toString()}
        documentFolder={{
          name: "Certificado Energético",
          contactId: contactData.contactId.toString(),
        }}
      />

      {/* Section header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Certificado Energético
        </h3>
        <p className="text-gray-600">
          Certificados energéticos y consumos de las propiedades donde este
          contacto es propietario.
        </p>
      </div>

      <ContactDocumentsSection
        contactId={contactData.contactId}
        folderType="certificado-energetico"
        initialDocuments={serializedDocuments}
      />
    </div>
  );
}

