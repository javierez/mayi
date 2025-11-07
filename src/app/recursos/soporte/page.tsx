import { type Metadata } from "next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import Link from "next/link";
import {
  ArrowRight,
  HeadphonesIcon,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Video,
  FileText,
  Users,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Centro de Soporte - Vesta",
  description:
    "Ayuda y asistencia técnica para usuarios de Vesta. Encuentra respuestas rápidas o contacta con nuestro equipo.",
};

export default function SoportePage() {
  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Chat en Vivo",
      description: "Habla directamente con nuestro equipo",
      availability: "Lun-Vie 9:00-18:00",
      action: "Iniciar Chat",
    },
    {
      icon: Mail,
      title: "Email",
      description: "soporte@vesta.es",
      availability: "Respuesta en 2-4 horas",
      action: "Enviar Email",
    },
    {
      icon: Phone,
      title: "Teléfono",
      description: "+34 900 123 456",
      availability: "Lun-Vie 9:00-18:00",
      action: "Llamar Ahora",
    },
  ];

  const faqCategories = [
    {
      icon: BookOpen,
      title: "Primeros Pasos",
      description: "Configuración inicial y conceptos básicos",
      questions: [
        "¿Cómo empiezo con Vesta?",
        "¿Cómo creo mi primera propiedad?",
        "¿Cómo invito a mi equipo?",
        "¿Qué plan necesito?",
      ],
    },
    {
      icon: FileText,
      title: "Gestión de Propiedades",
      description: "Todo sobre listados y publicación",
      questions: [
        "¿Cómo publico en portales?",
        "¿Puedo editar múltiples propiedades?",
        "¿Cómo funcionan los estados?",
        "¿Qué formatos de imagen acepta?",
      ],
    },
    {
      icon: Users,
      title: "CRM y Contactos",
      description: "Gestión de clientes y leads",
      questions: [
        "¿Cómo organizo mis contactos?",
        "¿Puedo importar desde Excel?",
        "¿Cómo funciona el seguimiento?",
        "¿Qué es el lead scoring?",
      ],
    },
    {
      icon: Video,
      title: "Integraciones",
      description: "Conectar con otras herramientas",
      questions: [
        "¿Qué portales están integrados?",
        "¿Cómo conecto mi calendario?",
        "¿Hay API disponible?",
        "¿Puedo usar webhooks?",
      ],
    },
  ];

  const statusItems = [
    {
      service: "Plataforma Principal",
      status: "operativo",
      uptime: "99.98%",
    },
    {
      service: "API",
      status: "operativo",
      uptime: "99.95%",
    },
    {
      service: "Integraciones Portales",
      status: "mantenimiento",
      uptime: "99.90%",
    },
    {
      service: "Soporte",
      status: "operativo",
      uptime: "100%",
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
              <HeadphonesIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Centro de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Soporte
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Estamos aquí para ayudarte. Encuentra respuestas rápidas en
              nuestras guías o contacta directamente con nuestro equipo de
              soporte.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar en ayuda..." className="pl-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              ¿Cómo Podemos Ayudarte?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Elige la forma que prefieras para contactar con nosotros
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.title}
                  className="text-center transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {method.availability}
                      </div>
                    </div>
                    <Button className="w-full">{method.action}</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Encuentra respuestas rápidas a las dudas más comunes
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.title}
                  className="transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-amber-100 p-2">
                        <Icon className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.questions.map((question) => (
                        <div key={question} className="group cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 transition-colors group-hover:text-amber-600">
                              {question}
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-400 transition-colors group-hover:text-amber-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        Ver Todas las Preguntas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Status Dashboard */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Estado del Sistema
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Monitorización en tiempo real de todos nuestros servicios
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Todos los Sistemas Operativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusItems.map((item) => (
                  <div
                    key={item.service}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === "operativo" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="font-medium">{item.service}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-2 py-1 text-sm ${
                          item.status === "operativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status === "operativo"
                          ? "Operativo"
                          : "Mantenimiento"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.uptime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Envíanos un Mensaje
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              ¿No encuentras lo que buscas? Contacta directamente con nuestro
              equipo
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <Input placeholder="Tu nombre" required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <Input type="email" placeholder="tu@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Asunto *
                  </label>
                  <Input placeholder="¿En qué podemos ayudarte?" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Mensaje *
                  </label>
                  <Textarea
                    placeholder="Describe tu consulta con el mayor detalle posible..."
                    rows={6}
                    required
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                >
                  Enviar Mensaje
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Recursos Adicionales
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Documentación",
                description: "Guías completas y tutoriales",
                link: "/recursos/documentacion",
                icon: BookOpen,
              },
              {
                title: "Blog",
                description: "Artículos y consejos prácticos",
                link: "/recursos/blog",
                icon: FileText,
              },
              {
                title: "API Reference",
                description: "Documentación técnica para desarrolladores",
                link: "/producto/api",
                icon: Video,
              },
            ].map((resource) => {
              const Icon = resource.icon;
              return (
                <Card
                  key={resource.title}
                  className="text-center transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <CardTitle>{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={resource.link}>
                        Explorar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
