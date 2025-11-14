import { Card, CardContent } from "~/components/ui/card";
import { CartelMiniGallery } from "./cartel-mini-gallery";
import type { PropertyImage } from "~/lib/data";

interface CartelImageGallerySectionProps {
  images: PropertyImage[];
  selectedIndices: number[];
  onSelectionChange: (indices: number[]) => void;
}

export function CartelImageGallerySection({
  images,
  selectedIndices,
  onSelectionChange,
}: CartelImageGallerySectionProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <CartelMiniGallery
            images={images}
            title="Selecciona 3 o 4 imágenes para el cartel"
            maxSelection={4}
            selectedIndices={selectedIndices}
            onSelectionChange={onSelectionChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
