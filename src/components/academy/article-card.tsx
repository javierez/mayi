import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock } from "lucide-react";
import { type AcademyArticle } from "~/lib/academy-data";

interface ArticleCardProps {
  article: AcademyArticle;
  onClick: () => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const Icon = article.icon;

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-amber-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="rounded-lg bg-amber-100 p-2 transition-colors group-hover:bg-amber-200">
              <Icon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2 transition-colors group-hover:text-amber-600">
                {article.title}
              </h3>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="flex-shrink-0 text-xs bg-gray-100 text-gray-700"
          >
            {article.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {article.shortDescription}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{article.readTimeMinutes} min lectura</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
