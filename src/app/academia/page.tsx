"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";
import {
  academyArticles,
  getCategories,
  getCategoryDisplayName,
  searchArticles,
  getArticleById,
  type AcademyArticle,
} from "~/lib/academy-data";
import { ArticleCard } from "~/components/academy/article-card";
import { ArticleSheet } from "~/components/academy/article-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ChevronDown, Search, GraduationCap } from "lucide-react";

export default function AcademiaPage() {
  const searchParams = useSearchParams();
  const articleIdFromUrl = searchParams.get("article");

  const [selectedCategory, setSelectedCategory] = useState<string>("Todas las categorías");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<AcademyArticle | null>(
    articleIdFromUrl ? getArticleById(articleIdFromUrl) ?? null : null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(Boolean(articleIdFromUrl));

  const categories = useMemo(() => getCategories(), []);

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let articles = academyArticles;

    // Filter by category
    if (selectedCategory !== "Todas las categorías") {
      articles = articles.filter(
        (article) => article.category === selectedCategory,
      );
    }

    // Search
    if (searchQuery.trim()) {
      articles = searchArticles(searchQuery);
      // Apply category filter after search if needed
      if (selectedCategory !== "Todas las categorías") {
        articles = articles.filter(
          (article) => article.category === selectedCategory,
        );
      }
    }

    return articles;
  }, [selectedCategory, searchQuery]);

  // Group by category for display
  const articlesByCategory = useMemo(() => {
    const grouped: Record<string, AcademyArticle[]> = {};

    filteredArticles.forEach((article) => {
      const category = article.category;
      grouped[category] ??= [];
      const articles = grouped[category];
      if (articles) {
        articles.push(article);
      }
    });

    return grouped;
  }, [filteredArticles]);

  const handleArticleClick = (article: AcademyArticle) => {
    setSelectedArticle(article);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedArticle(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                Academia Vesta
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:mt-6 sm:text-lg md:text-xl">
              Aprende a usar Vesta al máximo con nuestras guías, tutoriales y
              preguntas frecuentes. Todo lo que necesitas saber en un solo
              lugar.
            </p>

            {/* Search and Filters */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar artículos..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    {selectedCategory === "Todas las categorías"
                      ? "Todas las categorías"
                      : getCategoryDisplayName(selectedCategory as AcademyArticle["category"])}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory("Todas las categorías")}
                  >
                    Todas las categorías
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {getCategoryDisplayName(category)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {filteredArticles.length > 0 ? (
            <div className="space-y-12">
              {Object.entries(articlesByCategory).map(([category, articles]) => (
                <div key={category}>
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">
                    {getCategoryDisplayName(category as AcademyArticle["category"])}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No se encontraron artículos
              </h3>
              <p className="mt-2 text-gray-600">
                Intenta con otra búsqueda o categoría diferente.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Todas las categorías");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-t border-gray-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const count = academyArticles.filter(
                (a) => a.category === category,
              ).length;
              return (
                <div
                  key={category}
                  className="text-center rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="text-3xl font-bold text-amber-600">
                    {count}
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-600">
                    {getCategoryDisplayName(category)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Article Sheet */}
      <ArticleSheet
        article={selectedArticle}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />

      <Footer />
    </div>
  );
}
