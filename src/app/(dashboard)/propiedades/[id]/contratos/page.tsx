import { notFound } from "next/navigation";
import {
  getListingBreadcrumbData,
  getListingHeaderData,
  getListingDocumentsData,
} from "~/server/queries/listing";
import {
  getActiveDealsForListingWithAuth,
  getListingContactsWithoutDealsWithAuth,
} from "~/server/queries/deal";
import { checkExistingArrasContract } from "~/server/queries/arras";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import { PropertyHeader } from "~/components/propiedades/detail/property-header";
import { DocumentsSection } from "~/components/propiedades/detail/documents-section";
import { ContractSelectionCards } from "~/components/propiedades/detail/contract-selection-cards";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContratosPage({ params }: DocumentPageProps) {
  const unwrappedParams = await params;
  const listingId = parseInt(unwrappedParams.id);

  // Get data with optimized queries
  const [breadcrumbData, headerData, documentsData, activeDeals, contactsWithoutDeals] =
    await Promise.all([
      getListingBreadcrumbData(listingId),
      getListingHeaderData(listingId),
      getListingDocumentsData(listingId),
      getActiveDealsForListingWithAuth(listingId),
      getListingContactsWithoutDealsWithAuth(listingId),
    ]);

  if (!breadcrumbData || !headerData || !documentsData) {
    notFound();
  }

  // Filter out deals that already have arras contracts
  const dealsWithContractStatus = await Promise.all(
    activeDeals.map(async (deal) => {
      const existingContract = await checkExistingArrasContract(Number(deal.dealId));
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

  // Serialize BigInt values for client component
  const serializedDeals = dealsWithoutContracts.map((deal) => ({
    dealId: deal.dealId.toString(),
    listingId: deal.listingId.toString(),
    listingContactId: deal.listingContactId?.toString() ?? null,
    status: deal.status,
    buyerName: `${deal.buyerFirstName ?? ""} ${deal.buyerLastName ?? ""}`.trim(),
    offer: deal.offer,
  }));

  const serializedContacts = contactsWithoutDeals.map((contact) => ({
    listingContactId: contact.listingContactId.toString(),
    listingId: contact.listingId?.toString() ?? listingId.toString(),
    contactId: contact.contactId.toString(),
    contactType: contact.contactType,
    offer: contact.offer,
    offerAccepted: contact.offerAccepted,
    buyerName: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim(),
  }));

  const listingPrice = parseFloat(headerData.price ?? "0");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PropertyBreadcrumb
        propertyType={breadcrumbData.propertyType ?? ""}
        street={breadcrumbData.street ?? ""}
        referenceNumber={breadcrumbData.referenceNumber ?? ""}
        documentFolder={{
          name: "Contratos",
          propertyId: headerData.listingId.toString(),
        }}
      />

      {/* Property Title - Always Visible */}
      <PropertyHeader
        title={headerData.title ?? ""}
        propertyId={headerData.propertyId}
        listingId={headerData.listingId}
        street={headerData.street ?? ""}
        city={headerData.city ?? ""}
        province={headerData.province ?? ""}
        postalCode={headerData.postalCode ?? ""}
        price={headerData.price}
        listingType={headerData.listingType}
        status={headerData.status}
        isBankOwned={headerData.isBankOwned ?? false}
      />

      {/* Section header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Contratos</h3>
      </div>

      {/* Contract generation cards */}
      <ContractSelectionCards
        listingId={listingId}
        listingPrice={listingPrice}
        deals={serializedDeals}
        contactsWithoutDeals={serializedContacts}
      />

      <DocumentsSection listing={documentsData} folderType="contratos" />
    </div>
  );
}
