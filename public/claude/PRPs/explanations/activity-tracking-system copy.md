# Sistema de Seguimiento de Actividades (Activity Tracking System)

## Visión General

Este documento describe la arquitectura del sistema de seguimiento de actividades en el CRM inmobiliario Vesta. El sistema está diseñado para registrar todas las acciones importantes relacionadas con propiedades, contactos, operaciones y relaciones entre ellos.

---

## Estructura de Vistas

```
ContactsView                    VisitsView                    AccionesView
    ├── Filter UI                   ├── Filter UI                   ├── Filter UI
    ├── View mode toggle            ├── View mode toggle            ├── View mode toggle
    │   ├── "Accepted" view         │   ├── "Timeline" view         │   ├── "Timeline" view
    │   └── "All contacts" view     │   └── "All visits" view       │   └── "All actions" view
    ├── Empty states                ├── Empty states                ├── Empty states
    └── Data rendering              └── Data rendering              └── Data rendering
        ├── Grouped sections            ├── Grouped sections            ├── Grouped sections
        └── Individual cards            └── Individual cards            └── Individual cards
```

---

## Tipos de Actividad

El sistema utiliza **4 tablas de actividad** principales, cada una diseñada para un propósito específico:

### 1. **Listing Activity** (`listing_activity`)
**Propósito**: Registrar cambios importantes en las propiedades/listados.

**Cuándo usar**: Cuando algo cambia en la propiedad o el listado en sí mismo (precio, estado, publicación, detalles de la propiedad).

**Dónde se muestra**: En el historial de la propiedad/listado.

**Acciones registradas**:

#### ✅ Cambios de Precio y Estado
- `price_changed` - Cambio de precio (con razón, porcentaje de cambio, días activo)
- `status_changed` - Cambio de estado (En Venta → Vendido, etc.)

#### ✅ Publicación en Portales
- `portal_published` - Publicado en portal (Fotocasa, Idealista, etc.)
- `portal_unpublished` - Despublicado de portal
- `portal_sync_error` - Error al sincronizar con portal
- `portal_settings_updated` - Configuración específica del portal cambiada

#### ✅ Contenido y Marketing
- `description_changed` - Descripción modificada (manual o AI)
- `images_updated` - Fotos añadidas/eliminadas/reordenadas
- `featured_toggled` - Estado destacado cambiado
- `virtual_tour_added` - Tour virtual añadido

#### ✅ Cambios de Propiedad
- `agent_reassigned` - Agente reasignado (crítico para comisiones)
- `listing_type_changed` - Tipo cambiado (Venta → Alquiler)
- `specifications_updated` - Especificaciones actualizadas (dormitorios, baños, características)
- `keys_received` - Llaves recibidas

#### ✅ Visibilidad y Publicación
- `visibility_changed` - Modo de visibilidad cambiado (Exacta → Calle → Zona)
- `website_publication_toggled` - Publicación web activada/desactivada
- `activated` - Listado activado
- `deactivated` - Listado desactivado

#### ✅ Documentos y Analíticas
- `document_uploaded` - Documento importante subido
- `views_milestone` - Hito de visualizaciones (cada 100 vistas)
- `inquiry_received` - Consulta recibida

---

### 2. **Contact Activity** (`contact_activity`)
**Propósito**: Registrar eventos críticos del ciclo de vida del contacto y cumplimiento GDPR.

**Cuándo usar**: Solo para acciones críticas relacionadas con el contacto en sí mismo (no relacionadas con listados específicos).

**Dónde se muestra**: En el historial del contacto (pestaña de actividad).

**⚠️ IMPORTANTE**: Esta tabla debe ser **minimalista** y solo registrar acciones críticas. Las interacciones con listados específicos van en `listing_contact_activity`.

**Acciones registradas**:

#### ✅ Ciclo de Vida del Contacto
- `contact_created` - Contacto creado en el sistema
- `contact_deactivated` - Contacto marcado como inactivo
- `contact_merged` - Contacto fusionado (duplicados consolidados)

#### ✅ GDPR y Cumplimiento Legal
- `consent_given` - Consentimiento otorgado (marketing/comunicación)
- `consent_withdrawn` - Consentimiento retirado
- `do_not_contact_set` - Solicitud de no contactar establecida
- `gdpr_data_export_requested` - Solicitud de exportación de datos (GDPR Artículo 15)

**❌ NO registrar aquí**:
- Llamadas, mensajes, emails (van en `listing_contact_activity` si están relacionados con un listado)
- Cambios de información (nombre, teléfono, email) - estos son demasiado frecuentes
- Intereses en propiedades (van en `listing_contact_activity`)
- Tareas relacionadas con listados

---

### 3. **Listing Contact Activity** (`listing_contact_activity`)
**Propósito**: Registrar todas las interacciones y el recorrido del comprador/interesado con un listado específico.

**Cuándo usar**: Cuando un contacto interactúa con una propiedad específica (llamadas, mensajes, visitas, ofertas, etc.).

**Dónde se muestra**: En la pestaña "Actividad" del listado (donde se muestran los interesados).

**Acciones registradas**:

#### ✅ Gestión de Contactos
- `contact_assigned` - Contacto asignado inicialmente al listado
- `contact_type_changed` - Tipo cambiado (comprador → viewer, etc.)
- `status_changed` - Estado del lead cambiado

#### ✅ Comunicación
- `call_logged` - Llamada registrada (dirección, duración, resultado, nivel de interés)
- `email_sent` - Email enviado al contacto sobre este listado
- `whatsapp_sent` - Mensaje de WhatsApp enviado
- `message_received` - Mensaje recibido del contacto

#### ✅ Visitas y Citas
- `appointment_scheduled` - Cita programada
- `appointment_cancelled` - Cita cancelada
- `appointment_rescheduled` - Cita reprogramada
- `viewing_completed` - Visita completada
- `viewing_feedback_received` - Feedback post-visita recibido

#### ✅ Ofertas y Negociación
- `offer_received` - Oferta recibida
- `offer_accepted` - Oferta aceptada
- `offer_rejected` - Oferta rechazada
- `counter_offer_made` - Contraoferta realizada
- `offer_expired` - Oferta expirada
- `financing_status_updated` - Estado de financiación actualizado

#### ✅ Calificación del Lead
- `interest_level_updated` - Nivel de interés actualizado (hot/warm/cold)
- `disqualified` - Lead marcado como no viable
- `source_identified` - Fuente del lead identificada

#### ✅ Progresión hacia Operación
- `deal_created` - Operación creada (movido a etapa de operación)
- `document_requested` - Documento solicitado al contacto
- `document_received` - Documento recibido del contacto

#### ✅ Seguimiento y Tareas
- `follow_up_scheduled` - Seguimiento programado
- `follow_up_completed` - Seguimiento completado
- `notes_added` - Notas importantes añadidas

#### ✅ Matching de Propiedades
- `match_score_updated` - Puntuación de coincidencia actualizada (algoritmo AI)
- `alternative_suggested` - Propiedad alternativa sugerida

#### ✅ Compartir Propiedad y Engagement Digital (NUEVAS - Prioridad Alta)
- `property_shared` - Propiedad compartida con contacto (email, WhatsApp, SMS, link)
- `property_link_clicked` - Contacto hizo clic en enlace compartido (métrica de engagement)
- `virtual_tour_viewed` - Tour virtual visto por contacto
- `document_reviewed` - Documento revisado (planos, certificado energético, etc.)

#### ✅ Señales de Interés y Rechazo (NUEVAS - Prioridad Alta)
- `interest_expressed` - Contacto expresó interés explícito
- `property_rejected` - Contacto rechazó la propiedad
- `second_viewing_requested` - Segunda visita solicitada (señal de interés serio)
- `questions_asked` - Preguntas específicas sobre la propiedad
- `objections_raised` - Objeciones o preocupaciones planteadas

#### ✅ Negociación y Proceso de Compra (NUEVAS - Prioridad Media)
- `price_negotiation_started` - Negociación de precio iniciada
- `inspection_scheduled` - Inspección programada
- `inspection_completed` - Inspección completada
- `financing_application_submitted` - Solicitud de financiación presentada
- `referral_made` - Contacto refirió a otra persona
- `open_house_attended` - Contacto asistió a jornada de puertas abiertas

> **Nota**: Ver `docs/missing-listing-contact-actions.md` para detalles completos de estas nuevas acciones y su priorización.

---

### 4. **Deal Activity** (`deal_activity`)
**Propósito**: Registrar cambios importantes en las operaciones (deals).

**Cuándo usar**: Cuando algo cambia en una operación en curso o cerrada.

**Dónde se muestra**: En el historial de la operación.

**Acciones registradas** (dejar para más adelante según tu solicitud):
- `deal_created` - Operación creada
- `status_changed` - Estado cambiado (Offer → Arras Pending → UnderContract → Closed)
- `price_changed` - Precio final cambiado
- `commission_paid` - Comisión pagada
- `arras_received` - Arras recibidas
- `deed_signed` - Escritura firmada
- `deal_closed` - Operación cerrada
- `deal_cancelled` - Operación cancelada
- Y más...

---

## Recomendaciones sobre el Enfoque

### ✅ **Tu enfoque es CORRECTO**

La separación en 4 tablas es la arquitectura correcta porque:

1. **Separación de responsabilidades**: Cada tabla tiene un propósito claro y específico
2. **Rendimiento**: Consultas más rápidas al filtrar por contexto específico
3. **Escalabilidad**: Fácil de mantener y extender
4. **Claridad**: Los desarrolladores saben exactamente dónde registrar cada acción

### 📋 **Principios de Diseño**

1. **Listing Activity**: Solo cambios en la propiedad/listado en sí mismo
2. **Contact Activity**: Solo eventos críticos del ciclo de vida y GDPR (minimalista)
3. **Listing Contact Activity**: Todas las interacciones entre contacto y listado específico
4. **Deal Activity**: Cambios en operaciones (dejar para más adelante)

### ⚠️ **Puntos de Atención**

1. **Contact Activity debe ser minimalista**: Solo registrar acciones críticas. Si es demasiado frecuente o está relacionada con un listado específico, va en `listing_contact_activity`.

2. **Evitar duplicación**: Si una acción puede ir en dos lugares, elegir el más específico:
   - Llamada sobre un listado específico → `listing_contact_activity`
   - Llamada general sin listado → Considerar si realmente necesita registro

3. **Consistencia**: Usar siempre las funciones de logging (`logListingActivity`, `logContactActivity`, etc.) en lugar de insertar directamente.

---

## Estructura de la Vista "Acciones"

### Propuesta de Implementación

La vista "Acciones" (`AccionesView`) debería mostrar un timeline unificado de todas las actividades relevantes, con filtros para:

#### Filtros Principales
- **Tipo de actividad**: Listing Activity, Contact Activity, Listing Contact Activity, Deal Activity
- **Rango de fechas**: Última semana, mes, trimestre, año, personalizado
- **Prioridad**: Crítica, Alta, Normal, Baja
- **Usuario**: Filtrar por agente que realizó la acción
- **Entidad**: Filtrar por propiedad, contacto, operación específica

#### Modos de Vista
- **Timeline**: Vista cronológica con agrupación por fecha
- **Por tipo**: Agrupado por tipo de actividad
- **Por entidad**: Agrupado por propiedad/contacto/operación

#### Agrupación de Secciones
- **Hoy**
- **Ayer**
- **Esta semana**
- **Este mes**
- **Más antiguo**

#### Tarjetas Individuales
Cada acción debe mostrar:
- **Icono** según el tipo de acción
- **Título** de la acción (ej: "Precio modificado")
- **Descripción** con detalles relevantes
- **Usuario** que realizó la acción
- **Fecha y hora**
- **Badge de prioridad** (si es crítica/alta)
- **Enlace** a la entidad relacionada (propiedad, contacto, operación)

---

## Ejemplos de Uso

### Ejemplo 1: Cambio de Precio
```typescript
// Cuando se cambia el precio de un listado
await logListingActivity({
  listingId: 12345n,
  userId: "user-123",
  action: "price_changed",
  details: {
    field: "price",
    oldValue: 250000,
    newValue: 235000,
    percentChange: -6.0,
    changeType: "reduction",
    reason: "Ajuste de mercado",
    daysActive: 32
  }
});
```
**Se muestra en**: Historial de la propiedad/listado

---

### Ejemplo 2: Llamada a Interesado
```typescript
// Cuando se registra una llamada con un interesado sobre un listado
await logListingContactActivity({
  listingContactId: 5001n,
  userId: "user-123",
  action: "call_logged",
  details: {
    direction: "outbound",
    phoneNumber: "+34 612 345 678",
    duration: 420, // segundos
    outcome: "interested",
    interestLevel: 4,
    appointmentScheduled: true,
    appointmentId: 3456
  }
});
```
**Se muestra en**: Pestaña "Actividad" del listado

---

### Ejemplo 3: Consentimiento GDPR
```typescript
// Cuando un contacto otorga consentimiento
await logContactActivity({
  contactId: 789n,
  userId: "user-123",
  action: "consent_given",
  details: {
    consentType: "marketing",
    method: "email",
    ipAddress: "192.168.1.1",
    timestamp: new Date().toISOString()
  }
});
```
**Se muestra en**: Historial del contacto

---

## Conclusión

Tu arquitectura de 4 tablas de actividad es sólida y bien diseñada. La clave está en:

1. ✅ **Mantener Contact Activity minimalista** - Solo eventos críticos
2. ✅ **Usar Listing Contact Activity para interacciones** - Llamadas, mensajes, visitas relacionadas con listados
3. ✅ **Usar Listing Activity para cambios en propiedades** - Precio, estado, publicación
4. ✅ **Implementar la vista Acciones** - Timeline unificado con filtros potentes

La separación clara de responsabilidades facilitará el mantenimiento y la escalabilidad del sistema.

