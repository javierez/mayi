# WhatsApp Two-Way Messaging Architecture

This document describes the architecture of the WhatsApp two-way messaging system in Vesta, enabling real-time conversations between agents and contacts (leads, buyers, owners).

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VESTA INBOX UI                                  │
│                    (React components + useInbox hook)                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ polling (15s)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER ACTIONS                                     │
│              src/server/actions/whatsapp-conversations.ts                    │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐  │
│  │ getConversations│ sendMessage     │ sendTemplate    │ markAsRead      │  │
│  │ getConversation │ startConversation│ archiveConv    │ linkToListing   │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌────────────────────────────┐    ┌────────────────────────────────────┐   │
│  │ whatsapp-conversation-     │    │ whatsapp-message-service.ts        │   │
│  │ service.ts                 │    │ • sendMessage (with 24h check)     │   │
│  │ • getOrCreateConversation  │    │ • sendTemplateMessage              │   │
│  │ • getConversationsForAccount│   │ • storeIncomingMessage             │   │
│  │ • enrichConversationRow    │    │ • updateMessageStatus              │   │
│  │ • markAsRead/archive       │    │ • getMessages                      │   │
│  └────────────────────────────┘    └────────────────────────────────────┘   │
│                                              │                               │
│                                              ▼                               │
│                              ┌────────────────────────────────────┐          │
│                              │ whatsapp-service.ts (EXISTING)     │          │
│                              │ • sendWhatsAppFreeform()           │          │
│                              │ • sendWhatsAppTemplate()           │          │
│                              │ • normalizeToWhatsApp()            │          │
│                              └────────────────────────────────────┘          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TWILIO API                                         │
│                    Messages API (WhatsApp Business)                          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
┌──────────────────────────────┐      ┌──────────────────────────────────────┐
│     INCOMING WEBHOOK         │      │         STATUS WEBHOOK                │
│ /api/webhooks/whatsapp/      │      │ /api/webhooks/whatsapp/status         │
│ incoming                     │      │                                       │
│                              │      │ Updates message status:               │
│ 1. Validate Twilio signature │      │ queued → sent → delivered → read      │
│ 2. Find contact by phone     │      │                                       │
│ 3. Get/create conversation   │      │                                       │
│ 4. Store message             │      │                                       │
│ 5. Update 24h window         │      │                                       │
└──────────────────────────────┘      └──────────────────────────────────────┘
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VESTA DATABASE                                     │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ whatsapp_conversations      │    │ whatsapp_messages                   │ │
│  │                             │    │                                     │ │
│  │ • conversation_id (PK)      │◄───│ • message_id (PK)                   │ │
│  │ • account_id                │    │ • conversation_id (FK)              │ │
│  │ • contact_id (FK→contacts)  │    │ • twilio_message_sid                │ │
│  │ • whatsapp_number           │    │ • direction (inbound/outbound)      │ │
│  │ • status                    │    │ • status (queued/sent/delivered/    │ │
│  │ • last_message_at           │    │          read/failed)               │ │
│  │ • last_customer_message_at  │◄───│ • body                              │ │
│  │   (24h window tracking)     │    │ • media_urls (JSONB)                │ │
│  │ • unread_count              │    │ • sender_type (agent/contact)       │ │
│  │ • listing_contact_id        │    │ • is_template                       │ │
│  │ • is_active                 │    │ • template_sid                      │ │
│  └─────────────────────────────┘    │ • sent_at, delivered_at, read_at    │ │
│                                     └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── app/api/webhooks/whatsapp/
│   ├── incoming/route.ts      # Receives messages from Twilio
│   └── status/route.ts        # Receives delivery status updates
│
├── components/inbox/
│   ├── inbox-page-content.tsx # Main inbox UI (uses useInbox)
│   └── inbox-message-detail.tsx # Conversation view (24h window UI)
│
├── hooks/
│   ├── use-inbox.ts           # Combined Gmail + WhatsApp hook
│   └── use-whatsapp-inbox.ts  # WhatsApp-specific hook (15s polling)
│
├── server/
│   ├── actions/
│   │   └── whatsapp-conversations.ts  # Server actions for inbox
│   │
│   └── services/
│       ├── whatsapp-service.ts        # Twilio API wrapper (EXISTING)
│       ├── whatsapp-conversation-service.ts  # Conversation CRUD
│       ├── whatsapp-message-service.ts       # Message send/store
│       └── whatsapp-webhook-handler.ts       # Webhook processing
│
├── types/
│   ├── whatsapp-conversations.ts  # TypeScript types
│   └── whatsapp-templates.ts      # Template SIDs (EXISTING)
│
└── server/db/
    └── schema.ts              # Database tables (Drizzle)
```

---

## Key Concepts

### 1. The 24-Hour Window Rule

WhatsApp Business API enforces a **24-hour messaging window**:

```
Customer sends message
        │
        ▼
┌───────────────────────────────────────────┐
│           24-HOUR WINDOW OPEN             │
│                                           │
│  • Agent can send freeform messages       │
│  • No template required                   │
│  • last_customer_message_at is set        │
└───────────────────────────────────────────┘
        │
        │ 24 hours pass...
        ▼
┌───────────────────────────────────────────┐
│          24-HOUR WINDOW CLOSED            │
│                                           │
│  • Agent CANNOT send freeform messages    │
│  • Must use approved template             │
│  • Template opens new conversation        │
└───────────────────────────────────────────┘
```

**Implementation:**
- `last_customer_message_at` tracks when the customer last messaged
- `isWithin24HourWindow()` helper in `whatsapp-conversations.ts`
- UI shows warning banner when window expired
- `sendMessage()` returns `requiresTemplate: true` when window closed

### 2. Message Flow: Agent → Contact

```
Agent types message in inbox
        │
        ▼
useInbox.sendReply(threadId, content)
        │
        ▼
sendWhatsAppMessageAction(conversationId, content)
        │
        ▼
whatsapp-message-service.sendMessage()
        │
        ├─── Check 24h window ───┐
        │                        │
        ▼                        ▼
   WINDOW OPEN              WINDOW CLOSED
        │                        │
        ▼                        ▼
sendWhatsAppFreeform()     Return error:
        │                  requiresTemplate: true
        ▼
   Twilio API
        │
        ▼
Store message (status: 'queued')
        │
        ▼
Status webhook updates:
queued → sent → delivered → read
```

### 3. Message Flow: Contact → Agent

```
Contact sends WhatsApp message
        │
        ▼
Twilio receives message
        │
        ▼
POST /api/webhooks/whatsapp/incoming
        │
        ▼
whatsapp-webhook-handler.handleIncomingMessage()
        │
        ├─── Find contact by phone
        │
        ├─── Get/create conversation
        │
        ├─── Store message (direction: 'inbound')
        │
        └─── Update last_customer_message_at  ◄── RESETS 24H WINDOW!
        │
        ▼
Next inbox poll (15s) fetches new message
```

---

## Data Models

### WhatsAppConversation

```typescript
interface WhatsAppConversation {
  conversationId: bigint;
  accountId: bigint;
  contactId: bigint;
  whatsappNumber: string;        // E.164 format: +34612345678
  status: 'active' | 'closed' | 'archived';
  lastMessageAt: Date | null;
  lastCustomerMessageAt: Date | null;  // For 24h window
  unreadCount: number;
  listingContactId: bigint | null;     // Link to property
  isActive: boolean;

  // Enriched fields (from joins)
  contact: WhatsAppContactInfo;
  listing?: RelatedListing;
  isWithin24Hours: boolean;
  windowExpiresAt: Date | null;
}
```

### WhatsAppMessage

```typescript
interface WhatsAppMessage {
  messageId: bigint;
  conversationId: bigint;
  twilioMessageSid: string | null;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  body: string | null;
  mediaUrls: Array<{ url: string; contentType: string }>;
  senderType: 'agent' | 'contact' | 'system';
  senderUserId: string | null;
  isTemplate: boolean;
  templateSid: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
}
```

### WhatsAppSessionInfo (24h Window)

```typescript
interface WhatsAppSessionInfo {
  canSendFreeform: boolean;
  hoursRemaining: number | null;
  expiresAt: Date | null;
  lastCustomerMessageAt: Date | null;
}
```

---

## Client Hook: useWhatsAppInbox

```typescript
const {
  // Connection state
  isConnected,
  whatsappNumber,
  isCheckingConnection,

  // Conversation state
  conversations,
  threads,          // Converted for inbox compatibility
  isLoading,
  error,

  // Actions
  refresh,
  selectConversation,
  sendMessage,
  sendTemplate,
  startConversation,
  markAsRead,
  archiveConversation,
  linkToListing,

  // 24h window helpers
  canSendFreeform,
  getSessionInfo,
} = useWhatsAppInbox();
```

**Key Features:**
- **15-second polling** for new messages
- **5-second cooldown** to prevent API spam
- **Window focus refresh** when user returns to tab
- **Optimistic updates** for read status

---

## Webhook Configuration

Configure in **Twilio Console → Messaging → WhatsApp Senders**:

| Webhook | URL | Purpose |
|---------|-----|---------|
| Incoming | `https://your-domain.com/api/webhooks/whatsapp/incoming` | Receive messages |
| Status | `https://your-domain.com/api/webhooks/whatsapp/status` | Delivery updates |

**Local Development:**
```bash
# Use ngrok to expose local server
ngrok http 3000

# Configure Twilio with ngrok URL:
# https://abc123.ngrok.io/api/webhooks/whatsapp/incoming
```

---

## UI Components

### 24h Window States

| State | Color | UI Element |
|-------|-------|------------|
| Window open (>2h) | Green | "Xh restantes para mensajes libres" |
| Window expiring (<2h) | Amber | "Menos de Xh para que expire" |
| Window closed | Amber/Warning | Banner + "Enviar plantilla" button |

### Conversation View

```
┌─────────────────────────────────────────┐
│  [Avatar] Contact Name                  │
│  +34 612 345 678          [⭐] [🗑️]     │
├─────────────────────────────────────────┤
│                                         │
│     [Message bubbles...]                │
│                                         │
├─────────────────────────────────────────┤
│  ⚠️ Ventana de 24h expirada            │  ← Warning banner (if expired)
│  [Enviar plantilla]                     │
├─────────────────────────────────────────┤
│  🕐 6h restantes para mensajes libres   │  ← Time indicator (if open)
├─────────────────────────────────────────┤
│  [📎] [Escribe un mensaje...    ] [➤]  │  ← Disabled if window closed
└─────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# Required for WhatsApp messaging
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your WhatsApp Business number
```

---

## Relationship to One-Way Notifications

This two-way messaging system is **separate from** but **shares code with** the one-way notification system:

| Aspect | One-Way Notifications | Two-Way Messaging |
|--------|----------------------|-------------------|
| Direction | Business → User | Agent ↔ Contact |
| Use Case | Reminders, alerts | Real-time chat |
| Storage | Not stored locally | Full history in DB |
| 24h Window | N/A (templates) | Tracked per conversation |
| UI | None (background) | Inbox UI |

**Shared Code:**
- `whatsapp-service.ts` - Twilio API wrapper
- `whatsapp-templates.ts` - Template definitions
- Environment variables

---

## Database Migration

Run the SQL in `docs/whatsapp-database.sql` or use Drizzle:

```bash
# Generate migration from schema.ts
pnpm db:generate

# Apply migration
pnpm db:push
```

---

## Security Considerations

1. **Twilio Signature Validation** - All webhooks validate `x-twilio-signature` in production
2. **Multi-Tenant Isolation** - All queries filter by `accountId`
3. **Contact Verification** - Only messages from known contacts are processed
4. **No Secret Exposure** - All Twilio credentials are server-side only

---

## Future Enhancements

1. **Template Picker Modal** - UI to select and customize templates
2. **Media Attachments** - Support sending images/documents
3. **Read Receipts** - Show blue checkmarks for read messages
4. **Typing Indicators** - Show when contact is typing
5. **Message Search** - Full-text search across conversations
6. **Bulk Actions** - Archive/delete multiple conversations

---

## Next Steps: Setup & Testing

### Step 1: Create Database Tables

Run the PostgreSQL migration:

```sql
-- WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  conversation_id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  last_message_at TIMESTAMP,
  last_customer_message_at TIMESTAMP,
  unread_count INTEGER NOT NULL DEFAULT 0,
  listing_contact_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_whatsapp_conversations_account ON whatsapp_conversations(account_id);
CREATE INDEX idx_whatsapp_conversations_contact ON whatsapp_conversations(contact_id);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(whatsapp_number);
CREATE UNIQUE INDEX idx_whatsapp_conversations_unique_contact ON whatsapp_conversations(account_id, contact_id);

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  message_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  twilio_message_sid VARCHAR(64),
  direction VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  body TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  sender_type VARCHAR(20) NOT NULL,
  sender_user_id VARCHAR(36),
  is_template BOOLEAN DEFAULT FALSE,
  template_sid VARCHAR(64),
  template_variables JSONB,
  error_code VARCHAR(20),
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_twilio_sid ON whatsapp_messages(twilio_message_sid);
```

Or use Drizzle:
```bash
pnpm db:push
```

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your Twilio WhatsApp number
```

### Step 3: Set Up ngrok (Local Development)

Twilio needs to reach your local server via webhooks:

```bash
# Install ngrok
brew install ngrok

# Start tunnel (keep this running)
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Twilio Webhooks

1. Go to **Twilio Console** → **Messaging** → **WhatsApp Senders**
2. Select your WhatsApp number
3. Configure webhooks:

| Field | Value |
|-------|-------|
| **When a message comes in** | `https://abc123.ngrok.io/api/webhooks/whatsapp/incoming` |
| **Status callback URL** | `https://abc123.ngrok.io/api/webhooks/whatsapp/status` |

4. Set HTTP method to **POST** for both

### Step 5: Create a Test Contact

The system only accepts messages from known contacts. Create a contact with your phone number:

1. Go to `/contactos` in Vesta
2. Click "Nuevo Contacto"
3. Add your phone number in E.164 format: `+34612345678`
4. Save the contact

### Step 6: Start the Dev Server

```bash
pnpm dev
```

### Step 7: Test the Flow

#### Test Incoming Messages
1. Open WhatsApp on your phone
2. Send a message to your Twilio WhatsApp number (e.g., `+1 415 523 8886`)
3. Watch the terminal for logs:
   ```
   [WhatsApp Webhook] Incoming message: { from: 'whatsapp:+34...', ... }
   [WhatsApp Webhook] Message stored: 123
   ```
4. Go to `/inbox` - you should see the new conversation

#### Test Outgoing Messages
1. Select the WhatsApp conversation in the inbox
2. Type a message and click Send
3. Check your phone - you should receive the message

#### Test 24h Window Expiration
1. Manually expire the window in the database:
   ```sql
   UPDATE whatsapp_conversations
   SET last_customer_message_at = NOW() - INTERVAL '25 hours'
   WHERE conversation_id = 1;
   ```
2. Refresh the inbox
3. Try to send a message - you should see "Ventana de 24h expirada" warning
4. The text input should be disabled

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not receiving | ngrok not running or URL wrong | Restart ngrok, update Twilio console |
| "Contact not found" in logs | Phone number doesn't match | Create contact with exact E.164 format |
| Messages not appearing | Polling not working | Check browser console, refresh page |
| Can't send replies | 24h window closed | Customer must message first to open window |
| "No autorizado" error | Account mismatch | Check user is logged in, contact belongs to account |
| Twilio signature invalid | Wrong auth token | Verify `TWILIO_AUTH_TOKEN` in `.env` |

### Quick Test: Simulate Incoming Webhook

Test the webhook without using your phone:

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp/incoming \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM$(date +%s)" \
  -d "From=whatsapp:+34612345678" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=Hola, esto es una prueba" \
  -d "NumMedia=0"
```

**Note:** This skips signature validation (only works in development mode).

### Production Deployment Checklist

- [ ] Database tables created
- [ ] Environment variables set in production
- [ ] Twilio webhooks updated to production URL
- [ ] SSL certificate valid (Twilio requires HTTPS)
- [ ] Signature validation enabled (`NODE_ENV=production`)
- [ ] Error monitoring configured (Sentry, etc.)

---

## Files Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `src/types/whatsapp-conversations.ts` | TypeScript types and helpers |
| `src/server/services/whatsapp-conversation-service.ts` | Conversation CRUD |
| `src/server/services/whatsapp-message-service.ts` | Message send/store |
| `src/server/services/whatsapp-webhook-handler.ts` | Webhook processing |
| `src/server/actions/whatsapp-conversations.ts` | Server actions |
| `src/hooks/use-whatsapp-inbox.ts` | Client hook |
| `src/app/api/webhooks/whatsapp/incoming/route.ts` | Incoming webhook |
| `src/app/api/webhooks/whatsapp/status/route.ts` | Status webhook |

### Modified Files
| File | Change |
|------|--------|
| `src/server/db/schema.ts` | Added `whatsapp_conversations` and `whatsapp_messages` tables |
| `src/types/whatsapp-templates.ts` | Added `re_engagement` template |
| `src/hooks/use-inbox.ts` | Integrated WhatsApp hook |
| `src/components/inbox/inbox-message-detail.tsx` | Added 24h window UI |
| `src/components/inbox/inbox-page-content.tsx` | Pass 24h window props |

### Reused Files (from notification system)
| File | Functions Used |
|------|---------------|
| `src/server/services/whatsapp-service.ts` | `sendWhatsAppFreeform()`, `sendWhatsAppTemplate()`, `normalizeToWhatsApp()` |
