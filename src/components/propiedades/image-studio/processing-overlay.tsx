"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ProcessingOverlayProps {
  isVisible: boolean;
  processingType: "mejora" | "renovación" | "desenfoque de caras" | "eliminación de desorden";
}

const processingSteps = [
  "Optimizando píxeles (esto no tributa... todavía)",
  "Creando valor sin burocracia de por medio",
  "Aplicando IA antes de que la regulen"
];

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Randomize and cycle through steps every 5 seconds
  useEffect(() => {
    if (!isVisible) {
      // Start with random step when becoming visible
      setCurrentStep(Math.floor(Math.random() * processingSteps.length));
      return;
    }

    const interval = setInterval(() => {
      // Pick a random step different from current
      setCurrentStep((prev) => {
        let next = Math.floor(Math.random() * processingSteps.length);
        while (next === prev && processingSteps.length > 1) {
          next = Math.floor(Math.random() * processingSteps.length);
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-50"
        >
          {/* Compact card in bottom-right corner */}
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              {/* Subtle pulsing dots */}
              <div className="flex space-x-1.5">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0,
                  }}
                  className="h-1.5 w-1.5 rounded-full bg-gray-400"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="h-1.5 w-1.5 rounded-full bg-gray-400"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  className="h-1.5 w-1.5 rounded-full bg-gray-400"
                />
              </div>

              {/* Processing step text */}
              <motion.p
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-muted-foreground"
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
