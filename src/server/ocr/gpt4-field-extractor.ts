"use server";

import OpenAI from "openai";
import type { Block } from "@aws-sdk/client-textract";
import type {
  ExtractedFieldResult,
  CompleteExtractedData,
  EnhancedExtractedPropertyData,
  EnhancedExtractedListingData,
  EnhancedExtractedContactData,
} from "~/types/textract-enhanced";
import { ALL_FIELD_MAPPINGS } from "./field-mapping-config";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OCRInput {
  extractedText: string;
  detectedFields?: Record<string, { text: string; confidence: number }>;
  blocks: Block[];
  confidence: number;
}

/**
 * Enhanced OCR property data extraction using GPT-4 with function calling
 * Replaces the complex manual field validation system with intelligent AI extraction
 */
export async function extractEnhancedPropertyDataWithGPT4(
  ocrInput: OCRInput,
): Promise<{
  extractedFields: ExtractedFieldResult[];
  propertyData: EnhancedExtractedPropertyData;
  listingData: EnhancedExtractedListingData;
  contactData: EnhancedExtractedContactData;
  completeData: CompleteExtractedData;
}> {
  console.log(
    `🚀 [GPT4-OCR] Starting enhanced property data extraction with GPT-4...`,
  );
  console.log(
    `📄 [GPT4-OCR] Input: ${ocrInput.extractedText.length} chars, ${Object.keys(ocrInput.detectedFields ?? {}).length} form fields`,
  );

  // Step 1: Use GPT-4 for intelligent extraction
  const gptExtractedFields = await extractWithGPT4Functions(ocrInput);

  // Step 2: Separate property, listing and contact data
  const propertyFields = gptExtractedFields.filter(
    (r) => r.dbTable === "properties",
  );
  const listingFields = gptExtractedFields.filter(
    (r) => r.dbTable === "listings",
  );
  const contactFields = gptExtractedFields.filter(
    (r) => r.dbTable === "contacts",
  );

  // Step 3: Build structured data objects
  const propertyData: EnhancedExtractedPropertyData = {};
  const listingData: EnhancedExtractedListingData = {};
  const contactData: EnhancedExtractedContactData = {};

  for (const field of propertyFields) {
    (propertyData as Record<string, unknown>)[field.dbColumn] = field.value;
  }

  for (const field of listingFields) {
    (listingData as Record<string, unknown>)[field.dbColumn] = field.value;
  }

  for (const field of contactFields) {
    (contactData as Record<string, unknown>)[field.dbColumn] = field.value;
  }

  const completeData: CompleteExtractedData = {
    property: propertyData,
    listing: listingData,
    contact: contactData,
  };

  console.log(`✅ [GPT4-OCR] Extraction completed:`);
  console.log(`   - Total fields extracted: ${gptExtractedFields.length}`);
  console.log(`   - Property fields: ${propertyFields.length}`);
  console.log(`   - Listing fields: ${listingFields.length}`);
  console.log(`   - Contact fields: ${contactFields.length}`);
  console.log(
    `   - Average confidence: ${(gptExtractedFields.reduce((sum, r) => sum + r.confidence, 0) / gptExtractedFields.length).toFixed(1)}%`,
  );

  return {
    extractedFields: gptExtractedFields,
    propertyData,
    listingData,
    contactData,
    completeData,
  };
}

/**
 * Use GPT-4 with multiple specialized function calls for intelligent OCR data extraction
 */
async function extractWithGPT4Functions(
  ocrInput: OCRInput,
): Promise<ExtractedFieldResult[]> {
  console.log(`🤖 [GPT4-OCR] Starting multi-function GPT-4 extraction...`);

  // Define specialized extraction functions for different categories
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
            description: "Property subtype if specified",
          },
          description: {
            type: "string",
            description: "Property description if available",
          },
          bedrooms: {
            type: "integer",
            minimum: 0,
            maximum: 10,
            description: "Number of bedrooms/habitaciones/dormitorios",
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
            description: "Total square meters/metros cuadrados/m2/m²",
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
            description: "Year the property was built/año construcción",
          },
          street: {
            type: "string",
            description: "Street address/calle/dirección",
          },
          address_details: {
            type: "string",
            description: "Additional address details (floor, door, etc.)",
          },
          postal_code: {
            type: "string",
            pattern: "^\\d{5}$",
            description: "5-digit postal code/código postal",
          },
          city: { type: "string", description: "City/ciudad/localidad" },
          province: { type: "string", description: "Province/provincia" },
          cadastral_reference: {
            type: "string",
            description: "Cadastral reference/referencia catastral",
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
            description: "Property orientation/orientación",
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
              "Type of listing (Sale=venta, Rent=alquiler, RentWithOption=alquiler con opción, Transfer=traspaso, RoomSharing=compartir)",
          },
          price: {
            type: "number",
            minimum: 0,
            description: "Price in euros (remove € and thousand separators)",
          },
          is_furnished: {
            type: "boolean",
            description: "Whether property is furnished/amueblado",
          },
          furniture_quality: {
            type: "string",
            enum: ["basic", "standard", "high", "luxury"],
            description: "Quality of furniture if furnished",
          },
          optional_garage: {
            type: "boolean",
            description: "Whether garage is optional/garaje opcional",
          },
          optional_garage_price: {
            type: "number",
            minimum: 0,
            description: "Optional garage price if specified",
          },
          optional_storage_room: {
            type: "boolean",
            description: "Whether storage is optional/trastero opcional",
          },
          optional_storage_room_price: {
            type: "number",
            minimum: 0,
            description: "Optional storage price if specified",
          },
          has_keys: {
            type: "boolean",
            description: "Whether keys are available/llaves disponibles",
          },
          pets_allowed: {
            type: "boolean",
            description: "Whether pets allowed/mascotas permitidas",
          },
          student_friendly: {
            type: "boolean",
            description: "Whether suitable for students/estudiantes",
          },
          internet: {
            type: "boolean",
            description: "Whether internet/WiFi included",
          },
          is_bank_owned: {
            type: "boolean",
            description: "Whether bank owned/banco/entidad bancaria",
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
        "Extract property amenities like elevator, garage, pools, garden, etc.",
      parameters: {
        type: "object",
        properties: {
          // Basic Amenities
          has_elevator: {
            type: "boolean",
            description: "Has elevator/ascensor - ONLY if explicitly mentioned",
          },
          has_garage: {
            type: "boolean",
            description:
              "Has garage/parking/plaza garaje - ONLY if explicitly mentioned",
          },
          has_storage_room: {
            type: "boolean",
            description: "Has storage/trastero - ONLY if explicitly mentioned",
          },
          terrace: {
            type: "boolean",
            description: "Has terrace/terraza - ONLY if explicitly mentioned",
          },
          garden: {
            type: "boolean",
            description: "Has garden/jardín - ONLY if explicitly mentioned",
          },

          // Pool Types
          community_pool: {
            type: "boolean",
            description:
              "Has community pool/piscina comunitaria - ONLY if explicitly mentioned",
          },
          private_pool: {
            type: "boolean",
            description:
              "Has private pool/piscina privada - ONLY if explicitly mentioned",
          },
          pool: {
            type: "boolean",
            description: "Has any pool/piscina - ONLY if explicitly mentioned",
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
            description: "Number of garage spaces/plazas",
          },
          garage_in_building: {
            type: "boolean",
            description: "Garage in building/mismo edificio",
          },
          elevator_to_garage: {
            type: "boolean",
            description: "Elevator to garage/ascensor a garaje",
          },

          // Community Amenities
          gym: {
            type: "boolean",
            description: "Has gym/gimnasio - ONLY if explicitly mentioned",
          },
          sports_area: {
            type: "boolean",
            description:
              "Has sports area/zona deportiva - ONLY if explicitly mentioned",
          },
          children_area: {
            type: "boolean",
            description:
              "Has children area/zona infantil - ONLY if explicitly mentioned",
          },
          tennis_court: {
            type: "boolean",
            description:
              "Has tennis court/pista tenis - ONLY if explicitly mentioned",
          },
          nearby_public_transport: {
            type: "boolean",
            description:
              "Near transport/cerca transporte - ONLY if explicitly mentioned",
          },

          // Property Characteristics
          disabled_accessible: {
            type: "boolean",
            description:
              "Disabled accessible/accesible - ONLY if explicitly mentioned",
          },
          vpo: {
            type: "boolean",
            description: "VPO property - ONLY if explicitly mentioned",
          },
          video_intercom: {
            type: "boolean",
            description:
              "Video intercom/videoportero - ONLY if explicitly mentioned",
          },
          concierge_service: {
            type: "boolean",
            description: "Concierge/portero - ONLY if explicitly mentioned",
          },
          security_guard: {
            type: "boolean",
            description: "Security/vigilancia - ONLY if explicitly mentioned",
          },
          alarm: {
            type: "boolean",
            description: "Alarm/alarma - ONLY if explicitly mentioned",
          },
          security_door: {
            type: "boolean",
            description:
              "Security door/puerta blindada - ONLY if explicitly mentioned",
          },
          double_glazing: {
            type: "boolean",
            description:
              "Double glazing/doble acristalamiento - ONLY if explicitly mentioned",
          },

          // Views & Location
          exterior: {
            type: "boolean",
            description: "Exterior property - ONLY if explicitly mentioned",
          },
          bright: {
            type: "boolean",
            description: "Bright/luminoso - ONLY if explicitly mentioned",
          },
          views: {
            type: "boolean",
            description: "Has views/vistas - ONLY if explicitly mentioned",
          },
          mountain_views: {
            type: "boolean",
            description:
              "Mountain views/vistas montaña - ONLY if explicitly mentioned",
          },
          sea_views: {
            type: "boolean",
            description: "Sea views/vistas mar - ONLY if explicitly mentioned",
          },
          beachfront: {
            type: "boolean",
            description:
              "Beachfront/frente playa - ONLY if explicitly mentioned",
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
      description: "Extract energy efficiency and heating information",
      parameters: {
        type: "object",
        properties: {
          has_heating: {
            type: "boolean",
            description:
              "Has heating/calefacción - ONLY if explicitly mentioned",
          },
          heating_type: {
            type: "string",
            enum: ["individual", "centralizado", "gas", "eléctrico", "no"],
            description: "Heating type/tipo calefacción",
          },
          air_conditioning_type: {
            type: "string",
            enum: ["individual", "centralizado", "no"],
            description: "AC type/aire acondicionado",
          },
          energy_consumption_scale: {
            type: "string",
            enum: ["A", "B", "C", "D", "E", "F", "G"],
            description: "Energy rating A-G/certificado energético",
          },
          energy_consumption_value: {
            type: "number",
            minimum: 0,
            description: "Energy consumption kWh/m² año",
          },
          emissions_scale: {
            type: "string",
            enum: ["A", "B", "C", "D", "E", "F", "G"],
            description: "Emissions rating A-G",
          },
          emissions_value: {
            type: "number",
            minimum: 0,
            description: "Emissions kg CO2/m² año",
          },
          conservation_status: {
            type: "integer",
            enum: [1, 2, 3, 4, 6],
            description:
              "Conservation (1=excelente, 2=bueno, 3=regular, 4=malo, 6=obra nueva)",
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
      description: "Extract property condition and renovation status",
      parameters: {
        type: "object",
        properties: {
          brand_new: {
            type: "boolean",
            description: "Brand new/nuevo - ONLY if explicitly mentioned",
          },
          new_construction: {
            type: "boolean",
            description:
              "New construction/obra nueva - ONLY if explicitly mentioned",
          },
          under_construction: {
            type: "boolean",
            description:
              "Under construction/en construcción - ONLY if explicitly mentioned",
          },
          needs_renovation: {
            type: "boolean",
            description:
              "Needs renovation/necesita reforma - ONLY if explicitly mentioned",
          },
          last_renovation_year: {
            type: "integer",
            minimum: 1800,
            maximum: 2030,
            description: "Last renovation year/año reforma",
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
      description: "Extract kitchen features and appliances",
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
            description: "Hot water type/agua caliente",
          },
          open_kitchen: {
            type: "boolean",
            description:
              "Open kitchen/cocina americana - ONLY if explicitly mentioned",
          },
          french_kitchen: {
            type: "boolean",
            description:
              "French kitchen/cocina francesa - ONLY if explicitly mentioned",
          },
          furnished_kitchen: {
            type: "boolean",
            description:
              "Furnished kitchen/cocina amueblada - ONLY if explicitly mentioned",
          },
          pantry: {
            type: "boolean",
            description: "Pantry/despensa - ONLY if explicitly mentioned",
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
      description: "Extract interior spaces and storage details",
      parameters: {
        type: "object",
        properties: {
          // Storage & Spaces
          storage_room_size: {
            type: "integer",
            minimum: 1,
            description: "Storage size m²",
          },
          terrace_size: {
            type: "integer",
            minimum: 1,
            description: "Terrace size m²",
          },
          wine_cellar: {
            type: "boolean",
            description: "Wine cellar/bodega - ONLY if explicitly mentioned",
          },
          wine_cellar_size: {
            type: "integer",
            minimum: 1,
            description: "Wine cellar size m²",
          },
          living_room_size: {
            type: "integer",
            minimum: 1,
            description: "Living room size m²",
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
            description: "Building floors/plantas edificio",
          },

          // Interior Features
          built_in_wardrobes: {
            type: "boolean",
            description:
              "Built-in wardrobes/armarios empotrados - ONLY if explicitly mentioned",
          },
          main_floor_type: {
            type: "string",
            description: "Floor type (parquet, cerámica, mármol, etc.)",
          },
          shutter_type: {
            type: "string",
            description: "Shutter type/persianas",
          },
          carpentry_type: {
            type: "string",
            description: "Carpentry type/carpintería",
          },
          window_type: { type: "string", description: "Window type/ventanas" },

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
            description: "Jacuzzi - ONLY if explicitly mentioned",
          },
          hydromassage: {
            type: "boolean",
            description:
              "Hydromassage/hidromasaje - ONLY if explicitly mentioned",
          },
          home_automation: {
            type: "boolean",
            description:
              "Home automation/domótica - ONLY if explicitly mentioned",
          },
          music_system: {
            type: "boolean",
            description:
              "Music system/hilo musical - ONLY if explicitly mentioned",
          },
          laundry_room: {
            type: "boolean",
            description: "Laundry room/lavadero - ONLY if explicitly mentioned",
          },
          covered_clothesline: {
            type: "boolean",
            description:
              "Covered clothesline/tendedero cubierto - ONLY if explicitly mentioned",
          },
          fireplace: {
            type: "boolean",
            description: "Fireplace/chimenea - ONLY if explicitly mentioned",
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
      description: "Extract appliances and equipment included",
      parameters: {
        type: "object",
        properties: {
          oven: {
            type: "boolean",
            description: "Oven/horno - ONLY if explicitly mentioned",
          },
          microwave: {
            type: "boolean",
            description: "Microwave/microondas - ONLY if explicitly mentioned",
          },
          washing_machine: {
            type: "boolean",
            description:
              "Washing machine/lavadora - ONLY if explicitly mentioned",
          },
          fridge: {
            type: "boolean",
            description:
              "Fridge/frigorífico/nevera - ONLY if explicitly mentioned",
          },
          tv: {
            type: "boolean",
            description: "TV/televisión - ONLY if explicitly mentioned",
          },
          dishwasher: {
            type: "boolean",
            description:
              "Dishwasher/lavavajillas - ONLY if explicitly mentioned",
          },
          stoneware: {
            type: "boolean",
            description: "Dishes/vajilla - ONLY if explicitly mentioned",
          },
          appliances_included: {
            type: "boolean",
            description:
              "Appliances included/electrodomésticos - ONLY if explicitly mentioned",
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
      name: "extract_contact_info",
      description: "Extract contact and owner information from the document",
      parameters: {
        type: "object",
        properties: {
          owner_name: { type: "string", description: "Owner/propietario name" },
          owner_phone: { type: "string", description: "Owner phone/teléfono" },
          owner_email: {
            type: "string",
            format: "email",
            description: "Owner email/correo",
          },
          agent_name: { type: "string", description: "Agent/agente name" },
          agent_phone: { type: "string", description: "Agent phone" },
          agent_email: {
            type: "string",
            format: "email",
            description: "Agent email",
          },
          company_name: { type: "string", description: "Company/empresa name" },
          commission_percentage: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Commission percentage/comisión %",
          },
          exclusive_contract: {
            type: "boolean",
            description: "Exclusive contract/exclusiva",
          },
          contract_duration: {
            type: "integer",
            minimum: 1,
            maximum: 60,
            description: "Contract duration months/duración meses",
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

  const systemPrompt = `You are an expert real estate data extraction specialist processing OCR text from Spanish property documents. Extract structured information using the available functions.

CRITICAL EXTRACTION RULES:
1. ONLY extract information explicitly stated in the OCR text
2. NEVER invent, assume, or infer missing data
3. Convert values to correct types (remove currency symbols, convert text numbers)
4. For prices: remove €, dots, and convert commas (e.g., "150.000€" → 150000)
5. For boolean fields: ONLY include if explicitly mentioned
   - If text says "con ascensor" → has_elevator: true
   - If text says "sin ascensor" → has_elevator: false
   - If ascensor is NOT mentioned → DO NOT include the field
6. Assign confidence 80-100 for clear OCR text, 50-79 for unclear/partial
7. Include the exact original text snippet for each extraction
8. Handle Spanish number formats (1.234,56 → 1234.56)

SPANISH TERMINOLOGY MAPPING:
- Venta/Vender → Sale
- Alquiler/Alquilar → Rent
- Alquiler con opción → RentWithOption
- Traspaso → Transfer
- Compartir piso → RoomSharing

PROPERTY TYPES:
- Piso, Apartamento, Casa, Chalet, Local, Garaje, Estudio, Loft, Dúplex, Ático

CONSERVATION STATUS:
1 = Excelente, 2 = Bueno, 3 = Regular, 4 = Malo, 6 = Obra nueva

Only call functions for categories that have relevant data in the OCR text. DO NOT call functions for categories with no information.`;

  const userPrompt = `Extract all real estate information from this OCR text. Include detected form fields if available:

OCR TEXT:
${ocrInput.extractedText}

${
  ocrInput.detectedFields && Object.keys(ocrInput.detectedFields).length > 0
    ? `
DETECTED FORM FIELDS:
${Object.entries(ocrInput.detectedFields)
  .map(
    ([key, value]) => `${key}: ${value.text} (${value.confidence}% confidence)`,
  )
  .join("\n")}
`
    : ""
}

Extract ONLY explicitly mentioned information. Do not infer or assume missing data.`;

  const allExtractedFields: ExtractedFieldResult[] = [];

  // Execute each function call sequentially
  for (const func of extractionFunctions) {
    try {
      console.log(`🔍 [GPT4-OCR] Executing function: ${func.name}`);

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
          `⚠️ [GPT4-OCR] No function call returned for ${func.name}`,
        );
        continue;
      }

      const functionCall = message.tool_calls[0];
      if (!functionCall?.function) {
        console.warn(
          `⚠️ [GPT4-OCR] Invalid function call structure for ${func.name}`,
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
          `❌ [GPT4-OCR] Failed to parse function arguments for ${func.name}:`,
          error,
        );
        continue;
      }

      console.log(`✅ [GPT4-OCR] ${func.name} executed successfully`);

      // Process the extracted fields from this function
      const functionFields = processFunctionResults(
        func.name,
        functionArgs,
        ocrInput,
      );
      allExtractedFields.push(...functionFields);
    } catch (error) {
      console.error(`❌ [GPT4-OCR] Error executing ${func.name}:`, error);
      continue;
    }
  }

  console.log(
    `🤖 [GPT4-OCR] Multi-function extraction completed: ${allExtractedFields.length} total fields extracted`,
  );
  return consolidateResults(allExtractedFields);
}

/**
 * Process results from individual function calls and convert to ExtractedFieldResult format
 */
function processFunctionResults(
  functionName: string,
  functionArgs: Record<string, unknown>,
  ocrInput: OCRInput,
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
      has_elevator: { dbColumn: "hasElevator", dbTable: "properties" },
      has_garage: { dbColumn: "hasGarage", dbTable: "properties" },
      has_storage_room: { dbColumn: "hasStorageRoom", dbTable: "properties" },
      terrace: { dbColumn: "terrace", dbTable: "properties" },
      garden: { dbColumn: "garden", dbTable: "properties" },
      community_pool: { dbColumn: "communityPool", dbTable: "properties" },
      private_pool: { dbColumn: "privatePool", dbTable: "properties" },
      pool: { dbColumn: "pool", dbTable: "properties" },
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
      gym: { dbColumn: "gym", dbTable: "properties" },
      sports_area: { dbColumn: "sportsArea", dbTable: "properties" },
      children_area: { dbColumn: "childrenArea", dbTable: "properties" },
      tennis_court: { dbColumn: "tennisCourt", dbTable: "properties" },
      nearby_public_transport: {
        dbColumn: "nearbyPublicTransport",
        dbTable: "properties",
      },
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
    extract_contact_info: {
      owner_name: { dbColumn: "fullName", dbTable: "contacts" }, // Special handling for name parsing
      owner_phone: { dbColumn: "phone", dbTable: "contacts" },
      owner_email: { dbColumn: "email", dbTable: "contacts" },
      agent_name: { dbColumn: "agentFullName", dbTable: "contacts" }, // Special handling for agent name
      agent_phone: { dbColumn: "agentPhone", dbTable: "contacts" },
      agent_email: { dbColumn: "agentEmail", dbTable: "contacts" },
      commission_percentage: {
        dbColumn: "commissionPercentage",
        dbTable: "listings",
      },
      exclusive_contract: {
        dbColumn: "exclusiveContract",
        dbTable: "listings",
      },
      contract_duration: { dbColumn: "contractDuration", dbTable: "listings" },
    },
  };

  const currentMapping = fieldMappings[functionName];
  if (!currentMapping) {
    console.warn(
      `⚠️ [GPT4-OCR] No field mapping found for function: ${functionName}`,
    );
    return [];
  }

  // Special handling for contact name parsing
  if (functionName === "extract_contact_info") {
    // Handle owner name parsing
    const ownerName = functionArgs.owner_name;
    if (ownerName && typeof ownerName === "string") {
      const fullName = ownerName.trim();
      const nameParts = fullName
        .split(" ")
        .filter((part: string) => part.length > 0);

      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        // Add firstName and lastName as separate fields
        const confidence = functionArgs.confidence;
        const adjustedConfidence = Math.min(
          typeof confidence === "number" ? confidence : 80,
          (typeof confidence === "number" ? confidence : 80) *
            (ocrInput.confidence / 100),
        );

        extractedFields.push({
          dbColumn: "firstName",
          dbTable: "contacts",
          value: firstName!,
          originalText:
            typeof functionArgs.original_text === "string"
              ? functionArgs.original_text
              : "",
          confidence: adjustedConfidence,
          extractionSource: "gpt4_ocr",
          fieldType: "string",
          matched_alias: `${functionName}:owner_name_first`,
        });

        extractedFields.push({
          dbColumn: "lastName",
          dbTable: "contacts",
          value: lastName,
          originalText:
            typeof functionArgs.original_text === "string"
              ? functionArgs.original_text
              : "",
          confidence: adjustedConfidence,
          extractionSource: "gpt4_ocr",
          fieldType: "string",
          matched_alias: `${functionName}:owner_name_last`,
        });

        console.log(
          `✅ [GPT4-OCR] ${functionName}: parsed name "${fullName}" → firstName="${firstName}", lastName="${lastName}" (${adjustedConfidence.toFixed(1)}% confidence)`,
        );
      }
    }

    // Handle agent name parsing
    const agentName = functionArgs.agent_name;
    if (agentName && typeof agentName === "string") {
      const fullName = agentName.trim();
      const nameParts = fullName
        .split(" ")
        .filter((part: string) => part.length > 0);

      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        // Adjusted confidence calculation (currently unused)
        // const confidence = functionArgs.confidence;
        // const adjustedConfidence = Math.min(
        //   typeof confidence === 'number' ? confidence : 80,
        //   (typeof confidence === 'number' ? confidence : 80) * (ocrInput.confidence / 100)
        // );

        // Note: Agent info would need additional handling in database saver
        // For now, we'll create separate agent fields that can be processed later
        console.log(
          `ℹ️ [GPT4-OCR] ${functionName}: found agent "${fullName}" (${firstName} ${lastName}) - agent contact creation not yet implemented`,
        );
      }
    }
  }

  // Process each field from the function result
  for (const [fieldName, fieldValue] of Object.entries(functionArgs)) {
    if (
      fieldName === "original_text" ||
      fieldName === "confidence" ||
      fieldValue === undefined ||
      fieldValue === null
    ) {
      continue;
    }

    // Skip name fields as they're handled specially above
    if (
      functionName === "extract_contact_info" &&
      (fieldName === "owner_name" || fieldName === "agent_name")
    ) {
      continue;
    }

    const mapping = currentMapping[fieldName];
    if (!mapping) {
      console.warn(`⚠️ [GPT4-OCR] No mapping found for field: ${fieldName}`);
      continue;
    }

    // Find the corresponding field mapping for validation
    const fieldMapping = ALL_FIELD_MAPPINGS.find(
      (fm) =>
        fm.dbColumn === mapping.dbColumn && fm.dbTable === mapping.dbTable,
    );

    if (!fieldMapping) {
      console.warn(
        `⚠️ [GPT4-OCR] Unknown field mapping: ${mapping.dbTable}.${mapping.dbColumn}`,
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
        `⚠️ [GPT4-OCR] Invalid field value type for ${mapping.dbColumn}: ${typeof fieldValue}`,
      );
      continue;
    }

    // Apply validation if available
    const stringValue = String(fieldValue);
    if (fieldMapping.validation && !fieldMapping.validation(stringValue)) {
      console.warn(
        `⚠️ [GPT4-OCR] Validation failed for ${mapping.dbColumn}: ${stringValue}`,
      );
      continue;
    }

    // Convert value using converter function
    let convertedValue: string | number | boolean =
      typeof fieldValue === "string" ||
      typeof fieldValue === "number" ||
      typeof fieldValue === "boolean"
        ? fieldValue
        : stringValue;
    if (fieldMapping.converter) {
      try {
        const converted = fieldMapping.converter(stringValue);
        convertedValue =
          typeof converted === "string" ||
          typeof converted === "number" ||
          typeof converted === "boolean"
            ? converted
            : stringValue;
      } catch {
        console.warn(
          `⚠️ [GPT4-OCR] Conversion failed for ${mapping.dbColumn}: ${stringValue}`,
        );
        convertedValue =
          typeof fieldValue === "string" ||
          typeof fieldValue === "number" ||
          typeof fieldValue === "boolean"
            ? fieldValue
            : stringValue;
      }
    }

    // Adjust confidence based on OCR confidence
    const confidence = functionArgs.confidence;
    const baseConfidence = typeof confidence === "number" ? confidence : 80;
    const adjustedConfidence = Math.min(
      baseConfidence,
      baseConfidence * (ocrInput.confidence / 100),
    );

    extractedFields.push({
      dbColumn: mapping.dbColumn,
      dbTable: mapping.dbTable as "properties" | "listings" | "contacts",
      value: convertedValue,
      originalText:
        typeof functionArgs.original_text === "string"
          ? functionArgs.original_text
          : "",
      confidence: adjustedConfidence,
      extractionSource: "gpt4_ocr",
      fieldType: fieldMapping.dataType,
      matched_alias: `${functionName}:${fieldName}`,
    });

    console.log(
      `✅ [GPT4-OCR] ${functionName}: ${mapping.dbColumn} = ${convertedValue} (${adjustedConfidence.toFixed(1)}% confidence)`,
    );
  }

  return extractedFields;
}

/**
 * Consolidate and deduplicate extracted fields, keeping highest confidence values
 */
function consolidateResults(
  results: ExtractedFieldResult[],
): ExtractedFieldResult[] {
  const consolidatedMap = new Map<string, ExtractedFieldResult>();

  // Sort by confidence (highest first)
  const sortedResults = results.sort((a, b) => b.confidence - a.confidence);

  for (const result of sortedResults) {
    const key = `${result.dbTable}.${result.dbColumn}`;

    // Keep only the highest confidence result for each field
    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, result);
    }
  }

  const consolidated = Array.from(consolidatedMap.values());
  console.log(
    `🔄 [GPT4-OCR] Consolidated ${results.length} raw results into ${consolidated.length} unique fields`,
  );

  return consolidated;
}

// Helper function to filter fields by confidence threshold
export async function filterByConfidence(
  fields: ExtractedFieldResult[],
  threshold = 50,
): Promise<ExtractedFieldResult[]> {
  const filtered = fields.filter((field) => field.confidence >= threshold);
  console.log(
    `🎯 [GPT4-OCR] Filtered by ${threshold}% confidence: ${filtered.length}/${fields.length} fields above threshold`,
  );
  return filtered;
}

// Helper function to get extraction statistics
export async function getExtractionStats(
  fields: ExtractedFieldResult[],
): Promise<{
  total: number;
  byTable: { properties: number; listings: number; contacts: number };
  bySource: {
    form: number;
    table: number;
    regex: number;
    text: number;
    gpt4_ocr: number;
  };
  byType: { string: number; number: number; boolean: number; decimal: number };
  averageConfidence: number;
  confidenceRange: { min: number; max: number };
}> {
  const stats = {
    total: fields.length,
    byTable: {
      properties: fields.filter((f) => f.dbTable === "properties").length,
      listings: fields.filter((f) => f.dbTable === "listings").length,
      contacts: fields.filter((f) => f.dbTable === "contacts").length,
    },
    bySource: {
      form: fields.filter((f) => f.extractionSource === "form").length,
      table: fields.filter((f) => f.extractionSource === "table").length,
      regex: fields.filter((f) => f.extractionSource === "regex").length,
      text: fields.filter((f) => f.extractionSource === "text").length,
      gpt4_ocr: fields.filter((f) => f.extractionSource === "gpt4_ocr").length,
    },
    byType: {
      string: fields.filter((f) => f.fieldType === "string").length,
      number: fields.filter((f) => f.fieldType === "number").length,
      boolean: fields.filter((f) => f.fieldType === "boolean").length,
      decimal: fields.filter((f) => f.fieldType === "decimal").length,
    },
    averageConfidence:
      fields.length > 0
        ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
        : 0,
    confidenceRange: {
      min: fields.length > 0 ? Math.min(...fields.map((f) => f.confidence)) : 0,
      max: fields.length > 0 ? Math.max(...fields.map((f) => f.confidence)) : 0,
    },
  };

  return stats;
}
