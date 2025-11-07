"use client";

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
  Check,
  Globe,
  Search,
  Megaphone,
  Users,
  Crown,
  Image as ImageIcon,
  Home,
  Key,
  Palette,
  Brain,
  MessageSquare,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";
import { useState } from "react";
import { cn } from "~/lib/utils";

interface ServiceModule {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  features: (
    | string
    | { parts: { text: string; bold?: boolean }[]; inDevelopment?: boolean }
  )[];
  monthlyPrice: number;
  annualPrice: number;
  comingSoon?: boolean;
  inDevelopment?: boolean;
}

export default function PreciosPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>(
    {},
  );

  const toggleCard = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const services: ServiceModule[] = [
    {
      id: "crm-core",
      name: "Gestión Contactos y Propiedades",
      icon: Users,
      description:
        "Sistema completo de gestión de propiedades y contactos, con todas las funcionalidades básicas incluídas.",
      features: [
        {
          parts: [
            { text: "Soporte técnico " },
            { text: "24/7", bold: true },
          ],
        },
        {
          parts: [
            { text: "Migración " },
            { text: "completa", bold: true },
            { text: " de datos" },
          ],
        },
        {
          parts: [
            { text: "Propiedades y contactos " },
            { text: "ilimitados", bold: true },
          ],
        },
        {
          parts: [
            { text: "Hasta " },
            { text: "7 usuarios", bold: true },
          ],
        },
        {
          parts: [
            { text: "30gb", bold: true },
            { text: " de almacenamiento" },
          ],
        },
        {
          parts: [
            { text: "Aplicación " },
            { text: "web y móvil", bold: true },
          ],
        },
        "Todas las herramientas básicas",
      ],
      monthlyPrice: 49.9,
      annualPrice: 479,
    },
    {
      id: "website",
      name: "Página Web",
      icon: Globe,
      description:
        "Sitio web profesional personalizado para tu inmobiliaria conectado con tu CRM. Diseño moderno y atractivo que refleja la calidad de tu marca.",
      features: [
        {
          parts: [
            { text: "Diseño " },
            { text: "responsive", bold: true },
            { text: " personalizado" },
          ],
        },
        "Gestión del dominio incluido",
        "Catálogo de propiedades integrado",
        "Formularios de contacto",
        "SSL y hosting incluido",
      ],
      monthlyPrice: 0,
      annualPrice: 0,
    },
    {
      id: "cartel-editor",
      name: "Editor de Carteles",
      icon: Palette,
      description:
        "Crea carteles profesionales para tus propiedades en minutos",
      features: [
        "Plantillas personalizables",
        "Exportación en alta calidad",
        "Marca corporativa integrada",
        "Múltiples formatos",
        "Editor drag & drop",
      ],
      monthlyPrice: 0,
      annualPrice: 0,
    },
    {
      id: "second-brain",
      name: "Asistente IA",
      icon: Brain,
      description:
        "Organiza tareas, gestiona calendarios y comunica con clientes de forma automática y eficiente. Todo impulsado por IA.",
      features: [
        "Organización automática de tareas",
        "Asignación automática de eventos",
        "Recordatorios internos y a clientes",
        "Agentes de comunicación inteligentes",
        "Gestión de conocimiento personal",
        {
          parts: [
            { text: "Generación y firma de contratos", bold: false },
            { text: " (en desarrollo)", bold: false },
          ],
          inDevelopment: true,
        },
      ],
      monthlyPrice: 0,
      annualPrice: 0,
    },
    {
      id: "image-studio",
      name: "Home Staging",
      icon: ImageIcon,
      description:
        "Herramientas profesionales para edición y gestión de imágenes mediante IA",
      features: [
        {
          parts: [
            { text: "50k tokens " },
            { text: "incluidos", bold: true },
          ],
        },
        "Mejora de la calidad de las imágenes",
        "Pixelación de rostros",
        "Reforma de viviendas",
      ],
      monthlyPrice: 11.90,
      annualPrice: 100,
    },
    {
      id: "seo-sem",
      name: "Servicio SEO-SEM",
      icon: Megaphone,
      description:
        "Optimización en buscadores y campañas de publicidad digital",
      features: [
        "Optimización SEO on-page",
        "Gestión de campañas Google Ads",
        "Análisis de palabras clave",
        "Informes mensuales detallados",
        "Estrategia de contenidos",
      ],
      monthlyPrice: 14.9,
      annualPrice: 283.7,
    },
    {
      id: "club-membership",
      name: "Membresía Vesta",
      icon: Crown,
      description:
        "Acceso exclusivo a beneficios premium y red de profesionales",
      features: [
        "Acceso a cartera de clientes Vesta",
        "Anonimificación de los cruces",
        "Gestión de acuerdos y tasas",
      ],
      monthlyPrice: 5.9,
      annualPrice: 59,
    },
    {
      id: "search-tool",
      name: "Herramienta Búsqueda",
      icon: Search,
      description:
        "Encuentra ofertas de otras inmobiliarias, particulares para gestionar ventas, y clientes potenciales. Comunicación con leads impulsada por IA.",
      features: [
        "Ofertas de otras inmobiliarias",
        "Búsqueda de particulares",
        "Clientes potenciales",
        {
          parts: [
            { text: "Comunicación " },
            { text: "impulsada por IA", bold: true },
          ],
        },
        "Matching inteligente",
      ],
      monthlyPrice: 19.9,
      annualPrice: 199,
      inDevelopment: true,
    },
    {
      id: "rental-management",
      name: "Gestión de Alquileres",
      icon: Key,
      description: "Administra contratos, pagos y mantenimiento de alquileres",
      features: [
        "Gestión de contratos",
        "Control de pagos y fianzas",
        "Calendario de vencimientos",
        "Gestión de incidencias",
        "Documentación automática",
      ],
      monthlyPrice: 29.9,
      annualPrice: 299,
      inDevelopment: true,
    },
    {
      id: "community-management",
      name: "Gestión de Comunidades",
      icon: Home,
      description:
        "Administración completa de comunidades de propietarios",
      features: [
        "Gestión de juntas y actas",
        "Control de gastos comunes",
        "Comunicación con propietarios",
        "Calendario de reuniones",
        "Informes financieros",
      ],
      monthlyPrice: 49.9,
      annualPrice: 479,
      inDevelopment: true,
    },
    {
      id: "whatsapp-integration",
      name: "Integración con WhatsApp para Asistente IA",
      icon: MessageSquare,
      description:
        "Conecta tu Asistente IA con WhatsApp para comunicación automatizada con clientes y no olvidarte de nada",
      features: [
        "Mensajes automáticos por WhatsApp",
        "Respuestas inteligentes",
        "Seguimiento de conversaciones",      ],
      monthlyPrice: 12.9,
      annualPrice: 129,
      inDevelopment: true,
    },
  ];

  const calculateSavings = (monthly: number, annual: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - annual;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  // Calculate total price of selected modules
  const selectedModules = services.filter(
    (service) => flippedCards[service.id],
  );
  const totalPrice = selectedModules.reduce((sum, service) => {
    const price =
      billingCycle === "monthly" ? service.monthlyPrice : service.annualPrice;
    return sum + price;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />

      {/* Hero Section */}
      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Planes y Precios
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:mt-6 sm:text-lg md:text-xl">
              Elige solo los módulos que necesitas. Sin paquetes
              predeterminados, sin pagar por funciones que no usas.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "text-gray-900"
                    : "text-gray-500",
                )}
              >
                Mensual
              </span>
              <button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "annual" : "monthly",
                  )
                }
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                role="switch"
                aria-checked={billingCycle === "annual"}
              >
                <span
                  className={cn(
                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                    billingCycle === "annual"
                      ? "translate-x-9"
                      : "translate-x-1",
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  billingCycle === "annual" ? "text-gray-900" : "text-gray-500",
                )}
              >
                Anual
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Ahorra hasta 20%
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              const price =
                billingCycle === "monthly"
                  ? service.monthlyPrice
                  : service.annualPrice;
              const { savings } = calculateSavings(
                service.monthlyPrice,
                service.annualPrice,
              );

              return (
                <div
                  key={service.id}
                  className="relative min-h-[380px] transition-all duration-300 sm:h-[500px]"
                  style={{ perspective: "1000px" }}
                >
                    <div
                      className={cn(
                        "relative h-full w-full transition-transform duration-500",
                        service.comingSoon ?? service.inDevelopment
                          ? "cursor-not-allowed"
                          : "cursor-pointer",
                        flippedCards[service.id] && "[transform:rotateY(180deg)]",
                      )}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                    {/* Front of card */}
                    <Card
                      className={cn(
                        "group relative flex h-full flex-col overflow-hidden transition-all duration-200",
                        service.inDevelopment
                          ? "bg-gray-100"
                          : "bg-gradient-to-br from-amber-50 to-rose-50 hover:shadow-md",
                      )}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      {service.comingSoon && (
                        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
                          <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 sm:px-3 sm:py-1">
                            Próximamente
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3 pt-4 sm:pb-4 sm:pt-6">
                        {/* Title */}
                        <CardTitle className="text-left text-base font-bold leading-tight text-gray-900 sm:text-lg md:text-xl">
                          {service.name}
                        </CardTitle>

                        {/* Description */}
                        <CardDescription className="mt-2 text-left text-xs leading-relaxed text-gray-500 sm:mt-3 sm:text-sm">
                          {service.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col px-4 pt-0 sm:px-6">
                        {/* Features List */}
                        <div className="mb-auto flex-1 space-y-1.5 sm:space-y-2">
                          {service.features.map((feature) => {
                            const featureKey =
                              typeof feature === "string"
                                ? feature
                                : feature.parts.map((p) => p.text).join("");
                            const isInDevelopment =
                              typeof feature === "object" &&
                              feature.inDevelopment;
                            return (
                              <div
                                key={featureKey}
                                className="flex items-start gap-1.5 sm:gap-2.5"
                              >
                                <Check
                                  className={cn(
                                    "mt-0.5 h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4",
                                    isInDevelopment
                                      ? "text-gray-400"
                                      : "text-amber-500",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "text-[11px] leading-relaxed sm:text-xs",
                                    isInDevelopment
                                      ? "italic text-gray-400"
                                      : "text-gray-600",
                                  )}
                                >
                                  {typeof feature === "string" ? (
                                    feature
                                  ) : (
                                    <>
                                      {feature.parts.map((part, idx) => (
                                        <span
                                          key={idx}
                                          className={cn(
                                            part.bold &&
                                              !isInDevelopment &&
                                              "font-semibold text-gray-900",
                                          )}
                                        >
                                          {part.text}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {service.inDevelopment && (
                          <div className="mt-3 text-center sm:mt-4">
                            <div className="inline-flex rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 sm:px-3 sm:py-1">
                              En desarrollo
                            </div>
                          </div>
                        )}

                        {/* Price and Button at Bottom */}
                        <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                          <div className="border-t border-gray-100 pt-3 text-center sm:pt-4">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                €{price.toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-xs text-gray-500 sm:text-sm">
                                /{billingCycle === "monthly" ? "mes" : "año"}
                              </span>
                              {service.id === "seo-sem" && (
                                <span className="text-lg font-bold text-gray-900">
                                  *
                                </span>
                              )}
                            </div>
                            {service.id === "seo-sem" && (
                              <p className="mt-1 text-xs font-semibold text-gray-700">
                                * 104,90€ setup inicial
                              </p>
                            )}
                            {billingCycle === "annual" && savings > 0 && (
                              <p className="mt-1 text-xs text-green-600">
                                Ahorras €{savings}
                              </p>
                            )}
                          </div>

                          <div className="relative">
                            <Button
                              className="w-full border border-gray-300 bg-white font-medium text-gray-700 transition-colors duration-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                              variant="outline"
                              disabled={Boolean(service.comingSoon) || Boolean(service.inDevelopment)}
                              onClick={(e) => {
                                if (!service.comingSoon && !service.inDevelopment) {
                                  e.preventDefault();
                                  toggleCard(service.id);
                                }
                              }}
                            >
                              {service.comingSoon ? (
                                <span>Próximamente</span>
                              ) : service.inDevelopment ? (
                                <span>En desarrollo</span>
                              ) : (
                                <span>Añadir Módulo</span>
                              )}
                            </Button>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                              <Icon className="h-4 w-4 text-amber-600" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Back of card */}
                    <Card
                      className="absolute inset-0 flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-rose-50 transition-all duration-200"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Check className="mb-6 h-16 w-16 text-green-600" />
                        <p className="mb-2 text-lg font-medium text-gray-900">
                          Añadido
                        </p>
                        <p className="mb-6 text-sm text-gray-600">
                          {service.name}
                        </p>
                        <Button
                          className="border border-gray-300 bg-white font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCard(service.id);
                          }}
                        >
                          Volver
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              ¿Por qué elegir Vesta?
            </h2>
            <p className="mt-3 text-base text-gray-600 sm:mt-4 sm:text-lg">
              Flexibilidad total, sin sorpresas
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {[
              {
                title: "Sin Permanencia",
                description:
                  "Activa o desactiva módulos cuando quieras. Sin compromisos.",
              },
              {
                title: "Actualizaciones Semanales",
                description:
                  "Todas las mejoras y nuevas funciones sin costo adicional.",
              },
              {
                title: "Soporte 24/7",
                description:
                  "Equipo de soporte técnico disponible para ayudarte. Zero bug policy garantizada.",
              },
              {
                title: "Escalable",
                description:
                  "Añade módulos conforme crece tu negocio inmobiliario.",
              },
            ].map((benefit) => {
              return (
                <Card
                  key={benefit.title}
                  className="border-0 shadow-md bg-stone-50 text-center"
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={cn(
          "bg-gradient-to-r from-amber-400/90 to-rose-400/90 px-4 py-16 sm:px-6 sm:py-24 lg:px-8",
          selectedModules.length > 0 && "pb-32",
        )}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            ¿Listo para Personalizar tu Experiencia?
          </h2>
          <p className="mt-4 text-base text-white/90 sm:text-lg">
            Empieza con los módulos esenciales y añade más cuando lo necesites
          </p>
          <p className="mt-6 text-sm text-white/80">
            Prueba gratuita de 30 días • Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Sticky Footer with Total Price */}
      {selectedModules.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex flex-col">
                <p className="text-xs text-gray-600 sm:text-sm">
                  {selectedModules.length}{" "}
                  {selectedModules.length === 1 ? "módulo" : "módulos"}{" "}
                  seleccionado{selectedModules.length > 1 && "s"}
                </p>
                <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                  <span className="text-xl font-bold text-gray-900 sm:text-2xl">
                    €{totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-gray-600 sm:text-sm">
                    /{billingCycle === "monthly" ? "mes" : "año"}
                  </span>
                  <span className="text-xs text-gray-500">
                    • 1 mes gratis
                  </span>
                </div>
              </div>
              <Button
                size="default"
                className="w-full bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500 sm:w-auto sm:flex-shrink-0"
                asChild
              >
                <Link
                  href="https://cal.com/vesta-crm/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Empieza Ahora
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
