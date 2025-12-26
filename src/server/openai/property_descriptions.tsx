"use server";

import {
  fetchAccountContext,
  formatAccountContextForPrompt,
} from "./account-context";
import {
  getRelevantFields,
  getPropertyTypeDisplayName,
  type PropertyType,
} from "~/types/property-types";
import { getSquareMeter, getBuiltSurfaceArea } from "~/lib/properties/area-utils";
import { generateText } from "~/server/ai/text-client";
import { db } from "~/server/db";
import { propertyDescriptionExamples } from "~/server/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";

/**
 * Metadata structure from analyzed examples
 */
interface ExampleMetadata {
  fieldsUsed?: string[];
  fieldsByTable?: {
    properties: string[];
    listings: string[];
  };
}

/**
 * Result from fetching description examples
 */
interface DescriptionExamplesResult {
  examples: string[];
  importantFields: string[];
}

/**
 * Fetch property description examples from the database
 * Returns examples filtered by property type and listing type,
 * plus a list of important fields extracted from the examples' metadata
 */
async function fetchDescriptionExamples(
  accountId: bigint,
  propertyType?: string,
  listingType?: string,
  limit = 3,
): Promise<DescriptionExamplesResult> {
  try {
    const examples = await db
      .select({
        exampleText: propertyDescriptionExamples.exampleText,
        listingType: propertyDescriptionExamples.listingType,
        metadata: propertyDescriptionExamples.metadata,
      })
      .from(propertyDescriptionExamples)
      .where(
        and(
          eq(propertyDescriptionExamples.accountId, accountId),
          eq(propertyDescriptionExamples.isActive, true),
          or(
            eq(propertyDescriptionExamples.propertyType, propertyType ?? "all"),
            eq(propertyDescriptionExamples.propertyType, "all"),
          ),
        ),
      )
      .orderBy(asc(propertyDescriptionExamples.sortOrder))
      .limit(limit * 2); // Fetch more to filter by listing type

    // Filter by listing type in memory (null listingType applies to all)
    const filteredExamples = examples.filter((ex) => {
      if (!ex.listingType) return true; // null applies to both Sale and Rent
      if (!listingType) return true; // No filter requested
      return ex.listingType === listingType;
    });

    const selectedExamples = filteredExamples.slice(0, limit);

    // Extract unique important fields from all examples' metadata
    const importantFieldsSet = new Set<string>();
    for (const ex of selectedExamples) {
      const metadata = ex.metadata as ExampleMetadata | null;
      if (metadata?.fieldsUsed) {
        for (const field of metadata.fieldsUsed) {
          importantFieldsSet.add(field);
        }
      }
    }

    return {
      examples: selectedExamples.map((ex) => ex.exampleText),
      importantFields: Array.from(importantFieldsSet),
    };
  } catch (error) {
    console.error("Error fetching description examples:", error);
    return { examples: [], importantFields: [] };
  }
}

/**
 * Search for neighborhood information using web search
 */
async function searchNeighborhoodInfo(
  neighborhood: string,
  city?: string,
  street?: string,
): Promise<string | null> {
  try {
    const searchQuery =
      `${street ? `${street} ` : ""}${neighborhood} ${city ?? ""} neighborhood amenities restaurants parks attractions`.trim();

    const systemPrompt =
      "You are a helpful assistant that searches for information about neighborhoods and specific areas. Provide positive information about local amenities, attractions, restaurants, parks, schools, and lifestyle benefits. Only mention positive aspects that would appeal to potential residents.";

    const userPrompt = `Search for information about the area "${searchQuery}". Find positive details about:
          - Restaurants and dining options
          - Shopping areas and markets
          - Parks and green spaces
          - Schools and educational facilities
          - Public transport connections
          - Cultural attractions
          - Lifestyle benefits
          ${street ? `- Specific advantages of the ${street} area` : ""}

          Provide a brief summary of the most appealing aspects of this location for potential residents.`;

    return await generateText(systemPrompt, userPrompt);
  } catch (error) {
    console.error("Error searching neighborhood info:", error);
    return null;
  }
}

// Define the listing interface for type safety - includes ALL fields used in property-characteristics-form.tsx
interface PropertyListing {
  // Basic listing identification
  listingId?: number | string;
  propertyId?: number | string;
  agentId?: string;

  // Basic property info
  propertyType?: string;
  propertySubtype?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  referenceNumber?: string;

  // Pricing and listing details
  price?: number | string;
  listingType?: string;
  isBankOwned?: boolean;
  isFurnished?: boolean;

  // Property measurements
  squareMeter?: number;
  bedrooms?: number;
  bathrooms?: number;
  buildingFloors?: number;
  yearBuilt?: number;
  conservationStatus?: number;

  // Location information
  street?: string;
  addressDetails?: string;
  city?: string;
  province?: string;
  municipality?: string;
  neighborhood?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;

  // Property condition and features
  brandNew?: boolean;
  newConstruction?: boolean;
  needsRenovation?: boolean;
  lastRenovationYear?: string;
  exterior?: boolean;
  bright?: boolean;

  // Outdoor spaces
  terrace?: boolean;
  terraceSize?: number;
  balconyCount?: number;
  galleryCount?: number;
  garden?: boolean;

  // Views and orientation
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;
  orientation?: string;

  // Water and leisure features
  pool?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  jacuzzi?: boolean;
  hydromassage?: boolean;
  wineCellar?: boolean;
  wineCellarSize?: number;

  // Systems and utilities
  hasHeating?: boolean;
  heatingType?: string;
  hotWaterType?: string;
  airConditioningType?: string;

  // Garage and storage
  hasGarage?: boolean;
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  garageNumber?: string;
  optionalGaragePrice?: number;
  hasStorageRoom?: boolean;
  storageRoomSize?: number;
  storageRoomNumber?: string;
  optionalStorageRoomPrice?: number;

  // Kitchen and interior features
  kitchenType?: string;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  furnishedKitchen?: boolean;
  pantry?: boolean;
  builtInWardrobes?: string;
  livingRoomSize?: number;
  laundryRoom?: boolean;
  fireplace?: boolean;

  // Building amenities and security
  hasElevator?: boolean;
  disabledAccessible?: boolean;
  vpo?: boolean;
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Technology and luxury features
  homeAutomation?: boolean;
  musicSystem?: boolean;

  // Materials and finishes
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  windowType?: string;
  doubleGlazing?: boolean;

  // Sports and recreational areas
  gym?: boolean;
  sportsArea?: boolean;
  tennisCourt?: boolean;
  childrenArea?: boolean;

  // Rental-specific features
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;
  nearbyPublicTransport?: boolean;
  suiteBathroom?: boolean;
  coveredClothesline?: boolean;

  // Appliances (for rentals)
  internet?: boolean;
  oven?: boolean;
  microwave?: boolean;
  washingMachine?: boolean;
  fridge?: boolean;
  tv?: boolean;
  stoneware?: boolean;

  // Miscellaneous
  satelliteDish?: boolean;
  cadastralReference?: string;

  // Agent information
  agent?: {
    id: string;
    name: string;
  };
}

// Configuration interface for AI parameters
interface AIConfig {
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
  reasoningEffort?: string;
  verbosity?: string;
}

export async function generatePropertyDescription(
  listing: PropertyListing,
  _aiConfig: AIConfig = {},
) {
  try {
    if (!listing) {
      throw new Error("Listing data is required");
    }

    // Filter to only relevant fields for this property type
    const relevantListing = getRelevantFields(listing);

    // Fetch description examples from database FIRST - they drive everything else
    let examples: string[] = [];
    let importantFields: string[] = [];
    const accountId: number = await getCurrentUserAccountId();
    if (accountId) {
      const examplesResult = await fetchDescriptionExamples(
        BigInt(accountId),
        relevantListing.propertyType,
        relevantListing.listingType,
      );
      examples = examplesResult.examples;
      importantFields = examplesResult.importantFields;
    }

    const hasExamples = examples.length > 0;

    // Helper to detect if examples mention neighborhood/location details
    const examplesUseNeighborhood = hasExamples && examples.some((ex) => {
      const lowerEx = ex.toLowerCase();
      return lowerEx.includes("barrio") ||
             lowerEx.includes("zona") ||
             lowerEx.includes("ubicación") ||
             lowerEx.includes("ubicado") ||
             lowerEx.includes("situado") ||
             lowerEx.includes("cercano") ||
             lowerEx.includes("próximo") ||
             lowerEx.includes("alrededores") ||
             lowerEx.includes("entorno") ||
             lowerEx.includes("vecindario") ||
             lowerEx.includes("servicios") ||
             lowerEx.includes("transporte") ||
             lowerEx.includes("comercios") ||
             lowerEx.includes("colegios") ||
             lowerEx.includes("parques");
    });

    // Helper to detect if examples mention company/agency branding
    const examplesUseCompanyContext = hasExamples && examples.some((ex) => {
      const lowerEx = ex.toLowerCase();
      return lowerEx.includes("inmobiliaria") ||
             lowerEx.includes("nuestra") ||
             lowerEx.includes("nuestro") ||
             lowerEx.includes("le ofrecemos") ||
             lowerEx.includes("contacte") ||
             lowerEx.includes("llámenos");
    });

    // Only fetch account context if examples use company branding
    let accountContext = null;
    if (!hasExamples || examplesUseCompanyContext) {
      accountContext = await fetchAccountContext();
    }

    // Only search for neighborhood info if examples use location details
    let neighborhoodInfo = null;
    if (examplesUseNeighborhood && (relevantListing.neighborhood || relevantListing.city)) {
      console.log(
        `Searching for neighborhood info: ${relevantListing.street ?? ""} ${relevantListing.neighborhood ?? relevantListing.city}`,
      );
      neighborhoodInfo = await searchNeighborhoodInfo(
        relevantListing.neighborhood ?? relevantListing.city ?? "",
        relevantListing.city,
        relevantListing.street,
      );
    }

    // Create prompt - examples are the PRIMARY driver
    let prompt = "";
    const propertyTypeDisplay = getPropertyTypeDisplayName(
      relevantListing.propertyType as PropertyType,
    );

    if (hasExamples) {
      // EXAMPLE-DRIVEN PROMPT: Focus entirely on replicating the examples
      prompt = `TU ÚNICA TAREA: Escribir una descripción que sea INDISTINGUIBLE de estos ejemplos.

EJEMPLOS DE REFERENCIA (CÓPIALOS EXACTAMENTE EN ESTILO):

${examples.map((ex, i) => `═══ EJEMPLO ${i + 1} ═══\n${ex}`).join("\n\n")}

═══════════════════════════════════════════════════════════════

DATOS DE LA PROPIEDAD A DESCRIBIR:
- Tipo: ${propertyTypeDisplay}
- Precio: ${relevantListing.price}€
- Operación: ${relevantListing.listingType}
${relevantListing.propertyType !== "garaje" ? `- Superficie: ${getSquareMeter(relevantListing) ?? "N/A"}m²` : `- Superficie construida: ${getBuiltSurfaceArea(relevantListing) ?? "N/A"}m²`}
${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `- Habitaciones: ${relevantListing.bedrooms ?? "N/A"}` : ""}
${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `- Baños: ${relevantListing.bathrooms ?? "N/A"}` : ""}

Datos completos:
${JSON.stringify(relevantListing, null, 2)}

${importantFields.length > 0 ? `CAMPOS QUE DEBES MENCIONAR (si la propiedad los tiene): ${importantFields.join(", ")}` : ""}

${neighborhoodInfo ? `INFORMACIÓN DEL BARRIO (úsala SOLO si los ejemplos mencionan ubicación/zona):
${neighborhoodInfo}` : ""}

${accountContext ? `CONTEXTO DE EMPRESA (úsalo SOLO si los ejemplos incluyen branding):
${await formatAccountContextForPrompt(accountContext)}` : ""}

INSTRUCCIONES ABSOLUTAS:

1. REPLICA EL ESTILO EXACTO de los ejemplos:
   - Misma estructura y organización de párrafos
   - Mismo tono y registro lingüístico
   - Mismas expresiones y giros idiomáticos
   - Misma longitud aproximada
   - Misma forma de destacar características

2. ANALIZA los ejemplos para detectar:
   - ¿Usan títulos/encabezados o texto corrido?
   - ¿Mencionan ubicación/barrio o solo la propiedad?
   - ¿Incluyen información de empresa o son neutros?
   - ¿Son técnicos o emocionales?
   - ¿Son breves o detallados?

   → Tu descripción debe coincidir en TODOS estos aspectos.

3. NO AÑADAS elementos que no aparezcan en los ejemplos:
   - Si los ejemplos no mencionan barrio → no menciones barrio
   - Si los ejemplos no tienen título → no pongas título
   - Si los ejemplos son breves → sé breve
   - Si los ejemplos no son emotivos → no seas emotivo

4. USA SOLO datos confirmados de la propiedad. No inventes.

⚠️ PROHIBIDO (rechazo del portal):
- Teléfonos en cualquier formato
- Emails
- Cualquier dato de contacto`;

    } else {
      // NO EXAMPLES: Use standard professional style
      prompt = `Genera una descripción profesional en español para un/a ${propertyTypeDisplay}.

DATOS DE LA PROPIEDAD:
- Precio: ${relevantListing.price}€
- Operación: ${relevantListing.listingType}
- Tipo: ${propertyTypeDisplay}
${relevantListing.propertyType !== "garaje" ? `- Superficie: ${getSquareMeter(relevantListing) ?? "N/A"}m²` : `- Superficie construida: ${getBuiltSurfaceArea(relevantListing) ?? "N/A"}m²`}
${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `- Habitaciones: ${relevantListing.bedrooms ?? "N/A"}` : ""}
${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `- Baños: ${relevantListing.bathrooms ?? "N/A"}` : ""}

Datos completos:
${JSON.stringify(relevantListing, null, 2)}

${accountContext ? `CONTEXTO DE EMPRESA:
${await formatAccountContextForPrompt(accountContext)}` : ""}

REQUISITOS:
- Estilo profesional inmobiliario
- Narrativa fluida sin viñetas ni números
- Solo menciona características confirmadas
- Tono apropiado para el tipo de propiedad
- Formato metros cuadrados: "80m2" (no "ochenta metros cuadrados")

⚠️ PROHIBIDO (rechazo del portal):
- Teléfonos en cualquier formato
- Emails
- Cualquier dato de contacto`;
    }

    // Set default AI configuration values (currently unused)
    // const defaultConfig: Required<AIConfig> = {
    //   temperature: 0.5,
    //   topP: 0.9,
    //   frequencyPenalty: 0.0,
    //   presencePenalty: 0.0,
    //   maxTokens: 500,
    //   reasoningEffort: "medium",
    //   verbosity: "balanced"
    // };

    // Merge user config with defaults (currently unused)
    // const finalConfig = { ...defaultConfig, ...aiConfig };

    // Build system prompt - heavily example-driven when examples exist
    let systemMessage: string;

    if (hasExamples) {
      // EXAMPLE-DRIVEN SYSTEM: You are a style replicator
      systemMessage = `Eres un experto en replicar estilos de escritura. Tu trabajo es analizar ejemplos de descripciones inmobiliarias y producir descripciones IDÉNTICAS en estilo, tono, estructura y vocabulario.

REGLAS ABSOLUTAS:
1. Tu descripción debe ser INDISTINGUIBLE de los ejemplos proporcionados
2. Copia la estructura exacta: si los ejemplos tienen título, pon título; si no, no
3. Copia la longitud aproximada de los ejemplos
4. Usa las mismas expresiones y giros lingüísticos
5. Si los ejemplos no mencionan algo (barrio, empresa, etc.), TÚ TAMPOCO
6. Solo usa datos confirmados de la propiedad

Tu objetivo es que un humano NO pueda distinguir tu descripción de los ejemplos originales.`;
    } else {
      // NO EXAMPLES: Standard professional copywriter
      systemMessage = `Eres un redactor inmobiliario profesional especializado en descripciones en español. Conoces las características y puntos de venta de diferentes tipos de propiedades: residenciales (pisos, casas), comerciales (locales), garajes y terrenos (solares).`;

      // Add property-type specific guidance only when no examples
      const propertyType = relevantListing.propertyType;
      if (propertyType === "garaje") {
        systemMessage +=
          " Para garajes, enfócate en aspectos prácticos: tamaño, accesibilidad, seguridad, ubicación.";
      } else if (propertyType === "solar") {
        systemMessage +=
          " Para solares, destaca el potencial de desarrollo, ubicación, vistas y oportunidades de inversión.";
      } else if (propertyType === "local") {
        systemMessage +=
          " Para locales comerciales, enfócate en potencial de negocio, ubicación, tráfico peatonal y flexibilidad del espacio.";
      } else {
        systemMessage +=
          " Para propiedades residenciales, crea conexión emocional describiendo el estilo de vida y confort.";
      }

      systemMessage +=
        " Solo menciona características confirmadas. Escribe en narrativa fluida sin viñetas ni números.";
    }

    // Generate description using unified AI client
    const description = await generateText(systemMessage, prompt);

    return description ?? "No se pudo generar la descripción";
  } catch (error) {
    console.error("Error generating property description:", error);
    throw new Error("Failed to generate property description");
  }
}

/**
 * Generate a short property description (max 500 characters) based on the full description
 */
export async function generateShortPropertyDescription(
  fullDescription: string,
  _listing?: PropertyListing,
): Promise<string> {
  try {
    if (!fullDescription) {
      throw new Error(
        "Full description is required to generate short description",
      );
    }

    // Fetch account context for consistency
    const accountContext = await fetchAccountContext();

    // Create a focused prompt for short description generation
    let prompt = `Create a concise summary in Spanish (maximum 200 characters) based on this full property description:

FULL DESCRIPTION:
${fullDescription}

Requirements:
- Maximum 200 characters (strictly enforced)
- Capture the most important selling points from the full description
- Maintain the same tone and style as the full description
- Focus on key features that attract buyers/renters
- Keep it engaging and descriptive
- Perfect for property cards, previews, and social media
- No unnecessary words or filler content
- Extract the essence and main highlights from the full description
- Be extremely concise while maintaining impact

Generate a compelling short description that summarizes the essence of this property:`;

    // Add account context if available for consistency
    if (accountContext) {
      prompt += `\n\nCOMPANY CONTEXT:
${await formatAccountContextForPrompt(accountContext)}

Use this context to maintain consistency with the company's style and approach.`;
    }

    // Generate short description using unified AI client
    const systemPrompt = `You are an expert at creating ultra-concise, compelling property summaries. Your specialty is distilling full property descriptions into powerful, concise summaries that capture the essence and main selling points in 200 characters or less. You maintain the original tone and style while focusing on the most attractive features.

Key principles:
- Extract the most compelling aspects from the full description
- Maintain the emotional appeal and persuasive language
- Focus on unique selling points and key benefits
- Keep the same professional tone and style
- Make it perfect for quick scanning and immediate impact
- Ensure it works well for property cards, previews, and social media
- Be extremely selective with words - every character counts
- Prioritize impact over completeness`;

    const shortDescription =
      (await generateText(systemPrompt, prompt)) ??
      "No se pudo generar la descripción corta";

    // Ensure it's within the character limit
    if (shortDescription.length > 200) {
      console.warn(
        `Generated short description is ${shortDescription.length} characters, truncating to 200`,
      );
      return shortDescription.substring(0, 197) + "...";
    }

    return shortDescription;
  } catch (error) {
    console.error("Error generating short property description:", error);
    throw new Error("Failed to generate short property description");
  }
}
