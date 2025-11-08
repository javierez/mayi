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
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Search,
  Book,
  Code,
  Video,
  Download,
  ExternalLink,
  Clock,
  Star,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Documentación - Vesta",
  description:
    "Guías completas, tutoriales y recursos técnicos para sacar el máximo provecho de Vesta.",
};

export default function DocumentacionPage() {
  const categories = [
    {
      icon: Book,
      title: "Guías de Inicio",
      description: "Primeros pasos con Vesta",
      articles: [
        { title: "Configuración inicial", time: "5 min", popular: true },
        { title: "Tu primera propiedad", time: "10 min", popular: true },
        { title: "Configurar portales", time: "15 min", popular: false },
        { title: "Invitar a tu equipo", time: "8 min", popular: false },
      ],
    },
    {
      icon: FileText,
      title: "Gestión de Propiedades",
      description: "Todo sobre la gestión inmobiliaria",
      articles: [
        { title: "Crear listados perfectos", time: "12 min", popular: true },
        { title: "Galerías de imágenes", time: "8 min", popular: false },
        { title: "Estados y workflows", time: "10 min", popular: false },
        { title: "Publicación multi-portal", time: "15 min", popular: true },
      ],
    },
    {
      icon: Code,
      title: "API y Desarrolladores",
      description: "Integración técnica",
      articles: [
        { title: "Primeros pasos con la API", time: "20 min", popular: true },
        { title: "Autenticación OAuth", time: "15 min", popular: false },
        { title: "Webhooks", time: "18 min", popular: false },
        { title: "SDKs disponibles", time: "10 min", popular: false },
      ],
    },
    {
      icon: Video,
      title: "Tutoriales en Video",
      description: "Aprende visualmente",
      articles: [
        { title: "Tour completo de Vesta", time: "25 min", popular: true },
        { title: "Configuración avanzada", time: "35 min", popular: false },
        { title: "Trucos y consejos", time: "15 min", popular: true },
        { title: "Casos de uso reales", time: "40 min", popular: false },
      ],
    },
  ];

  const popularArticles = [
    {
      title: "Guía completa de configuración inicial",
      description: "Todo lo que necesitas saber para empezar con Vesta",
      category: "Configuración",
      readTime: "10 min",
      downloads: 1250,
    },
    {
      title: "Optimización para portales inmobiliarios",
      description: "Mejores prácticas para maximizar la visibilidad",
      category: "Marketing",
      readTime: "15 min",
      downloads: 980,
    },
    {
      title: "Integración con sistemas existentes",
      description: "Conecta Vesta con tus herramientas actuales",
      category: "Integraciones",
      readTime: "20 min",
      downloads: 750,
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
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Centro de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Documentación
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Guías completas, tutoriales paso a paso y recursos técnicos para
              sacar el máximo provecho de Vesta.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar en la documentación..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Explora por Categorías
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Encuentra exactamente lo que necesitas
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => {
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
                      {category.articles.map((article) => (
                        <div
                          key={article.title}
                          className="group flex cursor-pointer items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700 transition-colors group-hover:text-amber-600">
                              {article.title}
                            </span>
                            {article.popular && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {article.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        Ver Todos los Artículos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Artículos Más Populares
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Lo que más consulta nuestra comunidad
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {popularArticles.map((article) => (
              <Card
                key={article.title}
                className="transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-medium uppercase tracking-wider text-amber-600">
                        {article.category}
                      </div>
                      <CardTitle className="mt-2 text-lg">
                        {article.title}
                      </CardTitle>
                    </div>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {article.downloads.toLocaleString()} descargas
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full">
                    Leer Artículo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Enlaces Rápidos
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "API Reference",
                description: "Documentación técnica completa",
                link: "/producto/api",
              },
              {
                title: "Video Tutoriales",
                description: "Aprende visualmente",
                link: "/recursos/academia",
              },
              {
                title: "Centro de Soporte",
                description: "Ayuda personalizada",
                link: "/recursos/soporte",
              },
              {
                title: "Comunidad",
                description: "Conecta con otros usuarios",
                link: "/recursos/comunidad",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="text-center transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={item.link}>
                      Explorar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿No Encuentras lo que Buscas?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Nuestro equipo de soporte está aquí para ayudarte con cualquier
            pregunta
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/recursos/soporte">
                Contactar Soporte
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/recursos/comunidad">Unirse a la Comunidad</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
