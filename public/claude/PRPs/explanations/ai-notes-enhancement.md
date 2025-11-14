# AI-Powered Notes Enhancement System

**Created:** November 2025
**Status:** ✅ Implemented
**Location:** Activity Modals (Contact & Listing Contact Activities)

---

## Overview

The AI Notes Enhancement System provides intelligent text transformation capabilities for activity notes across all three activity creation modals. Users can leverage AI to create summaries or automatically extract actionable tasks - all with a preview-before-apply workflow.

## Architecture

### Components Structure

```
src/
├── server/
│   └── openai/
│       └── notes-transformer.ts          # AI transformation server actions
├── components/
│   ├── shared/
│   │   ├── notes-ai-buttons.tsx          # Conditional AI action buttons
│   │   └── notes-transformation-preview-modal.tsx  # Preview & confirm modal
│   └── contactos/
│       ├── quick-action-modal.tsx        # ✓ Enhanced with AI
│       ├── add-general-activity-modal.tsx # ✓ Enhanced with AI
│       └── add-listing-contact-activity-modal.tsx # ✓ Enhanced with AI
└── app/
    └── actions/
        └── create-task.ts                # Generic task creation action
```

---

## Features

### 1. Summarize Notes
**Threshold:** Active when notes exceed **400 characters**

**Purpose:** Creates structured bullet-point summary of long notes, highlighting key points and action items.

**AI Prompt Strategy:**
- Extracts main points into 5-6 bullet points maximum
- Prioritizes actionable information
- Uses bullet format (•) for clarity
- Focuses on decisions, next steps, and important data

**Example:**
```
Original (500+ chars):
"Llamada con María López sobre la propiedad en Chamberí. Estuvo muy
interesada en hacer una visita el próximo martes a las 11:00. Mencionó
que necesita confirmar con su pareja antes de comprometerse. Le preocupa
el precio de 350.000€ pero le gustó mucho la ubicación. Quiere ver otras
propiedades similares en la zona..."

Summary:
• Interesada en visita el martes 11:00
• Necesita confirmar con pareja antes de comprometerse
• Preocupación por precio (350.000€)
• Le agrada la ubicación en Chamberí
• Solicita ver propiedades similares en la zona
```

### 2. Extract Tasks from Notes
**Threshold:** Active **only when pending toggle is enabled** (any note length)

**Purpose:** Automatically identifies and creates actionable tasks from notes content.

**AI Prompt Strategy:**
- Identifies concrete, actionable items (calls, emails, documents, follow-ups)
- Generates clear task titles (verb-first: "Llamar...", "Enviar...", "Programar...")
- Includes relevant context in task descriptions
- Maximum 5 tasks per extraction
- Returns empty array if no actionable tasks found

**Example:**
```
Original Notes:
"Cliente interesado en visita el martes. Necesito enviar documentación
de la propiedad y confirmar disponibilidad del propietario. También
recordarle que prepare los certificados energéticos."

Extracted Tasks:
1. Enviar documentación de la propiedad
   Descripción: Enviar documentos al cliente antes de la visita del martes

2. Confirmar disponibilidad del propietario
   Descripción: Contactar al propietario para confirmar visita del martes

3. Recordar preparación de certificados energéticos
   Descripción: Verificar que el propietario tenga los certificados listos
```

---

## User Interface

### Button Positioning
**Location:** Top-right corner of notes textarea, positioned horizontally

**Stack Order (right to left):**
1. Voice button (rightmost, `right-1`) - Always visible
2. Tasks button (`right-8`) - Only when pending toggle is ON
3. Summarize button (`right-16`) - Only when notes > 400 chars

**Textarea Padding:** `pr-32` to accommodate all buttons without overlap

### Button Styling
```typescript
// Matches existing PushToTalkWhisperButton style
{
  base: "absolute top-1 inline-flex h-7 w-7",
  states: {
    default: "text-gray-400 bg-transparent",
    hover: "text-gray-700 bg-gray-50 border-gray-200",
    active: "bg-gray-100",
    disabled: "opacity-50 pointer-events-none"
  }
}
```

**Icons:**
- ✨ **Sparkles** - Summarize
- ✅ **ListTodo** - Create Tasks

### Preview Modal
**Component:** `NotesTransformationPreviewModal`

**Features:**
- Side-by-side comparison (original vs. transformed)
- Character count for both versions
- Reduction percentage display (for summarize)
- Clear visual separation with arrow indicator
- Confirm/Cancel actions
- Loading state during AI processing

**Modal Titles:**
- "Resumir notas"
- "Tareas extraídas"

---

## Technical Implementation

### Server Actions (`notes-transformer.ts`)

#### summarizeNotes()
```typescript
export async function summarizeNotes(notes: string): Promise<TransformationResult>
```
- **Model:** `gpt-4o-mini`
- **Temperature:** 0.3
- **Max Tokens:** 300
- **Validation:** Checks notes > 400 chars
- **Output Format:** Bullet points (•)

#### extractTasksFromNotes()
```typescript
export async function extractTasksFromNotes(notes: string): Promise<TaskExtractionResult>
```
- **Model:** `gpt-4o-mini`
- **Temperature:** 0.2 (more deterministic for structured output)
- **Max Tokens:** 500
- **Response Format:** JSON object with tasks array
- **Validation:** Validates JSON structure and task fields

**Task Structure:**
```typescript
interface ExtractedTask {
  title: string;        // Max 60 chars, verb-first
  description: string;  // Context and details
}
```

### Client-Side Integration

Each modal includes:
1. **State Management:**
   - `showPreviewModal` - Controls preview dialog visibility
   - `previewType` - Type of transformation (summarize/tasks)
   - `transformedContent` - AI-generated result
   - `isProcessing` - Loading state
   - `processingType` - Which button is processing

2. **Handler Functions:**
   - `handleAITransform()` - Calls appropriate server action (summarize or tasks)
   - `handleConfirmTransformation()` - Applies transformation or creates tasks

3. **UI Components:**
   - `<NotesAiButtons>` - Conditional button rendering
   - `<NotesTransformationPreviewModal>` - Preview dialog
   - Custom scrollbar on textarea (`custom-scrollbar`)

---

## Task Creation Workflow

### When "Create Tasks" is Confirmed:

1. **Re-extract tasks** from original notes (ensures fresh data)
2. **Iterate through extracted tasks** (result.tasks array)
3. **Create each task** via `createTaskAction()`:
   ```typescript
   {
     title: task.title,
     description: task.description,
     contactId: contactId,
     dueDate: (current date + 3 days) // Default
   }
   ```
4. **Display success toast** with count: "3 tareas creadas correctamente"
5. **Close preview modal**

### Task Creation Action
```typescript
// src/app/actions/create-task.ts
export async function createTaskAction(params: {
  title: string;
  description: string;
  contactId: bigint;
  dueDate?: Date;
})
```

**Default Behavior:**
- Assigns task to current user
- Sets due date to 3 days from now if not specified
- Marks as not completed
- Sets as active

---

## Error Handling

### Graceful Degradation
All transformations include proper error handling:

```typescript
try {
  const result = await summarizeNotes(notes);
  if (result.success && result.content) {
    // Show preview modal
  } else {
    toast.error(result.error ?? "Error al resumir las notas");
  }
} catch (error) {
  console.error("Error in AI transformation:", error);
  toast.error("Error al procesar las notas");
}
```

### Empty Results
- **No tasks found:** Shows info toast "No se encontraron tareas accionables"
- **Empty notes:** Error toast "Las notas no pueden estar vacías"
- **Below threshold:** Button not visible (no error needed)

### OpenAI Failures
- Proper error logging to console
- User-friendly Spanish error messages
- No data loss (original notes preserved)

---

## Integration Points

### Modal Files Enhanced:
1. **QuickActionModal** (`quick-action-modal.tsx`)
   - Used when creating activities from anywhere
   - Can create both contact_activity and listing_contact_activity
   - Requires contact selection first

2. **AddGeneralActivityModal** (`add-general-activity-modal.tsx`)
   - Used from contact detail page
   - Pre-selected contactId
   - Optional listing association

3. **AddListingContactActivityModal** (`add-listing-contact-activity-modal.tsx`)
   - Used from listing detail page
   - Pre-selected listingContactId
   - Task creation shows info message (requires contact context)

### Shared Components:
- **NotesAiButtons:** Reusable conditional button component
- **NotesTransformationPreviewModal:** Reusable preview dialog
- **PushToTalkWhisperButton:** Voice input (existing)

---

## Spanish Real Estate Context

All AI prompts are specifically designed for Spanish real estate:

### Terminology Preserved:
- Inmuebles, propiedades, pisos
- Visitas, citas, operaciones
- Arras, escrituras, notario
- Certificados energéticos
- Referencias catastrales

### Name Handling:
Spanish names (Juan García, María López) are preserved correctly with proper accents and formatting.

### Currency:
Euro amounts (€) and Spanish number formatting are maintained.

---

## Performance Considerations

### Token Usage:
- **Summarize:** ~300 tokens max
- **Tasks:** ~500 tokens max

**Model:** `gpt-4o-mini` chosen for cost-effectiveness while maintaining quality

### Response Times:
- Typical: 1-3 seconds per transformation
- Loading states prevent user confusion
- Preview modal allows user review before applying

### Caching:
No caching implemented - each transformation is fresh to account for:
- Notes may change before confirmation
- Context-specific results needed
- Low cost due to mini model

---

## Future Enhancements

### Potential Improvements:
1. **Translation Support:** Translate notes to English for international clients
2. **Sentiment Analysis:** Detect client interest level from conversation notes
3. **Smart Categorization:** Auto-suggest activity type based on content
4. **Meeting Notes:** Extract dates/times for automatic calendar integration
5. **Contact Extraction:** Identify and link mentioned contacts
6. **Property Matching:** Suggest properties based on requirements in notes

### Technical Debt:
- **Task Creation in ListingContactActivityModal:** Currently shows info message because we have `listingContactId` but need `contactId`. Future: query for contactId from listingContactId relationship.

---

## Testing Checklist

- [x] Buttons appear at correct character thresholds
- [x] Preview modal shows before/after comparison
- [x] Confirm applies transformation correctly
- [x] Cancel preserves original notes
- [x] Task creation works with multiple tasks
- [x] Error handling displays user-friendly messages
- [x] Loading states show during AI processing
- [x] Custom scrollbar applied to all three modals
- [x] Buttons don't overlap with voice button
- [x] TypeScript compilation passes
- [x] ESLint passes without warnings
- [x] Make concise feature removed as requested

---

## Code Quality Standards Followed

✅ **TypeScript:** Strict typing, no `any` types
✅ **Nullish Coalescing:** Uses `??` instead of `||`
✅ **ESLint:** No disabled rules, all warnings resolved
✅ **Error Handling:** Try/catch with proper logging
✅ **Code Reuse:** Shared components for all three modals
✅ **DRY Principle:** Single AI transformation logic
✅ **KISS Principle:** Straightforward implementation
✅ **Spanish Context:** Proper language and terminology
✅ **Custom Scrollbar:** Consistent UI styling

---

## Related Documentation

- **Activity System:** `activity-tracking-system.md`
- **OpenAI Integration:** `title-generation.md`
- **Task System:** Task queries and actions
- **Voice Input:** `voice-to-db.md`

---

## Summary

The AI Notes Enhancement System seamlessly integrates intelligent text processing into the activity creation workflow. By providing preview-before-apply functionality and context-aware transformations, it helps users maintain high-quality activity records while saving time on manual text editing and task creation. The system is designed specifically for Spanish real estate operations and follows all established codebase patterns and quality standards.
