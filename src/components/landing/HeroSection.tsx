"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  const scrollToCalendar = () => {
    const calendar = document.getElementById("memory-calendar");
    calendar?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-pink-50 via-rose-50 to-amber-50/30">
      {/* Subtle decorative elements */}
      <motion.div
        className="absolute left-10 top-20 h-64 w-64 rounded-full bg-pink-200/20 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Small decorative text */}
          <motion.p
            className="text-sm font-medium tracking-widest text-pink-400 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Un regalo especial para ti
          </motion.p>

          {/* Main title */}
          <motion.h1
            className="text-5xl font-light tracking-tight text-gray-800 sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Feliz{" "}
            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 bg-clip-text font-normal text-transparent">
              28
            </span>{" "}
            Cumpleaños
          </motion.h1>

          {/* Name */}
          <motion.h2
            className="font-serif text-6xl font-light italic text-gray-700 sm:text-7xl md:text-8xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Amaya
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="mx-auto max-w-md pt-4 text-lg text-gray-500 sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Nuestros recuerdos, siempre con nosotros
          </motion.p>

          {/* Decorative hearts */}
          <motion.div
            className="flex items-center justify-center gap-2 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className="text-pink-300"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              >
                ♥
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToCalendar}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer text-gray-400 transition-colors hover:text-pink-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          aria-label="Ver calendario de recuerdos"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-8 w-8" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
