import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Zap,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Star,
  Check,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Solución para Pequeñas Empresas - Vesta",
  description:
    "Todo lo que necesita tu inmobiliaria para crecer. Solución completa y asequible para agencias pequeñas.",
};

export default function PequenasEmpresasPage() {
  const features = [
    {
      icon: Zap,
      title: "Configuración Rápida",
      description:
        "Empieza a usar Vesta en menos de 30 minutos sin conocimientos técnicos",
    },
    {
      icon: DollarSign,
      title: "Precio Asequible",
      description:
        "Planes diseñados para presupuestos de pequeñas empresas, máximo valor",
    },
    {
      icon: Users,
      title: "Fácil de Usar",
      description:
        "Interfaz intuitiva que todo tu equipo puede usar desde el primer día",
    },
    {
      icon: TrendingUp,
      title: "Escalable",
      description:
        "Crece con tu negocio, añade funciones y usuarios según necesites",
    },
    {
      icon: Shield,
      title: "Seguro y Confiable",
      description: "Misma seguridad empresarial sin la complejidad ni el costo",
    },
    {
      icon: Clock,
      title: "Soporte Dedicado",
      description:
        "Ayuda personalizada para pequeñas empresas, no eres solo un número",
    },
  ];

  const benefits = [
    "Reduce costos operativos hasta 40%",
    "Aumenta productividad del equipo",
    "Mejora satisfacción del cliente",
    "Simplifica procesos diarios",
    "Acceso a herramientas empresariales",
    "Sin contratos de permanencia",
  ];

  const testimonial = {
    quote:
      "Vesta transformó completamente nuestra pequeña inmobiliaria. En 6 meses duplicamos nuestras ventas y ahora podemos competir con las grandes agencias.",
    author: "María González",
    company: "Inmobiliaria González & Asociados",
    location: "Valencia",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Hecho para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Pequeñas Empresas
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Todo lo que necesita tu inmobiliaria para crecer. Solución
              completa, fácil de usar y asequible. Empieza hoy mismo y ve
              resultados desde la primera semana.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/dashboard">
                  Prueba Gratis 30 Días
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/precios">Ver Precios</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Sin tarjeta de crédito • Sin compromiso • Soporte incluido
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Diseñado Pensando en Ti
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Entendemos los desafíos únicos de las pequeñas inmobiliarias
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
                Beneficios Inmediatos para tu Negocio
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Desde el primer día notarás la diferencia en la eficiencia de tu
                inmobiliaria
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/producto/caracteristicas">
                    Ver Todas las Características
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 opacity-30 blur-3xl" />
                <div className="relative rounded-lg bg-white p-8 shadow-xl">
                  <TrendingUp className="h-12 w-12 text-amber-600" />
                  <div className="mt-4 text-4xl font-bold text-gray-900">
                    2x
                  </div>
                  <div className="mt-2 text-gray-600">
                    Crecimiento promedio en ventas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <div className="flex items-center gap-1">
                {[...(Array(5) as unknown[])].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="text-lg italic text-gray-700">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6">
                <div className="font-semibold text-gray-900">
                  {testimonial.author}
                </div>
                <div className="text-gray-600">{testimonial.company}</div>
                <div className="text-sm text-gray-500">
                  {testimonial.location}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Tu Competencia Ya Está Creciendo
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No te quedes atrás. Únete a las pequeñas inmobiliarias que están
            revolucionando su forma de trabajar con Vesta.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Empezar Ahora Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresa/contacto">Hablar con un Especialista</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Más de 500 pequeñas inmobiliarias ya confían en Vesta
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
