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

  // Calculate bar widths (percentage relative to the maximum value)
  const maxValue = Math.max(offer, listingPriceNum);
  const offerWidth = (offer / maxValue) * 100;
  const listingWidth = (listingPriceNum / maxValue) * 100;

  const colors = getDifferenceColor();
  const DiffIcon = colors.icon;

  return (
    <div className="space-y-4">
      {/* Header with percentage badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Comparación de Precio
        </h4>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${colors.bg} ${colors.border} border`}
        >
          <DiffIcon className={`h-3.5 w-3.5 ${colors.text}`} />
          <span className={`text-xs font-bold ${colors.text}`}>
            {getDifferenceSign()}
            {formatCurrency(Math.abs(difference))}
          </span>
          <span className={`text-xs opacity-40 ${colors.text}`}>•</span>
          <span className={`text-xs font-bold ${colors.text}`}>
            {getDifferenceSign()}
            {Math.abs(percentageDiff).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Overlapping bars comparison */}
      <div className="relative space-y-3">
        {/* Listing Price Bar (Background/Reference) */}
        <div className="relative h-10 w-full overflow-hidden rounded border border-gray-200 bg-gray-50">
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-between bg-gray-200 px-3 transition-all duration-500 ease-out"
            style={{ width: `${listingWidth}%` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-600">
                Precio de Venta
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {formatCurrency(listingPriceNum)}
            </span>
          </div>
        </div>

        {/* Offer Bar (Foreground/Comparison) */}
        <div className="relative h-10 w-full overflow-hidden rounded border border-gray-200 bg-gray-50">
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-between bg-gray-300 px-3 transition-all delay-75 duration-500 ease-out"
            style={{ width: `${offerWidth}%` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-700">
                Oferta Recibida
              </span>
            </div>
            <span className="text-xs font-semibold text-gray-800">
              {formatCurrency(offer)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
