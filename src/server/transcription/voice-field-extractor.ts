"use server";

import OpenAI from "openai";
import type {
  ExtractedFieldResult,
  CompleteExtractedData,
  EnhancedExtractedPropertyData,
  EnhancedExtractedListingData,
} from "~/types/textract-enhanced";
import { ALL_FIELD_MAPPINGS } from "~/server/ocr/field-mapping-config";
import type { TranscriptionResult } from "./transcription-service";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VoiceExtractionInput {
  transcript: string;
  confidence: number;
  language: string;
  referenceNumber?: string;
}

/**
 * Enhanced voice field extraction using GPT-4 for context-aware data extraction
 * Adapts the existing OCR field extraction pattern for voice transcripts
 */
export async function extractPropertyDataFromVoice(
  transcriptionResult: TranscriptionResult,
  referenceNumber?: string,
): Promise<{
  extractedFields: ExtractedFieldResult[];
  propertyData: EnhancedExtractedPropertyData;
  listingData: EnhancedExtractedListingData;
  completeData: CompleteExtractedData;
}> {
  console.log(
    `🧠 [VOICE-EXTRACTION] Starting property data extraction from voice transcript...`,
  );
  console.log(
    `📝 [VOICE-EXTRACTION] Transcript length: ${transcriptionResult.transcript.length} characters`,
  );
  console.log(
    `🎯 [VOICE-EXTRACTION] Confidence: ${transcriptionResult.confidence}%`,
  );

  const voiceInput: VoiceExtractionInput = {
    transcript: transcriptionResult.transcript,
    confidence: transcriptionResult.confidence,
    language: transcriptionResult.language,
    referenceNumber,
  };

  // Step 1: Use GPT-4 for intelligent extraction
  const gptExtractedFields = await extractWithGPT4(voiceInput);

  // Step 2: Separate property and listing data
  const propertyFields = gptExtractedFields.filter(
    (r) => r.dbTable === "properties",
  );
  const listingFields = gptExtractedFields.filter(
    (r) => r.dbTable === "listings",
  );

  // Step 3: Build structured data objects
  const propertyData: EnhancedExtractedPropertyData = {};
  const listingData: EnhancedExtractedListingData = {};

  for (const field of propertyFields) {
    (propertyData as Record<string, unknown>)[field.dbColumn] = field.value;
  }

  for (const field of listingFields) {
    (listingData as Record<string, unknown>)[field.dbColumn] = field.value;
  }

  const completeData: CompleteExtractedData = {
    property: propertyData,
    listing: listingData,
    contact: {},
  };

  console.log(`✅ [VOICE-EXTRACTION] Extraction completed:`);
  console.log(`   - Total fields extracted: ${gptExtractedFields.length}`);
  console.log(`   - Property fields: ${propertyFields.length}`);
  console.log(`   - Listing fields: ${listingFields.length}`);
  console.log(
    `   - Average confidence: ${(gptExtractedFields.reduce((sum, r) => sum + r.confidence, 0) / gptExtractedFields.length).toFixed(1)}%`,
  );

  return {
    extractedFields: gptExtractedFields,
    propertyData,
    listingData,
    completeData,
  };
}

/**
 * Use GPT-4 with multiple specialized function calls for intelligent, structured property data extraction
 */
async function extractWithGPT4(
  voiceInput: VoiceExtractionInput,
): Promise<ExtractedFieldResult[]> {
  console.log(
    `🤖 [GPT4-FUNCTION-CALLING] Starting multi-function GPT-4 extraction...`,
  );

  // Define multiple extraction functions for different categories
  const extractionFunctions = [
    {
      name: "extract_basic_property_info",
      description:
        "Extract basic property information like type, size, rooms, and location",
      parameters: {
        type: "object",
        properties: {
          property_type: {
            type: "string",
            description:
              "Type of property (piso, casa, chalet, apartamento, local, garaje, estudio, loft, dúplex, ático)",
          },
          property_subtype: {
            type: "string",
            description:
              "Property subtype (Piso, Apartamento, Casa, Chalet, etc.)",
          },
          description: { type: "string", description: "Property description" },
          bedrooms: {
            type: "integer",
            minimum: 0,
            maximum: 10,
            description: "Number of bedrooms/habitaciones",
          },
          bathrooms: {
            type: "number",
            minimum: 0,
            maximum: 10,
            description: "Number of bathrooms/baños (can be decimal like 1.5)",
          },
          square_meter: {
            type: "number",
            minimum: 1,
            maximum: 10000,
            description: "Total square meters/metros cuadrados",
          },
          built_surface_area: {
            type: "number",
            minimum: 1,
            maximum: 10000,
            description: "Built surface area/superficie construida",
          },
          year_built: {
            type: "integer",
            minimum: 1800,
            maximum: 2030,
            description: "Year the property was built",
          },
          street: {
            type: "string",
            description: "Street address/calle where the property is located",
          },
          address_details: {
            type: "string",
            description: "Additional address details",
          },
          postal_code: {
            type: "string",
            pattern: "^\\d{5}$",
            description: "5-digit postal code",
          },
          city: { type: "string", description: "City/ciudad name" },
          province: { type: "string", description: "Province/provincia name" },
          cadastral_reference: {
            type: "string",
            description: "Cadastral reference number",
          },
          orientation: {
            type: "string",
            enum: [
              "norte",
              "sur",
              "este",
              "oeste",
              "noreste",
              "noroeste",
              "sureste",
              "suroeste",
            ],
            description: "Property orientation",
          },
          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_listing_details",
      description:
        "Extract listing information like price, operation type, and availability",
      parameters: {
        type: "object",
        properties: {
          listing_type: {
            type: "string",
            enum: ["Sale", "Rent", "RentWithOption", "Transfer", "RoomSharing"],
            description:
              "Type of listing operation (Sale=venta, Rent=alquiler, RentWithOption=alquiler con opción a compra, Transfer=traspaso, RoomSharing=compartir habitación)",
          },
          price: {
            type: "number",
            minimum: 0,
            description: "Price in euros (remove currency symbols)",
          },
          is_furnished: {
            type: "boolean",
            description: "Whether the property comes furnished/amueblado",
          },
          furniture_quality: {
            type: "string",
            enum: ["basic", "standard", "high", "luxury"],
            description:
              "Furniture quality (basic=básico, standard=estándar, high=alta, luxury=lujo)",
          },
          optional_garage: {
            type: "boolean",
            description: "Whether garage is optional/garaje opcional",
          },
          optional_garage_price: {
            type: "number",
            minimum: 0,
            description: "Optional garage price in euros",
          },
          optional_storage_room: {
            type: "boolean",
            description: "Whether storage room is optional/trastero opcional",
          },
          optional_storage_room_price: {
            type: "number",
            minimum: 0,
            description: "Optional storage room price in euros",
          },
          has_keys: {
            type: "boolean",
            description: "Whether keys are available/con llaves",
          },
          pets_allowed: {
            type: "boolean",
            description: "Whether pets are allowed/mascotas permitidas",
          },
          student_friendly: {
            type: "boolean",
            description: "Whether suitable for students/para estudiantes",
          },
          internet: {
            type: "boolean",
            description: "Whether internet/WiFi is included",
          },
          is_bank_owned: {
            type: "boolean",
            description: "Whether property is bank owned/banco",
          },
          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_property_amenities",
      description:
        "Extract basic property amenities like elevator, garage, pools, garden, etc.",
      parameters: {
        type: "object",
        properties: {
          // Basic Amenities
          has_elevator: {
            type: "boolean",
            description:
              "Whether the property has elevator/ascensor - ONLY include if explicitly mentioned",
          },
          has_garage: {
            type: "boolean",
            description:
              "Whether the property has garage/parking - ONLY include if explicitly mentioned",
          },
          has_storage_room: {
            type: "boolean",
            description:
              "Whether the property has storage room/trastero - ONLY include if explicitly mentioned",
          },
          terrace: {
            type: "boolean",
            description:
              "Whether the property has terrace/terraza - ONLY include if explicitly mentioned",
          },
          garden: {
            type: "boolean",
            description:
              "Whether the property has garden/jardín - ONLY include if explicitly mentioned",
          },

          // Pool Types
          community_pool: {
            type: "boolean",
            description:
              "Whether the property has community pool/piscina comunitaria - ONLY include if explicitly mentioned",
          },
          private_pool: {
            type: "boolean",
            description:
              "Whether the property has private pool/piscina privada - ONLY include if explicitly mentioned",
          },
          pool: {
            type: "boolean",
            description:
              "Whether the property has any pool/piscina - ONLY include if explicitly mentioned",
          },

          // Garage Details
          garage_type: {
            type: "string",
            description: "Type of garage (individual, comunitario, etc.)",
          },
          garage_spaces: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "Number of garage spaces",
          },
          garage_in_building: {
            type: "boolean",
            description: "Whether garage is in the building",
          },
          elevator_to_garage: {
            type: "boolean",
            description: "Whether there's elevator to garage",
          },

          // Community Amenities
          gym: {
            type: "boolean",
            description:
              "Whether the property has gym/gimnasio - ONLY include if explicitly mentioned",
          },
          sports_area: {
            type: "boolean",
            description:
              "Whether the property has sports area/zona deportiva - ONLY include if explicitly mentioned",
          },
          children_area: {
            type: "boolean",
            description:
              "Whether the property has children area/zona infantil - ONLY include if explicitly mentioned",
          },
          tennis_court: {
            type: "boolean",
            description:
              "Whether the property has tennis court/pista de tenis - ONLY include if explicitly mentioned",
          },
          nearby_public_transport: {
            type: "boolean",
            description:
              "Whether near public transport/cerca transporte público - ONLY include if explicitly mentioned",
          },

          // Property Characteristics
          disabled_accessible: {
            type: "boolean",
            description:
              "Whether accessible for disabled/accesible discapacitados - ONLY include if explicitly mentioned",
          },
          vpo: {
            type: "boolean",
            description:
              "Whether VPO property - ONLY include if explicitly mentioned",
          },
          video_intercom: {
            type: "boolean",
            description:
              "Whether has video intercom/videoportero - ONLY include if explicitly mentioned",
          },
          concierge_service: {
            type: "boolean",
            description:
              "Whether has concierge service/portero - ONLY include if explicitly mentioned",
          },
          security_guard: {
            type: "boolean",
            description:
              "Whether has security guard/vigilancia - ONLY include if explicitly mentioned",
          },
          alarm: {
            type: "boolean",
            description:
              "Whether has alarm/alarma - ONLY include if explicitly mentioned",
          },
          security_door: {
            type: "boolean",
            description:
              "Whether has security door/puerta blindada - ONLY include if explicitly mentioned",
          },
          double_glazing: {
            type: "boolean",
            description:
              "Whether has double glazing/doble acristalamiento - ONLY include if explicitly mentioned",
          },

          // Views & Location
          exterior: {
            type: "boolean",
            description:
              "Whether exterior property/exterior - ONLY include if explicitly mentioned",
          },
          bright: {
            type: "boolean",
            description:
              "Whether bright property/luminoso - ONLY include if explicitly mentioned",
          },
          views: {
            type: "boolean",
            description:
              "Whether has views/vistas - ONLY include if explicitly mentioned",
          },
          mountain_views: {
            type: "boolean",
            description:
              "Whether has mountain views/vistas montaña - ONLY include if explicitly mentioned",
          },
          sea_views: {
            type: "boolean",
            description:
              "Whether has sea views/vistas mar - ONLY include if explicitly mentioned",
          },
          beachfront: {
            type: "boolean",
            description:
              "Whether beachfront/frente playa - ONLY include if explicitly mentioned",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_energy_heating",
      description: "Extract energy and heating information",
      parameters: {
        type: "object",
        properties: {
          has_heating: {
            type: "boolean",
            description:
              "Whether the property has heating/calefacción - ONLY include if explicitly mentioned",
          },
          heating_type: {
            type: "string",
            enum: ["individual", "centralizado", "gas", "eléctrico", "no"],
            description: "Type of heating/calefacción",
          },
          air_conditioning_type: {
            type: "string",
            enum: ["individual", "centralizado", "no"],
            description: "Type of air conditioning/aire acondicionado",
          },
          energy_consumption_scale: {
            type: "string",
            enum: ["A", "B", "C", "D", "E", "F", "G"],
            description: "Energy efficiency rating/certificado energético",
          },
          energy_consumption_value: {
            type: "number",
            minimum: 0,
            description: "Energy consumption value (kWh/m² año)",
          },
          emissions_scale: {
            type: "string",
            enum: ["A", "B", "C", "D", "E", "F", "G"],
            description: "Emissions scale",
          },
          emissions_value: {
            type: "number",
            minimum: 0,
            description: "Emissions value (kg CO2/m² año)",
          },
          conservation_status: {
            type: "integer",
            enum: [1, 2, 3, 4, 6],
            description:
              "Property conservation status (1=excelente, 2=bueno, 3=regular, 4=malo, 6=obra nueva)",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_property_condition",
      description: "Extract property condition and renovation information",
      parameters: {
        type: "object",
        properties: {
          brand_new: {
            type: "boolean",
            description:
              "Whether brand new/nuevo - ONLY include if explicitly mentioned",
          },
          new_construction: {
            type: "boolean",
            description:
              "Whether new construction/nueva construcción - ONLY include if explicitly mentioned",
          },
          under_construction: {
            type: "boolean",
            description:
              "Whether under construction/en construcción - ONLY include if explicitly mentioned",
          },
          needs_renovation: {
            type: "boolean",
            description:
              "Whether needs renovation/necesita reforma - ONLY include if explicitly mentioned",
          },
          last_renovation_year: {
            type: "integer",
            minimum: 1800,
            maximum: 2030,
            description: "Last renovation year/año última reforma",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_kitchen_features",
      description: "Extract kitchen-related features and amenities",
      parameters: {
        type: "object",
        properties: {
          kitchen_type: {
            type: "string",
            enum: [
              "gas",
              "induccion",
              "vitroceramica",
              "carbon",
              "electrico",
              "mixto",
            ],
            description: "Kitchen type/tipo cocina",
          },
          hot_water_type: {
            type: "string",
            description: "Hot water type/tipo agua caliente",
          },
          open_kitchen: {
            type: "boolean",
            description:
              "Whether open kitchen/cocina americana - ONLY include if explicitly mentioned",
          },
          french_kitchen: {
            type: "boolean",
            description:
              "Whether French kitchen/cocina francesa - ONLY include if explicitly mentioned",
          },
          furnished_kitchen: {
            type: "boolean",
            description:
              "Whether furnished kitchen/cocina amueblada - ONLY include if explicitly mentioned",
          },
          pantry: {
            type: "boolean",
            description:
              "Whether has pantry/despensa - ONLY include if explicitly mentioned",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_interior_spaces",
      description: "Extract interior spaces, storage, and room information",
      parameters: {
        type: "object",
        properties: {
          // Storage & Spaces
          storage_room_size: {
            type: "integer",
            minimum: 1,
            description: "Storage room size in m²",
          },
          terrace_size: {
            type: "integer",
            minimum: 1,
            description: "Terrace size in m²",
          },
          wine_cellar: {
            type: "boolean",
            description:
              "Whether has wine cellar/bodega - ONLY include if explicitly mentioned",
          },
          wine_cellar_size: {
            type: "integer",
            minimum: 1,
            description: "Wine cellar size in m²",
          },
          living_room_size: {
            type: "integer",
            minimum: 1,
            description: "Living room size in m²",
          },
          balcony_count: {
            type: "integer",
            minimum: 0,
            maximum: 10,
            description: "Number of balconies/balcones",
          },
          gallery_count: {
            type: "integer",
            minimum: 0,
            maximum: 10,
            description: "Number of galleries/galerías",
          },
          building_floors: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            description: "Number of building floors/plantas edificio",
          },

          // Interior Features
          built_in_wardrobes: {
            type: "boolean",
            description:
              "Whether has built-in wardrobes/armarios empotrados - ONLY include if explicitly mentioned",
          },
          main_floor_type: {
            type: "string",
            description:
              "Main floor type/tipo suelo principal (parquet, cerámica, mármol, etc.)",
          },
          shutter_type: {
            type: "string",
            description: "Shutter type/tipo persiana",
          },
          carpentry_type: {
            type: "string",
            description: "Carpentry type/tipo carpintería",
          },
          window_type: {
            type: "string",
            description: "Window type/tipo ventana",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_luxury_amenities",
      description: "Extract luxury amenities and special features",
      parameters: {
        type: "object",
        properties: {
          jacuzzi: {
            type: "boolean",
            description:
              "Whether has jacuzzi - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          hydromassage: {
            type: "boolean",
            description:
              "Whether has hydromassage/hidromasaje - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          home_automation: {
            type: "boolean",
            description:
              "Whether has home automation/domótica - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          music_system: {
            type: "boolean",
            description:
              "Whether has music system/sistema música - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          laundry_room: {
            type: "boolean",
            description:
              "Whether has laundry room/lavadero - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          covered_clothesline: {
            type: "boolean",
            description:
              "Whether has covered clothesline/tendedero cubierto - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          fireplace: {
            type: "boolean",
            description:
              "Whether has fireplace/chimenea - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },

          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
    {
      name: "extract_appliances",
      description:
        "Extract information about appliances and additional amenities",
      parameters: {
        type: "object",
        properties: {
          oven: {
            type: "boolean",
            description:
              "Whether the property has oven/horno - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          microwave: {
            type: "boolean",
            description:
              "Whether the property has microwave/microondas - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          washing_machine: {
            type: "boolean",
            description:
              "Whether the property has washing machine/lavadora - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          fridge: {
            type: "boolean",
            description:
              "Whether the property has fridge/frigorífico - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          tv: {
            type: "boolean",
            description:
              "Whether the property has TV/televisión - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          dishwasher: {
            type: "boolean",
            description:
              "Whether the property has dishwasher/lavavajillas - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          stoneware: {
            type: "boolean",
            description:
              "Whether dishes/vajilla are included - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          appliances_included: {
            type: "boolean",
            description:
              "Whether appliances/electrodomésticos are included - ONLY include if explicitly mentioned in the text (true if mentioned as present, false if mentioned as absent, omit entirely if not mentioned)",
          },
          original_text: {
            type: "string",
            description:
              "Original text snippet where this information was found",
          },
          confidence: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Confidence level (1-100)",
          },
        },
        required: ["original_text", "confidence"],
      },
    },
  ];

  const systemPrompt = `Eres un experto en extracción de datos inmobiliarios. Tu trabajo es extraer información estructurada de descripciones de propiedades en español usando las funciones especializadas disponibles.

REGLAS CRÍTICAS DE EXTRACCIÓN:
1. Solo extrae información explícitamente mencionada en el texto
2. No inventes ni asumas datos que no estén presentes
3. Convierte valores a los tipos correctos (números, booleanos, texto)
4. Para precios, quita símbolos de moneda y separadores (ej: "€150.000" → 150000)
5. Para habitaciones/baños, extrae solo números (ej: "tres habitaciones" → 3)
6. **CRÍTICO**: Para características booleanas (true/false): 
   - SOLO incluye el campo si está EXPLÍCITAMENTE mencionado en el texto
   - Si se menciona que SÍ tiene algo → incluye el campo con valor true
   - Si se menciona que NO tiene algo → incluye el campo con valor false
   - Si NO se menciona en absoluto → NO incluyas el campo para nada
7. **NO incluyas campos booleanos que no se mencionan en absoluto**
8. Asigna una confianza de 1-100 basada en qué tan explícita es la información
9. Incluye el texto original exacto donde encontraste cada dato

EJEMPLO:
- Si dice "tiene jacuzzi" → incluye jacuzzi: true
- Si dice "no tiene jacuzzi" → incluye jacuzzi: false  
- Si NO menciona jacuzzi → NO incluyas el campo jacuzzi

FUNCIONES DISPONIBLES:
- extract_basic_property_info: información básica (tipo, habitaciones, metros, ubicación)
- extract_listing_details: detalles del anuncio (precio, tipo operación, disponibilidad)
- extract_property_amenities: amenidades básicas (ascensor, garaje, piscina, jardín, etc.)
- extract_energy_heating: energía, calefacción y certificados
- extract_property_condition: estado de la propiedad y renovaciones
- extract_kitchen_features: características de la cocina
- extract_interior_spaces: espacios interiores y almacenamiento
- extract_luxury_amenities: amenidades de lujo
- extract_appliances: electrodomésticos incluidos

TIPOS DE OPERACIÓN VÁLIDOS:
- Sale: para venta
- Rent: para alquiler
- RentWithOption: para alquiler con opción a compra
- Transfer: para traspaso
- RoomSharing: para compartir habitación

Usa las funciones apropiadas para extraer SOLO los datos que estén explícitamente mencionados en la descripción.

IMPORTANTE: Si un campo booleano no se menciona en absoluto en el texto, NO lo incluyas en la respuesta. Solo incluye campos que estén explícitamente mencionados.`;

  const userPrompt = `Extrae toda la información inmobiliaria posible de esta descripción de voz:

"${voiceInput.transcript}"

Extrae únicamente los datos que estén claramente mencionados en el texto.`;

  const allExtractedFields: ExtractedFieldResult[] = [];

  // Execute each function call sequentially
  for (const func of extractionFunctions) {
    try {
      console.log(
        `🔍 [GPT4-FUNCTION-CALLING] Executing function: ${func.name}`,
      );

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
        tools: [
          {
            type: "function",
            function: func,
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: func.name },
        },
      });

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        console.warn(
          `⚠️ [GPT4-FUNCTION-CALLING] No function call returned for ${func.name}`,
        );
        continue;
      }

      const functionCall = message.tool_calls[0];
      if (!functionCall?.function) {
        console.warn(
          `⚠️ [GPT4-FUNCTION-CALLING] Invalid function call structure for ${func.name}`,
        );
        continue;
      }

      if (functionCall.function.name !== func.name) {
        console.warn(
          `⚠️ [GPT4-FUNCTION-CALLING] Unexpected function call: ${functionCall.function.name}`,
        );
        continue;
      }

      // Parse the function arguments
      let functionArgs: Record<string, unknown>;
      try {
        functionArgs = JSON.parse(functionCall.function.arguments) as Record<
          string,
          unknown
        >;
      } catch (error) {
        console.error(
          `❌ [GPT4-FUNCTION-CALLING] Failed to parse function arguments for ${func.name}:`,
          error,
        );
        continue;
      }

      console.log(
        `✅ [GPT4-FUNCTION-CALLING] ${func.name} executed successfully`,
      );

      // Process the extracted fields from this function
      const functionFields = processFunctionResults(
        func.name,
        functionArgs,
        voiceInput,
      );
      allExtractedFields.push(...functionFields);
    } catch (error) {
      console.error(
        `❌ [GPT4-FUNCTION-CALLING] Error executing ${func.name}:`,
        error,
      );
      continue;
    }
  }

  console.log(
    `🤖 [GPT4-FUNCTION-CALLING] Multi-function extraction completed: ${allExtractedFields.length} total fields extracted`,
  );
  return allExtractedFields;
}

/**
 * Process results from individual function calls and convert to ExtractedFieldResult format
 */
function processFunctionResults(
  functionName: string,
  functionArgs: Record<string, unknown>,
  voiceInput: VoiceExtractionInput,
): ExtractedFieldResult[] {
  const extractedFields: ExtractedFieldResult[] = [];

  // Define field mappings for each function
  const fieldMappings: Record<
    string,
    Record<string, { dbColumn: string; dbTable: string }>
  > = {
    extract_basic_property_info: {
      property_type: { dbColumn: "propertyType", dbTable: "properties" },
      property_subtype: { dbColumn: "propertySubtype", dbTable: "properties" },
      description: { dbColumn: "description", dbTable: "properties" },
      bedrooms: { dbColumn: "bedrooms", dbTable: "properties" },
      bathrooms: { dbColumn: "bathrooms", dbTable: "properties" },
      square_meter: { dbColumn: "squareMeter", dbTable: "properties" },
      built_surface_area: {
        dbColumn: "builtSurfaceArea",
        dbTable: "properties",
      },
      year_built: { dbColumn: "yearBuilt", dbTable: "properties" },
      street: { dbColumn: "street", dbTable: "properties" },
      address_details: { dbColumn: "addressDetails", dbTable: "properties" },
      postal_code: { dbColumn: "postalCode", dbTable: "properties" },
      cadastral_reference: {
        dbColumn: "cadastralReference",
        dbTable: "properties",
      },
      // NOTE: city and province are temporary fields that will be processed via findOrCreateLocation
      city: { dbColumn: "extractedCity", dbTable: "properties" },
      province: { dbColumn: "extractedProvince", dbTable: "properties" },
      orientation: { dbColumn: "orientation", dbTable: "properties" },
    },
    extract_listing_details: {
      listing_type: { dbColumn: "listingType", dbTable: "listings" },
      price: { dbColumn: "price", dbTable: "listings" },
      is_furnished: { dbColumn: "isFurnished", dbTable: "listings" },
      furniture_quality: { dbColumn: "furnitureQuality", dbTable: "listings" },
      optional_garage: { dbColumn: "optionalGarage", dbTable: "listings" },
      optional_garage_price: {
        dbColumn: "optionalGaragePrice",
        dbTable: "listings",
      },
      optional_storage_room: {
        dbColumn: "optionalStorageRoom",
        dbTable: "listings",
      },
      optional_storage_room_price: {
        dbColumn: "optionalStorageRoomPrice",
        dbTable: "listings",
      },
      has_keys: { dbColumn: "hasKeys", dbTable: "listings" },
      pets_allowed: { dbColumn: "petsAllowed", dbTable: "listings" },
      student_friendly: { dbColumn: "studentFriendly", dbTable: "listings" },
      internet: { dbColumn: "internet", dbTable: "listings" },
      is_bank_owned: { dbColumn: "isBankOwned", dbTable: "listings" },
    },
    extract_property_amenities: {
      // Basic Amenities
      has_elevator: { dbColumn: "hasElevator", dbTable: "properties" },
      has_garage: { dbColumn: "hasGarage", dbTable: "properties" },
      has_storage_room: { dbColumn: "hasStorageRoom", dbTable: "properties" },
      terrace: { dbColumn: "terrace", dbTable: "properties" },
      garden: { dbColumn: "garden", dbTable: "properties" },

      // Pool Types
      community_pool: { dbColumn: "communityPool", dbTable: "properties" },
      private_pool: { dbColumn: "privatePool", dbTable: "properties" },
      pool: { dbColumn: "pool", dbTable: "properties" },

      // Garage Details
      garage_type: { dbColumn: "garageType", dbTable: "properties" },
      garage_spaces: { dbColumn: "garageSpaces", dbTable: "properties" },
      garage_in_building: {
        dbColumn: "garageInBuilding",
        dbTable: "properties",
      },
      elevator_to_garage: {
        dbColumn: "elevatorToGarage",
        dbTable: "properties",
      },

      // Community Amenities
      gym: { dbColumn: "gym", dbTable: "properties" },
      sports_area: { dbColumn: "sportsArea", dbTable: "properties" },
      children_area: { dbColumn: "childrenArea", dbTable: "properties" },
      tennis_court: { dbColumn: "tennisCourt", dbTable: "properties" },
      nearby_public_transport: {
        dbColumn: "nearbyPublicTransport",
        dbTable: "properties",
      },

      // Property Characteristics
      disabled_accessible: {
        dbColumn: "disabledAccessible",
        dbTable: "properties",
      },
      vpo: { dbColumn: "vpo", dbTable: "properties" },
      video_intercom: { dbColumn: "videoIntercom", dbTable: "properties" },
      concierge_service: {
        dbColumn: "conciergeService",
        dbTable: "properties",
      },
      security_guard: { dbColumn: "securityGuard", dbTable: "properties" },
      alarm: { dbColumn: "alarm", dbTable: "properties" },
      security_door: { dbColumn: "securityDoor", dbTable: "properties" },
      double_glazing: { dbColumn: "doubleGlazing", dbTable: "properties" },

      // Views & Location
      exterior: { dbColumn: "exterior", dbTable: "properties" },
      bright: { dbColumn: "bright", dbTable: "properties" },
      views: { dbColumn: "views", dbTable: "properties" },
      mountain_views: { dbColumn: "mountainViews", dbTable: "properties" },
      sea_views: { dbColumn: "seaViews", dbTable: "properties" },
      beachfront: { dbColumn: "beachfront", dbTable: "properties" },
    },
    extract_energy_heating: {
      has_heating: { dbColumn: "hasHeating", dbTable: "properties" },
      heating_type: { dbColumn: "heatingType", dbTable: "properties" },
      air_conditioning_type: {
        dbColumn: "airConditioningType",
        dbTable: "properties",
      },
      energy_consumption_scale: {
        dbColumn: "energyConsumptionScale",
        dbTable: "properties",
      },
      energy_consumption_value: {
        dbColumn: "energyConsumptionValue",
        dbTable: "properties",
      },
      emissions_scale: { dbColumn: "emissionsScale", dbTable: "properties" },
      emissions_value: { dbColumn: "emissionsValue", dbTable: "properties" },
      conservation_status: {
        dbColumn: "conservationStatus",
        dbTable: "properties",
      },
    },
    extract_property_condition: {
      brand_new: { dbColumn: "brandNew", dbTable: "properties" },
      new_construction: { dbColumn: "newConstruction", dbTable: "properties" },
      under_construction: {
        dbColumn: "underConstruction",
        dbTable: "properties",
      },
      needs_renovation: { dbColumn: "needsRenovation", dbTable: "properties" },
      last_renovation_year: {
        dbColumn: "lastRenovationYear",
        dbTable: "properties",
      },
    },
    extract_kitchen_features: {
      kitchen_type: { dbColumn: "kitchenType", dbTable: "properties" },
      hot_water_type: { dbColumn: "hotWaterType", dbTable: "properties" },
      open_kitchen: { dbColumn: "openKitchen", dbTable: "properties" },
      french_kitchen: { dbColumn: "frenchKitchen", dbTable: "properties" },
      furnished_kitchen: {
        dbColumn: "furnishedKitchen",
        dbTable: "properties",
      },
      pantry: { dbColumn: "pantry", dbTable: "properties" },
    },
    extract_interior_spaces: {
      storage_room_size: { dbColumn: "storageRoomSize", dbTable: "properties" },
      terrace_size: { dbColumn: "terraceSize", dbTable: "properties" },
      wine_cellar: { dbColumn: "wineCellar", dbTable: "properties" },
      wine_cellar_size: { dbColumn: "wineCellarSize", dbTable: "properties" },
      living_room_size: { dbColumn: "livingRoomSize", dbTable: "properties" },
      balcony_count: { dbColumn: "balconyCount", dbTable: "properties" },
      gallery_count: { dbColumn: "galleryCount", dbTable: "properties" },
      building_floors: { dbColumn: "buildingFloors", dbTable: "properties" },
      built_in_wardrobes: {
        dbColumn: "builtInWardrobes",
        dbTable: "properties",
      },
      main_floor_type: { dbColumn: "mainFloorType", dbTable: "properties" },
      shutter_type: { dbColumn: "shutterType", dbTable: "properties" },
      carpentry_type: { dbColumn: "carpentryType", dbTable: "properties" },
      window_type: { dbColumn: "windowType", dbTable: "properties" },
    },
    extract_luxury_amenities: {
      jacuzzi: { dbColumn: "jacuzzi", dbTable: "properties" },
      hydromassage: { dbColumn: "hydromassage", dbTable: "properties" },
      home_automation: { dbColumn: "homeAutomation", dbTable: "properties" },
      music_system: { dbColumn: "musicSystem", dbTable: "properties" },
      laundry_room: { dbColumn: "laundryRoom", dbTable: "properties" },
      covered_clothesline: {
        dbColumn: "coveredClothesline",
        dbTable: "properties",
      },
      fireplace: { dbColumn: "fireplace", dbTable: "properties" },
    },
    extract_appliances: {
      oven: { dbColumn: "oven", dbTable: "listings" },
      microwave: { dbColumn: "microwave", dbTable: "listings" },
      washing_machine: { dbColumn: "washingMachine", dbTable: "listings" },
      fridge: { dbColumn: "fridge", dbTable: "listings" },
      tv: { dbColumn: "tv", dbTable: "listings" },
      dishwasher: { dbColumn: "dishwasher", dbTable: "listings" },
      stoneware: { dbColumn: "stoneware", dbTable: "listings" },
      appliances_included: {
        dbColumn: "appliancesIncluded",
        dbTable: "listings",
      },
    },
  };

  const currentMapping = fieldMappings[functionName];
  if (!currentMapping) {
    console.warn(
      `⚠️ [GPT4-FUNCTION-CALLING] No field mapping found for function: ${functionName}`,
    );
    return [];
  }

  // Process each field from the function result
  for (const [fieldName, fieldValue] of Object.entries(functionArgs)) {
    if (
      fieldName === "original_text" ||
      fieldName === "confidence" ||
      fieldValue == null
    ) {
      continue;
    }

    const mapping = currentMapping[fieldName];
    if (!mapping) {
      console.warn(
        `⚠️ [GPT4-FUNCTION-CALLING] No mapping found for field: ${fieldName}`,
      );
      continue;
    }

    // Find the corresponding field mapping for validation
    const fieldMapping = ALL_FIELD_MAPPINGS.find(
      (fm) =>
        fm.dbColumn === mapping.dbColumn && fm.dbTable === mapping.dbTable,
    );

    if (!fieldMapping) {
      console.warn(
        `⚠️ [GPT4-FUNCTION-CALLING] Unknown field mapping: ${mapping.dbTable}.${mapping.dbColumn}`,
      );
      continue;
    }

    // Ensure fieldValue is a valid type
    if (
      typeof fieldValue !== "string" &&
      typeof fieldValue !== "number" &&
      typeof fieldValue !== "boolean"
    ) {
      console.warn(
        `⚠️ [GPT4-FUNCTION-CALLING] Invalid field value type for ${mapping.dbColumn}: ${typeof fieldValue}`,
      );
      continue;
    }

    // Apply validation if available
    const stringValue = String(fieldValue);
    if (fieldMapping.validation && !fieldMapping.validation(stringValue)) {
      console.warn(
        `⚠️ [GPT4-FUNCTION-CALLING] Validation failed for ${mapping.dbColumn}: ${stringValue}`,
      );
      continue;
    }

    // Convert value using converter function
    let convertedValue: string | number | boolean = fieldValue;
    if (fieldMapping.converter) {
      try {
        const converted = fieldMapping.converter(stringValue);
        convertedValue = converted;
      } catch {
        console.warn(
          `⚠️ [GPT4-FUNCTION-CALLING] Conversion failed for ${mapping.dbColumn}: ${stringValue}`,
        );
        convertedValue = fieldValue;
      }
    }

    // Adjust confidence based on transcript confidence
    const baseConfidence = (functionArgs.confidence as number) ?? 80;
    const adjustedConfidence = Math.min(
      baseConfidence,
      baseConfidence * (voiceInput.confidence / 100),
    );

    extractedFields.push({
      dbColumn: mapping.dbColumn,
      dbTable: mapping.dbTable as "properties" | "listings",
      value: convertedValue,
      originalText: (functionArgs.original_text as string) ?? "",
      confidence: adjustedConfidence,
      extractionSource: "gpt4_function_calling",
      fieldType: fieldMapping.dataType,
      matched_alias: `${functionName}:${fieldName}`,
    });

    console.log(
      `✅ [GPT4-FUNCTION-CALLING] ${functionName}: ${mapping.dbColumn} = ${convertedValue} (${adjustedConfidence.toFixed(1)}% confidence)`,
    );
  }

  return extractedFields;
}
