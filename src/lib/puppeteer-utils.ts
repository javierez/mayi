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
  // Using VERCEL_ENV as per official Vercel guide: https://vercel.com/guides/deploying-puppeteer-with-nextjs-on-vercel
  const isVercel = !!process.env.VERCEL_ENV;
  const isServerless = isVercel || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  console.log("🔍 Puppeteer Environment Detection:", {
    isServerless,
    isVercel,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    vercelEnv: process.env.VERCEL_ENV,
    awsLambda: process.env.AWS_LAMBDA_FUNCTION_NAME,
  });

  if (isServerless) {
    // Use puppeteer-core with serverless Chromium for Vercel
    // Following official Vercel guide: https://vercel.com/guides/deploying-puppeteer-with-nextjs-on-vercel
    const chromiumModule = await import("@sparticuz/chromium");
    const chromium = chromiumModule.default;
    const puppeteerCore = await import("puppeteer-core");

    console.log("📦 @sparticuz/chromium loaded");

    // Get the executable path - @sparticuz/chromium handles extraction automatically
    const executablePath = await chromium.executablePath();

    console.log("✅ Chromium executable path resolved:", executablePath);

    // Use chromium.args directly as per Vercel guide, but add --single-process
    // which is critical for serverless to avoid system library dependencies
    const launchArgs = [
      ...chromium.args,
      "--single-process", // Critical for serverless - prevents loading system libraries like libnss3.so
    ];

    console.log("🚀 Launch args:", launchArgs);

    return {
      puppeteer: puppeteerCore.default,
      launchOptions: {
        args: launchArgs,
        executablePath,
        headless: chromium.headless ?? true,
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

