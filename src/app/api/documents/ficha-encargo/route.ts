import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadDocument } from "~/app/actions/upload";
import { getSecureSession } from "~/lib/dal";
import { createMinimalPropertyWithListing } from "~/server/queries/properties";

// Phase 1: Create property and upload documents to final location
export async function POST(request: NextRequest) {
  try {
    console.log(
      "🏠 Starting Phase 1: Creating property and uploading ficha de encargo documents...",
    );

    // Get current user session
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type and size
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.",
        },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }

    // Step 1: Create minimal property and listing first (like crear workflow)
    console.log("📝 Creating minimal property and listing...");
    const propertyResult = await createMinimalPropertyWithListing();
    const { propertyId, listingId, referenceNumber } = propertyResult;

    console.log(
      `✅ Property created: ${propertyId}, Listing: ${listingId}, Reference: ${referenceNumber}`,
    );

    // Step 2: Upload document directly to final property location (same as crear)
    console.log(
      `📁 Uploading document to properties/${referenceNumber}/documents/...`,
    );
    const document = await uploadDocument(
      file,
      session.user.id,
      referenceNumber,
      1, // documentOrder
      "ficha-encargo", // documentTag for ficha de encargo documents
      undefined, // contactId
      BigInt(listingId), // listingId - set from the start
      undefined, // listingContactId
      undefined, // dealId
      undefined, // appointmentId
      BigInt(propertyId), // propertyId - set from the start
      "initial-docs", // folderType
    );

    console.log(`✅ Document uploaded successfully: ${document.filename}`);

    // Convert BigInt values to strings for JSON serialization
    const serializedDocument = {
      ...document,
      docId: document.docId.toString(),
      propertyId: document.propertyId?.toString(),
      contactId: document.contactId?.toString(),
      listingId: document.listingId?.toString(),
      listingContactId: document.listingContactId?.toString(),
      dealId: document.dealId?.toString(),
      appointmentId: document.appointmentId?.toString(),
    };

    return NextResponse.json({
      success: true,
      document: serializedDocument,
      propertyId: propertyId.toString(),
      listingId: listingId.toString(),
      referenceNumber,
      message: "Property created and document uploaded successfully",
    });
  } catch (error) {
    console.error("Error in ficha de encargo Phase 1:", error);
    return NextResponse.json(
      { error: "Failed to create property and upload document" },
      { status: 500 },
    );
  }
}
