import type { FC } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import type { StyleSelectorProps } from "~/types/carteleria";
import { templateStyles } from "~/lib/carteleria/templates";
import { TemplatePreviewRenderer } from "./templates/template-renderer";

export const StyleSelector: FC<StyleSelectorProps> = ({
  selectedStyleId,
  onStyleSelect,
  styles = templateStyles,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {styles.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyleId === style.id}
            onSelect={() => onStyleSelect(style.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface StyleCardProps {
  style: (typeof templateStyles)[0];
  isSelected: boolean;
  onSelect: () => void;
}

const StyleCard: FC<StyleCardProps> = ({ style, isSelected, onSelect }) => {
  const isInactive = !style.isActive;

  return (
    <Card
      className={`group transition-all duration-200 ${
        isInactive
          ? "cursor-not-allowed opacity-60 grayscale"
          : "cursor-pointer hover:scale-105 hover:shadow-lg"
      } ${
        isSelected && !isInactive
          ? "scale-105 shadow-lg ring-2 ring-primary"
          : isInactive
            ? ""
            : "hover:shadow-md"
      }`}
      onClick={isInactive ? undefined : onSelect}
    >
      <CardHeader className="space-y-3">
        {/* Template Preview */}
        <div className="relative aspect-[210/297] overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="absolute inset-0">
            <TemplatePreviewRenderer
              styleId={style.id}
              size="small"
              className={`transition-transform duration-200 ${!isInactive ? "group-hover:scale-105" : ""}`}
            />
          </div>

          {/* Próximamente overlay for inactive templates */}
          {isInactive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-center">
                <div className="rounded-lg bg-white/90 px-4 py-2 shadow-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    Próximamente
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overlay with selection indicator */}
          {isSelected && !isInactive && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
              <div className="rounded-full bg-primary p-2 shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Style Info */}
        <div className="space-y-2">
          <CardTitle
            className={`text-lg transition-colors ${!isInactive ? "group-hover:text-primary" : ""}`}
          >
            {style.name}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {style.description}
        </CardDescription>

        {/* Status Feedback */}
        {isInactive && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-2 text-orange-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Próximamente disponible
              </span>
            </div>
          </div>
        )}

        {isSelected && !isInactive && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Estilo seleccionado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
