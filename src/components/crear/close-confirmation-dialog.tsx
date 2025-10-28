"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Save, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";

interface CloseConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndClose: () => Promise<void>;
  onDiscardAndClose: () => void;
  hasUnsavedChanges: boolean;
}

export default function CloseConfirmationDialog({
  isOpen,
  onClose,
  onSaveAndClose,
  onDiscardAndClose,
  hasUnsavedChanges,
}: CloseConfirmationDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndClose = async () => {
    try {
      setIsSaving(true);
      await onSaveAndClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAndClose = () => {
    onDiscardAndClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200"
        >
          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{
              scale: 1.05,
              backgroundColor: "rgba(243, 244, 246, 0.8)",
            }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-4 top-4 z-20 rounded-full p-2 text-gray-400 transition-all duration-200 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </motion.button>

          {/* Content */}
          <div className="p-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {/* Icon with elegant gradient background */}
              <div className="mb-6 flex justify-center">
                <motion.div
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 ring-8 ring-gray-50"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <AlertTriangle className="h-7 w-7 text-gray-600" />
                  {/* Subtle pulse animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/30 to-gray-100/30"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>

              {/* Title with gradient text */}
              <motion.h3
                className="mb-3 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-xl font-bold tracking-tight text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                ¿Cerrar formulario?
              </motion.h3>

              {/* Elegant divider */}
              <motion.div
                className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-gray-300 to-gray-400"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />

              {/* Message */}
              <motion.p
                className="mb-8 text-sm leading-relaxed text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {hasUnsavedChanges ? (
                  <>
                    Tienes cambios sin guardar que se perderán si continúas.
                    <br />
                    <span className="font-medium text-gray-700">
                      ¿Qué deseas hacer?
                    </span>
                  </>
                ) : (
                  <>¿Estás seguro de que quieres cerrar el formulario?</>
                )}
              </motion.p>

              {/* Buttons with staggered animation */}
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.5,
                    },
                  },
                }}
              >
                {hasUnsavedChanges && (
                  <>
                    {/* Save and Close */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleSaveAndClose}
                        disabled={isSaving}
                        className="group relative w-full overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 py-3 text-white shadow-md transition-all duration-300 hover:from-gray-500 hover:to-gray-600 hover:shadow-lg disabled:opacity-70"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="font-medium">Guardando...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                              <span className="font-medium">
                                Guardar y cerrar
                              </span>
                            </>
                          )}
                        </div>
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.6 }}
                        />
                      </Button>
                    </motion.div>

                    {/* Discard and Close */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={handleDiscardAndClose}
                        className="group w-full bg-gray-400 py-3 text-white shadow-md transition-all duration-300 hover:bg-gray-500 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="font-medium">Descartar cambios</span>
                        </div>
                      </Button>
                    </motion.div>
                  </>
                )}

                {!hasUnsavedChanges && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleDiscardAndClose}
                      className="group relative w-full overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 py-3 text-white shadow-md transition-all duration-300 hover:from-gray-500 hover:to-gray-600 hover:shadow-lg"
                    >
                      <span className="font-medium">Cerrar</span>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>
                )}

                {/* Cancel */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    className="w-full py-3 text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-800"
                  >
                    <span className="font-medium">Cancelar</span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
