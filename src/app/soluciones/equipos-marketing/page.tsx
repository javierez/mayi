import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Megaphone,
  Target,
  TrendingUp,
  BarChart3,
  Mail,
  Globe,
  Camera,
  Check,
} from "lucide-react";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Solución para Equipos de Marketing - Vesta",
  description:
    "Atrae más clientes con marketing inmobiliario efectivo. Herramientas de promoción, análisis y generación de leads.",
};

export default function EquiposMarketingPage() {
  const features = [
    {
      icon: Megaphone,
      title: "Campañas Multi-Canal",
      description:
        "Promociona propiedades en todos los canales digitales desde una sola plataforma",
    },
    {
      icon: Target,
      title: "Segmentación Inteligente",
      description:
        "Llega al público correcto con segmentación basada en datos y comportamiento",
    },
    {
      icon: Camera,
      title: "Marketing Visual",
      description:
        "Crea contenido visual impactante con nuestro editor de imágenes integrado",
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description:
        "Campañas de email automatizadas y personalizadas para cada cliente",
    },
    {
      icon: Globe,
      title: "Presencia Digital",
      description:
        "Gestiona tu presencia online y portales inmobiliarios desde un solo lugar",
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzado",
      description:
        "Mide el ROI de cada campaña y optimiza tu estrategia de marketing",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Marketing Inmobiliario{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                que Convierte
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Atrae más clientes, genera más leads y cierra más ventas con
              herramientas de marketing diseñadas específicamente para el sector
              inmobiliario.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/dashboard">
                  Empezar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/producto/caracteristicas">Ver Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Todo lo que Necesitas para tu Marketing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Herramientas profesionales para promocionar propiedades y captar
              clientes
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="transition-all hover:shadow-lg"
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

      {/* Benefits */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Resultados que Importan
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Nuestros clientes ven resultados reales desde el primer mes
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "75% más leads cualificados",
                  "50% reducción en tiempo de venta",
                  "3x retorno de inversión en marketing",
                  "90% de satisfacción del cliente",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 opacity-30 blur-3xl" />
                <div className="relative rounded-lg bg-white p-8 shadow-xl">
                  <TrendingUp className="h-12 w-12 text-amber-600" />
                  <div className="mt-4 text-4xl font-bold text-gray-900">
                    +250%
                  </div>
                  <div className="mt-2 text-gray-600">
                    Crecimiento promedio en leads
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Transforma tu Marketing Inmobiliario
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Únete a cientos de agencias que ya están creciendo con Vesta
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Prueba Gratuita de 30 Días
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
