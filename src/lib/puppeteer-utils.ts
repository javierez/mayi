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

    // CRITICAL: Set graphics mode to false BEFORE getting executablePath
    // This prevents Chromium from trying to load system libraries like libnss3.so
    // Must be set as property, not method call
    chromium.setGraphicsMode = false;
    
    // Get the executable path - @sparticuz/chromium handles extraction automatically
    const executablePath = await chromium.executablePath();

    console.log("✅ Chromium executable path resolved:", executablePath);
    console.log("📊 Graphics mode disabled:", chromium.setGraphicsMode === false);

    // Use chromium.args with additional flags to prevent system library loading
    // The --single-process flag is absolutely critical for Node.js 22.x on Vercel
    const launchArgs = [
      ...chromium.args,
      "--single-process", // CRITICAL: Run in single process mode
      "--no-zygote", // Don't use zygote process
      "--disable-gpu", // Disable GPU hardware acceleration
      "--disable-dev-shm-usage", // Overcome limited resource problems
      "--disable-setuid-sandbox", // Disable setuid sandbox
      "--no-sandbox", // Disable sandbox (required for serverless)
    ];

    console.log("🚀 Launch args:", launchArgs);

    return {
      puppeteer: puppeteerCore.default,
      launchOptions: {
        args: launchArgs,
        executablePath,
        headless: true,
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

