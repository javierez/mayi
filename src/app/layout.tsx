import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserRoleProvider } from "~/components/providers/user-role-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsentBanner } from "~/components/cookie-consent-banner";
import { OrganizationSchema } from "~/components/seo/OrganizationSchema";
import { SoftwareApplicationSchema } from "~/components/seo/SoftwareApplicationSchema";
import { WebSiteSchema } from "~/components/seo/WebSiteSchema";
import { ServiceWorkerRegistration } from "~/components/notifications/service-worker-registration";
import { IOSStandaloneRedirect } from "~/components/ios-standalone-redirect";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://vesta.com'),
  title: {
    default: 'Mayi App - Software Inmobiliario con IA | Gestión de Propiedades',
    template: '%s | Mayi App'
  },
  description: 'CRM inmobiliario líder en España. Gestiona propiedades, contactos y publica en múltiples portales (Fotocasa, Idealista) con inteligencia artificial. Prueba gratis.',
  keywords: ['CRM inmobiliario', 'software inmobiliario España', 'gestión propiedades', 'Fotocasa', 'Idealista', 'automatización inmobiliaria', 'IA inmobiliaria'],
  authors: [{ name: 'Mayi' }],
  creator: 'Mayi',
  publisher: 'Mayi',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://vesta.com',
    siteName: 'Mayi App',
    title: 'Mayi App - Software Inmobiliario con IA',
    description: 'CRM inmobiliario líder en España. Gestiona propiedades, contactos y publica en múltiples portales con IA.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Mayi App - Software Inmobiliario',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayi App - Software Inmobiliario con IA',
    description: 'CRM inmobiliario líder en España. Gestiona propiedades, contactos y publica en múltiples portales.',
    images: ['/twitter-image.png'],
    creator: '@javierez_98',
  },
  alternates: {
    canonical: 'https://vesta.com',
  },
  appleWebApp: {
    capable: true,
    title: "Mayi App",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50`}>
        <IOSStandaloneRedirect />
        <UserRoleProvider>{children}</UserRoleProvider>
        <CookieConsentBanner />
        <ServiceWorkerRegistration />
        <SpeedInsights />
        <Analytics />
        <OrganizationSchema />
        <SoftwareApplicationSchema />
        <WebSiteSchema />
      </body>
    </html>
  );
}
