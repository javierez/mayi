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
  Users,
  Handshake,
  Trophy,
  Target,
  TrendingUp,
  DollarSign,
  Rocket,
  Shield,
  Globe,
  CheckCircle,
  Star,
} from "lucide-react";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Programa de Socios - Vesta",
  description:
    "Crece con nosotros como socio de Vesta. Programa de partners para agencias, consultores y integradores tecnológicos.",
};

export default function SociosPage() {
  const partnerTypes = [
    {
      icon: Users,
      title: "Partner de Ventas",
      description: "Revende Vesta a tus clientes inmobiliarios",
      commission: "Hasta 30%",
      benefits: [
        "Comisiones recurrentes",
        "Materiales de venta incluidos",
        "Formación comercial completa",
        "Soporte técnico dedicado",
      ],
    },
    {
      icon: Rocket,
      title: "Partner Tecnológico",
      description: "Integra Vesta en tus soluciones",
      commission: "Revenue Share",
      benefits: [
        "Acceso API prioritario",
        "Documentación técnica avanzada",
        "Co-marketing opportunities",
        "Desarrollo conjunto de features",
      ],
    },
    {
      icon: Target,
      title: "Consultor Certificado",
      description: "Implementa y forma a clientes en Vesta",
      commission: "Por proyecto",
      benefits: [
        "Certificación oficial",
        "Proyectos exclusivos",
        "Tarifas preferenciales",
        "Badge de partner verificado",
      ],
    },
    {
      icon: Globe,
      title: "Partner Regional",
      description: "Representa Vesta en tu región",
      commission: "Exclusividad territorial",
      benefits: [
        "Derechos exclusivos de región",
        "Soporte de marketing local",
        "Eventos y ferias incluidos",
        "Formación presencial",
      ],
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Ingresos Recurrentes",
      description: "Comisiones mensuales por cada cliente activo que traigas",
    },
    {
      icon: Trophy,
      title: "Programa de Incentivos",
      description:
        "Bonificaciones adicionales por cumplir objetivos trimestrales",
    },
    {
      icon: Shield,
      title: "Soporte Completo",
      description:
        "Equipo dedicado para ayudarte en ventas, técnico y marketing",
    },
    {
      icon: TrendingUp,
      title: "Crecimiento Conjunto",
      description: "Crecer juntos en un mercado en constante expansión",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Aplica al Programa",
      description: "Completa el formulario de solicitud con tu información",
    },
    {
      step: "2",
      title: "Evaluación",
      description: "Revisamos tu perfil y experiencia en el sector",
    },
    {
      step: "3",
      title: "Formación",
      description: "Curso intensivo sobre Vesta y técnicas de venta",
    },
    {
      step: "4",
      title: "Certificación",
      description: "Obtén tu certificación oficial como Partner de Vesta",
    },
    {
      step: "5",
      title: "¡Empieza a Vender!",
      description: "Comienza a generar ingresos con el soporte completo",
    },
  ];

  const requirements = [
    "Experiencia en el sector inmobiliario o tecnológico",
    "Cartera de clientes potenciales o canal de ventas",
    "Conocimientos básicos de CRM y herramientas digitales",
    "Compromiso con la calidad y servicio al cliente",
    "Disponibilidad para formación inicial (40 horas)",
  ];

  const testimonials = [
    {
      name: "Carlos Mendoza",
      company: "TechRealty Solutions",
      role: "Partner Tecnológico",
      quote:
        "El programa de partners de Vesta nos ha permitido ofrecer una solución completa a nuestros clientes inmobiliarios. Las comisiones son excelentes y el soporte técnico impecable.",
      rating: 5,
    },
    {
      name: "Ana García",
      company: "Consultoría Inmobiliaria Norte",
      role: "Partner Regional",
      quote:
        "En 18 meses hemos crecido un 300% gracias a la representación exclusiva de Vesta en nuestra región. El producto se vende solo.",
      rating: 5,
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
              <Handshake className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Programa de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Socios
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Crece con nosotros como socio de Vesta. Genera ingresos
              recurrentes ayudando a profesionales inmobiliarios a transformar
              su negocio.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="#aplicar">
                  Aplicar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/empresa/contacto">Información Detallada</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Tipos de Partnership
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Encuentra el programa que mejor se adapte a tu perfil y objetivos
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {partnerTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.title}
                  className="transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{type.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {type.description}
                        </CardDescription>
                        <div className="mt-2">
                          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                            {type.commission}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {type.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
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
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Beneficios del Programa
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ventajas exclusivas para nuestros partners
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={benefit.title}
                  className="transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {benefit.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Cómo Convertirte en Partner
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Proceso simple en 5 pasos
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 hidden h-full w-0.5 -translate-x-px transform bg-amber-200 lg:block"></div>
            <div className="space-y-8 lg:space-y-12">
              {steps.map((step, index) => (
                <div
                  key={step.step}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "lg:justify-start" : "lg:justify-end"
                  }`}
                >
                  <div
                    className={`w-full lg:w-5/12 ${
                      index % 2 === 0
                        ? "lg:pr-8 lg:text-right"
                        : "lg:pl-8 lg:text-left"
                    }`}
                  >
                    <Card className="transition-all hover:shadow-lg">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
                            <span className="text-sm font-bold text-white">
                              {step.step}
                            </span>
                          </div>
                          <CardTitle className="text-lg">
                            {step.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute left-1/2 hidden -translate-x-1/2 transform items-center justify-center lg:flex">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Requisitos del Programa
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Lo que buscamos en nuestros partners
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <ul className="space-y-4">
                {requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Lo que Dicen Nuestros Partners
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-2 flex items-center gap-1">
                    {[...(Array(testimonial.rating) as unknown[])].map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ),
                    )}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>
                    {testimonial.role} en {testimonial.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <blockquote className="italic text-gray-700">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="aplicar"
        className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para Ser Nuestro Partner?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Únete a una red de partners exitosos que están creciendo con Vesta.
            El momento perfecto para empezar es ahora.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/empresa/contacto">
                Aplicar al Programa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/recursos/documentacion">Documentación Partners</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Proceso de evaluación: 5-7 días laborables • Formación incluida •
            Soporte completo
          </p>
        </div>
      </section>
    </div>
  );
}
