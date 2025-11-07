"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Globe,
  Calendar,
  Sparkles,
  Brain,
  FileText,
  Check,
  Home,
  MapPin,
  Bed,
  Bath,
  Square,
  Euro,
  Eye,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  CalendarCheck,
  AlertCircle,
  FileCheck,
  Search,
  Upload,
  Download,
  Zap,
  Languages,
  PenTool,
  User,
  CalendarIcon,
  Handshake,
  ThumbsUp,
  ThumbsDown,
  Clock,
  X,
  CalendarPlus,
  UserX,
  Mail,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Car,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

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
        "Inteligencia Artificial integrada"
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
    title: "Procesamiento de Documentos",
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
        "Búsqueda en texto completo",
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
  const fullDescription = "Espectacular villa mediterránea ubicada en la exclusiva zona de Marbella. Esta propiedad de 280m² ofrece 4 amplios dormitorios y 3 baños completos, perfecta para familias que buscan confort y elegancia.\n\nDestacan sus acabados de alta calidad, cocina totalmente equipada con electrodomésticos de última generación, y un luminoso salón con acceso directo a la terraza con vistas panorámicas al mar.";

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
                setDescriptionText(fullDescription.slice(0, descriptionIndex + 1));
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
  }, [activeFeature, generatedTitle, fullDescription]);

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
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
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
                  "relative flex flex-col items-center justify-center rounded-xl p-4 transition-all duration-200",
                  "hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-br from-amber-50 to-rose-50 shadow-lg"
                    : "bg-gray-50 shadow hover:shadow-lg",
                )}
              >
                <div
                  className={cn(
                    "mb-2 rounded-lg p-2 transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-rose-400"
                      : "bg-gray-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-gray-600",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-center text-xs font-medium transition-colors",
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
            <motion.div
              key="properties"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        Gestión de Propiedades
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Administra tu portafolio inmobiliario con herramientas
                        intuitivas y potentes. Crea listados detallados,
                        gestiona documentos y realiza seguimiento de cada
                        propiedad.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Imágenes ilimitadas, vídeos, tour virtuales
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Herramienta de edición de carteles
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Tareas, notas y seguimiento de actividad
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Publicación multi-portal
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Integración con Catastro y Google Maps
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Inteligencia Artificial integrada
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* Property Cards Preview - Middle and Right Columns */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* Stats Bar */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                          124
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Propiedades activas
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                          48
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Visitas esta semana
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                          €2.4M
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Valor total portfolio
                        </div>
                      </div>
                    </div>

                    {/* Property Cards */}
                    <div className="relative grid grid-cols-2 gap-3 pr-4 pb-4">
                      <AnimatePresence mode="wait">
                        {cardSetIndex === 0 ? (
                          <motion.div
                            key="set1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-2 gap-3 col-span-2"
                          >
                      {/* Property Card 1 */}
                            <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_d4c2o2d4c2o2d4c2.png"
                            alt="Villa Mediterránea"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {/* Top Left - Property Type */}
                          <Badge
                            variant="outline"
                            className="absolute left-2 top-2 z-10 bg-white/80 text-[10px] px-1 py-0"
                          >
                            Casa
                          </Badge>
                          {/* Top Right - Status */}
                          <Badge className="absolute right-2 top-2 z-10 text-[10px] px-1 py-0">
                            Venta
                          </Badge>
                          {/* Bottom Center - Reference Number */}
                          <div className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2">
                            <span className="text-[8px] font-semibold tracking-widest text-gray-700/90">
                              REF-001
                            </span>
                            </div>
                          </div>

                        <CardContent className="p-2">
                          <div className="mb-0.5 flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xs font-semibold">
                                Villa Mediterránea
                              </h3>
                                </div>
                            <p className="text-xs font-bold whitespace-nowrap">875k€</p>
                              </div>

                          <div className="mb-1 flex items-center text-muted-foreground">
                            <MapPin className="mr-0.5 h-2.5 w-2.5" />
                            <p className="line-clamp-1 text-[10px]">
                              Marbella, Málaga
                            </p>
                            </div>

                          <div className="flex justify-between gap-1 text-[10px]">
                            <div className="flex items-center">
                              <Bed className="mr-0.5 h-2.5 w-2.5" />
                              <span>4</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="mr-0.5 h-2.5 w-2.5" />
                              <span>3</span>
                              </div>
                            <div className="flex items-center">
                              <Square className="mr-0.5 h-2.5 w-2.5" />
                              <span>280m²</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="relative border-t border-border/40 p-2 pt-1">
                          <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                            <User className="h-2.5 w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                            <p className="text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
                              C. Rodríguez
                            </p>
                          </div>
                        </CardFooter>
                      </Card>

                      {/* Property Card 2 */}
                      <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_65zxcv65zxcv65zx.png"
                            alt="Ático Duplex"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {/* Top Left - Property Type */}
                          <Badge
                            variant="outline"
                            className="absolute left-2 top-2 z-10 bg-white/80 text-[10px] px-1 py-0"
                          >
                            Piso
                          </Badge>
                          {/* Top Right - Status */}
                          <Badge className="absolute right-2 top-2 z-10 bg-amber-500 text-[10px] px-1 py-0">
                            Reservado
                          </Badge>
                          {/* Bottom Center - Reference Number */}
                          <div className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2">
                            <span className="text-[8px] font-semibold tracking-widest text-gray-700/90">
                              REF-002
                                </span>
                              </div>
                            </div>

                        <CardContent className="p-2">
                          <div className="mb-0.5 flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xs font-semibold">
                                Ático Duplex
                              </h3>
                          </div>
                            <p className="text-xs font-bold whitespace-nowrap">425k€</p>
                        </div>

                          <div className="mb-1 flex items-center text-muted-foreground">
                            <MapPin className="mr-0.5 h-2.5 w-2.5" />
                            <p className="line-clamp-1 text-[10px]">
                              Valencia, Valencia
                            </p>
                      </div>

                          <div className="flex justify-between gap-1 text-[10px]">
                            <div className="flex items-center">
                              <Bed className="mr-0.5 h-2.5 w-2.5" />
                              <span>3</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="mr-0.5 h-2.5 w-2.5" />
                              <span>2</span>
                          </div>
                            <div className="flex items-center">
                              <Square className="mr-0.5 h-2.5 w-2.5" />
                              <span>150m²</span>
                                </div>
                              </div>
                        </CardContent>
                        <CardFooter className="relative border-t border-border/40 p-2 pt-1">
                          <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                            <User className="h-2.5 w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                            <p className="text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
                              M. González
                            </p>
                            </div>
                        </CardFooter>
                      </Card>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="set2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-2 gap-3 col-span-2"
                          >
                            {/* Property Card 3 */}
                            <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_4qeqxx4qeqxx4qeq.png"
                            alt="Chalet Moderno"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {/* Top Left - Property Type */}
                          <Badge
                            variant="outline"
                            className="absolute left-2 top-2 z-10 bg-white/80 text-[10px] px-1 py-0"
                          >
                            Casa
                          </Badge>
                          {/* Top Right - Status */}
                          <Badge className="absolute right-2 top-2 z-10 text-[10px] px-1 py-0">
                            Venta
                          </Badge>
                          {/* Bottom Center - Reference Number */}
                          <div className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2">
                            <span className="text-[8px] font-semibold tracking-widest text-gray-700/90">
                              REF-003
                              </span>
                            </div>
                              </div>

                        <CardContent className="p-2">
                          <div className="mb-0.5 flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xs font-semibold">
                                Chalet Moderno
                              </h3>
                            </div>
                            <p className="text-xs font-bold whitespace-nowrap">650k€</p>
                          </div>

                          <div className="mb-1 flex items-center text-muted-foreground">
                            <MapPin className="mr-0.5 h-2.5 w-2.5" />
                            <p className="line-clamp-1 text-[10px]">
                              Madrid, Madrid
                            </p>
                          </div>

                          <div className="flex justify-between gap-1 text-[10px]">
                            <div className="flex items-center">
                              <Bed className="mr-0.5 h-2.5 w-2.5" />
                              <span>5</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="mr-0.5 h-2.5 w-2.5" />
                              <span>4</span>
                            </div>
                            <div className="flex items-center">
                              <Square className="mr-0.5 h-2.5 w-2.5" />
                              <span>320m²</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="relative border-t border-border/40 p-2 pt-1">
                          <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                            <User className="h-2.5 w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                            <p className="text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
                              Ana Martínez
                            </p>
                          </div>
                        </CardFooter>
                      </Card>

                      {/* Property Card 4 */}
                      <Card className="group overflow-hidden transition-all hover:shadow-lg">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_fvcyy0fvcyy0fvcy.png"
                            alt="Estudio Centro"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {/* Top Left - Property Type */}
                          <Badge
                            variant="outline"
                            className="absolute left-2 top-2 z-10 bg-white/80 text-[10px] px-1 py-0"
                          >
                            Piso
                          </Badge>
                          {/* Top Right - Status */}
                          <Badge className="absolute right-2 top-2 z-10 text-[10px] px-1 py-0">
                            Venta
                          </Badge>
                          {/* Bottom Center - Reference Number */}
                          <div className="absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2">
                            <span className="text-[8px] font-semibold tracking-widest text-gray-700/90">
                              REF-004
                                </span>
                              </div>
                            </div>

                        <CardContent className="p-2">
                          <div className="mb-0.5 flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-1 text-xs font-semibold">
                                Estudio Centro
                              </h3>
                          </div>
                            <p className="text-xs font-bold whitespace-nowrap">180k€</p>
                        </div>

                          <div className="mb-1 flex items-center text-muted-foreground">
                            <MapPin className="mr-0.5 h-2.5 w-2.5" />
                            <p className="line-clamp-1 text-[10px]">
                              Barcelona, Barcelona
                            </p>
                      </div>

                          <div className="flex justify-between gap-1 text-[10px]">
                            <div className="flex items-center">
                              <Bed className="mr-0.5 h-2.5 w-2.5" />
                              <span>1</span>
                    </div>
                            <div className="flex items-center">
                              <Bath className="mr-0.5 h-2.5 w-2.5" />
                              <span>1</span>
                  </div>
                            <div className="flex items-center">
                              <Square className="mr-0.5 h-2.5 w-2.5" />
                              <span>45m²</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="relative border-t border-border/40 p-2 pt-1">
                          <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                            <User className="h-2.5 w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                            <p className="text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
                              J. López
                            </p>
                          </div>
                        </CardFooter>
                      </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CRM de Contactos Preview */}
          {activeFeature === "crm" && (
            <motion.div
              key="crm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        CRM de Contactos
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Gestiona demandantes y propietarios desde un solo lugar. 
                        Organiza visitas, ofertas, tareas y mantén un historial completo 
                        de cada contacto.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Gestión de demandantes y propietarios
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Cruces automáticos entre demandas e intereses
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Seguimiento de visitas y ofertas
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Tareas y recordatorios automatizados
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700">
                            Historial completo de interacciones
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* Contact Cards Preview - Middle and Right Columns */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* Stats Bar */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-sm font-mono font-bold tracking-wider uppercase text-gray-900">
                          245
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Demandantes
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-sm font-mono font-bold tracking-wider uppercase text-gray-900">
                          95
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Propietarios
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center shadow-md">
                        <div className="text-sm font-mono font-bold tracking-wider uppercase text-gray-900">
                          28
                        </div>
                        <div className="text-[10px] uppercase text-gray-600">
                          Tareas pendientes
                        </div>
                      </div>
                    </div>

                    {/* Contact Cards */}
                    <div className="space-y-4">
                      {/* Contact Card 1 */}
                      <div className="overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
                        <div className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
                                <Users className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">
                                  Carlos Rodríguez
                                </h5>
                              </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                Visita Pendiente
                              </span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>+34 612 345 678</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>carlosrodriguez@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>Madrid</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t pt-3">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />3 tareas pendientes
                              </span>
                              <span className="flex items-center gap-1">
                                <Home className="h-3 w-3" />2 propiedades
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Última actividad: hace 2h
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Card 2 */}
                      <div className="overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg">
                        <div className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
                                <Users className="h-5 w-5 text-rose-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900">
                                  María González
                                </h5>
                              </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              <span className="flex items-center gap-1">
                                <Handshake className="h-4 w-4" />
                                Oferta Pendiente
                              </span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>+34 655 432 109</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>mariagonzalez@gmail.com</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span>Barcelona</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t pt-3">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />5 tareas pendientes
                              </span>
                              <span className="flex items-center gap-1">
                                <Home className="h-3 w-3" />1 propiedad
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Última actividad: hace 1 día
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Publicación Multi-Portal Preview */}
          {activeFeature === "portals" && (
            <motion.div
              key="portals"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        Publicación Multi-Portal
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Publica en los principales portales inmobiliarios de España
                        con un solo clic. Ahorra tiempo y maximiza la exposición
                        de tus propiedades.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Publicación simultánea en todos los portales",
                          "Sincronización automática de cambios",
                          "Gestión centralizada de respuestas",
                          "Análisis de rendimiento por portal",
                        ].map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* Portal Cards Grid - Right Columns - Similar to portal-selection.tsx */}
                  <div className="space-y-4 lg:col-span-2">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        {
                          id: "idealista",
                          name: "Idealista",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                          description: "El portal inmobiliario más visitado de España",
                        },
                        {
                          id: "fotocasa",
                          name: "Fotocasa",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                          description: "Encuentra tu casa ideal con millones de anuncios",
                        },
                        {
                          id: "habitaclia",
                          name: "Habitaclia",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                          description: "Portal especializado en alquiler y venta",
                        },
                        {
                          id: "milanuncios",
                          name: "Milanuncios",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-milanuncios.png",
                          description: "Portal de anuncios clasificados líder en España",
                        },
                        {
                          id: "pisoscom",
                          name: "Pisos.com",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                          description: "Tu portal inmobiliario de confianza",
                        },
                        {
                          id: "yaencontre",
                          name: "Yaencontre",
                          logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-yaencontre.png",
                          description: "Encuentra tu hogar ideal",
                        },
                        {
                          id: "enalquiler",
                          name: "EnAlquiler",
                          logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-ena.svg",
                          description: "Especialistas en alquiler de viviendas",
                        },
                        {
                          id: "kyero",
                          name: "Kyero",
                          logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/kyerologo.webp",
                          description: "Portal inmobiliario internacional",
                        },
                      ].map((platform, index) => {
                        const isActive = portalStates[platform.id] ?? false;
                        return (
                          <motion.div
                            key={platform.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                          >
                            <Card
                              className={cn(
                                "group relative transition-all duration-300",
                                isActive
                                  ? "bg-white shadow-lg"
                                  : "bg-transparent shadow-sm hover:border-gray-300",
                              )}
                            >
                              <CardContent className="flex flex-col p-3 relative">
                                <div className="flex h-16 flex-col items-center justify-start">
                                  {/* Platform Logo */}
                                  <div className="flex items-center justify-center flex-1 min-h-0 -mt-2">
                                    <div className="relative">
                                      {platform.logo ? (
                                        <Image
                                          src={platform.logo}
                                          alt={platform.name}
                                          width={64}
                                          height={64}
                                          className="object-contain max-h-12"
                                          onError={(e) => {
                                            // Fallback for missing logos
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = "none";
                                            target.parentElement!.innerHTML = `<div class="text-sm font-medium text-gray-500 w-16 h-16 flex items-center justify-center">${platform.name}</div>`;
                                          }}
                                        />
                                      ) : (
                                        <div className="flex h-12 w-16 items-center justify-center text-sm font-medium text-gray-500">
                                          {platform.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Minimal Toggle Switch - Fixed Position */}
                                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isActive}
                                    onClick={() => {
                                      setPortalStates((prev) => ({
                                        ...prev,
                                        [platform.id]: !prev[platform.id],
                                      }));
                                    }}
                                    className={cn(
                                      "relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full border border-gray-200 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:ring-offset-1",
                                      isActive
                                        ? "bg-gray-300 border-gray-300"
                                        : "bg-gray-50 border-gray-200",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
                                        isActive ? "translate-x-4" : "translate-x-0.5",
                                      )}
                                    />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Portal Dashboard */}
                    <div className="rounded-lg bg-white p-5 shadow-md border border-gray-100">
                      <h5 className="mb-4 text-sm font-medium text-gray-700">
                        Leads por Portal
                      </h5>
                      
                      {/* Stacked Bar Chart */}
                      <div className="mb-4">
                        <div className="relative h-14 w-full overflow-visible">
                          {[
                            {
                              id: "idealista",
                              logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                              leads: 8,
                              color: "#A3D200",
                            },
                            {
                              id: "fotocasa",
                              logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                              leads: 5,
                              color: "#0064D2",
                            },
                            {
                              id: "habitaclia",
                              logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                              leads: 3,
                              color: "#FF6600",
                            },
                            {
                              id: "pisoscom",
                              logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                              leads: 2,
                              color: "#003366",
                            },
                          ]
                            .filter((item) => item.leads > 0)
                            .reduce(
                              (acc, item, index, array) => {
                                const totalLeads = array.reduce(
                                  (sum, i) => sum + i.leads,
                                  0,
                                );
                                const previousWidth = acc.previousWidth;
                                const width = (item.leads / totalLeads) * 100;
                                const gap = index > 0 ? 0.3 : 0; // Small gap between segments
                                acc.segments.push({
                                  ...item,
                                  width: width - gap,
                                  left: previousWidth + gap,
                                });
                                acc.previousWidth += width;
                                return acc;
                              },
                              { segments: [] as Array<{ id: string; logo: string; leads: number; color: string; width: number; left: number }>, previousWidth: 0 },
                            )
                            .segments.map((segment, index, segmentsArray) => {
                              // Convert hex to rgba for transparency
                              const hexToRgba = (hex: string, alpha: number) => {
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                              };
                              
                              // Determine border radius based on position
                              const isFirst = index === 0;
                              const isLast = index === segmentsArray.length - 1;
                              const borderRadius = isFirst 
                                ? "rounded-l-full" 
                                : isLast 
                                ? "rounded-r-full" 
                                : "";
                              
                              return (
                              <motion.div
                                key={segment.id}
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: `${segment.width}%`, opacity: 1 }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                className={cn(
                                  "absolute h-full flex items-center justify-center transition-all duration-500 shadow-md",
                                  borderRadius
                                )}
                                style={{
                                  left: `${segment.left}%`,
                                  background: `linear-gradient(135deg, ${segment.color} 0%, ${hexToRgba(segment.color, 0.7)} 50%, ${segment.color} 100%)`,
                                }}
                              >
                                {segment.width > 15 && (
                                  <span className="text-sm font-semibold text-white drop-shadow-md font-mono">
                                    {segment.leads}
                                  </span>
                                )}
                              </motion.div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="flex items-center justify-center gap-6 -mt-1">
                        {[
                          {
                            id: "idealista",
                            logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
                            leads: 8,
                            color: "#A3D200",
                          },
                          {
                            id: "fotocasa",
                            logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
                            leads: 5,
                            color: "#0064D2",
                          },
                          {
                            id: "habitaclia",
                            logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
                            leads: 3,
                            color: "#FF6600",
                          },
                          {
                            id: "pisoscom",
                            logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
                            leads: 2,
                            color: "#003366",
                          },
                        ]
                          .filter((item) => item.leads > 0)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-center gap-3"
                            >
                              <div
                                className="h-3 w-3 rounded-sm flex-shrink-0 self-center"
                                style={{ backgroundColor: item.color }}
                              />
                              <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                                <Image
                                  src={item.logo}
                                  alt=""
                                  width={80}
                                  height={80}
                                  className="object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Calendario Integrado Preview */}
          {activeFeature === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        Calendario Integrado
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Nunca falles a una cita. Programa visitas, recordatorios
                        y tareas. Sincroniza con tu calendario favorito y mantén
                        todo organizado.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Programación inteligente de visitas",
                          "Recordatorios automáticos por SMS/Email",
                          "Sincronización con Google/Outlook",
                          "Vista de equipo compartida",
                        ].map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* Calendar Preview - Middle and Right Columns */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* Weekly Calendar View */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      {/* Week Navigation Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50 transition-colors"
                            aria-label="Semana anterior"
                          >
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50 transition-colors"
                            aria-label="Semana siguiente"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          </button>
                          <h5 className="ml-2 font-semibold text-gray-900">
                            Septiembre 2024
                          </h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Image
                              src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/Google_Calendar_icon_(2020).svg.png"
                              alt="Google Calendar"
                              width={20}
                              height={20}
                              className="h-5 w-5 object-contain opacity-70"
                            />
                            <Image
                              src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/outlook-calendar.png"
                              alt="Outlook Calendar"
                              width={20}
                              height={20}
                              className="h-5 w-5 object-contain opacity-70"
                            />
                          </div>
                          <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            Hoy
                          </button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="overflow-x-auto">
                        <div className="min-w-[640px]">
                          {/* Day Headers */}
                          <div className="grid grid-cols-8 border-b">
                            {/* Time column header */}
                            <div className="flex h-12 min-w-[60px] items-center justify-center border-r text-xs text-gray-500">
                              GMT+02
                            </div>

                            {/* Day columns headers */}
                            {["L", "M", "X", "J", "V", "S", "D"].map(
                              (day, dayIdx) => {
                                const isToday = dayIdx === 2; // Wednesday as "today"
                                const dayNumber = 15 + dayIdx;
                                return (
                                  <div
                                    key={dayIdx}
                                    className={cn(
                                      "relative flex h-12 min-w-[80px] flex-col items-center justify-center border-r",
                                      isToday && "bg-slate-50/50",
                                    )}
                                  >
                                    <div className="text-xs text-gray-600">
                                      {day}
                                    </div>
                                    <div
                                      className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                                        isToday
                                          ? "bg-slate-600 text-white"
                                          : "text-gray-700",
                                      )}
                                    >
                                      {dayNumber}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>

                          {/* Calendar Body with Time Slots */}
                          <div 
                            className="relative max-h-[400px] overflow-y-auto border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                          >
                            <div className="grid grid-cols-8">
                              {/* Hours column */}
                              <div className="flex flex-col border-r bg-gray-50/50">
                                {Array.from({ length: 12 }, (_, i) => i + 8).map(
                                  (hour) => (
                                    <div
                                      key={hour}
                                      className="flex h-[60px] items-start justify-end border-b pr-2 pt-1 text-xs text-gray-500"
                                    >
                                      {hour.toString().padStart(2, "0")}:00
                                    </div>
                                  ),
                                )}
                              </div>

                              {/* Days columns */}
                              {Array.from({ length: 7 }, (_, dayIdx) => {
                                const isToday = dayIdx === 2;
                                return (
                                  <div
                                    key={dayIdx}
                                    className={cn(
                                      "relative flex min-w-[80px] flex-col border-r",
                                      isToday && "bg-blue-50/30",
                                    )}
                                  >
                                    {/* Hour slots */}
                                    {Array.from(
                                      { length: 12 },
                                      (_, i) => i + 8,
                                    ).map((hour) => (
                                      <div
                                        key={hour}
                                        className="relative h-[60px] border-b"
                                      >
                                        {/* Half-hour divider */}
                                        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-200"></div>
                                      </div>
                                    ))}

                                    {/* Sample Appointments */}
                                    {dayIdx === 0 && (
                                      <>
                                        {/* 10:00 AM appointment with transport time */}
                                        <div
                                          className="absolute left-1 right-1 rounded-t-md bg-slate-50 border-l-4 border-slate-400 p-1.5 text-xs z-10"
                                          style={{
                                            top: "120px", // 10:00 AM (2 hours * 60px)
                                            height: "60px", // 1 hour
                                          }}
                                        >
                                          <div className="font-medium text-slate-700">
                                            10:00
                                          </div>
                                          <div className="text-slate-600 truncate text-xs">
                                            Visita Villa
                                          </div>
                                          <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                                            <Car className="h-2.5 w-2.5" />
                                            <span className="text-xs">15min</span>
                                          </div>
                                        </div>
                                        {/* Transport time block */}
                                        <div
                                          className="absolute left-1 right-1 rounded-b-md backdrop-blur-sm z-10"
                                          style={{
                                            top: "180px", // Below appointment
                                            height: "15px", // 15 minutes
                                            background: "linear-gradient(to top, rgba(71, 85, 105, 0.12), rgba(71, 85, 105, 0.25))",
                                          }}
                                        >
                                          <div className="absolute bottom-0.5 right-1.5">
                                            <Car className="h-2 w-2 text-slate-400 opacity-50" />
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {dayIdx === 2 && (
                                      <>
                                        {/* 10:00 AM appointment */}
                                        <div
                                          className="absolute left-1 right-1 rounded-md bg-slate-50 border-l-4 border-slate-400 p-1.5 text-xs z-10"
                                          style={{
                                            top: "120px", // 10:00 AM
                                            height: "60px",
                                          }}
                                        >
                                          <div className="font-medium text-slate-700">
                                            10:00
                                          </div>
                                          <div className="text-slate-600 truncate text-xs">
                                            Visita Villa
                                          </div>
                                        </div>
                                        {/* 12:00 PM appointment with transport time */}
                                        <div
                                          className="absolute left-1 right-1 rounded-t-md bg-neutral-50 border-l-4 border-neutral-400 p-1.5 text-xs z-10"
                                          style={{
                                            top: "240px", // 12:00 PM
                                            height: "60px",
                                          }}
                                        >
                                          <div className="font-medium text-neutral-700">
                                            12:00
                                          </div>
                                          <div className="text-neutral-600 truncate text-xs">
                                            Firma contrato
                                          </div>
                                          <div className="mt-0.5 flex items-center gap-1 text-neutral-500">
                                            <Car className="h-2.5 w-2.5" />
                                            <span className="text-xs">25min</span>
                                          </div>
                                        </div>
                                        {/* Transport time block for 12:00 PM */}
                                        <div
                                          className="absolute left-1 right-1 rounded-b-md backdrop-blur-sm z-10"
                                          style={{
                                            top: "300px", // Below appointment
                                            height: "25px", // 25 minutes
                                            background: "linear-gradient(to top, rgba(82, 82, 82, 0.12), rgba(82, 82, 82, 0.25))",
                                          }}
                                        >
                                          <div className="absolute bottom-0.5 right-1.5">
                                            <Car className="h-2 w-2 text-neutral-400 opacity-50" />
                                          </div>
                                        </div>
                                        {/* 16:00 PM appointment */}
                                        <div
                                          className="absolute left-1 right-1 rounded-md bg-stone-50 border-l-4 border-stone-400 p-1.5 text-xs z-10"
                                          style={{
                                            top: "480px", // 4:00 PM
                                            height: "90px", // 1.5 hours
                                          }}
                                        >
                                          <div className="font-medium text-stone-700">
                                            16:00
                                          </div>
                                          <div className="text-stone-600 truncate text-xs">
                                            Reunión equipo
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {dayIdx === 4 && (
                                      <>
                                        {/* 11:00 AM appointment with transport time */}
                                        <div
                                          className="absolute left-1 right-1 rounded-t-md bg-gray-50 border-l-4 border-gray-400 p-1.5 text-xs z-10"
                                          style={{
                                            top: "180px", // 11:00 AM
                                            height: "90px", // 1.5 hours
                                          }}
                                        >
                                          <div className="font-medium text-gray-700">
                                            11:00
                                          </div>
                                          <div className="text-gray-600 truncate text-xs">
                                            Presentación
                                          </div>
                                          <div className="mt-1 flex items-center gap-1 text-gray-500">
                                            <Car className="h-2.5 w-2.5" />
                                            <span className="text-xs">20min</span>
                                          </div>
                                        </div>
                                        {/* Transport time block for 11:00 AM */}
                                        <div
                                          className="absolute left-1 right-1 rounded-b-md backdrop-blur-sm z-10"
                                          style={{
                                            top: "270px", // Below appointment
                                            height: "20px", // 20 minutes
                                            background: "linear-gradient(to top, rgba(107, 114, 128, 0.12), rgba(107, 114, 128, 0.25))",
                                          }}
                                        >
                                          <div className="absolute bottom-0.5 right-1.5">
                                            <Car className="h-2 w-2 text-gray-400 opacity-50" />
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Descripciones con IA Preview */}
          {activeFeature === "ai" && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        Descripciones con IA
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Genera descripciones atractivas y optimizadas para SEO
                        con inteligencia artificial. Destaca las mejores
                        características de cada propiedad.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Generación en segundos",
                          "Optimización SEO automática",
                          "Múltiples idiomas disponibles",
                          "Personalización por cliente",
                        ].map((item, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* AI Generation Preview - Middle and Right Columns */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* AI Controls */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h5 className="font-semibold text-gray-900">
                          Generador de Descripciones IA
                        </h5>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-600">
                            Powered by GPT-4
                          </span>
                        </div>
                      </div>
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <button className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200">
                          <Languages className="mr-1 inline h-4 w-4" />
                          Español
                        </button>
                        <button className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200">
                          <PenTool className="mr-1 inline h-4 w-4" />
                          Tono Profesional
                        </button>
                      </div>
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-3 font-medium text-white transition-all hover:from-amber-500 hover:to-rose-500">
                        <Zap className="h-5 w-5" />
                        Generar Descripción
                      </button>
                    </div>

                    {/* Generated Description Example */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-3">
                        <h5 className="font-semibold text-gray-900">
                          {activeFeature === "ai" ? (
                            <>
                              {generatedTitleText}
                              {isTypingGenerated && <span className="ml-1 animate-pulse">|</span>}
                            </>
                          ) : (
                            "Descripción Generada"
                          )}
                        </h5>
                      </div>
                      <div className="prose prose-sm text-gray-700">
                        {activeFeature === "ai" ? (
                          <>
                            {descriptionText.split("\n\n").map((paragraph, index, arr) => {
                              if (!paragraph) return null;
                              const isLastParagraph = index === arr.length - 1;
                              const isLastNonEmpty = arr.filter(p => p).length - 1 === index;
                              return (
                                <p key={index} className={index > 0 ? "mt-2 leading-relaxed" : "leading-relaxed"}>
                                  {paragraph}
                                  {isTypingDescription && isLastNonEmpty && (
                                    <span className="ml-1 animate-pulse">|</span>
                                  )}
                                </p>
                              );
                            })}
                            {!descriptionText && isTypingDescription && (
                              <span className="animate-pulse">|</span>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="leading-relaxed">
                              Espectacular villa mediterránea ubicada en la
                              exclusiva zona de Marbella. Esta propiedad de 280m²
                              ofrece 4 amplios dormitorios y 3 baños completos,
                              perfecta para familias que buscan confort y elegancia.
                            </p>
                            <p className="mt-2 leading-relaxed">
                              Destacan sus acabados de alta calidad, cocina
                              totalmente equipada con electrodomésticos de última
                              generación, y un luminoso salón con acceso directo a
                              la terraza con vistas panorámicas al mar.
                            </p>
                          </>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          Generado en 2.3 segundos
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          Score SEO: 94/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Procesamiento de Documentos Preview */}
          {activeFeature === "docs" && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-8 shadow-lg">
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Description and Features - Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-2xl font-bold text-gray-900">
                        Procesamiento de Documentos
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        Digitaliza y extrae información de documentos
                        automáticamente con OCR avanzado. Organiza contratos,
                        escrituras y más en segundos.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Características principales
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "OCR avanzado con IA",
                          "Extracción automática de datos",
                          "Organización inteligente",
                          "Búsqueda en texto completo",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                      <Link
                        href="https://cal.com/vesta-crm/30min"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
                      >
                        Probar Gratis
                      </Link>
                      <button className="w-full rounded-lg bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                        Más información
                      </button>
                    </div>
                  </div>

                  {/* Document Processing Preview - Middle and Right Columns */}
                  <div className="space-y-4 lg:col-span-2">
                    {/* Upload Area */}
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 shadow-sm transition-colors hover:border-amber-300">
                      <div className="text-center">
                        <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="font-medium text-gray-600">
                          Arrastra documentos aquí o haz clic para subir
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          PDF, JPG, PNG hasta 10MB
                        </p>
                      </div>
                    </div>

                    {/* Recent Documents */}
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <h5 className="mb-3 font-semibold text-gray-900">
                        Documentos Procesados
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Escritura_Villa_Marbella.pdf
                              </div>
                              <div className="text-xs text-gray-500">
                                Procesado • 2.4MB
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded p-1 hover:bg-gray-200">
                              <Search className="h-4 w-4 text-gray-600" />
                            </button>
                            <button className="rounded p-1 hover:bg-gray-200">
                              <Download className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                Contrato_Alquiler_Valencia.pdf
                              </div>
                              <div className="text-xs text-gray-500">
                                Procesado • 1.8MB
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded p-1 hover:bg-gray-200">
                              <Search className="h-4 w-4 text-gray-600" />
                            </button>
                            <button className="rounded p-1 hover:bg-gray-200">
                              <Download className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extraction Results */}
                    <div className="rounded-lg bg-amber-50 p-3 text-sm">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Datos extraídos automáticamente
                        </span>
                      </div>
                      <div className="mt-2 text-amber-700">
                        Propietario: Juan García • Precio: €875,000 • Fecha:
                        15/09/2024
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
