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
  BookOpen,
  Search,
  Calendar,
  User,
  Clock,
  Tag,
  TrendingUp,
  Heart,
  MessageCircle,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

export const metadata: Metadata = {
  title: "Blog - Vesta",
  description:
    "Artículos, noticias y tendencias del sector inmobiliario. Consejos prácticos para agentes y agencias.",
};

export default function BlogPage() {
  const featuredPost = {
    title: "El Futuro del Marketing Inmobiliario Digital en 2025",
    excerpt:
      "Descubre las tendencias que están transformando cómo los agentes inmobiliarios conectan con clientes y cierran más ventas.",
    author: "María González",
    date: "15 Enero 2025",
    readTime: "8 min",
    category: "Marketing Digital",
    image: "/api/placeholder/800/400",
    likes: 234,
    comments: 18,
  };

  const recentPosts = [
    {
      title: "Cómo Optimizar tu Perfil en Portales Inmobiliarios",
      excerpt:
        "5 consejos para destacar entre la competencia en Fotocasa e Idealista",
      author: "Carlos Ruiz",
      date: "12 Enero 2025",
      readTime: "5 min",
      category: "Portales",
      likes: 156,
    },
    {
      title: "Inteligencia Artificial: Tu Nuevo Aliado en Ventas",
      excerpt:
        "Cómo la IA está revolucionando la descripción de propiedades y la captación de leads",
      author: "Ana Martín",
      date: "10 Enero 2025",
      readTime: "12 min",
      category: "Tecnología",
      likes: 198,
    },
    {
      title: "Gestión de Clientes: Del Primer Contacto al Cierre",
      excerpt:
        "Estrategias probadas para convertir prospectos en clientes satisfechos",
      author: "David López",
      date: "8 Enero 2025",
      readTime: "10 min",
      category: "CRM",
      likes: 289,
    },
    {
      title: "Tendencias del Mercado Inmobiliario en España 2025",
      excerpt:
        "Análisis completo de precios, demanda y oportunidades por regiones",
      author: "Elena Torres",
      date: "5 Enero 2025",
      readTime: "15 min",
      category: "Mercado",
      likes: 421,
    },
  ];

  const categories = [
    { name: "Marketing Digital", count: 28 },
    { name: "Portales Inmobiliarios", count: 19 },
    { name: "Tecnología", count: 15 },
    { name: "CRM y Ventas", count: 22 },
    { name: "Mercado Inmobiliario", count: 31 },
    { name: "Consejos Prácticos", count: 45 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Blog de{" "}
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Vesta
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Artículos, noticias y tendencias del sector inmobiliario. Consejos
              prácticos para hacer crecer tu negocio.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Buscar artículos..." className="pl-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="overflow-hidden transition-all hover:shadow-xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-amber-600" />
                  <p className="mt-2 text-sm text-gray-600">
                    Imagen del artículo destacado
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center p-6">
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  {featuredPost.title}
                </h2>
                <p className="mb-6 text-gray-600">{featuredPost.excerpt}</p>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {featuredPost.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {featuredPost.comments}
                    </div>
                  </div>
                  <Button>
                    Leer Artículo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Posts and Sidebar */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <h2 className="mb-8 text-2xl font-bold text-gray-900">
                Artículos Recientes
              </h2>
              <div className="space-y-6">
                {recentPosts.map((post) => (
                  <Card
                    key={post.title}
                    className="transition-all hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {post.category}
                            </span>
                          </div>
                          <CardTitle className="cursor-pointer text-xl transition-colors hover:text-amber-600">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {post.excerpt}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </div>
                          <Button variant="outline" size="sm">
                            Leer Más
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Button variant="outline" size="lg">
                  Cargar Más Artículos
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categorías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <span className="cursor-pointer text-sm text-gray-700 transition-colors hover:text-amber-600">
                          {category.name}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                          {category.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle>Newsletter</CardTitle>
                  <CardDescription>
                    Recibe los mejores artículos directamente en tu email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Input placeholder="tu@email.com" />
                    <Button className="w-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500">
                      Suscribirse
                    </Button>
                    <p className="text-xs text-gray-500">
                      Sin spam. Solo contenido valioso para tu negocio.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            ¿Quieres Escribir para Nuestro Blog?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comparte tu experiencia con la comunidad inmobiliaria. Buscamos
            artículos de calidad sobre el sector.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
              asChild
            >
              <Link href="/empresa/contacto">
                Proponer Artículo
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
