/**
 * Puppeteer utility for environment-aware browser launching
 * 
 * Automatically detects if running in Vercel (serverless) or local environment
 * and uses the appropriate Puppeteer setup:
 * - Vercel: puppeteer-core + @sparticuz/chromium-min (serverless-compatible)
 * - Local: puppeteer (full Chromium binary)
 */

interface PuppeteerConfig {
  puppeteer: typeof import("puppeteer-core");
  launchOptions: Parameters<typeof import("puppeteer-core").default.launch>[0];
}

export async function getPuppeteerConfig(): Promise<PuppeteerConfig> {
  // Check if we're in Vercel (serverless environment)
  const isServerless =
    process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    // Use puppeteer-core with serverless Chromium for Vercel
    const chromium = await import("@sparticuz/chromium-min");
    const puppeteerCore = await import("puppeteer-core");

    return {
      puppeteer: puppeteerCore.default,
      launchOptions: {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      },
    };
  } else {
    // Use regular puppeteer for local development
    const puppeteer = await import("puppeteer");

    return {
      puppeteer: puppeteer.default,
      launchOptions: {
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
      },
    };
  }
}

