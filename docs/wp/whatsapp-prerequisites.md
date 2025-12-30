# WhatsApp Business API - Prerequisites Checklist

## Overview

This guide will help you set up everything needed for WhatsApp notifications in Vesta.

---

## Important: WhatsApp Opt-In Requirement

> ⚠️ **WhatsApp requires explicit user opt-in before sending messages.**

From Twilio docs:
> "Sending messages to end users without an opt-in may result in users blocking your business and may ultimately lead to the suspension of your WhatsApp Business account."

**We will implement:**
- User opt-in toggle in profile settings
- Only send to users who have opted in
- Respect opt-out requests

---

## Message Types

| Type | When to Use | Template Required? |
|------|-------------|-------------------|
| **Business-Initiated** | Sending notifications anytime | YES - Must use Content Templates |
| **Freeform (24h window)** | Reply within 24h of user message | NO - Can send any text |

For internal notifications, we'll use **Content Templates** (business-initiated).

---

## Prerequisites Status

### Already Completed
- [x] Twilio Account (you have this for 2FA)
- [x] Twilio SDK installed
- [x] TWILIO_ACCOUNT_SID configured
- [x] TWILIO_AUTH_TOKEN configured
- [x] Phone number normalization for Spain (+34)

### Need to Complete
- [ ] 1. Connect Meta Business Manager Account
- [ ] 2. Enable WhatsApp in Twilio Console
- [ ] 3. Set up WhatsApp Sender (Sandbox or Business Number)
- [ ] 4. Create Content Templates
- [ ] 5. Get Templates Approved
- [ ] 6. Add Environment Variable (TWILIO_WHATSAPP_NUMBER)
- [ ] 7. Test with Sandbox

---

## Step 1: Connect Meta Business Manager Account

WhatsApp uses your Meta Business Manager account to identify your business.

1. If you don't have one, [create a Meta Business Manager account](https://www.facebook.com/business/help/1710077379203657)
2. Find your **Meta Business Manager ID** in [Business Settings → Business Info](https://business.facebook.com/settings/info)
3. This will be linked during the WhatsApp setup process

> For production at scale, you'll need to verify your Meta Business Manager account.

---

## Step 2: Enable WhatsApp in Twilio Console

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Or directly: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

---

## Step 3: Choose Your WhatsApp Sender

### Option A: Sandbox (For Testing) - RECOMMENDED TO START

The Sandbox lets you test immediately without waiting for approval.

1. Go to [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Note the **Sandbox Number**: `+14155238886` (Twilio's sandbox)
3. To connect your phone:
   - Send `join <your-sandbox-keyword>` to `+14155238886` via WhatsApp
   - Example: `join hungry-elephant` (your keyword will be different)
4. Your phone is now connected to the sandbox

**Sandbox Limitations:**
- Only works with phones that have joined the sandbox
- Uses pre-approved test templates only
- Good for development, not production

### Option B: WhatsApp Business Number (For Production)

For production, you need a registered WhatsApp Business number.

1. Go to [Twilio WhatsApp Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)
2. Click **Add New Sender**
3. Follow the registration process:
   - Verify your Facebook Business Manager
   - Register your phone number
   - Complete WhatsApp Business verification
4. **Timeline**: Approval takes 1-7 business days

---

## Step 4: Create Content Templates

WhatsApp requires **pre-approved templates** for business-initiated messages.

### Go to Content Template Builder

1. Navigate to: https://console.twilio.com/us1/develop/sms/content-template-builder
2. Or: **Messaging** → **Content Template Builder**

### Create Each Template

You need to create **9 templates** for internal notifications:

#### Template 1: Task Assigned
```
Name: vesta_task_assigned_es
Language: Spanish (es)
Category: UTILITY

Body:
📋 *Nueva tarea asignada*

*{{1}}*

Asignada por: {{2}}
Fecha límite: {{3}}

Accede a Vesta para ver los detalles.
```

#### Template 2: Task Completed
```
Name: vesta_task_completed_es
Language: Spanish (es)
Category: UTILITY

Body:
✅ *Tarea completada*

*{{1}}*

Completada por: {{2}}

Accede a Vesta para ver los detalles.
```

#### Template 3: Task Reassigned
```
Name: vesta_task_reassigned_es
Language: Spanish (es)
Category: UTILITY

Body:
🔄 *Tarea reasignada*

*{{1}}*

Reasignada por: {{2}}
Nuevo responsable: {{3}}

Accede a Vesta para ver los detalles.
```

#### Template 4: Task Due Soon
```
Name: vesta_task_due_soon_es
Language: Spanish (es)
Category: UTILITY

Body:
⏰ *Tarea próxima a vencer*

*{{1}}*

Vence en: {{2}}
Fecha límite: {{3}}

Accede a Vesta para completarla.
```

#### Template 5: Task Overdue
```
Name: vesta_task_overdue_es
Language: Spanish (es)
Category: UTILITY

Body:
🚨 *Tarea vencida*

*{{1}}*

Vencida hace: {{2}}

Accede a Vesta urgentemente.
```

#### Template 6: Appointment Scheduled
```
Name: vesta_apt_scheduled_es
Language: Spanish (es)
Category: UTILITY

Body:
📅 *Nueva cita programada*

*{{1}}*

Fecha: {{2}}
Programada por: {{3}}

Accede a Vesta para ver los detalles.
```

#### Template 7: Appointment Rescheduled
```
Name: vesta_apt_rescheduled_es
Language: Spanish (es)
Category: UTILITY

Body:
📅 *Cita reprogramada*

*{{1}}*

Nueva fecha: {{2}}
Fecha anterior: {{3}}

Accede a Vesta para ver los detalles.
```

#### Template 8: Appointment Cancelled
```
Name: vesta_apt_cancelled_es
Language: Spanish (es)
Category: UTILITY

Body:
❌ *Cita cancelada*

*{{1}}*

Cancelada por: {{2}}
Fecha original: {{3}}

Accede a Vesta para más información.
```

#### Template 9: Appointment Reminder
```
Name: vesta_apt_reminder_es
Language: Spanish (es)
Category: UTILITY

Body:
🔔 *Recordatorio de cita*

*{{1}}*

En: {{2}}
Fecha: {{3}}
Ubicación: {{4}}

¡No olvides tu cita!
```

---

## Step 5: Get Templates Approved

1. After creating each template, click **Submit for WhatsApp Approval**
2. **Approval Time**:
   - Sandbox: Instant (uses pre-approved templates)
   - Production: 24-48 hours typically
3. Check status in Content Template Builder

**Tips for faster approval:**
- Use category `UTILITY` (not MARKETING)
- Keep messages professional and clear
- Avoid promotional language
- Include clear purpose

---

## Step 6: Record Your Template SIDs

After templates are approved, note down the SIDs:

| Template | SID |
|----------|-----|
| vesta_task_assigned_es | HX________________________ |
| vesta_task_completed_es | HX________________________ |
| vesta_task_reassigned_es | HX________________________ |
| vesta_task_due_soon_es | HX________________________ |
| vesta_task_overdue_es | HX________________________ |
| vesta_apt_scheduled_es | HX________________________ |
| vesta_apt_rescheduled_es | HX________________________ |
| vesta_apt_cancelled_es | HX________________________ |
| vesta_apt_reminder_es | HX________________________ |

---

## Step 7: Add Environment Variable

Add to your `.env` file:

```bash
# WhatsApp Configuration
# For Sandbox: +14155238886
# For Production: Your registered WhatsApp Business number
TWILIO_WHATSAPP_NUMBER=+14155238886
```

---

## Step 8: Test with Sandbox

Before going to production:

1. **Connect your phone to Sandbox**:
   - Open WhatsApp
   - Send message to `+14155238886`
   - Message: `join <your-sandbox-keyword>`

2. **Test sending**:
   - Use Twilio Console "Try WhatsApp" feature
   - Send a test message to your connected phone

3. **Verify receipt**:
   - Confirm message received on WhatsApp
   - Check formatting looks correct

---

## Sandbox vs Production Comparison

| Feature | Sandbox | Production |
|---------|---------|------------|
| Setup time | Instant | 1-7 days |
| Cost | Free (trial credits) | Per message |
| Recipients | Must opt-in with keyword | Any WhatsApp user |
| Templates | Pre-approved only | Custom approved |
| Best for | Development/Testing | Real users |

---

## Cost Estimates (Production)

WhatsApp Business API pricing (approximate):

- **Utility messages** (notifications): ~$0.005-0.015 per message
- **Marketing messages**: ~$0.02-0.05 per message
- Varies by country and volume

For Spain, expect ~$0.01 per notification message.

---

## Next Steps After Prerequisites

Once you have:
- [ ] Sandbox working OR production number approved
- [ ] Templates created and approved
- [ ] Template SIDs recorded
- [ ] Environment variable added

You're ready for implementation! Share your template SIDs and we'll proceed with the code.

---

## Code Examples (For Reference)

### Send Templated Message (Business-Initiated)
```typescript
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const message = await client.messages.create({
  from: "whatsapp:+14155238886",  // Your WhatsApp sender
  to: "whatsapp:+34612345678",    // Recipient
  contentSid: "HXxxxxxxxxxxxxxxxxx",  // Template SID
  contentVariables: JSON.stringify({
    "1": "Nueva tarea: Llamar cliente",
    "2": "Juan García",
    "3": "15 enero 2025"
  }),
});

console.log(message.sid);  // SMxxxxxxxxxxxxxxxxx
```

### Send Freeform Message (Within 24h Window)
```typescript
const message = await client.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  body: "¡Hola! Este es un mensaje de texto libre.",
});
```

### Send Message with Media
```typescript
const message = await client.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  body: "Aquí tienes la foto de la propiedad.",
  mediaUrl: ["https://example.com/property-photo.jpg"],
});
```

### With Status Callback (Delivery Tracking)
```typescript
const message = await client.messages.create({
  from: "whatsapp:+14155238886",
  to: "whatsapp:+34612345678",
  contentSid: "HXxxxxxxxxxxxxxxxxx",
  contentVariables: JSON.stringify({ "1": "value" }),
  statusCallback: "https://your-domain.com/api/webhooks/whatsapp/status",
});
```

---

## Troubleshooting

### "Message failed to send"
- Verify phone has WhatsApp installed
- For sandbox: ensure phone joined with keyword
- Check phone number format (+34...)

### "Template not approved"
- Review template for policy violations
- Ensure category is correct (UTILITY for notifications)
- Resubmit with clearer, more professional language

### "Rate limited"
- WhatsApp has rate limits per phone number
- Implement delays between messages (we'll handle this in code)

---

## Useful Links

- [Twilio WhatsApp Console](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
- [Content Template Builder](https://console.twilio.com/us1/develop/sms/content-template-builder)
- [WhatsApp Senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy/)
- [Twilio WhatsApp Pricing](https://www.twilio.com/whatsapp/pricing)
