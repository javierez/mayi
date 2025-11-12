# Acciones Faltantes en Listing Contact Activity - Priorizadas

## 🔴 CRÍTICAS (Implementar Primero)

### 1. **`property_shared`** ⭐⭐⭐⭐⭐
**Por qué es crítica**: 
- Es la acción más común en un CRM inmobiliario
- Ya tienes modales de compartir (`SharePropertyModal`, `ShareListingModal`) pero no se registra
- Métrica clave de engagement del agente
- Permite medir qué propiedades se comparten más y con quién

**Detalles a registrar**:
```typescript
{
  method: "email" | "whatsapp" | "sms" | "link" | "copy",
  messageFormat?: "simple" | "medium" | "detailed",
  sharedAt: timestamp,
  linkClicked?: boolean, // Si el contacto hizo clic después
  linkClickedAt?: timestamp
}
```

**Prioridad**: `high`
**Notificable**: `false` (muy frecuente)

---

### 2. **`property_link_clicked`** ⭐⭐⭐⭐⭐
**Por qué es crítica**:
- Mide el engagement real del contacto
- Indica interés genuino (no solo recibió el mensaje)
- Permite identificar leads calientes basado en comportamiento
- Puede integrarse con analytics del sitio web

**Detalles a registrar**:
```typescript
{
  sharedVia: "email" | "whatsapp" | "sms" | "link",
  timeSinceShare: number, // minutos desde que se compartió
  deviceType?: "mobile" | "desktop" | "tablet",
  sessionDuration?: number, // segundos en la página
  pagesViewed?: number
}
```

**Prioridad**: `high`
**Notificable**: `true` (indica interés activo)

---

### 3. **`interest_expressed`** ⭐⭐⭐⭐⭐
**Por qué es crítica**:
- Señal explícita de interés del contacto
- Diferente de solo ver la propiedad (más comprometido)
- Debe disparar seguimiento inmediato
- Clasifica automáticamente como "hot lead"

**Detalles a registrar**:
```typescript
{
  method: "call" | "email" | "whatsapp" | "in_person" | "website_form",
  interestLevel: 1 | 2 | 3 | 4 | 5, // Escala de interés
  specificInterest?: string[], // ["price", "location", "features"]
  nextSteps?: string,
  urgencyLevel?: "low" | "medium" | "high"
}
```

**Prioridad**: `critical`
**Notificable**: `true` (acción inmediata requerida)

---

### 4. **`property_rejected`** ⭐⭐⭐⭐
**Por qué es importante**:
- Cierra el ciclo de seguimiento
- Evita spam al contacto
- Permite aprender qué no funciona (precio, ubicación, características)
- Puede sugerir propiedades alternativas automáticamente

**Detalles a registrar**:
```typescript
{
  reason?: "price" | "location" | "size" | "condition" | "other",
  reasonDetails?: string,
  alternativeRequested?: boolean,
  doNotContact?: boolean // Si el contacto pide no contactar más
}
```

**Prioridad**: `high`
**Notificable**: `false` (pero importante para analytics)

---

## 🟡 MUY IMPORTANTES (Implementar Segundo)

### 5. **`second_viewing_requested`** ⭐⭐⭐⭐
**Por qué es importante**:
- Indica interés serio (no solo curiosidad)
- Debe priorizarse en el calendario
- Alta probabilidad de conversión a oferta
- Requiere seguimiento inmediato

**Detalles a registrar**:
```typescript
{
  requestedBy: "contact" | "agent",
  preferredDates?: string[],
  urgencyLevel: "low" | "medium" | "high",
  reason?: string // "wants to show partner", "needs measurements", etc.
}
```

**Prioridad**: `critical`
**Notificable**: `true`

---

### 6. **`questions_asked`** ⭐⭐⭐⭐
**Por qué es importante**:
- Indica interés activo y comprometido
- Permite identificar objeciones tempranas
- Ayuda a personalizar el seguimiento
- Puede automatizar respuestas comunes

**Detalles a registrar**:
```typescript
{
  questionType: "price" | "location" | "features" | "financing" | "legal" | "other",
  question: string,
  answered?: boolean,
  answer?: string,
  answeredAt?: timestamp
}
```

**Prioridad**: `high`
**Notificable**: `true` (si no está respondida en 24h)

---

### 7. **`objections_raised`** ⭐⭐⭐⭐
**Por qué es importante**:
- Identifica barreras para la venta
- Permite abordar preocupaciones específicas
- Puede requerir ajustes en precio o estrategia
- Clave para la negociación

**Detalles a registrar**:
```typescript
{
  objectionType: "price" | "location" | "condition" | "size" | "neighborhood" | "other",
  objection: string,
  severity: "minor" | "moderate" | "major",
  addressed?: boolean,
  resolution?: string
}
```

**Prioridad**: `critical`
**Notificable**: `true`

---

### 8. **`virtual_tour_viewed`** ⭐⭐⭐
**Por qué es importante**:
- Mide engagement digital
- Puede reducir necesidad de visita física
- Indica interés en explorar más
- Métrica de marketing digital

**Detalles a registrar**:
```typescript
{
  tourType: "360" | "video" | "interactive",
  duration: number, // segundos
  completionRate?: number, // 0-100%
  deviceType?: "mobile" | "desktop" | "tablet"
}
```

**Prioridad**: `normal`
**Notificable**: `false`

---

### 9. **`document_reviewed`** ⭐⭐⭐
**Por qué es importante**:
- Indica seriedad del interés
- Mide qué documentos son más útiles
- Puede acelerar el proceso de decisión
- Útil para seguimiento ("¿Revisaste el plano de la propiedad?")

**Detalles a registrar**:
```typescript
{
  documentType: "floor_plan" | "energy_certificate" | "legal_docs" | "photos" | "other",
  documentName?: string,
  reviewDuration?: number, // segundos
  downloaded?: boolean
}
```

**Prioridad**: `normal`
**Notificable**: `false`

---

## 🟢 IMPORTANTES (Implementar Tercero)

### 10. **`referral_made`** ⭐⭐⭐
**Por qué es importante**:
- Indica satisfacción del contacto
- Puede generar nuevos leads
- Debe tener seguimiento especial
- Métrica de satisfacción del cliente

**Detalles a registrar**:
```typescript
{
  referredContactId?: bigint, // Si el referido ya es contacto
  referredContactName?: string,
  referredContactPhone?: string,
  referredContactEmail?: string,
  relationship?: string // "friend", "family", "colleague", etc.
}
```

**Prioridad**: `high`
**Notificable**: `true`

---

### 11. **`price_negotiation_started`** ⭐⭐⭐
**Por qué es importante**:
- Más específico que `counter_offer_made`
- Indica que el contacto está seriamente considerando comprar
- Requiere seguimiento cercano
- Puede requerir aprobación del propietario

**Detalles a registrar**:
```typescript
{
  initialPrice: number,
  proposedPrice: number,
  priceDifference: number,
  percentDifference: number,
  negotiationReason?: string,
  contactMotivation?: string
}
```

**Prioridad**: `critical`
**Notificable**: `true`

---

### 12. **`inspection_scheduled`** ⭐⭐⭐
**Por qué es importante**:
- Paso crítico antes de oferta
- Indica interés serio
- Requiere coordinación con propietario
- Puede requerir documentación adicional

**Detalles a registrar**:
```typescript
{
  inspectionType: "general" | "structural" | "pest" | "energy" | "other",
  scheduledDate: timestamp,
  inspectorName?: string,
  inspectorCompany?: string,
  cost?: number
}
```

**Prioridad**: `high`
**Notificable**: `true`

---

### 13. **`inspection_completed`** ⭐⭐⭐
**Por qué es importante**:
- Paso crítico en el proceso
- Puede afectar la negociación
- Requiere seguimiento inmediato
- Puede generar objeciones o acelerar la oferta

**Detalles a registrar**:
```typescript
{
  inspectionType: "general" | "structural" | "pest" | "energy" | "other",
  completedDate: timestamp,
  issuesFound?: boolean,
  issues?: string[],
  reportReceived?: boolean,
  reportUrl?: string
}
```

**Prioridad**: `critical`
**Notificable**: `true`

---

### 14. **`financing_application_submitted`** ⭐⭐⭐
**Por qué es importante**:
- Indica compromiso serio
- Paso crítico para cerrar la venta
- Requiere seguimiento con banco
- Puede afectar timeline de la operación

**Detalles a registrar**:
```typescript
{
  bankName?: string,
  applicationDate: timestamp,
  requestedAmount: number,
  preApproved?: boolean,
  approvalDate?: timestamp,
  status?: "pending" | "approved" | "rejected" | "under_review"
}
```

**Prioridad**: `critical`
**Notificable**: `true`

---

### 15. **`open_house_attended`** ⭐⭐
**Por qué es importante**:
- Mide efectividad de eventos de marketing
- Indica interés en la propiedad
- Permite capturar múltiples leads de un evento
- Métrica de marketing

**Detalles a registrar**:
```typescript
{
  eventDate: timestamp,
  duration?: number, // minutos en el evento
  signedIn?: boolean,
  feedbackProvided?: boolean,
  interestExpressed?: boolean
}
```

**Prioridad**: `normal`
**Notificable**: `false`

---

## 📊 Resumen de Prioridades

### Fase 1 (Críticas - Implementar Ahora):
1. ✅ `property_shared` - Ya tienes la UI, solo falta logging
2. ✅ `property_link_clicked` - Requiere analytics integration
3. ✅ `interest_expressed` - Acción manual del agente
4. ✅ `property_rejected` - Acción manual del agente

### Fase 2 (Muy Importantes - Próximas 2 semanas):
5. ✅ `second_viewing_requested`
6. ✅ `questions_asked`
7. ✅ `objections_raised`
8. ✅ `virtual_tour_viewed`
9. ✅ `document_reviewed`

### Fase 3 (Importantes - Próximo mes):
10. ✅ `referral_made`
11. ✅ `price_negotiation_started`
12. ✅ `inspection_scheduled`
13. ✅ `inspection_completed`
14. ✅ `financing_application_submitted`
15. ✅ `open_house_attended`

---

## 🎯 Recomendación Final

**Empezar con las 4 críticas** porque:
1. `property_shared` - Ya tienes la funcionalidad, solo falta tracking
2. `property_link_clicked` - Métrica clave de engagement
3. `interest_expressed` - Señal más importante de conversión
4. `property_rejected` - Cierra el ciclo y mejora la experiencia

Estas 4 acciones cubren el 80% del valor del sistema de tracking y son relativamente fáciles de implementar.

