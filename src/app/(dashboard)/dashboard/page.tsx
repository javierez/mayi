"use client";

import { useState, useEffect } from "react";
import PublishedPropertiesCard from "~/components/dashboard/properties/PublishedPropertiesCard";
import OngoingOperationsCard from "~/components/dashboard/operations/OngoingOperationsCard";
import QuickActionsCard from "~/components/dashboard/QuickActionsCard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  OngoingOperationsCardSkeleton,
  PublishedPropertiesCardSkeleton,
  QuickActionsCardSkeleton,
  PerformanceMetricsCardSkeleton,
} from "~/components/ui/skeletons";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data - replace with actual data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <>
            {/* Quick Stats Skeletons */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
              <OngoingOperationsCardSkeleton className="lg:row-span-2" />
              <PublishedPropertiesCardSkeleton />
              <QuickActionsCardSkeleton />
            </div>

            {/* Performance Metrics Skeleton */}
            <PerformanceMetricsCardSkeleton />
          </>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
              <OngoingOperationsCard className="lg:row-span-2" />
              <PublishedPropertiesCard />
              <QuickActionsCard />
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Resumen de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Vistas de Propiedades
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">
                      +15% desde la semana pasada
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Conversión de Leads
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">23%</div>
                    <p className="text-xs text-muted-foreground">
                      +5% desde la semana pasada
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Tiempo Promedio de Respuesta
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">2.5h</div>
                    <p className="text-xs text-muted-foreground">
                      -30min desde la semana pasada
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
