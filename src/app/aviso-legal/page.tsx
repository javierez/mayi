"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Mail,
  Building2,
  ChevronRight,
  Scale,
  Shield,
  AlertCircle,
  Copyright,
  Info,
  Gavel,
  Lock,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

const sections = [
  {
    id: "identificacion",
    icon: Building2,
    title: "1. Identificación del Titular",
    content: `
      <p class="mb-3">En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa a los usuarios de los siguientes datos identificativos del titular del sitio web:</p>

      <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-6 rounded-lg border border-amber-200 my-4">
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Denominación</p>
              <p class="text-gray-700">Vesta CRM</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Titular</p>
              <p class="text-gray-700">Javier Pérez García</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">NIF</p>
              <p class="text-gray-700">71465508T</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Domicilio Social</p>
              <p class="text-gray-700">Calle Aviador Zorita 6, 28020, Madrid, España</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Correo electrónico de contacto</p>
              <p class="text-gray-700">
                <a href="mailto:javier@vesta-crm.com" class="text-amber-600 hover:text-amber-700 underline">
                  javier@vesta-crm.com
                </a>
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Teléfono</p>
              <p class="text-gray-700">
                <a href="tel:+34636036116" class="text-amber-600 hover:text-amber-700 underline">
                  +34 636 036 116
                </a>
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Globe className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Sitio Web</p>
              <p class="text-gray-700">https://www.vesta-crm.com</p>
            </div>
          </div>
        </div>
      </div>

      <p class="text-sm text-gray-600 mt-4">
        Vesta CRM es un servicio prestado por un profesional autónomo establecido en España, dedicado al desarrollo y comercialización de software de gestión para el sector inmobiliario.
      </p>
    `,
  },
  {
    id: "objeto",
    icon: FileText,
    title: "2. Objeto y Condiciones de Uso",
    content: `
      <p class="mb-3">El presente Aviso Legal regula el acceso y la utilización del sitio web <strong>www.vesta-crm.com</strong> (en adelante, "el Sitio Web"), que el titular pone gratuitamente a disposición de los usuarios de Internet.</p>

      <p class="mb-3">El acceso y/o uso del Sitio Web atribuye la condición de usuario (en adelante, "el Usuario") e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en este Aviso Legal, así como de las <a href="/privacidad" class="text-amber-600 hover:text-amber-700 underline">Política de Privacidad</a>, <a href="/cookies" class="text-amber-600 hover:text-amber-700 underline">Política de Cookies</a> y <a href="/condiciones-servicio" class="text-amber-600 hover:text-amber-700 underline">Condiciones de Servicio</a> que, en su caso, se publiquen en el Sitio Web.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Finalidad del Sitio Web</h4>
      <p class="mb-3">El Sitio Web tiene por objeto:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Informar sobre las características y funcionalidades de la plataforma Vesta CRM</li>
        <li>Permitir el registro y contratación de los servicios ofrecidos</li>
        <li>Proporcionar acceso a la aplicación web (SaaS) a usuarios registrados</li>
        <li>Facilitar la comunicación entre los usuarios y el titular</li>
        <li>Ofrecer contenido informativo sobre gestión inmobiliaria</li>
      </ul>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Nota importante:</strong> El titular se reserva el derecho a modificar, en cualquier momento y sin previo aviso, la presentación, configuración y contenidos del Sitio Web, así como las condiciones requeridas para su acceso y/o uso.
      </p>
    `,
  },
  {
    id: "normativa",
    icon: Gavel,
    title: "3. Normativa Aplicable",
    content: `
      <p class="mb-3">El presente Aviso Legal se rige por la normativa española vigente, en particular:</p>

      <div class="space-y-3">
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Ley 34/2002, de 11 de julio</h4>
          <p class="text-sm text-gray-700">De Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</p>
        </div>

        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Reglamento (UE) 2016/679</h4>
          <p class="text-sm text-gray-700">Reglamento General de Protección de Datos (RGPD)</p>
        </div>

        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Ley Orgánica 3/2018, de 5 de diciembre</h4>
          <p class="text-sm text-gray-700">De Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)</p>
        </div>

        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Real Decreto Legislativo 1/2007, de 16 de noviembre</h4>
          <p class="text-sm text-gray-700">Ley General para la Defensa de los Consumidores y Usuarios</p>
        </div>

        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">Real Decreto Legislativo 1/1996, de 12 de abril</h4>
          <p class="text-sm text-gray-700">Texto Refundido de la Ley de Propiedad Intelectual</p>
        </div>
      </div>
    `,
  },
  {
    id: "propiedad-intelectual",
    icon: Copyright,
    title: "4. Propiedad Intelectual e Industrial",
    content: `
      <p class="mb-3">Todos los contenidos del Sitio Web (incluyendo, sin carácter limitativo, bases de datos, imágenes, dibujos, gráficos, archivos de texto, audio, vídeo y software) son propiedad del titular o de terceros que han autorizado debidamente su inclusión, y están protegidos por la normativa nacional e internacional en materia de Propiedad Intelectual e Industrial.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Derechos de Autor</h4>
      <p class="mb-3">El código fuente, diseño gráfico, estructura de navegación, bases de datos y los distintos elementos en ella contenidos son titularidad del prestador del servicio, a quien corresponde el ejercicio exclusivo de los derechos de explotación de los mismos en cualquier forma y, en especial, los derechos de reproducción, distribución, comunicación pública y transformación.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Marcas y Signos Distintivos</h4>
      <p class="mb-3">Las marcas, nombres comerciales o signos distintivos que aparecen en el Sitio Web son propiedad del titular o de terceros que han autorizado debidamente su uso, sin que pueda entenderse que el acceso al Sitio Web atribuye al Usuario derecho alguno sobre dichas marcas, nombres comerciales y/o signos distintivos.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Prohibiciones</h4>
      <p class="mb-3">Queda prohibida la reproducción, distribución, comunicación pública (incluida su modalidad de puesta a disposición) y transformación, total o parcial, de los contenidos del Sitio Web sin la autorización previa, expresa y por escrito del titular.</p>

      <p class="mt-4 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
        <strong>Advertencia:</strong> El Usuario se compromete a respetar los derechos de Propiedad Intelectual e Industrial del titular. El incumplimiento de estas prohibiciones podrá dar lugar a las acciones legales correspondientes.
      </p>
    `,
  },
  {
    id: "uso-contenidos",
    icon: Shield,
    title: "5. Condiciones de Uso y Obligaciones del Usuario",
    content: `
      <p class="mb-3">El Usuario se compromete a utilizar el Sitio Web, sus contenidos y servicios de conformidad con la Ley, el presente Aviso Legal, y las buenas costumbres generalmente aceptadas y el orden público.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">El Usuario se obliga a:</h4>
      <ul class="space-y-2 ml-4 list-disc mb-4">
        <li>Hacer un uso adecuado y lícito del Sitio Web</li>
        <li>No utilizar el Sitio Web con fines o efectos ilícitos, contrarios a lo establecido en este Aviso Legal, lesivos de los derechos e intereses de terceros, o que de cualquier forma puedan dañar, inutilizar, sobrecargar o deteriorar el Sitio Web</li>
        <li>Proporcionar información veraz al registrarse como usuario</li>
        <li>No introducir, almacenar o difundir mediante el Sitio Web, cualquier contenido que sea ilícito, nocivo, contrario a los derechos fundamentales y libertades públicas</li>
        <li>No realizar acciones que puedan producir en el Sitio Web o a través del mismo, por cualquier medio, cualquier tipo de daño a los sistemas del titular o de terceros</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Queda expresamente prohibido:</h4>
      <div class="space-y-2">
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul class="text-sm text-red-800 space-y-1 ml-4 list-disc">
            <li>Realizar actividades publicitarias, promocionales o de envío de spam</li>
            <li>Suplantar la identidad de otro usuario o utilizar su cuenta sin autorización</li>
            <li>Manipular identificadores para simular el origen de los mensajes o comunicaciones</li>
            <li>Acceder a cuentas de correo electrónico de otros usuarios</li>
            <li>Reproducir, copiar, distribuir, poner a disposición o de cualquier otra forma comunicar públicamente, transformar o modificar los contenidos</li>
            <li>Introducir programas, virus, macros, applets, controles ActiveX o cualquier otro dispositivo lógico o secuencia de caracteres que causen o sean susceptibles de causar cualquier tipo de alteración</li>
            <li>Obtener, o intentar obtener, los contenidos empleando medios o procedimientos distintos de los que se hayan puesto a su disposición</li>
          </ul>
        </div>
      </div>
    `,
  },
  {
    id: "responsabilidad",
    icon: AlertCircle,
    title: "6. Limitación de Responsabilidad",
    content: `
      <p class="mb-3">El titular no se hace responsable, en ningún caso, de los siguientes extremos:</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Disponibilidad y Continuidad</h4>
      <p class="mb-3">El titular no garantiza la disponibilidad y continuidad del funcionamiento del Sitio Web ni de los servicios. Cuando ello sea razonablemente posible, el titular advertirá previamente las interrupciones en el funcionamiento del Sitio Web.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Contenidos</h4>
      <p class="mb-3">El titular excluye, con las excepciones contempladas en la legislación vigente, cualquier responsabilidad por los daños y perjuicios de toda naturaleza derivados de:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>La imposibilidad de acceso al Sitio Web o la falta de veracidad, exactitud, exhaustividad y/o actualidad de los contenidos</li>
        <li>Los servicios prestados o la información facilitada por terceros a través del Sitio Web</li>
        <li>La existencia de virus, programas maliciosos o lesivos en los contenidos</li>
        <li>El uso ilícito, negligente, fraudulento o contrario al presente Aviso Legal</li>
        <li>La falta de licitud, calidad, fiabilidad, utilidad y disponibilidad de los servicios prestados por terceros y puestos a disposición de los usuarios en el Sitio Web</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Enlaces</h4>
      <p class="mb-3">En el caso de que en el Sitio Web se dispusiesen enlaces o hipervínculos hacia otros sitios de Internet, el titular no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso el titular asumirá responsabilidad alguna por los contenidos de algún enlace perteneciente a un sitio web ajeno.</p>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Importante:</strong> El titular se reserva el derecho a efectuar, sin previo aviso, las modificaciones que considere oportunas en el Sitio Web, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados o localizados.
      </p>
    `,
  },
  {
    id: "proteccion-datos",
    icon: Lock,
    title: "7. Protección de Datos Personales",
    content: `
      <p class="mb-3">El titular garantiza la protección y confidencialidad de los datos personales que los usuarios faciliten de acuerdo con lo dispuesto en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos (RGPD) y en la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).</p>

      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 my-4">
        <h4 class="font-semibold text-gray-900 mb-3">Información sobre Protección de Datos</h4>
        <div class="space-y-2">
          <div>
            <p class="text-sm font-semibold text-gray-900">Responsable del Tratamiento:</p>
            <p class="text-sm text-gray-700">Javier Pérez García - NIF: 71465508T</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Dirección:</p>
            <p class="text-sm text-gray-700">Calle Aviador Zorita 6, 28020, Madrid, España</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-900">Correo electrónico:</p>
            <p class="text-sm text-gray-700">
              <a href="mailto:javier@vesta-crm.com" class="text-blue-600 hover:text-blue-700 underline">
                javier@vesta-crm.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <p class="mb-3">Para más información sobre cómo tratamos sus datos personales, consulte nuestra <a href="/privacidad" class="text-amber-600 hover:text-amber-700 underline font-semibold">Política de Privacidad</a>.</p>

      <p class="mb-3">Para más información sobre el uso de cookies, consulte nuestra <a href="/cookies" class="text-amber-600 hover:text-amber-700 underline font-semibold">Política de Cookies</a>.</p>
    `,
  },
  {
    id: "legislacion",
    icon: Scale,
    title: "8. Legislación Aplicable y Jurisdicción",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Legislación Aplicable</h4>
      <p class="mb-3">El presente Aviso Legal se rige en todos y cada uno de sus extremos por la legislación española.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Jurisdicción</h4>
      <p class="mb-3">Para la resolución de cualquier controversia o conflicto que pueda surgir en relación con el acceso o utilización del Sitio Web:</p>

      <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200 my-3">
        <h4 class="font-semibold text-gray-900 mb-2">Para Usuarios Consumidores</h4>
        <p class="text-sm text-gray-700">
          Si el Usuario tiene la condición de consumidor según la normativa de consumidores y usuarios vigente, las partes acuerdan someterse, a su elección, a los juzgados y tribunales del domicilio del consumidor.
        </p>
      </div>

      <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 my-3">
        <h4 class="font-semibold text-gray-900 mb-2">Para Usuarios Profesionales</h4>
        <p class="text-sm text-gray-700">
          Si el Usuario no tiene la condición de consumidor, las partes se someten, con renuncia expresa a cualquier otro fuero, a los juzgados y tribunales de Madrid (España).
        </p>
      </div>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Resolución Alternativa de Conflictos</h4>
      <p class="mb-3">Sin perjuicio de lo anterior, en caso de que el Usuario sea un consumidor, tiene derecho a acudir a una entidad de resolución alternativa de litigios de consumo. Puede acceder a la plataforma europea de resolución de litigios en línea a través del siguiente enlace:</p>
      <p class="mb-3">
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 underline">
          https://ec.europa.eu/consumers/odr
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    `,
  },
  {
    id: "comunicaciones",
    icon: Mail,
    title: "9. Comunicaciones Electrónicas",
    content: `
      <p class="mb-3">De conformidad con la LSSI-CE, el titular pone a disposición de los usuarios los siguientes medios de comunicación electrónica:</p>

      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-4">
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Correo electrónico</p>
              <a href="mailto:javier@vesta-crm.com" class="text-amber-600 hover:text-amber-700 underline">javier@vesta-crm.com</a>
              <p class="text-sm text-gray-600 mt-1">Para consultas generales, soporte técnico y ejercicio de derechos</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <p class="font-semibold text-gray-900">Teléfono</p>
              <a href="tel:+34636036116" class="text-amber-600 hover:text-amber-700 underline">+34 636 036 116</a>
              <p class="text-sm text-gray-600 mt-1">Horario de atención: Lunes a Viernes, 9:00 - 18:00 (CET)</p>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-4">El titular se compromete a contestar las comunicaciones recibidas a través de estos medios en el menor plazo posible, y en todo caso dentro de los plazos legalmente establecidos según la naturaleza de la consulta.</p>
    `,
  },
  {
    id: "modificaciones",
    icon: Info,
    title: "10. Modificaciones",
    content: `
      <p class="mb-3">El titular se reserva el derecho a modificar el presente Aviso Legal en cualquier momento, siendo publicadas las sucesivas versiones en el Sitio Web.</p>

      <p class="mb-3">Los cambios sustanciales en el Aviso Legal se notificarán a los usuarios registrados por medios electrónicos cuando ello sea posible.</p>

      <p class="mb-3">Le recomendamos revisar periódicamente este Aviso Legal para estar informado de cualquier modificación.</p>

      <p class="mt-4"><strong>Fecha de última actualización:</strong> Enero 2025</p>

      <p class="mt-4"><strong>Versión:</strong> 1.0</p>
    `,
  },
  {
    id: "contacto",
    icon: Mail,
    title: "11. Información de Contacto",
    content: `
      <p class="mb-3">Para cualquier consulta, sugerencia o reclamación relacionada con este Aviso Legal o con el Sitio Web, puede contactar con nosotros a través de los siguientes medios:</p>

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

      <h4 class="font-semibold text-gray-900 mb-2 mt-6">Enlaces a Otros Documentos Legales</h4>
      <div class="grid md:grid-cols-2 gap-3">
        <a href="/privacidad" class="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
          <Shield className="h-5 w-5 text-amber-600" />
          <span class="font-medium text-gray-900">Política de Privacidad</span>
        </a>
        <a href="/cookies" class="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
          <FileText className="h-5 w-5 text-amber-600" />
          <span class="font-medium text-gray-900">Política de Cookies</span>
        </a>
        <a href="/condiciones-servicio" class="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow md:col-span-2">
          <Scale className="h-5 w-5 text-amber-600" />
          <span class="font-medium text-gray-900">Condiciones de Servicio</span>
        </a>
      </div>
    `,
  },
];

export default function AvisoLegalPage() {
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
                <FileText className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Aviso Legal
            </h1>
            <p className="text-xl text-gray-600">
              Información legal sobre el titular del sitio web, condiciones de
              uso y normativa aplicable en cumplimiento de la LSSI-CE.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Info className="h-4 w-4" />
              <span>Última actualización: Enero 2025 · Versión 1.0</span>
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
            ¿Necesita más información?
          </h2>
          <p className="mb-8 text-xl text-white/90">
            Estamos a su disposición para resolver cualquier duda sobre este
            Aviso Legal
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
