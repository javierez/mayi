"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useState } from "react";

interface ProcessingOverlayProps {
  isVisible: boolean;
  processingType: "mejora" | "renovación";
}

const motivationalMessages = [
  "Haz que tus clientes vean todo el potencial de sus propiedades",
  "Transforma espacios ordinarios en hogares extraordinarios",
  "La IA está creando la visión perfecta para tus compradores",
  "Convierte cada propiedad en el hogar de sus sueños",
];

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  const [randomMessage] = useState(
    () =>
      motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ],
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
          style={{ pointerEvents: "none" }} // Allow interactions with main image
        >
          {/* Background overlay that darkens the entire screen */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Bolt loading animation centered in the middle of the screen */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.1, 1],
              opacity: 1,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 0.6,
              scale: {
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.5,
                ease: "easeInOut",
              },
            }}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform"
          >
            <div className="text-center">
              {/* Animated bolt icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 shadow-2xl">
                <Zap className="h-8 w-8 text-white" />
              </div>

              {/* Loading text */}
              <motion.div
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mt-2 text-sm font-medium text-white"
              >
                {randomMessage}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
