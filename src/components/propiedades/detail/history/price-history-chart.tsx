"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PricePoint {
  date: Date;
  price: number;
  percentChange: number;
  changeType: "reduction" | "increase" | "correction";
  updatedBy: string;
}

interface PriceHistoryChartProps {
  priceHistory: PricePoint[];
}

export function PriceHistoryChart({ priceHistory }: PriceHistoryChartProps) {
  if (priceHistory.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <p>No hay historial de precios disponible</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = priceHistory.map((point) => ({
    date: point.date.getTime(),
    dateLabel: format(point.date, "d MMM yyyy", { locale: es }),
    price: point.price,
    percentChange: point.percentChange,
    changeType: point.changeType,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const changeIcon =
      data.changeType === "reduction" ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : data.changeType === "increase" ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <Minus className="h-4 w-4 text-gray-500" />
      );

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">{data.dateLabel}</p>
        <p className="text-lg font-bold text-primary mb-1">
          €{data.price.toLocaleString("es-ES")}
        </p>
        {data.percentChange !== 0 && (
          <div className="flex items-center gap-1 text-sm">
            {changeIcon}
            <span
              className={
                data.changeType === "reduction"
                  ? "text-red-600"
                  : data.changeType === "increase"
                    ? "text-green-600"
                    : "text-gray-600"
              }
            >
              {data.percentChange > 0 ? "+" : ""}
              {data.percentChange.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  // Calculate price range for Y axis domain
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Precio actual</p>
          <p className="text-lg font-bold text-primary">
            €{priceHistory[priceHistory.length - 1]?.price.toLocaleString("es-ES")}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Precio inicial</p>
          <p className="text-lg font-bold">
            €{priceHistory[0]?.price.toLocaleString("es-ES")}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground mb-1">Total cambios</p>
          <p className="text-lg font-bold">{priceHistory.length}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(value: number) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            name="Precio"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 5, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
