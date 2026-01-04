/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Type checking is handled by GitHub Actions CI
    // This speeds up Vercel builds and prevents timeouts
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting is handled by GitHub Actions CI
    // This speeds up Vercel builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "acropolis-realestate.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn-magnific.freepik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/**",
      },
    ],
    // Disable Vercel Image Optimization to avoid 402 quota errors
    // Images are served directly from S3
    unoptimized: true,
  },
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
    "web-push",
    "heic-convert",
    "heic-decode",
    "libheif-js",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increase from 1MB to 10MB for large property data
    },
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default config;
