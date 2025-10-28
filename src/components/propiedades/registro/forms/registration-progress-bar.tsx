"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

interface RegistrationProgressBarProps {
  currentStep: number;
  steps: Array<{ id: string; title: string }>;
  formPosition?: number;
  onStepClick?: (stepIndex: number) => void;
}

export default function RegistrationProgressBar({
  currentStep,
  steps,
  formPosition = 1,
  onStepClick,
}: RegistrationProgressBarProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleStepClick = (stepIndex: number) => {
    if (!onStepClick) return;
    const currentFormStep = (formPosition || 1) - 1;

    // Only allow clicking on the immediate next step or previous steps
    if (stepIndex === currentFormStep + 1 || stepIndex < currentFormStep) {
      onStepClick(stepIndex);
    }
  };

  const isStepClickable = (stepIndex: number) => {
    const currentFormStep = (formPosition || 1) - 1;

    // Only allow clicking on the immediate next step or previous steps
    return stepIndex === currentFormStep + 1 || stepIndex < currentFormStep;
  };

  return (
    <div className="mt-6 w-full">
      {/* Progress Bar Container */}
      <div
        className="relative flex flex-col items-center"
        style={{ minHeight: 80 }}
      >
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-4 z-0 h-0.5 bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-yellow-300"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step Indicators */}
        <div
          className="relative z-10 flex w-full justify-between"
          style={{ minHeight: 40 }}
        >
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = isStepClickable(index);

            return (
              <div
                key={step.id}
                className="flex flex-1 flex-col items-center"
                style={{ position: "relative" }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Tooltip */}
                {hoveredStep === index && (
                  <motion.div
                    className="absolute top-10 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step.title}
                    <div className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-b-4 border-l-4 border-r-4 border-transparent border-b-gray-900"></div>
                  </motion.div>
                )}

                {/* Step Circle */}
                <motion.div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-blue-400 to-yellow-300 shadow-lg"
                      : isCurrent
                        ? "bg-gradient-to-r from-blue-400 to-yellow-300 shadow-md ring-2 ring-blue-200 ring-offset-2"
                        : "border-2 border-gray-300 bg-gray-100"
                  } ${
                    isClickable
                      ? "cursor-pointer hover:scale-110 active:scale-95"
                      : "cursor-not-allowed opacity-60"
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  style={{ zIndex: 10 }}
                  onClick={() => handleStepClick(index)}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </motion.div>
                  ) : (
                    <span
                      className={`text-base font-medium ${
                        isCurrent ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {/* Step Titles with neutral colors */}
                <motion.div
                  className="mt-3 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? "text-gray-600"
                        : isCompleted
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
