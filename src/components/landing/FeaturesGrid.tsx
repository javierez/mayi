"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Globe,
  Calendar,
  Brain,
  FileText,
} from "lucide-react";
import { PropertiesFeatureCard } from "~/components/landing/PropertiesFeatureCard";
import { CRMFeatureCard } from "~/components/landing/CRMFeatureCard";
import { PortalsFeatureCard } from "~/components/landing/PortalsFeatureCard";
import { CalendarFeatureCard } from "~/components/landing/CalendarFeatureCard";
import { AIFeatureCard } from "~/components/landing/AIFeatureCard";
import { DocsFeatureCard } from "~/components/landing/DocsFeatureCard";

const features = [
  {
    id: "properties",
    title: "Gestión de Propiedades",
    icon: Building2,
    description:
      "Administra tu portafolio inmobiliario con las herramientas más potentes del mercado. Crea propiedades, gestiona documentos y realiza seguimiento de cada propiedad.",
    preview: {
      stats: [
        { label: "Propiedades activas", value: "124", trend: "+12%" },
        { label: "Visitas programadas", value: "48", trend: "+8%" },
        { label: "Documentos gestionados", value: "1,240", trend: "+24%" },
      ],
      features: [
        "Imágenes ilimitadas, vídeos, tour virtuales",
        "Herramienta de edición de carteles",
        "Tareas, notas y seguimiento de actividad",
        "Publicación multi-portal",
        "Integración con Catastro y Google Maps",
        "Inteligencia Artificial integrada",
      ],
    },
  },
  {
    id: "crm",
    title: "Gestión de Contactos",
    icon: Users,
    description:
      "Gestiona demandantes y propietarios desde un solo lugar. Organiza visitas, ofertas, tareas y mantén un historial completo de cada contacto.",
    preview: {
      stats: [
        { label: "Demandantes", value: "245", trend: "+18%" },
        { label: "Propietarios", value: "95", trend: "+12%" },
        { label: "Tareas pendientes", value: "28", trend: "+12%" },
      ],
      features: [
        "Gestión de demandantes y propietarios",
        "Cruces automáticos entre demandas e intereses",
        "Seguimiento de visitas y ofertas",
        "Tareas y recordatorios automatizados",
        "Historial completo de interacciones",
      ],
    },
  },
  {
    id: "portals",
    title: "Publicación Multi-Portal",
    icon: Globe,
    description:
      "Publica en Fotocasa, Habitaclia, Idealista y Milanuncios con un solo clic. Ahorra tiempo y maximiza la exposición de tus propiedades.",
    preview: {
      stats: [
        { label: "Portales conectados", value: "8", trend: "100%" },
        { label: "Publicaciones activas", value: "342", trend: "+15%" },
        { label: "Tiempo ahorrado", value: "18h/sem", trend: "+30%" },
      ],
      features: [
        "Publicación simultánea en todos los portales",
        "Sincronización automática de cambios",
        "Gestión centralizada de respuestas",
        "Análisis de rendimiento por portal",
      ],
    },
  },
  {
    id: "calendar",
    title: "Calendario Integrado",
    icon: Calendar,
    description:
      "Nunca pierdas una cita. Programa visitas, recordatorios y tareas. Sincroniza con tu calendario favorito y mantén todo organizado.",
    preview: {
      stats: [
        { label: "Citas este mes", value: "186", trend: "+12%" },
        { label: "Tasa de asistencia", value: "94%", trend: "+3%" },
        { label: "Recordatorios enviados", value: "372", trend: "+25%" },
      ],
      features: [
        "Programación inteligente de visitas",
        "Recordatorios automáticos por SMS/Email",
        "Sincronización con Google/Outlook",
        "Vista de equipo compartida",
      ],
    },
  },
  {
    id: "ai",
    title: "Descripciones con IA",
    icon: Brain,
    description:
      "Genera descripciones personalizadas a tu gusto y optimizadas para SEO con inteligencia artificial. Destaca las mejores características de cada propiedad a tan solo un clic.",
    preview: {
      stats: [
        { label: "Descripciones generadas", value: "1,420", trend: "+45%" },
        { label: "Tiempo ahorrado", value: "124h", trend: "+38%" },
        { label: "Mejora en CTR", value: "+34%", trend: "+12%" },
      ],
      features: [
        "Generación en segundos",
        "Optimización SEO automática",
        "Múltiples idiomas disponibles",
        "Personalización por cliente",
      ],
    },
  },
  {
    id: "docs",
    title: "Procesamiento de Docs",
    icon: FileText,
    description:
      "Digitaliza y extrae información de documentos automáticamente con OCR avanzado. Organiza contratos, escrituras y más en segundos.",
    preview: {
      stats: [
        { label: "Documentos procesados", value: "8,234", trend: "+28%" },
        { label: "Precisión OCR", value: "99.2%", trend: "+2%" },
        { label: "Tiempo de procesamiento", value: "3 seg", trend: "-40%" },
      ],
      features: [
        "OCR avanzado con IA",
        "Extracción automática de datos",
        "Organización inteligente",
        "Búsqueda en documentos",
      ],
    },
  },
];

export function FeaturesGrid() {
  const [activeFeature, setActiveFeature] = useState<string | null>(
    "properties",
  );
  const [cardSetIndex, setCardSetIndex] = useState(0);
  const [portalStates, setPortalStates] = useState<Record<string, boolean>>({
    idealista: true,
    fotocasa: true,
    habitaclia: true,
    milanuncios: true,
    pisoscom: true,
    yaencontre: true,
    enalquiler: true,
    kyero: true,
  });
  const [generatedTitleText, setGeneratedTitleText] = useState("");
  const [isTypingGenerated, setIsTypingGenerated] = useState(false);
  const [descriptionText, setDescriptionText] = useState("");
  const [isTypingDescription, setIsTypingDescription] = useState(false);

  const generatedTitle = "Descripción Generada";
  const fullDescription =
    "Espectacular villa mediterránea ubicada en la exclusiva zona de Marbella. Esta propiedad de 280m² ofrece 4 amplios dormitorios y 3 baños completos, perfecta para familias que buscan confort y elegancia.\n\nDestacan sus acabados de alta calidad, cocina totalmente equipada con electrodomésticos de última generación, y un luminoso salón con acceso directo a la terraza con vistas panorámicas al mar.";

  const toggleFeature = (featureId: string) => {
    setActiveFeature(activeFeature === featureId ? null : featureId);
  };

  // Auto-rotate property cards every 5 seconds
  useEffect(() => {
    if (activeFeature === "properties") {
      // Reset to first set when switching to properties
      setCardSetIndex(0);

      const interval = setInterval(() => {
        setCardSetIndex((prev) => (prev === 0 ? 1 : 0));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeFeature]);

  const descriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect for "Descripción Generada" title and description
  useEffect(() => {
    if (activeFeature === "ai") {
      setGeneratedTitleText("");
      setDescriptionText("");
      setIsTypingGenerated(true);
      setIsTypingDescription(false);

      let titleIndex = 0;
      let descriptionIndex = 0;

      // Type title first
      const titleInterval = setInterval(() => {
        if (titleIndex < generatedTitle.length) {
          setGeneratedTitleText(generatedTitle.slice(0, titleIndex + 1));
          titleIndex++;
        } else {
          setIsTypingGenerated(false);
          clearInterval(titleInterval);

          // Start typing description after title is complete (small delay)
          descriptionTimeoutRef.current = setTimeout(() => {
            setIsTypingDescription(true);
            descriptionIntervalRef.current = setInterval(() => {
              if (descriptionIndex < fullDescription.length) {
                setDescriptionText(
                  fullDescription.slice(0, descriptionIndex + 1),
                );
                descriptionIndex++;
              } else {
                setIsTypingDescription(false);
                if (descriptionIntervalRef.current) {
                  clearInterval(descriptionIntervalRef.current);
                  descriptionIntervalRef.current = null;
                }
              }
            }, 30); // Type description faster (30ms per character)
          }, 300); // Small delay between title and description
        }
      }, 100); // Type title at 100ms per character

      return () => {
        clearInterval(titleInterval);
        if (descriptionTimeoutRef.current) {
          clearTimeout(descriptionTimeoutRef.current);
          descriptionTimeoutRef.current = null;
        }
        if (descriptionIntervalRef.current) {
          clearInterval(descriptionIntervalRef.current);
          descriptionIntervalRef.current = null;
        }
      };
    } else {
      setGeneratedTitleText("");
      setDescriptionText("");
      setIsTypingGenerated(false);
      setIsTypingDescription(false);
    }
  }, [activeFeature]);

  return (
    <section className="bg-white px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Todo lo que tu agencia necesita
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Herramientas profesionales diseñadas específicamente para el sector
            inmobiliario español
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <motion.div
          className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 1 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;

            return (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    },
                  },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={cn(
                  "relative flex items-center justify-start gap-2 rounded-lg p-2.5 transition-all duration-200",
                  "hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-br from-amber-50 to-rose-50 shadow-lg"
                    : "bg-gray-50 shadow hover:shadow-lg",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 rounded-lg p-1.5 transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-rose-400"
                      : "bg-gray-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : "text-gray-600",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-left text-xs font-medium leading-tight transition-colors",
                    isActive ? "text-gray-900" : "text-gray-600",
                  )}
                >
                  {feature.title}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Expanded Content */}
        <AnimatePresence mode="wait">
          {activeFeature === "properties" && (
            <PropertiesFeatureCard cardSetIndex={cardSetIndex} />
          )}

          {activeFeature === "crm" && <CRMFeatureCard />}

          {activeFeature === "portals" && (
            <PortalsFeatureCard
              portalStates={portalStates}
              setPortalStates={setPortalStates}
            />
          )}

          {activeFeature === "calendar" && <CalendarFeatureCard />}

          {activeFeature === "ai" && (
            <AIFeatureCard
              generatedTitleText={generatedTitleText}
              isTypingGenerated={isTypingGenerated}
              descriptionText={descriptionText}
              isTypingDescription={isTypingDescription}
            />
          )}

          {activeFeature === "docs" && <DocsFeatureCard />}
        </AnimatePresence>
      </div>
    </section>
  );
}
