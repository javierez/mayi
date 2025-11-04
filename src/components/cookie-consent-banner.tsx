"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getCookie, setCookie } from "~/lib/cookie-utils";

type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always true, can't be disabled
    analytics: true, // Default to true
    marketing: true, // Default to true
    timestamp: 0,
  });

  useEffect(() => {
    // Check if user has already given consent (try cookie first, fallback to localStorage for migration)
    const cookieConsent = getCookie("vesta-cookie-consent");
    const localStorageConsent = localStorage.getItem("vesta-cookie-consent");

    if (cookieConsent) {
      try {
        const parsed = JSON.parse(cookieConsent) as CookieConsent;
        setConsent(parsed);
        applyConsent(parsed);
      } catch (error) {
        console.error("Error parsing cookie consent:", error);
        setTimeout(() => setShowBanner(true), 1000);
      }
    } else if (localStorageConsent) {
      // One-time migration from localStorage to cookie
      try {
        const parsed = JSON.parse(localStorageConsent) as CookieConsent;
        setConsent(parsed);
        applyConsent(parsed);
        // Migrate to cookie
        setCookie("vesta-cookie-consent", localStorageConsent, 365);
        // Remove localStorage after successful migration
        localStorage.removeItem("vesta-cookie-consent");
        console.log("✅ Migrated cookie consent from localStorage to cookie");
      } catch (error) {
        console.error("Error migrating consent:", error);
        setTimeout(() => setShowBanner(true), 1000);
      }
    } else {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const applyConsent = (consentData: CookieConsent) => {
    // Here you would enable/disable analytics based on consent
    if (typeof window !== "undefined") {
      // For Vercel Analytics
      if (consentData.analytics) {
        // Analytics will load automatically if consent is given
        window.localStorage.setItem("vesta-analytics-enabled", "true");
      } else {
        window.localStorage.setItem("vesta-analytics-enabled", "false");
      }

      // For marketing cookies (future use)
      if (consentData.marketing) {
        window.localStorage.setItem("vesta-marketing-enabled", "true");
      } else {
        window.localStorage.setItem("vesta-marketing-enabled", "false");
      }
    }
  };

  const saveConsent = (consentData: CookieConsent) => {
    const consentWithTimestamp = {
      ...consentData,
      timestamp: Date.now(),
    };
    const consentString = JSON.stringify(consentWithTimestamp);

    // Store in cookie (accessible server-side and client-side)
    setCookie("vesta-cookie-consent", consentString, 365, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    setConsent(consentWithTimestamp);
    applyConsent(consentWithTimestamp);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const rejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const savePreferences = () => {
    saveConsent(consent);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-rose-50 opacity-50" />

              <div className="relative p-6 sm:p-8">
                {!showSettings ? (
                  // Simple banner view
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 p-3">
                        <Cookie className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          Este sitio utiliza cookies
                        </h3>
                        <p className="text-sm text-gray-600">
                          Utilizamos cookies propias y de terceros para mejorar
                          su experiencia de navegación y analizar el tráfico del
                          sitio. Puede aceptar todas las cookies, rechazarlas o
                          personalizar sus preferencias.{" "}
                          <Link
                            href="/cookies"
                            className="text-amber-600 underline hover:text-amber-700"
                          >
                            Más información
                          </Link>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        className="gap-2 border-gray-300 bg-white hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Configurar
                      </Button>
                      <Button
                        onClick={rejectAll}
                        variant="outline"
                        className="border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Rechazar todo
                      </Button>
                      <Button
                        onClick={acceptAll}
                        className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                      >
                        Aceptar todo
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Settings view
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 p-3">
                          <Cookie className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Configuración de Cookies
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowSettings(false)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Necessary Cookies */}
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">
                                Cookies Necesarias
                              </h4>
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Siempre activas
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Estas cookies son esenciales para el
                              funcionamiento del sitio web y no pueden ser
                              desactivadas. Incluyen cookies de autenticación y
                              seguridad.
                            </p>
                          </div>
                          <div className="ml-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Analytics Cookies */}
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1 font-semibold text-gray-900">
                              Cookies Analíticas
                            </h4>
                            <p className="text-sm text-gray-600">
                              Estas cookies nos ayudan a entender cómo los
                              visitantes interactúan con el sitio web,
                              recopilando información de forma anónima (Vercel
                              Analytics).
                            </p>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() =>
                                setConsent({
                                  ...consent,
                                  analytics: !consent.analytics,
                                })
                              }
                              className={`relative h-6 w-11 rounded-full transition-colors ${
                                consent.analytics
                                  ? "bg-gradient-to-r from-amber-400 to-rose-400"
                                  : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                                  consent.analytics ? "translate-x-5" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Marketing Cookies */}
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="mb-1 font-semibold text-gray-900">
                              Cookies de Marketing
                            </h4>
                            <p className="text-sm text-gray-600">
                              Estas cookies se utilizan para mostrar anuncios
                              relevantes. Actualmente no utilizamos cookies de
                              marketing.
                            </p>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() =>
                                setConsent({
                                  ...consent,
                                  marketing: !consent.marketing,
                                })
                              }
                              className={`relative h-6 w-11 rounded-full transition-colors ${
                                consent.marketing
                                  ? "bg-gradient-to-r from-amber-400 to-rose-400"
                                  : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                                  consent.marketing ? "translate-x-5" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button
                        onClick={rejectAll}
                        variant="outline"
                        className="border-gray-300 bg-white hover:bg-gray-50"
                      >
                        Rechazar todo
                      </Button>
                      <Button
                        onClick={savePreferences}
                        className="bg-gradient-to-r from-amber-400 to-rose-400 text-white hover:from-amber-500 hover:to-rose-500"
                      >
                        Guardar preferencias
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
