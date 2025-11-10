import { Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface OfferComparisonCardProps {
  offer: number;
  listingPrice: string;
}

export function OfferComparisonCard({
  offer,
  listingPrice,
}: OfferComparisonCardProps) {
  const listingPriceNum = parseFloat(listingPrice);
  const difference = offer - listingPriceNum;
  const percentageDiff = (difference / listingPriceNum) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDifferenceColor = () => {
    if (difference < 0)
      return {
        text: "text-gray-700",
        bg: "bg-gray-50",
        border: "border-gray-200",
        badge: "bg-gray-500",
        icon: ArrowDownRight,
      };
    if (difference > 0)
      return {
        text: "text-gray-700",
        bg: "bg-gray-50",
        border: "border-gray-200",
        badge: "bg-gray-500",
        icon: ArrowUpRight,
      };
    return {
      text: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-500",
      icon: Minus,
    };
  };

  const getDifferenceSign = () => {
    if (difference > 0) return "+";
    return "";
  };

  const colors = getDifferenceColor();
  const DiffIcon = colors.icon;

  const differenceTextColor = difference < 0 ? "text-amber-800" : "text-gray-700";
  const differenceIconColor = difference < 0 ? "text-amber-500" : "text-gray-500";

  return (
    <div className="flex items-center gap-6">
      {/* Listing Price */}
      <div className="flex flex-1 flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2.5 shadow-md">
        <span className="text-xs font-medium text-gray-600">Precio de Venta</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(listingPriceNum)}
        </span>
      </div>

      {/* Difference - Middle */}
      <div className="flex flex-col items-center gap-1">
        <DiffIcon className={`h-4 w-4 ${differenceIconColor}`} />
        <div className="text-center">
          <div className={`text-xs font-semibold ${differenceTextColor}`}>
            {getDifferenceSign()}
            {formatCurrency(Math.abs(difference))}
          </div>
          <div className={`text-[10px] ${differenceTextColor}`}>
            {getDifferenceSign()}
            {Math.abs(percentageDiff).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Offer Price */}
      <div className="flex flex-1 flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2.5 shadow-md">
        <span className="text-xs font-medium text-gray-600">Oferta Recibida</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(offer)}
        </span>
      </div>
    </div>
  );
}
