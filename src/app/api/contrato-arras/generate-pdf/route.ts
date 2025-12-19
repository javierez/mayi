import { type NextRequest, NextResponse } from "next/server";
import { getSecureSession } from "~/lib/dal";
import { getArrasDocumentDataAction } from "~/server/actions/arras";
import { getPuppeteerConfig } from "~/lib/puppeteer-utils";
import type { Page } from "puppeteer-core";
import {
  calculateDocumentHash,
  embedDocumentMetadata,
} from "~/lib/pdf-integrity";
import { uploadDocument } from "~/app/actions/upload";
import { getArrasContractData } from "~/server/queries/arras";
import type { ArrasContractFormData } from "~/types/arras";

/**
 * Sanitize a string for use in filenames
 */
function sanitizeFilename(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ToriPark account ID for rent contract template
const TORIPARK_ACCOUNT_ID = "1125899906842626";

/**
 * Generate a descriptive filename for arras contract PDFs
 * Format: contrato-arras-2024-01-15-REF123-comprador.pdf
 * For ToriPark: contrato-alquiler-2024-01-15-REF123-arrendatario.pdf
 */
function generateArrasFilename(
  referenceNumber: string | null | undefined,
  buyerName: string,
  signingDate: Date,
  isToriPark = false,
): string {
  const ref = referenceNumber ? sanitizeFilename(referenceNumber) : "SIN-REF";
  const buyer = sanitizeFilename(buyerName);
  const dateStr = signingDate.toISOString().split("T")[0];

  const contractType = isToriPark ? "contrato-alquiler" : "contrato-arras";
  return `${contractType}-${dateStr}-${ref}-${buyer}.pdf`;
}

export async function POST(request: NextRequest) {
  try {
    const { dealId, formData, saveToS3 = false } = (await request.json()) as {
      dealId: string;
      formData?: Partial<ArrasContractFormData>;
      saveToS3?: boolean;
    };

    // Validate input data
    if (!dealId) {
      return NextResponse.json({ error: "Missing deal ID" }, { status: 400 });
    }

    console.log("🚀 Starting Arras Contract PDF generation with Puppeteer...");

    // Fetch arras document data
    const dealIdNumber = parseInt(dealId);
    const arrasDataResult = await getArrasDocumentDataAction(
      dealIdNumber,
      formData,
    );

    if (!arrasDataResult.success || !arrasDataResult.data) {
      throw new Error(
        arrasDataResult.error ?? "Failed to fetch arras document data",
      );
    }

    const arrasData = arrasDataResult.data;

    // Convert Date objects to ISO strings for JSON serialization
    const serializedData = {
      ...arrasData,
      deal: {
        ...arrasData.deal,
        signingDate: arrasData.deal.signingDate.toISOString(),
        deedDeadline: arrasData.deal.deedDeadline.toISOString(),
        financingDeadline: arrasData.deal.financingDeadline
          ? arrasData.deal.financingDeadline.toISOString()
          : undefined,
      },
    };

    console.log("📊 PDF Generation - Arras data fetched:", {
      dealId,
      hasBranding: !!arrasData.branding,
      logoUrl: arrasData.branding?.logoUrl ?? "no logo",
      buyerName: arrasData.buyer.name,
      sellerName: arrasData.seller.name,
    });

    // Get Puppeteer instance based on environment
    const { puppeteer, launchOptions } = await getPuppeteerConfig();

    console.log(
      "🌐 Using Puppeteer:",
      process.env.VERCEL === "1" ? "Vercel (serverless)" : "Local",
    );

    // Launch browser
    let browser;
    try {
      console.log("🚀 Attempting to launch browser...");
      browser = await puppeteer.launch(launchOptions);
      console.log("✅ Browser launched successfully");
    } catch (launchError) {
      console.error("❌ Browser launch failed:", launchError);
      throw launchError;
    }

    const page = (await browser.newPage()) as Page;

    // Disable cache to ensure fresh content
    await page.setCacheEnabled(false);

    // Set viewport to match A4 print dimensions
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // Build the template URL with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const templateUrl = new URL(
      `/templates/contrato-arras/${dealId}`,
      baseUrl,
    );

    // Pass data as URL parameters
    templateUrl.searchParams.set("data", JSON.stringify(serializedData));
    templateUrl.searchParams.set("_t", Date.now().toString());

    console.log(
      "📄 Navigating to arras template URL:",
      templateUrl.toString().substring(0, 200) + "...",
    );

    // Navigate to the template page
    const response = await page.goto(templateUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    if (!response?.ok()) {
      throw new Error(
        `Failed to load template: ${response?.status()} ${response?.statusText()}`,
      );
    }

    // Check if this is a ToriPark account
    const isToriPark = arrasData.accountId === TORIPARK_ACCOUNT_ID;
    const documentSelector = isToriPark ? ".toripark-document" : ".arras-document";

    // Wait for document to be fully rendered
    console.log(`🎯 Waiting for ${isToriPark ? "ToriPark" : "Arras"} document container...`);

    try {
      await page.waitForSelector(documentSelector, { timeout: 10000 });
      console.log(`✅ ${isToriPark ? "ToriPark" : "Arras"} document container found`);
    } catch {
      console.error(
        "Document container not found. Page content:",
        await page.content(),
      );
      throw new Error(`${isToriPark ? "ToriPark" : "Arras"} document container not found after 10 seconds`);
    }

    // Wait for images to load
    try {
      const imageStatus = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.map((img) => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          loaded: img.complete && img.naturalWidth > 0,
        }));
      });

      console.log(
        "🖼️ Image loading status:",
        JSON.stringify(imageStatus, null, 2),
      );

      await page.waitForFunction(
        () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.every((img) => img.complete && img.naturalWidth > 0);
        },
        { timeout: 30000 },
      );
      console.log("✅ All images loaded successfully");

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch {
      console.warn("⚠️ Image loading timeout, proceeding anyway...");
    }

    // Wait for the template ready signal
    try {
      await page.waitForFunction(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
          return (window as any).arrasDocumentReady === true;
        },
        { timeout: 15000 },
      );
      console.log("✅ Arras document ready signal received");
    } catch {
      console.warn("Arras document ready signal timeout, proceeding anyway...");
    }

    console.log("🎨 Template loaded, generating PDF...");

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log("✅ Arras Contract PDF generated successfully");

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
    const filename = generateArrasFilename(
      arrasData.property.referenceNumber,
      arrasData.buyer.name,
      arrasData.deal.signingDate,
      isToriPark,
    );

    // Only save to S3 if requested
    if (saveToS3) {
      console.log("💾 Saving PDF to S3 and database...");

      // Get contract data to find listingId
      const contractData = await getArrasContractData(dealIdNumber);
      if (!contractData?.listing?.listingId) {
        throw new Error("Contract data or listing not found");
      }

      // Get current user session for upload
      const session = await getSecureSession();
      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      const referenceNumber =
        contractData.property.referenceNumber ?? `ARRAS_${dealId}`;

      // Convert PDF buffer to File object for upload
      const pdfFile = new File([new Uint8Array(pdfWithMetadata)], filename, {
        type: "application/pdf",
      });

      const documentTag = isToriPark ? "contrato-alquiler" : "contrato-arras";

      try {
        const savedDocument = await uploadDocument(
          pdfFile,
          session.user.id,
          referenceNumber,
          1, // documentOrder
          documentTag, // documentTag
          undefined, // contactId
          BigInt(contractData.listing.listingId),
          undefined, // listingContactId
          BigInt(dealIdNumber), // dealId
          undefined, // appointmentId
          contractData.property.propertyId
            ? BigInt(contractData.property.propertyId)
            : undefined,
          "others", // folderType
          documentHash,
          documentTimestamp,
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

    // Return PDF as download
    const pdfUint8Array = new Uint8Array(pdfWithMetadata);
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ Arras Contract PDF generation failed:", error);

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
