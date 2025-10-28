import { Building, Home, Car, Store } from "lucide-react";

interface PropertyImagePlaceholderProps {
  propertyType?: string | null;
  className?: string;
}

const getPropertyIcon = (propertyType?: string | null) => {
  switch (propertyType?.toLowerCase()) {
    case "casa":
    case "chalet":
    case "villa":
      return Home;
    case "piso":
    case "apartamento":
    case "atico":
    case "duplex":
    case "estudio":
      return Building;
    case "garaje":
    case "parking":
      return Car;
    case "local":
    case "oficina":
    case "nave":
      return Store;
    default:
      return Building;
  }
};

export function PropertyImagePlaceholder({
  propertyType,
  className = "",
}: PropertyImagePlaceholderProps) {
  const IconComponent = getPropertyIcon(propertyType);

  return (
    <div
      className={`flex items-center justify-center border border-amber-200/20 bg-gradient-to-br from-amber-400/10 to-rose-400/10 ${className}`}
    >
      <div className="flex items-center justify-center">
        <IconComponent className="h-5 w-5 text-amber-500/60" />
      </div>
    </div>
  );
}
