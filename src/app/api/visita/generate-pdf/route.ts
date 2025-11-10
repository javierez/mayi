import { type NextRequest, NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { getVisitDocumentDataAction } from "~/server/actions/visits";
import { getPuppeteerConfig } from "~/lib/puppeteer-utils";
import type { Page } from "puppeteer-core";
import { calculateDocumentHash, embedDocumentMetadata } from "~/lib/pdf-integrity";
import { uploadDocument } from "~/app/actions/upload";
import { getAppointmentWithDetails } from "~/server/queries/visits";
import { getListingDocumentsData } from "~/server/queries/listing";

/**
 * Sanitize a string for use in filenames
 * Removes special characters and replaces spaces with hyphens
 */
function sanitizeFilename(text: string): string {
  return text
    .normalize("NFD") // Normalize accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Generate a descriptive filename for visit PDFs
 * Format: visita-2024-01-15-REF123-Juan-Garcia.pdf
 */
function generateVisitFilename(
  referenceNumber: string | null | undefined,
  contactFirstName: string,
  contactLastName: string,
  visitDate: Date,
): string {
  const ref = referenceNumber ? sanitizeFilename(referenceNumber) : "SIN-REF";
  const firstName = sanitizeFilename(contactFirstName);
  const lastName = sanitizeFilename(contactLastName);

  // Format date as YYYY-MM-DD
  const dateStr = visitDate.toISOString().split("T")[0];

  return `visita-${dateStr}-${ref}-${firstName}-${lastName}.pdf`;
}

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, saveToS3 = false } = (await request.json()) as {
      appointmentId: string;
      saveToS3?: boolean;
    };

    // Validate input data
    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointment ID" },
        { status: 400 },
      );
    }

    console.log("🚀 Starting Visit PDF generation with Puppeteer...");

    // Fetch visit data here where we have authentication
    const appointmentIdBigInt = BigInt(parseInt(appointmentId));
    const visitDataResult = await getVisitDocumentDataAction(appointmentIdBigInt);

    if (!visitDataResult.success || !visitDataResult.data) {
      throw new Error(
        visitDataResult.error ?? "Failed to fetch visit document data",
      );
    }

    const visitData = visitDataResult.data;

    // Convert Date objects to ISO strings for JSON serialization
    const serializedData = {
      ...visitData,
      appointment: {
        ...visitData.appointment,
        datetimeStart: visitData.appointment.datetimeStart.toISOString(),
        datetimeEnd: visitData.appointment.datetimeEnd.toISOString(),
      },
    };

    console.log("📊 PDF Generation - Visit data fetched:", {
      appointmentId,
      hasBranding: !!visitData.branding,
      logoUrl: visitData.branding?.logoUrl ?? "no logo",
      agentName: visitData.branding?.agentName ?? "no agent name",
    });

    // Get Puppeteer instance based on environment (Vercel vs local)
    const { puppeteer, launchOptions } = await getPuppeteerConfig();

    console.log(
      "🌐 Using Puppeteer:",
      process.env.VERCEL === "1" ? "Vercel (serverless)" : "Local",
    );

    console.log("🔧 Launch options:", JSON.stringify(launchOptions, null, 2));

    // Launch browser with optimized settings for PDF generation
    let browser;
    try {
      console.log("🚀 Attempting to launch browser...");
      browser = await puppeteer.launch(launchOptions);
      console.log("✅ Browser launched successfully");
    } catch (launchError) {
      console.error("❌ Browser launch failed:", launchError);
      console.error("🔍 Launch error details:", {
        message: launchError instanceof Error ? launchError.message : String(launchError),
        stack: launchError instanceof Error ? launchError.stack : undefined,
        executablePath: launchOptions.executablePath,
      });
      throw launchError;
    }

    const page = (await browser.newPage()) as Page;

    // Disable cache to ensure fresh content
    await page.setCacheEnabled(false);

    // Set viewport to match A4 print dimensions
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1,
    });

    // Build the template URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const templateUrl = new URL("/templates/visita", baseUrl);

    // Pass data as URL parameters (like nota-encargo does)
    templateUrl.searchParams.set("data", JSON.stringify(serializedData));

    // Add cache-busting parameter to force fresh load
    templateUrl.searchParams.set("_t", Date.now().toString());

    console.log(
      "📄 Navigating to visit template URL:",
      templateUrl.toString(),
    );

    // Navigate to the template page
    const response = await page.goto(templateUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000, // Increased timeout for initial page load
    });

    if (!response?.ok()) {
      throw new Error(
        `Failed to load template: ${response?.status()} ${response?.statusText()}`,
      );
    }

    // Wait for visit template to be fully rendered
    console.log("🎯 Waiting for visit document container...");

    try {
      await page.waitForSelector(".visit-document", { timeout: 10000 });
      console.log("✅ Visit document container found");
    } catch {
      console.error(
        "Visit document container not found. Page content:",
        await page.content(),
      );
      throw new Error(
        "Visit document container not found after 10 seconds",
      );
    }

    // Wait for images to load and check their status
    try {
      const imageStatus = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.map((img) => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          // If naturalWidth is 0, the image failed to load
          loaded: img.complete && img.naturalWidth > 0,
        }));
      });

      console.log("🖼️ Image loading status:", JSON.stringify(imageStatus, null, 2));

      // Wait for all images to actually load (not just complete)
      // Increased timeout for slow S3 images
      await page.waitForFunction(
        () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.every((img) => img.complete && img.naturalWidth > 0);
        },
        { timeout: 30000 }, // Increased from 10s to 30s for S3 images
      );
      console.log("✅ All images loaded successfully");
      
      // Additional delay to ensure images are fully rendered
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch {
      console.warn("⚠️ Image loading timeout, checking status...");
      const imageStatus = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.map((img) => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          loaded: img.complete && img.naturalWidth > 0,
        }));
      });
      console.warn("Final image status:", JSON.stringify(imageStatus, null, 2));
    }

    // Wait for the template ready signal
    try {
      await page.waitForFunction(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          return (window as any).visitDocumentReady === true;
        },
        {
          timeout: 15000,
        },
      );
      console.log("✅ Visit document ready signal received");
    } catch {
      console.warn("Visit document ready signal timeout, proceeding anyway...");
    }

    // Debug: Check what's actually in the page
    const pageDebugInfo = await page.evaluate(() => {
      const brandLogo = document.querySelector('img[alt="Logo de la agencia"]');
      return {
        hasBrandLogo: !!brandLogo,
        brandLogoSrc: brandLogo?.getAttribute('src') ?? 'not found',
      };
    });
    console.log("🔍 Page content debug:", pageDebugInfo);

    console.log("🎨 Template loaded, generating PDF...");

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false, // Always portrait for visit documents
      printBackground: true,
      margin: {
        top: "7mm",
        right: "5mm",
        bottom: "10mm",
        left: "7mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log("✅ Visit PDF generated successfully");

    // Calculate document hash and timestamp
    console.log("🔐 Calculating document hash...");
    const documentHash = calculateDocumentHash(Buffer.from(pdfBuffer));
    const documentTimestamp = new Date();

    console.log("📝 Document integrity:", {
      hash: documentHash,
      timestamp: documentTimestamp.toISOString(),
    });

    // Embed hash and timestamp in PDF metadata
    console.log("📄 Embedding metadata in PDF...");
    const pdfWithMetadata = await embedDocumentMetadata(
      Buffer.from(pdfBuffer),
      documentHash,
      documentTimestamp.toISOString(),
    );

    // Generate descriptive filename
    const filename = generateVisitFilename(
      visitData.appointment.propertyReferenceNumber,
      visitData.appointment.contactFirstName,
      visitData.appointment.contactLastName,
      visitData.appointment.datetimeStart,
    );

    // Only save to S3 if requested
    if (saveToS3) {
      console.log("💾 Saving PDF to S3 and database...");

      // Get appointment details to find listingId and reference number
      const appointment = await getAppointmentWithDetails(appointmentIdBigInt);
      if (!appointment?.listingId) {
        throw new Error("Appointment or listing not found");
      }

      // Get listing reference number for S3 upload path
      const listingData = await getListingDocumentsData(
        Number(appointment.listingId),
      );
      const referenceNumber =
        listingData.referenceNumber ?? `VISIT_${appointmentId}`;

      // Get current user session for upload
      const session = await getSecureSession();
      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      // Convert PDF buffer to File object for upload
      const pdfFile = new File([new Uint8Array(pdfWithMetadata)], filename, {
        type: "application/pdf",
      });

      try {
        const savedDocument = await uploadDocument(
          pdfFile,
          session.user.id,
          referenceNumber,
          1, // documentOrder
          "visita-pdf", // documentTag
          appointment.contactId ? BigInt(appointment.contactId) : undefined,
          BigInt(appointment.listingId),
          undefined, // listingContactId
          undefined, // dealId
          appointmentIdBigInt, // appointmentId
          listingData.propertyId
            ? BigInt(listingData.propertyId)
            : undefined,
          "visitas", // folderType
          documentHash, // documentHash
          documentTimestamp, // documentTimestamp
        );

        console.log("✅ PDF saved successfully:", {
          docId: savedDocument.docId.toString(),
          hash: savedDocument.documentHash,
          timestamp: savedDocument.documentTimestamp?.toISOString(),
        });

        // Return JSON with document URL for sharing
        return NextResponse.json({
          success: true,
          documentUrl: savedDocument.fileUrl,
          filename: savedDocument.filename,
          documentId: savedDocument.docId.toString(),
        });
      } catch (uploadError) {
        console.error("⚠️ Error saving PDF to database:", uploadError);
        throw new Error("Failed to save PDF to S3");
      }
    } else {
      console.log("ℹ️ Skipping S3 save as requested (download only)");
    }

    // Return PDF as download (from modified buffer with metadata)
    // Convert to Uint8Array which NextResponse accepts
    const pdfUint8Array = new Uint8Array(pdfWithMetadata);
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ Visit PDF generation failed:", error);

    // Log detailed error context for debugging
    console.error("🔍 Error Context:", {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      nodeVersion: process.version,
      platform: process.platform,
      vercelEnv: process.env.VERCEL,
      memoryUsage: process.memoryUsage(),
    });

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

