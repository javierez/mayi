"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { motion } from "framer-motion";

/**
 * Skeleton for the first page of property creation form
 * Matches: price input, listing type toggle, property type buttons,
 * subtype dropdown, agent dropdown, contacts section, and navigation
 */
export function CrearFirstSkeleton() {
  return (
    <div className="space-y-6">
      {/* Price Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Skeleton className="h-10 w-full rounded-md" />
      </motion.div>

      {/* Listing Type Section */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="mb-4 flex items-center space-x-3">
          <Skeleton className="h-5 w-28" /> {/* "Tipo de Anuncio" */}
          <Skeleton className="h-5 w-5 rounded-full" /> {/* Info icon */}
        </div>
        <div className="relative h-10 rounded-lg bg-gray-100 p-1">
          <div className="relative flex h-full">
            <div className="relative z-10 flex flex-1 items-center justify-center">
              <Skeleton className="h-4 w-12" /> {/* "Venta" */}
            </div>
            <div className="relative z-10 flex flex-1 items-center justify-center">
              <Skeleton className="h-4 w-14" /> {/* "Alquiler" */}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Property Type Section */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Skeleton className="h-5 w-32" /> {/* "Tipo de Propiedad" */}
        {/* Desktop: Single row */}
        <div className="relative hidden h-10 rounded-lg bg-gray-100 p-1 sm:block">
          <div className="relative flex h-full">
            {["Piso", "Casa", "Local", "Solar", "Garaje"].map((_, i) => (
              <div
                key={i}
                className="relative z-10 flex flex-1 items-center justify-center"
              >
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
        {/* Mobile: Grid layout */}
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
          <Skeleton className="col-span-1 h-10 rounded-lg" />
          <Skeleton className="col-span-2 h-10 rounded-lg" />
        </div>
      </motion.div>

      {/* Property Subtype Section */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Skeleton className="h-5 w-40" /> {/* "Subtipo de Propiedad" */}
        <Skeleton className="h-10 w-full rounded-md shadow-md" />
      </motion.div>

      {/* Agent Section */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Skeleton className="h-5 w-16" /> {/* "Agente" */}
        <Skeleton className="h-10 w-full rounded-md shadow-md" />
      </motion.div>

      {/* Contacts Section */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" /> {/* "Propietarios" */}
          <Skeleton className="h-8 w-24 rounded-md" /> {/* "Agregar" button */}
        </div>
        <Skeleton className="h-10 w-full rounded-md shadow-md" />
        {/* Selected contacts placeholder */}
        <div className="mt-2 space-y-1">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Skeleton className="h-10 w-24 rounded-md" /> {/* "Anterior" */}
        <Skeleton className="h-10 w-24 rounded-md" /> {/* "Siguiente" */}
      </motion.div>
    </div>
  );
}
