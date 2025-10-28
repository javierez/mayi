import { type NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getCurrentUserAccountId } from "~/lib/dal";

interface NotaEncargoData {
  documentNumber: string;
  agency: {
    agentName: string;
    collegiateNumber: string;
    agentNIF: string;
    website: string;
    email: string;
    logo?: string;
    offices: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }>;
  };
  client: {
    fullName: string;
    nif: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  property: {
    description: string;
    allowSignage: string;
    energyCertificate: string;
    keyDelivery: string;
    allowVisits: string;
  };
  operation: {
    type: string;
    price: string;
  };
  commission: {
    percentage: number;
    minimum: string;
  };
  duration: {
    months: number;
  };
  signatures: {
    location: string;
    date: string;
  };
  jurisdiction: {
    city: string;
  };
  observations: string;
  hasOtherAgency?: boolean;
  gdprConsent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { data } = (await request.json()) as {
      data: NotaEncargoData;
    };

    // Validate input data
    if (!data) {
      return NextResponse.json(
        { error: "Missing nota encargo data" },
        { status: 400 },
      );
    }

    console.log("🚀 Starting Nota de Encargo PDF generation with Puppeteer...");

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

    // Add logo to the data
    const dataWithLogo = {
      ...data,
      agency: {
        ...data.agency,
        logo: logo,
      },
    };

    console.log("📊 PDF Generation - Data with logo:", {
      agencyLogo: dataWithLogo.agency.logo,
      agencyName: dataWithLogo.agency.agentName,
    });

    // Launch browser with optimized settings for PDF generation
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

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

    console.log(
      "📄 Navigating to nota encargo template URL:",
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
        top: "5mm",
        right: "0mm",
        bottom: "10mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log("✅ Nota de Encargo PDF generated successfully");

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nota-encargo-${dataWithLogo.documentNumber}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Nota de Encargo PDF generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
