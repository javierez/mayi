import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUserAccountId } from "~/lib/dal";
import { getVisitDocumentDataAction } from "~/server/actions/visits";
import { getPuppeteerConfig } from "~/lib/puppeteer-utils";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = (await request.json()) as {
      appointmentId: string;
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
    });

    // Get Puppeteer instance based on environment (Vercel vs local)
    const { puppeteer, launchOptions } = await getPuppeteerConfig();
    
    console.log(
      "🌐 Using Puppeteer:",
      process.env.VERCEL === "1" ? "Vercel (serverless)" : "Local",
    );

    // Launch browser with optimized settings for PDF generation
    const browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

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

    console.log(
      "📄 Navigating to visit template URL:",
      templateUrl.toString(),
    );

    // Navigate to the template page
    const response = await page.goto(templateUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 30000,
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

    // Wait for images to load
    try {
      await page.waitForFunction(
        () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.every((img) => img.complete);
        },
        { timeout: 10000 },
      );
      console.log("✅ All images loaded successfully");
    } catch {
      console.warn("⚠️ Image loading timeout, proceeding anyway...");
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

    console.log("🎨 Template loaded, generating PDF...");

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false, // Always portrait for visit documents
      printBackground: true,
      margin: {
        top: "5mm",     // Top margin for all pages
        right: "0mm",
        bottom: "15mm", // Bottom margin for all pages
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log("✅ Visit PDF generated successfully");

    // Return PDF as response
    // Convert to Uint8Array which NextResponse accepts
    const pdfUint8Array = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="visita-${appointmentId}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Visit PDF generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

