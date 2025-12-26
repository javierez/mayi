# FUNCIONALIDADES DE VESTA - PLATAFORMA CRM INMOBILIARIA

> **Documento completo de todas las funcionalidades implementadas en Vesta**
>
> Última actualización: Noviembre 2025

---

## 📋 ÍNDICE

1. [Gestión de Propiedades](#1-gestión-de-propiedades)
2. [Gestión de Contactos (CRM)](#2-gestión-de-contactos-crm)
3. [Calendario y Citas](#3-calendario-y-citas)
4. [Operaciones y Workflows](#4-operaciones-y-workflows)
5. [Tareas y Productividad](#5-tareas-y-productividad)
6. [Documentos y Archivos](#6-documentos-y-archivos)
7. [Publicación en Portales](#7-publicación-en-portales)
8. [IA y Automatización](#8-ia-y-automatización)
9. [Autenticación y Seguridad](#9-autenticación-y-seguridad)
10. [Administración de Cuenta](#10-administración-de-cuenta)
11. [Búsqueda y Filtros](#11-búsqueda-y-filtros)
12. [Notificaciones](#12-notificaciones)
13. [Analytics y Reportes](#13-analytics-y-reportes)
14. [Integraciones Externas](#14-integraciones-externas)
15. [SEO y Optimización](#15-seo-y-optimización)
16. [Stack Tecnológico](#16-stack-tecnológico)

---

## 1. GESTIÓN DE PROPIEDADES

### 1.1 Creación y Edición de Propiedades

**📍 Ubicación en el código:**
- `src/app/(dashboard)/propiedades/registro/page.tsx`
- `src/components/propiedades/form/property-characteristics-form.tsx`

**✨ Funcionalidades Principales:**

#### Sistema de Creación Paso a Paso
- **4 etapas de creación**: Información básica → Características → Imágenes → Publicación
- **Autoguardado inteligente**: Guarda automáticamente mientras escribes
- **Sistema de borradores**: Trabaja en propiedades sin publicarlas

#### Captura de Datos Innovadora con IA

**🎤 Grabación por Voz (Whisper AI)**
- Transcripción automática de notas habladas
- Tecnología OpenAI Whisper
- Botón push-to-talk integrado en formularios
- Conversión de voz a texto en tiempo real

**📄 Extracción desde Documentos (OCR)**
- AWS Textract para lectura de documentos
- Extracción automática de datos desde:
  - Fichas de encargo
  - Fichas de venta
  - Formularios de captación
- Autocompletado de campos desde PDFs/imágenes

**🗺️ Integración con Mapas y Catastro**
- Autocompletado de direcciones con Google Maps
- Obtención automática de coordenadas GPS
- Integración con Catastro Español:
  - Datos oficiales de la propiedad
  - Referencias catastrales
  - Metros cuadrados registrados

**🤖 Generación Automática de Descripciones**
- OpenAI GPT-4 para crear descripciones profesionales
- Tono personalizable por agencia
- Tres tipos de descripciones:
  - **Larga**: Para portales inmobiliarios (500-800 palabras)
  - **Corta**: Para tarjetas y previsualizaciones (150-200 palabras)
  - **Redes Sociales**: Optimizada para engagement

#### Tipos de Propiedad Soportados
- 🏢 Pisos
- 🏡 Casas y chalets
- 🏪 Locales comerciales
- 🚗 Garajes y plazas de parking
- 🏗️ Solares y terrenos

#### Información Gestionada

**Datos Básicos**
- Título de la propiedad
- Tipo de operación (Venta/Alquiler/Venta y Alquiler)
- Precio de venta
- Precio de alquiler
- Número de dormitorios
- Número de baños
- Metros cuadrados construidos
- Metros cuadrados útiles
- Estado de conservación (Nuevo, A reformar, Buen estado, etc.)

**Ubicación Detallada**
- Calle y número
- Código postal
- Ciudad
- Provincia
- Barrio/Zona
- Coordenadas GPS (latitud/longitud)
- Piso y puerta (si aplica)

**Características Avanzadas**
- Orientación (Norte, Sur, Este, Oeste, Noreste, etc.)
- Tipo de calefacción (Individual gas, Central, Eléctrica, etc.)
- Ascensor (Sí/No)
- Garaje incluido
- Trastero incluido
- Año de construcción
- Última reforma
- Certificación energética completa:
  - Consumo energético (A-G)
  - Emisiones CO₂ (A-G)
  - Certificado disponible

**Espacios Adicionales**
- Número de terrazas y metros cuadrados
- Número de balcones
- Bodega
- Despensa
- Altillo
- Vestidor

**Amenidades Premium**
- 🏊 Piscina (comunitaria/privada)
- 💪 Gimnasio
- 🌳 Jardín privado/comunitario
- 🎾 Pista de tenis/pádel
- 🔐 Seguridad 24h
- 🏊 Jacuzzi/Spa
- 🏡 Domótica
- ♿ Accesibilidad

**Detalles Técnicos**
- Materiales de construcción
- Acabados interiores
- Tipo de ventanas
- Instalaciones especiales
- Comunidad de propietarios (gastos mensuales)

---

### 1.2 Visualización de Propiedades

**📍 Ubicación:**
- `src/app/(dashboard)/propiedades/page.tsx`
- `src/components/propiedades/property-table.tsx`
- `src/components/propiedades/property-grid.tsx`

**✨ Tres Modos de Visualización:**

#### 1️⃣ Vista de Tabla (Spreadsheet)
- Tabla interactiva estilo Excel
- Ordenación por cualquier columna
- Selección múltiple de propiedades
- Acciones en lote
- 21 propiedades por página
- Prefetching de páginas siguientes para navegación ultra-rápida

**Columnas disponibles:**
- Imagen miniatura
- Referencia
- Título
- Tipo de propiedad
- Ubicación (ciudad)
- Precio
- Habitaciones / Baños
- m² construidos / útiles
- Estado (En Venta, En Alquiler, Vendido, etc.)
- Agente asignado
- Fecha de creación
- Acciones rápidas

#### 2️⃣ Vista de Cuadrícula (Grid)
- Tarjetas visuales con imagen destacada
- Información clave visible
- Hover para detalles adicionales
- Diseño responsive (1-4 columnas según pantalla)
- Ideal para navegación visual

#### 3️⃣ Vista de Mapa Interactivo
- Google Maps integrado
- Marcadores por propiedad
- Clusters para múltiples propiedades cercanas
- InfoWindow al hacer click
- Navegación directa a detalles
- Búsqueda por área geográfica

**🔍 Búsqueda y Filtros Avanzados:**

- **Búsqueda en tiempo real** por:
  - Título
  - Dirección
  - Referencia
  - Descripción

- **Filtros múltiples combinables**:
  - ✅ Por estado (En Venta, En Alquiler, Vendido, Alquilado, Descartado)
  - 🏢 Por tipo de propiedad
  - 👤 Por agente asignado
  - 💰 Por rango de precio (min-max)
  - 🛏️ Por número de habitaciones
  - 🚿 Por número de baños
  - 📐 Por metros cuadrados
  - 🏙️ Por ciudad
  - ⭐ Por características:
    - Con garaje
    - Con ascensor
    - Con trastero
    - Obra nueva
    - A reformar

**📤 Exportación de Datos:**
- Exportar a CSV con todos los campos
- Respeta filtros aplicados
- Incluye propiedades seleccionadas o todas
- Formato compatible con Excel

---

### 1.3 Detalle de Propiedad

**📍 Ubicación:**
- `src/app/(dashboard)/propiedades/[id]/page.tsx`
- `src/components/propiedades/detail/property-tabs.tsx`

**✨ Sistema de Pestañas Organizadas:**

#### 📋 Pestaña: Resumen
- **Galería de imágenes** principal con navegación
- **Información destacada**: Precio, m², habitaciones, baños
- **Mapa de ubicación** interactivo
- **Características principales** en chips visuales
- **Descripción** generada o editada
- **Acciones rápidas**:
  - Editar propiedad
  - Cambiar estado
  - Publicar/Despublicar
  - Generar cartel
  - Compartir

#### 🔍 Pestaña: Detalles
- **Todas las características** organizadas por secciones:
  - Información básica
  - Ubicación detallada
  - Distribución
  - Características
  - Amenidades
  - Certificación energética
  - Espacios exteriores
- **Descripción completa**
- **Notas internas** (no visibles públicamente)

#### 📄 Pestaña: Documentos
- **Sistema de gestión documental** organizado por categorías:
  - 📜 Certificados energéticos
  - ✍️ Escrituras
  - 📐 Planos
  - 📋 Documentación inicial
  - 👁️ Registros de visitas
  - 🖼️ Carteles generados
  - 📎 Otros documentos

**Funcionalidades:**
- Subida múltiple de archivos (drag & drop)
- Vista previa de PDFs
- Descarga individual o en lote
- Etiquetas personalizadas
- Búsqueda de documentos
- Historial de versiones

#### 📊 Pestaña: Actividad
- **Timeline completo** de todas las acciones:
  - ✏️ Cambios de precio (con histórico)
  - 🔄 Cambios de estado
  - 🌐 Publicaciones en portales
  - 📁 Documentos subidos
  - 🖼️ Imágenes añadidas/eliminadas
  - ✨ Modificaciones de características

**Información de cada actividad:**
- Usuario que realizó la acción
- Timestamp exacto
- Detalles del cambio (antes/después)
- Tipo de acción
- Filtros por tipo de actividad

#### 💬 Pestaña: Comentarios
- **Sistema de comentarios internos** con funcionalidades avanzadas:

**Características del sistema de comentarios:**
- 🎤 **Transcripción por voz** con Whisper AI
- 💬 **Respuestas anidadas** (hilos de conversación)
- 🤖 **Resumen automático con IA** cuando el comentario supera 400 caracteres
- ✅ **Extracción de tareas** accionables desde notas
- 📌 **Mención de usuarios** (@usuario)
- 🕐 Timestamp y autor visible
- ✏️ Edición y eliminación (con permisos)
- 📎 Adjuntar archivos

**Resumen automático incluye:**
- Acciones a realizar
- Preguntas del cliente
- Preferencias mencionadas
- Decisores involucrados
- Nivel de interés estimado
- Objeciones identificadas
- Notas personales relevantes
- Competencia mencionada

#### ✅ Pestaña: Tareas
- **Gestión de tareas** relacionadas con la propiedad
- Ver todas las tareas asociadas
- Crear nuevas tareas
- Marcar como completadas
- Filtrar por:
  - Estado (pendiente, en progreso, completada)
  - Urgencia (1-5)
  - Asignado a
  - Fecha de vencimiento

**Tipos de tareas comunes:**
- 📸 Subir fotos profesionales
- ✏️ Completar información faltante
- 📅 Programar visita
- 🔑 Recoger llaves
- 💰 Realizar valoración
- 📋 Crear hoja de encargo
- ✍️ Firmar hoja de encargo
- 🖼️ Generar cartel

#### 🌐 Pestaña: Publicación
- **Gestión de publicación en portales** inmobiliarios
- Estado de publicación por portal:
  - ✅ Publicado
  - ❌ No publicado
  - ⏳ Pendiente de sincronización
  - ⚠️ Error en publicación

**Portales soportados:**
- Fotocasa (completamente integrado)
- Idealista (en desarrollo)
- Habitaclia
- Pisos.com
- Yaencontre
- Milanuncios

**Acciones:**
- Publicar en portal seleccionado
- Despublicar
- Actualizar información
- Ver logs de sincronización
- Configurar visibilidad (dirección exacta/calle/zona)
- Gestionar destacados/premium

---

### 1.4 Galería de Imágenes y Multimedia

**📍 Ubicación:**
- `src/components/propiedades/detail/gallery/image-gallery.tsx`
- `src/server/queries/property_images.ts`

**✨ Gestión Avanzada de Imágenes:**

#### Carga de Imágenes
- **Subida múltiple**: Arrastra y suelta hasta 50 imágenes
- **Formatos soportados**: JPG, PNG, WEBP, HEIC
- **Vista previa** antes de subir
- **Progreso de subida** individual por imagen
- **Optimización automática**: Compresión y redimensionamiento

#### Organización y Edición
- **Reordenación drag & drop**: Cambia el orden de las fotos fácilmente
- **Imagen principal**: Marca la foto destacada
- **Sistema de etiquetas** para categorizar:
  - Exterior
  - Interior
  - Cocina
  - Baños
  - Dormitorios
  - Vistas
  - Zonas comunes
  - Planos
  - Documentos visuales

#### Marca de Agua Automática
- **Watermark configurable** por cuenta
- Aplicación automática al subir
- Personalización:
  - Logo de la agencia
  - Opacidad
  - Posición (esquinas, centro)
  - Tamaño
- **Versión sin marca de agua** guardada por separado

#### Eliminación y Gestión
- **Eliminación múltiple**: Selecciona varias y elimina
- **Confirmación de seguridad**
- **Recuperación**: Papelera temporal (30 días)

#### Multimedia Adicional
- **Videos**: Subida de videos MP4
- **YouTube**: Enlaces a videos de YouTube
- **Tours Virtuales 360°**: Integración con plataformas de tours
- **Planos**: Subida de planos arquitectónicos

---

### 1.5 Vesta Image Studio - IA para Imágenes

**📍 Ubicación:**
- `src/app/(dashboard)/propiedades/[id]/image-studio/page.tsx`
- `src/components/propiedades/image-studio/`

**🎨 Editor de Imágenes con Inteligencia Artificial**

Este es uno de los módulos más innovadores de Vesta, que utiliza múltiples tecnologías de IA para transformar y mejorar imágenes de propiedades.

#### 🚀 Funcionalidades de IA Disponibles:

##### 1. Freepik Enhance - Mejora de Calidad
**¿Qué hace?**
- Upscaling inteligente de imágenes
- Mejora de resolución hasta 4x
- Reducción de ruido y artefactos
- Mejora de nitidez y detalles

**Casos de uso:**
- Fotos tomadas con móvil de baja calidad
- Imágenes antiguas de archivo
- Fotos oscuras o borrosas
- Preparación para impresión de carteles

**Cómo funciona:**
- Seleccionas la imagen
- Click en "Enhance"
- La IA procesa en ~30-60 segundos
- Comparas antes/después
- Decides si aplicar el cambio

##### 2. Gemini Renovate - Renovación Virtual
**¿Qué hace?**
- Renovación virtual de habitaciones
- Cambio de estilo de decoración
- Modernización de espacios
- Visualización de potencial

**Estilos disponibles:**
- Moderno/Contemporáneo
- Escandinavo/Minimalista
- Industrial
- Clásico/Elegante
- Mediterráneo
- Rústico

**Casos de uso:**
- Propiedades a reformar
- Home staging virtual
- Mostrar potencial de espacios
- Ayudar a compradores a visualizar

##### 3. Gemini Remove Clutter - Eliminación de Objetos
**¿Qué hace?**
- Elimina objetos no deseados de las fotos
- Limpia espacios desordenados
- Quita muebles viejos o elementos que distraen
- Rellena automáticamente el espacio eliminado

**Casos de uso:**
- Fotos con objetos personales del propietario
- Espacios desordenados
- Cables, manchas, elementos temporales
- Mejorar presentación de la propiedad

##### 4. Gemini Blur Faces - Difuminado de Rostros
**¿Qué hace?**
- Detecta automáticamente rostros en las imágenes
- Difumina rostros para proteger privacidad
- Cumple con GDPR/LOPD

**Casos de uso:**
- Fotos con personas (propietarios, inquilinos)
- Protección de privacidad
- Cumplimiento legal
- Imágenes con trabajadores o técnicos

##### 5. Gemini Review - Análisis de Calidad
**¿Qué hace?**
- Analiza la calidad de cada imagen
- Proporciona puntuación (1-10)
- Recomiendaciones de mejora
- Identifica problemas:
  - Iluminación pobre
  - Composición deficiente
  - Elementos que distraen
  - Necesidad de edición

**Salida del análisis:**
- Puntuación general
- Puntos fuertes
- Puntos débiles
- Recomendaciones específicas
- Sugerencias de herramientas de IA a aplicar

#### 💰 Sistema de Tokens

**¿Cómo funciona?**
- Cada operación de IA consume tokens
- Las cuentas tienen un balance de tokens
- Se pueden comprar paquetes de tokens
- Historial completo de transacciones

**Costos por operación:**
- Freepik Enhance: 10-50 tokens (según tamaño)
- Gemini Renovate: 20 tokens
- Gemini Remove: 15 tokens
- Gemini Blur: 5 tokens
- Gemini Review: 2 tokens

**Gestión de tokens:**
- Balance visible en tiempo real
- Advertencia si tokens insuficientes
- Historial de consumo por propiedad
- Reportes mensuales de uso

#### 🎯 Interfaz del Image Studio

**Características de UX:**
- Vista previa lado a lado (antes/después)
- Zoom y navegación de imagen
- Selección de múltiples imágenes
- Cola de procesamiento
- Notificaciones de completado
- Historial de transformaciones
- Deshacer cambios
- Exportar versiones

**Workflow típico:**
1. Seleccionar imagen(es)
2. Elegir herramienta de IA
3. Configurar parámetros (si aplica)
4. Vista previa del resultado
5. Aplicar o descartar
6. Guardar versión mejorada

---

### 1.6 Generación de Carteles Inmobiliarios

**📍 Ubicación:**
- `src/app/(dashboard)/propiedades/[id]/cartel-editor/page.tsx`
- `src/components/admin/carteleria/**/*.tsx`

**🖼️ Editor Visual de Carteles Profesionales**

Sistema completo para crear carteles inmobiliarios de alta calidad listos para imprimir o publicar en redes sociales.

#### Plantillas Disponibles
- **Classic Vertical**: Diseño tradicional vertical
- **Modern Horizontal**: Diseño horizontal moderno
- **Premium Elite**: Diseño premium con elementos dorados
- **Minimalist**: Diseño minimalista limpio
- Más plantillas en desarrollo

#### Personalización Completa

**Layout y Estructura:**
- Número de imágenes: 1, 2, 3 o 4 fotos
- Distribución automática según número de imágenes
- Tipo de operación: VENTA, ALQUILER, VENTA Y ALQUILER

**Elementos Visuales:**
- ✅ **Logo de la agencia**: Posición y tamaño configurables
- 💰 **Precio destacado**: Mostrar/ocultar, formato personalizado
- 🏠 **Características**: Habitaciones, baños, m² (iconos + texto)
- 📱 **QR Code**: Generación automática al detalle de la propiedad
- 📍 **Ubicación**: Mostrar dirección completa o solo zona
- 📞 **Información de contacto**: Teléfono, email, web

**Tipografía y Estilo:**
- Fuentes personalizables
- Tamaños de texto ajustables
- Colores de texto y fondos
- Overlays en imágenes (transparencia configurable)

**Elementos de Marca:**
- Colores corporativos
- Logo en diferentes posiciones
- Watermark en imágenes
- Slogan o mensaje personalizado

#### Funcionalidades Avanzadas

**Configuraciones Guardables:**
- Guardar configuración como plantilla
- Reutilizar en otras propiedades
- Configuraciones por defecto de la cuenta
- Plantillas personalizadas por agente

**Vista Previa en Tiempo Real:**
- Ver cambios instantáneamente
- Zoom para detalles
- Vista de impresión
- Vista para redes sociales

**Generación y Exportación:**
- **PDF de alta calidad** para impresión
- **PNG** para redes sociales
- **JPG** para portales
- Múltiples tamaños: A4, A3, Cuadrado (Instagram), Story (Instagram)

**Gestión de Carteles:**
- Historial de carteles generados
- Versiones guardadas
- Descargar versiones anteriores
- Eliminar carteles obsoletos

#### Workflow de Creación

1. **Seleccionar propiedad**
2. **Elegir plantilla** base
3. **Personalizar diseño**:
   - Seleccionar imágenes
   - Configurar elementos visibles
   - Ajustar colores y tipografías
4. **Vista previa**
5. **Generar PDF/PNG**
6. **Descargar o compartir**

---

### 1.7 Historial y Actividad de Propiedades

**📍 Ubicación:**
- `src/app/(dashboard)/propiedades/[id]/history/page.tsx`
- `src/components/propiedades/detail/activity/`

**📊 Registro Completo de Todas las Acciones**

Sistema de auditoría que registra automáticamente cada cambio realizado en una propiedad.

#### Tipos de Actividades Registradas

**Cambios de Precio:**
- Precio anterior
- Precio nuevo
- Porcentaje de cambio
- Razón del cambio (opcional)
- Usuario que lo realizó
- Timestamp exacto

**Cambios de Estado:**
- De: En captación → A: En venta
- Todos los estados:
  - En captación
  - En venta
  - En alquiler
  - Reservado
  - Vendido
  - Alquilado
  - Descartado
  - Retirado del mercado

**Publicaciones en Portales:**
- Portal donde se publicó
- Timestamp de publicación
- Timestamp de despublicación
- Errores de sincronización
- ID del anuncio en el portal

**Gestión de Documentos:**
- Documento subido
- Tipo de documento
- Usuario que lo subió
- Documento eliminado
- Versión del documento

**Modificaciones de Características:**
- Campo modificado
- Valor anterior
- Valor nuevo
- Timestamp

**Imágenes:**
- Imágenes añadidas (con miniaturas)
- Imágenes eliminadas
- Cambio de orden
- Cambio de imagen principal

#### Visualización del Historial

**Timeline Visual:**
- Ordenado cronológicamente (más reciente primero)
- Agrupación por día
- Iconos por tipo de actividad
- Código de colores

**Filtros Disponibles:**
- Por tipo de actividad
- Por usuario
- Por rango de fechas
- Por entidad relacionada

**Detalles de Cada Actividad:**
- Avatar del usuario
- Nombre completo
- Rol del usuario
- Timestamp relativo ("hace 2 horas")
- Timestamp exacto (al hover)
- Detalles en formato JSON (para devs)

#### Casos de Uso

- **Auditoría**: ¿Quién cambió el precio?
- **Accountability**: Tracking de acciones por agente
- **Debugging**: Identificar cuándo se publicó/despublicó
- **Reportes**: Histórico de precios para análisis
- **Legal**: Evidencia de cambios para disputas

---

## 2. GESTIÓN DE CONTACTOS (CRM)

### 2.1 Creación y Edición de Contactos

**📍 Ubicación:**
- `src/app/(dashboard)/contactos/crear/page.tsx`
- `src/components/contactos/crear/contact-form.tsx`

**👥 Sistema Completo de Gestión de Relaciones con Clientes**

#### Información Básica del Contacto

**Datos Personales:**
- Nombre
- Apellido(s)
- Email principal
- Teléfono principal
- Teléfono secundario (opcional)
- Notas de teléfonos (ej: "Llamar solo por las tardes")

**Identificación:**
- Tipo: NIF, NIE, DNI, Pasaporte
- Número de documento
- Validación automática del formato

**Valoración y Clasificación:**
- ⭐ **Rating**: 1-5 estrellas
  - Calidad del contacto
  - Potencial de conversión
  - Nivel de interés
- 📊 **Estado**: Activo, Inactivo, No contactar
- 🏷️ **Etiquetas personalizadas**

**Origen del Contacto:**
- Referido por cliente
- Portal inmobiliario
- Redes sociales
- Publicidad online
- Visita a oficina
- Llamada entrante
- Email
- Evento
- Otro

#### Roles del Contacto

Un contacto puede tener múltiples roles simultáneamente:

**🏠 Propietario (Owner)**
- Propiedades en propiedad
- Intención de vender/alquilar
- Historial de operaciones como vendedor

**🛒 Comprador (Buyer)**
- Búsquedas guardadas
- Propiedades favoritas
- Ofertas realizadas
- Historial de visitas

**👀 Interesado (Prospect)**
- Interés inicial
- Sin operación activa
- Lead potencial

#### Relaciones

**Con Organizaciones:**
- Empresa para la que trabaja
- Cargo/Posición
- Relación con la organización

**Con Otros Contactos:**
- Relaciones familiares
- Socios
- Referencias

#### Información Adicional

**Campos Personalizados (JSON):**
- Preferencias de comunicación
- Horarios de contacto preferidos
- Idioma preferido
- Notas de la primera conversación
- Cualquier dato adicional relevante

---

### 2.2 Listado de Contactos

**📍 Ubicación:**
- `src/app/(dashboard)/contactos/page.tsx`
- `src/components/contactos/table/contact-table.tsx`

**📊 Vista de Tabla Tipo CRM Profesional**

#### Diseño y Navegación

- **Vista tipo spreadsheet**: Similar a Excel/Google Sheets
- **50 contactos por página**
- **Paginación rápida** con prefetching
- **Selección múltiple** para acciones en lote
- **Ordenación** por cualquier columna

#### Columnas de Información

- 👤 **Nombre completo** con avatar
- 📧 **Email** (click para copiar)
- 📱 **Teléfono** (click para llamar)
- 🏷️ **Rol principal** (badge)
- ⭐ **Rating** (estrellas visuales)
- 🏢 **Organización** asociada
- 📅 **Último contacto**
- 🏠 **# Propiedades** relacionadas:
  - Como propietario
  - Como comprador
  - Prospectos activos
- ✅ **Tareas pendientes**
- 🎯 **Estado** (activo/inactivo)
- ⚙️ **Acciones rápidas**

#### Filtros Avanzados del CRM

**Búsqueda de Texto:**
- Nombre
- Email
- Teléfono
- Empresa
- Notas

**Filtros por Rol:**
- 🏠 Ver solo propietarios
- 🛒 Ver solo compradores
- 👀 Ver solo interesados
- 👥 Ver todos

**Filtros por Actividad:**
- 📅 **Último contacto**:
  - Hoy
  - Esta semana
  - Este mes
  - Últimos 3 meses
  - Más de 3 meses
  - Nunca contactado

**Filtros por Calidad:**
- ⭐ Por rating (1-5)
- 🎯 Solo activos
- 💤 Solo inactivos
- 🔥 Hot leads (rating 4-5, contactados recientemente)

**Filtros por Origen:**
- Por fuente de captación
- Por agente que captó
- Por campaña

#### Acciones en Lote

- ✉️ Enviar email masivo
- 📱 Añadir a campaña de SMS
- 🏷️ Asignar etiquetas
- 👤 Cambiar agente asignado
- 📤 Exportar seleccionados
- 🗑️ Eliminar múltiples

#### Contadores y Estadísticas

Para cada contacto, visualiza rápidamente:
- **Propiedades como propietario**: Número total
- **Propiedades como comprador**: En seguimiento
- **Prospectos activos**: Búsquedas en curso
- **Tareas pendientes**: Acciones por realizar
- **Próxima cita**: Fecha y hora

#### Exportación de Datos

**Formato CSV** con todos los campos:
- Información personal
- Roles y clasificación
- Propiedades relacionadas
- Historial de actividad
- Notas y comentarios
- Compatible con Excel, Google Sheets, importación a otros CRMs

---

### 2.3 Detalle de Contacto

**📍 Ubicación:**
- `src/app/(dashboard)/contactos/[id]/page.tsx`

**📋 Vista 360° del Cliente**

Sistema de pestañas organizado para tener toda la información del contacto en un solo lugar.

#### Pestaña: Resumen

**Información Principal:**
- 👤 Datos personales completos
- ⭐ Rating con opción de editar
- 🏷️ Etiquetas y roles
- 📊 Estadísticas rápidas:
  - Días desde último contacto
  - Número total de interacciones
  - Propiedades en seguimiento
  - Ofertas realizadas
  - Visitas completadas

**Acciones Rápidas:**
- 📞 Llamar (integración con telefonía)
- ✉️ Enviar email
- 💬 WhatsApp
- 📅 Programar cita
- ✅ Crear tarea
- ✏️ Añadir nota
- ✏️ Editar información

**Timeline de Interacciones Recientes:**
- Últimas 5 interacciones
- Tipo de interacción (llamada, email, reunión, visita)
- Fecha y hora
- Resumen breve
- Usuario que gestionó

#### Pestaña: Propiedades

**Tres Secciones:**

**1. Como Propietario:**
- Listado de propiedades que posee
- Estado de cada propiedad
- Intención de venta/alquiler
- Progreso en el pipeline

**2. Como Comprador:**
- Propiedades favoritas/guardadas
- Propiedades vistas
- Ofertas realizadas
- Estado de cada oferta

**3. Prospectos/Búsquedas:**
- Criterios de búsqueda activos
- Alertas configuradas
- Matching con propiedades disponibles
- Propiedades recomendadas

#### Pestaña: Actividad

**Registro Completo de Interacciones:**

Tipos de actividades registradas:
- 📞 **Llamadas telefónicas**
  - Entrante/Saliente
  - Duración
  - Resumen de la conversación
  - Próximos pasos

- ✉️ **Emails**
  - Enviados/Recibidos
  - Asunto
  - Contenido
  - Adjuntos

- 💬 **Mensajes (WhatsApp/SMS)**
  - Historial de conversaciones
  - Respuestas rápidas

- 🤝 **Reuniones**
  - Presenciales/Virtuales
  - Notas de la reunión
  - Decisores presentes
  - Acuerdos alcanzados

- 🏠 **Visitas a propiedades**
  - Propiedad visitada
  - Feedback del cliente
  - Interés mostrado
  - Objeciones

- 📝 **Otras interacciones**
  - Eventos asistidos
  - Referencias enviadas
  - Documentación compartida

**Funcionalidades del Sistema de Actividad:**

**Añadir Nueva Actividad:**
- Formulario modal rápido
- 🎤 **Transcripción por voz** con Whisper AI
- 🤖 **Resumen automático** con IA
- ✅ **Extracción de tareas** accionables
- Adjuntar archivos
- Mencionar otros contactos/usuarios

**Resumen Automático con IA:**
Cuando la nota de actividad supera 400 caracteres, la IA genera automáticamente:
- 📌 **Acciones a realizar**: Tareas específicas mencionadas
- ❓ **Preguntas del cliente**: Dudas que hay que resolver
- ❤️ **Preferencias**: Gustos y requisitos del cliente
- 👥 **Decisores involucrados**: Quién toma las decisiones
- 📊 **Nivel de interés**: Alto, medio, bajo
- ⚠️ **Objeciones**: Preocupaciones o impedimentos
- 📝 **Notas personales**: Información relevante para recordar
- 🏢 **Competencia mencionada**: Otras agencias o propiedades

**Extracción de Tareas con IA:**
La IA identifica automáticamente tareas accionables en las notas:
- Título de la tarea (máx 60 caracteres)
- Descripción con contexto
- Urgencia estimada (1-5)
- Días sugeridos de vencimiento
- Categoría (contacto/propiedad)
- Asignación automática al usuario actual

**Visualización:**
- Timeline cronológica
- Filtros por tipo de actividad
- Filtros por fecha
- Filtros por usuario
- Búsqueda en contenido
- Exportar historial completo

#### Pestaña: Comentarios

**Sistema de Notas Internas Colaborativas:**

Similar al sistema de comentarios de propiedades pero enfocado en el contacto:

- 💬 **Comentarios con hilos**: Respuestas anidadas
- 🎤 **Grabación por voz**: Transcripción automática
- 🤖 **Resumen inteligente**: Cuando >400 caracteres
- ✅ **Extracción de tareas**: Automática desde notas
- 📌 **Notas fijadas**: Destacar información crítica
- @**Menciones**: Notificar a otros usuarios
- 📎 **Adjuntos**: Documentos, imágenes, links
- ✏️ **Edición**: Con historial de cambios
- 🗑️ **Eliminación**: Con permisos

**Casos de uso:**
- Notas de llamadas telefónicas
- Información sensible del cliente
- Estrategia de venta/compra
- Feedback interno del equipo
- Recordatorios importantes

#### Pestaña: Tareas

**Gestión de Tareas Relacionadas:**

- ✅ **Ver todas las tareas** del contacto
- ➕ **Crear nuevas tareas**
- 📊 **Estados**: Backlog, Listo, En progreso, Validación, Finalizado, Bloqueado
- 🔥 **Urgencia**: 1 (baja) a 5 (crítica)
- 📅 **Fecha de vencimiento**
- 👤 **Asignación**: A ti o a otro agente
- 📱 **Categorías**:
  - Llamar
  - Enviar email
  - Enviar documentación
  - Programar visita
  - Seguimiento
  - Negociación
  - Cierre
  - Otro

**Tareas automáticas generadas:**
- Seguimiento post-visita
- Recordatorio de contacto
- Envío de propiedades recomendadas
- Actualización de búsquedas

#### Pestaña: Documentos

**Sistema de Gestión Documental por Categorías:**

**Categorías de documentos:**
- 📝 **DNI/NIE/Pasaporte**
- 📋 **Documentos personales**
- 💰 **Documentación financiera**
- ✍️ **Contratos firmados**
- 📐 **Planos** (si es propietario)
- ⚡ **Certificados energéticos** (si es propietario)
- 📄 **Escrituras** (si es propietario)
- 🖼️ **Carteles**
- 📎 **Otros**

**Funcionalidades:**
- Subida múltiple (drag & drop)
- Vista previa de PDFs/imágenes
- Descarga individual o en lote
- Organización por etiquetas
- Búsqueda de documentos
- Compartir con el cliente (link seguro)
- Control de permisos
- Historial de versiones

---

### 2.4 Comentarios Internos y Notas

**📍 Ubicación:**
- `src/components/contactos/detail/contact-comments.tsx`
- `src/components/contactos/listing-contact-comments.tsx`

**💬 Sistema Colaborativo de Notas del Equipo**

#### Características Principales

**Creación de Comentarios:**
- Editor de texto enriquecido
- 🎤 **Botón push-to-talk** para dictar comentarios
- Transcripción automática con Whisper AI
- Formato markdown soportado
- Vista previa antes de publicar

**Hilos de Conversación:**
- 💬 Respuestas anidadas ilimitadas
- Threading para mantener contexto
- Colapsar/expandir hilos
- Navegación entre hilos

**IA Integrada:**

**Resumen Automático (>400 caracteres):**
La IA analiza comentarios largos y extrae:
- **Acciones a realizar**: Lista de tareas específicas
- **Preguntas del cliente**: Dudas que resolver
- **Preferencias del cliente**: Gustos, requisitos, deal-breakers
- **Decisores involucrados**: Quién decide la compra/venta
- **Nivel de interés**: Estimación del engagement
- **Objeciones identificadas**: Preocupaciones o impedimentos
- **Notas personales**: Info relevante a recordar
- **Competencia mencionada**: Otras agencias o propiedades

**Extracción de Tareas Accionables:**
- Detecta automáticamente tareas en las notas
- Crea borradores de tareas
- Sugerencias de:
  - Título (máx 60 caracteres)
  - Descripción detallada
  - Urgencia (1-5)
  - Días hasta vencimiento
  - Categoría
- Un click para crear la tarea

**Colaboración del Equipo:**
- @**Menciones**: Notifica a usuarios específicos
- 👁️ **Visto por**: Quién ha leído el comentario
- 🔔 **Notificaciones**: En tiempo real
- 📌 **Fijar comentarios**: Destacar info crítica

**Organización:**
- Ordenar por: Más reciente, Más antiguo, Más relevante
- Filtrar por: Usuario, Fecha, Con tareas, Fijados
- Búsqueda en contenido de comentarios
- Etiquetas personalizadas

**Permisos y Privacidad:**
- Solo visible para el equipo interno
- No accesible para clientes
- Control de edición (solo autor)
- Control de eliminación (autor + admin)
- Historial de ediciones

#### Casos de Uso

- **Post-llamada**: Resumen rápido de conversación telefónica
- **Post-visita**: Feedback del cliente tras ver propiedad
- **Coordinación**: Comunicación entre agentes sobre un cliente
- **Estrategia**: Planificación de abordaje comercial
- **Recordatorios**: Info importante a recordar en próximo contacto

---

## 3. CALENDARIO Y CITAS

### 3.1 Gestión de Citas

**📍 Ubicación:**
- `src/app/(dashboard)/calendario/page.tsx`
- `src/components/appointments/appointment-form.tsx`

**📅 Sistema Completo de Gestión de Agenda**

#### Tres Vistas de Calendario

**1️⃣ Vista Semanal (Weekly Grid)**
- Cuadrícula horaria de 6:00 AM a 12:00 AM
- Columnas por día de la semana
- Slots de 30 minutos
- Visualización de duración de cada cita
- Código de colores por tipo de cita
- Click en slot vacío para crear cita rápida
- Vista de múltiples agentes simultáneamente

**2️⃣ Vista de Calendario (Month View)**
- Vista mensual con tarjetas de citas
- Diseño compacto mostrando:
  - Hora
  - Tipo de cita (icono)
  - Contacto
  - Propiedad (si aplica)
- Navegación mes a mes
- Indicador de día actual
- Contador de citas por día

**3️⃣ Vista de Lista (List View)**
- Listado cronológico de todas las citas
- Agrupación por día
- Información completa visible:
  - Hora inicio - fin
  - Tipo de cita con icono y color
  - Contacto con avatar
  - Propiedad vinculada
  - Estado
  - Agente asignado
  - Tiempo de viaje
- Ordenación personalizable
- Filtros y búsqueda integrados

#### Tipos de Citas

**🏠 Visita**
- Visita a propiedad con cliente
- Información de la propiedad requerida
- Tracking de feedback post-visita

**🤝 Reunión**
- Reuniones de trabajo
- Presentaciones
- Negociaciones
- Valoraciones

**✍️ Firma**
- Firma de contratos
- Firma de hojas de encargo
- Escrituras

**🎉 Cierre**
- Entrega de llaves
- Firma definitiva
- Celebración de operación cerrada

**🚗 Viaje**
- Desplazamientos
- Tiempo de trayecto
- Logística

#### Información Gestionada

**Datos Básicos:**
- Título de la cita
- Tipo de cita
- Fecha
- Hora inicio
- Hora fin
- Duración automática calculada

**Relaciones:**
- 👤 **Contacto asociado**: Cliente con quien es la cita
- 🏠 **Propiedad asociada**: (Opcional) Propiedad relacionada
- 👨‍💼 **Agente asignado**: Quién tiene la cita
- 👥 **Participantes adicionales**: Otros usuarios del equipo

**Detalles Logísticos:**
- ⏱️ **Tiempo de viaje**: Minutos de desplazamiento
- 📍 **Ubicación**: Dirección o lugar de la cita
- 🚗 **Instrucciones de llegada**
- 📝 **Notas internas**
- 📎 **Documentos adjuntos**

**Estados de Cita:**
- 📅 **Programado**: Cita confirmada
- ✅ **Completado**: Cita realizada
- ❌ **Cancelado**: Cita cancelada
- 🔄 **Reprogramado**: Cambio de fecha/hora
- 👻 **No asistió**: Cliente no se presentó

#### Creación de Citas

**Métodos de creación:**

**1. Click en el calendario:**
- Click en slot vacío
- Se abre modal rápido
- Fecha y hora pre-seleccionadas
- Rellenar datos mínimos
- Guardar

**2. Desde contacto:**
- Botón "Programar cita" en detalle de contacto
- Contacto pre-seleccionado
- Sugerencias de horarios disponibles

**3. Desde propiedad:**
- Botón "Programar visita" en detalle de propiedad
- Propiedad pre-seleccionada
- Tipo "Visita" pre-seleccionado

**4. Formulario completo:**
- Acceso desde botón principal
- Todos los campos disponibles
- Validación completa

#### Funcionalidades Avanzadas

**Drag & Drop (En desarrollo):**
- Arrastrar citas para cambiar hora
- Redimensionar para cambiar duración
- Confirmación de cambios

**Recordatorios:**
- Notificación 24h antes
- Notificación 1h antes
- Notificación personalizable
- Email automático al cliente

**Conflictos de Agenda:**
- Detección de solapamientos
- Advertencia al crear cita
- Sugerencias de horarios libres

**Citas Recurrentes (En desarrollo):**
- Repetir diariamente
- Repetir semanalmente
- Repetir mensualmente
- Patrón personalizado

---

### 3.2 Integración con Google Calendar

**📍 Ubicación:**
- `src/app/api/google/calendar/**/*.ts`
- `src/components/calendar/google-calendar-sync-settings.tsx`
- `src/lib/google-calendar-sync.ts`

**🔄 Sincronización Bidireccional Avanzada**

#### Configuración de Sincronización

**OAuth 2.0 Seguro:**
- Autenticación con cuenta de Google
- Permisos específicos de Calendar API
- Tokens de acceso renovables
- Revocación de acceso disponible

**Dirección de Sincronización:**

**1️⃣ Vesta → Google (Solo Enviar)**
- Citas creadas en Vesta se crean en Google Calendar
- Cambios en Vesta actualizan Google Calendar
- Eliminaciones en Vesta eliminan en Google Calendar
- Google Calendar no afecta Vesta

**2️⃣ Google → Vesta (Solo Recibir)**
- Citas en Google Calendar se importan a Vesta
- Cambios en Google Calendar actualizan Vesta
- Eliminaciones en Google Calendar eliminan en Vesta
- Vesta no afecta Google Calendar

**3️⃣ Bidireccional (Sincronización Completa)**
- Cambios en cualquier dirección se sincronizan
- Sistema inteligente de resolución de conflictos
- Última modificación gana
- Log de todos los cambios

**4️⃣ Ninguna (Desactivada)**
- Sin sincronización
- Sistemas independientes

#### Configuración por Usuario

**Ajustes Individuales:**
- Cada usuario configura su propia sincronización
- Calendario de Google seleccionable
- Diferentes direcciones de sync por usuario
- Activación/desactivación independiente

**Calendario Principal:**
- Seleccionar cuál calendario de Google usar
- Soporte para calendarios compartidos
- Colores personalizados por tipo de cita

#### Sincronización en Tiempo Real

**Webhooks de Google:**
- Google notifica cambios vía webhook
- Procesamiento inmediato
- Sin delays perceptibles
- Registro de cada sincronización

**Tokens de Sincronización (Sync Tokens):**
- Sincronización incremental
- Solo cambios desde último sync
- Eficiencia en ancho de banda
- Rapidez en actualizaciones

**Gestión de Canales:**
- Canales webhook con expiración
- Renovación automática antes de expirar
- Máximo 1 semana de duración
- Re-creación automática

#### Manejo de Conflictos

**Detección:**
- Cambio simultáneo en ambos sistemas
- Timestamp de última modificación
- Hash de contenido

**Resolución:**
- **Última modificación gana**: Por defecto
- **Prioridad Vesta**: Vesta siempre gana
- **Prioridad Google**: Google siempre gana
- **Manual**: Notificar al usuario para decidir

**Registro de Conflictos:**
- Log de cada conflicto
- Decisión tomada
- Valores antes/después
- Usuario afectado

#### Mapeo de Campos

**Vesta ↔ Google Calendar:**

| Campo Vesta | Campo Google Calendar |
|-------------|----------------------|
| Título | Summary |
| Notas | Description |
| Hora inicio | Start DateTime |
| Hora fin | End DateTime |
| Ubicación | Location |
| Contacto | Attendees |
| Tipo de cita | ColorId |
| Estado | Status |

**Datos Exclusivos de Vesta:**
- Propiedad asociada (guardado en description)
- Tiempo de viaje (añadido a description)
- Tipo específico de cita (en extended properties)
- ID de contacto (metadata)

#### Eventos Sincronizados

**De Vesta a Google:**
- Todas las citas programadas
- Actualizaciones de citas
- Cancelaciones
- Reprogramaciones

**De Google a Vesta:**
- Eventos del calendario seleccionado
- Solo eventos del usuario autenticado
- Filtrable por criterios

#### Panel de Control

**Visualización:**
- Estado de conexión (Conectado/Desconectado)
- Última sincronización
- Número de eventos sincronizados
- Errores recientes

**Acciones:**
- Conectar cuenta de Google
- Desconectar
- Forzar sincronización completa
- Ver logs de sincronización
- Configurar preferencias

#### Logs y Debugging

**Registro de Actividad:**
- Cada sincronización registrada
- Timestamp exacto
- Dirección (Vesta→Google o Google→Vesta)
- Campos modificados
- Errores (si los hubo)

**Troubleshooting:**
- Ver eventos que fallaron
- Reintentar sincronización
- Limpiar y re-sincronizar
- Soporte técnico con logs

---

### 3.3 Filtros de Calendario

**📍 Ubicación:**
- `src/components/calendario/appointment-filter.tsx`

**🔍 Filtrado Avanzado de Citas**

#### Filtros Disponibles

**Por Tipo de Cita:**
- ☑️ Todas
- 🏠 Solo Visitas
- 🤝 Solo Reuniones
- ✍️ Solo Firmas
- 🎉 Solo Cierres
- 🚗 Solo Viajes

**Por Estado:**
- ☑️ Todas
- 📅 Programadas
- ✅ Completadas
- ❌ Canceladas
- 🔄 Reprogramadas
- 👻 No asistió

**Por Agente (Multi-selección):**
- Ver citas de uno o varios agentes
- Útil para coordinación de equipo
- Vista de disponibilidad grupal
- Código de colores por agente

**Por Rango de Fechas:**
- Hoy
- Esta semana
- Este mes
- Rango personalizado (date picker)

**Búsqueda de Texto:**
- Por título de cita
- Por nombre de contacto
- Por dirección de propiedad
- Por notas

#### Persistencia de Filtros

**URL State:**
- Filtros guardados en URL
- Compartir links con filtros aplicados
- Navegación back/forward mantiene filtros

**Local Storage:**
- Última configuración de filtros
- Restauración automática al volver
- Por usuario

#### Indicadores Visuales

**Badges de Filtros Activos:**
- Chip por cada filtro aplicado
- Número total de filtros
- Click para remover filtro individual
- Botón "Limpiar todos"

**Contador de Resultados:**
- Número de citas visibles
- Número total de citas
- Porcentaje filtrado

---

### 3.4 Detalle de Cita

**📍 Ubicación:**
- `src/components/appointments/appointment-detail-sheet.tsx`

**📋 Panel Lateral con Información Completa**

#### Visualización

**Diseño:**
- Sheet/Drawer lateral
- Se abre al hacer click en cita
- No interrumpe la vista del calendario
- Cerrar con X o click fuera

**Información Mostrada:**

**Encabezado:**
- Tipo de cita (icono + nombre)
- Estado (badge de color)
- Fecha y hora en formato legible
- Duración total

**Sección Contacto:**
- Avatar y nombre completo
- Teléfono (click to call)
- Email (click to email)
- WhatsApp (click to chat)
- Enlace a perfil completo del contacto

**Sección Propiedad (si aplica):**
- Imagen miniatura
- Título de la propiedad
- Dirección completa
- Precio
- Características principales
- Enlace a detalle de propiedad

**Detalles de la Cita:**
- Agente asignado
- Participantes adicionales
- Tiempo de viaje estimado
- Ubicación / Instrucciones
- Notas internas
- Documentos adjuntos

**Tareas Relacionadas:**
- Tareas vinculadas a esta cita
- Estado de cada tarea
- Crear nueva tarea relacionada

**Historial:**
- Cita creada por X el DD/MM/YYYY
- Modificaciones registradas
- Cambios de estado
- Reprogramaciones previas

#### Acciones Rápidas

**Cambios de Estado:**
- ✅ **Marcar como completada**
  - Pide confirmación
  - Opción de añadir notas post-cita
  - Genera tareas de seguimiento sugeridas

- ❌ **Cancelar**
  - Razón de cancelación (opcional)
  - Notificar al cliente
  - Libera el slot

- 🔄 **Reprogramar**
  - Abre selector de fecha/hora
  - Mantiene toda la información
  - Notifica cambio al cliente

- 👻 **Marcar como "No asistió"**
  - Registro de ausencia
  - Estadísticas de asistencia
  - Tarea de re-contacto automática

**Gestión:**
- ✏️ **Editar**: Abre formulario completo
- 🗑️ **Eliminar**: Con confirmación (solo si tienes permisos)
- 📧 **Enviar recordatorio**: Email/SMS manual
- 📋 **Duplicar**: Crear cita similar
- 📤 **Exportar a calendario**: Generar .ics file

#### Notas Post-Cita

**Al completar una cita:**
- Campo para añadir notas de cómo fue
- 🎤 Transcripción por voz disponible
- 🤖 Resumen automático con IA
- ✅ Extracción de tareas de seguimiento

**Campos sugeridos para Visitas:**
- ⭐ Nivel de interés del cliente (1-5)
- 💬 Feedback del cliente
- ⚠️ Objeciones mencionadas
- ✅ Aspectos que le gustaron
- ❌ Aspectos que no le gustaron
- 📌 Próximos pasos
- 🤝 ¿Quiere hacer oferta? (Sí/No)

#### Permisos

**Quién puede ver:**
- Agente asignado
- Participantes
- Managers y admins
- (Configurable por cuenta)

**Quién puede editar:**
- Agente asignado
- Creador de la cita
- Managers y admins

**Quién puede eliminar:**
- Creador (dentro de 24h)
- Managers y admins

---

## 4. OPERACIONES Y WORKFLOWS

### 4.1 Dashboard de Operaciones

**📍 Ubicación:**
- `src/app/(dashboard)/operaciones/page.tsx`
- `src/components/dashboard/operations/**/*.tsx`

**📊 Centro de Control de la Actividad Comercial**

#### Resumen Ejecutivo (KPIs)

**Métricas en Tiempo Real:**

**🎯 Prospectos Activos**
- Número total de prospectos en pipeline
- Desglose por tipo:
  - Search Prospects (buscando comprar/alquilar)
  - Listing Prospects (queriendo vender/alquilar)
- Variación vs mes anterior (↑↓ %)
- Gráfico de tendencia (últimos 30 días)

**💼 Leads Activos**
- Conexiones activas entre compradores y propiedades
- Estados:
  - Nuevos (sin contactar)
  - Contactados
  - Visita programada
  - Oferta en proceso
- Conversión de lead a deal (%)
- Top agentes por leads

**🤝 Deals en Proceso**
- Operaciones en curso
- Valor total en pipeline (€)
- Estados:
  - Oferta verbal
  - Arras pendientes
  - Bajo contrato
  - Pendiente de cierre
- Comisiones estimadas
- Fecha esperada de cierre

**🏠 Propiedades Publicadas**
- Total de propiedades activas
- Desglose por estado:
  - En venta
  - En alquiler
  - Reservadas
- Publicadas en portales
- Promedio de días en mercado

#### Cola de Trabajo (Work Queue)

**🔥 Tareas Urgentes**
- Tareas con vencimiento en próximos 5 días
- Ordenadas por urgencia (1-5)
- Código de colores:
  - 🔴 Urgencia 5 (Crítico)
  - 🟠 Urgencia 4 (Alto)
  - 🟡 Urgencia 3 (Medio)
  - 🟢 Urgencia 2-1 (Bajo)

**Información por tarea:**
- Título
- Relacionada con (propiedad/contacto/deal)
- Asignada a
- Vencimiento (fecha y horas restantes)
- Estado actual
- Acción rápida de completar

**📅 Citas de Hoy**
- Timeline del día
- Próxima cita destacada
- Tiempo hasta próxima cita
- Preparación requerida
- Ubicación y tiempo de viaje

**Filtros de Work Queue:**
- Por tipo de tarea
- Por urgencia
- Por agente asignado
- Por tipo de cita
- Por entidad relacionada

**Configuración:**
- Número de días para "urgente" (configurable)
- Número de tareas a mostrar
- Ordenación preferida

#### Gráficos y Analytics

**Funnel de Conversión:**
```
Prospectos → Leads → Ofertas → Deals Cerrados
```
- Visualización gráfica del funnel
- Tasas de conversión por etapa
- Identificación de cuellos de botella

**Rendimiento por Agente:**
- Ranking de agentes
- Métricas:
  - Prospectos gestionados
  - Leads activos
  - Visitas realizadas
  - Deals cerrados
  - Comisiones ganadas
- Filtrable por período

**Actividad Reciente:**
- Timeline de últimas acciones
- Propiedades nuevas captadas
- Deals cerrados
- Leads nuevos
- Visitas completadas

#### Acciones Rápidas

**Botones de Acceso Rápido:**
- ➕ **Crear Propiedad**: Formulario de nueva propiedad
- 👤 **Crear Contacto**: Nuevo contacto
- 📅 **Programar Cita**: Nueva cita
- ✅ **Nueva Tarea**: Crear tarea
- 🎯 **Nuevo Prospecto**: Captar nuevo prospecto
- 🤝 **Nuevo Deal**: Iniciar operación

**Widgets Personalizables:**
- Añadir/quitar widgets
- Reordenar por drag & drop
- Ajustar tamaños
- Configurar métricas mostradas

---

### 4.2 Prospectos (Ofertas y Demandas)

**📍 Ubicación:**
- `src/app/(dashboard)/operaciones/prospects/page.tsx`
- `src/components/prospects/prospect-kanban.tsx`

**🎯 Gestión de Pipeline de Prospectos**

#### Dos Tipos de Prospectos

**1️⃣ Search Prospects (Demanda)**
Personas **buscando** comprar o alquilar una propiedad.

**2️⃣ Listing Prospects (Oferta)**
Personas que **quieren vender o alquilar** su propiedad.

#### Vista Kanban

**Columnas de Estado:**

**Para Search Prospects:**
1. **Información Básica**: Datos iniciales capturados
2. **En Búsqueda**: Buscando propiedades activamente
3. **Visitas Programadas**: Con visitas agendadas
4. **Negociación**: En proceso de oferta
5. **Deal Creado**: Pasó a operación
6. **Archivado**: Descartado o inactivo

**Para Listing Prospects:**
1. **Información Básica**: Contacto inicial
2. **Valoración Pendiente**: Agendada o por agendar
3. **Valoración Completada**: Precio estimado
4. **Hoja de Encargo**: En proceso de firma
5. **Propiedad Creada**: Ya es listing activo
6. **Archivado**: Descartado

**Funcionalidades del Kanban:**
- 🖱️ **Drag & Drop**: Arrastrar tarjetas entre columnas
- 📊 **Contador por columna**: Número de prospectos en cada estado
- 🎨 **Código de colores** por urgencia
- 🔍 **Búsqueda** dentro del Kanban
- 📤 **Filtros** laterales

#### Información de Search Prospects

**Criterios de Búsqueda:**

**Operación:**
- Venta
- Alquiler
- Venta o Alquiler (flexible)

**Tipo de Propiedad:**
- Piso
- Casa/Chalet
- Local comercial
- Garaje
- Solar/Terreno
- Indiferente

**Ubicación:**
- 🏙️ **Ciudades preferidas**: Multi-selección
- 🗺️ **Áreas/Barrios**: Zonas específicas
- 📍 **Radio desde punto**: Km desde ubicación

**Rango de Precio:**
- Precio mínimo (€)
- Precio máximo (€)
- Flexibilidad (+/- %)

**Características Mínimas:**
- 🛏️ Dormitorios (min)
- 🚿 Baños (min)
- 📐 Metros cuadrados (min - max)
- 🏢 Planta mínima
- 🏢 Planta máxima

**Extras Requeridos:**
- Ascensor (Sí/No/Indiferente)
- Terraza (Sí/No/Indiferente)
- Garaje (Sí/No/Indiferente)
- Trastero (Sí/No/Indiferente)
- Piscina (Sí/No/Indiferente)
- Jardín (Sí/No/Indiferente)

**Timing y Financiación:**
- 📅 **Fecha deseada de mudanza**
- 💰 **Financiación lista**: Sí/No/En proceso
- 💳 **Tipo de financiación**: Hipoteca/Contado/Mixto
- 💵 **Presupuesto pre-aprobado**: (€)

**Nivel de Compromiso:**
- 🔥 **Urgencia**: 1 (explorando) a 5 (urgente)
- ⭐ **Calidad del lead**: 1-5
- 📞 **Método de contacto preferido**

**Notas del Agente:**
- Observaciones
- Preferencias específicas
- Deal-breakers
- Situación personal

#### Información de Listing Prospects

**Datos de la Propiedad a Vender/Alquilar:**
- Dirección
- Tipo de propiedad
- Características básicas
- Estado de conservación

**Situación del Propietario:**
- **Motivo de venta/alquiler**:
  - Mudanza
  - Divorcio
  - Herencia
  - Inversión
  - Necesidad económica
  - Upgrade/Downgrade
  - Otro

- **Urgencia** (1-5)
- **Precio esperado** (€)
- **¿Precio flexible?**: Sí/No
- **¿Tiene hipoteca?**: Sí/No
- **Cantidad pendiente** (si aplica)

**Disponibilidad:**
- ¿Está ocupado?
- ¿Inquilinos actuales?
- Fecha disponible para visitas
- Fecha disponible para entrega

**Valoración:**
- **Estado**: Pendiente/Agendada/Completada
- **Fecha de valoración**
- **Precio de valoración** (€)
- **Notas de valoración**
- **Agente valorador**

**Hoja de Encargo:**
- **Estado**: No iniciada/En negociación/Firmada
- **Fecha de firma**
- **Duración del encargo** (meses)
- **Tipo**: Exclusiva/Abierta
- **Comisión acordada** (%)
- **Precio de salida** (€)

**Documentación:**
- ¿Tiene escrituras?
- ¿Tiene certificado energético?
- ¿Tiene IBI al día?
- ¿Tiene cédula de habitabilidad?

#### Gestión de Prospectos

**Acciones Disponibles:**
- ✏️ **Editar información**
- 🔄 **Cambiar estado** (manual o drag & drop)
- 📝 **Añadir nota**
- ✅ **Crear tarea** relacionada
- 📅 **Programar cita**
- 🏠 **Convertir a propiedad** (Listing Prospects)
- 🤝 **Crear deal** (Search Prospects)
- 🗑️ **Archivar**

**Cambio de Estado:**
- Click en estado actual
- Seleccionar nuevo estado
- **Razón de cambio** (opcional pero recomendado)
- Guardar

**Razones de cambio comunes:**
- Avance natural del proceso
- Cliente encontró alternativa
- No cumple requisitos
- Presupuesto insuficiente
- Ya no está interesado
- Se mudó/cambió de planes
- Firmó con competencia

**Historial de Cambios:**
- Todos los cambios de estado registrados
- Usuario que hizo el cambio
- Timestamp
- Razón documentada
- Estado anterior → Estado nuevo

---

### 4.3 Conexiones Potenciales (Match System)

**📍 Ubicación:**
- `src/components/prospects/conexiones-potenciales.tsx`
- `src/server/queries/connection-matches.ts`

**🔗 Sistema Inteligente de Matching Automático**

Este es uno de los módulos más innovadores de Vesta: cruza automáticamente los prospectos de demanda (buscando comprar/alquilar) con las propiedades disponibles.

#### Funcionamiento del Algoritmo

**Criterios de Matching:**

El sistema compara cada Search Prospect con todas las propiedades disponibles según:

1. **Tipo de Operación**
   - Venta vs Venta
   - Alquiler vs Alquiler
   - Match exacto requerido

2. **Tipo de Propiedad**
   - Piso, Casa, Local, etc.
   - Si el prospecto marca "Indiferente", matchea con todos

3. **Ubicación**
   - Ciudades preferidas del prospecto
   - Áreas/Barrios específicos
   - Match si la propiedad está en ubicación deseada

4. **Rango de Precio**
   - Precio de propiedad dentro del rango del prospecto
   - Considerando flexibilidad (+/- %)

5. **Características Mínimas**
   - Dormitorios: propiedad >= mínimo requerido
   - Baños: propiedad >= mínimo requerido
   - M²: propiedad dentro del rango (min-max)
   - Planta: dentro del rango aceptable

6. **Extras Requeridos**
   - Si prospecto requiere ascensor, propiedad debe tenerlo
   - Si requiere garaje, propiedad debe incluirlo
   - Si marca "Indiferente", no se considera

#### Niveles de Match

**🎯 Match Estricto (Strict Match)**
- Cumple **TODOS** los criterios
- 100% compatible según filtros
- Alta probabilidad de interés

**🎯 Match Cercano (Close Match)**
- Cumple la mayoría de criterios (80%+)
- Pequeñas desviaciones en:
  - Precio ligeramente fuera de rango
  - 1 dormitorio menos del deseado
  - Ubicación cercana pero no exacta
- Merece consideración

#### Scoring de Compatibilidad

Cada match recibe un score de 0-100:

**Factores que aumentan el score:**
- ✅ Match exacto de tipo de propiedad: +20
- ✅ Dentro del rango de precio ideal: +25
- ✅ Ubicación preferida: +15
- ✅ Cumple características mínimas: +10
- ✅ Tiene todos los extras: +10
- ✅ Dentro de presupuesto pre-aprobado: +10
- ✅ Disponibilidad alineada con fecha deseada: +10

**Penalizaciones:**
- ⚠️ Precio en límite superior: -5
- ⚠️ 1 dormitorio menos: -10
- ⚠️ Sin extra deseado: -5
- ⚠️ Ubicación cercana pero no exacta: -10

#### Vista de Conexiones Potenciales

**Diseño:**
- Vista agrupada por prospecto
- Cada prospecto muestra sus matches
- Ordenado por score de compatibilidad
- Código de colores visuales

**Información Mostrada:**

**Por Prospecto:**
- Nombre del contacto
- Avatar
- Criterios de búsqueda (resumen)
- Nivel de urgencia
- Número de matches encontrados

**Por Match:**
- Imagen de la propiedad
- Título y dirección
- Precio
- Características principales (dormitorios, baños, m²)
- Score de compatibilidad (%)
- Badge de nivel de match (Estricto/Cercano)
- Razones del match

**Ejemplo de visualización:**
```
👤 Juan Pérez (Urgencia: 5/5)
   Buscando: Piso, 3 dorm, 200k-250k€, Madrid Centro

   Matches encontrados: 8

   1. 🏠 Piso en Calle Mayor, 28013 Madrid
      98% compatible - MATCH ESTRICTO
      3 dorm | 2 baños | 95m² | 240,000€
      ✅ Precio ideal
      ✅ Ubicación perfecta
      ✅ Características exactas
      [Ver Propiedad] [Compartir con Cliente] [Programar Visita]

   2. 🏠 Piso en Calle Atocha, 28012 Madrid
      85% compatible - MATCH CERCANO
      2 dorm | 2 baños | 90m² | 235,000€
      ✅ Precio ideal
      ✅ Ubicación perfecta
      ⚠️ 1 dormitorio menos del deseado
      [Ver Propiedad] [Compartir con Cliente] [Programar Visita]
```

#### Filtros Avanzados

**Por Scope (Alcance):**
- **Mi cuenta**: Solo propiedades de tu agencia
- **Otras cuentas**: Propiedades de otras agencias en Vesta (para compartir/co-venta)
- **Todas**: Ambas opciones

**Por Tipo de Propiedad:**
- Piso
- Casa
- Local
- Garaje
- Solar
- Todos

**Por Ubicación:**
- Ciudad específica
- Múltiples ciudades
- Todas las ubicaciones

**Por Tipo de Prospecto:**
- Venta
- Alquiler
- Todos

**Por Tipo de Operación:**
- En Venta
- En Alquiler
- Ambos

**Por Estado:**
- Activos
- Todos los estados

**Por Nivel de Urgencia:**
- Alta urgencia (4-5)
- Media urgencia (3)
- Baja urgencia (1-2)
- Todas

**Por Nivel de Match:**
- Solo matches estrictos (>90%)
- Matches cercanos (80-90%)
- Todos los matches (>70%)

#### Acciones sobre Matches

**Compartir Propiedad:**
- 📧 **Enviar por email**: Genera email con detalles de la propiedad
- 💬 **Enviar por WhatsApp**: Link directo a la propiedad
- 📱 **SMS**: Mensaje de texto con enlace
- 📋 **Copiar enlace**: Para compartir manualmente

**Programar Visita:**
- Crear cita automáticamente
- Prospecto → seleccionado como contacto
- Propiedad → pre-seleccionada
- Tipo → "Visita"
- Sugerir horarios disponibles

**Crear Lead:**
- Convertir match en lead formal
- Registrar interés del cliente
- Iniciar tracking de seguimiento
- Asignar a agente

**Feedback de Match:**
- ✅ **Cliente interesado**: Marca como good match
- ❌ **Cliente no interesado**: Marca como not a match
- 📝 **Añadir nota**: Razón del interés/desinterés
- **Machine Learning**: Mejora futuros matches

#### Compartir Entre Cuentas (Co-Venta)

**Funcionalidad única de Vesta:**

Si una agencia A tiene un prospecto y otra agencia B tiene la propiedad perfecta:

**Proceso:**
1. Agencia A ve matches de otras cuentas
2. Solicita compartir propiedad
3. Agencia B recibe notificación
4. Agencia B acepta/rechaza
5. Si acepta:
   - Agencia A recibe acceso a detalles
   - Se registra como "shared listing"
   - Acuerdo de comisión compartida
   - Ambas agencias trackean el lead

**Beneficios:**
- Más oportunidades de venta
- Red de colaboración
- Comisiones compartidas
- Mejor servicio al cliente

**Registro de Compartidos:**
- Fecha de compartido
- Agencias involucradas
- División de comisión acordada
- Estado del lead compartido
- Historial de comunicación

#### Vista Agrupada

**Por Prospecto (Vista Principal):**
- Agrupa todas las propiedades que matchean con cada prospecto
- Fácil ver qué opciones tiene cada cliente
- Priorizar por urgencia del prospecto

**Por Contacto:**
- Agrupa todos los prospectos del mismo contacto
- Útil si un contacto tiene múltiples búsquedas
- Vista consolidada de todas sus necesidades

**Por Propiedad:**
- Invierte la lógica: muestra qué prospectos matchean con cada propiedad
- Útil para propiedades que necesitas vender urgente
- Identifica compradores potenciales

#### Notificaciones Automáticas

**Nuevos Matches:**
- Cuando se crea nuevo prospecto → busca matches inmediato
- Cuando se publica nueva propiedad → busca matches
- Notificación al agente asignado
- Email diario con resumen de nuevos matches

**Match Perfecto (100%):**
- Alerta especial cuando hay match perfecto
- Notificación prioritaria
- Sugerencia automática de contactar al cliente
- Tarea creada automáticamente

---

### 4.4 Leads (Conexiones Buyer-Property)

**📍 Ubicación:**
- `src/app/(dashboard)/operaciones/leads/page.tsx`
- `src/components/leads/lead-table.tsx`

**💼 Gestión del Pipeline de Leads**

Un Lead en Vesta representa la conexión activa entre un comprador/inquilino (contacto) y una propiedad específica.

#### ¿Cuándo se crea un Lead?

- Cliente expresa interés en una propiedad específica
- Se programa una visita
- Se envía una propiedad al cliente y responde positivamente
- Desde sistema de matching (Conexiones Potenciales)
- Manualmente por el agente

#### Estados del Lead

**Progresión típica:**

1. **Nuevo**
   - Lead recién creado
   - Cliente aún no contactado sobre esta propiedad
   - Acción: Contactar al cliente

2. **Contactado**
   - Cliente informado de la propiedad
   - Interés inicial confirmado
   - Acción: Programar visita

3. **Calificado**
   - Cliente verificado (presupuesto, necesidades, timing)
   - Lead de calidad confirmado
   - Acción: Avanzar en el proceso

4. **Visita Programada**
   - Cita agendada para ver la propiedad
   - Preparación en curso
   - Acción: Realizar visita

5. **Visita Completada**
   - Cliente vio la propiedad
   - Feedback recogido
   - Acción: Seguimiento post-visita

6. **Negociación**
   - Cliente interesado seriamente
   - Discusión de precio/condiciones
   - Acción: Presentar/recibir oferta

7. **Oferta Recibida**
   - Cliente hizo oferta formal
   - En espera de respuesta del vendedor
   - Acción: Gestionar negociación

8. **Deal Creado**
   - Oferta aceptada
   - Convertido a operación formal
   - Lead se convierte en Deal

9. **Cerrado Ganado**
   - Operación completada exitosamente
   - Comisión ganada
   - Lead marcado como exitoso

10. **Cerrado Perdido**
    - Lead no prosperó
    - Razón documentada
    - Aprendizajes registrados

#### Información del Lead

**Datos Básicos:**
- Contacto (comprador)
- Propiedad de interés
- Fecha de creación
- Estado actual
- Agente asignado
- Fuente del lead

**Fuentes Posibles:**
- Portal inmobiliario (Fotocasa, Idealista, etc.)
- Referido por cliente
- Redes sociales
- Publicidad online
- Visita a oficina
- Llamada entrante
- Email
- Evento
- Sistema de matching de Vesta
- Otro

**Tracking de Visitas:**
- 📅 **Visitas programadas**: Número de citas agendadas
- ✅ **Visitas completadas**: Cuántas se realizaron
- ❌ **Visitas canceladas**: Cuántas se cancelaron
- 👻 **Visitas perdidas**: No shows

**Ofertas:**
- 💰 **Oferta realizada**: Sí/No
- 💵 **Monto de oferta**: (€)
- ✅ **Oferta aceptada**: Sí/No/Pendiente
- 📊 **Porcentaje vs precio**: % sobre precio de venta
- 📝 **Condiciones de la oferta**: Texto libre

**Notas y Comentarios:**
- Observaciones del agente
- Feedback del cliente
- Objeciones
- Preferencias
- Historial de interacciones

#### Vista de Tabla de Leads

**Columnas:**
- 👤 **Contacto**: Nombre con avatar
- 🏠 **Propiedad**: Título y dirección
- 💰 **Precio de propiedad**: Precio actual
- 💵 **Oferta**: Monto ofertado (si existe)
- 📊 **Estado**: Badge con color
- 📅 **Próxima visita**: Fecha de próxima cita
- 📈 **Progreso**: Barra de progreso visual
- 🚩 **Badges**: Indicadores visuales
- 👨‍💼 **Agente**: Asignado
- ⚙️ **Acciones**: Menú de acciones rápidas

**Badges Visuales:**

- 🟢 **Visita Próxima**: Tiene visita en próximos 3 días
- 🔴 **Visita Perdida**: Tuvo un no-show
- 💰 **Oferta Realizada**: Cliente ha hecho oferta
- ⭐ **Alta Prioridad**: Urgencia alta
- 🔥 **Hot Lead**: Múltiples visitas + feedback positivo

#### Filtros de Leads

**Por Estado de Badge:**
- Solo con visita próxima
- Solo con visita perdida
- Solo con oferta realizada
- Solo alta prioridad
- Solo hot leads

**Por Estado del Lead:**
- Todos
- Solo nuevos
- Solo contactados
- Solo calificados
- Solo en negociación
- Solo con oferta
- Cerrados ganados
- Cerrados perdidos

**Por Fuente:**
- Todas las fuentes
- Portal específico
- Referidos
- Matching Vesta
- Etc.

**Por Agente:**
- Mis leads
- De un agente específico
- De todo el equipo
- Sin asignar

**Por Estado Activo:**
- Solo activos
- Solo inactivos
- Todos

#### Acciones sobre Leads

**Cambiar Estado:**
- Seleccionar nuevo estado
- Razón del cambio (opcional)
- Timestamp automático
- Historial guardado

**Programar Visita:**
- Crea cita automáticamente
- Contacto y propiedad pre-llenados
- Tipo "Visita"

**Registrar Oferta:**
- Monto de oferta
- Condiciones
- Fecha de oferta
- Estado (pendiente/aceptada/rechazada)
- Notificar a propietario

**Convertir a Deal:**
- Si oferta aceptada
- Inicia proceso de operación formal
- Mantiene todo el historial
- Lead pasa a "Deal Creado"

**Añadir Nota:**
- Comentario sobre el lead
- Interacciones con el cliente
- Actualizaciones de estado
- Feedback de visitas

**Asignar/Reasignar:**
- Cambiar agente responsable
- Notificación al nuevo agente
- Historial de reasignaciones

#### Métricas de Leads

**Tasa de Conversión:**
```
Nuevos → Visita → Oferta → Deal → Cerrado
```
- Porcentaje en cada etapa
- Identificar cuellos de botella
- Benchmark por agente

**Tiempo Promedio:**
- De nuevo a primera visita
- De visita a oferta
- De oferta a deal
- Ciclo completo

**Análisis por Fuente:**
- Qué fuentes generan mejores leads
- Tasa de conversión por fuente
- ROI de cada canal

**Rendimiento por Agente:**
- Leads activos
- Tasa de conversión
- Tiempo promedio de cierre
- Comisiones generadas

---

### 4.5 Deals (Operaciones Formales)

**📍 Ubicación:**
- `src/server/db/schema.ts` (tabla `deals`)
- `src/server/queries/deal.ts`

**🤝 Gestión Completa del Ciclo de Cierre**

Un Deal es una operación formal de compraventa o alquiler que está en proceso de cierre. Es la etapa más avanzada del funnel.

#### Estados del Deal

**1. Oferta**
- Oferta verbal o escrita
- En negociación
- Aún no hay compromiso firme

**2. Arras Pendientes**
- Oferta aceptada
- Pendiente de firma de arras
- Pre-contrato en preparación

**3. Bajo Contrato**
- Arras firmadas
- Contrato vinculante
- En proceso de cierre

**4. Cerrado**
- Operación completada
- Escritura firmada
- Llaves entregadas
- Comisión cobrada

**5. Perdido/Cancelado**
- Deal no prosperó
- Razón documentada
- Análisis post-mortem

#### Información Financiera Completa

**Precios y Comisiones:**
- 💰 **Precio final acordado** (€)
- 📊 **Porcentaje de comisión** (%)
- 💵 **Monto de comisión** (€ calculado)
- 📅 **Fecha esperada de pago de comisión**
- ✅ **Comisión cobrada** (Sí/No)
- 💳 **Forma de pago de comisión**

**Arras (Señal):**
- 💰 **Monto de arras** (€)
- 📝 **Tipo de arras**:
  - **Confirmatorias**: Si no se cumple, se devuelve + penalización
  - **Penitenciales**: Si comprador se retira, pierde arras. Si vendedor se retira, devuelve el doble
- 📅 **Fecha de firma de arras**
- 📄 **Contrato de arras** (documento adjunto)

**Gastos Asociados:**
- ⚖️ **Gastos notariales** (€)
- 📋 **Gastos de registro** (€)
- 💸 **Impuestos**:
  - IVA (para obra nueva): (%)
  - ITP (para segunda mano): (%)
  - Monto total de impuestos (€)

**Financiación (si aplica):**
- 🏦 **¿Requiere hipoteca?**: Sí/No
- 🏦 **Banco**
- 💰 **Monto de hipoteca** (€)
- 📊 **LTV (Loan-to-Value)** (%)
- ✅ **Estado de aprobación**:
  - Pre-aprobada
  - En proceso
  - Aprobada
  - Rechazada
- 📅 **Deadline de aprobación**

#### Timeline y Milestones

**Fechas Clave:**
- 📅 **Fecha de oferta inicial**
- 📅 **Fecha de aceptación de oferta**
- 📅 **Fecha de firma de arras** (realizada)
- 📅 **Fecha esperada de escritura**
- 📅 **Fecha real de escritura**
- 📅 **Fecha de entrega de llaves**
- 📅 **Deadline de financiación**
- 📅 **Fecha de expiración de contingencias**

**Contingencias:**
- 🏠 **Inspección de propiedad**
- 💰 **Aprobación de financiación**
- 📄 **Verificación de títulos**
- 🏛️ **Permisos y licencias**
- 🏡 **Venta de propiedad actual** (del comprador)
- ⚖️ **Revisión legal**

**Estado de Contingencias:**
- ⏳ Pendiente
- ✅ Resuelta
- ❌ Fallida
- 🕐 En proceso

#### Partes Involucradas

**Compradores/Inquilinos:**
- Contacto principal
- Co-compradores (si aplica)
- Datos de contacto
- Abogado del comprador
- Banco (si hipoteca)

**Vendedor/Propietario:**
- Contacto principal
- Co-propietarios (si aplica)
- Abogado del vendedor
- Banco (si tiene hipoteca)

**Profesionales:**
- 👨‍⚖️ **Notario**: Nombre, contacto, dirección
- 🏛️ **Registro de la Propiedad**
- 👨‍💼 **Gestoría**
- 🏦 **Banco (hipoteca)**

**Agentes Vesta:**
- 👨‍💼 **Agente captador**: Quien captó la propiedad
- 👨‍💼 **Agente vendedor**: Quien trajo al comprador
- 📊 **División de comisiones** (%):
  - Agente captador: X%
  - Agente vendedor: Y%
  - Agencia: Z%

#### Estados de Procesos

**Financiación:**
- 📝 Solicitud presentada
- 🔍 En evaluación
- ⏳ Pendiente de documentación
- ✅ Pre-aprobada
- ✅ Aprobada
- ❌ Rechazada

**Inspección:**
- ⏳ Pendiente de agendar
- 📅 Agendada
- ✅ Completada - Sin problemas
- ⚠️ Completada - Problemas menores
- ❌ Completada - Problemas graves

**Verificación de Títulos:**
- ⏳ No iniciada
- 🔍 En revisión
- ✅ Limpia
- ⚠️ Con cargas (especificar)
- ❌ Problemas legales

**Documentos:**
- ✅ **Documentos completos**: Todos listos
- ⏳ **Pendiente de documentación**: Falta algo
- 📋 **Checklist**:
  - DNI/NIE comprador(es)
  - Escritura actual
  - Nota simple actual
  - Certificado energético
  - Cédula de habitabilidad
  - IBI al día
  - Comunidad al día
  - Certificado de no deudas
  - Planos (si aplica)
  - Licencias (si aplica)

**Nivel de Riesgo:**
- 🟢 **Bajo**: Todo en orden, alta probabilidad de cierre
- 🟡 **Medio**: Algunas contingencias pendientes
- 🔴 **Alto**: Problemas significativos, riesgo de caída

#### Notas y Detalles

**Notas Generales:**
- Observaciones del proceso
- Acuerdos verbales
- Detalles especiales
- Recordatorios

**Condiciones Especiales:**
- Mobiliario incluido
- Reparaciones acordadas
- Plazo especial de entrega
- Otros acuerdos

**Notas de Contingencias:**
- Detalles de cada contingencia
- Problemas identificados
- Resoluciones acordadas

#### Cancelación de Deal

Si el deal se cae, registrar:

**Razón de Cancelación:**
- Financiación rechazada
- Inspección reveló problemas graves
- Comprador se retractó
- Vendedor se retractó
- Problemas legales con la propiedad
- Cambio en circunstancias personales
- Encontró otra propiedad
- Otra razón

**Parte Culpable:**
- Comprador
- Vendedor
- Banco
- Circunstancias externas
- Mutuamente acordado

**Disposición de las Arras:**
- Devueltas al comprador
- Retenidas por vendedor
- Devueltas doble al comprador
- En disputa legal

**Fecha de Cancelación**

**Aprendizajes:**
- ¿Qué salió mal?
- ¿Se pudo prevenir?
- Notas para futuros deals

#### Referidos y Partners

**Si el deal vino de referido:**
- 🤝 **Fuente de referido**
- 👤 **Partner de referido**
- 💵 **Fee de referido** (€ o %)
- ✅ **Fee pagado**: Sí/No
- 📅 **Fecha de pago de fee**

#### Documentos del Deal

**Documentos Generados/Gestionados:**
- 📄 Contrato de arras
- 📄 Contrato de compraventa
- 📄 Escritura pública
- 📄 Recibos de pagos
- 📄 Certificados requeridos
- 📄 Comunicaciones oficiales
- 📄 Acuerdos adicionales

**Sistema de Documentos:**
- Subida de archivos
- Categorización
- Versionado
- Firmas digitales
- Compartir con partes involucradas

#### Acciones sobre Deals

**Actualizar Estado:**
- Cambio de fase
- Razón del cambio
- Notificaciones automáticas

**Registrar Pago:**
- Arras
- Comisión
- Fees de referidos
- Gastos varios

**Completar Contingencia:**
- Marcar como resuelta
- Adjuntar documentación
- Notas de resolución

**Programar Firma:**
- Escritura
- Arras
- Otros documentos

**Generar Documentos:**
- Contratos pre-llenados
- Recibos
- Confirmaciones

**Cerrar Deal:**
- Marcar como cerrado
- Fecha de cierre
- Notas finales
- Lecciones aprendidas
- Solicitar testimonio al cliente

---

## 5. TAREAS Y PRODUCTIVIDAD

### 5.1 Sistema de Tareas

**📍 Ubicación:**
- `src/server/queries/task.ts`
- `src/components/tasks/global-task-modal.tsx`

**✅ Gestión Completa de To-Dos**

#### Información de Tareas

**Datos Básicos:**
- ✏️ **Título**: Descripción corta (máx 60 caracteres)
- 📝 **Descripción**: Detalles completos
- 📅 **Fecha de vencimiento**
- ⏰ **Hora de vencimiento** (opcional)
- 🔥 **Urgencia**: 1 (baja) a 5 (crítica)
- 📂 **Categoría**

**Categorías de Tareas:**
- 📞 **Llamar**: Llamadas telefónicas
- ✉️ **Email**: Enviar emails
- 📄 **Documentación**: Gestionar documentos
- 🏠 **Propiedad**: Relacionadas con propiedades
- 👤 **Contacto**: Relacionadas con contactos
- 📅 **Cita**: Preparación/seguimiento de citas
- 💰 **Financiero**: Pagos, comisiones, facturas
- 📊 **Reporting**: Reportes y análisis
- 🔧 **Admin**: Tareas administrativas
- 🎯 **Seguimiento**: Follow-ups
- ✨ **Otro**: Otros tipos

**Estados de Tarea:**
- 📋 **Backlog**: Por hacer, no prioritaria
- 🚧 **Blocked**: Bloqueada por algo
- ✅ **Ready**: Lista para hacerse
- 🏃 **In Progress**: En curso
- 🔍 **Validation**: Esperando validación
- ✅ **Finished**: Completada

**Relaciones (Polimórficas):**
Una tarea puede estar relacionada con:
- 🏠 **Propiedad**
- 👤 **Contacto**
- 🔗 **Listing-Contact** (conexión específica)
- 🤝 **Deal**
- 📅 **Cita**
- 🎯 **Prospecto**
- 📊 **Actividad**

**Asignación:**
- 👨‍💼 **Asignado a**: Usuario responsable
- 👤 **Creado por**: Quien creó la tarea
- ✅ **Completado por**: Quien la marcó completa
- ✏️ **Editado por**: Último editor

#### Creación de Tareas

**Manual:**
- Formulario de tarea
- Todos los campos personalizables
- Relaciones seleccionables

**Automática:**
- Al crear propiedad (tareas predefinidas)
- Desde notas con IA (extracción automática)
- Al completar cita (tareas de seguimiento)
- Desde comentarios
- Triggers configurables

**Desde Contexto:**
- Botón "Crear tarea" en detalle de propiedad → pre-rellena propiedad
- Botón "Crear tarea" en detalle de contacto → pre-rellena contacto
- Desde calendario → pre-rellena cita
- Desde prospecto → pre-rellena prospecto

#### Vista de Tareas

**Filtros:**
- **Por usuario**:
  - Mis tareas
  - Tareas asignadas a mí
  - Tareas creadas por mí
  - Tareas de un usuario específico
  - Todas las tareas del equipo

- **Por estado**:
  - Pendientes (Backlog + Ready + In Progress)
  - En progreso
  - Bloqueadas
  - Completadas
  - Todos los estados

- **Por urgencia**:
  - Solo críticas (5)
  - Altas (4-5)
  - Medias (3)
  - Bajas (1-2)
  - Todas

- **Por fecha de vencimiento**:
  - Vencidas
  - Hoy
  - Esta semana
  - Este mes
  - Sin fecha
  - Todas

- **Por categoría**:
  - Categoría específica
  - Múltiples categorías
  - Todas

- **Por entidad relacionada**:
  - De una propiedad específica
  - De un contacto específico
  - De un deal específico
  - De un prospecto específico
  - Sin relación
  - Todas

**Ordenación:**
- Por urgencia (descendente)
- Por fecha de vencimiento (ascendente)
- Por fecha de creación
- Por estado
- Por asignado a

**Vistas:**
- 📋 **Lista**: Vista de lista tradicional
- 📊 **Kanban**: Vista por estados (drag & drop)
- 📅 **Calendario**: Vista en calendario por vencimiento

#### Acciones sobre Tareas

**Marcar como Completada:**
- Click en checkbox
- Timestamp automático
- Usuario completado registrado
- Notificación al creador (si es distinto)
- Movida a "Finished"

**Editar Tarea:**
- Modificar cualquier campo
- Historial de cambios
- Última edición registrada

**Reasignar:**
- Cambiar usuario asignado
- Notificación al nuevo asignado
- Comentario opcional de por qué se reasigna

**Cambiar Estado:**
- Mover entre estados
- Razón del cambio (opcional)
- Historial de transiciones

**Bloquear Tarea:**
- Marcar como bloqueada
- Razón del bloqueo (requerido)
- Desbloquear cuando se resuelva

**Eliminar:**
- Solo creador o admin
- Confirmación requerida
- Soft delete (recuperable)

**Duplicar:**
- Crear tarea similar
- Mantiene campos excepto estado
- Útil para tareas recurrentes

---

### 5.2 Tareas Automáticas al Crear Propiedad

**📍 Ubicación:**
- `src/server/actions/property-tasks.ts`
- `src/server/actions/task-preferences.ts`

**🤖 Automatización del Workflow de Captación**

Cuando creas una nueva propiedad, Vesta puede generar automáticamente una serie de tareas para asegurar que no se olvide ningún paso del proceso.

#### Tareas Predefinidas

**1. Subir Fotos Profesionales**
- Urgencia: 4
- Vencimiento: 7 días desde creación
- Categoría: Propiedad
- Descripción: "Programar sesión de fotos profesionales y subir imágenes de alta calidad"

**2. Completar Información**
- Urgencia: 4
- Vencimiento: 7 días
- Categoría: Documentación
- Descripción: "Verificar y completar todos los campos de la propiedad: características, amenidades, descripción"

**3. Programar Visita de Valoración**
- Urgencia: 3
- Vencimiento: 10 días
- Categoría: Cita
- Descripción: "Programar visita para valoración profesional de la propiedad"

**4. Recoger Llaves**
- Urgencia: 3
- Vencimiento: 10 días
- Categoría: Propiedad
- Descripción: "Coordinar con propietario para recoger llaves y hacer copia"

**5. Realizar Valoración**
- Urgencia: 3
- Vencimiento: 10 días
- Categoría: Propiedad
- Descripción: "Completar valoración de mercado y establecer precio de venta recomendado"

**6. Crear Hoja de Encargo**
- Urgencia: 3
- Vencimiento: 12 días
- Categoría: Documentación
- Descripción: "Preparar hoja de encargo con términos acordados"

**7. Firmar Hoja de Encargo**
- Urgencia: 4
- Vencimiento: 14 días
- Categoría: Documentación
- Descripción: "Reunión con propietario para firma de hoja de encargo"

**8. Generar Cartel**
- Urgencia: 2
- Vencimiento: 16 días
- Categoría: Propiedad
- Descripción: "Diseñar y generar cartel inmobiliario para promoción"

#### Configuración de Tareas Automáticas

**Panel de Preferencias por Cuenta:**
- Acceso desde Account Admin > Configuración

**Por cada tipo de tarea:**
- ✅ **Habilitada**: Sí/No (toggle)
- 📅 **Días de vencimiento**: Personalizable
- 🔥 **Urgencia por defecto**: 1-5
- 📝 **Descripción personalizada**: Editable

**Configuración Guardada:**
- Por cuenta (no por usuario)
- Afecta a todas las propiedades nuevas
- No afecta propiedades existentes
- Modificable en cualquier momento

**Activación/Desactivación Individual:**
- Puedes desactivar tareas que no uses
- Ej: Si no haces carteles, desactiva "Generar Cartel"
- Si tienes proceso diferente, ajusta días de vencimiento

#### Beneficios

- ✅ **Nunca olvidar pasos críticos**
- 📊 **Workflow estandarizado** para todo el equipo
- ⏱️ **Ahorro de tiempo**: No crear tareas manualmente
- 📈 **Mejor seguimiento**: Todas las propiedades siguen el mismo proceso
- 🎯 **Accountability**: Claro quién debe hacer qué y cuándo

---

## 6. DOCUMENTOS Y ARCHIVOS

### 6.1 Sistema de Documentos

**📍 Ubicación:**
- `src/server/queries/document.ts`
- `src/app/api/properties/[id]/documents/route.ts`

**📄 Gestión Documental Completa con AWS S3**

#### Almacenamiento en la Nube

**AWS S3:**
- Almacenamiento seguro y escalable
- Redundancia y backup automático
- Acceso rápido desde cualquier ubicación
- Encriptación de datos en reposo
- URLs firmadas con expiración

#### Tipos de Documentos Soportados

**Documentos:**
- PDF
- DOC/DOCX
- XLS/XLSX
- TXT
- RTF

**Imágenes:**
- JPG/JPEG
- PNG
- WEBP
- HEIC
- GIF

**Otros:**
- ZIP (archivos comprimidos)
- Cualquier formato (validación configurable)

#### Categorización por Etiquetas

**Etiquetas Predefinidas:**
- 📋 **contract**: Contratos y acuerdos
- 🆔 **ID**: Documentos de identificación (DNI, NIE, Pasaporte)
- ✍️ **deed**: Escrituras públicas
- ⚡ **energy_certificate**: Certificados energéticos
- 📐 **floor_plan**: Planos arquitectónicos
- 🏛️ **cadastral**: Referencias catastrales
- 💰 **financial**: Documentación financiera
- 📸 **photos**: Fotografías adicionales
- 🖼️ **poster**: Carteles generados
- 📝 **notes**: Notas y apuntes
- 🏢 **community**: Documentos de comunidad
- 🔧 **maintenance**: Mantenimiento y reparaciones
- ⚖️ **legal**: Documentos legales
- 📊 **report**: Informes y reportes
- 📎 **other**: Otros documentos

#### Metadatos de Documentos

**Información Almacenada:**
- 📄 **Nombre del archivo**
- 📏 **Tamaño** (bytes)
- 🗂️ **Tipo MIME**
- 🔗 **URL en S3**
- 🔒 **Hash SHA-256**: Para verificar integridad
- 👤 **Usuario que subió**
- 📅 **Fecha de subida**
- 🏷️ **Etiquetas/Categorías**
- 🔢 **Orden de visualización**
- 📝 **Descripción** (opcional)

#### Relaciones Polimórficas

Un documento puede estar asociado con:
- 🏠 **Propiedades**
- 👤 **Contactos**
- 🔗 **Listings** (anuncios)
- 💼 **Listing-Contacts** (relaciones)
- 🤝 **Deals** (operaciones)
- 📅 **Citas**
- 🎯 **Prospectos**

**Ventaja:**
Un mismo documento (ej: DNI de un cliente) se sube una vez y se puede relacionar con múltiples entidades.

#### Subida de Documentos

**Métodos:**
- 📁 **Drag & Drop**: Arrastra archivos al área designada
- 📂 **Click para seleccionar**: Selector de archivos tradicional
- 📋 **Múltiple simultánea**: Hasta 10 archivos a la vez

**Proceso:**
1. Selección de archivos
2. Vista previa antes de subir
3. Selección de etiqueta/categoría
4. Añadir descripción (opcional)
5. Inicio de subida
6. Barra de progreso por archivo
7. Cálculo de hash SHA-256
8. Subida a S3
9. Guardado en base de datos
10. Confirmación de éxito

**Validaciones:**
- Tamaño máximo por archivo: 50MB
- Tipos de archivo permitidos
- Nombre de archivo válido
- Detección de duplicados por hash

#### Vista de Documentos

**Organización:**
- Agrupados por categoría
- Ordenados por fecha de subida
- Vista de lista con miniaturas
- Vista de cuadrícula (para imágenes)

**Información Visible:**
- Miniatura/Icono según tipo
- Nombre del archivo
- Tamaño legible (KB/MB)
- Fecha de subida
- Usuario que subió
- Etiquetas
- Acciones rápidas

#### Acciones sobre Documentos

**Descargar:**
- Click en documento para descargar
- Descarga individual
- Descarga múltiple (ZIP)
- URL directa temporal

**Vista Previa:**
- PDFs: Visor integrado
- Imágenes: Lightbox con zoom
- Office: Convertir a PDF para preview
- Otros: Descargar para ver

**Compartir:**
- Generar link público temporal
- Link con expiración (24h, 7 días, 30 días)
- Link protegido con password
- Enviar por email

**Editar:**
- Cambiar nombre
- Cambiar descripción
- Reasignar etiqueta
- Cambiar orden

**Eliminar:**
- Confirmación requerida
- Soft delete (recuperable 30 días)
- Eliminación permanente después de 30 días
- Registro de quién eliminó

**Mover/Copiar:**
- Asociar con otra entidad
- Copiar a otra propiedad/contacto
- Mantener o crear nueva copia en S3

#### Búsqueda de Documentos

**Criterios de Búsqueda:**
- Nombre del archivo
- Descripción
- Etiqueta/Categoría
- Tipo de archivo
- Rango de fechas
- Usuario que subió
- Entidad asociada

**Filtros Rápidos:**
- Solo PDFs
- Solo imágenes
- Solo contratos
- Solo certificados
- Subidos hoy/esta semana/este mes

---

### 6.2 OCR y Procesamiento de Documentos

**📍 Ubicación:**
- `src/app/api/documents/ficha-encargo/process/route.ts`

**🔍 AWS Textract para Extracción de Datos**

#### ¿Qué es OCR?

**Optical Character Recognition** (Reconocimiento Óptico de Caracteres):
- Lee texto de imágenes y PDFs
- Extrae datos estructurados de formularios
- Identifica tablas y layout
- Mantiene formato y relaciones

#### AWS Textract

**Capacidades:**
- OCR de alta precisión
- Detección de formularios
- Extracción de tablas
- Análisis de layout
- Soporte multi-idioma (incluyendo español)
- Detección de firmas
- Detección de checkboxes

#### Documentos Procesables

**Fichas de Encargo:**
- Datos del propietario
- Datos de la propiedad
- Precio y condiciones
- Tipo de encargo (exclusiva/abierta)
- Duración del contrato
- Comisión acordada

**Fichas de Venta:**
- Información de compradores
- Condiciones de venta
- Precio y forma de pago
- Fechas importantes

**Formularios de Captación:**
- Datos de contacto
- Características de la propiedad
- Motivo de venta
- Urgencia

#### Proceso de OCR

**Workflow:**
1. Usuario sube documento (PDF o imagen)
2. Documento se guarda en S3
3. Se invoca AWS Textract
4. Textract procesa el documento
5. Retorna datos estructurados en JSON
6. Sistema extrae campos específicos
7. Datos se mapean a formulario de Vesta
8. Se muestra formulario pre-rellenado
9. Usuario revisa y corrige si necesario
10. Guarda en base de datos

**Campos Extraídos Automáticamente:**

**De Propietario:**
- Nombre completo
- DNI/NIE
- Teléfono
- Email
- Dirección

**De Propiedad:**
- Dirección completa
- Tipo de inmueble
- Metros cuadrados
- Número de habitaciones
- Número de baños
- Planta
- Año de construcción
- Precio

**De Contrato:**
- Fecha de firma
- Duración (meses)
- Comisión (%)
- Tipo de encargo
- Condiciones especiales

#### Precisión y Validación

**Nivel de Confianza:**
- Textract devuelve score de confianza (0-100%)
- Campos con confianza <80% se marcan para revisión
- Usuario siempre puede corregir

**Validación:**
- DNI/NIE validado con algoritmo
- Teléfono validado (formato español)
- Email validado (formato)
- Código postal validado
- Precio convertido a número

**Manejo de Errores:**
- Si Textract falla, mostrar formulario vacío
- Permitir entrada manual
- Guardar documento original
- Reintentar procesamiento si se desea

---

### 6.3 Generación de PDFs

**📍 Ubicación:**
- `src/app/api/nota-encargo/generate-pdf/route.ts`
- `src/app/api/visita/generate-pdf/route.ts`
- `src/lib/puppeteer-utils.ts`

**📄 Puppeteer para Generación de Documentos**

#### ¿Qué es Puppeteer?

- Librería de Node.js para controlar Chrome headless
- Renderiza HTML/CSS como lo haría un navegador
- Genera PDFs de alta calidad
- Soporta JavaScript dinámico
- Ideal para documentos complejos

#### Documentos Generados

**1. Nota de Encargo**
- Contrato entre agencia y propietario
- Términos y condiciones
- Datos de la propiedad
- Comisión y duración
- Firma digital

**2. Informe de Visita**
- Resumen de visita realizada
- Propiedad visitada
- Feedback del cliente
- Nivel de interés
- Próximos pasos
- Notas del agente

**3. Carteles Inmobiliarios**
- Diseño personalizado
- Imágenes de la propiedad
- Características destacadas
- QR code
- Branding de la agencia

**4. Reportes Personalizados**
- Reportes de actividad
- Estadísticas de propiedades
- Análisis de mercado
- Comisiones ganadas

#### Proceso de Generación

**Workflow:**
1. Usuario solicita generar PDF
2. Sistema recopila datos necesarios
3. Renderiza plantilla HTML con datos
4. Puppeteer abre Chrome headless
5. Carga el HTML
6. Espera a que todo esté renderizado
7. Genera PDF con opciones específicas
8. Guarda PDF en S3
9. Calcula hash SHA-256
10. Registra en base de datos
11. Retorna URL de descarga

**Opciones de PDF:**
- **Tamaño**: A4, Letter, A3, Custom
- **Orientación**: Portrait, Landscape
- **Márgenes**: Configurables
- **Encabezado/Pie**: Opcionales
- **Marca de agua**: Opcional
- **Calidad**: Alta resolución

#### Plantillas HTML

**Características:**
- HTML5 + CSS3 moderno
- Tailwind CSS para estilos
- Variables dinámicas con template literals
- Imágenes embebidas en base64
- Fuentes web embebidas
- Código QR generado dinámicamente

**Secciones de Plantilla:**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Estilos CSS -->
  <!-- Fuentes -->
</head>
<body>
  <!-- Encabezado con logo -->
  <!-- Contenido principal -->
  <!-- Datos dinámicos -->
  <!-- Firma digital -->
  <!-- Pie de página -->
</body>
</html>
```

#### Firma Digital en PDFs

**Tecnología:**
- PDF-LIB para manipulación de PDFs
- Firma electrónica simple
- Timestamp de firma
- Hash SHA-256 del documento
- Metadata de firmante

**Proceso:**
1. PDF generado con Puppeteer
2. PDF-LIB abre el PDF
3. Añade campos de firma
4. Inserta imagen de firma (si existe)
5. Añade metadata:
   - Nombre del firmante
   - Fecha y hora
   - Hash del documento
   - IP de origen
6. Guarda PDF firmado
7. Almacena en S3

**Validación de Firma:**
- Verificar hash del documento
- Comparar con hash registrado
- Verificar timestamp
- Confirmar que no ha sido modificado

---

## 7. PUBLICACIÓN EN PORTALES

### 7.1 Integraciones Multi-Portal

**📍 Ubicación:**
- `src/app/(dashboard)/account-admin/portales/page.tsx`
- `src/components/admin/account/portal-configuration.tsx`

**🌐 Publicación Automática en Portales Inmobiliarios**

#### Portales Soportados

**✅ Fotocasa (Completamente Integrado)**
- API REST completa
- Publicación automática
- Actualización en tiempo real
- Gestión de imágenes
- Estadísticas de visualizaciones

**🚧 Idealista (En Desarrollo)**
- API en proceso de integración
- Funcionalidades básicas disponibles

**📋 Otros Portales (Planeados):**
- Habitaclia
- Pisos.com
- Yaencontre
- Milanuncios
- Kyero (internacional)
- Spanish Houses (internacional)
- ThinkSpain (internacional)
- ListGlobally (MLS España)

#### Configuración de Portales

**Panel de Configuración por Cuenta:**

**Por cada portal:**
- ✅ **Activo**: Habilitar/Deshabilitar
- 🔑 **Credenciales de API**:
  - API Key
  - API Secret
  - Client ID (si aplica)
- 🌐 **URL de API**: Endpoint del portal
- ⚙️ **Configuración específica** del portal

**Almacenamiento Seguro:**
- Credenciales encriptadas en base de datos
- Acceso restringido a admins
- Logs de acceso
- Rotación de keys recomendada

---

### 7.2 Publicación en Fotocasa

**📍 Ubicación:**
- `src/server/utils/fotocasa-logger.ts`
- APIs de Fotocasa integradas

**📸 Integración Completa con Fotocasa**

#### API de Fotocasa

**Operaciones Soportadas:**

**POST - Crear Anuncio:**
- Crear nueva publicación
- Subir datos de la propiedad
- Subir imágenes (hasta 50)
- Configurar visibilidad
- Activar anuncio

**PUT - Actualizar Anuncio:**
- Modificar datos
- Cambiar precio
- Actualizar imágenes
- Cambiar estado
- Renovar anuncio

**DELETE - Eliminar Anuncio:**
- Despublicar
- Pausar anuncio
- Eliminar definitivamente

**GET - Consultar Anuncio:**
- Estado actual
- Estadísticas de visitas
- Leads generados
- Posición en resultados

#### Build Payload Automático

**Mapeo Vesta → Fotocasa:**

```javascript
{
  // Tipo de operación
  operation: "sale" | "rent",

  // Tipo de propiedad
  propertyType: "flat" | "house" | "office" | "garage" | "land",

  // Ubicación
  address: {
    street: "Calle Mayor",
    number: "123",
    floor: "3",
    door: "A",
    postalCode: "28013",
    city: "Madrid",
    province: "Madrid",
    latitude: 40.4168,
    longitude: -3.7038
  },

  // Precio
  price: 250000,

  // Características
  surface: 95,
  rooms: 3,
  bathrooms: 2,

  // Extras
  hasLift: true,
  hasGarage: false,
  hasTerrace: true,
  hasSwimmingPool: false,

  // Certificación energética
  energyCertificate: {
    consumption: "C",
    emissions: "B"
  },

  // Descripción
  description: "Amplio piso de 3 habitaciones...",

  // Imágenes
  images: [
    { url: "https://...", order: 0, isMain: true },
    { url: "https://...", order: 1, isMain: false }
  ],

  // Contacto
  contact: {
    name: "Agencia Inmobiliaria",
    phone: "+34912345678",
    showPhone: true
  },

  // Configuración
  showExactAddress: false, // Mostrar dirección exacta o solo zona
  highlighted: false, // Anuncio destacado (de pago)
  premium: false // Anuncio premium (de pago)
}
```

#### Gestión de Imágenes

**Subida a Fotocasa:**
- Fotocasa acepta hasta 50 imágenes
- Formato: JPG, PNG
- Tamaño máximo por imagen: 10MB
- Resolución recomendada: 1024x768 o superior

**Proceso:**
1. Vesta tiene imágenes en S3
2. Se genera URL pública temporal
3. Se envía URL a Fotocasa
4. Fotocasa descarga y procesa imagen
5. Confirma recepción
6. Asigna ID de imagen

**Marca de Agua:**
- Subir versión CON watermark
- Protección de propiedad intelectual
- Branding de la agencia

**Orden de Imágenes:**
- Primera imagen = Imagen principal
- Orden se respeta en Fotocasa
- Cambiar orden en Vesta actualiza en Fotocasa

#### Modos de Visibilidad

**Dirección Exacta:**
- Muestra calle y número exacto
- Pin en mapa en ubicación precisa
- Máxima transparencia

**Solo Calle:**
- Muestra calle sin número
- Pin en mapa aproximado
- Protege privacidad del propietario

**Solo Zona:**
- Muestra solo barrio/zona
- Pin en mapa de área general
- Máxima privacidad

#### Logging Completo

**Registro de Operaciones:**

Cada llamada a la API de Fotocasa se registra:
- 📅 **Timestamp**
- 🔧 **Operación**: POST/PUT/DELETE/GET
- 🏠 **Propiedad**: ID en Vesta
- 🆔 **ID en Fotocasa**
- 📤 **Request completo** (JSON)
- 📥 **Response completo** (JSON)
- ✅ **Success**: true/false
- ❌ **Error**: Mensaje de error (si aplica)
- 👤 **Usuario**: Quién hizo la acción
- 📊 **Metadata**: Información adicional

**Utilidad:**
- Debugging de problemas
- Auditoría de cambios
- Identificar patrones de error
- Estadísticas de uso

#### Sincronización de Estado

**Vesta ↔ Fotocasa:**

**Campos sincronizados:**
- Precio
- Descripción
- Características
- Imágenes
- Estado (publicado/despublicado)

**Frecuencia:**
- Cambios manuales: Inmediato
- Verificación automática: Diaria
- Re-sincronización forzada: Disponible

**Manejo de Inconsistencias:**
- Si Fotocasa tiene datos diferentes
- Opción de sobrescribir desde Vesta
- Opción de importar desde Fotocasa
- Registro de discrepancias

#### Estadísticas de Fotocasa

**Métricas Disponibles:**
- 👁️ **Visualizaciones**: Cuántas veces se vio el anuncio
- 📞 **Leads generados**: Contactos recibidos
- 📧 **Emails recibidos**
- 📱 **Llamadas recibidas**
- ⭐ **Favoritos**: Veces añadido a favoritos
- 📊 **Posición media**: En resultados de búsqueda

**Actualización:**
- Estadísticas actualizadas diariamente
- Dashboard con gráficos
- Comparativa entre propiedades
- Histórico de rendimiento

---

## 8. IA Y AUTOMATIZACIÓN

### 8.1 Generación de Descripciones (OpenAI GPT-4)

**📍 Ubicación:**
- `src/server/openai/**/*.ts`

**🤖 IA para Crear Textos Profesionales**

#### OpenAI GPT-4

**¿Por qué GPT-4?**
- Modelo más avanzado disponible
- Excelente con español
- Comprende contexto inmobiliario
- Creatividad y naturalidad
- Consistencia de tono

#### Tipos de Descripciones

**1. Descripción Larga (500-800 palabras)**
- Para portales inmobiliarios
- Detallada y completa
- Destacar todos los puntos fuertes
- Mencionar ubicación y entorno
- Call-to-action al final

**2. Descripción Corta (150-200 palabras)**
- Para tarjetas y previsualizaciones
- Solo highlights principales
- Lenguaje impactante
- Directa al punto

**3. Descripción para Redes Sociales (280 caracteres)**
- Formato tweet/post
- Muy concisa
- Emojis estratégicos (opcional)
- Gancho emocional
- Hashtags relevantes

#### Contexto Personalizado por Cuenta

**Configuración de Tono:**
- **Profesional y formal**: Para agencias tradicionales
- **Moderno y desenfadado**: Para agencias jóvenes
- **Lujoso y exclusivo**: Para propiedades premium
- **Cercano y familiar**: Para agencias locales
- **Técnico y preciso**: Para inversores

**Información de Cuenta Incluida:**
- Nombre de la agencia
- Slogan
- Valores diferenciales
- Zona de especialización
- Idioma principal

#### Prompt Engineering

**Estructura del Prompt:**

```
Eres un redactor experto en contenido inmobiliario en España.

CONTEXTO DE LA AGENCIA:
- Nombre: {nombre_agencia}
- Tono: {tono_configurado}
- Zona: {zona_operacion}

INFORMACIÓN DE LA PROPIEDAD:
- Tipo: {tipo}
- Operación: {venta/alquiler}
- Ubicación: {direccion_completa}
- Precio: {precio}€
- Superficie: {m2} m²
- Habitaciones: {habitaciones}
- Baños: {baños}
- Características especiales: {extras}
- Estado: {estado_conservacion}
- Orientación: {orientacion}
- Certificación energética: {certificado}

DESCRIPCIÓN ACTUAL (si existe): {descripcion_anterior}

INSTRUCCIONES:
- Genera una descripción {tipo_descripcion} atractiva
- Destaca los puntos fuertes de forma natural
- Menciona la ubicación y su entorno
- Usa un tono {tono}
- Longitud: {longitud} palabras aproximadamente
- Enfócate en los beneficios para el comprador/inquilino
- NO inventes datos que no te he proporcionado
- Termina con un call-to-action suave
```

#### Parámetros de Generación

**Configuración:**
- **Model**: gpt-4
- **Temperature**: 0.7 (equilibrio creatividad/consistencia)
- **Max tokens**: 1000 (para descripción larga)
- **Top P**: 0.9
- **Frequency penalty**: 0.3 (evitar repeticiones)
- **Presence penalty**: 0.1

#### Regeneración y Ajustes

**Opciones:**
- ✨ **Regenerar**: Nueva descripción desde cero
- ✏️ **Editar y re-generar**: Cambiar datos y generar nueva
- 📋 **Guardar como borrador**: No publicar aún
- ✅ **Aprobar y usar**: Guardar como descripción oficial

**Edición Manual:**
- Después de generar, siempre editable
- Combinar IA + toque humano
- Guardar versiones

---

### 8.2 Resumen de Notas con IA

**📍 Ubicación:**
- `src/server/openai/notes-transformer.ts`

**📝 Análisis Inteligente de Notas Largas**

#### ¿Cuándo se Activa?

**Automáticamente cuando:**
- Nota supera 400 caracteres
- Usuario completa una actividad
- Usuario añade comentario largo
- Notas de reunión/llamada

#### Información Extraída

**Resumen Estructurado en 8 Categorías:**

**1. Acciones a Realizar**
```
- Enviar documentación de financiación
- Programar segunda visita
- Consultar con abogado sobre cláusula X
```

**2. Preguntas del Cliente**
```
- ¿Incluye plaza de garaje?
- ¿Cuándo estaría disponible para mudarse?
- ¿Acepta mascotas la comunidad?
```

**3. Preferencias del Cliente**
```
- Prioriza luminosidad
- Quiere 3 habitaciones mínimo
- No le importa hacer reforma
- Prefiere zona céntrica
```

**4. Decisores Involucrados**
```
- Toma decisiones junto a su pareja
- Consulta con sus padres
- Necesita aprobación del banco
```

**5. Nivel de Interés**
```
- Alto: Muy interesado, quiere hacer oferta
- Medio: Le gusta pero quiere ver más opciones
- Bajo: Solo explorando, sin urgencia
```

**6. Objeciones Identificadas**
```
- Precio ligeramente alto para su presupuesto
- Ubicación un poco lejos del trabajo
- Necesita verificar financiación
```

**7. Notas Personales Importantes**
```
- Se muda por trabajo
- Primera compra, necesita asesoramiento
- Trabaja desde casa, necesita despacho
```

**8. Competencia Mencionada**
```
- Está mirando un piso en Calle X con Agencia Y
- Precio comparado: 230.000€
- Características similares
```

#### Configuración del Modelo

**Parámetros:**
- **Model**: gpt-4
- **Temperature**: 0.3 (más consistente, menos creativo)
- **Max tokens**: 800
- **Formato**: JSON estructurado

**Prompt:**
```
Analiza las siguientes notas de una interacción con un cliente inmobiliario y extrae información clave.

NOTAS:
{texto_de_la_nota}

Proporciona un resumen estructurado en formato JSON con estas categorías:
- actions_to_take: Array de acciones específicas mencionadas
- client_questions: Array de preguntas del cliente
- preferences: Array de preferencias y requisitos
- decision_makers: Quién está involucrado en la decisión
- interest_level: "high", "medium", "low"
- objections: Array de preocupaciones u objeciones
- personal_notes: Información personal relevante
- competition_mentioned: Otras propiedades o agencias mencionadas

Sé conciso pero preciso. Solo incluye información mencionada explícitamente.
```

#### Visualización del Resumen

**UI del Resumen:**
- Accordion expandible/colapsable
- Secciones con iconos
- Highlights en puntos clave
- Copiable para usar en otros lugares

**Acciones desde Resumen:**
- 📋 Copiar todo el resumen
- ✅ Crear tareas desde "Acciones a realizar"
- 📧 Enviar resumen por email al equipo
- 💾 Guardar como nota aparte

---

### 8.3 Extracción de Tareas con IA

**📍 Ubicación:**
- `src/server/openai/notes-transformer.ts`

**✅ Detección Automática de Tareas Accionables**

#### ¿Qué Hace?

Analiza una nota y detecta automáticamente tareas que deben realizarse.

**Ejemplo:**
```
Nota:
"Juan está muy interesado en el piso. Le prometí enviarle
la documentación de la comunidad y el certificado energético
antes del viernes. También quiere una segunda visita la
próxima semana para traer a su esposa. Tiene que hablar
con el banco para la hipoteca."

Tareas Extraídas:
1. Enviar documentación de comunidad a Juan
   - Urgencia: 4
   - Vencimiento: 3 días

2. Enviar certificado energético a Juan
   - Urgencia: 4
   - Vencimiento: 3 días

3. Programar segunda visita con Juan y su esposa
   - Urgencia: 3
   - Vencimiento: 7 días
```

#### Campos Extraídos

**Para cada tarea identificada:**

**Título** (máx 60 caracteres)
- Conciso y accionable
- Incluye verbo de acción
- Menciona a quién/qué

**Descripción**
- Contexto adicional
- Detalles de la nota original
- Por qué es importante

**Urgencia** (1-5, opcional)
- Basada en palabras clave:
  - "urgente", "inmediato" → 5
  - "antes de...", "deadline" → 4
  - Normal → 3
  - "cuando puedas" → 2

**Días sugeridos de vencimiento** (opcional)
- Basado en contexto temporal:
  - "hoy" → 0 días
  - "mañana" → 1 día
  - "esta semana" → 7 días
  - "próxima semana" → 14 días
  - Por defecto → 7 días

**Categoría** (opcional)
- contact: Si es sobre contacto
- property: Si es sobre propiedad
- appointment: Si es sobre cita
- financial: Si es sobre dinero
- documentation: Si es sobre docs

#### Validación Inteligente

**Criterios para ser tarea:**
- ✅ Debe ser accionable (verbo de acción)
- ✅ Debe tener destinatario o objeto claro
- ✅ No debe ser solo información
- ✅ Máximo 5 tareas por nota (evitar spam)

**NO son tareas:**
- Hechos o información: "Juan tiene 35 años"
- Opiniones: "El piso es bonito"
- Preferencias ya registradas: "Quiere 3 habitaciones"

#### Interfaz de Creación

**Después de extracción:**
1. Modal muestra tareas sugeridas
2. Usuario puede:
   - ✅ Aceptar todas
   - ✏️ Editar individualmente
   - ❌ Descartar algunas
   - ➕ Añadir más manualmente
3. Click en "Crear tareas"
4. Se crean en sistema
5. Se relacionan con la nota original

---

### 8.4 Transcripción de Voz (Whisper)

**📍 Ubicación:**
- `src/app/api/whisper/transcribe/route.ts`
- `src/components/shared/push-to-talk-whisper-button.tsx`

**🎤 OpenAI Whisper para Speech-to-Text**

#### OpenAI Whisper

**Características:**
- Modelo state-of-the-art de transcripción
- Soporte multi-idioma (95+ idiomas)
- Excelente con español
- Maneja acentos y dialectos
- Puntuación automática
- Detección de idioma automática

#### Dónde Está Disponible

**Botón Push-to-Talk en:**
- 📝 Descripción de propiedades
- 💬 Notas de contactos
- 📊 Comentarios en propiedades
- ✅ Descripción de tareas
- 📅 Notas de citas
- 🎯 Notas de prospectos
- 📋 Actividades

#### Funcionamiento

**Grabación en Navegador:**
- MediaRecorder API del navegador
- Acceso al micrófono (con permiso)
- Grabación en formato WebM
- Visualización de onda de sonido
- Indicador de grabación activa

**Workflow:**
1. Usuario hace click en botón de micrófono
2. Navegador pide permiso de micrófono
3. Usuario habla mientras mantiene presionado (o click para start/stop)
4. Audio se graba en memoria
5. Al soltar/detener, se sube a servidor
6. Servidor envía audio a Whisper API
7. Whisper transcribe
8. Texto retorna al frontend
9. Se inserta en el campo de texto
10. Usuario puede editar antes de guardar

**Formato de Audio:**
- Codec: Opus (WebM)
- Sample rate: 16kHz (óptimo para voz)
- Channels: Mono
- Tamaño típico: 100-500KB por 30s

#### Parámetros de Whisper API

**Configuración:**
- **Model**: whisper-1
- **Language**: es (español, opcional pero mejora precisión)
- **Response format**: text
- **Temperature**: 0 (más determinístico)

#### Validación Post-Transcripción

**Después de transcribir:**
- Texto insertado en campo
- Validación de formulario se ejecuta
- Si hay errores, se muestran
- Usuario puede corregir manualmente
- Guardar cuando esté listo

#### Casos de Uso

**1. Notas de Visita:**
```
Usuario: "El cliente ha mostrado mucho interés en la propiedad.
Le gusta especialmente la terraza y la luminosidad. Sin embargo,
tiene dudas sobre el precio y quiere hacer una segunda visita
con su pareja. Programar para la próxima semana."

Transcripción: [texto exacto]
IA extrae tareas: "Programar segunda visita"
```

**2. Descripción de Propiedad:**
```
Usuario: "Amplio piso de tres habitaciones en el centro de Madrid.
Totalmente reformado con materiales de primera calidad. Cocina
equipada con electrodomésticos nuevos. Baño completo con plato
de ducha. Orientación sur, muy luminoso. Incluye trastero."

Transcripción: [texto]
GPT-4 mejora: "Descubre este magnífico piso de 3 habitaciones..."
```

**3. Llamada Telefónica:**
```
Agente registra: "Llamada con Juan Pérez. Interesado en piso
de Calle Mayor. Presupuesto hasta 250 mil euros. Necesita tres
habitaciones. Trabaja desde casa. Quiere zona céntrica. Puede
visitar mañana por la tarde."

Sistema crea: Contacto + Prospecto + Tarea de visita
```

---

## 9. AUTENTICACIÓN Y SEGURIDAD

### 9.1 Sistema de Autenticación

**📍 Ubicación:**
- `src/lib/auth.ts`
- `src/lib/auth-client.ts`
- `src/app/api/auth/[...all]/route.ts`

**🔐 Better Auth como Motor de Autenticación**

#### ¿Qué es Better Auth?

- Librería moderna de autenticación para Next.js
- Type-safe (TypeScript completo)
- Sesiones seguras
- Múltiples métodos de auth
- Integración con OAuth
- Gestión de usuarios y roles

#### Métodos de Autenticación

**1. Email y Password**
- Registro con email y contraseña
- Hash de contraseña con bcrypt
- Salt único por usuario
- Validación de fortaleza de contraseña:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos un número
  - Al menos un carácter especial

**2. Google OAuth**
- Login con cuenta de Google
- Permisos solicitados:
  - Email
  - Nombre
  - Foto de perfil
- Vinculación automática de cuentas

**3. Apple OAuth (Planeado)**
- Login con Apple ID
- Privacidad mejorada
- Sign in with Apple

**4. LinkedIn OAuth (Planeado)**
- Para profesionales inmobiliarios
- Importar perfil profesional

#### Sesiones Seguras

**Cookies HTTP-Only:**
- Token de sesión en cookie
- No accesible desde JavaScript
- Protección contra XSS
- Secure flag en producción
- SameSite=Lax

**Tokens:**
- JWT (JSON Web Tokens)
- Firmados con secret
- Expiración configurable
- Refresh tokens para renovación

**Duración de Sesión:**
- Por defecto: 7 días
- Remember me: 30 días
- Configurable por cuenta

#### Verificación de Email

**Flujo:**
1. Usuario se registra
2. Sistema envía email con link de verificación
3. Link contiene token único con expiración (24h)
4. Usuario hace click
5. Token se valida
6. Cuenta marcada como verificada
7. Acceso completo otorgado

**Email de Verificación:**
- Plantilla profesional con branding
- Link claro y visible
- Instrucciones en español
- Opción de reenviar

#### Reset de Password

**Flujo con SMS:**
1. Usuario olvida contraseña
2. Introduce email o teléfono
3. Sistema envía código 6 dígitos por SMS
4. Código válido por 10 minutos
5. Usuario introduce código
6. Si correcto, permite cambiar contraseña
7. Nueva contraseña se guarda (hasheada)
8. Todas las sesiones anteriores se invalidan

**Seguridad:**
- Código de un solo uso
- Expiración corta (10 min)
- Limite de intentos (3 intentos)
- Rate limiting (1 SMS cada 5 min)

---

### 9.2 Two-Factor Authentication (2FA)

**📍 Ubicación:**
- `src/server/actions/account-2fa.ts`
- Schema: `twoFactor`, `accountTwoFactorSettings`

**🔒 Seguridad Adicional con 2FA por SMS**

#### Dos Niveles de 2FA

**1. Account-Level (Obligatorio para Todos)**
- Admin de cuenta habilita 2FA
- Todos los empleados deben usar 2FA
- No pueden desactivarlo individualmente
- Mayor seguridad corporativa

**2. User-Level (Individual)**
- Usuario decide si quiere 2FA
- Independiente del account-level
- Puede activar/desactivar
- Protección personal adicional

#### Flujo de 2FA

**Al Hacer Login:**
1. Usuario introduce email y password
2. Credenciales validadas
3. **Si 2FA activo:**
   - Sistema genera código de 6 dígitos
   - Envía SMS al teléfono registrado
   - Muestra pantalla de verificación
   - Usuario introduce código
   - Si correcto → Login exitoso
   - Si incorrecto → 3 intentos, luego bloqueo temporal

**Generación de Código:**
- 6 dígitos numéricos
- Aleatorio criptográficamente
- Hasheado antes de guardar
- Válido por 10 minutos
- Un solo uso

#### Envío de SMS (Twilio)

**Integración:**
- Twilio como proveedor de SMS
- Números españoles (+34)
- Entrega en segundos
- Confirmación de delivery

**Mensaje:**
```
Tu código de verificación de Vesta es: 123456

Este código expira en 10 minutos.
```

#### Configuración Account-Level

**Habilitar 2FA Obligatorio:**
- Solo Account Admin puede hacerlo
- Afecta a todos los usuarios de la cuenta
- Se registra:
  - Quién lo habilitó
  - Timestamp
  - Razón (opcional)

**Deshabilitar 2FA Obligatorio:**
- Requiere re-autenticación del admin
- Confirmación explícita
- Notificación a todos los usuarios
- Audit log

#### Configuración User-Level

**Habilitar:**
1. Usuario va a Configuración > Seguridad
2. Click en "Habilitar 2FA"
3. Introduce número de teléfono
4. Sistema envía código de prueba
5. Usuario introduce código
6. Si correcto, 2FA activado

**Deshabilitar:**
1. Usuario solicita desactivar
2. Sistema envía código de confirmación
3. Usuario introduce código
4. 2FA desactivado

#### Códigos de Backup (Planeado)

- 10 códigos de un solo uso
- Por si pierde acceso al teléfono
- Descargar y guardar en lugar seguro
- Se invalidan al usar

---

### 9.3 Sistema de Permisos y Roles

**📍 Ubicación:**
- `src/app/actions/permissions/check-permissions.ts`
- Schema: `roles`, `userRoles`, `accountRoles`

**👥 Control de Acceso Granular**

#### Roles del Sistema

**Superadmin (Interno Vesta)**
- Acceso total al sistema
- Gestión de todas las cuentas
- Configuración global
- Solo empleados de Vesta

**Account Admin**
- Administrador de la cuenta
- Gestión de usuarios de su cuenta
- Configuración de la cuenta
- Acceso a facturación
- Informes globales

**Office Manager**
- Gestión de equipo
- Ver todas las operaciones
- Reportes del equipo
- No puede gestionar usuarios
- No puede cambiar facturación

**Agent**
- Usuario estándar
- Acceso a sus propiedades/contactos
- Acceso a las asignadas
- No puede ver todo el equipo
- Sin acceso admin

**Inactive**
- Usuario desactivado
- Sin acceso al sistema
- Datos conservados
- Puede reactivarse

#### Permisos Granulares

**Propiedades:**
- `view_properties`: Ver propiedades
- `edit_properties`: Editar propiedades
- `delete_properties`: Eliminar propiedades
- `view_all_properties`: Ver de todos los agentes
- `publish_properties`: Publicar en portales

**Contactos:**
- `view_contacts`: Ver contactos
- `edit_contacts`: Editar contactos
- `delete_contacts`: Eliminar contactos
- `view_all_contacts`: Ver de todos los agentes
- `export_contacts`: Exportar base de datos

**Calendario:**
- `view_calendar`: Ver calendario
- `edit_calendar`: Editar citas
- `delete_calendar`: Eliminar citas
- `view_team_calendar`: Ver agenda del equipo

**Gestión:**
- `manage_users`: Crear/editar/eliminar usuarios
- `manage_account`: Configuración de cuenta
- `manage_billing`: Facturación y planes
- `manage_portals`: Configurar portales
- `view_reports`: Ver reportes globales

**Permisos Especiales:**
- `impersonate_user`: Iniciar sesión como otro usuario (solo Superadmin)
- `access_api`: Acceso a API pública
- `manage_webhooks`: Configurar webhooks

#### Matriz de Permisos por Rol

| Permiso | Superadmin | Account Admin | Office Manager | Agent |
|---------|------------|---------------|----------------|-------|
| Ver propiedades | ✅ Todas | ✅ Todas | ✅ Todas | ✅ Propias |
| Editar propiedades | ✅ | ✅ | ✅ | ✅ Propias |
| Eliminar propiedades | ✅ | ✅ | ❌ | ❌ |
| Ver contactos | ✅ | ✅ | ✅ | ✅ Propios |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Configurar cuenta | ✅ | ✅ | ❌ | ❌ |
| Ver facturación | ✅ | ✅ | ❌ | ❌ |
| Reportes globales | ✅ | ✅ | ✅ | ❌ |

#### Validación de Permisos

**Middleware:**
```typescript
// En cada ruta protegida
const hasPermission = await checkPermission(
  userId,
  "edit_properties"
);

if (!hasPermission) {
  return unauthorized();
}
```

**Componentes UI:**
```typescript
// Mostrar/ocultar según permisos
{hasPermission("delete_properties") && (
  <DeleteButton />
)}
```

#### Roles Personalizados (Planeado)

- Crear roles custom
- Asignar permisos específicos
- Nombrar el rol
- Asignar a usuarios

---

### 9.4 Multi-Tenancy

**🏢 Aislamiento Total por Cuenta**

#### Arquitectura Multi-Tenant

**Separación por accountId:**
- Todas las tablas tienen `accountId`
- Queries automáticamente filtradas
- Imposible acceder a datos de otra cuenta
- Índices en base de datos optimizados

#### Aislamiento de Datos

**Entidades Aisladas:**
- ✅ Propiedades
- ✅ Contactos
- ✅ Usuarios
- ✅ Documentos
- ✅ Citas
- ✅ Tareas
- ✅ Prospectos
- ✅ Deals
- ✅ Configuraciones

**Sesiones por Cuenta:**
- Usuario puede pertenecer a múltiples cuentas
- Selecciona cuenta al login
- Sesión vinculada a cuenta activa
- Switch de cuenta sin re-login

#### Compartir Entre Cuentas

**Casos Permitidos:**
- Prospectos match con propiedades de otras cuentas
- Co-venta (con permiso explícito)
- Referidos entre agencias
- Siempre con consentimiento

**Registro de Compartidos:**
- Log de qué se compartió
- Con quién
- Cuándo
- Quién aprobó

---

## 10. ADMINISTRACIÓN DE CUENTA

### 10.1 Configuración General

**📍 Ubicación:**
- `src/app/(dashboard)/account-admin/configuration/page.tsx`

**⚙️ Panel de Control de la Cuenta**

#### Información Básica

**Datos de la Agencia:**
- 🏢 Nombre comercial
- 📝 Nombre corto (para URLs)
- 📄 Nombre legal / razón social
- 🖼️ Logo (subida de imagen)
- 📍 Dirección de oficina principal
- 📞 Teléfono principal
- ✉️ Email de contacto
- 🌐 Website

**Tipo de Cuenta:**
- Company (Empresa)
- Person (Autónomo)

#### Información Legal

**Datos Fiscales:**
- 🆔 CIF/NIF
- 📋 Número colegiado (agente inmobiliario)
- 🏛️ Registro mercantil:
  - Tomo
  - Libro
  - Folio
  - Hoja
  - Inscripción
- ✉️ Email para temas legales
- ⚖️ Jurisdicción (ciudad/provincia)

**Protección de Datos:**
- 📧 Email de privacidad
- 👤 Delegado de Protección de Datos (DPO):
  - Nombre
  - Email
  - Teléfono

#### Configuración de Negocio

**Planes y Facturación:**
- 💳 Plan actual (Basic, Pro, Enterprise)
- 📅 Fecha de inicio del plan
- 📅 Fecha de renovación
- ✅ Estado de suscripción
- 💰 Precio mensual/anual

**Límites del Plan:**
- 👥 Número de usuarios
- 🏠 Número de propiedades activas
- 💾 Almacenamiento (GB)
- 🤖 Tokens de IA incluidos
- 🌐 Portales disponibles

---

### 10.2 Gestion de Usuarios

**📍 Ubicación:**
- `src/app/(dashboard)/account-admin/usuarios/page.tsx`

**👥 Administración del Equipo**

#### CRUD de Usuarios

**Crear Usuario:**
- Email (obligatorio, único)
- Nombre y apellido
- Teléfono
- Rol asignado
- Enviar invitación por email
- Password temporal (o auto-generado)

**Editar Usuario:**
- Cambiar datos personales
- Cambiar rol
- Cambiar permisos
- Resetear password
- Cambiar teléfono para 2FA

**Desactivar:**
- Estado → Inactive
- No puede hacer login
- Datos conservados
- Propiedades/contactos mantenidos
- Puede reactivarse

**Eliminar:**
- Solo si no tiene datos asociados
- Confirmación requerida
- Registro en audit log

#### Información de Usuario

**Perfil:**
- Nombre completo
- Email
- Teléfono
- Avatar
- Timezone (zona horaria)
- Idioma preferido
- Preferencias de notificaciones

**Actividad:**
- Último login
- Sesiones activas
- Dispositivos
- IP de último acceso

**Estadísticas:**
- Propiedades creadas
- Contactos gestionados
- Deals cerrados
- Comisiones generadas
- Tareas completadas

#### Invitación de Usuarios

**Proceso:**
1. Admin crea usuario
2. Sistema genera token de invitación
3. Email enviado con link
4. Link válido por 7 días
5. Usuario hace click
6. Configura su contraseña
7. Completa su perfil
8. Acceso otorgado

**Email de Invitación:**
```
¡Bienvenido/a a {Nombre_Agencia}!

Has sido invitado/a a unirte al equipo como {Rol}.

Para completar tu registro, haz click aquí: [Link]

Este enlace expira en 7 días.

Si tienes alguna pregunta, contacta con tu administrador.
```

---

### 10.3 Branding y Personalización

**📍 Ubicación:**
- `src/app/(dashboard)/account-admin/branding/page.tsx`
- `src/app/(dashboard)/account-admin/carteleria/page.tsx`

**🎨 Identidad Visual de la Agencia**

#### Paleta de Colores

**Colores Corporativos:**
- 🎨 **Color primario**: Para botones, headers, highlights
- 🎨 **Color secundario**: Para elementos secundarios
- 🎨 **Color de acento**: Para CTAs y elementos destacados

**Selector:**
- Color picker visual
- Input HEX manual
- Vista previa en tiempo real
- Aplicación inmediata

#### Logos

**Tipos de Logo:**
- **Logo principal**: Horizontal, con texto
- **Logotipo**: Solo marca, sin texto
- **Favicon**: 32x32px para navegador

**Formatos Aceptados:**
- PNG (con transparencia)
- SVG (vectorial, ideal)
- JPG (si no hay transparencia)

**Tamaños:**
- Logo principal: 300x100px (recomendado)
- Logotipo: 100x100px
- Favicon: 32x32px

**Uso:**
- Website público
- Carteles inmobiliarios
- Emails transaccionales
- Documentos generados (PDFs)

#### Plantillas de Cartelería

**Configuración por Defecto:**
- Plantilla preferida
- Número de imágenes default
- Elementos visibles:
  - Logo
  - Precio
  - Características
  - QR Code
  - Información de contacto

**Presets Guardados:**
- "Cartel Clásico Venta"
- "Cartel Moderno Alquiler"
- "Cartel Premium"
- Crear nuevos presets

#### Marca de Agua (Watermark)

**Configuración:**
- Logo para watermark
- Opacidad (0-100%)
- Posición:
  - Esquina superior izquierda
  - Esquina superior derecha
  - Esquina inferior izquierda
  - Esquina inferior derecha
  - Centro
- Tamaño (% del total)

**Aplicación:**
- Automática al subir imágenes
- Versión sin watermark guardada por separado
- Watermark para portales
- Sin watermark para uso interno

---

### 10.4 Website Builder

**📍 Ubicación:**
- `src/app/(dashboard)/account-admin/website/page.tsx`
- Schema: `websiteProperties`

**🌐 Creador de Sitio Web de la Agencia**

Vesta incluye un constructor de website simple para que cada agencia tenga su propia página web profesional.

#### Secciones Configurables

**Hero Section (Portada):**
- Título principal
- Subtítulo
- Imagen de fondo
- Call-to-action primario
- Call-to-action secundario

**About Section (Sobre Nosotros):**
- Título
- Descripción de la agencia
- Misión y valores
- Historia
- Equipo (fotos y bios de agentes)

**Properties Section (Propiedades):**
- Mostrar propiedades destacadas
- Número de propiedades a mostrar
- Filtros aplicados (automático)
- Enlace a listado completo

**Services Section (Servicios):**
- Servicios ofrecidos:
  - Compraventa
  - Alquileres
  - Valoraciones
  - Asesoramiento legal
  - Gestión integral
- Iconos y descripciones

**Testimonials (Testimonios):**
- Testimonios de clientes
- Nombre y foto del cliente
- Texto del testimonio
- Calificación (estrellas)

**Contact Section (Contacto):**
- Formulario de contacto
- Información de oficinas
- Mapa interactivo
- Horario de atención

**Footer:**
- Enlaces rápidos
- Redes sociales
- Información legal
- Copyright

#### SEO

**Configuración:**
- 📄 **Meta title**: Título de la página
- 📝 **Meta description**: Descripción para Google
- 🖼️ **Open Graph image**: Imagen para compartir en redes
- 🏷️ **Keywords**: Palabras clave
- 🔗 **Canonical URL**

**Open Graph Tags:**
- og:title
- og:description
- og:image
- og:url
- og:type
- twitter:card

#### Enlaces Sociales

**Redes Configurables:**
- 📘 Facebook: URL del perfil
- 📷 Instagram: Handle
- 🐦 Twitter/X: Handle
- 💼 LinkedIn: URL del perfil
- 📺 YouTube: URL del canal
- 📱 TikTok: Handle (planeado)

#### KPIs Personalizables

**Contadores Destacados:**
- 🏠 **Número de propiedades**: Actualizado automáticamente
- 📅 **Años de experiencia**: Configurable
- 😊 **Clientes satisfechos**: Configurable
- 🤝 **Operaciones cerradas**: Actualizado automáticamente

#### Oficinas

**Multi-Ubicación:**
- Agregar múltiples oficinas
- Por cada oficina:
  - 📍 Nombre de la oficina
  - 📍 Dirección completa
  - 📞 Teléfono
  - ✉️ Email
  - 🗺️ Coordenadas GPS
  - ⏰ Horario de atención
  - 📸 Foto de la oficina

**Mapa:**
- Google Maps integrado
- Marcadores por cada oficina
- Direcciones para llegar

---

Este documento continúa siendo muy extenso. ¿Quieres que continúe con las últimas secciones (SEO, Stack Tecnológico, y un resumen final) o lo dejamos aquí?

