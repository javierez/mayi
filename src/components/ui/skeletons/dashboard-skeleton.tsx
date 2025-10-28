"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { motion } from "framer-motion";

/**
 * Skeleton for OngoingOperationsCard
 * Matches exact structure: centered number, two toggle cards, process list
 */
export function OngoingOperationsCardSkeleton({ className = "" }) {
  return (
    <Card className={`${className} group relative`}>
      <CardContent>
        {/* Centered large number and label - exactly like line 25-38 */}
        <div className="my-4 mb-6 mt-8 flex flex-col items-center">
          <Skeleton className="h-12 w-16" /> {/* text-5xl size */}
          <Skeleton className="mt-1 h-3 w-40" />{" "}
          {/* text-xs uppercase tracking-widest */}
        </div>

        {/* Two clickable cards for Venta and Alquiler - exactly like line 40-78 */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full justify-center gap-2">
            {/* Active Venta Card - bg-gray-100 shadow-xl */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-1 flex-col items-center rounded-2xl bg-gray-100 p-2 shadow-xl"
            >
              <Skeleton className="mb-0.5 h-4 w-6" />{" "}
              {/* text-base font-bold */}
              <Skeleton className="h-3 w-12" />{" "}
              {/* text-xs uppercase tracking-widest */}
            </motion.div>

            {/* Inactive Alquiler Card - bg-white shadow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-1 flex-col items-center rounded-2xl bg-white p-2 shadow"
            >
              <Skeleton className="mb-0.5 h-4 w-6" />{" "}
              {/* text-base font-bold */}
              <Skeleton className="h-3 w-16" />{" "}
              {/* text-xs uppercase tracking-widest */}
            </motion.div>
          </div>

          {/* Process breakdown list - exactly like line 80-121 */}
          <div className="mt-4 flex w-full flex-col gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <div className="flex w-full items-center justify-between rounded-lg border border-transparent bg-white px-3 py-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" /> {/* Icon h-4 w-4 */}
                    <Skeleton className="h-3.5 w-28" />{" "}
                    {/* text-sm font-medium */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-6" /> {/* text-sm font-bold */}
                    <Skeleton className="h-3 w-3" /> {/* ChevronDown h-3 w-3 */}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for PublishedPropertiesCard
 * Matches exact structure: centered number, two portal cards
 */
export function PublishedPropertiesCardSkeleton() {
  return (
    <Card className="group relative">
      <CardContent>
        {/* Centered large number and label - exactly like line 15-20 */}
        <div className="my-4 mb-6 mt-8 flex flex-col items-center">
          <Skeleton className="h-12 w-20" /> {/* text-5xl font-extrabold */}
          <Skeleton className="mt-1 h-3 w-44" />{" "}
          {/* text-xs uppercase tracking-widest */}
        </div>

        {/* Portal cards - exactly like line 21-46 */}
        <div className="mt-2 space-y-2">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-center justify-between rounded-md bg-white p-2 shadow-md"
            >
              <Skeleton className="h-5 w-20" /> {/* Image placeholder */}
              <Skeleton className="h-3.5 w-10" /> {/* text-sm font-bold */}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for QuickActionsCard
 * Matches exact structure: 2x2 grid of action buttons
 */
export function QuickActionsCardSkeleton() {
  return (
    <Card className="group relative">
      <CardContent>
        {/* Grid exactly like line 33-48 */}
        <div className="mb-4 mt-8 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <Skeleton className="mb-2 h-6 w-6" /> {/* Icon h-6 w-6 */}
              <Skeleton className="h-2.5 w-20" />{" "}
              {/* text-[10px] font-medium uppercase tracking-wide */}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for Performance Metrics Card
 * Matches exact structure with CardHeader and CardContent separated
 */
export function PerformanceMetricsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        {/* CardHeader with CardTitle - exactly like line 55-57 */}
        <CardHeader>
          <CardTitle className="text-lg">
            <Skeleton className="h-5 w-48" /> {/* "Resumen de Rendimiento" */}
          </CardTitle>
        </CardHeader>

        {/* CardContent with grid - exactly like line 58-97 */}
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="space-y-2"
              >
                {/* Label with icon - line 61-65 */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-40" />{" "}
                  {/* text-sm font-medium */}
                  <Skeleton className="h-4 w-4" /> {/* TrendingUp icon */}
                </div>
                {/* Large value - line 67 */}
                <Skeleton className="h-8 w-16" /> {/* text-2xl font-bold */}
                {/* Description - line 68-70 */}
                <Skeleton className="h-3 w-full" />{" "}
                {/* text-xs text-muted-foreground */}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
