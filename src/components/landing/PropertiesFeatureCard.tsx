"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  MapPin,
  Bed,
  Bath,
  Square,
  User,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface PropertiesFeatureCardProps {
  cardSetIndex: number;
}

export function PropertiesFeatureCard({ cardSetIndex }: PropertiesFeatureCardProps) {
  return (
    <motion.div
      key="properties"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-rose-50/50 p-4 md:p-6 lg:p-8 shadow-lg">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          {/* Description and Features - Left Column */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h3 className="mb-2 md:mb-3 text-xl md:text-2xl font-bold text-gray-900">
                Gestión de Propiedades
              </h3>
              <p className="text-xs md:text-sm leading-relaxed text-gray-600">
                Administra tu portafolio inmobiliario con herramientas
                intuitivas y potentes. Crea listados detallados,
                gestiona documentos y realiza seguimiento de cada
                propiedad.
              </p>
            </div>

            <div className="space-y-2 md:space-y-3">
              <h4 className="text-xs md:text-sm font-semibold text-gray-900">
                Características principales
              </h4>
              <ul className="space-y-1.5 md:space-y-2">
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Imágenes ilimitadas, vídeos, tour virtuales
                  </span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Herramienta de edición de carteles
                  </span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Tareas, notas y seguimiento de actividad
                  </span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Publicación multi-portal
                  </span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Integración con Catastro y Google Maps
                  </span>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="mt-0.5 md:mt-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-1 flex-shrink-0">
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-700">
                    Inteligencia Artificial integrada
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 md:gap-3 pt-3 md:pt-4">
              <Link
                href="https://cal.com/vesta-crm/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-amber-500 hover:to-rose-500 text-center block"
              >
                Probar Gratis
              </Link>
              <button className="w-full rounded-lg bg-white px-4 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md">
                Más información
              </button>
            </div>
          </div>

          {/* Property Cards Preview - Middle and Right Columns */}
          <div className="space-y-3 md:space-y-4 lg:col-span-2">
            {/* Stats Bar */}
            <div className="mb-4 md:mb-6 grid grid-cols-3 gap-2 md:gap-3 lg:gap-4">
              <div className="rounded-lg bg-white p-2 md:p-3 text-center shadow-md">
                <div className="text-sm md:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  124
                </div>
                <div className="text-[9px] md:text-[10px] uppercase text-gray-600 leading-tight">
                  Propiedades activas
                </div>
              </div>
              <div className="rounded-lg bg-white p-2 md:p-3 text-center shadow-md">
                <div className="text-sm md:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  48
                </div>
                <div className="text-[9px] md:text-[10px] uppercase text-gray-600 leading-tight">
                  Visitas esta semana
                </div>
              </div>
              <div className="rounded-lg bg-white p-2 md:p-3 text-center shadow-md">
                <div className="text-sm md:text-base font-mono font-bold tracking-wider uppercase text-gray-900">
                  €2.4M
                </div>
                <div className="text-[9px] md:text-[10px] uppercase text-gray-600 leading-tight">
                  Valor total portfolio
                </div>
              </div>
            </div>

            {/* Property Cards */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 pr-0 md:pr-4 pb-0 md:pb-4">
              <AnimatePresence mode="wait">
                {cardSetIndex === 0 ? (
                  <motion.div
                    key="set1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 col-span-full"
                  >
                    {/* Property Card 1 */}
                    <Card className="group overflow-hidden transition-all hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_d4c2o2d4c2o2d4c2.png"
                          alt="Villa Mediterránea"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Top Left - Property Type */}
                        <Badge
                          variant="outline"
                          className="absolute left-1.5 md:left-2 top-1.5 md:top-2 z-10 bg-white/80 text-[9px] md:text-[10px] px-1 py-0"
                        >
                          Casa
                        </Badge>
                        {/* Top Right - Status */}
                        <Badge className="absolute right-1.5 md:right-2 top-1.5 md:top-2 z-10 text-[9px] md:text-[10px] px-1 py-0">
                          Venta
                        </Badge>
                        {/* Bottom Center - Reference Number */}
                        <div className="absolute bottom-0.5 md:bottom-1 left-1/2 z-10 -translate-x-1/2">
                          <span className="text-[7px] md:text-[8px] font-semibold tracking-widest text-gray-700/90">
                            REF-001
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-1.5 md:p-2">
                        <div className="mb-0.5 flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[11px] md:text-xs font-semibold">
                              Villa Mediterránea
                            </h3>
                          </div>
                          <p className="text-[11px] md:text-xs font-bold whitespace-nowrap">875k€</p>
                        </div>

                        <div className="mb-0.5 md:mb-1 flex items-center text-muted-foreground">
                          <MapPin className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                          <p className="line-clamp-1 text-[9px] md:text-[10px]">
                            Marbella, Málaga
                          </p>
                        </div>

                        <div className="flex justify-between gap-1 text-[9px] md:text-[10px]">
                          <div className="flex items-center">
                            <Bed className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>4</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>3</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>280m²</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="relative border-t border-border/40 p-1.5 md:p-2 pt-1">
                        <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                          <User className="h-2 w-2 md:h-2.5 md:w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                          <p className="text-[9px] md:text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Top Left - Property Type */}
                        <Badge
                          variant="outline"
                          className="absolute left-1.5 md:left-2 top-1.5 md:top-2 z-10 bg-white/80 text-[9px] md:text-[10px] px-1 py-0"
                        >
                          Piso
                        </Badge>
                        {/* Top Right - Status */}
                        <Badge className="absolute right-1.5 md:right-2 top-1.5 md:top-2 z-10 bg-amber-500 text-[9px] md:text-[10px] px-1 py-0">
                          Reservado
                        </Badge>
                        {/* Bottom Center - Reference Number */}
                        <div className="absolute bottom-0.5 md:bottom-1 left-1/2 z-10 -translate-x-1/2">
                          <span className="text-[7px] md:text-[8px] font-semibold tracking-widest text-gray-700/90">
                            REF-002
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-1.5 md:p-2">
                        <div className="mb-0.5 flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[11px] md:text-xs font-semibold">
                              Ático Duplex
                            </h3>
                          </div>
                          <p className="text-[11px] md:text-xs font-bold whitespace-nowrap">425k€</p>
                        </div>

                        <div className="mb-0.5 md:mb-1 flex items-center text-muted-foreground">
                          <MapPin className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                          <p className="line-clamp-1 text-[9px] md:text-[10px]">
                            Valencia, Valencia
                          </p>
                        </div>

                        <div className="flex justify-between gap-1 text-[9px] md:text-[10px]">
                          <div className="flex items-center">
                            <Bed className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>3</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>2</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>150m²</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="relative border-t border-border/40 p-1.5 md:p-2 pt-1">
                        <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                          <User className="h-2 w-2 md:h-2.5 md:w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                          <p className="text-[9px] md:text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
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
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 col-span-full"
                  >
                    {/* Property Card 3 */}
                    <Card className="group overflow-hidden transition-all hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/Gemini_Generated_Image_4qeqxx4qeqxx4qeq.png"
                          alt="Chalet Moderno"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Top Left - Property Type */}
                        <Badge
                          variant="outline"
                          className="absolute left-1.5 md:left-2 top-1.5 md:top-2 z-10 bg-white/80 text-[9px] md:text-[10px] px-1 py-0"
                        >
                          Casa
                        </Badge>
                        {/* Top Right - Status */}
                        <Badge className="absolute right-1.5 md:right-2 top-1.5 md:top-2 z-10 text-[9px] md:text-[10px] px-1 py-0">
                          Venta
                        </Badge>
                        {/* Bottom Center - Reference Number */}
                        <div className="absolute bottom-0.5 md:bottom-1 left-1/2 z-10 -translate-x-1/2">
                          <span className="text-[7px] md:text-[8px] font-semibold tracking-widest text-gray-700/90">
                            REF-003
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-1.5 md:p-2">
                        <div className="mb-0.5 flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[11px] md:text-xs font-semibold">
                              Chalet Moderno
                            </h3>
                          </div>
                          <p className="text-[11px] md:text-xs font-bold whitespace-nowrap">650k€</p>
                        </div>

                        <div className="mb-0.5 md:mb-1 flex items-center text-muted-foreground">
                          <MapPin className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                          <p className="line-clamp-1 text-[9px] md:text-[10px]">
                            Madrid, Madrid
                          </p>
                        </div>

                        <div className="flex justify-between gap-1 text-[9px] md:text-[10px]">
                          <div className="flex items-center">
                            <Bed className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>5</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>4</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>320m²</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="relative border-t border-border/40 p-1.5 md:p-2 pt-1">
                        <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                          <User className="h-2 w-2 md:h-2.5 md:w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                          <p className="text-[9px] md:text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Top Left - Property Type */}
                        <Badge
                          variant="outline"
                          className="absolute left-1.5 md:left-2 top-1.5 md:top-2 z-10 bg-white/80 text-[9px] md:text-[10px] px-1 py-0"
                        >
                          Piso
                        </Badge>
                        {/* Top Right - Status */}
                        <Badge className="absolute right-1.5 md:right-2 top-1.5 md:top-2 z-10 text-[9px] md:text-[10px] px-1 py-0">
                          Venta
                        </Badge>
                        {/* Bottom Center - Reference Number */}
                        <div className="absolute bottom-0.5 md:bottom-1 left-1/2 z-10 -translate-x-1/2">
                          <span className="text-[7px] md:text-[8px] font-semibold tracking-widest text-gray-700/90">
                            REF-004
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-1.5 md:p-2">
                        <div className="mb-0.5 flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-1 text-[11px] md:text-xs font-semibold">
                              Estudio Centro
                            </h3>
                          </div>
                          <p className="text-[11px] md:text-xs font-bold whitespace-nowrap">180k€</p>
                        </div>

                        <div className="mb-0.5 md:mb-1 flex items-center text-muted-foreground">
                          <MapPin className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                          <p className="line-clamp-1 text-[9px] md:text-[10px]">
                            Barcelona, Barcelona
                          </p>
                        </div>

                        <div className="flex justify-between gap-1 text-[9px] md:text-[10px]">
                          <div className="flex items-center">
                            <Bed className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>1</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>1</span>
                          </div>
                          <div className="flex items-center">
                            <Square className="mr-0.5 h-2 w-2 md:h-2.5 md:w-2.5" />
                            <span>45m²</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="relative border-t border-border/40 p-1.5 md:p-2 pt-1">
                        <div className="agent-info flex cursor-pointer items-center gap-1 transition-all">
                          <User className="h-2 w-2 md:h-2.5 md:w-2.5 text-muted-foreground/80 transition-all group-hover:scale-110 group-hover:text-primary" />
                          <p className="text-[9px] md:text-[10px] font-light text-muted-foreground/80 transition-all group-hover:font-bold group-hover:text-primary group-hover:underline line-clamp-1">
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
  );
}
