import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  HeadphonesIcon,
  MessageSquare,
  Clock,
  Heart,
  Star,
  UserCheck,
  Phone,
  Check,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Solución para Servicio al Cliente - Vesta",
  description:
    "Mejora la satisfacción del cliente con herramientas de gestión y comunicación eficaces.",
};

export default function ServicioClientePage() {
  const features = [
    {
      icon: MessageSquare,
      title: "Comunicación Multicanal",
      description:
        "Centraliza WhatsApp, email, SMS y llamadas en una sola plataforma",
    },
    {
      icon: Clock,
      title: "Respuesta Rápida",
      description:
        "Templates y respuestas automáticas para reducir tiempos de respuesta",
    },
    {
      icon: UserCheck,
      title: "Seguimiento de Clientes",
      description:
        "Historial completo de interacciones y preferencias del cliente",
    },
    {
      icon: Star,
      title: "Gestión de Feedback",
      description:
        "Recolecta y gestiona valoraciones y comentarios de clientes",
    },
    {
      icon: Heart,
      title: "Experiencia Personalizada",
      description:
        "Adapta la comunicación según el perfil y historial del cliente",
    },
    {
      icon: Phone,
      title: "Soporte 24/7",
      description: "Herramientas para brindar soporte continuo a tus clientes",
    },
  ];

  const metrics = [
    { value: "95%", label: "Satisfacción del Cliente" },
    { value: "2 min", label: "Tiempo de Respuesta" },
    { value: "24/7", label: "Disponibilidad" },
    { value: "50%", label: "Menos Consultas Repetidas" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <HeadphonesIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Servicio al Cliente{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Excepcional
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Mejora la satisfacción de tus clientes con herramientas de
              comunicación eficaces y seguimiento personalizado. Clientes
              felices, negocio próspero.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/dashboard">
                  Mejorar Servicio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/recursos/soporte">Ver Soporte</Link>
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
              Herramientas para un Servicio Premium
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Todo lo que necesitas para brindar un servicio al cliente de
              primera clase
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

      {/* Metrics */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Resultados que Hablan por Sí Solos
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Métricas reales de nuestros clientes más exitosos
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="mt-2 text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 opacity-30 blur-3xl" />
                <div className="relative rounded-lg bg-white p-8 shadow-xl">
                  <Heart className="h-12 w-12 text-amber-600" />
                  <div className="mt-4 text-4xl font-bold text-gray-900">
                    4.9/5
                  </div>
                  <div className="mt-2 text-gray-600">
                    Satisfacción promedio
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Clientes Más Felices, Más Referencias
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Un servicio al cliente excepcional no solo retiene clientes,
                sino que los convierte en embajadores de tu marca
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Mayor retención de clientes",
                  "Más referencias y recomendaciones",
                  "Mejor reputación online",
                  "Procesos de servicio más eficientes",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Eleva tu Servicio al Cliente al Siguiente Nivel
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Empieza a brindar un servicio excepcional que tus clientes
            recordarán y recomendarán
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Empezar Mejora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresa/contacto">Hablar con Experto</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
