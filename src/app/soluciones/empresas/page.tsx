import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Building,
  Users,
  Shield,
  BarChart3,
  Globe,
  Settings,
  Zap,
  Lock,
  CheckCircle,
} from "lucide-react";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Solución Empresarial - Vesta",
  description:
    "Plataforma escalable para grandes organizaciones inmobiliarias. Seguridad enterprise, integración avanzada y soporte dedicado.",
};

export default function EmpresasPage() {
  const enterpriseFeatures = [
    {
      icon: Users,
      title: "Gestión Multi-Equipo",
      description:
        "Gestiona múltiples oficinas, equipos y departamentos desde una plataforma unificada",
    },
    {
      icon: Shield,
      title: "Seguridad Enterprise",
      description:
        "Cumplimiento SOC 2, SSO, auditorías de seguridad y controles de acceso avanzados",
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzado",
      description:
        "Dashboards ejecutivos, reportes personalizados y BI integrado para toma de decisiones",
    },
    {
      icon: Globe,
      title: "Multi-Región",
      description:
        "Soporte para operaciones en múltiples países con localización completa",
    },
    {
      icon: Settings,
      title: "Integración Personalizada",
      description:
        "APIs dedicadas, webhooks empresariales y conectores para sistemas legacy",
    },
    {
      icon: Zap,
      title: "Rendimiento Optimizado",
      description:
        "Infraestructura dedicada, CDN global y garantías de SLA del 99.99%",
    },
  ];

  const enterpriseBenefits = [
    "Reducción del 60% en costos operativos",
    "Mejora del 45% en productividad del equipo",
    "Tiempo de implementación reducido a 30 días",
    "ROI del 300% en el primer año",
    "Cumplimiento automático de normativas",
    "Soporte 24/7 con SLA garantizado",
  ];

  const companyLogos = [
    "Remax",
    "Century 21",
    "Coldwell Banker",
    "Engel & Völkers",
    "Keller Williams",
    "Sotheby's",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Building className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Solución{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Empresarial
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Plataforma escalable para grandes organizaciones inmobiliarias.
              Seguridad enterprise, integración avanzada y soporte dedicado para
              tu crecimiento.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/empresa/contacto">
                  Solicitar Demo Enterprise
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/precios">Ver Precios Enterprise</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
              Confianza de las principales inmobiliarias
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {companyLogos.map((company) => (
              <div key={company} className="flex items-center justify-center">
                <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
                  <span className="font-medium text-gray-400">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Características Enterprise
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Herramientas avanzadas para organizaciones que requieren lo mejor
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enterpriseFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-l-4 border-l-amber-400 transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Benefits */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Resultados Empresariales Comprobados
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Las organizaciones más grandes confían en Vesta para sus
                operaciones críticas
              </p>
              <ul className="mt-8 space-y-4">
                {enterpriseBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    Seguridad Garantizada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Cumplimiento SOC 2 Type II, ISO 27001, GDPR y todas las
                    normativas de seguridad empresarial más exigentes.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Soporte Dedicado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Customer Success Manager dedicado, soporte 24/7 y SLA
                    garantizado del 99.99% de uptime.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Proceso de Implementación Enterprise
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Migración sin interrupciones con nuestro equipo especializado
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Análisis",
                description: "Evaluamos tu infraestructura actual",
              },
              {
                step: "2",
                title: "Planificación",
                description: "Diseñamos la migración personalizada",
              },
              {
                step: "3",
                title: "Implementación",
                description: "Migración supervisada por expertos",
              },
              {
                step: "4",
                title: "Optimización",
                description: "Fine-tuning y capacitación del equipo",
              },
            ].map((phase) => (
              <div key={phase.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
                  <span className="text-lg font-bold text-white">
                    {phase.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{phase.title}</h3>
                <p className="mt-2 text-gray-600">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para la Transformación Digital?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Habla con nuestros especialistas en soluciones enterprise y descubre
            cómo Vesta puede transformar tu organización.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/empresa/contacto">
                Contactar Especialista
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/producto/seguridad">Ver Seguridad Enterprise</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Implementación personalizada • SLA garantizado • Soporte dedicado
          </p>
        </div>
      </section>
    </div>
  );
}
