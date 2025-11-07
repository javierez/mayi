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
  Shield,
  Lock,
  FileCheck,
  Server,
  UserCheck,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Check,
  ArrowRight,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Seguridad - Vesta Real Estate Platform",
  description:
    "Máxima protección para tus datos. Cumplimiento GDPR, cifrado de extremo a extremo, y certificaciones de seguridad.",
};

export default function SeguridadPage() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Cifrado de Extremo a Extremo",
      description:
        "Todos los datos se cifran tanto en tránsito como en reposo usando AES-256",
      features: [
        "Certificados SSL/TLS",
        "Cifrado de base de datos",
        "Almacenamiento seguro de archivos",
        "Tokens de sesión encriptados",
      ],
    },
    {
      icon: UserCheck,
      title: "Autenticación Avanzada",
      description:
        "Múltiples capas de seguridad para proteger el acceso a las cuentas",
      features: [
        "Autenticación de dos factores (2FA)",
        "Single Sign-On (SSO)",
        "Control de acceso por IP",
        "Detección de intentos de acceso sospechosos",
      ],
    },
    {
      icon: FileCheck,
      title: "Cumplimiento GDPR/LOPD",
      description:
        "Cumplimos con todas las normativas europeas de protección de datos",
      features: [
        "Derecho al olvido",
        "Portabilidad de datos",
        "Consentimiento explícito",
        "Registro de actividades de tratamiento",
      ],
    },
    {
      icon: Server,
      title: "Infraestructura Segura",
      description: "Servidores en la UE con las máximas garantías de seguridad",
      features: [
        "Centros de datos certificados ISO 27001",
        "Redundancia geográfica",
        "Backups automáticos diarios",
        "Monitorización 24/7",
      ],
    },
    {
      icon: Eye,
      title: "Auditoría y Logs",
      description:
        "Registro completo de todas las actividades para máxima transparencia",
      features: [
        "Logs de acceso detallados",
        "Historial de cambios",
        "Alertas de seguridad",
        "Informes de cumplimiento",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Gestión de Permisos",
      description: "Control granular sobre quién puede ver y hacer qué",
      features: [
        "Roles personalizables",
        "Permisos por funcionalidad",
        "Segregación de datos por cuenta",
        "Control de acceso a documentos",
      ],
    },
  ];

  const certifications = [
    "ISO 27001",
    "GDPR Compliant",
    "SOC 2 Type II",
    "PCI DSS",
  ];

  const securityMetrics = [
    { value: "99.99%", label: "Uptime Garantizado" },
    { value: "256-bit", label: "Cifrado AES" },
    { value: "24/7", label: "Monitorización" },
    { value: "0", label: "Brechas de Seguridad" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar shortName="Vesta" />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Seguridad de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Nivel Empresarial
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Protegemos tus datos y los de tus clientes con los más altos
              estándares de seguridad. Cumplimiento total con GDPR y
              certificaciones internacionales.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="overflow-hidden transition-all hover:shadow-lg"
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
                    <CardDescription className="mt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm text-gray-600">{item}</span>
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

      {/* Certifications */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Certificaciones y Cumplimiento
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Cumplimos con los estándares internacionales más exigentes
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {certifications.map((cert) => (
              <div
                key={cert}
                className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 shadow-sm"
              >
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Metrics */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {securityMetrics.map((metric) => (
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

      {/* Data Protection Notice */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <CardTitle>Compromiso con la Privacidad</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                En Vesta, la seguridad y privacidad de tus datos es nuestra
                máxima prioridad. Nunca compartimos información con terceros sin
                tu consentimiento explícito. Todos nuestros empleados están
                sujetos a estrictos acuerdos de confidencialidad y reciben
                formación continua en protección de datos.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Button asChild>
                  <Link href="/empresa/contacto">Contactar con DPO</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/recursos/documentacion">
                    Ver Política de Privacidad
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Tienes preguntas sobre seguridad?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Nuestro equipo de seguridad está disponible para responder todas tus
            dudas y proporcionarte información detallada sobre nuestras medidas
            de protección.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/empresa/contacto">
                Hablar con Seguridad
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
