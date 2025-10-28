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
  Check,
  X,
  Star,
  Users,
  Building,
  Crown,
  DollarSign,
  Phone,
} from "lucide-react";
import Navbar from "~/components/navbar";

export const metadata: Metadata = {
  title: "Planes y Precios - Vesta",
  description:
    "Encuentra el plan perfecto para tu negocio inmobiliario. Precios transparentes, sin sorpresas.",
};

export default function PreciosPage() {
  const plans = [
    {
      name: "Starter",
      icon: Users,
      price: "49",
      period: "mes",
      description:
        "Perfecto para agentes individuales y pequeñas inmobiliarias",
      popular: false,
      features: [
        "Hasta 100 propiedades",
        "1 usuario incluido",
        "CRM básico",
        "Publicación en 2 portales",
        "Soporte por email",
        "Almacenamiento 5GB",
        "Dashboard básico",
        "Templates de email",
      ],
      notIncluded: [
        "IA para descripciones",
        "Múltiples oficinas",
        "API access",
        "Soporte telefónico",
      ],
    },
    {
      name: "Professional",
      icon: Building,
      price: "149",
      period: "mes",
      description:
        "Ideal para inmobiliarias en crecimiento con múltiples agentes",
      popular: true,
      features: [
        "Propiedades ilimitadas",
        "5 usuarios incluidos",
        "CRM completo",
        "Publicación en todos los portales",
        "IA para descripciones",
        "Soporte telefónico",
        "Almacenamiento 50GB",
        "Analytics avanzado",
        "Templates personalizables",
        "Calendario integrado",
        "Gestión de documentos",
        "Múltiples oficinas",
      ],
      notIncluded: ["API dedicada", "SSO empresarial"],
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "Personalizado",
      period: "",
      description:
        "Solución completa para grandes organizaciones inmobiliarias",
      popular: false,
      features: [
        "Todo de Professional",
        "Usuarios ilimitados",
        "API dedicada",
        "SSO empresarial",
        "Soporte 24/7",
        "SLA garantizado 99.99%",
        "Almacenamiento ilimitado",
        "Múltiples regiones",
        "Cumplimiento enterprise",
        "Manager dedicado",
        "Integración personalizada",
        "Formación en sitio",
      ],
      notIncluded: [],
    },
  ];

  const faqs = [
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer:
        "Sí, puedes cambiar de plan cuando quieras. Los cambios se aplican inmediatamente y solo pagas la diferencia prorrateada.",
    },
    {
      question: "¿Hay algún compromiso de permanencia?",
      answer:
        "No, todos nuestros planes son sin compromiso. Puedes cancelar en cualquier momento sin penalizaciones.",
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer:
        "Aceptamos tarjetas de crédito/débito, transferencias bancarias y PayPal. Los pagos se procesan de forma segura.",
    },
    {
      question: "¿Ofrecen descuentos por pago anual?",
      answer:
        "Sí, ofrecemos un 20% de descuento al pagar anualmente. Contacta con ventas para más detalles.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Planes y{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Precios
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Encuentra el plan perfecto para tu negocio inmobiliario. Precios
              transparentes, sin sorpresas, sin letra pequeña.
            </p>
            <div className="mt-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  30 días de prueba gratuita en todos los planes
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.name}
                  className={`relative overflow-hidden ${
                    plan.popular
                      ? "scale-105 border-amber-400 shadow-lg ring-2 ring-amber-400"
                      : "hover:shadow-lg"
                  } transition-all`}
                >
                  {plan.popular && (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform">
                      <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-1 text-sm font-medium text-white">
                        Más Popular
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-8 text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-amber-400 to-rose-400"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          plan.popular ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      {plan.price === "Personalizado" ? (
                        <div className="text-3xl font-bold">Contactar</div>
                      ) : (
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold">
                            €{plan.price}
                          </span>
                          <span className="ml-1 text-gray-600">
                            /{plan.period}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardDescription className="mt-4">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {plan.notIncluded.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-3 opacity-50"
                        >
                          <X className="h-4 w-4 flex-shrink-0 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link
                        href={
                          plan.name === "Enterprise"
                            ? "/empresa/contacto"
                            : "/dashboard"
                        }
                      >
                        {plan.name === "Enterprise"
                          ? "Contactar Ventas"
                          : "Empezar Prueba Gratuita"}
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

      {/* Features Comparison */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              ¿Por qué elegir Vesta?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Comparamos con transparencia total
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: DollarSign,
                title: "Sin Costos Ocultos",
                description:
                  "El precio que ves es el que pagas. Sin sorpresas en la factura.",
              },
              {
                icon: Star,
                title: "Soporte Incluido",
                description:
                  "Todos los planes incluyen soporte técnico sin costo adicional.",
              },
              {
                icon: Phone,
                title: "Sin Permanencia",
                description:
                  "Cancela cuando quieras sin penalizaciones ni compromisos.",
              },
              {
                icon: Check,
                title: "Actualizaciones Gratis",
                description:
                  "Todas las nuevas funciones se incluyen sin costo extra.",
              },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
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
            ¿Listo para Transformar tu Inmobiliaria?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Empieza tu prueba gratuita hoy y descubre por qué más de 1000
            inmobiliarias confían en Vesta
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Probar Gratis 30 Días
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/empresa/contacto">Hablar con Ventas</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Sin tarjeta de crédito • Cancela cuando quieras • Soporte incluido
          </p>
        </div>
      </section>
    </div>
  );
}
