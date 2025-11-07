"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Play, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer } from "~/components/landing/animations";
import Link from "next/link";

export function HeroSection() {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      // Wait 2 seconds before restarting the video
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(console.error);
      }, 2000);
    };

    video.addEventListener("ended", handleVideoEnd);

    // Auto-play when component mounts
    video.play().catch(console.error);

    return () => {
      video.removeEventListener("ended", handleVideoEnd);
    };
  }, []);

  return (
    <section className="relative bg-white px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8 lg:pt-20 lg:pb-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <motion.div
            className="flex flex-col justify-center space-y-10"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
                Gestiona tu Agencia Inmobiliaria de forma{" "}
                <motion.span
                  className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Inteligente
                </motion.span>
              </h1>
              <motion.p
                className="text-xl text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                El CRM más completo y potente para agencias
                inmobiliarias en España. Automatiza, optimiza y crece tu negocio
                con todas las herramientas disponibles.
              </motion.p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-6 sm:grid sm:max-w-md sm:grid-cols-2 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button
                size="lg"
                className="group border-0 bg-gradient-to-r from-amber-400 to-rose-400 px-8 py-6 text-lg font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500"
                asChild
              >
                <Link href="https://cal.com/vesta-crm/30min" target="_blank" rel="noopener noreferrer">
                  Pruébalo Gratis
                </Link>
              </Button>

              <Button
                size="lg"
                className="group bg-white px-8 py-6 text-lg text-gray-700 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Ver Demo
              </Button>
            </motion.div>

            <StaggerContainer className="flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-8">
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                Configuración rápida
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.3,
                  }}
                />
                Potenciado por IA
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1 }}
              >
                <motion.div
                  className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    delay: 0.6,
                  }}
                />
                Soporte 24h
              </motion.div>
            </StaggerContainer>
          </motion.div>

          {/* Hero Video/Dashboard Preview */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <video
                ref={videoRef}
                src="https://vesta-configuration-files.s3.amazonaws.com/marketing/Room_Assembles_From_a_Box.mp4"
                className="h-full w-full object-cover"
                preload="metadata"
                muted={isMuted}
                playsInline
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmOWZhZmIiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNjI3Mzk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkRhc2hib2FyZCBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg=="
                onError={(e) => {
                  console.error("Video failed to load:", e);
                  const target = e.target as HTMLVideoElement;
                  target.style.display = "none";
                  const fallback = target.parentElement?.querySelector(
                    ".fallback-content",
                  ) as HTMLElement | null;
                  if (fallback) {
                    fallback.style.display = "flex";
                    fallback.classList.remove("hidden");
                  }
                }}
              >
                Tu navegador no soporta el elemento de video.
              </video>

              {/* Fallback content */}
              <div className="fallback-content absolute inset-0 flex hidden items-center justify-center bg-gradient-to-br from-amber-50/50 to-rose-50/50">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-32 w-32 rounded-full bg-gradient-to-r from-amber-100 to-rose-100" />
                  <p className="text-lg font-medium text-gray-600">
                    Dashboard Preview
                  </p>
                  <p className="text-sm text-gray-500">Cargando video...</p>
                </div>
              </div>

              {/* Custom mute button */}
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                  }
                }}
                className="absolute bottom-4 right-4 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all duration-200 hover:bg-black/70 group-hover:opacity-100"
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-r from-amber-200/20 to-rose-200/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-gradient-to-r from-amber-200/20 to-rose-200/20 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
