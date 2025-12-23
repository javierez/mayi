import { notFound } from "next/navigation";
import {
  getContactDocumentsData,
  getContactDocuments,
} from "~/server/queries/document";
import {
  getActiveDealsForContactWithAuth,
  getContactListingsWithoutDealsWithAuth,
} from "~/server/queries/deal";
import { checkExistingArrasContract } from "~/server/queries/arras";
import { ContactBreadcrumb } from "~/components/contactos/detail/contact-breadcrumb";
import { ContactDocumentsSection } from "~/components/contactos/detail/contact-documents-section";
import { ContactContractSelectionCards } from "~/components/contactos/detail/contact-contract-selection-cards";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContratosPage({ params }: DocumentPageProps) {
  const unwrappedParams = await params;
  const contactId = parseInt(unwrappedParams.id);

  // Get contact data, contract documents, and listings the contact is interested in
  const [contactData, contactDocs, activeDeals, listingsWithoutDeals] =
    await Promise.all([
      getContactDocumentsData(contactId),
      getContactDocuments(contactId, true, "uploadedAt"),
      getActiveDealsForContactWithAuth(contactId),
      getContactListingsWithoutDealsWithAuth(contactId),
    ]);

  if (!contactData) {
    notFound();
  }

  // Filter out deals that already have arras contracts
  const dealsWithContractStatus = await Promise.all(
    activeDeals.map(async (deal) => {
      const existingContract = await checkExistingArrasContract(
        Number(deal.dealId),
      );
      return {
        ...deal,
        hasArrasContract: !!existingContract,
      };
    }),
  );

  // Only show deals without existing contracts
  const dealsWithoutContracts = dealsWithContractStatus.filter(
    (deal) => !deal.hasArrasContract,
  );

  // Serialize BigInt values for client component - deals
  const serializedDeals = dealsWithoutContracts.map((deal) => ({
    dealId: deal.dealId.toString(),
    listingId: deal.listingId.toString(),
    listingContactId: deal.listingContactId?.toString() ?? null,
    status: deal.status,
    title: deal.title,
    street: deal.street,
    city: deal.city,
    referenceNumber: deal.referenceNumber,
    propertyType: deal.propertyType,
    offer: deal.offer,
    price: deal.price,
  }));

  // Serialize BigInt values for client component - listings without deals
  const serializedListings = listingsWithoutDeals.map((listing) => ({
    listingContactId: listing.listingContactId.toString(),
    listingId: listing.listingId?.toString() ?? "",
    contactId: listing.contactId?.toString() ?? contactId.toString(),
    contactType: listing.contactType,
    offer: listing.offer,
    offerAccepted: listing.offerAccepted,
    title: listing.title,
    street: listing.street,
    city: listing.city,
    referenceNumber: listing.referenceNumber,
    propertyType: listing.propertyType,
    price: listing.price,
    listingType: listing.listingType,
  }));

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

      {/* Contract generation cards */}
      <ContactContractSelectionCards
        deals={serializedDeals}
        listingsWithoutDeals={serializedListings}
      />

      <ContactDocumentsSection
        contactId={contactData.contactId}
        folderType="contratos"
        initialDocuments={contractDocs}
      />
    </div>
  );
}
