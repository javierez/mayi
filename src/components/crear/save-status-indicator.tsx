"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader, AlertCircle, Cloud, Clock } from "lucide-react";
import { useSaveQueue } from "./save-context";

export function SaveStatusIndicator() {
  const { saveStatus, getLocalState } = useSaveQueue();
  const [pendingCount, setPendingCount] = useState(0);

  // Update local state periodically
  useEffect(() => {
    const updateLocalState = () => {
      const currentState = getLocalState();

      // Count pending changes
      const pendingProps = Object.keys(currentState.property).length;
      const pendingListingChanges = Object.keys(currentState.listing).length;
      setPendingCount(pendingProps + pendingListingChanges);
    };

    updateLocalState();
    const interval = setInterval(updateLocalState, 500);
    return () => clearInterval(interval);
  }, [getLocalState]);

  const showIndicator = saveStatus !== "idle" || pendingCount > 0;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm ${saveStatus === "saving" ? "bg-gray-900/90 text-white" : ""} ${saveStatus === "saved" ? "bg-green-600/90 text-white" : ""} ${saveStatus === "error" ? "bg-red-600/90 text-white" : ""} ${saveStatus === "idle" && pendingCount > 0 ? "bg-blue-600/90 text-white" : ""} `}
          >
            {saveStatus === "saving" && (
              <>
                <Cloud className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">
                  Guardando {pendingCount > 0 ? `(${pendingCount})` : ""}
                </span>
              </>
            )}

            {saveStatus === "saved" && (
              <>
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Guardado</span>
              </>
            )}

            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Reintentando...</span>
              </>
            )}

            {saveStatus === "idle" && pendingCount > 0 && (
              <>
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">
                  {pendingCount} cambio{pendingCount !== 1 ? "s" : ""} pendiente
                  {pendingCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alternative minimal indicator (badge style)
export function SaveStatusBadge() {
  const { saveStatus } = useSaveQueue();

  if (saveStatus === "idle") return null;

  return (
    <div className="fixed right-4 top-4 z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={saveStatus}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${saveStatus === "saving" ? "bg-gray-100 text-gray-700" : ""} ${saveStatus === "saved" ? "bg-green-100 text-green-700" : ""} ${saveStatus === "error" ? "bg-red-100 text-red-700" : ""} `}
        >
          {saveStatus === "saving" && (
            <>
              <Loader className="h-3 w-3 animate-spin" />
              Guardando
            </>
          )}

          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3" />
              Guardado
            </>
          )}

          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3" />
              Error
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Field-level status indicator for individual form fields
interface FieldStatusIndicatorProps {
  fieldName: string;
  entityType?: "property" | "listing";
  className?: string;
}

export function FieldStatusIndicator({
  fieldName,
  entityType = "property",
  className = "",
}: FieldStatusIndicatorProps) {
  const { getLocalState } = useSaveQueue();
  const [fieldStatus, setFieldStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    const updateFieldStatus = () => {
      const currentState = getLocalState();
      const relevantState =
        entityType === "property"
          ? currentState.property
          : currentState.listing;

      if (fieldName in relevantState) {
        setFieldStatus("pending"); // Field has pending changes
      } else {
        setFieldStatus("idle");
      }
    };

    updateFieldStatus();
    const interval = setInterval(updateFieldStatus, 500);
    return () => clearInterval(interval);
  }, [fieldName, entityType, getLocalState]);

  if (fieldStatus === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center ${className}`}
    >
      {fieldStatus === "pending" && (
        <div
          className="h-2 w-2 animate-pulse rounded-full bg-blue-500"
          title="Cambios pendientes de guardado"
        />
      )}
      {fieldStatus === "saving" && (
        <div
          className="h-2 w-2 animate-spin rounded-full bg-yellow-500"
          title="Guardando..."
        />
      )}
      {fieldStatus === "saved" && (
        <div className="h-2 w-2 rounded-full bg-green-500" title="Guardado" />
      )}
      {fieldStatus === "error" && (
        <div
          className="h-2 w-2 animate-pulse rounded-full bg-red-500"
          title="Error al guardar"
        />
      )}
    </motion.div>
  );
}
