import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  Target,
  Globe,
  Heart,
  Zap,
  Shield,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Acerca de Nosotros - Vesta",
  description:
    "Conoce la historia, misión y equipo detrás de Vesta, la plataforma líder en gestión inmobiliaria.",
};

export default function NosotrosPage() {
  const stats = [
    { value: "2025", label: "Año de Fundación" },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Acerca de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Somos un equipo apasionado por transformar la forma en que las
              agencias inmobiliarias gestionan sus negocios.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-center">
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
                Todo empezó con una idea simple: eliminar por completo todas 
                las tareas administrativas que consumen tiempo en el sector inmobiliario. Pensamos que todo ese
                trabajo podría optimizarse, y teníamos razón.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Nuestra misión es reducir drásticamente las tareas administrativas usando
                las nuevas tecnologías de IA. No importa si eres una pequeña agencia o un
                gran grupo inmobiliario. Solo queremos una cosa:{" "}
                <span className="font-semibold text-gray-900">ayudarte a vender más</span>.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Esto es lo que nos diferencia de otros CRMs inmobiliarios. Estamos construyendo herramientas reales que eliminan el trabajo tedioso
                para que puedas enfocarte en lo que importa: cerrar operaciones.
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
                Queremos ser la empresa inmobiliaria más tecnológicamente avanzada del sector.
                Estar a la vanguardia, ser punteros en innovación y calidad. Porque para nosotros,
                la calidad del producto es lo más importante.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Nuestra plataforma te permite crecer tanto vertical como horizontalmente: desde
                gestionar ventas hasta expandirte a alquileres y otros servicios inmobiliarios.
                Todo en un solo lugar, con la mejor tecnología del mercado.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                La satisfacción del cliente es innegociable. Por eso tenemos una política de cero
                errores y soporte 24/7. Queremos que estés feliz con nuestro producto en todo momento.
                Ese es nuestro compromiso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Nuestros Valores
            </h2>
            <p className="mt-2 text-gray-600">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-lg bg-white p-4 text-center shadow-md transition-shadow hover:shadow-lg"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team
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
      */}

      {/* Timeline
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
      */}

      {/* Awards
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
      */}

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

      <Footer />
    </div>
  );
}
