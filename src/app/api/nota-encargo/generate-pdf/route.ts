import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUserAccountId, getSecureSession } from "~/lib/dal";
import { getPuppeteerConfig } from "~/lib/puppeteer-utils";
import { calculateDocumentHash, embedDocumentMetadata } from "~/lib/pdf-integrity";
import { uploadDocument } from "~/app/actions/upload";
import { getHojaEncargoDocumentDataAction } from "~/server/actions/hoja-encargo";
import type { Page } from "puppeteer-core";
import type { HojaEncargoFormData, HojaEncargoDocumentData } from "~/types/hoja-encargo";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      listingId?: string;
      formData?: Partial<HojaEncargoFormData>;
      saveToS3?: boolean;
      // Legacy support for old API
      data?: HojaEncargoDocumentData;
    };

    const { listingId, formData, saveToS3 = false, data: legacyData } = body;

    // Validate input data
    if (!listingId && !legacyData) {
      return NextResponse.json(
        { error: "Missing listingId or data" },
        { status: 400 },
      );
    }

    console.log("🚀 Starting Hoja de Encargo PDF generation with Puppeteer...");
    console.log("📋 Request params:", { listingId, saveToS3, hasFormData: !!formData });

    let documentData: HojaEncargoDocumentData;

    // If using new API with listingId, get data from server action
    if (listingId) {
      const result = await getHojaEncargoDocumentDataAction(
        parseInt(listingId),
        formData,
      );

      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error ?? "Failed to get document data" },
          { status: 400 },
        );
      }

      documentData = result.data;
    } else {
      // Legacy support - use data directly
      documentData = legacyData!;
    }

    // Get current user's account ID and regular logo
    const accountId = await getCurrentUserAccountId();
    const { getAccountById } = await import("~/server/queries/accounts");
    const account = await getAccountById(accountId);
    const logo = account?.logo;

    console.log("📊 PDF Generation - Logo info:", {
      accountId: accountId.toString(),
      logo,
      hasLogo: !!logo,
    });

    // Add logo to the data if not already present
    const dataWithLogo: HojaEncargoDocumentData = {
      ...documentData,
      agency: {
        ...documentData.agency,
        logo: documentData.agency.logo ?? logo ?? undefined,
      },
    };

    console.log("📊 PDF Generation - Data with logo:", {
      agencyLogo: dataWithLogo.agency.logo,
      agencyName: dataWithLogo.agency.agentName,
    });

    // Get Puppeteer instance based on environment (Vercel vs local)
    const { puppeteer, launchOptions } = await getPuppeteerConfig();
    
    console.log(
      "🌐 Using Puppeteer:",
      process.env.VERCEL === "1" ? "Vercel (serverless)" : "Local",
    );

    // Launch browser with optimized settings for PDF generation
    const browser = await puppeteer.launch(launchOptions);

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
    const templateUrl = new URL("/templates/nota-encargo", baseUrl);

    // Pass configuration as URL parameters
    templateUrl.searchParams.set("data", JSON.stringify(dataWithLogo));

    // Add cache-busting parameter to force fresh load
    templateUrl.searchParams.set("_t", Date.now().toString());

    console.log(
      "📄 Navigating to nota encargo template URL:",
      templateUrl.toString(),
    );

    // Navigate to the template page
    const response = await page.goto(templateUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 60000, // Match visita timeout for initial page load
    });

    if (!response?.ok()) {
      throw new Error(
        `Failed to load template: ${response?.status()} ${response?.statusText()}`,
      );
    }

    // Wait for nota encargo template to be fully rendered
    console.log("🎯 Waiting for nota encargo document container...");

    try {
      await page.waitForSelector(".nota-encargo-document", { timeout: 10000 });
      console.log("✅ Nota encargo document container found");
    } catch {
      console.error(
        "Nota encargo document container not found. Page content:",
        await page.content(),
      );
      throw new Error(
        "Nota encargo document container not found after 10 seconds",
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
          loaded: img.complete && img.naturalWidth > 0,
        }));
      });

      console.log("🖼️ Image loading status:", JSON.stringify(imageStatus, null, 2));

      // Wait for all images to actually load (not just complete)
      await page.waitForFunction(
        () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.every((img) => img.complete && img.naturalWidth > 0);
        },
        { timeout: 30000 },
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
          return (window as any).notaEncargoReady === true;
        },
        {
          timeout: 15000,
        },
      );
    } catch {
      console.warn("Nota encargo ready signal timeout, proceeding anyway...");
    }

    console.log("🎨 Template loaded, generating PDF...");

    // Generate PDF with optimized settings and minimal top margin
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false, // Always portrait for legal documents
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

    console.log("✅ Hoja de Encargo PDF generated successfully");

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
    const filename = `${dataWithLogo.documentNumber}.pdf`;

    // Only save to S3 if requested
    if (saveToS3 && listingId) {
      console.log("💾 Saving PDF to S3 and database...");

      // Get current user session for upload
      const session = await getSecureSession();
      if (!session?.user?.id) {
        throw new Error("User session not found");
      }

      // Get listing data for property info
      const { getListingDocumentsData } = await import("~/server/queries/listing");
      const listingData = await getListingDocumentsData(parseInt(listingId));
      if (!listingData) {
        throw new Error("Listing data not found");
      }

      const referenceNumber = dataWithLogo.documentNumber;

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
          "hoja-encargo", // documentTag
          undefined, // contactId
          BigInt(listingId),
          undefined, // listingContactId
          undefined, // dealId
          undefined, // appointmentId
          listingData.propertyId ? BigInt(listingData.propertyId) : undefined,
          "initial-docs", // folderType
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
          filename,
          documentId: savedDocument.docId.toString(),
        });
      } catch (uploadError) {
        console.error("❌ Failed to save PDF to S3:", uploadError);
        // Fall through to return PDF directly
      }
    }

    // Return PDF as response (download mode)
    const pdfUint8Array = new Uint8Array(pdfWithMetadata);
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ Hoja de Encargo PDF generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
