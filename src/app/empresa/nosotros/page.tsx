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
  Info,
  Users,
  Target,
  Award,
  Globe,
  Heart,
  Zap,
  Shield,
} from "lucide-react";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Acerca de Nosotros - Vesta",
  description:
    "Conoce la historia, misión y equipo detrás de Vesta, la plataforma líder en gestión inmobiliaria.",
};

export default function NosotrosPage() {
  const stats = [
    { value: "2019", label: "Año de Fundación" },
    { value: "1000+", label: "Inmobiliarias Activas" },
    { value: "50k+", label: "Propiedades Gestionadas" },
    { value: "99.9%", label: "Uptime Garantizado" },
  ];

  const values = [
    {
      icon: Users,
      title: "Cliente Primero",
      description:
        "Cada decisión la tomamos pensando en el éxito de nuestros clientes",
    },
    {
      icon: Zap,
      title: "Innovación Continua",
      description:
        "Siempre buscamos nuevas formas de mejorar y simplificar el trabajo inmobiliario",
    },
    {
      icon: Shield,
      title: "Confianza y Seguridad",
      description:
        "Protegemos los datos como si fueran nuestros, con máxima seguridad",
    },
    {
      icon: Heart,
      title: "Pasión por la Excelencia",
      description:
        "No nos conformamos con lo bueno, siempre buscamos la excelencia",
    },
  ];

  const team = [
    {
      name: "María González",
      role: "CEO & Fundadora",
      description:
        "15 años de experiencia en el sector inmobiliario y tecnología",
    },
    {
      name: "Carlos Ruiz",
      role: "CTO",
      description: "Expert en arquitectura de software y sistemas escalables",
    },
    {
      name: "Ana Martín",
      role: "Head of Product",
      description: "Especialista en UX/UI y desarrollo de productos digitales",
    },
    {
      name: "David López",
      role: "Head of Sales",
      description: "Líder en ventas B2B y desarrollo de nuevos mercados",
    },
  ];

  const timeline = [
    {
      year: "2019",
      title: "Fundación de Vesta",
      description:
        "Iniciamos con la visión de revolucionar la gestión inmobiliaria",
    },
    {
      year: "2020",
      title: "Primeras Integraciones",
      description:
        "Conectamos con Fotocasa e Idealista, llegando a 100 clientes",
    },
    {
      year: "2021",
      title: "Expansión Nacional",
      description: "Presencia en toda España con más de 500 inmobiliarias",
    },
    {
      year: "2022",
      title: "IA y Automatización",
      description:
        "Integramos inteligencia artificial para descripciones automáticas",
    },
    {
      year: "2023",
      title: "Líder del Mercado",
      description:
        "Más de 1000 clientes activos y reconocimiento como líder del sector",
    },
    {
      year: "2024",
      title: "Innovación Continua",
      description:
        "Nuevas funcionalidades y expansión a mercados internacionales",
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
              <Info className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Acerca de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Somos un equipo apasionado por transformar la forma en que los
              profesionales inmobiliarios gestionan sus negocios.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Target className="h-8 w-8 text-amber-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Nuestra Misión
                </h2>
              </div>
              <p className="text-lg leading-relaxed text-gray-600">
                Democratizar el acceso a herramientas tecnológicas avanzadas
                para que cualquier profesional inmobiliario, sin importar el
                tamaño de su empresa, pueda competir en igualdad de condiciones
                y hacer crecer su negocio.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Creemos que la tecnología debe ser un facilitador, no una
                barrera. Por eso desarrollamos soluciones intuitivas que se
                adaptan a las necesidades reales del mercado inmobiliario
                español.
              </p>
            </div>
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Globe className="h-8 w-8 text-amber-600" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Nuestra Visión
                </h2>
              </div>
              <p className="text-lg leading-relaxed text-gray-600">
                Ser la plataforma de referencia para la gestión inmobiliaria en
                España y Europa, reconocida por nuestra innovación, simplicidad
                y el impacto positivo en el éxito de nuestros clientes.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Visualizamos un futuro donde cada transacción inmobiliaria sea
                más eficiente, transparente y satisfactoria para todas las
                partes involucradas, gracias a la tecnología que desarrollamos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Nuestros Valores
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card
                  key={value.title}
                  className="transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{value.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Nuestro Equipo</h2>
            <p className="mt-4 text-lg text-gray-600">
              Las personas que hacen posible Vesta
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card
                key={member.name}
                className="text-center transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-amber-100 to-rose-100">
                    <Users className="h-8 w-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="font-medium text-amber-600">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Nuestra Historia
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              El camino que nos ha llevado hasta aquí
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 h-full w-0.5 -translate-x-px transform bg-amber-200"></div>
            <div className="space-y-12">
              {timeline.map((event, index) => (
                <div
                  key={event.year}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`w-5/12 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}
                  >
                    <Card className="transition-all hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription className="font-medium text-amber-600">
                          {event.year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{event.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="absolute left-1/2 flex -translate-x-1/2 transform items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Reconocimientos
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Premios y certificaciones que avalan nuestro trabajo
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Mejor Plataforma PropTech 2023",
              "Premio Innovación Digital",
              "Certificación ISO 27001",
              "Startup del Año - Real Estate",
              "GDPR Compliance Verified",
              "Top 10 SaaS España",
            ].map((award) => (
              <Card
                key={award}
                className="text-center transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">{award}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Quieres Formar Parte de Nuestra Historia?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Únete a los miles de profesionales que ya están transformando el
            sector inmobiliario con Vesta.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Empezar con Vesta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresa/carreras">Trabajar con Nosotros</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
