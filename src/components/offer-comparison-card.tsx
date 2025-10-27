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

  const getDifferenceColor = () => {
    if (difference < 0) return "text-rose-600"; // Offer lower than listing = seller loses money
    if (difference > 0) return "text-green-600"; // Offer higher than listing = seller gains money
    return "text-gray-600";
  };

  const getDifferenceSign = () => {
    if (difference > 0) return "+";
    return "";
  };

  // Calculate bar widths (percentage relative to the maximum value)
  const maxValue = Math.max(offer, listingPriceNum);
  const offerWidth = (offer / maxValue) * 100;
  const listingWidth = (listingPriceNum / maxValue) * 100;

  return (
    <div className="space-y-3">
      {/* Offer Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Oferta</span>
          <span className="font-bold text-gray-900">{formatCurrency(offer)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-sm h-8 flex items-center">
          <div
            className="bg-gradient-to-r from-orange-300 to-orange-500 rounded-sm h-full transition-all duration-500"
            style={{ width: `${offerWidth}%` }}
          />
        </div>
      </div>

      {/* Listing Price Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Precio de Venta</span>
          <span className="font-bold text-gray-900">{formatCurrency(listingPriceNum)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-sm h-8 flex items-center">
          <div
            className="bg-gradient-to-r from-gray-300 to-gray-500 rounded-sm h-full transition-all duration-500"
            style={{ width: `${listingWidth}%` }}
          />
        </div>
      </div>

      {/* Difference */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Diferencia</span>
          <span className={`font-bold ${getDifferenceColor()}`}>
            {getDifferenceSign()}{formatCurrency(Math.abs(difference))} ({getDifferenceSign()}{Math.abs(percentageDiff).toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
