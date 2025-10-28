"use client";

import { useState } from "react";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "~/components/landing/animations";

const testimonials = [
  {
    id: 1,
    name: "Carmen Martínez",
    role: "Agente Inmobiliario Senior",
    company: "Inmobiliaria Costa Brava",
    location: "Girona, España",
    avatar: "CM",
    rating: 5,
    testimonial:
      "Vesta ha revolucionado completamente mi forma de trabajar. En 6 meses he duplicado mis ventas gracias a la automatización del CRM y las publicaciones multi-portal. La IA para descripciones me ahorra horas cada semana.",
    metrics: {
      sales: "+120%",
      time: "15h/sem",
      leads: "+85%",
    },
    featured: true,
  },
  {
    id: 2,
    name: "Miguel Rodríguez",
    role: "Director Comercial",
    company: "PropiaMadrid",
    location: "Madrid, España",
    avatar: "MR",
    rating: 5,
    testimonial:
      "La integración con todos los portales principales ha sido un game-changer. Publicamos 200+ propiedades simultáneamente y el seguimiento de leads es impecable. ROI increíble.",
    metrics: {
      sales: "+95%",
      time: "20h/sem",
      leads: "+150%",
    },
    featured: false,
  },
  {
    id: 3,
    name: "Ana García-López",
    role: "Fundadora & CEO",
    company: "Valencia Properties",
    location: "Valencia, España",
    avatar: "AG",
    rating: 5,
    testimonial:
      "Como directora de una agencia con 25 agentes, Vesta nos ha permitido escalar sin perder calidad. El calendario compartido y la gestión de documentos son excepcionales.",
    metrics: {
      sales: "+75%",
      time: "30h/sem",
      leads: "+110%",
    },
    featured: false,
  },
  {
    id: 4,
    name: "Carlos Mendoza",
    role: "Agente Inmobiliario",
    company: "Costas & Asociados",
    location: "Málaga, España",
    avatar: "CM2",
    rating: 5,
    testimonial:
      "La herramienta de IA para generar descripciones es espectacular. Mis listados tienen más visitas y mejores conversiones. El soporte técnico es de primera.",
    metrics: {
      sales: "+140%",
      time: "12h/sem",
      leads: "+90%",
    },
    featured: false,
  },
  {
    id: 5,
    name: "Isabel Ruiz",
    role: "Agente Freelance",
    company: "Independiente",
    location: "Sevilla, España",
    avatar: "IR",
    rating: 5,
    testimonial:
      "Trabajo sola y Vesta me da las herramientas de una gran agencia. La automatización me permite competir con equipos grandes manteniendo un servicio personalizado.",
    metrics: {
      sales: "+160%",
      time: "18h/sem",
      leads: "+200%",
    },
    featured: false,
  },
];

export function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<
    "sales" | "time" | "leads"
  >("sales");

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const current = testimonials[currentTestimonial] ?? testimonials[0];

  if (!current) return null;

  const metricLabels = {
    sales: "Incremento Ventas",
    time: "Tiempo Ahorrado",
    leads: "Más Leads",
  };

  return (
    <section className="bg-gradient-to-b from-white to-amber-50/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Un grupo selecto de profesionales inmobiliarios ya confía en Vesta
            para hacer crecer su negocio
          </p>

          {/* Trust Indicators */}
          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2, delayChildren: 0.3 },
              },
            }}
          >
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5 },
                },
              }}
            >
              <AnimatedCounter
                to={500}
                suffix="+"
                className="text-2xl font-bold text-gray-900"
              />
              <div className="text-sm text-gray-600">Agentes activos</div>
            </motion.div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5 },
                },
              }}
            >
              <div className="text-2xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">Valoración media</div>
              <motion.div
                className="mt-1 flex justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, staggerChildren: 0.1 }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block"></div>
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.5 },
                },
              }}
            >
              <AnimatedCounter
                to={98}
                suffix="%"
                className="text-2xl font-bold text-gray-900"
              />
              <div className="text-sm text-gray-600">Recomendarían</div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Testimonial Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="overflow-hidden rounded-2xl bg-white shadow-2xl"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="grid lg:grid-cols-3">
                  {/* Testimonial Content - Left 2/3 */}
                  <div className="p-8 lg:col-span-2 lg:p-12">
                    {/* Quote Icon */}
                    <div className="mb-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400">
                        <Quote className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="mb-8 text-xl leading-relaxed text-gray-900">
                      &ldquo;{current.testimonial}&rdquo;
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
                        <span className="text-lg font-bold text-gray-700">
                          {current.avatar}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {current.name}
                        </div>
                        <div className="text-gray-600">{current.role}</div>
                        <div className="text-sm text-gray-500">
                          {current.company}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {current.location}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: current.rating }, (_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({current.rating}/5)
                      </span>
                    </div>
                  </div>

                  {/* Metrics Sidebar - Right 1/3 */}
                  <div className="bg-gradient-to-br from-amber-50 to-rose-50 p-6 lg:p-8">
                    <h4 className="mb-4 font-semibold text-gray-900">
                      Resultados obtenidos
                    </h4>

                    {/* Metric Selector */}
                    <div className="mb-4 space-y-2">
                      {(
                        Object.keys(metricLabels) as Array<
                          keyof typeof metricLabels
                        >
                      ).map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setSelectedMetric(metric)}
                          className={cn(
                            "w-full rounded-lg p-2.5 text-left transition-all",
                            selectedMetric === metric
                              ? "bg-white shadow-md ring-2 ring-amber-200"
                              : "hover:bg-white/50",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {metricLabels[metric]}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {current.metrics[metric]}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Achievement Badge */}
                    <div className="rounded-lg bg-white p-4 text-center">
                      <TrendingUp className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                      <div className="text-sm font-medium text-gray-900">
                        Cliente destacado
                      </div>
                      <div className="text-xs text-gray-600">
                        Top 10% rendimiento
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows - Hidden on mobile */}
          <motion.button
            onClick={prevTestimonial}
            className="group absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl sm:left-4 sm:h-12 sm:w-12"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-900 sm:h-5 sm:w-5" />
          </motion.button>
          <motion.button
            onClick={nextTestimonial}
            className="group absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl sm:right-4 sm:h-12 sm:w-12"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-900 sm:h-5 sm:w-5" />
          </motion.button>
        </motion.div>

        {/* Testimonial Indicators */}
        <motion.div
          className="mt-8 flex justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
        >
          {testimonials.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={cn(
                "h-3 w-3 rounded-full transition-all",
                index === currentTestimonial
                  ? "scale-125 bg-gradient-to-r from-amber-400 to-rose-400"
                  : "bg-gray-300 hover:bg-gray-400",
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: index === currentTestimonial ? 1.25 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          <motion.button
            className="rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ver demo
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
