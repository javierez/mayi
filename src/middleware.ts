import { type NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

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
  "/changelog",
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
  // Get cached session data from cookie (edge-compatible, no DB call)
  const session = await getCookieCache(request);

  // If no valid session, redirect to homepage
  if (!session?.user) {
    console.log(
      `🔄 Unauthorized access attempt: ${pathname} - No valid session found`,
    );
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Extract user data and set headers for server components to use
  // This allows server components to skip auth.api.getSession() calls
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  requestHeaders.set("x-user-email", session.user.email);

  // Set optional fields if available
  if (session.user.name) {
    requestHeaders.set("x-user-name", session.user.name);
  }

  if (session.user.accountId) {
    requestHeaders.set("x-user-account-id", String(session.user.accountId));
  }

  // Pass request through with enriched headers
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
