"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Mail,
  Building2,
  ChevronRight,
  Eye,
  Users,
  Clock,
  Scale,
  Shield,
  CreditCard,
  Settings,
  Ban,
  Copyright,
  CheckCircle,
  AlertCircle,
  Gavel,
} from "lucide-react";
import Navbar from "~/components/navbar";
import { Footer } from "~/components/landing/Footer";

const sections = [
  {
    id: "objeto",
    icon: FileText,
    title: "1. Objeto y Ámbito de Aplicación",
    content: `
      <p>Los presentes Términos y Condiciones de Servicio (en adelante, "Términos") regulan el acceso y uso de la plataforma Vesta CRM (en adelante, "la Plataforma" o "el Servicio"), un sistema de gestión de relaciones con clientes (CRM) especializado en el sector inmobiliario, operado por Javier Pérez García.</p>

      <p class="mt-3">El uso de la Plataforma implica la aceptación expresa, plena y sin reservas de todos los Términos aquí establecidos, así como de la Política de Privacidad y la Política de Cookies.</p>

      <p class="mt-3 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Importante:</strong> Si no está de acuerdo con estos Términos, le rogamos que no utilice la Plataforma. El acceso y uso continuado del Servicio implica su aceptación incondicional.
      </p>
    `,
  },
  {
    id: "responsable",
    icon: Building2,
    title: "2. Información del Responsable del Servicio",
    content: `
      <p><strong>Denominación:</strong> Vesta CRM</p>
      <p><strong>Titular:</strong> Javier Pérez García</p>
      <p><strong>NIF:</strong> 71465508T</p>
      <p><strong>Domicilio social:</strong> Calle Aviador Zorita 6, 28020, Madrid, España</p>
      <p><strong>Correo electrónico:</strong> javier@vesta-crm.com</p>
      <p><strong>Teléfono:</strong> +34 636 036 116</p>

      <p class="mt-4">Vesta CRM está sujeto a la legislación española y a las normas que regulan la prestación de servicios de la sociedad de la información, incluida la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).</p>
    `,
  },
  {
    id: "aceptacion",
    icon: CheckCircle,
    title: "3. Aceptación de los Términos",
    content: `
      <p class="mb-3">Al registrarse, acceder o utilizar la Plataforma, el usuario declara y garantiza:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Haber leído, entendido y aceptado en su totalidad estos Términos y Condiciones.</li>
        <li>Ser mayor de 18 años y tener capacidad legal para contratar.</li>
        <li>Que toda la información proporcionada es veraz, exacta y actualizada.</li>
        <li>Que actuará de conformidad con la legislación vigente y las buenas prácticas comerciales.</li>
        <li>Que el uso del Servicio se realizará de forma responsable y ética.</li>
      </ul>

      <p class="mt-4">Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en la Plataforma. El uso continuado del Servicio tras la publicación de cambios constituye la aceptación de los mismos.</p>
    `,
  },
  {
    id: "servicio",
    icon: Eye,
    title: "4. Descripción del Servicio",
    content: `
      <p class="mb-3">Vesta CRM es una plataforma SaaS (Software as a Service) que proporciona herramientas de gestión inmobiliaria, incluyendo pero no limitándose a:</p>

      <div class="grid md:grid-cols-2 gap-3 my-4">
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Gestión de Propiedades</h4>
          <p class="text-sm text-gray-700">Catálogo de inmuebles, fichas técnicas, imágenes, documentación y referencias catastrales.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Gestión de Contactos</h4>
          <p class="text-sm text-gray-700">Base de datos de clientes, prospectos y leads con historial de interacciones.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Calendario y Citas</h4>
          <p class="text-sm text-gray-700">Programación de visitas, recordatorios y gestión de la agenda comercial.</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200">
          <h4 class="font-semibold text-gray-900 mb-2">✓ Publicación Multi-Portal</h4>
          <p class="text-sm text-gray-700">Integración con portales inmobiliarios (Fotocasa, Idealista, etc.).</p>
        </div>
      </div>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Nota:</strong> Las funcionalidades disponibles pueden variar según el plan contratado. Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del Servicio en cualquier momento.
      </p>
    `,
  },
  {
    id: "registro",
    icon: Users,
    title: "5. Registro y Acceso de Usuarios",
    content: `
      <p class="mb-3">Para utilizar el Servicio, es necesario completar el proceso de registro:</p>

      <h4 class="font-semibold text-gray-900 mb-2">Requisitos de Registro</h4>
      <ul class="space-y-2 ml-4 list-disc mb-4">
        <li>Proporcionar información veraz, exacta y completa (nombre, email, teléfono, empresa).</li>
        <li>Crear una contraseña segura y mantenerla confidencial.</li>
        <li>No compartir las credenciales de acceso con terceros.</li>
        <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2">Responsabilidad de la Cuenta</h4>
      <p class="mb-3">El usuario es el único responsable de:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Todas las actividades realizadas bajo su cuenta.</li>
        <li>Mantener actualizada la información de su perfil.</li>
        <li>La seguridad y confidencialidad de sus credenciales de acceso.</li>
        <li>Cualquier consecuencia derivada del uso indebido de su cuenta por terceros debido a negligencia en la custodia de sus credenciales.</li>
      </ul>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Advertencia:</strong> Nos reservamos el derecho de rechazar o cancelar cualquier registro sin necesidad de justificación, especialmente en casos de suplantación de identidad, datos falsos o incumplimiento de estos Términos.
      </p>
    `,
  },
  {
    id: "obligaciones",
    icon: Ban,
    title: "6. Obligaciones y Usos Prohibidos",
    content: `
      <p class="mb-3">El usuario se compromete a utilizar la Plataforma de conformidad con la legislación vigente y estos Términos. Queda expresamente prohibido:</p>

      <div class="space-y-3">
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 class="font-semibold text-red-900 mb-2">✗ Usos Ilícitos</h4>
          <ul class="text-sm text-red-800 space-y-1 ml-4 list-disc">
            <li>Realizar actividades fraudulentas, ilegales o que vulneren derechos de terceros.</li>
            <li>Publicar información falsa, engañosa o que induzca a error.</li>
            <li>Vulnerar la legislación sobre protección de datos personales.</li>
          </ul>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 class="font-semibold text-red-900 mb-2">✗ Seguridad y Acceso</h4>
          <ul class="text-sm text-red-800 space-y-1 ml-4 list-disc">
            <li>Intentar acceder a áreas restringidas del sistema o a cuentas de otros usuarios.</li>
            <li>Realizar ingeniería inversa, decompilar o desensamblar el software.</li>
            <li>Introducir virus, malware o cualquier código malicioso.</li>
            <li>Realizar ataques de denegación de servicio o sobrecargar intencionadamente los servidores.</li>
          </ul>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 class="font-semibold text-red-900 mb-2">✗ Uso Comercial No Autorizado</h4>
          <ul class="text-sm text-red-800 space-y-1 ml-4 list-disc">
            <li>Revender, sublicenciar o transferir el acceso al Servicio sin autorización.</li>
            <li>Utilizar el Servicio para crear productos o servicios competidores.</li>
            <li>Realizar web scraping o extracción automatizada de datos sin permiso.</li>
          </ul>
        </div>
      </div>

      <p class="mt-4 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
        <strong>Consecuencias del Incumplimiento:</strong> El incumplimiento de estas obligaciones puede resultar en la suspensión o cancelación inmediata de la cuenta, sin derecho a reembolso, y en la adopción de las medidas legales que correspondan.
      </p>
    `,
  },
  {
    id: "propiedad-intelectual",
    icon: Copyright,
    title: "7. Propiedad Intelectual e Industrial",
    content: `
      <p class="mb-3">Todos los derechos de propiedad intelectual e industrial sobre la Plataforma, su código fuente, diseño, estructura, contenidos y marcas son titularidad exclusiva de Vesta CRM o de sus licenciantes.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Licencia de Uso</h4>
      <p class="mb-3">Vesta CRM concede al usuario una licencia limitada, no exclusiva, intransferible y revocable para:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Acceder y utilizar la Plataforma según el plan contratado.</li>
        <li>Utilizar las funcionalidades del Servicio exclusivamente para su actividad profesional inmobiliaria.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Restricciones</h4>
      <p class="mb-3">El usuario NO podrá:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Copiar, modificar, distribuir o reproducir total o parcialmente la Plataforma.</li>
        <li>Utilizar las marcas, logotipos o nombres comerciales de Vesta CRM sin autorización previa por escrito.</li>
        <li>Eliminar, alterar u ocultar avisos de propiedad intelectual.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Contenido del Usuario</h4>
      <p class="mb-3">El usuario conserva todos los derechos sobre el contenido que suba a la Plataforma (propiedades, imágenes, descripciones, etc.). Al subir contenido, el usuario otorga a Vesta CRM una licencia mundial, no exclusiva, libre de royalties para:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Almacenar, procesar y mostrar dicho contenido dentro de la Plataforma.</li>
        <li>Realizar copias de seguridad y optimizar el contenido para su funcionamiento.</li>
        <li>Publicar el contenido en portales inmobiliarios cuando el usuario utilice la función de publicación multi-portal.</li>
      </ul>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        El usuario garantiza que posee todos los derechos necesarios sobre el contenido que sube y que no infringe derechos de terceros.
      </p>
    `,
  },
  {
    id: "proteccion-datos",
    icon: Shield,
    title: "8. Protección de Datos Personales",
    content: `
      <p class="mb-3">Vesta CRM se compromete a proteger la privacidad y los datos personales de sus usuarios de conformidad con:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Reglamento General de Protección de Datos (RGPD - UE 2016/679)</li>
        <li>Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)</li>
      </ul>

      <p class="mt-4">El tratamiento de datos personales se rige por nuestra <a href="/privacidad" class="text-amber-600 hover:text-amber-700 underline font-semibold">Política de Privacidad</a>, que forma parte integrante de estos Términos.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Responsabilidad del Usuario como Responsable del Tratamiento</h4>
      <p class="mb-3">Cuando el usuario introduce datos de terceros (clientes, propietarios, etc.) en la Plataforma:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>El usuario actúa como <strong>responsable del tratamiento</strong> de dichos datos.</li>
        <li>Vesta CRM actúa como <strong>encargado del tratamiento</strong> por cuenta del usuario.</li>
        <li>El usuario debe contar con la base legal adecuada para tratar esos datos.</li>
        <li>El usuario debe informar a los interesados sobre el tratamiento de sus datos.</li>
        <li>El usuario es responsable de garantizar los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) de los interesados.</li>
      </ul>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Importante:</strong> El usuario exime a Vesta CRM de cualquier responsabilidad derivada del tratamiento ilícito de datos personales de terceros por parte del usuario.
      </p>
    `,
  },
  {
    id: "precios",
    icon: CreditCard,
    title: "9. Precios, Facturación y Formas de Pago",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Planes y Precios</h4>
      <p class="mb-3">Vesta CRM ofrece diferentes planes de suscripción con funcionalidades y límites variables. Los precios vigentes se publican en la Plataforma y pueden incluir:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Suscripciones mensuales o anuales</li>
        <li>Planes gratuitos con funcionalidades limitadas</li>
        <li>Planes de pago con características avanzadas</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Facturación</h4>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Los cargos se realizan por adelantado al inicio de cada período de facturación.</li>
        <li>La renovación es automática salvo cancelación expresa antes del fin del período.</li>
        <li>Se emitirá factura conforme a la normativa fiscal española.</li>
        <li>Los precios indicados incluyen IVA (21%) salvo que se indique lo contrario.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Formas de Pago</h4>
      <p class="mb-3">Se aceptan los siguientes métodos de pago:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express)</li>
        <li>Transferencia bancaria (para suscripciones anuales)</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Modificación de Precios</h4>
      <p class="mb-3">Nos reservamos el derecho de modificar los precios en cualquier momento. Los cambios se notificarán con al menos 30 días de antelación y se aplicarán en la siguiente renovación.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Retrasos en el Pago</h4>
      <p class="mb-3">En caso de impago o rechazo del cargo:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Se suspenderá el acceso al Servicio hasta la regularización del pago.</li>
        <li>Podrán aplicarse intereses de demora según la legislación vigente.</li>
        <li>Tras 15 días de impago, la cuenta podrá ser cancelada definitivamente.</li>
      </ul>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Política de Reembolsos:</strong> No se realizan reembolsos por cancelaciones anticipadas de suscripciones de pago. El servicio permanecerá activo hasta el final del período ya abonado.
      </p>
    `,
  },
  {
    id: "duracion",
    icon: Clock,
    title: "10. Duración y Terminación del Contrato",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Duración</h4>
      <p class="mb-3">El contrato tiene una duración indefinida mientras el usuario mantenga activa su cuenta y cumpla con estos Términos.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Cancelación por parte del Usuario</h4>
      <p class="mb-3">El usuario puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>La cancelación tendrá efecto al finalizar el período de facturación en curso.</li>
        <li>No se realizarán reembolsos por el tiempo restante del período ya abonado.</li>
        <li>El usuario conservará acceso a sus datos durante 30 días tras la cancelación.</li>
        <li>Transcurridos 90 días, los datos podrán ser eliminados definitivamente.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Terminación por parte de Vesta CRM</h4>
      <p class="mb-3">Nos reservamos el derecho de suspender o cancelar el acceso del usuario de forma inmediata y sin previo aviso en los siguientes casos:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Incumplimiento de estos Términos y Condiciones.</li>
        <li>Uso fraudulento o ilegal del Servicio.</li>
        <li>Impago de las cuotas establecidas.</li>
        <li>Conducta que perjudique a Vesta CRM o a otros usuarios.</li>
        <li>Suplantación de identidad o falsedad en los datos proporcionados.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Efectos de la Terminación</h4>
      <ul class="space-y-2 ml-4 list-disc">
        <li>El usuario perderá el acceso inmediato a la Plataforma.</li>
        <li>Se desactivarán todas las integraciones con portales inmobiliarios.</li>
        <li>El usuario podrá solicitar una exportación de sus datos en formato estándar (JSON/CSV) dentro de los 30 días siguientes.</li>
        <li>No se generará derecho a reembolso por pagos ya realizados, salvo disposición legal en contrario.</li>
      </ul>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Advertencia:</strong> Recomendamos realizar copias de seguridad periódicas de sus datos. Vesta CRM no se hace responsable de la pérdida de datos tras la terminación del servicio.
      </p>
    `,
  },
  {
    id: "responsabilidad",
    icon: AlertCircle,
    title: "11. Limitación de Responsabilidad",
    content: `
      <p class="mb-3">El uso de la Plataforma se realiza bajo la exclusiva responsabilidad del usuario. Vesta CRM:</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">No se hace responsable de:</h4>
      <ul class="space-y-2 ml-4 list-disc">
        <li>La veracidad, exactitud o actualización de los contenidos introducidos por los usuarios.</li>
        <li>Los daños derivados del uso indebido de la Plataforma por parte de usuarios o terceros.</li>
        <li>Interrupciones temporales del servicio por mantenimiento, actualizaciones o causas de fuerza mayor.</li>
        <li>Pérdidas de datos causadas por acciones del usuario, ataques informáticos o fallos técnicos imprevisibles.</li>
        <li>Incompatibilidades con sistemas o software de terceros.</li>
        <li>Decisiones comerciales tomadas por el usuario basándose en la información de la Plataforma.</li>
        <li>El contenido o las políticas de portales inmobiliarios de terceros integrados en el Servicio.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Limitación de Daños</h4>
      <p class="mb-3">En ningún caso Vesta CRM será responsable de daños indirectos, consecuenciales, lucro cesante, pérdida de beneficios o daños punitivos, incluso si se ha advertido de la posibilidad de tales daños.</p>

      <p class="mb-3">La responsabilidad máxima de Vesta CRM por cualquier reclamación derivada de estos Términos quedará limitada al importe total pagado por el usuario en los 12 meses anteriores al evento que origina la reclamación.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Fuerza Mayor</h4>
      <p class="mb-3">Vesta CRM queda exonerado de responsabilidad por incumplimientos debidos a circunstancias de fuerza mayor, incluyendo pero no limitándose a:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Desastres naturales, guerras, actos terroristas</li>
        <li>Fallos en infraestructuras de telecomunicaciones ajenas a nuestro control</li>
        <li>Ciberataques o acciones de terceros malintencionados</li>
        <li>Cambios legislativos que imposibiliten la prestación del servicio</li>
      </ul>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Indemnización:</strong> El usuario se compromete a mantener indemne a Vesta CRM frente a cualquier reclamación de terceros derivada del uso ilícito o incumplidor de la Plataforma por parte del usuario.
      </p>
    `,
  },
  {
    id: "garantias",
    icon: Shield,
    title: "12. Garantías y Nivel de Servicio",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Disponibilidad del Servicio</h4>
      <p class="mb-3">Vesta CRM se esforzará en mantener la Plataforma disponible de forma ininterrumpida. No obstante:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>No garantizamos una disponibilidad del 100% debido a mantenimientos programados y causas imprevistas.</li>
        <li>Objetivo de disponibilidad: 99.5% mensual (excluyendo mantenimientos programados).</li>
        <li>Los mantenimientos programados se notificarán con al menos 48 horas de antelación cuando sea posible.</li>
        <li>Se realizarán esfuerzos razonables para programar mantenimientos en horarios de menor impacto.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Seguridad y Copias de Respaldo</h4>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Implementamos medidas de seguridad técnicas y organizativas apropiadas.</li>
        <li>Realizamos copias de seguridad automáticas diarias de los datos.</li>
        <li>Cifrado de datos en tránsito (HTTPS/SSL) y en reposo.</li>
        <li>Control de acceso basado en roles y autenticación robusta.</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Soporte Técnico</h4>
      <p class="mb-3">Ofrecemos soporte técnico a través de:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li><strong>Email:</strong> javier@vesta-crm.com (respuesta en horario laboral, L-V 9:00-18:00 CET)</li>
        <li><strong>Tiempo de respuesta objetivo:</strong> 24-48 horas laborables para consultas generales</li>
        <li>Soporte prioritario disponible para planes premium</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Actualizaciones y Mejoras</h4>
      <p class="mb-3">Vesta CRM podrá:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Introducir nuevas funcionalidades y mejoras sin coste adicional.</li>
        <li>Modificar o eliminar características existentes con notificación previa.</li>
        <li>Actualizar la Plataforma para mantener la seguridad y compatibilidad.</li>
      </ul>

      <p class="mt-4 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
        <strong>Disclaimer:</strong> El Servicio se proporciona "tal cual" y "según disponibilidad". Vesta CRM no garantiza que el Servicio sea ininterrumpido, libre de errores o completamente seguro.
      </p>
    `,
  },
  {
    id: "modificaciones",
    icon: Settings,
    title: "13. Modificaciones del Servicio y de los Términos",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Modificaciones de los Términos</h4>
      <p class="mb-3">Nos reservamos el derecho de modificar estos Términos en cualquier momento por razones que incluyen:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Cambios en la legislación aplicable</li>
        <li>Mejoras en las funcionalidades del Servicio</li>
        <li>Razones de seguridad o técnicas</li>
        <li>Adaptación a nuevos modelos de negocio</li>
      </ul>

      <p class="mt-3 mb-3">Cuando realicemos cambios sustanciales:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Publicaremos los nuevos Términos en la Plataforma con la fecha de "última actualización".</li>
        <li>Notificaremos a los usuarios registrados por correo electrónico con al menos 15 días de antelación.</li>
        <li>Los cambios entrarán en vigor en la fecha indicada en la notificación.</li>
      </ul>

      <p class="mt-3">Si el usuario no está de acuerdo con los nuevos Términos, podrá cancelar su cuenta antes de la fecha de entrada en vigor. El uso continuado del Servicio tras la entrada en vigor de las modificaciones constituye la aceptación expresa de los nuevos Términos.</p>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Modificaciones del Servicio</h4>
      <p class="mb-3">Vesta CRM podrá:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Añadir, modificar o eliminar funcionalidades del Servicio.</li>
        <li>Cambiar la interfaz de usuario y la experiencia de uso.</li>
        <li>Modificar límites técnicos (almacenamiento, número de usuarios, etc.).</li>
        <li>Descontinuar integraciones con servicios de terceros si estos dejan de estar disponibles.</li>
      </ul>

      <p class="mt-4">Las modificaciones sustanciales que afecten negativamente a las funcionalidades principales se notificarán con antelación razonable.</p>
    `,
  },
  {
    id: "legislacion",
    icon: Gavel,
    title: "14. Legislación Aplicable y Jurisdicción",
    content: `
      <h4 class="font-semibold text-gray-900 mb-2">Legislación Aplicable</h4>
      <p class="mb-3">Estos Términos se rigen e interpretan de conformidad con la legislación española, en particular:</p>
      <ul class="space-y-2 ml-4 list-disc">
        <li>Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</li>
        <li>Código Civil Español</li>
        <li>Ley General de Defensa de Consumidores y Usuarios (Real Decreto Legislativo 1/2007)</li>
        <li>Reglamento General de Protección de Datos (RGPD)</li>
        <li>Ley Orgánica 3/2018, de Protección de Datos Personales (LOPDGDD)</li>
      </ul>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Jurisdicción</h4>
      <p class="mb-3">Para la resolución de controversias derivadas de estos Términos:</p>

      <div class="bg-gradient-to-br from-amber-50 to-rose-50 p-4 rounded-lg border border-amber-200 my-3">
        <h4 class="font-semibold text-gray-900 mb-2">Para Usuarios Consumidores</h4>
        <p class="text-sm text-gray-700">
          Si el usuario tiene la condición de consumidor según la normativa vigente, las partes se someten a los juzgados y tribunales del domicilio del consumidor, de conformidad con el artículo 90.3 del Real Decreto Legislativo 1/2007.
        </p>
      </div>

      <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 my-3">
        <h4 class="font-semibold text-gray-900 mb-2">Para Usuarios Profesionales</h4>
        <p class="text-sm text-gray-700">
          Si el usuario actúa en el ejercicio de su actividad profesional, las partes se someten expresamente a los Juzgados y Tribunales de Madrid (España), con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
        </p>
      </div>

      <h4 class="font-semibold text-gray-900 mb-2 mt-4">Resolución Alternativa de Litigios</h4>
      <p class="mb-3">De conformidad con la Ley 7/2017, los consumidores tienen derecho a acudir a sistemas de resolución alternativa de litigios en materia de consumo. Puede acceder a la plataforma europea de resolución de litigios en línea en:</p>
      <p class="mb-3">
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" class="text-amber-600 underline hover:text-amber-700">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>

      <p class="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
        Antes de iniciar cualquier procedimiento judicial o de mediación, le invitamos a contactarnos para intentar resolver amistosamente cualquier controversia.
      </p>
    `,
  },
  {
    id: "contacto",
    icon: Mail,
    title: "15. Contacto y Atención al Usuario",
    content: `
      <p class="mb-3">Para cualquier consulta, sugerencia o reclamación relacionada con estos Términos o con el Servicio, puede contactarnos a través de los siguientes medios:</p>

      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mt-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p class="font-semibold text-gray-900">Correo electrónico</p>
              <a href="mailto:javier@vesta-crm.com" class="text-amber-600 hover:text-amber-700">javier@vesta-crm.com</a>
              <p class="text-xs text-gray-500 mt-1">Respuesta en 24-48h laborables</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <p class="font-semibold text-gray-900">Teléfono</p>
              <a href="tel:+34636036116" class="text-amber-600 hover:text-amber-700">+34 636 036 116</a>
              <p class="text-xs text-gray-500 mt-1">L-V: 9:00-18:00 (CET)</p>
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

      <h4 class="font-semibold text-gray-900 mb-2 mt-6">Hojas de Reclamaciones</h4>
      <p class="mb-3">De conformidad con la normativa de defensa de consumidores, los usuarios que tengan la condición de consumidor tienen a su disposición hojas de reclamaciones. Para solicitar una hoja de reclamaciones, puede contactarnos en javier@vesta-crm.com.</p>

      <p class="mt-4"><strong>Fecha de última actualización de estos Términos:</strong> Enero 2025</p>

      <p class="mt-4 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
        <strong>Agradecimiento:</strong> Gracias por confiar en Vesta CRM para la gestión de su negocio inmobiliario. Estamos comprometidos en ofrecerle el mejor servicio posible.
      </p>
    `,
  },
];

export default function CondicionesServicioPage() {
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
                <Scale className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Condiciones de Servicio
            </h1>
            <p className="text-xl text-gray-600">
              Términos y condiciones que regulan el uso de la plataforma Vesta
              CRM. Le recomendamos leer detenidamente este documento.
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
            ¿Tiene alguna pregunta sobre estos términos?
          </h2>
          <p className="mb-8 text-xl text-white/90">
            Nuestro equipo está disponible para resolver cualquier duda que
            pueda tener
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
