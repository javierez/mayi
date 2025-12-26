"use server";

import OpenAI from "openai";
import { db } from "~/server/db";
import { propertyDescriptionExamples } from "~/server/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";
import {
  PROPERTY_FIELD_MAPPINGS,
  LISTING_FIELD_MAPPINGS,
} from "~/server/ocr/field-mapping-config";

// Types
interface AnalysisResult {
  id: string;
  success: boolean;
  fieldsFound: number;
  error?: string;
}

interface DescriptionAnalysisMetadata {
  fieldsUsed: string[];
  fieldsByTable: {
    properties: string[];
    listings: string[];
  };
  analyzedAt: string;
  stats: {
    totalFields: number;
    model: string;
  };
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build the list of available fields for the GPT prompt
 */
function buildFieldListForPrompt(): {
  propertyFields: { name: string; aliases: string[] }[];
  listingFields: { name: string; aliases: string[] }[];
} {
  const propertyFields = PROPERTY_FIELD_MAPPINGS.map((f) => ({
    name: f.dbColumn,
    aliases: f.aliases,
  }));

  const listingFields = LISTING_FIELD_MAPPINGS.map((f) => ({
    name: f.dbColumn,
    aliases: f.aliases,
  }));

  return { propertyFields, listingFields };
}

/**
 * Build the system prompt for field identification
 */
function buildSystemPrompt(): string {
  const { propertyFields, listingFields } = buildFieldListForPrompt();

  const propertyFieldsList = propertyFields
    .map((f) => `- ${f.name}: ${f.aliases.slice(0, 3).join(", ")}`)
    .join("\n");

  const listingFieldsList = listingFields
    .map((f) => `- ${f.name}: ${f.aliases.slice(0, 3).join(", ")}`)
    .join("\n");

  return `Eres un experto en análisis de descripciones inmobiliarias. Tu trabajo es identificar qué campos/características de propiedad están siendo mencionados o descritos en un texto de ejemplo.

CAMPOS DE PROPIEDADES (properties):
${propertyFieldsList}

CAMPOS DE ANUNCIOS (listings):
${listingFieldsList}

INSTRUCCIONES:
1. Lee la descripción de ejemplo cuidadosamente
2. Identifica SOLO los campos que están EXPLÍCITAMENTE mencionados o claramente descritos
3. No incluyas campos que podrían estar implícitos pero no se mencionan directamente
4. Considera sinónimos y variaciones del idioma español
5. Si se menciona una característica, incluye el nombre del campo correspondiente

IMPORTANTE:
- Solo devuelve los nombres de los campos (dbColumn) que están presentes en la descripción
- No inventes campos que no existen en las listas proporcionadas
- Si un concepto se menciona, busca el campo más apropiado de la lista`;
}

/**
 * Analyze a single description text to identify mentioned fields
 */
async function analyzeDescriptionText(
  exampleText: string,
): Promise<{ propertyFields: string[]; listingFields: string[] }> {
  const { propertyFields, listingFields } = buildFieldListForPrompt();

  const allPropertyFieldNames = propertyFields.map((f) => f.name);
  const allListingFieldNames = listingFields.map((f) => f.name);

  const systemPrompt = buildSystemPrompt();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analiza la siguiente descripción de propiedad e identifica qué campos están siendo mencionados o descritos:\n\n"${exampleText}"`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    tools: [
      {
        type: "function",
        function: {
          name: "report_identified_fields",
          description:
            "Report the property and listing fields identified in the description",
          parameters: {
            type: "object",
            properties: {
              property_fields: {
                type: "array",
                items: {
                  type: "string",
                  enum: allPropertyFieldNames,
                },
                description:
                  "List of property field names found in the description (e.g., bedrooms, hasElevator, terrace)",
              },
              listing_fields: {
                type: "array",
                items: {
                  type: "string",
                  enum: allListingFieldNames,
                },
                description:
                  "List of listing field names found in the description (e.g., price, isFurnished)",
              },
            },
            required: ["property_fields", "listing_fields"],
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "report_identified_fields" },
    },
  });

  const message = completion.choices[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (!toolCall || toolCall.function.name !== "report_identified_fields") {
    console.error("No valid function call in response");
    return { propertyFields: [], listingFields: [] };
  }

  try {
    const args = JSON.parse(toolCall.function.arguments) as {
      property_fields: string[];
      listing_fields: string[];
    };

    // Filter to ensure only valid field names are included
    const validPropertyFields = (args.property_fields ?? []).filter((f) =>
      allPropertyFieldNames.includes(f),
    );
    const validListingFields = (args.listing_fields ?? []).filter((f) =>
      allListingFieldNames.includes(f),
    );

    return {
      propertyFields: validPropertyFields,
      listingFields: validListingFields,
    };
  } catch (error) {
    console.error("Error parsing function arguments:", error);
    return { propertyFields: [], listingFields: [] };
  }
}

/**
 * Main server action to analyze description examples
 * Analyzes examples without metadata and saves extracted fields
 */
export async function analyzeDescriptionExamples(exampleIds?: bigint[]): Promise<{
  success: boolean;
  results: AnalysisResult[];
  totalAnalyzed: number;
  totalFieldsFound: number;
  error?: string;
}> {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) {
      return {
        success: false,
        results: [],
        totalAnalyzed: 0,
        totalFieldsFound: 0,
        error: "No se encontró la cuenta",
      };
    }

    // Fetch examples to analyze
    let examples;
    if (exampleIds && exampleIds.length > 0) {
      // Analyze specific examples by ID
      examples = await db
        .select()
        .from(propertyDescriptionExamples)
        .where(
          and(
            eq(propertyDescriptionExamples.accountId, BigInt(accountId)),
            or(
              ...exampleIds.map((id) =>
                eq(propertyDescriptionExamples.id, id),
              ),
            ),
          ),
        );
    } else {
      // Analyze examples without metadata
      examples = await db
        .select()
        .from(propertyDescriptionExamples)
        .where(
          and(
            eq(propertyDescriptionExamples.accountId, BigInt(accountId)),
            isNull(propertyDescriptionExamples.metadata),
          ),
        );
    }

    if (examples.length === 0) {
      return {
        success: true,
        results: [],
        totalAnalyzed: 0,
        totalFieldsFound: 0,
      };
    }

    const results: AnalysisResult[] = [];
    let totalFieldsFound = 0;

    // Process each example sequentially to avoid rate limits
    for (const example of examples) {
      try {
        const { propertyFields, listingFields } = await analyzeDescriptionText(
          example.exampleText,
        );

        const fieldsFound = propertyFields.length + listingFields.length;
        totalFieldsFound += fieldsFound;

        // Build metadata object
        const metadata: DescriptionAnalysisMetadata = {
          fieldsUsed: [...propertyFields, ...listingFields],
          fieldsByTable: {
            properties: propertyFields,
            listings: listingFields,
          },
          analyzedAt: new Date().toISOString(),
          stats: {
            totalFields: fieldsFound,
            model: "gpt-4o",
          },
        };

        // Update the example with metadata
        await db
          .update(propertyDescriptionExamples)
          .set({
            metadata,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(propertyDescriptionExamples.id, example.id),
              eq(propertyDescriptionExamples.accountId, BigInt(accountId)),
            ),
          );

        results.push({
          id: String(example.id),
          success: true,
          fieldsFound,
        });
      } catch (error) {
        console.error(`Error analyzing example ${example.id}:`, error);
        results.push({
          id: String(example.id),
          success: false,
          fieldsFound: 0,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    return {
      success: true,
      results,
      totalAnalyzed: examples.length,
      totalFieldsFound,
    };
  } catch (error) {
    console.error("Error in analyzeDescriptionExamples:", error);
    return {
      success: false,
      results: [],
      totalAnalyzed: 0,
      totalFieldsFound: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
