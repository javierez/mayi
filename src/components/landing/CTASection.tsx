"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCounter } from "~/components/landing/animations";

export function CTASection() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would normally handle the email submission
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="bg-gradient-to-r from-amber-400/90 to-rose-400/90 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <motion.h2
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Transforma tu Negocio Inmobiliario Hoy
        </motion.h2>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-primary-foreground/90"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Únete al grupo de profesionales inmobiliarios que ya están
          revolucionando su forma de trabajar con Vesta. Atrévete.
        </motion.p>

        {!isSubscribed ? (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
              <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:gap-x-4"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-auto bg-white/90 text-gray-900 placeholder:text-gray-500"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full flex-none sm:w-auto"
                  >
                    Comenzar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </form>
            <motion.p
              className="mt-4 text-sm leading-6 text-primary-foreground/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              Te enviaremos las credenciales de acceso. Sin spam, prometido.
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="inline-flex items-center rounded-full bg-green-100 px-6 py-3 text-green-800"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Check className="mr-2 h-5 w-5" />
              </motion.div>
              ¡Gracias! Te contactaremos pronto.
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="mt-10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm leading-6 text-primary-foreground/80">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/signin" className="inline-block">
              <motion.span
                className="font-semibold underline hover:no-underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Iniciar sesión
              </motion.span>
            </Link>
          </p>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          className="mt-16 border-t border-white/20 pt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2, delayChildren: 0.8 },
              },
            }}
          >
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <AnimatedCounter
                to={500}
                suffix="+"
                className="text-2xl font-bold text-white"
              />
              <div className="text-sm text-primary-foreground/80">
                Propiedades gestionadas
              </div>
            </motion.div>
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <AnimatedCounter
                to={98}
                suffix="%"
                className="text-2xl font-bold text-white"
              />
              <div className="text-sm text-primary-foreground/80">
                Satisfacción del cliente
              </div>
            </motion.div>
            <motion.div
              className="text-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-primary-foreground/80">
                Soporte técnico
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Value Propositions */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 1.2 },
            },
          }}
        >
          {[
            "Publica en todos los portales con un solo clic",
            "Convierte más leads con seguimiento inteligente",
            "Ahorra tiempo con descripciones generadas por IA",
            "Mantén toda tu información en un solo lugar",
          ].map((text, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-3 text-sm text-primary-foreground/90"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 1.2 + index * 0.1 + 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-300" />
              </motion.div>
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
