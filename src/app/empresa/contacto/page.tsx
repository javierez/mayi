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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Users,
  Building,
  HeadphonesIcon,
  Send,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Contacto - Vesta",
  description:
    "Ponte en contacto con el equipo de Vesta. Ventas, soporte técnico, partnerships y consultas generales.",
};

export default function ContactoPage() {
  const contactMethods = [
    {
      icon: Phone,
      title: "Ventas",
      description: "Habla con nuestro equipo comercial",
      contact: "+34 900 123 456",
      availability: "Lun-Vie 9:00-19:00",
      cta: "Llamar Ventas",
    },
    {
      icon: HeadphonesIcon,
      title: "Soporte Técnico",
      description: "Ayuda con tu cuenta de Vesta",
      contact: "soporte@vesta.es",
      availability: "24/7 Online",
      cta: "Contactar Soporte",
    },
    {
      icon: Users,
      title: "Partnerships",
      description: "Programa de socios y alianzas",
      contact: "partners@vesta.es",
      availability: "Lun-Vie 9:00-18:00",
      cta: "Hablar de Partnership",
    },
    {
      icon: Building,
      title: "Prensa",
      description: "Consultas de medios y comunicación",
      contact: "prensa@vesta.es",
      availability: "Lun-Vie 10:00-17:00",
      cta: "Contactar Prensa",
    },
  ];

  const offices = [
    {
      city: "Madrid",
      address: "Calle Serrano 45, 2ª planta",
      postal: "28001 Madrid, España",
      phone: "+34 91 123 45 67",
      type: "Oficina Principal",
    },
    {
      city: "Barcelona",
      address: "Passeig de Gràcia 78, 3º",
      postal: "08008 Barcelona, España",
      phone: "+34 93 123 45 67",
      type: "Oficina Regional",
    },
    {
      city: "Valencia",
      address: "Calle Colón 32, 1º",
      postal: "46004 Valencia, España",
      phone: "+34 96 123 45 67",
      type: "Oficina Regional",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Contacta con{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Estamos aquí para ayudarte. Ya sea que tengas preguntas sobre
              nuestros productos, necesites soporte o quieras explorar
              oportunidades de partnership.
            </p>
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
              Elige el canal más adecuado para tu consulta
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="font-medium text-gray-900">
                        {method.contact}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {method.availability}
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      {method.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Offices */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="mb-8 text-3xl font-bold text-gray-900">
                Envíanos un Mensaje
              </h2>

              <Card>
                <CardContent className="p-8">
                  <form className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Nombre *
                        </label>
                        <Input placeholder="Tu nombre completo" required />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <Input
                          type="email"
                          placeholder="tu@empresa.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Empresa
                        </label>
                        <Input placeholder="Nombre de tu empresa" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Teléfono
                        </label>
                        <Input placeholder="+34 xxx xxx xxx" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Tipo de Consulta *
                      </label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de consulta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">
                            Información Comercial
                          </SelectItem>
                          <SelectItem value="demo">Solicitar Demo</SelectItem>
                          <SelectItem value="support">
                            Soporte Técnico
                          </SelectItem>
                          <SelectItem value="partnership">
                            Partnership
                          </SelectItem>
                          <SelectItem value="press">Prensa</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Mensaje *
                      </label>
                      <Textarea
                        placeholder="Cuéntanos cómo podemos ayudarte..."
                        rows={6}
                        required
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacy"
                        className="mt-1"
                        required
                      />
                      <label
                        htmlFor="privacy"
                        className="text-sm text-gray-600"
                      >
                        Acepto la{" "}
                        <Link
                          href="/legal/privacidad"
                          className="text-amber-600 hover:underline"
                        >
                          Política de Privacidad
                        </Link>{" "}
                        y autorizo el tratamiento de mis datos para responder a
                        mi consulta.
                      </label>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500"
                    >
                      Enviar Mensaje
                      <Send className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Offices */}
            <div>
              <h2 className="mb-8 text-3xl font-bold text-gray-900">
                Nuestras Oficinas
              </h2>

              <div className="space-y-6">
                {offices.map((office) => (
                  <Card
                    key={office.city}
                    className="transition-all hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {office.city}
                          </CardTitle>
                          <div className="mt-1">
                            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                              {office.type}
                            </span>
                          </div>
                        </div>
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-gray-600">
                        <div>{office.address}</div>
                        <div>{office.postal}</div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {office.phone}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Contact Card */}
              <Card className="mt-8 border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle>¿Necesitas Ayuda Inmediata?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-gray-600">
                    Si eres cliente existente y necesitas soporte urgente,
                    accede directamente a nuestro sistema de tickets.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="/recursos/soporte">Centro de Soporte</Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href="/dashboard">Acceder a Vesta</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Respuestas rápidas a consultas comunes
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question:
                  "¿Cuánto tiempo tarda en responder el equipo comercial?",
                answer:
                  "Nuestro equipo comercial responde en menos de 2 horas en horario laboral.",
              },
              {
                question: "¿Ofrecen demos personalizadas?",
                answer:
                  "Sí, ofrecemos demos personalizadas de 30-45 minutos adaptadas a tu sector y necesidades específicas.",
              },
              {
                question: "¿Tienen soporte en español?",
                answer:
                  "Por supuesto, todo nuestro soporte está en español y nuestro equipo entiende las particularidades del mercado inmobiliario español.",
              },
              {
                question: "¿Cómo puedo convertirme en partner?",
                answer:
                  "Puedes aplicar a nuestro programa de partners a través del formulario de contacto o visitando nuestra página de socios.",
              },
            ].map((faq) => (
              <Card key={faq.question}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para Transformar tu Negocio?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Habla con nuestro equipo y descubre cómo Vesta puede ayudarte a
            hacer crecer tu inmobiliaria.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Prueba Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/precios">Ver Precios</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Respuesta garantizada en 2 horas • Demo personalizada • Sin
            compromiso
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
