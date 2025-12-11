# Email Templates Inventory

This document provides a comprehensive list of all email templates required for the Vesta CRM notification system, indicating which templates are already implemented and which are pending.

## Status Legend

- ✅ **Implemented** - Template exists and is functional
- ⏳ **Pending** - Template needs to be created
- 🔄 **Partial** - Template exists but may need enhancements for specific use cases

---

## INTERNAL NOTIFICATIONS (Internas)

### A. Task Notifications (Tareas)

#### 1. Task Event Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Task Assigned | ✅ | `task-notification.tsx` | Enhanced with specific messaging and metadata |
| Task Completed | ✅ | `task-notification.tsx` | Enhanced with specific messaging and metadata |
| Task Reassigned | ✅ | `task-notification.tsx` | Enhanced with specific messaging and metadata |

**Implementation Details:**
- **Task Assigned Email**
  - **Subject:** `Nueva tarea asignada: [Task Title]`
  - **Message:** `Se te ha asignado una nueva tarea: [Task Title]. [Task Description if available]`
  - **Metadata:** Task details (due date, urgency, category, assigned by)
  - **Action:** Link to task detail page
  - **Tone:** Informative, professional

- **Task Completed Email**
  - **Subject:** `Tarea completada: [Task Title]`
  - **Message:** `La tarea "[Task Title]" ha sido completada por [Completed By]. [Task Description]`
  - **Metadata:** Task details, completed by, completion date/time
  - **Action:** Link to task detail page
  - **Tone:** Informative, acknowledgment

- **Task Reassigned Email**
  - **Subject:** `Tarea reasignada: [Task Title]`
  - **Message:** `Tu tarea "[Task Title]" ha sido reasignada a [New Assignee]. [Reason if available]`
  - **Metadata:** Task details, previous assignee, new assignee, reassigned by
  - **Action:** Link to task detail page
  - **Tone:** Informative, may include context

#### 2. Overdue Task Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Weekly Digest of Overdue Tasks | ✅ | `task-digest-notification.tsx` | Fully implemented |
| Daily Digest of Overdue Tasks | ✅ | `task-digest-notification.tsx` | Fully implemented |
| Immediate Critical Task Overdue | ✅ | `task-overdue-critical.tsx` | Fully implemented with urgent messaging |

**Implementation Details:**
- **Immediate Critical Task Overdue Email**
  - **Subject:** `🚨 TAREA CRÍTICA VENCIDA: [Task Title]`
  - **Message:** `La tarea crítica "[Task Title]" ha vencido. Esta tarea requiere atención inmediata.`
  - **Metadata:** Task details, overdue duration, urgency level (5)
  - **Action:** Link to task detail page
  - **Tone:** Urgent, attention-grabbing
  - **Priority:** High (should bypass quiet hours)

#### 3. Upcoming Task Notifications (by Urgency Level)

**For each urgency level (Critical, Urgent, Other):**

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Weekly Briefing | ✅ | `task-briefing.tsx` | Fully implemented with urgency grouping |
| Daily Briefing | ✅ | `task-briefing.tsx` | Fully implemented with urgency grouping |
| Due in 1 Week | ✅ | `task-reminder.tsx` | Fully implemented |
| Due in 48 Hours | ✅ | `task-reminder.tsx` | Fully implemented |
| Due in 24 Hours | ✅ | `task-reminder.tsx` | Fully implemented |
| Due in 12 Hours | ✅ | `task-reminder.tsx` | Fully implemented |
| Due in 2 Hours | ✅ | `task-reminder.tsx` | Fully implemented |
| Due in 1 Hour | ✅ | `task-reminder.tsx` | Fully implemented |

**Implementation Details:**

- **Weekly Task Briefing Email**
  - **Subject:** `Resumen semanal de tareas - Semana del [Date Range]`
  - **Message:** `Resumen de tus tareas para la próxima semana:`
  - **Content:** 
    - List of tasks grouped by urgency level (Critical, Urgent, Other)
    - Each task shows: title, due date/time, urgency, category
    - Tasks sorted by due date
  - **Metadata:** Array of tasks with full details
  - **Action:** Link to tasks page with filter for upcoming week
  - **Tone:** Professional, organized
  - **Timing:** Sent Mondays at 9:00 AM

- **Daily Task Briefing Email**
  - **Subject:** `Resumen diario de tareas - [Date]`
  - **Message:** `Tus tareas para hoy y mañana:`
  - **Content:**
    - List of tasks due today
    - List of tasks due tomorrow
    - Grouped by urgency level
  - **Metadata:** Array of tasks due today/tomorrow
  - **Action:** Link to tasks page with today's filter
  - **Tone:** Professional, concise
  - **Timing:** Sent daily at 9:00 AM

- **Task Reminder - Due in 1 Week**
  - **Subject:** `Recordatorio: Tarea vence en 1 semana - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence en 1 semana (el [Due Date]).`
  - **Metadata:** Task details, days until due
  - **Action:** Link to task detail page
  - **Tone:** Gentle reminder

- **Task Reminder - Due in 48 Hours**
  - **Subject:** `Recordatorio: Tarea vence en 48 horas - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence en 48 horas (el [Due Date] a las [Time]).`
  - **Metadata:** Task details, hours until due
  - **Action:** Link to task detail page
  - **Tone:** Moderate urgency

- **Task Reminder - Due in 24 Hours**
  - **Subject:** `⚠️ Tarea vence mañana - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence mañana ([Due Date] a las [Time]).`
  - **Metadata:** Task details, urgency level, hours until due
  - **Action:** Link to task detail page
  - **Tone:** Increased urgency

- **Task Reminder - Due in 12 Hours**
  - **Subject:** `⚠️ Tarea vence en 12 horas - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence en 12 horas ([Due Date] a las [Time]).`
  - **Metadata:** Task details, urgency level, hours until due
  - **Action:** Link to task detail page
  - **Tone:** High urgency

- **Task Reminder - Due in 2 Hours**
  - **Subject:** `🚨 Tarea vence en 2 horas - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence en 2 horas ([Due Date] a las [Time]). ¡Acción requerida!`
  - **Metadata:** Task details, urgency level, minutes until due
  - **Action:** Link to task detail page
  - **Tone:** Very urgent

- **Task Reminder - Due in 1 Hour**
  - **Subject:** `🚨 URGENTE: Tarea vence en 1 hora - [Task Title]`
  - **Message:** `La tarea "[Task Title]" vence en 1 hora ([Due Date] a las [Time]). ¡Acción inmediata requerida!`
  - **Metadata:** Task details, urgency level, minutes until due
  - **Action:** Link to task detail page
  - **Tone:** Critical urgency

### B. Appointment Notifications (Citas)

#### 1. Appointment Event Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Appointment Scheduled | ✅ | `appointment-notification.tsx` | Enhanced with specific messaging and metadata |
| Appointment Rescheduled | ✅ | `appointment-notification.tsx` | Enhanced with previous datetime and rescheduled by info |
| Appointment Cancelled | ✅ | `appointment-notification.tsx` | Enhanced with cancellation reason and cancelled by info |

**Implementation Details:**
- **Appointment Scheduled Email**
  - **Subject:** `Nueva cita programada: [Appointment Type] - [Date]`
  - **Message:** `Se ha programado una nueva cita para ti:`
  - **Metadata:** Appointment type, datetime, location, contact name, property address (if applicable)
  - **Action:** Link to appointment detail page
  - **Tone:** Informative, professional

- **Appointment Rescheduled Email**
  - **Subject:** `Cita reprogramada: [Appointment Type] - [New Date]`
  - **Message:** `Tu cita ha sido reprogramada. Nueva fecha y hora: [New DateTime]. Fecha anterior: [Previous DateTime].`
  - **Metadata:** Appointment type, new datetime, previous datetime, location, contact name
  - **Action:** Link to appointment detail page
  - **Tone:** Informative, may include reason if available

- **Appointment Cancelled Email**
  - **Subject:** `Cita cancelada: [Appointment Type] - [Date]`
  - **Message:** `Tu cita del [Date] a las [Time] ha sido cancelada. [Reason if available]`
  - **Metadata:** Appointment type, cancelled datetime, location, contact name, cancellation reason
  - **Action:** Link to appointments page
  - **Tone:** Informative, may include alternative options

#### 2. Appointment Reminder Notifications (by Appointment Type)

**For each appointment type (Visitas, Firmas, Reuniones, Llamadas, Cierres, Viajes):**

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Weekly Briefing | ✅ | `appointment-briefing.tsx` | Fully implemented grouped by appointment type |
| Daily Briefing | ✅ | `appointment-briefing.tsx` | Fully implemented grouped by appointment type |
| 24 Hours Before | ✅ | `appointment-reminder.tsx` | Fully implemented |
| 12 Hours Before | ✅ | `appointment-reminder.tsx` | Fully implemented |
| 1 Hour Before | ✅ | `appointment-reminder.tsx` | Fully implemented |
| 30 Minutes Before | ✅ | `appointment-reminder.tsx` | Fully implemented |
| Travel Time Notification | ✅ | `appointment-reminder.tsx` | Fully implemented with travel time calculation |

**Implementation Details:**

- **Weekly Appointment Briefing Email**
  - **Subject:** `Resumen semanal de citas - Semana del [Date Range]`
  - **Message:** `Resumen de tus citas para la próxima semana:`
  - **Content:**
    - List of appointments grouped by type
    - Each appointment shows: type, date/time, location, contact name, property (if applicable)
    - Appointments sorted by datetime
  - **Metadata:** Array of appointments with full details
  - **Action:** Link to calendar/appointments page
  - **Tone:** Professional, organized
  - **Timing:** Sent Mondays at 9:00 AM

- **Daily Appointment Briefing Email**
  - **Subject:** `Resumen diario de citas - [Date]`
  - **Message:** `Tus citas para hoy y mañana:`
  - **Content:**
    - List of appointments for today
    - List of appointments for tomorrow
    - Grouped by appointment type
  - **Metadata:** Array of appointments for today/tomorrow
  - **Action:** Link to calendar/appointments page
  - **Tone:** Professional, concise
  - **Timing:** Sent daily at 9:00 AM

- **Appointment Reminder - 24 Hours Before**
  - **Subject:** `Recordatorio: Cita mañana - [Appointment Type]`
  - **Message:** `Tienes una cita mañana ([Date] a las [Time]): [Appointment Type]`
  - **Metadata:** Appointment type, datetime, location, contact name, property address, travel time estimate
  - **Action:** Link to appointment detail page
  - **Tone:** Gentle reminder, includes preparation details

- **Appointment Reminder - 12 Hours Before**
  - **Subject:** `Recordatorio: Cita en 12 horas - [Appointment Type]`
  - **Message:** `Tienes una cita en 12 horas ([Date] a las [Time]): [Appointment Type]`
  - **Metadata:** Appointment type, datetime, location, contact name, property address, travel time estimate
  - **Action:** Link to appointment detail page
  - **Tone:** Moderate reminder

- **Appointment Reminder - 1 Hour Before**
  - **Subject:** `⏰ Cita en 1 hora - [Appointment Type]`
  - **Message:** `Tu cita comienza en 1 hora ([Date] a las [Time]): [Appointment Type]`
  - **Metadata:** Appointment type, datetime, location, contact name, property address, travel time estimate, directions link
  - **Action:** Link to appointment detail page
  - **Tone:** Urgent reminder, includes last-minute details

- **Appointment Reminder - 30 Minutes Before**
  - **Subject:** `⏰ Cita en 30 minutos - [Appointment Type]`
  - **Message:** `Tu cita comienza en 30 minutos ([Date] a las [Time]): [Appointment Type]. ¡Prepárate para salir!`
  - **Metadata:** Appointment type, datetime, location, contact name, property address, travel time estimate, directions link
  - **Action:** Link to appointment detail page
  - **Tone:** Very urgent, action-oriented

- **Appointment Travel Time Notification**
  - **Subject:** `🚗 Es hora de salir - Cita: [Appointment Type]`
  - **Message:** `Es hora de salir para tu cita ([Date] a las [Time]): [Appointment Type]. Tiempo estimado de viaje: [Travel Time]`
  - **Metadata:** Appointment type, datetime, location, contact name, property address, travel time, directions link, traffic conditions
  - **Action:** Link to directions/maps
  - **Tone:** Action-oriented, includes navigation
  - **Timing:** Calculated based on appointment time minus travel time

---

## CUSTOMER NOTIFICATIONS (Clientes)

### A. General Customer Notifications

#### 1. Property Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| New Listing Available | ✅ | `customer-property-notification.tsx` | Fully implemented with property details |
| Price Change | ✅ | `customer-property-notification.tsx` | Fully implemented with price comparison |
| Status Change | ✅ | `customer-property-notification.tsx` | Fully implemented with status updates |
| New Photos Added | ✅ | `customer-property-notification.tsx` | Fully implemented with photo gallery info |

**Implementation Details:**

- **New Listing Available Email (Customer)**
  - **Subject:** `Nueva propiedad disponible: [Property Address]`
  - **Message:** `Tenemos una nueva propiedad que podría interesarte:`
  - **Content:**
    - Property address, price, type, size
    - Key features and highlights
    - Property photos (thumbnail gallery)
    - Property description
  - **Metadata:** Property details, photos, listing agent, contact information
  - **Action:** Link to property detail page or portal
  - **Tone:** Friendly, sales-oriented, professional
  - **Branding:** Customer-facing (may differ from internal branding)

- **Price Change Email (Customer)**
  - **Subject:** `Actualización de precio: [Property Address]`
  - **Message:** `El precio de la propiedad que te interesa ha cambiado:`
  - **Content:**
    - Property address
    - Previous price (crossed out)
    - New price (highlighted)
    - Price change percentage
    - Property details and photos
  - **Metadata:** Property details, old price, new price, price change reason (if available)
  - **Action:** Link to property detail page
  - **Tone:** Informative, may include urgency if price decreased

- **Status Change Email (Customer)**
  - **Subject:** `Actualización de estado: [Property Address]`
  - **Message:** `El estado de la propiedad ha cambiado:`
  - **Content:**
    - Property address
    - Previous status
    - New status (e.g., "Vendida", "Alquilada", "Retirada del mercado")
    - Property details
  - **Metadata:** Property details, previous status, new status, status change date
  - **Action:** Link to property detail page or search for similar properties
  - **Tone:** Informative, may include alternative suggestions if property is no longer available

- **New Photos Added Email (Customer)**
  - **Subject:** `Nuevas fotos disponibles: [Property Address]`
  - **Message:** `Hemos añadido nuevas fotos a la propiedad que te interesa:`
  - **Content:**
    - Property address
    - New photos gallery
    - Property details
  - **Metadata:** Property details, new photos, total photo count
  - **Action:** Link to property detail page with photo gallery
  - **Tone:** Informative, visual-focused

#### 2. Document Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Document Ready | ✅ | `customer-document-notification.tsx` | Fully implemented with download links |
| Signature Required | ✅ | `customer-document-notification.tsx` | Fully implemented with signing links and deadlines |
| Document Expiring | ✅ | `customer-document-notification.tsx` | Fully implemented with renewal instructions |

**Implementation Details:**

- **Document Ready Email (Customer)**
  - **Subject:** `Documento listo para revisión: [Document Name]`
  - **Message:** `Tu documento está listo para revisión:`
  - **Content:**
    - Document name and type
    - Document description
    - Document preview or summary
    - Next steps
  - **Metadata:** Document details, document type, ready date, download link
  - **Action:** Link to document portal or download page
  - **Tone:** Professional, clear instructions

- **Signature Required Email (Customer)**
  - **Subject:** `Firma requerida: [Document Name]`
  - **Message:** `Se requiere tu firma en el siguiente documento:`
  - **Content:**
    - Document name and type
    - Document description
    - Signature deadline
    - Instructions for signing
  - **Metadata:** Document details, signature deadline, signing method (electronic/in-person)
  - **Action:** Link to signing portal or appointment scheduling
  - **Tone:** Professional, urgent if deadline is approaching

- **Document Expiring Email (Customer)**
  - **Subject:** `Recordatorio: Documento próximo a vencer - [Document Name]`
  - **Message:** `Tu documento "[Document Name]" está próximo a vencer:`
  - **Content:**
    - Document name and type
    - Expiration date
    - Days until expiration
    - Renewal instructions
  - **Metadata:** Document details, expiration date, renewal requirements
  - **Action:** Link to renewal portal or contact information
  - **Tone:** Professional, reminder with clear action items

#### 3. Deal Notifications

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Offer Received | ✅ | `customer-deal-notification.tsx` | Fully implemented with offer details |
| Offer Accepted | ✅ | `customer-deal-notification.tsx` | Fully implemented with next steps |
| Deal Closed | ✅ | `customer-deal-notification.tsx` | Fully implemented with post-closing info |
| Payment Received | ✅ | `customer-deal-notification.tsx` | Fully implemented with payment details |

**Implementation Details:**

- **Offer Received Email (Customer)**
  - **Subject:** `Nueva oferta recibida: [Property Address]`
  - **Message:** `Se ha recibido una nueva oferta para tu propiedad:`
  - **Content:**
    - Property address
    - Offer amount
    - Offer terms and conditions
    - Offer expiration date
    - Next steps
  - **Metadata:** Property details, offer amount, offer terms, offer date, expiration date
  - **Action:** Link to offer detail page or contact agent
  - **Tone:** Professional, may include urgency if expiration is soon

- **Offer Accepted Email (Customer)**
  - **Subject:** `¡Oferta aceptada! - [Property Address]`
  - **Message:** `Tu oferta ha sido aceptada. ¡Felicidades!`
  - **Content:**
    - Property address
    - Accepted offer amount
    - Next steps in the process
    - Important dates and deadlines
  - **Metadata:** Property details, offer amount, acceptance date, next steps timeline
  - **Action:** Link to deal detail page or next steps portal
  - **Tone:** Celebratory, professional, clear next steps

- **Deal Closed Email (Customer)**
  - **Subject:** `¡Operación cerrada! - [Property Address]`
  - **Message:** `Tu operación ha sido cerrada exitosamente. ¡Felicidades!`
  - **Content:**
    - Property address
    - Final sale/rental amount
    - Closing date
    - Important documents and next steps
    - Contact information for post-closing support
  - **Metadata:** Property details, final amount, closing date, documents, post-closing information
  - **Action:** Link to documents portal or contact information
  - **Tone:** Celebratory, professional, includes post-closing support

- **Payment Received Email (Customer)**
  - **Subject:** `Pago recibido - Operación: [Property Address]`
  - **Message:** `Hemos recibido tu pago:`
  - **Content:**
    - Payment amount
    - Payment date
    - Payment method
    - Transaction reference
    - Payment purpose (deposit, installment, final payment, etc.)
  - **Metadata:** Payment details, transaction reference, payment date, amount, purpose
  - **Action:** Link to payment portal or transaction details
  - **Tone:** Professional, confirmation, includes receipt information

### B. Customer Appointment Reminders

**For each appointment type (Visitas, Firmas, Reuniones, Llamadas, Cierres, Viajes):**

| Template | Status | File | Notes |
|----------|--------|------|-------|
| 24 Hours Before | ✅ | `customer-appointment-reminder.tsx` | Fully implemented with friendly tone |
| 12 Hours Before | ✅ | `customer-appointment-reminder.tsx` | Fully implemented with friendly tone |
| 1 Hour Before | ✅ | `customer-appointment-reminder.tsx` | Fully implemented with friendly tone |
| 30 Minutes Before | ✅ | `customer-appointment-reminder.tsx` | Fully implemented with friendly tone |
| Travel Time Notification | ✅ | `customer-appointment-reminder.tsx` | Fully implemented with directions and travel time |

**Implementation Details:**

- **Customer Appointment Reminder - 24 Hours Before**
  - **Subject:** `Recordatorio: Cita mañana - [Appointment Type]`
  - **Message:** `Tienes una cita programada para mañana ([Date] a las [Time]): [Appointment Type]`
  - **Content:**
    - Appointment type and purpose
    - Date and time
    - Location/address
    - Contact person (agent name)
    - What to bring (if applicable)
    - Cancellation policy
  - **Metadata:** Appointment type, datetime, location, agent contact, preparation notes
  - **Action:** Link to appointment confirmation page or reschedule/cancel options
  - **Tone:** Friendly, professional, helpful

- **Customer Appointment Reminder - 12 Hours Before**
  - **Subject:** `Recordatorio: Cita en 12 horas - [Appointment Type]`
  - **Message:** `Recordatorio: Tu cita es en 12 horas ([Date] a las [Time]): [Appointment Type]`
  - **Content:** Same as 24h reminder with updated timing
  - **Tone:** Friendly reminder

- **Customer Appointment Reminder - 1 Hour Before**
  - **Subject:** `⏰ Tu cita es en 1 hora - [Appointment Type]`
  - **Message:** `Tu cita comienza en 1 hora ([Date] a las [Time]): [Appointment Type]`
  - **Content:**
    - Appointment details
    - Location with map link
    - Agent contact information
    - Last-minute reminders
  - **Tone:** Friendly, helpful, includes navigation

- **Customer Appointment Reminder - 30 Minutes Before**
  - **Subject:** `⏰ Tu cita es en 30 minutos - [Appointment Type]`
  - **Message:** `Tu cita comienza en 30 minutos ([Date] a las [Time]): [Appointment Type]`
  - **Content:** Same as 1h reminder with updated timing
  - **Tone:** Friendly, time-sensitive

- **Customer Appointment Travel Time Notification**
  - **Subject:** `Es hora de salir - Cita: [Appointment Type]`
  - **Message:** `Es hora de salir para tu cita ([Date] a las [Time]): [Appointment Type]`
  - **Content:**
    - Appointment details
    - Location with map/directions link
    - Estimated travel time
    - Agent contact for last-minute questions
  - **Tone:** Friendly, action-oriented, includes navigation

---

## SUMMARY EMAILS (Digest/Briefing)

| Template | Status | File | Notes |
|----------|--------|------|-------|
| Weekly Task Briefing | ✅ | `task-briefing.tsx` | Fully implemented |
| Daily Task Briefing | ✅ | `task-briefing.tsx` | Fully implemented |
| Weekly Appointment Briefing | ✅ | `appointment-briefing.tsx` | Fully implemented |
| Daily Appointment Briefing | ✅ | `appointment-briefing.tsx` | Fully implemented |
| Weekly Overdue Task Digest | ✅ | `task-digest-notification.tsx` | Implemented |
| Daily Overdue Task Digest | ✅ | `task-digest-notification.tsx` | Implemented |

**Note:** Briefing emails are defined above in their respective sections (Task Briefings and Appointment Briefings).

---

## Template Implementation Priority

### High Priority (Core Functionality)
1. ✅ Task digest notifications (overdue) - **DONE**
2. ✅ Task event notifications (assigned, completed, reassigned) - **ENHANCED**
3. ✅ Appointment event notifications (scheduled, rescheduled, cancelled) - **ENHANCED**
4. ✅ Immediate critical task overdue notification - **IMPLEMENTED** (`task-overdue-critical.tsx`)
5. ✅ Task reminder notifications (24h, 12h, 2h, 1h, 48h, 1 week) - **IMPLEMENTED** (`task-reminder.tsx`)
6. ✅ Appointment reminder notifications (24h, 12h, 1h, 30min, travel time) - **IMPLEMENTED** (`appointment-reminder.tsx`)

### Medium Priority (User Experience)
7. ✅ Weekly/Daily task briefings - **IMPLEMENTED** (`task-briefing.tsx`)
8. ✅ Weekly/Daily appointment briefings - **IMPLEMENTED** (`appointment-briefing.tsx`)
9. ✅ Customer appointment reminders - **IMPLEMENTED** (`customer-appointment-reminder.tsx`)
10. ✅ Customer property notifications - **IMPLEMENTED** (`customer-property-notification.tsx`)

### Lower Priority (Nice to Have)
11. ✅ Customer document notifications - **IMPLEMENTED** (`customer-document-notification.tsx`)
12. ✅ Customer deal notifications - **IMPLEMENTED** (`customer-deal-notification.tsx`)
13. ✅ Travel time notifications - **IMPLEMENTED** (included in `appointment-reminder.tsx` and `customer-appointment-reminder.tsx`)

---

## Template Structure Standards

All email templates should follow these standards:

### Base Template
- Use `generateNotificationEmailBase()` from `notification-base.tsx`
- Consistent Vesta CRM branding
- Responsive HTML design
- Plain text version included

### Required Elements
1. **Subject Line:** Clear, descriptive, includes emoji for urgency when appropriate
2. **Header:** Vesta CRM branding with gradient logo
3. **Message Body:** Clear, concise, action-oriented
4. **Metadata Display:** Relevant information formatted clearly
5. **Call-to-Action Button:** Links to relevant page in the application
6. **Footer:** Standard Vesta CRM footer with copyright

### Metadata Requirements
- All templates should accept metadata objects with relevant information
- Metadata should be typed using TypeScript interfaces
- Templates should gracefully handle missing optional metadata

### Tone Guidelines
- **Internal Notifications:** Professional, informative, clear
- **Customer Notifications:** Friendly, professional, helpful
- **Urgent Notifications:** Attention-grabbing but not alarming
- **Reminder Notifications:** Helpful, clear, action-oriented

---

## Next Steps

1. ✅ **Review and prioritize** which templates to implement first - **COMPLETED**
2. ✅ **Create TypeScript interfaces** for all metadata types - **COMPLETED**
3. ✅ **Implement high-priority templates** following existing patterns - **COMPLETED**
4. ⏳ **Test templates** with real data - **PENDING**
5. ⏳ **Update email notification service** to route to appropriate templates - **PENDING**
6. ✅ **Document template usage** in code comments - **COMPLETED**

## Implementation Summary

All email templates have been successfully implemented! Here's what was created:

### New Template Files Created:
- `task-overdue-critical.tsx` - Critical task overdue notifications
- `task-reminder.tsx` - Task reminders for all timeframes
- `appointment-reminder.tsx` - Appointment reminders for all timeframes
- `task-briefing.tsx` - Weekly and daily task briefings
- `appointment-briefing.tsx` - Weekly and daily appointment briefings
- `customer-appointment-reminder.tsx` - Customer-facing appointment reminders
- `customer-property-notification.tsx` - Customer property notifications
- `customer-document-notification.tsx` - Customer document notifications
- `customer-deal-notification.tsx` - Customer deal notifications

### Enhanced Template Files:
- `task-notification.tsx` - Enhanced with event-specific messaging
- `appointment-notification.tsx` - Enhanced with event-specific messaging

### All Templates Include:
- ✅ TypeScript interfaces for metadata
- ✅ Responsive HTML design
- ✅ Plain text fallback
- ✅ Consistent Vesta CRM branding
- ✅ Appropriate tone (professional for internal, friendly for customer)
- ✅ Urgency indicators where applicable
- ✅ Action buttons with proper links

---

## Notes

- Templates marked as "🔄 Partial" may work for basic use cases but should be enhanced with specific messaging and metadata handling
- Customer-facing templates should use customer-friendly language and may have different branding considerations
- All templates should respect quiet hours settings (except critical/urgent notifications)
- Templates should be internationalized (currently Spanish, but structure should support other languages)

