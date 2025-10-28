import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadDocument } from "~/app/actions/upload";
import {
  getDocumentsByFolderType,
  hardDeleteDocument,
} from "~/server/queries/document";
import { getListingDocumentsData } from "~/server/queries/listing";
import { getSecureSession } from "~/lib/dal";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "~/server/s3";
import { getDynamicBucketName } from "~/lib/s3-bucket";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listing = await getListingDocumentsData(parseInt(id));

    if (!listing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed for carteles" },
        { status: 400 },
      );
    }

    const document = await uploadDocument(
      file,
      session.user.id,
      listing.referenceNumber ?? `TEMP_${listing.listingId}`,
      1, // documentOrder
      "carteles", // documentTag for carteles
      undefined, // contactId
      listing.listingId, // listingId
      undefined, // listingContactId
      undefined, // dealId
      undefined, // appointmentId
      listing.propertyId, // propertyId
      "carteles", // folderType for S3 path
    );

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
    });
  } catch (error) {
    console.error("Error uploading cartel:", error);
    return NextResponse.json(
      { error: "Failed to upload cartel" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const listing = await getListingDocumentsData(parseInt(id));

    if (!listing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const documents = await getDocumentsByFolderType(
      listing.propertyId,
      "carteles", // documentTag for carteles
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
    }));

    return NextResponse.json({
      success: true,
      documents: serializedDocuments,
    });
  } catch (error) {
    console.error("Error fetching carteles:", error);
    return NextResponse.json(
      { error: "Failed to fetch carteles" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const listing = await getListingDocumentsData(parseInt(id));

    if (!listing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      docId: string;
      documentKey: string;
    };
    const { docId, documentKey } = body;

    if (!docId || !documentKey) {
      return NextResponse.json(
        { error: "Document ID and document key are required" },
        { status: 400 },
      );
    }

    // Delete from S3
    try {
      // Get dynamic bucket name
      const bucketName = await getDynamicBucketName();

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: String(documentKey),
        }),
      );
    } catch (s3Error) {
      console.error("Error deleting from S3:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await hardDeleteDocument(BigInt(docId));

    return NextResponse.json({
      success: true,
      message: "Cartel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cartel:", error);
    return NextResponse.json(
      { error: "Failed to delete cartel" },
      { status: 500 },
    );
  }
}
