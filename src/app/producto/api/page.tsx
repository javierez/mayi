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
  Code,
  Terminal,
  FileJson,
  Webhook,
  Zap,
  Book,
  GitBranch,
  Package,
  ArrowRight,
  Check,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "API y Desarrolladores - Vesta Real Estate Platform",
  description:
    "API REST completa para integrar Vesta con tus sistemas. Documentación, SDKs, y herramientas para desarrolladores.",
};

export default function ApiPage() {
  const apiFeatures = [
    {
      icon: Terminal,
      title: "API REST Completa",
      description:
        "Accede a todas las funcionalidades de Vesta mediante nuestra API REST",
      highlights: [
        "Autenticación OAuth 2.0",
        "Rate limiting inteligente",
        "Versionado de API",
        "Respuestas en JSON",
      ],
    },
    {
      icon: Webhook,
      title: "Webhooks en Tiempo Real",
      description:
        "Recibe notificaciones instantáneas cuando ocurren eventos importantes",
      highlights: [
        "Eventos configurables",
        "Reintentos automáticos",
        "Firma de seguridad",
        "Logs detallados",
      ],
    },
    {
      icon: Package,
      title: "SDKs Oficiales",
      description: "Librerías oficiales para los lenguajes más populares",
      highlights: ["JavaScript/TypeScript", "Python", "PHP", "Java"],
    },
    {
      icon: GitBranch,
      title: "Entorno de Pruebas",
      description:
        "Sandbox completo para desarrollar y probar sin afectar datos reales",
      highlights: [
        "Datos de prueba",
        "Sin límites de uso",
        "Reset bajo demanda",
        "Mismo comportamiento que producción",
      ],
    },
  ];

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/properties",
      description: "Listar todas las propiedades",
    },
    {
      method: "POST",
      path: "/api/v1/properties",
      description: "Crear nueva propiedad",
    },
    {
      method: "GET",
      path: "/api/v1/contacts",
      description: "Obtener lista de contactos",
    },
    {
      method: "POST",
      path: "/api/v1/contacts",
      description: "Crear nuevo contacto",
    },
    {
      method: "GET",
      path: "/api/v1/appointments",
      description: "Listar citas programadas",
    },
    {
      method: "POST",
      path: "/api/v1/webhooks",
      description: "Configurar webhook",
    },
  ];

  const codeExample = `// Ejemplo: Crear una nueva propiedad
const response = await fetch('https://api.vesta.es/v1/properties', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Piso en Barcelona',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    surface: 120
  })
});

const property = await response.json();
console.log('Propiedad creada:', property.id);`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              API para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Desarrolladores
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Integra Vesta con tus sistemas usando nuestra API REST completa.
              Documentación detallada, SDKs oficiales y soporte técnico
              dedicado.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="/recursos/documentacion">
                  Ver Documentación
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Obtener API Key</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2">
            {apiFeatures.map((feature) => {
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
                      {feature.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {highlight}
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

      {/* Code Example */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Empieza en Minutos
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Integración simple y directa con cualquier lenguaje de
              programación
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden bg-gray-900">
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-green-400" />
                  <span className="font-mono text-sm text-gray-400">
                    example.js
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <pre className="overflow-x-auto p-6">
                  <code className="whitespace-pre text-sm text-gray-300">
                    {codeExample}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Endpoints Principales
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Accede a todas las funcionalidades de Vesta mediante nuestra API
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {endpoints.map((endpoint, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            endpoint.method === "GET"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">
                        {endpoint.path}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {endpoint.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Resources */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Recursos para Desarrolladores
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Todo lo que necesitas para integrar Vesta con éxito
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <Book className="h-8 w-8 text-amber-600" />
                <CardTitle className="mt-4">Guía de Inicio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tutorial paso a paso para tu primera integración con la API de
                  Vesta.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <FileJson className="h-8 w-8 text-amber-600" />
                <CardTitle className="mt-4">Referencia API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Documentación completa de todos los endpoints, parámetros y
                  respuestas.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader>
                <Zap className="h-8 w-8 text-amber-600" />
                <CardTitle className="mt-4">Postman Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Colección lista para importar en Postman con todos los
                  endpoints.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Listo para empezar a construir?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Obtén tu API key gratuita y empieza a integrar Vesta en tus
            aplicaciones hoy mismo.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/dashboard">
                Obtener API Key Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/recursos/soporte">Contactar Soporte Técnico</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
