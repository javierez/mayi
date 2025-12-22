# AI Context Management for Vesta

This document explains how to implement AI-powered features using Claude's context management approach (no RAG required).

## Core Concept

Instead of using RAG (Retrieval Augmented Generation) which requires:
- Embedding documents
- Vector databases
- Search + retrieve chunks

We use Claude's **extended context window + prompt caching**:
- Include full documents in context
- Cache static content (90% cost reduction)
- Full document comprehension (no chunk limitations)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Request                          │
├─────────────────────────────────────────────────────────┤
│  System Prompt (cached)                                 │
│  ├── Instructions                                       │
│  ├── Document 1 (property data, templates, etc.)        │
│  ├── Document 2 (user preferences, feedback)            │
│  └── cache_control: { type: "ephemeral" }               │
├─────────────────────────────────────────────────────────┤
│  User Message                                           │
│  └── Specific task/question                             │
└─────────────────────────────────────────────────────────┘
```

## Implementation for Description Generation

### Current State (description-card.tsx)

The current implementation:
1. Calls `onGenerateDescription()` which likely hits an API
2. Stores user preferences in localStorage
3. No context persistence between generations

### Improved Approach

#### 1. Context Builder

```typescript
// src/lib/ai/context-builder.ts

interface PropertyContext {
  property: {
    title: string;
    location: string;
    features: string[];
    price: number;
    type: string;
    rooms: number;
    bathrooms: number;
    squareMeters: number;
    // ... other property fields
  };
  preferences: UserPreferences;
  previousDescriptions?: string[];
  feedback?: DescriptionFeedback;
}

interface UserPreferences {
  generalInstructions?: string;
  avoidMentions?: string[];
  emphasize?: string[];
  signature?: string;
  tone?: "professional" | "friendly" | "luxury";
}

export function buildDescriptionContext(context: PropertyContext): string {
  return `
<property_data>
  <title>${context.property.title}</title>
  <location>${context.property.location}</location>
  <type>${context.property.type}</type>
  <price>${context.property.price.toLocaleString("es-ES")} EUR</price>
  <rooms>${context.property.rooms}</rooms>
  <bathrooms>${context.property.bathrooms}</bathrooms>
  <surface>${context.property.squareMeters} m²</surface>
  <features>
    ${context.property.features.map((f) => `<feature>${f}</feature>`).join("\n    ")}
  </features>
</property_data>

${context.preferences ? `
<user_preferences>
  ${context.preferences.generalInstructions ? `<instructions>${context.preferences.generalInstructions}</instructions>` : ""}
  ${context.preferences.emphasize?.length ? `<emphasize>${context.preferences.emphasize.join(", ")}</emphasize>` : ""}
  ${context.preferences.avoidMentions?.length ? `<avoid>${context.preferences.avoidMentions.join(", ")}</avoid>` : ""}
  ${context.preferences.tone ? `<tone>${context.preferences.tone}</tone>` : ""}
  ${context.preferences.signature ? `<signature>${context.preferences.signature}</signature>` : ""}
</user_preferences>
` : ""}

${context.feedback ? `
<recent_feedback>
  ${context.feedback.shortDescriptionFeedback ? `<short_description_feedback>${context.feedback.shortDescriptionFeedback}</short_description_feedback>` : ""}
  ${context.feedback.longDescriptionFeedback ? `<long_description_feedback>${context.feedback.longDescriptionFeedback}</long_description_feedback>` : ""}
</recent_feedback>
` : ""}

${context.previousDescriptions?.length ? `
<previous_descriptions>
  ${context.previousDescriptions.map((d, i) => `<version index="${i + 1}">${d}</version>`).join("\n  ")}
</previous_descriptions>
` : ""}
`.trim();
}
```

#### 2. Description Generation Service

```typescript
// src/server/openai/description-generator.ts

import Anthropic from "@anthropic-ai/sdk";
import { buildDescriptionContext, type PropertyContext } from "~/lib/ai/context-builder";

const client = new Anthropic();

const SYSTEM_PROMPT = `Eres un experto copywriter inmobiliario español.
Generas descripciones atractivas y profesionales para propiedades inmobiliarias.

Reglas:
- Escribe en español correcto
- Destaca las características más atractivas
- Usa un tono profesional pero cercano
- No exageres ni uses superlativos excesivos
- Incluye información práctica y relevante
- Si hay firma configurada, añádela al final

Responde SOLO con la descripción, sin explicaciones adicionales.`;

export async function generateDescription(
  context: PropertyContext,
  type: "short" | "full"
): Promise<string> {
  const contextXml = buildDescriptionContext(context);

  const taskPrompt = type === "short"
    ? "Genera una descripción CORTA (máximo 200 caracteres) para carteles y previsualizaciones."
    : "Genera una descripción COMPLETA y detallada para el anuncio de la propiedad.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: type === "short" ? 100 : 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
      },
      {
        type: "text",
        text: contextXml,
        cache_control: { type: "ephemeral" }, // Cache the property context
      },
    ],
    messages: [
      {
        role: "user",
        content: taskPrompt,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

#### 3. Preference Persistence

Instead of localStorage, store preferences in the database for consistency:

```typescript
// src/server/db/schema.ts (add to existing)

export const userAiPreferences = createTable("user_ai_preferences", {
  id: bigint("id", { mode: "bigint" }).primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  preferenceType: varchar("preference_type", { length: 50 }).notNull(), // 'description', 'email', etc.
  preferences: json("preferences").$type<UserPreferences>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### 4. Updated Hook Usage

```typescript
// src/hooks/use-description-generator.ts

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";

interface UseDescriptionGeneratorProps {
  propertyId: string;
}

export function useDescriptionGenerator({ propertyId }: UseDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);

  const { data: property } = api.properties.getById.useQuery({ id: propertyId });
  const { data: preferences } = api.aiPreferences.get.useQuery({ type: "description" });

  const generateMutation = api.ai.generateDescription.useMutation();

  const generateDescription = useCallback(async () => {
    if (!property) return null;

    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        propertyId,
        type: "full",
        preferences,
      });
      return result.description;
    } finally {
      setIsGenerating(false);
    }
  }, [property, preferences, propertyId, generateMutation]);

  const generateShortDescription = useCallback(async () => {
    if (!property) return null;

    setIsGeneratingShort(true);
    try {
      const result = await generateMutation.mutateAsync({
        propertyId,
        type: "short",
        preferences,
      });
      return result.description;
    } finally {
      setIsGeneratingShort(false);
    }
  }, [property, preferences, propertyId, generateMutation]);

  return {
    generateDescription,
    generateShortDescription,
    isGenerating,
    isGeneratingShort,
  };
}
```

## Benefits of This Approach

| Aspect | Before | After |
|--------|--------|-------|
| Context | Minimal property data | Full property + preferences + feedback |
| Cost | Full price every call | 90% cheaper with caching |
| Quality | Generic descriptions | Personalized, preference-aware |
| Consistency | Varies each generation | Learns from feedback |
| Persistence | localStorage (per browser) | Database (per user) |

## Caching Strategy

```
First Request (cache write):
├── System prompt: ~500 tokens
├── Property context: ~2000 tokens (CACHED)
├── User message: ~50 tokens
└── Total input: ~2550 tokens at full price

Subsequent Requests (cache read):
├── System prompt: ~500 tokens
├── Property context: ~2000 tokens (FROM CACHE - 90% off)
├── User message: ~50 tokens
└── Total cost: ~550 full + ~2000 at 10% = ~750 effective tokens
```

Cache persists for 5 minutes, perfect for:
- Multiple regenerations
- Short/long description pairs
- Iterative refinement with feedback

## Multi-Document Context (Advanced)

For more complex scenarios (e.g., generating descriptions that reference neighborhood data, comparable properties, market trends):

```typescript
export async function generateEnhancedDescription(
  property: Property,
  comparables: Property[],
  neighborhood: NeighborhoodData,
  preferences: UserPreferences
): Promise<string> {
  const context = `
<documents>
  <document index="1" type="main_property">
    ${buildPropertyXml(property)}
  </document>

  <document index="2" type="comparables">
    ${comparables.map((c, i) => `
    <comparable index="${i + 1}">
      <price>${c.price}</price>
      <surface>${c.squareMeters}</surface>
      <price_per_m2>${(c.price / c.squareMeters).toFixed(0)}</price_per_m2>
    </comparable>
    `).join("")}
  </document>

  <document index="3" type="neighborhood">
    <name>${neighborhood.name}</name>
    <highlights>${neighborhood.highlights.join(", ")}</highlights>
    <transport>${neighborhood.transport.join(", ")}</transport>
  </document>
</documents>
`;

  // Use cached context for all this data
  // Generate with full market awareness
}
```

## Implementation Checklist

- [ ] Create `src/lib/ai/context-builder.ts` for structured context
- [ ] Update `src/server/openai/` to use Anthropic with caching
- [ ] Add `userAiPreferences` table to schema
- [ ] Create TRPC endpoints for preference management
- [ ] Update `description-card.tsx` to use new hook
- [ ] Migrate localStorage preferences to database
- [ ] Add feedback loop that actually affects generation

## Current Implementation Analysis

Looking at `src/server/openai/property_descriptions.tsx`, the current implementation:

### What's Already Good
1. Uses account context for personalization (`fetchAccountContext`)
2. Searches for neighborhood info dynamically
3. Filters to relevant fields per property type (`getRelevantFields`)
4. Has a file-based examples system (`OPENAI_EXAMPLES_FILE_ID`)

### Areas for Improvement

#### 1. No Caching (Cost Issue)
Every call rebuilds the entire prompt. If a user generates short + long descriptions:
- 2 full API calls
- Same context data sent twice
- Full price both times

**Solution**: Use prompt caching to cache the property context.

#### 2. Feedback Not Applied
`description-card.tsx` collects feedback via `DescriptionFeedbackModal` but:
- Only stores in `localStorage`
- Never passed to `generatePropertyDescription()`
- Feedback has no effect on generation

**Solution**: Pass feedback to the generation function:

```typescript
// Current signature
export async function generatePropertyDescription(
  listing: PropertyListing,
  _aiConfig: AIConfig = {},
)

// Improved signature
export async function generatePropertyDescription(
  listing: PropertyListing,
  options: {
    aiConfig?: AIConfig;
    feedback?: DescriptionFeedback;
    previousDescriptions?: string[];
  } = {},
)
```

#### 3. No Learning from Previous Generations
When regenerating, the AI doesn't know what it generated before or why user wants changes.

**Solution**: Include previous descriptions in context:

```typescript
${previousDescriptions?.length ? `
PREVIOUS VERSIONS (user regenerated - improve based on patterns):
${previousDescriptions.map((d, i) => `Version ${i + 1}: ${d}`).join('\n')}
` : ''}
```

#### 4. Two Separate API Calls for Short/Long
`generateShortPropertyDescription` makes a separate call using only the full description.

**Solution**: Generate both in one call with caching:

```typescript
export async function generateBothDescriptions(
  listing: PropertyListing,
  options: GenerationOptions = {},
): Promise<{ full: string; short: string }> {
  // Cache property context, generate both descriptions
  // 1 API call instead of 2
}
```

### Migration to Anthropic (If Desired)

If switching from OpenAI to Claude API:

```typescript
// Before (OpenAI)
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-5-mini-2025-08-07",
  messages: [...],
});

// After (Anthropic with caching)
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  system: [
    { type: "text", text: "System instructions..." },
    {
      type: "text",
      text: propertyContext, // Property data, examples, neighborhood info
      cache_control: { type: "ephemeral" }, // <-- THE KEY DIFFERENCE
    },
  ],
  messages: [{ role: "user", content: "Generate description..." }],
});
```

### Quick Win: Apply Feedback Now (No API Changes)

Without changing the API provider, you can immediately improve by:

```typescript
// In property-characteristics-form.tsx or wherever generation is called

// Load saved preferences
const savedPrefs = localStorage.getItem("descriptionPreferences");
const feedback = savedPrefs ? JSON.parse(savedPrefs) : null;

// Include in prompt (modify generatePropertyDescription to accept this)
const prompt = `
${feedback?.generalInstructions ? `USER INSTRUCTIONS: ${feedback.generalInstructions}` : ''}
${feedback?.emphasize?.length ? `EMPHASIZE THESE: ${feedback.emphasize.join(', ')}` : ''}
${feedback?.avoidMentions?.length ? `AVOID MENTIONING: ${feedback.avoidMentions.join(', ')}` : ''}
...rest of prompt
`;
```

## Related Files

- `src/components/propiedades/form/cards/description-card.tsx` - UI component
- `src/components/propiedades/form/cards/description-feedback-modal.tsx` - Feedback collection
- `src/server/openai/property_descriptions.tsx` - Current generation logic
- `src/server/openai/account-context.ts` - Account context fetching
