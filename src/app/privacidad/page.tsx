"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Mail,
  Building2,
  ChevronRight,
  Lock,
  Eye,
  FileText,
  Users,
  Clock,
  Database,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

const sections = [
  {
    id: "responsable",
    icon: Building2,
    title: "1. Responsable del Tratamiento",
    content: `
      <p><strong>Identidad:</strong> Vesta CRM - Operated by Javier Pérez García</p>
      <p><strong>NIF:</strong> 71465508T</p>
      <p><strong>Dirección:</strong> Calle Aviador Zorita 6, 28020, Madrid, España</p>
      <p><strong>Correo electrónico:</strong> javier@vesta-crm.com</p>
      <p><strong>Teléfono:</strong> +34 636 036 116</p>
      <p class="mt-4">Vesta CRM es el responsable del tratamiento de los datos personales que nos proporcione. Nos comprometemos a proteger su privacidad y a cumplir con la normativa vigente en materia de protección de datos.</p>
    `,
  },
  {
    id: "finalidad",
    icon: Eye,
    title: "2. Finalidad y Base Legal del Tratamiento",
    content: `
      <p class="mb-3">Sus datos personales serán tratados con las siguientes finalidades:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Gestión de consultas y solicitudes:</strong> Para atender sus peticiones de información sobre nuestros servicios (base legal: consentimiento).</li>
        <li><strong>Prestación de servicios:</strong> Para la gestión y prestación de los servicios contratados del CRM inmobiliario (base legal: ejecución de contrato).</li>
        <li><strong>Comunicaciones comerciales:</strong> Para enviarle información sobre nuestros productos, servicios y novedades, siempre que haya prestado su consentimiento (base legal: consentimiento).</li>
        <li><strong>Cumplimiento legal:</strong> Para cumplir con las obligaciones legales aplicables al sector inmobiliario (base legal: obligación legal).</li>
        <li><strong>Mejora de servicios:</strong> Para analizar el uso de nuestra plataforma y mejorar nuestros servicios (base legal: interés legítimo).</li>
      </ul>
    `,
  },
  {
    id: "datos",
    icon: Database,
    title: "3. Categorías de Datos Personales",
    content: `
      <p class="mb-3">Podemos recopilar y tratar las siguientes categorías de datos personales:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Datos de identificación:</strong> Nombre, apellidos, DNI/NIE, fecha de nacimiento.</li>
        <li><strong>Datos de contacto:</strong> Dirección postal, correo electrónico, teléfono.</li>
        <li><strong>Datos económicos y financieros:</strong> Datos bancarios para la gestión de pagos (solo cuando contrate servicios).</li>
        <li><strong>Datos profesionales:</strong> Información sobre su actividad inmobiliaria, agencia, número de colegiado.</li>
        <li><strong>Datos de navegación:</strong> Información técnica sobre el uso de la plataforma (cookies, IP, dispositivo).</li>
      </ul>
      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Importante:</strong> No solicitamos ni tratamos categorías especiales de datos (datos sensibles como origen racial, religión, salud, etc.) salvo que sea estrictamente necesario y con su consentimiento explícito.
      </p>
    `,
  },
  {
    id: "destinatarios",
    icon: Users,
    title: "4. Destinatarios y Transferencias de Datos",
    content: `
      <p class="mb-3">Sus datos personales podrán ser comunicados a los siguientes destinatarios:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Proveedores de servicios tecnológicos:</strong> Para el alojamiento y mantenimiento de nuestra plataforma (servidores en la nube, servicios de email, etc.).</li>
        <li><strong>Procesadores de pago:</strong> Para gestionar los pagos de los servicios contratados.</li>
        <li><strong>Portales inmobiliarios:</strong> Cuando utilice nuestra función de publicación multi-portal (Fotocasa, Idealista, Habitaclia, etc.).</li>
        <li><strong>Administraciones públicas:</strong> Cuando exista una obligación legal.</li>
        <li><strong>Asesores profesionales:</strong> Abogados, auditores y consultores que nos presten servicios profesionales sujetos a confidencialidad.</li>
      </ul>
      <p class="mt-4"><strong>Transferencias internacionales:</strong> Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo. En estos casos, garantizamos que existen garantías adecuadas para la protección de sus datos mediante cláusulas contractuales tipo aprobadas por la Comisión Europea u otros mecanismos legalmente reconocidos.</p>
    `,
  },
  {
    id: "conservacion",
    icon: Clock,
    title: "5. Plazo de Conservación",
    content: `
      <p class="mb-3">Conservaremos sus datos personales durante los siguientes plazos:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Usuarios registrados:</strong> Mientras mantenga activa su cuenta en la plataforma y durante un plazo adicional de hasta 5 años para cumplir con obligaciones legales.</li>
        <li><strong>Consultas y solicitudes:</strong> Durante 1 año desde la última comunicación, salvo que solicite su supresión antes.</li>
        <li><strong>Datos de facturación:</strong> Durante el plazo legalmente establecido (mínimo 6 años según la normativa fiscal).</li>
        <li><strong>Consentimiento para comunicaciones comerciales:</strong> Hasta que retire su consentimiento.</li>
      </ul>
      <p class="mt-4">Transcurridos estos plazos, procederemos a la supresión segura de sus datos personales, salvo que exista una obligación legal de conservación.</p>
    `,
  },
  {
    id: "derechos",
    icon: Shield,
    title: "6. Derechos de los Interesados",
    content: `
      <p class="mb-3">De acuerdo con el RGPD y la LOPDGDD, usted tiene derecho a:</p>
      <div class="grid md:grid-cols-2 gap-3 my-4">
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Acceso</h4>
          <p class="text-sm text-gray-700">Conocer qué datos personales estamos tratando sobre usted.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Rectificación</h4>
          <p class="text-sm text-gray-700">Corregir datos inexactos o incompletos.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Supresión</h4>
          <p class="text-sm text-gray-700">Solicitar la eliminación de sus datos cuando ya no sean necesarios.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Oposición</h4>
          <p class="text-sm text-gray-700">Oponerse al tratamiento de sus datos.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Limitación</h4>
          <p class="text-sm text-gray-700">Limitar el tratamiento de sus datos en determinadas circunstancias.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Derecho de Portabilidad</h4>
          <p class="text-sm text-gray-700">Recibir sus datos en un formato estructurado y de uso común.</p>
        </div>
      </div>
      <p class="mt-4"><strong>¿Cómo ejercer sus derechos?</strong></p>
      <p class="mt-2">Puede ejercer sus derechos enviando un correo electrónico a <a href="mailto:javier@vesta-crm.com" class="text-amber-600 hover:text-amber-700 underline">javier@vesta-crm.com</a> o mediante comunicación escrita a nuestra dirección postal, adjuntando copia de su DNI o documento equivalente.</p>
      <p class="mt-3">Resolveremos su solicitud en el plazo de un mes desde la recepción, pudiendo ampliarse dos meses más en caso de solicitudes complejas.</p>
      <p class="mt-3 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Derecho a reclamar:</strong> Si considera que no hemos atendido correctamente sus derechos, puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) - www.aepd.es
      </p>
    `,
  },
  {
    id: "seguridad",
    icon: Lock,
    title: "7. Medidas de Seguridad",
    content: `
      <p class="mb-3">En Vesta CRM implementamos medidas técnicas y organizativas apropiadas para garantizar la seguridad de sus datos personales:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Cifrado:</strong> Utilizamos protocolos HTTPS/SSL para todas las comunicaciones y cifrado de datos sensibles en reposo.</li>
        <li><strong>Control de acceso:</strong> Sistema de autenticación robusta y control de accesos basado en roles.</li>
        <li><strong>Copias de seguridad:</strong> Realizamos copias de seguridad periódicas para prevenir pérdidas de datos.</li>
        <li><strong>Monitorización:</strong> Supervisión continua de la seguridad de nuestros sistemas.</li>
        <li><strong>Formación:</strong> Nuestro personal está formado en protección de datos y firmeza de confidencialidad.</li>
        <li><strong>Auditorías:</strong> Realizamos auditorías periódicas de seguridad y protección de datos.</li>
      </ul>
      <p class="mt-4">A pesar de estas medidas, ningún sistema es completamente seguro. Le recomendamos que mantenga la confidencialidad de sus credenciales de acceso.</p>
    `,
  },
  {
    id: "cookies",
    icon: FileText,
    title: "8. Política de Cookies",
    content: `
      <p class="mb-3">Nuestra web utiliza cookies para mejorar la experiencia del usuario y analizar el tráfico. Las cookies son pequeños archivos de texto que se almacenan en su dispositivo.</p>
      <p class="mb-3"><strong>Tipos de cookies que utilizamos:</strong></p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Cookies técnicas (necesarias):</strong> Imprescindibles para el funcionamiento de la web (autenticación, seguridad).</li>
        <li><strong>Cookies de preferencias:</strong> Almacenan sus preferencias de uso (idioma, configuración).</li>
        <li><strong>Cookies analíticas:</strong> Nos permiten analizar el uso de la web para mejorar nuestros servicios (Google Analytics).</li>
        <li><strong>Cookies de marketing:</strong> Para mostrarle publicidad relevante (solo con su consentimiento).</li>
      </ul>
      <p class="mt-4">Puede configurar su navegador para rechazar las cookies o ser informado cuando se envíe una. Sin embargo, esto puede afectar al funcionamiento de la plataforma.</p>
      <p class="mt-3">Para más información, consulte nuestra <Link href="#cookies" class="text-amber-600 hover:text-amber-700 underline">Política de Cookies completa</Link>.</p>
    `,
  },
  {
    id: "actualizaciones",
    icon: FileText,
    title: "9. Actualizaciones de la Política",
    content: `
      <p>Nos reservamos el derecho a modificar esta Política de Privacidad para adaptarla a cambios legislativos, jurisprudenciales o en nuestras prácticas empresariales.</p>
      <p class="mt-3">Cualquier modificación será publicada en esta página con antelación suficiente a su aplicación. Le recomendamos revisar periódicamente esta política.</p>
      <p class="mt-3"><strong>Fecha de última actualización:</strong> Enero 2025</p>
    `,
  },
  {
    id: "contacto",
    icon: Mail,
    title: "10. Contacto",
    content: `
      <p class="mb-3">Para cualquier cuestión relacionada con el tratamiento de sus datos personales o esta Política de Privacidad, puede contactarnos a través de:</p>
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p class="font-semibold text-gray-900">Correo electrónico</p>
              <a href="mailto:javier@vesta-crm.com" class="text-amber-600 hover:text-amber-700">javier@vesta-crm.com</a>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p class="font-semibold text-gray-900">Teléfono</p>
              <a href="tel:+34636036116" class="text-amber-600 hover:text-amber-700">+34 636 036 116</a>
            </div>
          </div>
          <div class="flex items-start gap-3 md:col-span-2">
            <Building2 className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p class="font-semibold text-gray-900">Dirección postal</p>
              <p class="text-gray-600">Calle Aviador Zorita 6, 28020, Madrid, España</p>
            </div>
          </div>
        </div>
      </div>
    `,
  },
];

export default function PrivacidadPage() {
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
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Política de Privacidad
            </h1>
            <p className="text-xl text-gray-600">
              En Vesta CRM, la protección de sus datos personales es nuestra
              prioridad. Le informamos de manera transparente sobre cómo
              tratamos su información.
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
            ¿Tiene alguna pregunta sobre privacidad?
          </h2>
          <p className="mb-8 text-xl text-white/90">
            Nuestro equipo está aquí para ayudarle con cualquier duda sobre el
            tratamiento de sus datos
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="mailto:javier@vesta-crm.com"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-gray-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <Mail className="h-5 w-5" />
              Contactar
            </a>
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
