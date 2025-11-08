import { type Metadata } from "next";
import {
  Home,
  Users,
  Globe,
  Brain,
  Calendar,
  FileText,
  UserCheck,
  Wrench,
  Shield,
  Code,
  Check,
  ArrowRight,
  Zap,
  Cloud,
  Sparkles,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Características - Vesta Real Estate Platform",
  description:
    "Descubre todas las características y funcionalidades de Vesta, la plataforma más completa para la gestión inmobiliaria en España.",
};

export default function CaracteristicasPage() {
  const features = [
    {
      icon: Home,
      title: "Gestión Completa de Propiedades",
      description:
        "Sistema integral para administrar todo tu portfolio inmobiliario",
      details: [
        "Sistema de creación paso a paso con más de 100 campos configurables",
        "Soporte completo para todos los tipos: casa, piso, ático, dúplex, chalet, local, terreno",
        "Gestión de certificados energéticos y referencias catastrales",
        "Galería de imágenes profesional con drag & drop",
        "Sistema de watermarking personalizable por agencia",
        "Estados y workflow: borrador, activo, reservado, vendido",
        "Integración directa con Catastro para datos oficiales",
        "Histórico completo de cambios y versiones",
      ],
      highlight: true,
    },
    {
      icon: Users,
      title: "CRM Inteligente de Contactos",
      description: "Gestiona tus clientes y leads de forma eficiente",
      details: [
        "Ciclo de vida completo: Prospecto → Lead → Cliente",
        "Historial detallado de cada interacción",
        "Matching automático con propiedades según preferencias",
        "Segmentación avanzada por múltiples criterios",
        "Lead scoring y probabilidad de conversión",
        "Gestión multi-empresa con aislamiento total de datos",
        "Importación masiva desde Excel/CSV",
        "Etiquetas y categorías personalizables",
      ],
    },
    {
      icon: Globe,
      title: "Publicación Multi-Portal Automatizada",
      description: "Publica en los principales portales con un click",
      details: [
        "Portales integrados: Fotocasa, Idealista, Habitaclia, Milanuncios",
        "Publicación simultánea con un solo click",
        "Sincronización bidireccional de estados",
        "Gestión centralizada de leads de todos los portales",
        "Optimización automática según requisitos de cada portal",
        "Programación de publicaciones",
        "Analytics de rendimiento por plataforma",
        "Control de presupuesto y límites de publicación",
      ],
      highlight: true,
    },
    {
      icon: Brain,
      title: "Inteligencia Artificial Avanzada",
      description: "Potencia tu productividad con IA de última generación",
      details: [
        "Generación de descripciones con GPT-4 optimizadas por tipo",
        "OCR inteligente para lectura de documentos (AWS Textract)",
        "Extracción automática de datos de formularios y fichas",
        "Mapeo inteligente de campos entre sistemas",
        "Traducción automática a múltiples idiomas",
        "Sugerencias de precio basadas en mercado",
        "Detección automática de duplicados",
        "Análisis de calidad de listings",
      ],
    },
    {
      icon: Calendar,
      title: "Calendario y Gestión de Visitas",
      description: "Organiza tu agenda y visitas eficientemente",
      details: [
        "Programación integrada con disponibilidad en tiempo real",
        "Sincronización con Google Calendar y Outlook",
        "Recordatorios automáticos por SMS y Email",
        "Calendario compartido para todo el equipo",
        "Gestión de estados: programada, realizada, cancelada",
        "Rutas optimizadas para múltiples visitas",
        "Disponibilidad online para clientes",
        "Informes de actividad y conversión",
      ],
    },
    {
      icon: FileText,
      title: "Gestión Documental Profesional",
      description: "Centraliza y automatiza toda tu documentación",
      details: [
        "OCR avanzado con AWS Textract",
        "Procesamiento automático de notas de encargo",
        "Gestión completa de certificados energéticos",
        "Biblioteca de contratos y documentos legales",
        "Plantillas personalizables",
        "Firma digital integrada",
        "Versionado y control de cambios",
        "Almacenamiento seguro en AWS S3",
      ],
    },
    {
      icon: UserCheck,
      title: "Sistema Multi-Usuario Avanzado",
      description: "Colaboración y gestión de equipos optimizada",
      details: [
        "3 niveles de roles: Agente, Supervisor, Administrador",
        "Permisos granulares por funcionalidad",
        "Soporte para múltiples oficinas",
        "Dashboard personalizado por rol",
        "Colaboración en tiempo real",
        "Notificaciones y menciones",
        "Log de actividad completo",
        "Gestión de comisiones y objetivos",
      ],
    },
    {
      icon: Wrench,
      title: "Herramientas de Productividad",
      description: "Todo lo que necesitas para ser más eficiente",
      details: [
        "Image Studio: edición y watermarking profesional",
        "Generador de cartelería y flyers",
        "Plantillas de email personalizables",
        "Workflows automatizados configurables",
        "Tareas y recordatorios",
        "Calculadoras hipotecarias",
        "Comparador de propiedades",
        "Exportación masiva de datos",
      ],
    },
    {
      icon: Shield,
      title: "Seguridad y Cumplimiento Normativo",
      description: "Máxima protección para tus datos y los de tus clientes",
      details: [
        "Cumplimiento total GDPR/LOPD",
        "Cifrado de datos en tránsito y reposo",
        "Arquitectura multi-tenant segura",
        "Backups automáticos diarios",
        "Logs de auditoría detallados",
        "Control de acceso por IP",
        "Autenticación de dos factores (2FA)",
        "Certificación de protección de datos",
      ],
    },
    {
      icon: Code,
      title: "API e Integraciones Técnicas",
      description: "Conecta Vesta con todas tus herramientas",
      details: [
        "API REST completa y documentada",
        "Webhooks para eventos en tiempo real",
        "SDK para integraciones custom",
        "Google Maps para geolocalización avanzada",
        "AWS S3 para almacenamiento ilimitado",
        "OpenAI GPT-4 para IA",
        "Integración con sistemas de contabilidad",
        "Conectores para herramientas de marketing",
      ],
    },
  ];

  const metrics = [
    { value: "10,000+", label: "Propiedades Gestionadas" },
    { value: "500+", label: "Agencias Activas" },
    { value: "99.9%", label: "Uptime Garantizado" },
    { value: "24/7", label: "Soporte Técnico" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Todas las Características de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              La plataforma más completa para la gestión inmobiliaria en España.
              Descubre todo lo que puedes hacer con Vesta.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
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
                <Link href="/#contact">Solicitar Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`overflow-hidden transition-all hover:shadow-lg ${
                    feature.highlight
                      ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-rose-50/50"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-lg p-2 ${
                          feature.highlight
                            ? "bg-gradient-to-r from-amber-400 to-rose-400"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            feature.highlight ? "text-white" : "text-gray-700"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {detail}
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

      {/* Additional Features Section */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Además, disfruta de estas ventajas
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Vesta incluye todo lo necesario para impulsar tu negocio
              inmobiliario
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Configuración Rápida
              </h3>
              <p className="mt-2 text-gray-600">
                Empieza a usar Vesta en minutos, sin complicaciones técnicas
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">100% en la Nube</h3>
              <p className="mt-2 text-gray-600">
                Accede desde cualquier lugar, sin instalaciones ni mantenimiento
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Actualizaciones Constantes
              </h3>
              <p className="mt-2 text-gray-600">
                Nuevas funcionalidades y mejoras cada mes sin coste adicional
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Números que hablan por sí solos
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              La confianza de cientos de profesionales inmobiliarios nos avala
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {metric.value}
                </div>
                <div className="mt-2 text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para transformar tu negocio inmobiliario?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Únete a los cientos de profesionales que ya confían en Vesta para
            gestionar sus propiedades y hacer crecer su negocio.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 px-8 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Empieza tu Prueba Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#contact">Hablar con Ventas</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Sin tarjeta de crédito • Configuración en minutos • Soporte incluido
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
