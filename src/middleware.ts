import { type NextRequest, NextResponse } from "next/server";

// Public paths that should not require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/account-setup",
  "/api/auth",
  "/api/puppet/template",
  "/ingest", // PostHog analytics proxy
  "/templates",
  "/sandbox",
  "/producto/caracteristicas",
  "/producto/integraciones",
  "/producto/seguridad",
  "/producto/api",
  "/soluciones/equipos-ventas",
  "/soluciones/equipos-marketing",
  "/soluciones/servicio-cliente",
  "/soluciones/pequenas-empresas",
  "/soluciones/empresas",
  "/precios",
  "/recursos/documentacion",
  "/recursos/blog",
  "/recursos/soporte",
  "/empresa/nosotros",
  "/empresa/carreras",
  "/empresa/socios",
  "/empresa/contacto",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public paths and static assets (including PostHog /ingest)
  if (
    publicPaths.some((path) =>
      path === "/" ? pathname === "/" : pathname.startsWith(path),
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Everything else is protected - requires authentication
  // Use cookie-based check to avoid Edge Runtime database issues

  // Check for session token - try both secure and non-secure cookie names
  // In production (HTTPS), Better Auth uses __Secure- prefix
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token");

  if (!sessionToken?.value) {
    console.log(
      `🔄 Redirecting to homepage from: ${pathname} - No session token found`,
    );
    // No session token, redirect to homepage
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // For authenticated users, let the DAL handle full session validation
  // We just pass through with basic session indication
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-has-session-token", "true");

  // If database is unavailable and session validation fails in DAL,
  // the DAL will return null and trigger UnauthorizedError
  // We could add additional checks here, but for now let DAL handle it
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
