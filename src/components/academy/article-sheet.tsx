"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Clock, Calendar, Tag } from "lucide-react";
import { type AcademyArticle } from "~/lib/academy-data";
import ReactMarkdown from "react-markdown";

interface ArticleSheetProps {
  article: AcademyArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleSheet({ article, isOpen, onClose }: ArticleSheetProps) {
  if (!article) return null;

  const Icon = article.icon;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-3">
              <Icon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl leading-tight">
                {article.title}
              </SheetTitle>
              <p className="mt-2 text-sm text-gray-600">
                {article.shortDescription}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 border-t border-b py-3">
            <Badge variant="secondary" className="bg-gray-100">
              {article.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{article.readTimeMinutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Actualizado:{" "}
                {article.lastUpdated.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 border border-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Article Content */}
        <div className="mt-6 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-amber-600 prose-code:bg-amber-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </SheetContent>
    </Sheet>
  );
}
