# WhatsApp Message Templates - Vesta

Este documento contiene todas las plantillas de WhatsApp para los diferentes casos de uso de la plataforma Vesta.

> **Formato de variables**: Las variables se representan como `{{1}}`, `{{2}}`, etc. y serán reemplazadas por valores dinámicos desde la base de datos.

---

## Tabla de Contenidos

1. [Notificaciones de Tareas (Agentes)](#1-notificaciones-de-tareas-agentes)
2. [Notificaciones de Citas (Agentes)](#2-notificaciones-de-citas-agentes)
3. [Resúmenes Diarios/Semanales](#3-resúmenes-diariossemanales)
4. [Notificaciones para Clientes - Propiedades](#4-notificaciones-para-clientes---propiedades)
5. [Notificaciones para Clientes - Documentos](#5-notificaciones-para-clientes---documentos)
6. [Notificaciones para Clientes - Operaciones](#6-notificaciones-para-clientes---operaciones)
7. [Recordatorios de Citas para Clientes](#7-recordatorios-de-citas-para-clientes)
8. [Autenticación y Seguridad](#8-autenticación-y-seguridad)

---

## 1. Notificaciones de Tareas (Agentes)

### 1.1 Tarea Asignada (`task_assigned`)

**Nombre de plantilla**: `task_assigned`

```
{{1}}, tienes una nueva tarea asignada.

*{{2}}*
{{3}}

Vence: {{4}}
Prioridad: {{5}}

Ver en Vesta: {{6}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Carlos" |
| `{{2}}` | Título de la tarea | "Llamar al propietario" |
| `{{3}}` | Descripción de la tarea | "Confirmar disponibilidad para visita" |
| `{{4}}` | Fecha de vencimiento | "25 dic 2024 a las 10:00" |
| `{{5}}` | Nivel de urgencia | "Alta" |
| `{{6}}` | URL de la tarea | "https://app.vesta.com/tareas?taskId=123" |

---

### 1.2 Tarea Reasignada (`task_reassigned`)

**Nombre de plantilla**: `task_reassigned`

```
{{1}}, se te ha reasignado una tarea.

*{{2}}*
{{3}}

Asignada por: {{4}}
Vence: {{5}}

Ver en Vesta: {{6}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del nuevo asignado | "María" |
| `{{2}}` | Título de la tarea | "Preparar documentación" |
| `{{3}}` | Descripción | "Recopilar documentos para la firma" |
| `{{4}}` | Nombre de quien reasignó | "Juan García" |
| `{{5}}` | Fecha de vencimiento | "26 dic 2024" |
| `{{6}}` | URL de la tarea | "https://app.vesta.com/tareas?taskId=456" |

---

### 1.3 Tarea Completada (`task_completed`)

**Nombre de plantilla**: `task_completed`

```
{{1}}, tu tarea ha sido completada.

*{{2}}*

Completada por: {{3}}
Fecha: {{4}}

Ver detalles: {{5}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del creador de la tarea | "Ana" |
| `{{2}}` | Título de la tarea | "Enviar propuesta al cliente" |
| `{{3}}` | Nombre de quien completó | "Pedro López" |
| `{{4}}` | Fecha de completado | "24 dic 2024 15:30" |
| `{{5}}` | URL de la tarea | "https://app.vesta.com/tareas?taskId=789" |

---

### 1.4 Tarea Vence Pronto (`task_due_soon`)

**Nombre de plantilla**: `task_due_today`

```
{{1}}, tienes una tarea que vence hoy.

*{{2}}*
{{3}}

Hora límite: {{4}}
Prioridad: {{5}}

Completar ahora: {{6}}
```

**Nombre de plantilla**: `task_due_tomorrow`

```
{{1}}, tienes una tarea que vence mañana.

*{{2}}*
{{3}}

Vence: {{4}}
Prioridad: {{5}}

Ver tarea: {{6}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Carlos" |
| `{{2}}` | Título de la tarea | "Confirmar cita con cliente" |
| `{{3}}` | Descripción | "Llamar para confirmar visita" |
| `{{4}}` | Hora/Fecha límite | "18:00" o "25 dic 2024" |
| `{{5}}` | Prioridad | "Urgente" |
| `{{6}}` | URL | "https://app.vesta.com/tareas?taskId=101" |

---

### 1.5 Tarea Vencida (`task_overdue`)

**Nombre de plantilla**: `task_overdue`

```
{{1}}, tienes una tarea vencida que requiere tu atención.

*{{2}}*
{{3}}

Venció: {{4}}
Prioridad: {{5}}

Completar ahora: {{6}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "María" |
| `{{2}}` | Título de la tarea | "Enviar contrato" |
| `{{3}}` | Descripción | "Enviar borrador de contrato al abogado" |
| `{{4}}` | Fecha de vencimiento | "22 dic 2024" |
| `{{5}}` | Prioridad | "Crítica" |
| `{{6}}` | URL | "https://app.vesta.com/tareas?taskId=202" |

---

### 1.6 Tarea Eliminada (`task_deleted`)

**Nombre de plantilla**: `task_deleted`

```
{{1}}, una tarea que te fue asignada ha sido eliminada.

*{{2}}*

Eliminada por: {{3}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del asignado | "Pedro" |
| `{{2}}` | Título de la tarea | "Revisar documentación" |
| `{{3}}` | Nombre de quien eliminó | "Ana García" |

---

## 2. Notificaciones de Citas (Agentes)

### 2.1 Cita Programada (`appointment_scheduled`)

**Nombre de plantilla**: `appointment_scheduled`

```
{{1}}, tienes una nueva cita programada.

*{{2}}*

Fecha: {{3}}
Hora: {{4}} - {{5}}
Tipo: {{6}}
Ubicación: {{7}}

Propiedad: {{8}}
Contacto: {{9}}

Ver en calendario: {{10}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Carlos" |
| `{{2}}` | Título de la cita | "Visita Piso Calle Mayor" |
| `{{3}}` | Fecha | "26 dic 2024" |
| `{{4}}` | Hora inicio | "10:00" |
| `{{5}}` | Hora fin | "11:00" |
| `{{6}}` | Tipo de cita | "Visita" |
| `{{7}}` | Dirección | "Calle Mayor 15, Madrid" |
| `{{8}}` | Referencia propiedad | "REF-2024-001" |
| `{{9}}` | Nombre del contacto | "Juan Pérez" |
| `{{10}}` | URL del calendario | "https://app.vesta.com/calendario" |

---

### 2.2 Cita Reagendada (`appointment_rescheduled`)

**Nombre de plantilla**: `appointment_rescheduled`

```
{{1}}, tu cita ha sido reagendada.

*{{2}}*

Nueva fecha: {{3}}
Nueva hora: {{4}} - {{5}}

Fecha anterior: {{6}}

Ubicación: {{7}}
Contacto: {{8}}

Ver cambios: {{9}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "María" |
| `{{2}}` | Título de la cita | "Firma de arras" |
| `{{3}}` | Nueva fecha | "28 dic 2024" |
| `{{4}}` | Nueva hora inicio | "16:00" |
| `{{5}}` | Nueva hora fin | "17:00" |
| `{{6}}` | Fecha/hora anterior | "27 dic 2024 15:00" |
| `{{7}}` | Ubicación | "Notaría García, Madrid" |
| `{{8}}` | Contacto | "Pedro López" |
| `{{9}}` | URL | "https://app.vesta.com/calendario" |

---

### 2.3 Cita Cancelada (`appointment_cancelled`)

**Nombre de plantilla**: `appointment_cancelled`

```
{{1}}, tu cita ha sido cancelada.

*{{2}}*

Fecha programada: {{3}} a las {{4}}
Cancelada por: {{5}}

Contacto: {{6}}
Propiedad: {{7}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Ana" |
| `{{2}}` | Título de la cita | "Visita apartamento" |
| `{{3}}` | Fecha | "25 dic 2024" |
| `{{4}}` | Hora | "11:00" |
| `{{5}}` | Quien canceló | "Cliente" |
| `{{6}}` | Contacto | "Luis Martínez" |
| `{{7}}` | Referencia | "REF-2024-015" |

---

### 2.4 Recordatorio de Cita - 24 horas (`appointment_reminder_24h`)

**Nombre de plantilla**: `appointment_reminder_24h`

```
{{1}}, recordatorio: tienes una cita mañana.

*{{2}}*

Fecha: {{3}}
Hora: {{4}}
Tipo: {{5}}

Ubicación: {{6}}
Contacto: {{7}} - {{8}}

Preparación:
{{9}}

Ver detalles: {{10}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Carlos" |
| `{{2}}` | Título | "Visita Chalet Las Rozas" |
| `{{3}}` | Fecha | "26 dic 2024" |
| `{{4}}` | Hora | "10:00" |
| `{{5}}` | Tipo | "Visita" |
| `{{6}}` | Dirección | "Calle del Pinar 8, Las Rozas" |
| `{{7}}` | Nombre contacto | "María García" |
| `{{8}}` | Teléfono | "+34 612 345 678" |
| `{{9}}` | Notas preparación | "Llevar llaves, cliente interesado en jardín" |
| `{{10}}` | URL | "https://app.vesta.com/calendario?id=123" |

---

### 2.5 Recordatorio de Cita - 30 minutos (`appointment_reminder_30min`)

**Nombre de plantilla**: `appointment_reminder_30min`

```
{{1}}, tu cita empieza en 30 minutos.

*{{2}}*

Hora: {{3}}
Ubicación: {{4}}

Contacto: {{5}}
Tel: {{6}}

Cómo llegar: {{7}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Pedro" |
| `{{2}}` | Título | "Firma contrato" |
| `{{3}}` | Hora | "15:00" |
| `{{4}}` | Ubicación | "Notaría Central, Gran Vía 50" |
| `{{5}}` | Contacto | "Juan López" |
| `{{6}}` | Teléfono | "+34 666 777 888" |
| `{{7}}` | URL Google Maps | "https://maps.google.com/..." |

---

## 3. Resúmenes Diarios/Semanales

### 3.1 Resumen Diario (`daily_briefing`)

**Nombre de plantilla**: `daily_briefing`

```
Buenos días {{1}}, este es tu resumen para hoy {{2}}.

*CITAS DE HOY*
{{3}}

*TAREAS PENDIENTES*
{{4}}

Total: {{5}} citas, {{6}} tareas

Ver agenda completa: {{7}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del agente | "Carlos" |
| `{{2}}` | Fecha | "lunes, 25 de diciembre" |
| `{{3}}` | Lista de citas | "10:00 - Visita Piso Mayor\n14:00 - Firma arras" |
| `{{4}}` | Lista de tareas | "Llamar propietario REF-001\nEnviar documentación" |
| `{{5}}` | Número de citas | "2" |
| `{{6}}` | Número de tareas | "3" |
| `{{7}}` | URL | "https://app.vesta.com/dashboard" |

---

### 3.2 Resumen Semanal (`weekly_briefing`)

**Nombre de plantilla**: `weekly_briefing`

```
{{1}}, este es tu resumen semanal.

*Semana del {{2}} al {{3}}*

CITAS PROGRAMADAS: {{4}}
{{5}}

TAREAS PENDIENTES: {{6}}
{{7}}

Ver planificación: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre | "María" |
| `{{2}}` | Fecha inicio semana | "25 dic" |
| `{{3}}` | Fecha fin semana | "31 dic" |
| `{{4}}` | Total citas | "5" |
| `{{5}}` | Resumen citas | "Lun: 2 visitas\nMar: 1 firma\nMié: 2 reuniones" |
| `{{6}}` | Total tareas | "8" |
| `{{7}}` | Resumen tareas | "3 urgentes, 5 normales" |
| `{{8}}` | URL | "https://app.vesta.com/calendario" |

---

### 3.3 Resumen de Tareas Vencidas (`task_digest`)

**Nombre de plantilla**: `task_overdue_digest`

```
{{1}}, tienes {{2}} tareas vencidas que requieren atención.

{{3}}

Por favor, revisa y completa estas tareas lo antes posible.

Ver todas: {{4}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre | "Ana" |
| `{{2}}` | Número de tareas | "3" |
| `{{3}}` | Lista de tareas | "- Llamar cliente (vencida hace 2 días)\n- Enviar fotos (vencida ayer)" |
| `{{4}}` | URL | "https://app.vesta.com/tareas?filter=overdue" |

---

## 4. Notificaciones para Clientes - Propiedades

### 4.1 Nueva Propiedad (`customer_new_listing`)

**Nombre de plantilla**: `customer_new_listing`

```
Hola {{1}}, tenemos una nueva propiedad que podría interesarte.

*{{2}}*
{{3}}

Precio: {{4}}
Superficie: {{5}} m²
Habitaciones: {{6}} | Baños: {{7}}

Ubicación: {{8}}

{{9}}

Ver propiedad: {{10}}

Tu agente: {{11}}
Tel: {{12}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Juan" |
| `{{2}}` | Título propiedad | "Piso luminoso en el centro" |
| `{{3}}` | Descripción breve | "Apartamento reformado con terraza" |
| `{{4}}` | Precio | "285.000 €" |
| `{{5}}` | Superficie | "95" |
| `{{6}}` | Habitaciones | "3" |
| `{{7}}` | Baños | "2" |
| `{{8}}` | Ubicación | "Centro, Madrid" |
| `{{9}}` | Características destacadas | "Terraza 15m², parking incluido" |
| `{{10}}` | URL propiedad | "https://..." |
| `{{11}}` | Nombre agente | "Carlos García" |
| `{{12}}` | Teléfono agente | "+34 612 345 678" |

---

### 4.2 Cambio de Precio (`customer_price_change`)

**Nombre de plantilla**: `customer_price_change`

```
Hola {{1}}, la propiedad que te interesaba ha bajado de precio.

*{{2}}*

Precio anterior: {{3}}
Nuevo precio: {{4}}
Ahorro: {{5}} ({{6}}%)

Ubicación: {{7}}

Esta es una oportunidad que no querrás perderte.

Ver propiedad: {{8}}

¿Te gustaría programar una visita?
Contacta con {{9}}: {{10}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "María" |
| `{{2}}` | Título propiedad | "Chalet en Las Rozas" |
| `{{3}}` | Precio anterior | "450.000 €" |
| `{{4}}` | Nuevo precio | "420.000 €" |
| `{{5}}` | Ahorro | "30.000 €" |
| `{{6}}` | Porcentaje descuento | "6.7" |
| `{{7}}` | Ubicación | "Las Rozas, Madrid" |
| `{{8}}` | URL | "https://..." |
| `{{9}}` | Nombre agente | "Ana López" |
| `{{10}}` | Teléfono | "+34 666 777 888" |

---

### 4.3 Cambio de Estado (`customer_status_change`)

**Nombre de plantilla**: `customer_status_change`

```
Hola {{1}}, hay novedades sobre la propiedad {{2}}.

Estado anterior: {{3}}
Nuevo estado: {{4}}

{{5}}

Ver detalles: {{6}}

Tu agente {{7}} está disponible para resolver cualquier duda.
Tel: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Pedro" |
| `{{2}}` | Referencia/Título | "REF-2024-001" |
| `{{3}}` | Estado anterior | "Disponible" |
| `{{4}}` | Nuevo estado | "Reservado" |
| `{{5}}` | Mensaje adicional | "Si tienes interés, actúa rápido" |
| `{{6}}` | URL | "https://..." |
| `{{7}}` | Nombre agente | "Carlos" |
| `{{8}}` | Teléfono | "+34 612 345 678" |

---

### 4.4 Nuevas Fotos (`customer_new_photos`)

**Nombre de plantilla**: `customer_new_photos`

```
Hola {{1}}, hemos añadido {{2}} nuevas fotos de la propiedad que te interesa.

*{{3}}*
{{4}}

Ahora puedes ver:
{{5}}

Ver todas las fotos: {{6}}

¿Te gustaría visitarla?
Contacta con {{7}}: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Laura" |
| `{{2}}` | Número de fotos | "8" |
| `{{3}}` | Título propiedad | "Ático con vistas" |
| `{{4}}` | Dirección | "Paseo de la Castellana, Madrid" |
| `{{5}}` | Descripción fotos | "Terraza, vistas panorámicas, salón reformado" |
| `{{6}}` | URL | "https://..." |
| `{{7}}` | Nombre agente | "María" |
| `{{8}}` | Teléfono | "+34 666 123 456" |

---

## 5. Notificaciones para Clientes - Documentos

### 5.1 Documento Listo (`customer_document_ready`)

**Nombre de plantilla**: `customer_document_ready`

```
Hola {{1}}, tu documento está listo para descargar.

*{{2}}*
Tipo: {{3}}

{{4}}

Descargar documento: {{5}}

Si tienes dudas, contacta con {{6}}.
Tel: {{7}}
Email: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Juan" |
| `{{2}}` | Nombre documento | "Contrato de arras" |
| `{{3}}` | Tipo documento | "Contrato" |
| `{{4}}` | Descripción | "Borrador del contrato de arras para revisión" |
| `{{5}}` | URL descarga | "https://..." |
| `{{6}}` | Nombre agente | "Carlos García" |
| `{{7}}` | Teléfono | "+34 612 345 678" |
| `{{8}}` | Email | "carlos@inmobiliaria.com" |

---

### 5.2 Firma Requerida (`customer_signature_required`)

**Nombre de plantilla**: `customer_signature_required`

```
Hola {{1}}, necesitamos tu firma en un documento.

*{{2}}*

{{3}}

Fecha límite: {{4}}

Firmar documento: {{5}}

Es importante completar este paso para continuar con el proceso.

¿Tienes dudas? Contacta con {{6}}: {{7}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "María" |
| `{{2}}` | Nombre documento | "Nota de encargo" |
| `{{3}}` | Descripción | "Autorización para gestionar la venta de tu propiedad" |
| `{{4}}` | Fecha límite | "28 dic 2024" |
| `{{5}}` | URL firma | "https://..." |
| `{{6}}` | Nombre agente | "Ana López" |
| `{{7}}` | Teléfono | "+34 666 777 888" |

---

### 5.3 Documento por Vencer (`customer_document_expiring`)

**Nombre de plantilla**: `customer_document_expiring`

```
Hola {{1}}, tu documento está próximo a vencer.

*{{2}}*

Fecha de vencimiento: {{3}}
Días restantes: {{4}}

{{5}}

Renovar documento: {{6}}

Contacta con {{7}} si necesitas ayuda: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Pedro" |
| `{{2}}` | Nombre documento | "Certificado energético" |
| `{{3}}` | Fecha vencimiento | "15 ene 2025" |
| `{{4}}` | Días restantes | "22" |
| `{{5}}` | Instrucciones renovación | "Solicita una nueva inspección energética" |
| `{{6}}` | URL | "https://..." |
| `{{7}}` | Nombre agente | "Carlos" |
| `{{8}}` | Teléfono | "+34 612 345 678" |

---

## 6. Notificaciones para Clientes - Operaciones

### 6.1 Oferta Recibida (`customer_offer_received`)

**Nombre de plantilla**: `customer_offer_received`

```
Hola {{1}}, has recibido una oferta por tu propiedad.

*{{2}}*

Importe ofertado: {{3}}
Condiciones: {{4}}

Válida hasta: {{5}}

Esta es una oportunidad importante. Por favor, revisa los detalles.

Ver oferta: {{6}}

Tu agente {{7}} te contactará pronto para comentarla.
Tel: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre propietario | "Juan" |
| `{{2}}` | Dirección propiedad | "Calle Mayor 15, Madrid" |
| `{{3}}` | Importe oferta | "275.000 €" |
| `{{4}}` | Condiciones | "Sin hipoteca, disponibilidad inmediata" |
| `{{5}}` | Fecha validez | "30 dic 2024" |
| `{{6}}` | URL | "https://..." |
| `{{7}}` | Nombre agente | "Carlos García" |
| `{{8}}` | Teléfono | "+34 612 345 678" |

---

### 6.2 Oferta Aceptada (`customer_offer_accepted`)

**Nombre de plantilla**: `customer_offer_accepted`

```
Hola {{1}}, ¡tu oferta ha sido aceptada!

*{{2}}*

Precio acordado: {{3}}
Fecha aceptación: {{4}}

Próximos pasos:
{{5}}

Ver detalles: {{6}}

Tu agente {{7}} te guiará en todo el proceso.
Tel: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre comprador | "María" |
| `{{2}}` | Dirección propiedad | "Piso en Calle Gran Vía" |
| `{{3}}` | Precio | "285.000 €" |
| `{{4}}` | Fecha | "24 dic 2024" |
| `{{5}}` | Próximos pasos | "1. Firma de arras (5.000€)\n2. Tramitar hipoteca\n3. Firma notaría" |
| `{{6}}` | URL | "https://..." |
| `{{7}}` | Nombre agente | "Ana López" |
| `{{8}}` | Teléfono | "+34 666 777 888" |

---

### 6.3 Operación Cerrada (`customer_deal_closed`)

**Nombre de plantilla**: `customer_deal_closed`

```
Hola {{1}}, ¡enhorabuena! La operación se ha completado con éxito.

*{{2}}*

Precio final: {{3}}
Fecha de cierre: {{4}}

{{5}}

Documentos disponibles: {{6}}

Ha sido un placer ayudarte. Si necesitas algo más, estamos a tu disposición.

{{7}}
Tel: {{8}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Pedro" |
| `{{2}}` | Dirección propiedad | "Chalet en Las Rozas" |
| `{{3}}` | Precio final | "420.000 €" |
| `{{4}}` | Fecha cierre | "24 dic 2024" |
| `{{5}}` | Información post-cierre | "Recuerda cambiar la titularidad de suministros" |
| `{{6}}` | URL documentos | "https://..." |
| `{{7}}` | Nombre agente | "Carlos García" |
| `{{8}}` | Teléfono | "+34 612 345 678" |

---

### 6.4 Pago Recibido (`customer_payment_received`)

**Nombre de plantilla**: `customer_payment_received`

```
Hola {{1}}, hemos recibido tu pago correctamente.

Importe: {{2}}
Concepto: {{3}}
Fecha: {{4}}
Referencia: {{5}}

{{6}}

Ver recibo: {{7}}

¿Tienes dudas? Contacta con {{8}}: {{9}}
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "María" |
| `{{2}}` | Importe | "10.000 €" |
| `{{3}}` | Concepto | "Señal de arras" |
| `{{4}}` | Fecha | "24 dic 2024" |
| `{{5}}` | Referencia | "PAY-2024-001234" |
| `{{6}}` | Próximos pasos | "Próximo pago: 20.000€ en firma de escritura" |
| `{{7}}` | URL recibo | "https://..." |
| `{{8}}` | Nombre agente | "Ana López" |
| `{{9}}` | Teléfono | "+34 666 777 888" |

---

## 7. Recordatorios de Citas para Clientes

### 7.1 Recordatorio Visita - 24h (`customer_visit_reminder_24h`)

**Nombre de plantilla**: `customer_visit_reminder_24h`

```
Hola {{1}}, te recordamos que tienes una visita programada para mañana.

*{{2}}*

Fecha: {{3}}
Hora: {{4}}
Dirección: {{5}}

Te recibirá: {{6}}
Tel: {{7}}

{{8}}

¿Necesitas cambiar la cita? Avísanos con antelación.
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Juan" |
| `{{2}}` | Título visita | "Visita piso Calle Mayor" |
| `{{3}}` | Fecha | "26 dic 2024" |
| `{{4}}` | Hora | "10:00" |
| `{{5}}` | Dirección | "Calle Mayor 15, 3ºB, Madrid" |
| `{{6}}` | Nombre agente | "Carlos García" |
| `{{7}}` | Teléfono | "+34 612 345 678" |
| `{{8}}` | Notas | "Portal con código: 1234" |

---

### 7.2 Recordatorio Visita - 1h (`customer_visit_reminder_1h`)

**Nombre de plantilla**: `customer_visit_reminder_1h`

```
Hola {{1}}, tu visita es en 1 hora.

*{{2}}*

Hora: {{3}}
Dirección: {{4}}

Te espera {{5}}.

Cómo llegar: {{6}}

Si tienes cualquier problema, llama al {{7}}.
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "María" |
| `{{2}}` | Título | "Visita ático Castellana" |
| `{{3}}` | Hora | "15:00" |
| `{{4}}` | Dirección | "Paseo de la Castellana 100" |
| `{{5}}` | Nombre agente | "Ana López" |
| `{{6}}` | URL Maps | "https://maps.google.com/..." |
| `{{7}}` | Teléfono | "+34 666 777 888" |

---

### 7.3 Recordatorio Firma (`customer_signature_reminder`)

**Nombre de plantilla**: `customer_signature_reminder`

```
Hola {{1}}, te recordamos la firma programada.

*{{2}}*

Fecha: {{3}}
Hora: {{4}}
Lugar: {{5}}

Documentos necesarios:
{{6}}

Te acompañará {{7}}.
Tel: {{8}}

Es muy importante la puntualidad. ¿Tienes todo preparado?
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre cliente | "Pedro" |
| `{{2}}` | Tipo firma | "Firma de arras" |
| `{{3}}` | Fecha | "27 dic 2024" |
| `{{4}}` | Hora | "12:00" |
| `{{5}}` | Lugar | "Notaría García, Gran Vía 50, Madrid" |
| `{{6}}` | Documentos | "- DNI original\n- Justificante transferencia\n- Nota simple actualizada" |
| `{{7}}` | Nombre agente | "Carlos García" |
| `{{8}}` | Teléfono | "+34 612 345 678" |

---

## 8. Autenticación y Seguridad

### 8.1 Código de Recuperación de Contraseña (`password_reset_code`)

**Nombre de plantilla**: `password_reset_code`

```
Tu código de verificación de Vesta es: {{1}}

Este código expira en {{2}} minutos.

Si no solicitaste este código, ignora este mensaje.

No compartas este código con nadie.
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Código 6 dígitos | "123456" |
| `{{2}}` | Minutos validez | "5" |

---

### 8.2 Código de Verificación 2FA (`2fa_verification_code`)

**Nombre de plantilla**: `2fa_verification_code`

```
Tu código de verificación de Vesta es: {{1}}

Válido por {{2}} minutos.

Si no intentaste iniciar sesión, cambia tu contraseña inmediatamente.
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Código | "789012" |
| `{{2}}` | Minutos validez | "5" |

---

## Notas de Implementación

### Registro de Plantillas en WhatsApp Business API

1. **Cada plantilla debe ser aprobada** por Meta antes de poder usarse
2. **Categorías recomendadas**:
   - `UTILITY` para notificaciones transaccionales (citas, tareas, documentos)
   - `MARKETING` para promociones de propiedades (nuevos listados, cambios precio)
   - `AUTHENTICATION` para códigos de verificación

### Límites y Restricciones

- Máximo **1024 caracteres** por mensaje
- Máximo **4 variables** de texto con marcador de posición por plantilla
- Las variables no pueden estar al principio del mensaje
- Los botones son opcionales pero recomendados para CTAs

### Estructura en Base de Datos

```sql
CREATE TABLE whatsapp_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_name VARCHAR(100) NOT NULL,
  template_id VARCHAR(100), -- ID de Meta
  category ENUM('UTILITY', 'MARKETING', 'AUTHENTICATION'),
  language VARCHAR(10) DEFAULT 'es',
  status ENUM('pending', 'approved', 'rejected'),
  variables JSON, -- Mapeo de variables
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Ejemplo de Uso en Código

```typescript
interface WhatsAppTemplateMessage {
  templateName: string;
  recipientPhone: string;
  variables: Record<string, string>;
}

async function sendWhatsAppTemplate(message: WhatsAppTemplateMessage) {
  const { templateName, recipientPhone, variables } = message;

  // Construir el payload para la API de WhatsApp Business
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: "es" },
      components: [
        {
          type: "body",
          parameters: Object.values(variables).map(value => ({
            type: "text",
            text: value,
          })),
        },
      ],
    },
  };

  // Enviar a la API
  return await whatsappApi.sendMessage(payload);
}
```

---

## Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2024-12-23 | 1.0 | Versión inicial con todas las plantillas |
