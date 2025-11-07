import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe,
  FileText,
  Cloud,
  Zap,
  Shield,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Integraciones - Vesta Real Estate Platform",
  description:
    "Conecta Vesta con los principales portales inmobiliarios y herramientas de productividad. Integración perfecta con Fotocasa, Idealista, y más.",
};

export default function IntegracionesPage() {
  const portalIntegrations = [
    {
      name: "Fotocasa",
      description: "Portal líder en España con millones de visitas mensuales",
      features: [
        "Publicación automática",
        "Sincronización de estados",
        "Gestión de leads",
        "Analytics integrado",
      ],
      status: "Activo",
    },
    {
      name: "Idealista",
      description: "El portal inmobiliario más visitado de España",
      features: [
        "Publicación masiva",
        "Actualización en tiempo real",
        "Control de presupuesto",
        "Informes detallados",
      ],
      status: "Activo",
    },
    {
      name: "Habitaclia",
      description: "Portal especializado en el mercado catalán",
      features: [
        "Multi-idioma",
        "Gestión de destacados",
        "Sincronización bidireccional",
        "Control de calidad",
      ],
      status: "Activo",
    },
    {
      name: "Milanuncios",
      description: "Plataforma de anuncios clasificados más popular",
      features: [
        "Publicación gratuita",
        "Renovación automática",
        "Gestión de respuestas",
        "Detección de duplicados",
      ],
      status: "Activo",
    },
  ];

  const technicalIntegrations = [
    {
      category: "Almacenamiento",
      icon: Cloud,
      integrations: ["AWS S3", "Google Drive", "Dropbox Business"],
    },
    {
      category: "Comunicación",
      icon: Globe,
      integrations: ["WhatsApp Business", "Telegram", "SMS Gateway"],
    },
    {
      category: "Productividad",
      icon: FileText,
      integrations: ["Google Calendar", "Microsoft Outlook", "Slack"],
    },
    {
      category: "Análisis",
      icon: Zap,
      integrations: ["Google Analytics", "Hotjar", "Mixpanel"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Integraciones que{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Potencian tu Negocio
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Conecta Vesta con los principales portales inmobiliarios y
              herramientas empresariales. Todo sincronizado, todo automático.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/dashboard">
                  Explorar Integraciones
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/producto/api">Ver Documentación API</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Integrations */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Portales Inmobiliarios
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Publica tus propiedades en los principales portales con un solo
              click
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {portalIntegrations.map((portal) => (
              <Card
                key={portal.name}
                className="overflow-hidden transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{portal.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {portal.description}
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      {portal.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {portal.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Integrations */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Integraciones Técnicas
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Conecta con las herramientas que ya usas para maximizar tu
              productividad
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {technicalIntegrations.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {category.category}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {category.integrations.map((integration) => (
                      <li key={integration} className="text-sm text-gray-600">
                        {integration}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Shield className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            API REST Completa
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Crea integraciones personalizadas con nuestra API REST documentada.
            Webhooks en tiempo real, SDKs disponibles, y soporte técnico
            dedicado.
          </p>
          <div className="mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link href="/producto/api">
                Explorar Documentación API
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
