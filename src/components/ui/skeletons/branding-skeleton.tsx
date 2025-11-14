"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { motion } from "framer-motion";

/**
 * Skeleton for full branding page
 * Includes: breadcrumb, header, main branding card, and color palette card
 */
export function BrandingPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center space-x-2"
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </motion.div>

      {/* Header skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-96" />
      </motion.div>

      <BrandingSkeleton />
    </div>
  );
}

/**
 * Skeleton for AccountBranding component content only
 * Matches the structure: main branding card and color palette card
 */
export function BrandingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main branding card skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo preview skeleton */}
            <div className="flex justify-center">
              <div className="space-y-3">
                <Skeleton className="h-64 w-64 rounded-lg" />
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-40 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Color palette card skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <Skeleton className="h-16 w-full min-w-16 rounded-lg" />
                  <div className="text-center">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="mt-1 h-3 w-16" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
