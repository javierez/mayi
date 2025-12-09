import { type NextRequest, NextResponse } from "next/server";

// Public paths that should not require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/verify-reset-code",
  "/auth/account-setup",
  "/api/auth",
  "/api/cron", // Cron jobs authenticate with CRON_SECRET header
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
  "/academia",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones-servicio",
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
  // Check for session token cookie (lasts 7 days)
  // Note: We only check if token exists, DAL handles actual validation

  // In production (HTTPS), Better Auth uses __Secure- prefix
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ??
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    console.log(
      `🔄 Unauthorized access attempt: ${pathname} - No session token found`,
    );
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Session token exists - let DAL handle full validation when needed
  // We don't use getCookieCache() here because it relies on session_data cookie
  // which expires after 5 minutes, causing premature logouts
  return NextResponse.next();
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
