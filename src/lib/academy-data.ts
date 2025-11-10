import {
  AlertCircle,
  BookOpen,
  Bug,
  Settings,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export interface AcademyArticle {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  category: "Tutorial" | "FAQ" | "Guía" | "Troubleshooting";
  icon: LucideIcon;
  tags: string[];
  lastUpdated: Date;
  readTimeMinutes: number;
}

// Academy articles data
export const academyArticles: AcademyArticle[] = [
  {
    id: "how-to-report-errors",
    title: "¿Cómo reportar errores?",
    shortDescription:
      "Guía completa para reportar errores y problemas en Vesta",
    content: `# ¿Cómo reportar errores?

Si encuentras algún error o problema mientras usas Vesta, queremos saberlo para poder solucionarlo lo antes posible. Aquí te explicamos cómo reportar errores de manera efectiva.

## Pasos para reportar un error

### 1. Identifica el problema
Antes de reportar, asegúrate de que realmente es un error y no una funcionalidad esperada. Verifica:
- ¿El problema se repite consistentemente?
- ¿Has seguido los pasos correctos?
- ¿Tu conexión a internet funciona correctamente?

### 2. Recopila información relevante
Para ayudarnos a resolver el problema más rápido, incluye:

**Información básica:**
- ¿Qué estabas intentando hacer?
- ¿Qué esperabas que ocurriera?
- ¿Qué ocurrió en su lugar?

**Detalles técnicos:**
- Navegador y versión (ej: Chrome 120, Safari 17)
- Sistema operativo (Windows, macOS, iOS, Android)
- Fecha y hora aproximada del error
- Captura de pantalla o video del error

### 3. Métodos de reporte

#### Opción A: Centro de Soporte
1. Ve a [Centro de Soporte](/recursos/soporte)
2. Completa el formulario de contacto
3. Selecciona la categoría "Error Técnico"
4. Describe el problema con el máximo detalle posible
5. Adjunta capturas de pantalla si es posible

#### Opción B: Email directo
Envía un email a: **soporte@vesta.es**

Asunto sugerido: "Error: [Descripción breve del problema]"

Ejemplo:
\`\`\`
Asunto: Error: No puedo publicar propiedad en Fotocasa

Descripción:
Cuando intento publicar una propiedad en Fotocasa desde el módulo
de propiedades, aparece un mensaje de error "Error de conexión"
y la publicación no se completa.

Pasos que seguí:
1. Abrí la propiedad ID #12345
2. Hice clic en "Publicar en portales"
3. Seleccioné Fotocasa
4. Hice clic en "Publicar"
5. Apareció el error

Navegador: Chrome 120
Sistema: macOS 14.2
Fecha: 8 de Noviembre, 2025 - 15:30h
\`\`\`

#### Opción C: Chat en vivo
Durante horario de atención (Lun-Vie 9:00-18:00):
1. Haz clic en el botón de chat en la esquina inferior derecha
2. Explica el problema a nuestro equipo
3. Comparte capturas de pantalla si te lo solicitan

### 4. Qué NO hacer

❌ **No incluyas información sensible:**
- Contraseñas
- Tokens de API
- Información bancaria
- Datos personales de clientes

❌ **No uses lenguaje ofensivo** - Entendemos que los errores son frustrantes, pero un reporte respetuoso nos ayuda a asistirte mejor.

❌ **No reportes el mismo error múltiples veces** - Si ya lo reportaste, espera nuestra respuesta. Puedes hacer seguimiento por el mismo canal.

## Tiempo de respuesta

- **Errores críticos** (no puedes usar la plataforma): 2-4 horas
- **Errores importantes** (funcionalidad afectada): 1 día laborable
- **Errores menores** (inconvenientes pequeños): 2-3 días laborables

## Seguimiento

Una vez reportado el error:
1. Recibirás un número de ticket por email
2. Te mantendremos informado del progreso
3. Te notificaremos cuando esté resuelto
4. Podrás verificar que el problema se ha solucionado

## Errores conocidos

Antes de reportar, revisa nuestra [página de Novedades](/changelog) donde publicamos actualizaciones y correcciones recientes.

## ¿Necesitas ayuda urgente?

Si el error te impide trabajar y es urgente:
- Llama a nuestro soporte telefónico: **+34 900 123 456**
- Menciona que es una emergencia
- Horario: Lun-Vie 9:00-18:00 CET

---

**Gracias por ayudarnos a mejorar Vesta.** Tu feedback es fundamental para ofrecer la mejor experiencia posible.`,
    category: "FAQ",
    icon: Bug,
    tags: ["errores", "soporte", "reportar", "ayuda", "bugs"],
    lastUpdated: new Date(2025, 10, 8),
    readTimeMinutes: 5,
  },
  {
    id: "getting-started",
    title: "Primeros pasos con Vesta",
    shortDescription: "Todo lo que necesitas saber para empezar con Vesta",
    content: `# Primeros pasos con Vesta

Bienvenido a Vesta, tu plataforma completa de gestión inmobiliaria. Esta guía te ayudará a configurar tu cuenta y empezar a gestionar propiedades en minutos.

## 1. Crear tu cuenta

1. Visita [vesta.es/auth/signup](/auth/signup)
2. Completa el formulario de registro
3. Verifica tu email
4. Completa tu perfil profesional

## 2. Configuración inicial

### Datos de tu inmobiliaria
- Nombre comercial
- Datos fiscales (CIF/NIF)
- Dirección
- Teléfono de contacto
- Logo (recomendado 300x100px)

### Integraciones con portales
Conecta tus cuentas de:
- Fotocasa Pro
- Idealista
- Otros portales inmobiliarios

## 3. Tu primera propiedad

1. Ve a **Propiedades** > **Nueva Propiedad**
2. Completa la información básica:
   - Dirección y ubicación
   - Tipo de operación (venta/alquiler)
   - Precio
   - Características principales
3. Sube fotos (máximo 50 por propiedad)
4. Añade descripción (o genera una con IA)
5. Guarda y publica

## 4. Gestionar contactos

1. Ve a **Contactos** > **Nuevo Contacto**
2. Añade información del cliente
3. Registra sus preferencias de búsqueda
4. Programa seguimientos

## 5. Calendario de citas

1. Ve a **Calendario**
2. Crea una nueva cita
3. Asocia propiedad y contacto
4. Configura recordatorios

## Siguientes pasos

- Explora las integraciones con portales
- Personaliza tu marca y watermarks
- Invita a tu equipo
- Configura notificaciones

¿Necesitas ayuda? Visita nuestro [Centro de Soporte](/recursos/soporte).`,
    category: "Tutorial",
    icon: BookOpen,
    tags: ["inicio", "tutorial", "configuración", "primeros pasos"],
    lastUpdated: new Date(2025, 10, 1),
    readTimeMinutes: 7,
  },
  {
    id: "publish-to-portals",
    title: "¿Cómo publicar en portales inmobiliarios?",
    shortDescription:
      "Guía paso a paso para publicar propiedades en Fotocasa, Idealista y más",
    content: `# ¿Cómo publicar en portales inmobiliarios?

Vesta te permite publicar tus propiedades en múltiples portales inmobiliarios con un solo clic.

## Portales disponibles

- ✅ Fotocasa
- ✅ Idealista
- 🔄 Más portales próximamente

## Configuración de credenciales

### Fotocasa Pro
1. Ve a **Configuración** > **Integraciones**
2. Selecciona **Fotocasa**
3. Introduce tus credenciales de Fotocasa Pro
4. Haz clic en **Conectar**
5. Verifica la conexión

### Idealista
1. Ve a **Configuración** > **Integraciones**
2. Selecciona **Idealista**
3. Introduce tu API Key
4. Haz clic en **Conectar**

## Publicar una propiedad

1. Abre la propiedad que deseas publicar
2. Haz clic en **Publicar en portales**
3. Selecciona los portales destino
4. Revisa los datos de la propiedad
5. Haz clic en **Publicar**

## Sincronización automática

Las propiedades se sincronizan automáticamente:
- Cambios de precio: inmediatos
- Nuevas fotos: 15 minutos
- Modificaciones de descripción: 15 minutos
- Cambios de estado: inmediatos

## Despublicar

Para retirar una propiedad de un portal:
1. Abre la propiedad
2. Ve a **Portales activos**
3. Haz clic en **Despublicar** junto al portal deseado

## Solución de problemas

**Problema:** "Error al publicar en Fotocasa"
- Verifica tus credenciales
- Asegúrate de que todos los campos obligatorios estén completos
- Comprueba que las fotos cumplan los requisitos (mínimo 3, máximo 50)

**Problema:** "La propiedad no aparece en el portal"
- Espera 30-60 minutos (tiempo de procesamiento del portal)
- Verifica el estado en la sección de sincronización
- Contacta con soporte si persiste después de 2 horas

¿Más preguntas? Visita [Centro de Soporte](/recursos/soporte).`,
    category: "Guía",
    icon: Settings,
    tags: ["portales", "publicar", "fotocasa", "idealista", "integración"],
    lastUpdated: new Date(2025, 10, 4),
    readTimeMinutes: 6,
  },
  {
    id: "common-errors",
    title: "Errores comunes y soluciones",
    shortDescription:
      "Soluciones rápidas para los problemas más frecuentes en Vesta",
    content: `# Errores comunes y soluciones

Esta guía te ayudará a resolver los errores más comunes que puedes encontrar en Vesta.

## 🔐 Errores de autenticación

### "No se puede iniciar sesión"
**Causa:** Credenciales incorrectas o sesión expirada

**Solución:**
1. Verifica que tu email y contraseña sean correctos
2. Intenta restablecer tu contraseña
3. Limpia las cookies del navegador
4. Intenta con un navegador diferente

### "Sesión expirada"
**Causa:** Por seguridad, las sesiones expiran después de cierto tiempo

**Solución:**
1. Cierra sesión completamente
2. Vuelve a iniciar sesión
3. Marca "Mantener sesión iniciada" si es tu dispositivo personal

## 📸 Errores con imágenes

### "No se pueden subir imágenes"
**Causa:** Tamaño o formato de archivo no compatible

**Solución:**
1. Verifica que la imagen sea JPG, PNG o WebP
2. Máximo 10MB por imagen
3. Intenta reducir la resolución si es muy grande
4. Comprueba tu conexión a internet

### "Las imágenes no aparecen"
**Causa:** Problema de carga o caché del navegador

**Solución:**
1. Actualiza la página (F5)
2. Limpia la caché del navegador
3. Espera 2-3 minutos (pueden estar procesándose)

## 🌐 Errores de publicación en portales

### "Error de conexión con Fotocasa"
**Causa:** Credenciales incorrectas o API no disponible

**Solución:**
1. Ve a Configuración > Integraciones
2. Desconecta y vuelve a conectar Fotocasa
3. Verifica tus credenciales de Fotocasa Pro
4. Contacta con soporte si persiste

### "Propiedad rechazada por el portal"
**Causa:** Datos incompletos o que no cumplen los requisitos del portal

**Solución:**
1. Revisa los campos obligatorios (precio, ubicación, tipo)
2. Añade al menos 3 fotos
3. Completa la descripción (mínimo 50 caracteres)
4. Verifica que la referencia catastral sea válida

## 💾 Errores de guardado

### "No se guardan los cambios"
**Causa:** Problema de conexión o sesión expirada

**Solución:**
1. Verifica tu conexión a internet
2. Recarga la página e intenta de nuevo
3. Si persiste, copia tus cambios y contacta con soporte

## 🔧 Problemas de rendimiento

### "La plataforma va lenta"
**Causa:** Conexión lenta, caché lleno o demasiadas pestañas abiertas

**Solución:**
1. Cierra pestañas innecesarias
2. Limpia la caché del navegador
3. Actualiza tu navegador a la última versión
4. Verifica tu conexión a internet

## 📱 Errores en móvil

### "La página no se ve bien en móvil"
**Causa:** Navegador no compatible o versión antigua

**Solución:**
1. Actualiza tu navegador móvil
2. Usa Chrome, Safari o Firefox actualizados
3. Desactiva el modo de bajo consumo de datos

## ¿No encuentras tu error aquí?

Si tu problema no está listado:
1. Visita nuestro [Centro de Soporte](/recursos/soporte)
2. Consulta la guía [¿Cómo reportar errores?](/academia?article=how-to-report-errors)
3. Contacta con nuestro equipo de soporte

**Línea directa de soporte:**
- Email: soporte@vesta.es
- Teléfono: +34 900 123 456
- Chat en vivo: Lun-Vie 9:00-18:00 CET`,
    category: "Troubleshooting",
    icon: AlertCircle,
    tags: ["errores", "soluciones", "troubleshooting", "problemas"],
    lastUpdated: new Date(2025, 10, 8),
    readTimeMinutes: 8,
  },
  {
    id: "visit-workflow-guide",
    title: "Guía completa del sistema de registro de visitas",
    shortDescription:
      "Aprende a crear y compartir documentos profesionales de cada visita con tus clientes",
    content: `# Guía completa del sistema de registro de visitas

El sistema de registro de visitas te permite crear documentos profesionales de cada visita que realizas, con firmas de ambas partes y la posibilidad de compartirlos al instante con tus clientes.

## ¿Qué es el sistema de registro de visitas?

Es una herramienta que te ayuda a documentar cada visita de forma profesional. Puedes mostrar al cliente una hoja de visita antes de la visita, y después de realizarla, ambos firmáis digitalmente y el cliente recibe un documento oficial con todos los detalles. El documento incluye un sello de autenticidad que garantiza que nadie puede modificarlo después de firmado.

## Beneficios principales

✅ **Profesionalidad**: Impresiona a tus clientes con documentos oficiales con tu marca
✅ **Transparencia**: El cliente recibe una copia firmada de todo lo acordado
✅ **Ahorra tiempo**: Dicta tus notas con la voz en lugar de escribir
✅ **Comparte al instante**: Envía el documento por email, SMS o WhatsApp
✅ **Registro oficial**: Fecha y hora exactas con sello que impide modificaciones
✅ **Protección legal**: Documento firmado por ambas partes con consentimiento RGPD

## ¿Cuándo puedo usar esto?

Para poder registrar una visita, primero necesitas haber programado una cita de tipo "Visita" en el calendario con el cliente. Una vez tengas la cita programada, el botón "Registrar Visita" aparecerá automáticamente.

## El proceso completo: Antes, Durante y Después

### ANTES de la visita: Mostrar la hoja previa al cliente

Puedes generar una hoja de visita previa para que el cliente sepa qué va a pasar:

1. Ve a la propiedad y busca el contacto con "Visita Pendiente"
2. Haz clic en "Registrar Visita"
3. Haz clic en el botón "Vista Previa" o "PDF"
4. Comparte esta hoja con el cliente antes de la visita

**¿Para qué sirve?** El cliente ve qué información se va a registrar y se siente más cómodo firmando después.

### DURANTE la visita: Cómo acceder

1. Abre la ficha de la propiedad
2. Ve a la sección de contactos
3. Busca el contacto que tiene el badge "Visita Pendiente"
4. Haz clic en el contacto y luego en el botón "Registrar Visita"

### Paso 1: Información automática

El formulario ya trae rellenados los datos del cliente y la visita:
- Nombre, DNI y teléfono del cliente
- Fecha y hora de la visita
- Dirección de la propiedad
- Nombre del agente (tú)

**No necesitas escribir nada de esto**, está todo listo.

### Paso 2: Añade tus notas

Aquí es donde documentas lo importante de la visita:

**Forma rápida (recomendada): Usa tu voz**
1. Mantén presionado el botón del micrófono 🎤
2. Habla con normalidad
3. El texto aparece automáticamente
4. Suelta cuando termines

**Forma tradicional: Escribe**
- Haz clic en el cuadro de notas
- Escribe lo que quieras registrar

**¿Qué anotar?**
- Lo que le gustó o no le gustó al cliente
- Preguntas que hizo
- Si comparó con otras propiedades
- Su nivel de interés
- Si hay que hacer algún seguimiento

### Paso 3: ¿Hizo el cliente una oferta?

Si el cliente te hizo una oferta durante la visita:
- Escribe el importe en euros
- El sistema lo registrará y aparecerá en el documento

Si no hizo oferta, déjalo en blanco. Puedes añadirla después si la hace.

### Paso 4: Firmar el documento

**Importante:** Sin las dos firmas no puedes guardar el documento.

**Tu firma:**
1. Dibuja tu firma en el primer recuadro (con el dedo o ratón)
2. Si no te gusta, usa "Limpiar" y vuelve a firmar

**Firma del cliente:**
1. Pasa el móvil o tablet al cliente
2. Que firme en el segundo recuadro
3. Si necesita repetir, botón "Limpiar"

**Consejo:** Las tabletas o móviles funcionan mejor que el ratón del ordenador.

### Paso 5: Consentimiento RGPD

Pregunta al cliente si quiere recibir información de nuevas propiedades:
- **Sí** - Podrás enviarle novedades
- **No** - Solo comunicaciones de esta operación

Esto queda registrado en el documento por protección legal.

### Paso 6: Guardar y compartir

Cuando todo esté listo, haz clic en **"Registrar Visita"**.

El sistema genera automáticamente un PDF con:
- ✅ Todos los datos de la visita
- ✅ Tus notas
- ✅ La oferta (si la hubo)
- ✅ Las firmas de ambos
- ✅ Tu logo y marca
- ✅ Fecha y hora exactas
- ✅ Un sello que impide modificaciones

Inmediatamente se abre una ventana para que elijas cómo enviar el documento al cliente:

**Email** - Se abre tu correo con un mensaje listo para enviar

**SMS** - Se abre mensajes con el texto preparado

**WhatsApp** - Se abre WhatsApp con el mensaje

**Copiar** - Copia el texto para enviarlo por donde quieras

### DESPUÉS de la visita: Ver documentos guardados

Puedes ver todas las visitas que has registrado en varios sitios:

**Desde el calendario:**
- Las visitas completadas aparecen en el calendario
- Haz clic en la cita para ver los detalles y el documento

**Desde la propiedad:**
- En la ficha de la propiedad verás cuántas visitas has hecho
- En la sección de contactos, verás el estado de cada uno

**Desde el contacto:**
- Al abrir un contacto, verás si tiene "Visita Completada" o "Oferta Pendiente"

## ¿Qué contiene el documento generado?

El PDF que se crea automáticamente incluye:

**📋 Cabecera con tu marca**
- Tu logo
- Servicios que ofreces
- Web, CIF y datos de contacto
- Ubicaciones de tus oficinas

**📍 Información de la visita**
- Datos del cliente (nombre, DNI, teléfono)
- Oferta realizada (si la hay)
- Agente que hizo la visita
- Fecha y hora exactas
- Dirección de la propiedad

**📝 Tus notas**
- Todo lo que anotaste durante la visita
- Formateado de manera profesional

**✍️ Las firmas**
- Tu firma
- Firma del cliente
- Con la fecha y hora exactas de cuándo se firmó
- Una vez firmado, nadie puede modificar el documento

**🔒 Protección legal**
- Consentimiento RGPD del cliente
- Sello de autenticidad que garantiza que el documento no ha sido alterado
- Fecha y hora certificadas

## ¿Por qué el documento no se puede modificar?

El sistema incluye un **sello de autenticidad** (técnicamente se llama "hash") que funciona como una huella digital única del documento. Si alguien intentara cambiar aunque sea una coma del documento, el sello cambiaría y quedaría claro que fue modificado.

**¿Para qué sirve esto?**
- Protección legal para ti y para el cliente
- Prueba de lo que se acordó en la visita
- Imposible que alguien diga "esto no lo firmé yo"
- Fecha y hora certificadas que no se pueden falsificar

## Consejos para sacarle el máximo partido

### Antes de la visita
✅ **Muestra la hoja previa al cliente** - Le da confianza y profesionalidad
✅ **Explícale que vais a firmar después** - No le pillará por sorpresa

### Durante y después de la visita
✅ **Registra todo nada más terminar** - No confíes en tu memoria
✅ **Usa tu voz para las notas** - Es mucho más rápido que escribir
✅ **Sé específico** - "Le gustó mucho la terraza" es mejor que "Le gustó"
✅ **Anota tanto lo bueno como lo malo** - Te ayudará después

### Al firmar
✅ **Usa tablet o móvil** - Funciona mucho mejor que el ratón
✅ **Explica al cliente dónde firmar** - Muéstrale el recuadro
✅ **Déjale tiempo** - No le apresures, es un documento oficial
✅ **Comparte el documento al momento** - El cliente lo valora muchísimo

## Problemas comunes y soluciones

### "No veo el botón Registrar Visita"

**¿Por qué pasa?**
No tienes una cita programada con ese contacto, o ya la completaste.

**Solución:**
- Ve al calendario y programa primero una cita de tipo "Visita"
- Después aparecerá el botón automáticamente

### "La firma no funciona"

**¿Por qué pasa?**
El navegador o el dispositivo puede tener problemas.

**Solución:**
- Si usas ratón: haz clic Y arrastra (como si dibujaras)
- Mejor usa una tablet o móvil, funciona mucho mejor
- Prueba con Chrome si tienes otro navegador

### "El micrófono no se activa"

**¿Por qué pasa?**
El navegador necesita permiso para usar el micrófono.

**Solución:**
- Cuando te lo pida, pulsa "Permitir"
- Si no te lo pide, revisa los permisos en configuración del navegador
- Chrome funciona mejor que otros navegadores para esta función

### "No puedo compartir el documento"

**¿Por qué pasa?**
Tu navegador está bloqueando las ventanas emergentes.

**Solución:**
- Permite ventanas emergentes de Vesta en tu navegador
- O usa el botón "Copiar" y pega el texto donde quieras enviarlo

## Preguntas frecuentes

**¿Puedo modificar el documento después de firmarlo?**
No. Una vez firmado, el documento no se puede cambiar. Esto es precisamente lo que le da valor legal - garantiza que nadie puede modificar lo acordado.

**¿El cliente recibe una copia?**
Sí, después de registrar la visita se abre una ventana para que le envíes el documento firmado por email, SMS o WhatsApp.

**¿Las firmas digitales tienen validez legal?**
Sí, las firmas electrónicas tienen validez legal en España y la UE. Además, el sello de autenticidad del documento refuerza su validez.

**¿Qué pasa si el cliente no quiere firmar?**
Explícale que el documento es para su beneficio - es una prueba de lo acordado que protege a ambas partes. Sin su firma, no podrás completar el registro.

**¿Puedo añadir la oferta después de registrar la visita?**
Sí, puedes registrar la oferta en el campo de ofertas del contacto aunque ya hayas completado la visita.

**¿Cuánto tiempo se guardan los documentos?**
Se guardan indefinidamente. Es recomendable mantenerlos siempre por temas legales.

**¿Puedo mostrar la hoja al cliente ANTES de la visita?**
Sí, y es muy recomendable. Usa los botones "Vista Previa" o "PDF" para generar una versión preliminar y compartirla con el cliente.

## Recursos adicionales

- [Primeros pasos con Vesta](/academia?article=getting-started)
- [Cómo programar citas en el calendario](/academia?article=calendar-guide)
- [¿Cómo reportar un error?](/academia?article=how-to-report-errors)

---

**¿Necesitas ayuda?** Contacta con nuestro equipo de soporte en soporte@vesta.es o mediante el chat en vivo.`,
    category: "Guía",
    icon: ClipboardCheck,
    tags: ["visitas", "registro", "documentación", "firmas", "PDF", "clientes"],
    lastUpdated: new Date(2025, 10, 10),
    readTimeMinutes: 8,
  },
];

// Helper functions
export function getArticleById(id: string): AcademyArticle | undefined {
  return academyArticles.find((article) => article.id === id);
}

export function getArticlesByCategory(
  category: AcademyArticle["category"],
): AcademyArticle[] {
  return academyArticles.filter((article) => article.category === category);
}

export function getCategories(): AcademyArticle["category"][] {
  const categories = new Set(academyArticles.map((article) => article.category));
  return Array.from(categories).sort();
}

export function searchArticles(query: string): AcademyArticle[] {
  const lowercaseQuery = query.toLowerCase();
  return academyArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowercaseQuery) ||
      article.shortDescription.toLowerCase().includes(lowercaseQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      article.content.toLowerCase().includes(lowercaseQuery),
  );
}

export function getCategoryDisplayName(
  category: AcademyArticle["category"],
): string {
  const displayNames: Record<AcademyArticle["category"], string> = {
    Tutorial: "Tutorial",
    FAQ: "Preguntas Frecuentes",
    Guía: "Guía",
    Troubleshooting: "Solución de Problemas",
  };
  return displayNames[category];
}
