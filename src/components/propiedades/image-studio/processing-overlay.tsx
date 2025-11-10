"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ProcessingOverlayProps {
  isVisible: boolean;
  processingType: "mejora" | "renovación";
}

const processingSteps = [
  "Analizando imagen",
  "Optimizando calidad",
  "Aplicando mejoras",
  "Finalizando",
];

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Cycle through steps every 20 seconds for a 3-minute process
  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % processingSteps.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50"
          style={{ pointerEvents: "none" }}
        >
          {/* Subtle background overlay */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

          {/* Minimal centered content */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="text-center">
              {/* Subtle pulsing dots */}
              <div className="mb-8 flex justify-center space-x-2">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0,
                  }}
                  className="h-2 w-2 rounded-full bg-gray-400"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="h-2 w-2 rounded-full bg-gray-400"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  className="h-2 w-2 rounded-full bg-gray-400"
                />
              </div>

              {/* Processing step text */}
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.5 }}
                className="text-sm text-muted-foreground"
              >
                {processingSteps[currentStep]}
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
