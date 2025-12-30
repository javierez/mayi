# WhatsApp Content Templates for Vesta CRM

Este documento contiene todas las plantillas de WhatsApp para notificaciones internas del equipo.
Las plantillas están diseñadas para incluir la misma información que los emails.

> **Formato de variables**: Las variables se representan como `{{1}}`, `{{2}}`, etc.

---

## Configuracion de Template SIDs

Despues de crear las plantillas en Twilio, registra los SIDs aqui:

```typescript
const WHATSAPP_TEMPLATES = {
  // Task Templates
  task_assigned: "HX_______________________",
  task_completed: "HX_______________________",
  task_reassigned: "HX_______________________",
  task_due_soon: "HX_______________________",
  task_overdue: "HX_______________________",

  // Appointment Templates
  appointment_scheduled: "HX_______________________",
  appointment_rescheduled: "HX_______________________",
  appointment_cancelled: "HX_______________________",
  appointment_reminder: "HX_______________________",
};
```

---

## Tabla de Contenidos

1. [Plantillas de Tareas](#1-plantillas-de-tareas)
2. [Plantillas de Citas](#2-plantillas-de-citas)
3. [Tablas de Referencia](#3-tablas-de-referencia)
4. [Notas de Implementacion](#4-notas-de-implementacion)

---

## 1. Plantillas de Tareas

### 1.1 Tarea Asignada (`vesta_task_assigned_es`)

**Configuracion Twilio:**
- Name: `vesta_task_assigned_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
📋 *Nueva tarea asignada*

*{{1}}*

{{2}}

👤 Asignada por: {{3}}
📆 Fecha limite: {{4}}
⚡ Urgencia: {{5}}
🏷️ Categoria: {{6}}

🏠 *Propiedad*
{{7}}
Ref: {{8}}

👤 *Contacto*
{{9}} ({{10}})
📱 {{11}}

Ver en Vesta: {{12}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la tarea | Llamar a Maria Garcia para confirmar visita |
| {{2}} | Descripcion de la tarea | Contactar antes del mediodia para confirmar disponibilidad |
| {{3}} | Nombre del asignador | Juan Perez |
| {{4}} | Fecha y hora limite | Viernes 20 de enero de 2025 a las 14:00 |
| {{5}} | Urgencia | Alta |
| {{6}} | Categoria | Seguimiento |
| {{7}} | Direccion de la propiedad | Calle Mayor 23, 2oB, Madrid |
| {{8}} | Referencia de la propiedad | V-2024-0156 |
| {{9}} | Nombre del contacto | Maria Garcia Lopez |
| {{10}} | Tipo de contacto | Propietario |
| {{11}} | Telefono del contacto | +34 612 345 678 |
| {{12}} | Link de Vesta | https://vesta.app/tareas |

**Ejemplo Completo:**
```
📋 *Nueva tarea asignada*

*Llamar a Maria Garcia para confirmar visita*

Contactar antes del mediodia para confirmar disponibilidad

👤 Asignada por: Juan Perez
📆 Fecha limite: Viernes 20 de enero de 2025 a las 14:00
⚡ Urgencia: Alta
🏷️ Categoria: Seguimiento

🏠 *Propiedad*
Calle Mayor 23, 2oB, Madrid
Ref: V-2024-0156

👤 *Contacto*
Maria Garcia Lopez (Propietario)
📱 +34 612 345 678

Ver en Vesta: https://vesta.app/tareas
```

---

### 1.2 Tarea Completada (`vesta_task_completed_es`)

**Configuracion Twilio:**
- Name: `vesta_task_completed_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
✅ *Tarea completada*

*{{1}}*

{{2}}

👤 Completada por: {{3}}
📆 Fecha de completado: {{4}}

🏠 *Propiedad*
{{5}}
Ref: {{6}}

Ver en Vesta: {{7}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la tarea | Llamar a Maria Garcia para confirmar visita |
| {{2}} | Descripcion de la tarea | Contactar antes del mediodia para confirmar disponibilidad |
| {{3}} | Nombre de quien completo | Ana Lopez |
| {{4}} | Fecha de completado | Viernes 20 de enero de 2025 a las 11:30 |
| {{5}} | Direccion de la propiedad | Calle Mayor 23, 2oB, Madrid |
| {{6}} | Referencia de la propiedad | V-2024-0156 |
| {{7}} | Link de Vesta | https://vesta.app/tareas |

**Ejemplo Completo:**
```
✅ *Tarea completada*

*Llamar a Maria Garcia para confirmar visita*

Contactar antes del mediodia para confirmar disponibilidad

👤 Completada por: Ana Lopez
📆 Fecha de completado: Viernes 20 de enero de 2025 a las 11:30

🏠 *Propiedad*
Calle Mayor 23, 2oB, Madrid
Ref: V-2024-0156

Ver en Vesta: https://vesta.app/tareas
```

---

### 1.3 Tarea Reasignada (`vesta_task_reassigned_es`)

**Configuracion Twilio:**
- Name: `vesta_task_reassigned_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
🔄 *Tarea reasignada*

*{{1}}*

{{2}}

👤 Reasignada por: {{3}}
👤 Nuevo responsable: {{4}}
📆 Fecha limite: {{5}}
⚡ Urgencia: {{6}}

🏠 *Propiedad*
{{7}}
Ref: {{8}}

👤 *Contacto*
{{9}} ({{10}})
📱 {{11}}

Ver en Vesta: {{12}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la tarea | Preparar documentacion para firma |
| {{2}} | Descripcion de la tarea | Reunir todos los documentos necesarios para la firma del contrato |
| {{3}} | Nombre del reasignador | Juan Perez |
| {{4}} | Nombre del nuevo asignado | Ana Lopez |
| {{5}} | Fecha y hora limite | Lunes 22 de enero de 2025 a las 10:00 |
| {{6}} | Urgencia | Urgente |
| {{7}} | Direccion de la propiedad | Avenida Diagonal 456, Barcelona |
| {{8}} | Referencia de la propiedad | V-2024-0234 |
| {{9}} | Nombre del contacto | Pedro Martinez |
| {{10}} | Tipo de contacto | Comprador |
| {{11}} | Telefono del contacto | +34 623 456 789 |
| {{12}} | Link de Vesta | https://vesta.app/tareas |

**Ejemplo Completo:**
```
🔄 *Tarea reasignada*

*Preparar documentacion para firma*

Reunir todos los documentos necesarios para la firma del contrato

👤 Reasignada por: Juan Perez
👤 Nuevo responsable: Ana Lopez
📆 Fecha limite: Lunes 22 de enero de 2025 a las 10:00
⚡ Urgencia: Urgente

🏠 *Propiedad*
Avenida Diagonal 456, Barcelona
Ref: V-2024-0234

👤 *Contacto*
Pedro Martinez (Comprador)
📱 +34 623 456 789

Ver en Vesta: https://vesta.app/tareas
```

---

### 1.4 Tarea Proxima a Vencer (`vesta_task_due_soon_es`)

**Configuracion Twilio:**
- Name: `vesta_task_due_soon_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
⏰ *Tarea proxima a vencer*

*{{1}}*

{{2}}

⏳ Vence en: {{3}}
📆 Fecha limite: {{4}}
⚡ Urgencia: {{5}}

🏠 *Propiedad*
{{6}}
Ref: {{7}}

👤 *Contacto*
{{8}} ({{9}})
📱 {{10}}

Ver en Vesta: {{11}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la tarea | Enviar contrato al cliente |
| {{2}} | Descripcion de la tarea | Enviar el contrato de arras por email al comprador |
| {{3}} | Tiempo restante | 2 horas y 30 minutos |
| {{4}} | Fecha y hora limite | Hoy a las 16:00 |
| {{5}} | Urgencia | Alta |
| {{6}} | Direccion de la propiedad | Calle Sol 12, Valencia |
| {{7}} | Referencia de la propiedad | V-2024-0189 |
| {{8}} | Nombre del contacto | Laura Fernandez |
| {{9}} | Tipo de contacto | Comprador |
| {{10}} | Telefono del contacto | +34 634 567 890 |
| {{11}} | Link de Vesta | https://vesta.app/tareas |

**Ejemplo Completo:**
```
⏰ *Tarea proxima a vencer*

*Enviar contrato al cliente*

Enviar el contrato de arras por email al comprador

⏳ Vence en: 2 horas y 30 minutos
📆 Fecha limite: Hoy a las 16:00
⚡ Urgencia: Alta

🏠 *Propiedad*
Calle Sol 12, Valencia
Ref: V-2024-0189

👤 *Contacto*
Laura Fernandez (Comprador)
📱 +34 634 567 890

Ver en Vesta: https://vesta.app/tareas
```

---

### 1.5 Tarea Vencida (`vesta_task_overdue_es`)

**Configuracion Twilio:**
- Name: `vesta_task_overdue_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
🚨 *Tarea vencida*

*{{1}}*

{{2}}

⚠️ Vencida hace: {{3}}
📆 Fecha limite original: {{4}}
⚡ Urgencia: {{5}}

🏠 *Propiedad*
{{6}}
Ref: {{7}}

👤 *Contacto*
{{8}} ({{9}})
📱 {{10}}

Accede a Vesta urgentemente: {{11}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la tarea | Confirmar cita con notario |
| {{2}} | Descripcion de la tarea | Llamar a la notaria para confirmar hora de firma |
| {{3}} | Tiempo vencido | 1 dia y 3 horas |
| {{4}} | Fecha limite original | Ayer a las 12:00 |
| {{5}} | Urgencia | Critica |
| {{6}} | Direccion de la propiedad | Paseo de Gracia 78, Barcelona |
| {{7}} | Referencia de la propiedad | V-2024-0167 |
| {{8}} | Nombre del contacto | Carlos Ruiz |
| {{9}} | Tipo de contacto | Propietario |
| {{10}} | Telefono del contacto | +34 645 678 901 |
| {{11}} | Link de Vesta | https://vesta.app/tareas |

**Ejemplo Completo:**
```
🚨 *Tarea vencida*

*Confirmar cita con notario*

Llamar a la notaria para confirmar hora de firma

⚠️ Vencida hace: 1 dia y 3 horas
📆 Fecha limite original: Ayer a las 12:00
⚡ Urgencia: Critica

🏠 *Propiedad*
Paseo de Gracia 78, Barcelona
Ref: V-2024-0167

👤 *Contacto*
Carlos Ruiz (Propietario)
📱 +34 645 678 901

Accede a Vesta urgentemente: https://vesta.app/tareas
```

---

## 2. Plantillas de Citas

### 2.1 Cita Programada (`vesta_apt_scheduled_es`)

**Configuracion Twilio:**
- Name: `vesta_apt_scheduled_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
📅 *Nueva cita programada*

*{{1}}*
🏷️ Tipo: {{2}}

📆 {{3}}
🕐 {{4}} - {{5}}
📍 {{6}}

👤 Programada por: {{7}}

🏠 *Propiedad*
{{8}}
Ref: {{9}}

👤 *Propietario*
{{10}}
📱 {{11}}

👤 *Comprador*
{{12}}
📱 {{13}}

Ver en Vesta: {{14}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la cita | Visita piso Calle Mayor |
| {{2}} | Tipo de cita | Visita |
| {{3}} | Fecha | Lunes 15 de enero de 2025 |
| {{4}} | Hora inicio | 10:00 |
| {{5}} | Hora fin | 11:00 |
| {{6}} | Ubicacion/Notas | Llevar llaves del buzon |
| {{7}} | Nombre del programador | Juan Perez |
| {{8}} | Direccion de la propiedad | Calle Mayor 23, 2oB, Madrid |
| {{9}} | Referencia de la propiedad | V-2024-0156 |
| {{10}} | Nombre del propietario | Maria Garcia Lopez |
| {{11}} | Telefono del propietario | +34 612 345 678 |
| {{12}} | Nombre del comprador | Pedro Martinez |
| {{13}} | Telefono del comprador | +34 623 456 789 |
| {{14}} | Link de Vesta | https://vesta.app/calendario |

**Ejemplo Completo:**
```
📅 *Nueva cita programada*

*Visita piso Calle Mayor*
🏷️ Tipo: Visita

📆 Lunes 15 de enero de 2025
🕐 10:00 - 11:00
📍 Llevar llaves del buzon

👤 Programada por: Juan Perez

🏠 *Propiedad*
Calle Mayor 23, 2oB, Madrid
Ref: V-2024-0156

👤 *Propietario*
Maria Garcia Lopez
📱 +34 612 345 678

👤 *Comprador*
Pedro Martinez
📱 +34 623 456 789

Ver en Vesta: https://vesta.app/calendario
```

---

### 2.2 Cita Reprogramada (`vesta_apt_rescheduled_es`)

**Configuracion Twilio:**
- Name: `vesta_apt_rescheduled_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
📅 *Cita reprogramada*

*{{1}}*
🏷️ Tipo: {{2}}

🆕 *Nueva fecha*
📆 {{3}} a las {{4}}

❌ *Fecha anterior*
{{5}}

📍 {{6}}

👤 Reprogramada por: {{7}}

🏠 *Propiedad*
{{8}}
Ref: {{9}}

👤 *Propietario*
{{10}}
📱 {{11}}

👤 *Comprador*
{{12}}
📱 {{13}}

Ver en Vesta: {{14}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la cita | Firma contrato alquiler |
| {{2}} | Tipo de cita | Firma |
| {{3}} | Nueva fecha | Miercoles 17 de enero de 2025 |
| {{4}} | Nueva hora | 16:00 |
| {{5}} | Fecha/hora anterior | Martes 16 de enero de 2025 a las 10:00 |
| {{6}} | Ubicacion/Notas | Notaria Garcia, Calle Sol 5 |
| {{7}} | Nombre del reprogramador | Ana Lopez |
| {{8}} | Direccion de la propiedad | Avenida Diagonal 456, Barcelona |
| {{9}} | Referencia de la propiedad | V-2024-0234 |
| {{10}} | Nombre del propietario | Roberto Sanchez |
| {{11}} | Telefono del propietario | +34 634 567 890 |
| {{12}} | Nombre del comprador | Pedro Martinez |
| {{13}} | Telefono del comprador | +34 623 456 789 |
| {{14}} | Link de Vesta | https://vesta.app/calendario |

**Ejemplo Completo:**
```
📅 *Cita reprogramada*

*Firma contrato alquiler*
🏷️ Tipo: Firma

🆕 *Nueva fecha*
📆 Miercoles 17 de enero de 2025 a las 16:00

❌ *Fecha anterior*
Martes 16 de enero de 2025 a las 10:00

📍 Notaria Garcia, Calle Sol 5

👤 Reprogramada por: Ana Lopez

🏠 *Propiedad*
Avenida Diagonal 456, Barcelona
Ref: V-2024-0234

👤 *Propietario*
Roberto Sanchez
📱 +34 634 567 890

👤 *Comprador*
Pedro Martinez
📱 +34 623 456 789

Ver en Vesta: https://vesta.app/calendario
```

---

### 2.3 Cita Cancelada (`vesta_apt_cancelled_es`)

**Configuracion Twilio:**
- Name: `vesta_apt_cancelled_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
❌ *Cita cancelada*

*{{1}}*
🏷️ Tipo: {{2}}

📆 Fecha original: {{3}} a las {{4}}
📍 {{5}}

👤 Cancelada por: {{6}}
💬 Motivo: {{7}}

🏠 *Propiedad*
{{8}}
Ref: {{9}}

👤 *Propietario*
{{10}}
📱 {{11}}

👤 *Comprador*
{{12}}
📱 {{13}}

Ver en Vesta: {{14}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Titulo de la cita | Visita chalet Las Rozas |
| {{2}} | Tipo de cita | Visita |
| {{3}} | Fecha original | Jueves 18 de enero de 2025 |
| {{4}} | Hora original | 11:00 |
| {{5}} | Ubicacion/Notas | Urbanizacion Los Pinos, parcela 23 |
| {{6}} | Quien cancelo | Cliente |
| {{7}} | Motivo de cancelacion | El cliente ha encontrado otra propiedad |
| {{8}} | Direccion de la propiedad | Urbanizacion Los Pinos 23, Las Rozas |
| {{9}} | Referencia de la propiedad | V-2024-0298 |
| {{10}} | Nombre del propietario | Roberto Sanchez |
| {{11}} | Telefono del propietario | +34 634 567 890 |
| {{12}} | Nombre del comprador | Laura Fernandez |
| {{13}} | Telefono del comprador | +34 645 678 901 |
| {{14}} | Link de Vesta | https://vesta.app/calendario |

**Ejemplo Completo:**
```
❌ *Cita cancelada*

*Visita chalet Las Rozas*
🏷️ Tipo: Visita

📆 Fecha original: Jueves 18 de enero de 2025 a las 11:00
📍 Urbanizacion Los Pinos, parcela 23

👤 Cancelada por: Cliente
💬 Motivo: El cliente ha encontrado otra propiedad

🏠 *Propiedad*
Urbanizacion Los Pinos 23, Las Rozas
Ref: V-2024-0298

👤 *Propietario*
Roberto Sanchez
📱 +34 634 567 890

👤 *Comprador*
Laura Fernandez
📱 +34 645 678 901

Ver en Vesta: https://vesta.app/calendario
```

---

### 2.4 Recordatorio de Cita (`vesta_apt_reminder_es`)

**Configuracion Twilio:**
- Name: `vesta_apt_reminder_es`
- Language: Spanish (es)
- Category: UTILITY
- Type: Text

**Cuerpo de la Plantilla:**
```
🔔 *Recordatorio de {{1}}*

*{{2}}*

⏰ En {{3}}
📆 {{4}} a las {{5}}
📍 {{6}}

🏠 *Propiedad*
{{7}}
Ref: {{8}}

👤 *Propietario*
{{9}}
📱 {{10}}

👤 *Comprador*
{{11}}
📱 {{12}}

💡 *Recuerda*
{{13}}

Ver en Vesta: {{14}}
```

**Variables:**

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| {{1}} | Tipo de cita (minuscula) | visita |
| {{2}} | Titulo de la cita | Visita piso Calle Mayor |
| {{3}} | Tiempo restante | 30 minutos |
| {{4}} | Fecha | Lunes 15 de enero de 2025 |
| {{5}} | Hora | 10:00 |
| {{6}} | Ubicacion/Notas | Calle Mayor 23, 2oB |
| {{7}} | Direccion de la propiedad | Calle Mayor 23, 2oB, Madrid |
| {{8}} | Referencia de la propiedad | V-2024-0156 |
| {{9}} | Nombre del propietario | Maria Garcia Lopez |
| {{10}} | Telefono del propietario | +34 612 345 678 |
| {{11}} | Nombre del comprador | Pedro Martinez |
| {{12}} | Telefono del comprador | +34 623 456 789 |
| {{13}} | Consejos/Recordatorios | Verifica llaves - Ten ficha del inmueble |
| {{14}} | Link de Vesta | https://vesta.app/calendario |

**Consejos por Tipo de Cita:**

| Tipo | Consejos |
|------|----------|
| Visita | Verifica llaves - Ten ficha del inmueble - Prepara respuestas FAQ |
| Firma | Verifica documentos - Confirma DNI/NIE - Revisa contrato - Lleva copias |
| Reunion | Prepara puntos a tratar - Ten documentacion lista - Confirma asistentes |
| Cierre | Verifica documentacion - Confirma entrega llaves - Revisa pagos - Prepara acta |
| Viaje | Confirma direccion - Calcula tiempo con margen - Ten contacto a mano |
| Llamada | Ten info del cliente lista - Prepara puntos a discutir - Lugar tranquilo |

**Ejemplo Completo:**
```
🔔 *Recordatorio de visita*

*Visita piso Calle Mayor*

⏰ En 30 minutos
📆 Lunes 15 de enero de 2025 a las 10:00
📍 Calle Mayor 23, 2oB

🏠 *Propiedad*
Calle Mayor 23, 2oB, Madrid
Ref: V-2024-0156

👤 *Propietario*
Maria Garcia Lopez
📱 +34 612 345 678

👤 *Comprador*
Pedro Martinez
📱 +34 623 456 789

💡 *Recuerda*
Verifica llaves - Ten ficha del inmueble

Ver en Vesta: https://vesta.app/calendario
```

---

## 3. Tablas de Referencia

### Resumen de Variables por Plantilla

| Plantilla | Num Variables | Campos Principales |
|-----------|---------------|-------------------|
| task_assigned | 12 | titulo, descripcion, asignador, fecha, urgencia, categoria, propiedad, contacto |
| task_completed | 7 | titulo, descripcion, quien completo, fecha completado, propiedad |
| task_reassigned | 12 | titulo, descripcion, reasignador, nuevo asignado, fecha, urgencia, propiedad, contacto |
| task_due_soon | 11 | titulo, descripcion, tiempo restante, fecha, urgencia, propiedad, contacto |
| task_overdue | 11 | titulo, descripcion, tiempo vencido, fecha original, urgencia, propiedad, contacto |
| apt_scheduled | 14 | titulo, tipo, fecha, hora, ubicacion, programador, propiedad, propietario, comprador |
| apt_rescheduled | 14 | titulo, tipo, nueva fecha/hora, fecha anterior, ubicacion, reprogramador, propiedad, propietario, comprador |
| apt_cancelled | 14 | titulo, tipo, fecha original, ubicacion, quien cancelo, motivo, propiedad, propietario, comprador |
| apt_reminder | 14 | tipo, titulo, tiempo restante, fecha/hora, ubicacion, propiedad, propietario, comprador, consejos |

### Niveles de Urgencia

| Nivel | Etiqueta |
|-------|----------|
| 1 | Baja |
| 2 | Media |
| 3 | Alta |
| 4 | Urgente |
| 5 | Critica |

### Tipos de Cita

| Tipo | Etiqueta |
|------|----------|
| visita | Visita |
| firma | Firma |
| reunion | Reunion |
| llamada | Llamada |
| cierre | Cierre |
| viaje | Viaje |

### Tipos de Contacto

| Tipo | Etiqueta |
|------|----------|
| owner | Propietario |
| buyer | Comprador |
| contact | Contacto |

---

## 4. Notas de Implementacion

### Campos Opcionales

Si la propiedad o el contacto no estan disponibles, usa valores por defecto:

```typescript
// Para campos opcionales, usa "N/A" o "-"
const propertyAddress = listing?.street ?? "N/A";
const propertyRef = listing?.referenceNumber ?? "-";
const contactName = contact?.name ?? "No especificado";
const contactPhone = contact?.phone ?? "-";
```

### Limite de Caracteres

WhatsApp tiene un limite de ~1024 caracteres por mensaje. Las plantillas estan disenadas para caber dentro de este limite.

### Limite de Variables

Las plantillas de WhatsApp normalmente soportan hasta 10-15 variables. Si Twilio rechaza alguna plantilla, simplifica:

1. Combina fecha + hora en una sola variable
2. Haz las secciones de propiedad/contacto opcionales
3. Crea plantillas separadas con/sin info de propiedad

### Formato de Telefono

Los telefonos de contacto deben estar en formato internacional:
- Correcto: `+34 612 345 678`
- Incorrecto: `612 345 678`

### URLs de Vesta

Todos los links deben ser URLs completas:
- Tareas: `https://vesta.app/tareas`
- Calendario: `https://vesta.app/calendario`
- Con ID especifico: `https://vesta.app/tareas?taskId=123`

### Registro de Plantillas

1. Ve a [Twilio Content Template Builder](https://console.twilio.com/us1/develop/sms/content-template-builder)
2. Crea cada plantilla con:
   - Nombre exacto como se indica arriba
   - Idioma: Spanish (es)
   - Categoria: UTILITY
   - Tipo: Text
3. Envia para aprobacion de WhatsApp
4. Una vez aprobada, copia el SID (empieza con `HX`)
5. Actualiza la seccion de configuracion al inicio de este documento

### Tiempo de Aprobacion

- Sandbox: Instantaneo (usa plantillas pre-aprobadas)
- Produccion: 24-48 horas tipicamente

### Tips para Aprobacion Rapida

- Usa categoria `UTILITY` (no MARKETING)
- Mantiene mensajes profesionales y claros
- Evita lenguaje promocional
- Incluye proposito claro del mensaje

---

## Historial de Cambios

| Fecha | Version | Cambios |
|-------|---------|---------|
| 2024-12-23 | 1.0 | Version inicial |
| 2024-12-30 | 2.0 | Actualizacion completa con plantillas que coinciden con emails |
