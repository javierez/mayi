import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getContactOwnerDocumentsGroupedByListing } from "~/server/queries/document";
import { getContactByIdWithAuth } from "~/server/queries/contact";
import { getSecureSession } from "~/lib/dal";
import { uploadDocument } from "~/app/actions/upload";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);

    // Verify contact exists
    const contact = await getContactByIdWithAuth(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const folderType = searchParams.get("folderType") as
      | "initial-docs"
      | "visitas"
      | "others"
      | "planos"
      | "certificado-energetico"
      | "escrituras"
      | "carteles"
      | "documentos-personales"
      | null;

    if (!folderType) {
      return NextResponse.json(
        { error: "Folder type is required" },
        { status: 400 },
      );
    }

    // Map folder types to document tags for database query
    const documentTagMap = {
      "initial-docs": "documentacion-inicial",
      visitas: "visitas",
      others: "otros",
      planos: "planos",
      "certificado-energetico": "energy_certificate",
      escrituras: "escrituras",
      carteles: "carteles",
      "documentos-personales": "documentos-personales",
    } as const;

    const documentTag = documentTagMap[folderType];

    // Personal documents are queried directly by contactId (not through listings)
    if (folderType === "documentos-personales") {
      const { getContactDocuments } = await import("~/server/queries/document");
      const contactDocs = await getContactDocuments(contactId, true, "uploadedAt");

      // Filter by document tag and add empty listing info for consistency
      const personalDocs = contactDocs
        .filter((doc) => doc.documentTag === "documentos-personales")
        .map((doc) => ({
          ...doc,
          listingTitle: null,
          listingStreet: null,
          listingPropertyType: null,
          listingCity: null,
          listingReferenceNumber: null,
        }));

      const serializedDocuments = personalDocs.map((doc) => ({
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

      return NextResponse.json(serializedDocuments);
    }

    // Get documents grouped by listing (only from listings where contact is owner)
    const documents = await getContactOwnerDocumentsGroupedByListing(
      contactId,
      documentTag,
    );

    // Convert BigInt values to strings for JSON serialization
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

    return NextResponse.json(serializedDocuments);
  } catch (error) {
    console.error("Error fetching contact documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);

    // Verify contact exists
    const contact = await getContactByIdWithAuth(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderType = formData.get("folderType") as
      | "documentos-personales"
      | "contratos"
      | null;

    if (!file || !folderType) {
      return NextResponse.json(
        { error: "File and folder type are required" },
        { status: 400 },
      );
    }

    // Only allow personal documents and contratos uploads for contacts
    const allowedFolderTypes = ["documentos-personales", "contratos"];
    if (!allowedFolderTypes.includes(folderType)) {
      return NextResponse.json(
        { error: "Only personal documents and contratos can be uploaded for contacts" },
        { status: 400 },
      );
    }

    // Map folder type to document tag
    const documentTagMap: Record<string, string> = {
      "documentos-personales": "documentos-personales",
      contratos: "contrato-arras", // Default to contrato-arras for contratos folder
    };

    const documentTag = documentTagMap[folderType] ?? folderType;

    // Generate a reference number for the contact (using contact ID)
    const referenceNumber = `CONTACT_${contactId}`;

    const document = await uploadDocument(
      file,
      session.user.id,
      referenceNumber,
      1, // documentOrder
      documentTag, // documentTag
      BigInt(contactId), // contactId
      undefined, // listingId
      undefined, // listingContactId
      undefined, // dealId
      undefined, // appointmentId
      undefined, // propertyId
      undefined, // folderType
    );

    // Convert BigInt values to strings for JSON serialization
    const serializedDocument = {
      ...document,
      docId: document.docId.toString(),
      propertyId: document.propertyId?.toString() ?? null,
      contactId: document.contactId?.toString() ?? null,
      listingId: document.listingId?.toString() ?? null,
      listingContactId: document.listingContactId?.toString() ?? null,
      dealId: document.dealId?.toString() ?? null,
      appointmentId: document.appointmentId?.toString() ?? null,
      prospectId: document.prospectId?.toString() ?? null,
      listingTitle: null,
      listingStreet: null,
      listingPropertyType: null,
      listingCity: null,
      listingReferenceNumber: null,
    };

    return NextResponse.json(serializedDocument);
  } catch (error) {
    console.error("Error uploading contact document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

