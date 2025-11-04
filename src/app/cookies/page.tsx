"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Cookie,
  Shield,
  Settings,
  Eye,
  Clock,
  Database,
  Info,
  ChevronRight,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

const sections = [
  {
    id: "que-son",
    icon: Info,
    title: "1. ¿Qué son las Cookies?",
    content: `
      <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil) cuando visita un sitio web. Permiten al sitio web recordar sus acciones y preferencias (como el inicio de sesión, idioma, tamaño de fuente y otras preferencias de visualización) durante un período de tiempo, para que no tenga que volver a configurarlas cada vez que regrese al sitio o navegue de una página a otra.</p>

      <p class="mt-3">Las cookies son utilizadas ampliamente por los propietarios de sitios web para hacer que sus sitios funcionen de manera más eficiente, así como para proporcionar información de informes.</p>
    `,
  },
  {
    id: "tipos",
    icon: Database,
    title: "2. Tipos de Cookies que Utilizamos",
    content: `
      <p class="mb-4">Vesta CRM utiliza diferentes tipos de cookies con distintas finalidades:</p>

      <div class="space-y-4">
        <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
          <h4 class="mb-2 font-semibold text-gray-900 flex items-center gap-2">
            <span class="rounded-full bg-green-600 text-white text-xs px-2 py-0.5">Necesarias</span>
            Cookies Técnicas y Estrictamente Necesarias
          </h4>
          <p class="text-sm text-gray-700 mb-3">
            Son imprescindibles para la navegación y el buen funcionamiento de nuestra web. Permiten la autenticación, seguridad y funcionalidades básicas.
          </p>
          <div class="bg-white rounded p-3 text-xs">
            <p class="font-semibold mb-1">Ejemplos:</p>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>better-auth.session_token:</strong> Cookie de autenticación de usuario (Duración: Sesión)</li>
              <li><strong>vesta-cookie-consent:</strong> Almacena sus preferencias de cookies (Duración: 1 año)</li>
            </ul>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <h4 class="mb-2 font-semibold text-gray-900 flex items-center gap-2">
            <span class="rounded-full bg-blue-600 text-white text-xs px-2 py-0.5">Analíticas</span>
            Cookies Analíticas y de Rendimiento
          </h4>
          <p class="text-sm text-gray-700 mb-3">
            Nos permiten analizar cómo los usuarios utilizan nuestro sitio web y monitorear el rendimiento. Toda la información recopilada es anónima y se utiliza para mejorar el funcionamiento del sitio.
          </p>
          <div class="bg-white rounded p-3 text-xs">
            <p class="font-semibold mb-1">Proveedores:</p>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Vercel Analytics:</strong> Análisis de tráfico web y rendimiento (Cookies de primera parte)</li>
              <li><strong>Vercel Speed Insights:</strong> Medición de velocidad y rendimiento del sitio (Cookies de primera parte)</li>
            </ul>
            <p class="mt-2 text-gray-600">
              <strong>Duración:</strong> Hasta 1 año<br/>
              <strong>Finalidad:</strong> Medir visitantes, páginas vistas, tiempo de permanencia, rendimiento
            </p>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
          <h4 class="mb-2 font-semibold text-gray-900 flex items-center gap-2">
            <span class="rounded-full bg-purple-600 text-white text-xs px-2 py-0.5">Marketing</span>
            Cookies de Publicidad y Marketing
          </h4>
          <p class="text-sm text-gray-700 mb-3">
            Actualmente <strong>no utilizamos cookies de marketing o publicidad</strong>. Si en el futuro implementáramos este tipo de cookies, le solicitaríamos su consentimiento explícito.
          </p>
        </div>
      </div>
    `,
  },
  {
    id: "clasificacion",
    icon: Database,
    title: "3. Clasificación de las Cookies",
    content: `
      <p class="mb-3">Las cookies también pueden clasificarse según diferentes criterios:</p>

      <div class="grid md:grid-cols-2 gap-4 my-4">
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">Según su Titularidad</h4>
          <ul class="text-sm text-gray-700 space-y-1">
            <li><strong>• Cookies propias:</strong> Enviadas desde nuestros servidores</li>
            <li><strong>• Cookies de terceros:</strong> Enviadas desde servidores de terceros (ej: Vercel)</li>
          </ul>
        </div>

        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">Según su Duración</h4>
          <ul class="text-sm text-gray-700 space-y-1">
            <li><strong>• Cookies de sesión:</strong> Se eliminan al cerrar el navegador</li>
            <li><strong>• Cookies persistentes:</strong> Permanecen durante un tiempo determinado</li>
          </ul>
        </div>
      </div>
    `,
  },
  {
    id: "finalidad",
    icon: Eye,
    title: "4. Finalidad de las Cookies",
    content: `
      <p class="mb-3">Utilizamos cookies para los siguientes propósitos:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Autenticación y seguridad:</strong> Para mantener su sesión activa y proteger su cuenta.</li>
        <li><strong>Preferencias del usuario:</strong> Para recordar sus configuraciones y preferencias de privacidad.</li>
        <li><strong>Análisis y estadísticas:</strong> Para entender cómo los usuarios interactúan con nuestro sitio y mejorar la experiencia.</li>
        <li><strong>Rendimiento:</strong> Para monitorear la velocidad de carga y optimizar el rendimiento del sitio.</li>
        <li><strong>Funcionalidad:</strong> Para proporcionar características y funcionalidades mejoradas.</li>
      </ul>
    `,
  },
  {
    id: "base-legal",
    icon: Shield,
    title: "5. Base Legal para el Uso de Cookies",
    content: `
      <p class="mb-3">El uso de cookies se basa en las siguientes bases legales:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Cookies necesarias:</strong> Interés legítimo y necesidad técnica para el funcionamiento del sitio web.</li>
        <li><strong>Cookies analíticas:</strong> Su consentimiento explícito mediante el banner de cookies.</li>
        <li><strong>Cookies de marketing:</strong> Su consentimiento explícito (actualmente no aplicable).</li>
      </ul>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Importante:</strong> Según el Reglamento General de Protección de Datos (RGPD) y la Ley de Servicios de la Sociedad de la Información (LSSI), solo instalamos cookies analíticas y de marketing tras obtener su consentimiento explícito.
      </p>
    `,
  },
  {
    id: "gestion",
    icon: Settings,
    title: "6. Cómo Gestionar y Eliminar las Cookies",
    content: `
      <p class="mb-4">Usted tiene el derecho de decidir si acepta o rechaza las cookies. Puede ejercer sus preferencias de cookies de las siguientes maneras:</p>

      <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-5 rounded-lg border border-amber-200 mb-4">
        <h4 class="font-semibold text-gray-900 mb-3">Configuración de Cookies en Vesta CRM</h4>
        <p class="text-sm text-gray-700 mb-3">
          Puede cambiar sus preferencias de cookies en cualquier momento haciendo clic en el siguiente enlace:
        </p>
        <button
          onclick="localStorage.removeItem('vesta-cookie-consent'); document.cookie = 'vesta-cookie-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; window.location.reload();"
          class="px-6 py-3 bg-gradient-to-r from-amber-400 to-rose-400 text-white font-medium rounded-lg hover:from-amber-500 hover:to-rose-500 transition-all hover:scale-105 shadow-lg"
        >
          <Settings class="inline h-5 w-5 mr-2" />
          Configurar Cookies
        </button>
      </div>

      <h4 class="font-semibold text-gray-900 mb-3 mt-6">Configuración del Navegador</h4>
      <p class="mb-3 text-sm">
        También puede configurar su navegador para aceptar o rechazar cookies. A continuación le indicamos cómo hacerlo en los navegadores más comunes:
      </p>

      <div class="bg-white rounded-lg p-4 border border-gray-200 text-sm">
        <ul class="space-y-2">
          <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios</li>
          <li><strong>Mozilla Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
          <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web</li>
          <li><strong>Microsoft Edge:</strong> Configuración → Cookies y permisos del sitio → Cookies y datos del sitio</li>
        </ul>
      </div>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Nota:</strong> Si rechaza o elimina las cookies, algunas funcionalidades del sitio web pueden no funcionar correctamente.
      </p>
    `,
  },
  {
    id: "duracion",
    icon: Clock,
    title: "7. Período de Conservación",
    content: `
      <p class="mb-3">Las cookies se conservan durante los siguientes períodos:</p>
      <div class="bg-white rounded-lg overflow-hidden border border-gray-200">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Tipo de Cookie</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Duración</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr>
              <td class="px-4 py-3 text-gray-700">Cookies de sesión</td>
              <td class="px-4 py-3 text-gray-600">Hasta cerrar el navegador</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-700">Cookie de consentimiento</td>
              <td class="px-4 py-3 text-gray-600">1 año</td>
            </tr>
            <tr>
              <td class="px-4 py-3 text-gray-700">Cookies analíticas (Vercel)</td>
              <td class="px-4 py-3 text-gray-600">Hasta 1 año</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  },
  {
    id: "terceros",
    icon: Database,
    title: "8. Cookies de Terceros",
    content: `
      <p class="mb-3">Vesta CRM utiliza servicios de terceros que pueden instalar cookies en su dispositivo:</p>

      <div class="space-y-4">
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Vercel Analytics & Speed Insights</h4>
          <p class="text-sm text-gray-700 mb-2">
            <strong>Finalidad:</strong> Análisis de tráfico web y medición de rendimiento
          </p>
          <p class="text-sm text-gray-700 mb-2">
            <strong>Tipo de datos:</strong> Información anónima sobre páginas visitadas, tiempo de permanencia, ubicación aproximada, dispositivo
          </p>
          <p class="text-sm text-gray-700 mb-2">
            <strong>Política de privacidad:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" class="text-amber-600 underline hover:text-amber-700">https://vercel.com/legal/privacy-policy</a>
          </p>
          <p class="text-sm text-gray-700">
            <strong>Consentimiento:</strong> Requiere su consentimiento previo
          </p>
        </div>
      </div>

      <p class="mt-4 text-sm">
        Estos terceros pueden utilizar cookies para recopilar información sobre su actividad en línea a lo largo del tiempo y en diferentes sitios web. Le recomendamos revisar sus políticas de privacidad.
      </p>
    `,
  },
  {
    id: "derechos",
    icon: Shield,
    title: "9. Sus Derechos",
    content: `
      <p class="mb-3">En relación con el uso de cookies, usted tiene los siguientes derechos:</p>

      <div class="grid md:grid-cols-2 gap-3 my-4">
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho a la Información</h4>
          <p class="text-sm text-gray-700">Recibir información clara sobre las cookies que utilizamos.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho al Consentimiento</h4>
          <p class="text-sm text-gray-700">Dar o retirar su consentimiento en cualquier momento.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho a Configurar</h4>
          <p class="text-sm text-gray-700">Personalizar qué tipos de cookies acepta o rechaza.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho a Eliminar</h4>
          <p class="text-sm text-gray-700">Borrar las cookies almacenadas en su dispositivo.</p>
        </div>
      </div>

      <p class="mt-4">
        Para ejercer sus derechos o para cualquier consulta sobre cookies, puede contactarnos en:
        <a href="mailto:javier@vesta-crm.com" class="text-amber-600 underline hover:text-amber-700">javier@vesta-crm.com</a>
      </p>
    `,
  },
  {
    id: "actualizaciones",
    icon: Info,
    title: "10. Actualizaciones de la Política de Cookies",
    content: `
      <p>Podemos actualizar esta Política de Cookies para reflejar cambios en las cookies que utilizamos o por otras razones operativas, legales o regulatorias. Le recomendamos que revise esta política periódicamente.</p>

      <p class="mt-3">Cuando realicemos cambios significativos, se lo notificaremos mediante un aviso destacado en nuestro sitio web.</p>

      <p class="mt-3"><strong>Fecha de última actualización:</strong> Enero 2025</p>
    `,
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-white to-rose-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-gradient-to-r from-amber-400 to-rose-400 p-4">
                <Cookie className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Política de Cookies
            </h1>
            <p className="text-xl text-gray-600">
              Información transparente sobre cómo utilizamos cookies en Vesta
              CRM y cómo puede gestionar sus preferencias.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Última actualización: Enero 2025</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="border-b border-gray-200 bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Índice de Contenidos
          </h2>
          <nav className="grid gap-2 sm:grid-cols-2">
            {sections.map((section, index) => (
              <motion.a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gradient-to-r hover:from-amber-50 hover:to-rose-50 hover:shadow-md"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <section.icon className="h-4 w-4 text-amber-600" />
                <span className="flex-1">{section.title}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </motion.a>
            ))}
          </nav>
        </div>
      </section>

      {/* Content Sections */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              className="scroll-mt-24 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 p-3">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="flex-1 text-2xl font-bold text-gray-900">
                  {section.title}
                </h2>
              </div>
              <div
                className="prose prose-gray max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            ¿Quiere gestionar sus preferencias de cookies?
          </h2>
          <p className="mb-8 text-xl text-white/90">
            Puede cambiar su configuración en cualquier momento
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  // Remove both cookie and localStorage for complete reset
                  localStorage.removeItem("vesta-cookie-consent");
                  // Delete cookie by setting expiration to past
                  document.cookie = "vesta-cookie-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  window.location.reload();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-gray-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <Settings className="h-5 w-5" />
              Configurar Cookies
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-4 font-medium text-white shadow-lg transition-all hover:bg-white hover:text-gray-900"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
