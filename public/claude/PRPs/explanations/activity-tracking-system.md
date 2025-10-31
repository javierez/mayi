# Activity Tracking System - Complete Reference

**Last Updated:** 2025-01-29
**Status:** Production Ready
**Scope:** Critical priority actions only

---

## Overview

The Vesta CRM implements a comprehensive activity tracking system across 4 core entities. This provides complete audit trails, business intelligence, and GDPR compliance tracking.

### Architecture

```
Activity Tracking System
├── listingActivity (23 actions) - Property listing changes
├── listingContactActivity (33 actions) - Buyer/lead interactions with listings
├── dealActivity (18 actions) - Transaction lifecycle & milestones
└── contactActivity (7 actions) - Contact master record & GDPR compliance
```

**Total: 81 distinct action types**

---

## 1. LISTING ACTIVITY (23 Actions)

**Table:** `listing_activity`
**Purpose:** Tracks changes to property listings themselves
**Foreign Key:** `listing_id` → `listings.listing_id`

### Actions by Category

#### **Existing (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `price_changed` | HIGH | Precio modificado | Listing price updated |
| `status_changed` | HIGH | Estado cambiado | Status changed (En Venta → Vendido, etc.) |
| `portal_published` | NORMAL | Publicado en portal | Published to Fotocasa, Idealista, etc. |
| `portal_unpublished` | NORMAL | Despublicado de portal | Removed from portal |

#### **Content & Marketing (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `description_changed` | NORMAL | Descripción modificada | AI or manual description update |
| `images_updated` | NORMAL | Imágenes actualizadas | Photos added/removed/reordered |
| `featured_toggled` | NORMAL | Estado destacado cambiado | Featured status changed |

#### **Property Changes (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `agent_reassigned` | CRITICAL | Agente reasignado | Agent changed (impacts commission) |
| `listing_type_changed` | HIGH | Tipo de operación cambiado | Sale ↔ Rent conversion |
| `specifications_updated` | NORMAL | Especificaciones actualizadas | Bedrooms, bathrooms, sqm modified |
| `keys_received` | HIGH | Llaves recibidas | Physical keys obtained |

#### **Visibility & Publication (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `visibility_changed` | NORMAL | Visibilidad cambiada | Privacy level modified (exact/street/zone) |
| `website_publication_toggled` | NORMAL | Publicación web cambiada | Company website visibility |
| `activated` | HIGH | Activado | Listing made active |
| `deactivated` | HIGH | Desactivado | Listing deactivated |

#### **Portal Sync (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `portal_sync_error` | CRITICAL | Error de sincronización portal | Failed portal sync |
| `portal_settings_updated` | LOW | Configuración portal actualizada | Portal-specific settings changed |

#### **Analytics & Performance (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `views_milestone` | LOW | Hito de visualizaciones | View count milestone reached |
| `inquiry_received` | HIGH | Consulta recibida | Inquiry count incremented |

#### **Documents & Media (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `document_uploaded` | NORMAL | Documento subido | Important document added |
| `virtual_tour_added` | NORMAL | Tour virtual añadido | 360° tour or video added |

### Example Usage

```typescript
import { logPriceChanged, logAgentReassigned } from "~/server/queries/log-activity";

// Track price change
await logPriceChanged({
  listingId: 12345n,
  userId: "user-123",
  oldPrice: 250000,
  newPrice: 235000,
  reason: "Market adjustment after 30 days without visits"
});

// Track agent reassignment (critical for commission tracking)
await logAgentReassigned({
  listingId: 12345n,
  userId: "manager-456",
  oldAgentId: "agent-789",
  oldAgentName: "María López",
  newAgentId: "agent-012",
  newAgentName: "Carlos Martínez",
  reason: "María on medical leave",
  commissionImpact: "Split 50/50 if sold within 60 days"
});
```

---

## 2. LISTING CONTACT ACTIVITY (33 Actions)

**Table:** `listing_contact_activity`
**Purpose:** Tracks buyer/lead journey with specific listings
**Foreign Key:** `listing_contact_id` → `listing_contacts.listing_contact_id`

### Actions by Category

#### **Existing (5 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `status_changed` | NORMAL | Estado cambiado | Lead status workflow progression |
| `offer_received` | CRITICAL | Oferta recibida | Buyer submits offer |
| `offer_accepted` | CRITICAL | Oferta aceptada | Offer accepted by seller |
| `offer_rejected` | HIGH | Oferta rechazada | Offer declined |
| `appointment_scheduled` | HIGH | Cita programada | Viewing scheduled |

#### **Contact Management (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `contact_assigned` | NORMAL | Contacto asignado | Contact linked to listing |
| `contact_type_changed` | LOW | Tipo de contacto cambiado | Role changed (buyer/viewer/owner) |
| `contact_merged` | LOW | Contacto fusionado | Duplicate contact consolidated |

#### **Communication Tracking (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `call_logged` | HIGH | Llamada registrada | Phone call recorded |
| `email_sent` | NORMAL | Email enviado | Email communication sent |
| `whatsapp_sent` | NORMAL | WhatsApp enviado | WhatsApp message sent |
| `message_received` | HIGH | Mensaje recibido | Inbound message from contact |

#### **Viewing & Appointments (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `viewing_completed` | HIGH | Visita completada | Property viewing finished |
| `appointment_cancelled` | HIGH | Cita cancelada | Appointment cancelled/no-show |
| `appointment_rescheduled` | NORMAL | Cita reprogramada | Appointment date changed |
| `viewing_feedback_received` | HIGH | Feedback de visita recibido | Post-viewing feedback |

#### **Offer & Negotiation (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `counter_offer_made` | CRITICAL | Contraoferta realizada | Seller counter-offers |
| `offer_expired` | HIGH | Oferta expirada | Time-limited offer expired |
| `financing_status_updated` | CRITICAL | Estado de financiación actualizado | Mortgage status changed |

#### **Lead Qualification (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `interest_level_updated` | NORMAL | Nivel de interés actualizado | Hot/warm/cold classification |
| `disqualified` | NORMAL | Descalificado | Lead marked non-viable |
| `source_identified` | LOW | Fuente identificada | Lead source determined |

#### **Deal Progression (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `deal_created` | CRITICAL | Operación creada | Moved to deal stage |
| `document_requested` | HIGH | Documento solicitado | Agent requests paperwork |
| `document_received` | HIGH | Documento recibido | Contact submits documents |

#### **Follow-up & Tasks (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `follow_up_scheduled` | NORMAL | Seguimiento programado | Reminder set |
| `follow_up_completed` | LOW | Seguimiento completado | Follow-up done |
| `notes_added` | LOW | Notas añadidas | Important observation recorded |

#### **Property Matching (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `match_score_updated` | LOW | Puntuación de coincidencia actualizada | AI matching score updated |
| `alternative_suggested` | NORMAL | Alternativa sugerida | Different property recommended |

#### **Notifiable Actions** (13 actions trigger notifications)
- `status_changed`, `offer_received`, `offer_accepted`, `offer_rejected`
- `appointment_scheduled`, `contact_assigned`, `message_received`
- `viewing_completed`, `appointment_cancelled`, `appointment_rescheduled`
- `viewing_feedback_received`, `counter_offer_made`, `offer_expired`
- `financing_status_updated`, `deal_created`, `document_received`

### Example Usage

```typescript
import { logCallLogged, logViewingCompleted, logOfferAccepted } from "~/server/queries/log-activity";

// Track phone call
await logCallLogged({
  listingContactId: 5001n,
  userId: "user-123",
  direction: "outbound",
  phoneNumber: "+34 612 345 678",
  duration: 420, // seconds
  outcome: "interested",
  interestLevel: 4,
  appointmentScheduled: true,
  appointmentId: 3456,
  concerns: ["Price slightly high"],
  nextSteps: "Viewing scheduled for tomorrow at 17:00"
});

// Track completed viewing with feedback
await logViewingCompleted({
  listingContactId: 5001n,
  userId: "user-123",
  appointmentId: 3456,
  attended: true,
  interestLevel: 5,
  liked: ["Location", "Natural light", "Terrace"],
  disliked: ["Small second bedroom"],
  willMakeOffer: "likely",
  nextSteps: "Client will discuss with family, expects decision within 3 days"
});

// Track accepted offer
await logOfferAccepted({
  listingContactId: 5001n,
  userId: "user-123",
  finalAmount: 230000,
  originalListing: 235000,
  offerNumber: 3,
  conditions: ["Financing contingency (20 days)"],
  depositAmount: 5000,
  depositDueDate: "2025-02-01",
  expectedCloseDate: "2025-03-15",
  dealCreated: true,
  dealId: 890
});
```

---

## 3. DEAL ACTIVITY (18 Actions) ⭐ NEW

**Table:** `deal_activity`
**Purpose:** Tracks transaction lifecycle from offer to closing/cancellation
**Foreign Key:** `deal_id` → `deals.deal_id`

### Actions by Category

#### **Lifecycle & Status (5 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `deal_created` | CRITICAL | Operación creada | Deal entry into system |
| `status_changed` | CRITICAL | Estado cambiado | Deal stage progression |
| `deal_closed` | CRITICAL | Operación cerrada | Transaction completed successfully |
| `deal_cancelled` | CRITICAL | Operación cancelada | Deal falls through |
| `deal_reactivated` | CRITICAL | Operación reactivada | Previously cancelled deal reopened |

#### **Financial Tracking (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `price_changed` | CRITICAL | Precio final modificado | Final price adjusted |
| `commission_paid` | CRITICAL | Comisión pagada | Commission disbursed |
| `arras_received` | CRITICAL | Arras recibidas | Deposit payment received |

#### **Timeline & Milestones (5 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `arras_contract_signed` | CRITICAL | Contrato de arras firmado | Deposit contract executed |
| `deed_date_scheduled` | CRITICAL | Fecha de escritura programada | Closing date set |
| `deed_date_changed` | HIGH | Fecha de escritura modificada | Closing date modified |
| `deed_signed` | CRITICAL | Escritura firmada | Ownership transfer completed |
| `keys_transferred` | CRITICAL | Llaves entregadas | Physical possession transferred |

#### **Workflow Status (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `financing_status_changed` | CRITICAL | Estado de financiación cambiado | Mortgage approval status |
| `contingencies_cleared` | CRITICAL | Contingencias resueltas | All contingencies satisfied |

#### **Cancellation & Failure (2 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `arras_forfeited` | CRITICAL | Arras perdidas | Deposit kept by seller |
| `deadline_missed` | CRITICAL | Plazo incumplido | Contract deadline passed |

#### **Parties (1 action)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `agent_assigned` | CRITICAL | Agente asignado | Listing/selling agent assigned |

### Comprehensive Cancellation Tracking

Deal cancellations track extensive detail for business intelligence:

```typescript
await logDealCancelled({
  dealId: 123n,
  userId: "user-123",
  cancellationDate: new Date().toISOString(),
  reason: "Buyer unable to secure mortgage approval despite pre-approval",
  reasonCategory: "financing_failed",
  faultParty: "buyer", // buyer | seller | both | external | none
  stageWhenCancelled: "Arras Pending",
  daysActive: 32,
  preventable: false, // Could this have been prevented?
  arrasDisposition: "kept_by_seller",
  arrasAmount: 10000,
  lessonsLearned: "Pre-approval was not final approval. Recommend stricter mortgage verification process before arras contract."
});
```

### Example Usage

```typescript
import {
  logDealCreated,
  logDealClosed,
  logCommissionPaid,
  logDeedSigned
} from "~/server/queries/log-activity";

// Track deal creation
await logDealCreated({
  dealId: 123n,
  userId: "user-123",
  listingId: 456,
  listingContactId: 789,
  initialStatus: "Offer",
  finalPrice: 350000,
  commissionPercentage: 3,
  source: "Listing viewing"
});

// Track deed signing
await logDeedSigned({
  dealId: 123n,
  userId: "user-123",
  signingDate: "2025-03-15T10:00:00Z",
  notaryName: "Notaría García",
  notaryLocation: "Calle Mayor 45, Madrid",
  partiesPresent: ["Juan García (buyer)", "María López (seller)", "Agent Carlos"],
  deedNumber: "ESC-2025-001234",
  finalPrice: 350000,
  registrySubmitted: true
});

// Track commission payment
await logCommissionPaid({
  dealId: 123n,
  userId: "manager-456",
  amount: 10500,
  paymentDate: "2025-03-20T14:30:00Z",
  paymentMethod: "bank_transfer",
  recipients: [
    {
      agentId: "agent-123",
      agentName: "Carlos Martínez",
      role: "listing_agent",
      amount: 6300,
      percentage: 60
    },
    {
      agentId: "agent-456",
      agentName: "Laura Sánchez",
      role: "selling_agent",
      amount: 4200,
      percentage: 40
    }
  ],
  netPaid: 10500,
  invoiceNumber: "INV-2025-0234"
});
```

---

## 4. CONTACT ACTIVITY (7 Actions) ⭐ NEW

**Table:** `contact_activity`
**Purpose:** Tracks contact master record lifecycle and GDPR compliance
**Foreign Key:** `contact_id` → `contacts.contact_id`

**Note:** This tracks contact-level events only. Listing-specific interactions are tracked in `listingContactActivity`.

### Actions by Category

#### **Contact Lifecycle (3 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `contact_created` | CRITICAL | Contacto creado | New contact added to system |
| `contact_deactivated` | CRITICAL | Contacto desactivado | Contact marked inactive |
| `contact_merged` | CRITICAL | Contacto fusionado | Duplicate contact consolidated |

#### **GDPR & Compliance (4 actions)**
| Action | Priority | Spanish Label | Description |
|--------|----------|---------------|-------------|
| `consent_given` | CRITICAL | Consentimiento otorgado | Marketing consent granted |
| `consent_withdrawn` | CRITICAL | Consentimiento retirado | Marketing consent revoked |
| `do_not_contact_set` | CRITICAL | No contactar establecido | Contact requests no communication |
| `gdpr_data_export_requested` | CRITICAL | Exportación de datos solicitada (GDPR) | Data export request (30-day deadline) |

#### **GDPR-Related Actions**
All 4 GDPR actions are flagged for compliance reporting and have notification requirements.

#### **Notifiable Actions** (4 actions trigger notifications)
- `contact_merged` (data integrity)
- `consent_withdrawn` (must ensure compliance)
- `do_not_contact_set` (must ensure immediate compliance)
- `gdpr_data_export_requested` (legal deadline)

### Example Usage

```typescript
import {
  logContactCreated,
  logConsentGiven,
  logConsentWithdrawn,
  logGdprDataExportRequested
} from "~/server/queries/log-activity";

// Track contact creation
await logContactCreated({
  contactId: 789n,
  userId: "user-123",
  firstName: "Juan",
  lastName: "García",
  email: "juan@example.com",
  phone: "+34 612 345 678",
  source: "Website",
  channel: "website",
  accountId: 1,
  campaign: "Spring 2025 Property Search"
});

// Track marketing consent
await logConsentGiven({
  contactId: 789n,
  userId: "system",
  consentType: "marketing_email",
  consentDate: new Date().toISOString(),
  consentMethod: "web_form",
  ipAddress: "185.34.56.78",
  consentText: "I agree to receive property updates and marketing communications",
  source: "Website registration form"
});

// Track consent withdrawal (unsubscribe)
await logConsentWithdrawn({
  contactId: 789n,
  userId: "system",
  consentType: "marketing_email",
  withdrawalDate: new Date().toISOString(),
  withdrawalMethod: "unsubscribe_link",
  effectiveDate: new Date().toISOString(),
  confirmationSent: true,
  reason: "too_frequent"
});

// Track GDPR data export request
await logGdprDataExportRequested({
  contactId: 789n,
  userId: "user-123",
  requestDate: new Date().toISOString(),
  requestMethod: "email",
  requestedBy: "Juan García",
  verificationRequired: true,
  legalDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  dataScope: "full",
  deliveryMethod: "email",
  status: "pending"
});
```

---

## Database Schema

### SQL CREATE Statements (MySQL/SingleStore)

```sql
-- LISTING ACTIVITY
CREATE TABLE `listing_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LISTING CONTACT ACTIVITY
CREATE TABLE `listing_contact_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_contact_id` BIGINT UNSIGNED NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DEAL ACTIVITY
CREATE TABLE `deal_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `deal_id` BIGINT UNSIGNED NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CONTACT ACTIVITY
CREATE TABLE `contact_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contact_id` BIGINT UNSIGNED NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Implementation Files

### Constants & Types
```
src/lib/constants/
├── listing-activity-actions.ts (23 actions)
├── listing-contact-activity-actions.ts (33 actions)
├── deal-activity-actions.ts (18 actions)
└── contact-activity-actions.ts (7 actions)

src/types/
├── listing-activity-details.ts (23 interfaces)
├── listing-contact-activity-details.ts (33 interfaces)
├── deal-activity-details.ts (18 interfaces)
└── contact-activity-details.ts (7 interfaces)
```

### Logging Functions
```
src/server/queries/log-activity.ts
├── Generic logging: logListingActivity<T>()
├── Generic logging: logListingContactActivity<T>()
├── Generic logging: logDealActivity<T>()
├── Generic logging: logContactActivity<T>()
├── Convenience helpers: 15+ pre-built functions
└── Batch logging: 4 batch functions
```

### Schema
```
src/server/db/schema.ts
├── export const listingActivity
├── export const listingContactActivity
├── export const dealActivity
└── export const contactActivity
```

---

## Type Safety Features

### Action-to-Details Mapping
Each action maps to a specific details interface:

```typescript
interface ListingActivityDetailsMap {
  price_changed: PriceChangedDetails;
  status_changed: StatusChangedDetails;
  agent_reassigned: AgentReassignedDetails;
  // ... all 23 actions
}
```

### Generic Type-Safe Logging
```typescript
// TypeScript infers the correct details type from action
await logListingActivity({
  listingId: 12345n,
  userId: "user-123",
  action: "price_changed", // TypeScript knows details must be PriceChangedDetails
  details: {
    field: "price",
    oldValue: 250000,
    newValue: 235000,
    percentChange: -6.0,
    changeType: "reduction"
  }
});
```

### Type Guards
```typescript
import { isListingActivityAction, isDealActivityAction } from "~/lib/constants/...";

if (isListingActivityAction(userInput)) {
  // userInput is now typed as ListingActivityAction
}
```

---

## Priority Levels

| Priority | Use Case | Example Actions |
|----------|----------|-----------------|
| **CRITICAL** | Business-critical events, financial, legal | `commission_paid`, `deal_closed`, `consent_withdrawn` |
| **HIGH** | Important events affecting workflow | `keys_received`, `viewing_completed`, `agent_reassigned` |
| **NORMAL** | Standard tracking | `description_changed`, `images_updated`, `follow_up_scheduled` |
| **LOW** | Nice-to-have analytics | `views_milestone`, `notes_added`, `tag_added` |

---

## Best Practices

### 1. Always Log Activities at Point of Change
```typescript
// ❌ Bad - Update without logging
await db.update(listings).set({ price: newPrice }).where(eq(listings.listingId, id));

// ✅ Good - Log the change
await db.update(listings).set({ price: newPrice }).where(eq(listings.listingId, id));
await logPriceChanged({ listingId: id, userId, oldPrice, newPrice, reason });
```

### 2. Use Convenience Functions When Available
```typescript
// ❌ Verbose - Generic function
await logDealActivity({
  dealId: 123n,
  userId: "user-123",
  action: "commission_paid",
  details: {
    amount: 10500,
    paymentDate: new Date().toISOString(),
    paymentMethod: "bank_transfer",
    recipients: [...],
    netPaid: 10500
  }
});

// ✅ Clean - Convenience function
await logCommissionPaid({
  dealId: 123n,
  userId: "user-123",
  amount: 10500,
  paymentDate: new Date().toISOString(),
  paymentMethod: "bank_transfer",
  recipients: [...],
  netPaid: 10500
});
```

### 3. Include Context and Reasoning
```typescript
// ❌ Insufficient context
await logStatusChanged({ listingId, userId, oldStatus: "Draft", newStatus: "En Venta" });

// ✅ Rich context
await logStatusChanged({
  listingId,
  userId,
  oldStatus: "Draft",
  newStatus: "En Venta",
  reason: "All photos uploaded, energy certificate received, ready for market",
  daysInPreviousStatus: 12
});
```

### 4. GDPR Compliance Logging
Always log GDPR-related events immediately:
```typescript
// User unsubscribes
await logConsentWithdrawn({
  contactId,
  userId: "system",
  consentType: "marketing_email",
  withdrawalDate: new Date().toISOString(),
  withdrawalMethod: "unsubscribe_link",
  effectiveDate: new Date().toISOString(),
  confirmationSent: true
});

// Stop sending marketing emails IMMEDIATELY
```

---

## Analytics & Reporting Queries

### Most Common Cancellation Reasons
```sql
SELECT
  JSON_EXTRACT(details, '$.reasonCategory') as reason,
  COUNT(*) as count
FROM deal_activity
WHERE action = 'deal_cancelled'
GROUP BY reason
ORDER BY count DESC;
```

### Average Days to Close
```sql
SELECT
  AVG(JSON_EXTRACT(details, '$.daysToClose')) as avg_days
FROM deal_activity
WHERE action = 'deal_closed';
```

### GDPR Compliance Timeline
```sql
SELECT
  contact_id,
  JSON_EXTRACT(details, '$.requestDate') as request_date,
  JSON_EXTRACT(details, '$.legalDeadline') as deadline,
  JSON_EXTRACT(details, '$.status') as status
FROM contact_activity
WHERE action = 'gdpr_data_export_requested'
AND JSON_EXTRACT(details, '$.status') = 'pending';
```

### Agent Performance
```sql
SELECT
  user_id,
  COUNT(CASE WHEN action = 'deal_closed' THEN 1 END) as deals_closed,
  COUNT(CASE WHEN action = 'deal_cancelled' THEN 1 END) as deals_lost
FROM deal_activity
WHERE action IN ('deal_closed', 'deal_cancelled')
GROUP BY user_id;
```

---

## Future Enhancements (Normal/Low Priority Actions)

### Deal Activity (29 additional actions available)
- Document management (5 actions)
- Referral tracking (3 actions)
- Parties management (6 actions)
- Notes & observations (3 actions)

### Contact Activity (36 additional actions available)
- Contact information updates (6 actions)
- Relationship management (6 actions)
- Quality & data enrichment (5 actions)
- Segmentation & tagging (5 actions)
- Account management (4 actions)
- Cross-entity relationships (6 actions)

**To implement:** Follow same pattern, add actions to constants, define detail interfaces, create convenience functions.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Activity Tables** | 4 |
| **Total Actions Implemented** | 81 |
| **TypeScript Interfaces** | 81 |
| **Convenience Helper Functions** | 16 |
| **Batch Logging Functions** | 4 |
| **Critical Priority Actions** | 42 |
| **GDPR-Related Actions** | 4 |
| **Notifiable Actions** | 31 |
| **Lines of Code** | ~4,100 |

---

## Maintenance

### Adding New Actions
1. Add action to constants file (`*-activity-actions.ts`)
2. Add to Spanish labels mapping
3. Set priority level
4. Define details interface in types file (`*-activity-details.ts`)
5. Add to `DetailsMap` interface
6. Create convenience function in `log-activity.ts` (optional)
7. Document in this file

### Schema Changes
Database tables are append-only logs. Schema changes should be rare:
- Adding columns: Requires migration
- Changing action names: Add new action, deprecate old (never delete)
- Modifying details structure: Backwards compatible (JSON is flexible)

---

**Documentation Version:** 1.0
**Last Review:** 2025-01-29
**Next Review:** 2025-04-29 (quarterly)
