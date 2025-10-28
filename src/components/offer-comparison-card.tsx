import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface OfferComparisonCardProps {
  offer: number;
  listingPrice: string;
}

export function OfferComparisonCard({ offer, listingPrice }: OfferComparisonCardProps) {
  const listingPriceNum = parseFloat(listingPrice);
  const difference = offer - listingPriceNum;
  const percentageDiff = ((difference / listingPriceNum) * 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K €`;
    }
    return formatCurrency(value);
  };

  const getDifferenceColor = () => {
    if (difference < 0) return {
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      badge: "bg-rose-500",
      icon: ArrowDownRight,
    };
    if (difference > 0) return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-500",
      icon: ArrowUpRight,
    };
    return {
      text: "text-gray-600",
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
        <h4 className="text-sm font-medium text-gray-700">Comparación de Precio</h4>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg} ${colors.border} border`}>
          <DiffIcon className={`h-3.5 w-3.5 ${colors.text}`} />
          <span className={`text-xs font-bold ${colors.text}`}>
            {getDifferenceSign()}{formatCurrency(Math.abs(difference))}
          </span>
          <span className={`text-xs opacity-40 ${colors.text}`}>•</span>
          <span className={`text-xs font-bold ${colors.text}`}>
            {getDifferenceSign()}{Math.abs(percentageDiff).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Overlapping bars comparison */}
      <div className="relative space-y-3">
        {/* Listing Price Bar (Background/Reference) */}
        <div className="relative h-12 w-full bg-slate-100 rounded-lg overflow-hidden shadow-inner">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 rounded-lg shadow-sm transition-all duration-700 ease-out flex items-center justify-between px-3"
            style={{ width: `${listingWidth}%` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest drop-shadow-md">
                Precio de Venta
              </span>
            </div>
            <span className="text-xs font-bold text-white drop-shadow-md">
              {formatCurrency(listingPriceNum)}
            </span>
          </div>
        </div>

        {/* Offer Bar (Foreground/Comparison) */}
        <div className="relative h-12 w-full bg-orange-50 rounded-lg overflow-hidden shadow-inner border border-orange-100">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-lg shadow-md transition-all duration-700 ease-out delay-150 flex items-center justify-between px-3"
            style={{ width: `${offerWidth}%` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest drop-shadow-md">
                Oferta Recibida
              </span>
            </div>
            <span className="text-xs font-bold text-white drop-shadow-md">
              {formatCurrency(offer)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
