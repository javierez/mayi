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

    // Fetch account context for personalization
    const accountContext = await fetchAccountContext();

    // Fetch description examples from database
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

    // Search for neighborhood information if available
    let neighborhoodInfo = null;
    if (relevantListing.neighborhood || relevantListing.city) {
      console.log(
        `Searching for neighborhood info: ${relevantListing.street ?? ""} ${relevantListing.neighborhood ?? relevantListing.city}`,
      );
      neighborhoodInfo = await searchNeighborhoodInfo(
        relevantListing.neighborhood ?? relevantListing.city ?? "",
        relevantListing.city,
        relevantListing.street,
      );
    }

    // Create a prompt with examples and account context
    let prompt = "";

    // Add examples directly in prompt if available
    const hasExamples = examples.length > 0;
    if (hasExamples) {
      prompt += `EJEMPLOS DE ESTILO A SEGUIR:

${examples.map((ex, i) => `--- EJEMPLO ${i + 1} ---\n${ex}`).join("\n\n")}

IMPORTANTE: Estudia cuidadosamente estos ejemplos para replicar su estilo de escritura, tono, estructura y vocabulario. Presta especial atención a:
- Cómo describen las propiedades y sus características
- El lenguaje emocional y técnicas persuasivas que utilizan
- El flujo narrativo y patrones de estructura
- El vocabulario y frases específicas que emplean
- Cómo destacan los puntos de venta clave
- La manera en que crean conexiones visuales y emocionales

${
        importantFields.length > 0
          ? `CAMPOS IMPORTANTES A DESTACAR:
Los siguientes campos son especialmente importantes en las descripciones de este tipo de propiedad. Si la propiedad tiene datos para estos campos, asegúrate de mencionarlos de forma natural en la descripción:
${importantFields.join(", ")}

`
          : ""
      }`;
    }

    // Add neighborhood information if found
    if (neighborhoodInfo) {
      prompt += `NEIGHBORHOOD INFORMATION:
${neighborhoodInfo}

`;
    }

    // Add account context if available
    if (accountContext) {
      prompt += `${await formatAccountContextForPrompt(accountContext)}

`;
    }

    // Add the main instruction
    const propertyTypeDisplay = getPropertyTypeDisplayName(
      relevantListing.propertyType as PropertyType,
    );
    prompt += `Generate a professional property description in Spanish for a ${propertyTypeDisplay} with these confirmed characteristics:

${hasExamples ? `CRÍTICO: Antes de escribir, estudia cuidadosamente los ejemplos proporcionados arriba para entender el estilo, tono y estructura deseados. Tu descripción debe coincidir estrechamente con los patrones, vocabulario y enfoque demostrados en esos ejemplos.` : ""}

    Basic Information:
    Price: ${relevantListing.price}€
    Listing Type: ${relevantListing.listingType}
    Property Type: ${propertyTypeDisplay}

    Property Specifications:
    ${relevantListing.propertyType !== "garaje" ? `Size: ${getSquareMeter(relevantListing) ?? "N/A"}m²` : `Built Area: ${getBuiltSurfaceArea(relevantListing) ?? "N/A"}m²`}
    ${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `Bedrooms: ${relevantListing.bedrooms ?? "N/A"}` : ""}
    ${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? `Bathrooms: ${relevantListing.bathrooms ?? "N/A"}` : ""}

    Complete Property Data (filtered for relevance):
    ${JSON.stringify(relevantListing, null, 2)}

    Write a flowing narrative that includes:
    - A compelling headline with property type and location
    - An introduction highlighting main selling points
    ${relevantListing.propertyType !== "solar" ? "- Property condition and recent improvements (if any)" : ""}
    ${relevantListing.propertyType !== "garaje" && relevantListing.propertyType !== "solar" ? "- Layout and space distribution" : ""}
    ${relevantListing.propertyType === "garaje" ? "- Garage specifications and access details" : ""}
    ${relevantListing.propertyType === "solar" ? "- Land characteristics and development potential" : ""}
    - Special features and amenities (if any)
    - Location benefits and connectivity (if any)
    - Neighborhood amenities and lifestyle

    Style Requirements:
    - Professional and engaging tone
    - Emotional connection with potential buyers
    - Descriptive language for visualization
    - Specific neighborhood details
    - Flowing narrative without numbers or bullet points
    - Keep descriptions concise and avoid overly elaborate language
    - Focus on key features without excessive embellishment
    - Format square meters as numeric notation (e.g., "80m2", "120m2") not as written text

    CRITICAL REQUIREMENTS:
    ${
      hasExamples
        ? `- OBLIGATORIO: Estudia los ejemplos proporcionados y replica su estilo de escritura, tono y estructura exactos
    - Coincide con el vocabulario, frases y lenguaje emocional usado en los ejemplos
    - Sigue los mismos patrones de flujo narrativo y estructura de los ejemplos
    - Usa las mismas técnicas persuasivas y enfoques de venta demostrados en los ejemplos
    - Replica la forma en que los ejemplos destacan características y crean conexiones emocionales
    - Tu descripción debe sentirse como si fuera escrita por la misma persona que escribió los ejemplos`
        : "- Usa un estilo de escritura inmobiliaria profesional"
    }
    ${accountContext ? "- Naturally incorporate the company information provided in the company context" : ""}
    - Only mention explicitly confirmed features. Omit any unconfirmed information
    - Create descriptions that feel authentic and match the established writing style

    ⚠️ PROHIBITED CONTENT (PORTAL COMPLIANCE - CRITICAL):
    - NEVER include phone numbers in ANY format (e.g., 666 123 456, +34 666123456, 666-123-456, etc.)
    - NEVER include email addresses (e.g., info@example.com, contacto@inmobiliaria.es, etc.)
    - NEVER include any contact information whatsoever
    - This is a STRICT requirement from property portals like Fotocasa to prevent direct contact outside their platform
    - Violation of this rule will result in listing rejection by the portal

    NEIGHBORHOOD INTEGRATION:
    ${
      neighborhoodInfo
        ? `- Use the neighborhood information provided above to enhance the property description
    - Naturally incorporate local amenities, attractions, and lifestyle benefits into your description
    - Highlight what makes this location special and desirable for potential buyers/renters
    - Make the neighborhood sound attractive and appealing`
        : "- Focus on the property's features and benefits since no neighborhood information is available"
    }`;

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

    // Build system prompt
    let systemMessage = `You are a professional real estate copywriter who specializes in creating engaging property descriptions in Spanish. You understand the unique characteristics and selling points of different property types including residential properties (pisos, casas), commercial spaces (locales), garages, and land (solares).`;

    if (accountContext && hasExamples) {
      systemMessage +=
        " You have been provided with property description examples and specific company information to personalize the descriptions. You MUST carefully study the examples to understand and replicate the exact writing style, tone, vocabulary, and structure. Your primary goal is to match the patterns demonstrated in the examples - study how they describe properties, create emotional connections, use specific language, and structure their narrative flow. Then use the company context to make descriptions feel authentic to that specific real estate agency.";
    } else if (hasExamples) {
      systemMessage +=
        " You have been provided with property description examples. You MUST carefully study these examples to understand and replicate the exact writing style, tone, vocabulary, and structure. Your primary goal is to match the patterns demonstrated in the examples - study how they describe properties, create emotional connections, use specific language, and structure their narrative flow. Your description should feel like it was written by the same person who wrote the examples.";
    } else if (accountContext) {
      systemMessage +=
        " You have been provided with specific company information to personalize the descriptions. Use this context to make descriptions feel authentic to that specific real estate agency - naturally incorporating their brand identity and contact information when appropriate.";
    }

    // Add property-type specific guidance
    const propertyType = relevantListing.propertyType;
    if (propertyType === "garaje") {
      systemMessage +=
        " For garage properties, focus on practical aspects like size, accessibility, security features, building amenities, and location convenience. Emphasize the value and utility for vehicle storage and the peace of mind it provides.";
    } else if (propertyType === "solar") {
      systemMessage +=
        " For land/solar properties, emphasize development potential, location advantages, views, accessibility, and investment opportunities. Focus on the possibilities and vision for future development while highlighting current land characteristics.";
    } else if (propertyType === "local") {
      systemMessage +=
        " For commercial properties, focus on business potential, location advantages, foot traffic, accessibility, layout flexibility, and features that would attract businesses or investors.";
    } else {
      systemMessage +=
        " For residential properties, create emotional connections by describing lifestyle benefits, comfort features, and how the space would feel as a home.";
    }

    systemMessage +=
      " You are extremely careful to only mention features and characteristics that are explicitly confirmed in the filtered property data provided. Write in a flowing narrative style without using numbers, bullet points, or section breaks. When neighborhood information is provided, use it to enhance the description by highlighting local amenities, attractions, and lifestyle benefits that would appeal to potential buyers or renters.";

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
