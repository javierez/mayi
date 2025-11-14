"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "~/components/landing/animations";

const testimonials = [
  {
    id: 1,
    name: "Santos Martínez",
    role: "Agente Inmobiliario",
    company: "Inmobiliaria Acrópolis",
    location: "León, España",
    avatar: "CM",
    rating: 5,
    testimonial:
      "Vesta ha revolucionado completamente nuestra forma de trabajar. Todas las funcionalidades de productividad y automatizaciones hacen que no pierda tiempo en tareas administrativas y pueda dedicar más tiempo a la venta.",
    metrics: {
      sales: "+20%",
      time: "15h/sem",
      leads: "+5%",
    },
    featured: true,
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
            Los profesionales inmobiliarios más innovadores ya están usando Vesta. La plataforma más potente, desde el primer día
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
                to={10}
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
                  <div className="p-4 sm:p-6 lg:col-span-2 lg:pb-12 lg:pl-8 lg:pr-12 lg:pt-6">
                    {/* Quote Icon */}
                    <div className="mb-4 sm:mb-6">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-rose-400 sm:h-12 sm:w-12">
                        <Quote className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                      </div>
                    </div>

                    {/* Testimonial Text */}
                    <blockquote className="mb-6 text-base leading-relaxed text-gray-900 sm:text-lg md:mb-8 md:text-xl">
                      &ldquo;{current.testimonial}&rdquo;
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20 md:h-[85px] md:w-[85px]">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/sen%CC%83or.png"
                          alt={current.name}
                          width={122}
                          height={122}
                          className="translate-y-1 scale-125 object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">
                          {current.name}
                        </div>
                        <div className="truncate text-sm text-gray-600 sm:text-base">
                          {current.role}
                        </div>
                        <div className="truncate text-xs text-gray-500 sm:text-sm">
                          {current.company}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{current.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Sidebar - Right 1/3 */}
                  <div className="flex flex-col bg-gradient-to-br from-amber-50 to-rose-50 p-4 sm:p-6 lg:p-8">
                    <div>
                      {/* Metric Selector */}
                      <div className="mb-4 mt-0 space-y-2 sm:mt-4 lg:mt-16">
                        {(
                          Object.keys(metricLabels) as Array<
                            keyof typeof metricLabels
                          >
                        ).map((metric) => (
                          <button
                            key={metric}
                            onClick={() => setSelectedMetric(metric)}
                            className={cn(
                              "w-full rounded-lg p-2 text-left transition-all sm:p-2.5",
                              selectedMetric === metric
                                ? "bg-white shadow-md ring-2 ring-amber-200"
                                : "hover:bg-white/50",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-xs font-medium text-gray-700 sm:text-sm">
                                {metricLabels[metric]}
                              </span>
                              <span className="flex-shrink-0 text-base font-bold text-gray-900 sm:text-lg">
                                {current.metrics[metric]}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Company Logo */}
                      <div className="mt-6 flex justify-center sm:mt-8 lg:mt-12">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/customers/acro.png"
                          alt="Inmobiliaria Acrópolis"
                          width={200}
                          height={100}
                          className="h-auto w-full max-w-[140px] object-contain sm:max-w-[160px] md:max-w-[200px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows - Hidden when only one testimonial */}
          {testimonials.length > 1 && (
            <>
              <motion.button
                onClick={prevTestimonial}
                className="group absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl sm:left-2 sm:h-12 sm:w-12 md:left-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              </motion.button>
              <motion.button
                onClick={nextTestimonial}
                className="group absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl sm:right-2 sm:h-12 sm:w-12 md:right-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
              >
                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Testimonial Indicators - Hidden when only one testimonial */}
        {testimonials.length > 1 && (
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
        )}

        {/* Call to Action */}
        <motion.div
          className="mt-8 text-center sm:mt-10 md:mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          <Link
            href="https://cal.com/vesta-crm/30min"
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.button
              className="min-h-[44px] rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 sm:px-6 sm:py-3 sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Probar Gratis
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
