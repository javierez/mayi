/**
 * Puppeteer utility for environment-aware browser launching
 *
 * Automatically detects if running in Vercel (serverless) or local environment
 * and uses the appropriate Puppeteer setup:
 * - Vercel: puppeteer-core + @sparticuz/chromium (serverless-compatible)
 * - Local: puppeteer (full Chromium binary)
 */

import type { PuppeteerNode as PuppeteerType } from "puppeteer";
import type { PuppeteerNode as PuppeteerCoreType } from "puppeteer-core";

interface PuppeteerConfig {
  puppeteer: PuppeteerType | PuppeteerCoreType;
  launchOptions: {
    args?: string[];
    defaultViewport?: { width: number; height: number } | null;
    executablePath?: string;
    headless?: boolean | "shell";
  };
}

export async function getPuppeteerConfig(): Promise<PuppeteerConfig> {
  // Check if we're in Vercel (serverless environment)
  const isServerless =
    process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    // Use puppeteer-core with serverless Chromium for Vercel
    const chromiumModule = await import("@sparticuz/chromium");
    const chromium = chromiumModule.default;
    const puppeteerCore = await import("puppeteer-core");

    // The @sparticuz/chromium package includes the binary and handles extraction
    const executablePath = await chromium.executablePath();

    console.log("✅ Chromium executable path resolved:", executablePath);

    return {
      puppeteer: puppeteerCore.default,
      launchOptions: {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
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

