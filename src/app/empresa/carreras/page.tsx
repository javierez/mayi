import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Heart,
  Zap,
  Trophy,
  Coffee,
  Laptop,
  GraduationCap,
  DollarSign,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Carreras - Vesta",
  description:
    "Únete al equipo de Vesta y transforma el sector inmobiliario. Oportunidades de crecimiento en un ambiente innovador.",
};

export default function CarrerasPage() {
  const benefits = [
    {
      icon: Heart,
      title: "Ambiente Positivo",
      description:
        "Cultura de empresa centrada en el bienestar y crecimiento personal",
    },
    {
      icon: Zap,
      title: "Innovación Constante",
      description: "Trabaja con las últimas tecnologías y metodologías ágiles",
    },
    {
      icon: GraduationCap,
      title: "Formación Continua",
      description:
        "Presupuesto anual para cursos, conferencias y certificaciones",
    },
    {
      icon: Coffee,
      title: "Flexibilidad",
      description: "Horarios flexibles y posibilidad de trabajo remoto",
    },
    {
      icon: DollarSign,
      title: "Salario Competitivo",
      description: "Compensación justa más bonus por objetivos y stock options",
    },
    {
      icon: Trophy,
      title: "Impacto Real",
      description: "Tu trabajo transformará la vida de miles de profesionales",
    },
  ];

  const openPositions = [
    {
      title: "Senior Frontend Developer",
      department: "Desarrollo",
      location: "Madrid / Remoto",
      type: "Tiempo Completo",
      description:
        "Buscamos un desarrollador frontend senior para liderar el desarrollo de nuevas funcionalidades en React/Next.js.",
      requirements: [
        "5+ años en desarrollo frontend",
        "Experiencia avanzada en React/Next.js",
        "TypeScript, Tailwind CSS",
        "Testing automatizado",
      ],
    },
    {
      title: "Product Manager",
      department: "Producto",
      location: "Madrid",
      type: "Tiempo Completo",
      description:
        "Lidera la estrategia de producto y colabora con equipos de desarrollo, diseño y negocio.",
      requirements: [
        "3+ años como Product Manager",
        "Experiencia en SaaS B2B",
        "Metodologías ágiles",
        "Análisis de datos y métricas",
      ],
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Barcelona / Remoto",
      type: "Tiempo Completo",
      description:
        "Ayuda a nuestros clientes a obtener el máximo valor de Vesta y crece con ellos.",
      requirements: [
        "2+ años en Customer Success",
        "Excelentes habilidades comunicativas",
        "Conocimiento del sector inmobiliario",
        "Orientación a resultados",
      ],
    },
    {
      title: "DevOps Engineer",
      department: "Infraestructura",
      location: "Remoto",
      type: "Tiempo Completo",
      description:
        "Mantén y optimiza nuestra infraestructura cloud para dar soporte a miles de usuarios.",
      requirements: [
        "3+ años en DevOps/SRE",
        "AWS, Docker, Kubernetes",
        "CI/CD, Infrastructure as Code",
        "Monitorización y observabilidad",
      ],
    },
  ];

  const values = [
    "Transparencia total en comunicación",
    "Decisiones basadas en datos",
    "Foco en el impacto del cliente",
    "Mejora continua como mentalidad",
    "Diversidad e inclusión",
    "Equilibrio vida-trabajo",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Únete a{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Transforma el sector inmobiliario junto a un equipo apasionado por
              la innovación. Crea el futuro de la gestión inmobiliaria.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="#positions">
                  Ver Oportunidades
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Vesta */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              ¿Por qué Trabajar en Vesta?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Más que un trabajo, es una oportunidad de generar impacto real
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={benefit.title}
                  className="text-center transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
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

      {/* Culture & Values */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Nuestra Cultura
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                En Vesta creemos que las mejores ideas surgen cuando las
                personas se sienten cómodas, valoradas y empoderadas para
                innovar.
              </p>
              <p className="text-lg leading-relaxed text-gray-600">
                Fomentamos un ambiente donde la colaboración, la transparencia y
                el aprendizaje continuo son la base de todo lo que hacemos.
              </p>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/empresa/nosotros">
                    Conoce Más Sobre Nosotros
                  </Link>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Nuestros Valores
              </h3>
              <div className="space-y-3">
                {values.map((value) => (
                  <div key={value} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
              <div className="relative mt-8">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-rose-400 opacity-30 blur-3xl" />
                <div className="relative rounded-lg bg-white p-6 shadow-lg">
                  <Users className="mb-3 h-8 w-8 text-amber-600" />
                  <div className="text-2xl font-bold text-gray-900">25+</div>
                  <div className="text-gray-600">
                    Personas increíbles en el equipo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Posiciones Abiertas
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Oportunidades actuales para formar parte del equipo
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position) => (
              <Card
                key={position.title}
                className="transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {position.title}
                      </CardTitle>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {position.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {position.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {position.type}
                        </div>
                      </div>
                    </div>
                    <Button>
                      Aplicar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-gray-600">{position.description}</p>
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">
                      Requisitos:
                    </h4>
                    <ul className="space-y-1">
                      {position.requirements.map((req) => (
                        <li
                          key={req}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {openPositions.length === 0 && (
            <Card className="py-12 text-center">
              <CardContent>
                <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No hay posiciones abiertas en este momento
                </h3>
                <p className="mb-6 text-gray-600">
                  Pero siempre estamos buscando talento excepcional. Envíanos tu
                  CV y te contactaremos cuando tengamos algo que encaje.
                </p>
                <Button asChild>
                  <Link href="/empresa/contacto">Enviar CV Espontáneo</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Perks */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Beneficios del Equipo
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Cuidamos de nuestro equipo porque ellos cuidan de nuestros
              clientes
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Laptop,
                title: "Equipamiento",
                description: "MacBook Pro, monitor 4K y todo lo que necesites",
              },
              {
                icon: GraduationCap,
                title: "Formación",
                description: "€2,000 anuales para cursos y conferencias",
              },
              {
                icon: Coffee,
                title: "Flexibilidad",
                description: "Trabajo remoto y horarios flexibles",
              },
              {
                icon: Heart,
                title: "Seguro Médico",
                description: "Seguro de salud premium para ti y tu familia",
              },
              {
                icon: Trophy,
                title: "Stock Options",
                description: "Participa del éxito de la empresa",
              },
              {
                icon: Users,
                title: "Team Building",
                description: "Eventos de equipo y retiros anuales",
              },
            ].map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{perk.title}</h3>
                  <p className="mt-2 text-gray-600">{perk.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para Cambiar el Mundo Inmobiliario?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Si no hay una posición abierta que encaje contigo, pero crees que
            puedes aportar valor al equipo, nos encantaría conocerte.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/empresa/contacto">
                Contactar con RRHH
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresa/nosotros">Conocer el Equipo</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Somos una empresa comprometida con la diversidad e igualdad de
            oportunidades
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
