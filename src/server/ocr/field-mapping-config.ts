import type { FieldMapping } from "~/types/textract-enhanced";

/**
 * Comprehensive Spanish Property Field Mapping Configuration
 * Maps Spanish real estate terminology to database schema fields
 */

// Validation functions
const isPositiveNumber = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

const isYear = (value: string): boolean => {
  const year = parseInt(value);
  return !isNaN(year) && year >= 1800 && year <= new Date().getFullYear() + 5;
};

const isBedroomCount = (value: string): boolean => {
  const count = parseInt(value);
  return !isNaN(count) && count >= 0 && count <= 10;
};

const isBathroomCount = (value: string): boolean => {
  const count = parseFloat(value);
  return !isNaN(count) && count >= 0 && count <= 10;
};

const isConservationStatus = (value: string): boolean => {
  const status = parseInt(value);
  return !isNaN(status) && [1, 2, 3, 4, 6].includes(status);
};

const isEnergyScale = (value: string): boolean => {
  return /^[A-G]$/i.test(value.trim());
};

const isPrice = (value: string): boolean => {
  // Remove currency symbols and separators
  const cleanValue = value.replace(/[€$,.\s]/g, "");
  const num = parseFloat(cleanValue);
  return !isNaN(num) && num > 0;
};

// Converter functions
const toNumber = (value: string): number => {
  return parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
};

const toBoolean = (value: string): boolean => {
  const normalizedValue = value.toLowerCase().trim();
  return [
    "sí",
    "si",
    "yes",
    "true",
    "1",
    "x",
    "✓",
    "tiene",
    "incluye",
  ].includes(normalizedValue);
};

const toPrice = (value: string): number => {
  // Remove currency symbols and handle Spanish decimal separators
  const cleanValue = value
    .replace(/[€$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleanValue);
};

const toUpperCase = (value: string): string => {
  return value.toUpperCase().trim();
};

// Address standardization function for Spanish addresses
const standardizeSpanishAddress = (address: string): string => {
  if (!address || typeof address !== "string") {
    return address || "";
  }

  const cleanAddress = address.trim();

  // Standardize street type abbreviations to full names
  const streetTypeMap: Record<string, string> = {
    "c/": "Calle",
    cl: "Calle",
    calle: "Calle",
    "av/": "Avenida",
    av: "Avenida",
    avda: "Avenida",
    avenida: "Avenida",
    "pl/": "Plaza",
    pl: "Plaza",
    plaza: "Plaza",
    "ps/": "Paseo",
    ps: "Paseo",
    paseo: "Paseo",
    "cr/": "Carrera",
    cr: "Carrera",
    carrera: "Carrera",
    "tr/": "Travesía",
    tr: "Travesía",
    travesia: "Travesía",
    travesía: "Travesía",
    "ct/": "Cuesta",
    ct: "Cuesta",
    cuesta: "Cuesta",
    "cm/": "Camino",
    cm: "Camino",
    camino: "Camino",
    "rd/": "Ronda",
    rd: "Ronda",
    ronda: "Ronda",
  };

  // Extract the street type at the beginning
  const streetTypePattern =
    /^(c\/|cl|calle|av\/|av|avda|avenida|pl\/|pl|plaza|ps\/|ps|paseo|cr\/|cr|carrera|tr\/|tr|travesia|travesía|ct\/|ct|cuesta|cm\/|cm|camino|rd\/|rd|ronda)\s+/i;
  const streetTypeMatch = streetTypePattern.exec(cleanAddress);

  let streetType = "";
  let restOfAddress = cleanAddress;

  if (streetTypeMatch?.[1]) {
    const matchedType = streetTypeMatch[1].toLowerCase();
    streetType = streetTypeMap[matchedType] ?? streetTypeMatch[1];
    restOfAddress = cleanAddress.slice(streetTypeMatch[0].length);
  }

  // Extract street name and portal number
  // Look for the first number which should be the portal number
  // Stop at any additional numbers that might be floor/door (like "4:6" for floor:door)
  const addressPattern = /^([^0-9]+?)\s*(\d+)(?:[\s:]+\d+.*)?$/;
  const addressMatch = addressPattern.exec(restOfAddress);

  if (addressMatch?.[1] && addressMatch?.[2]) {
    const streetName = addressMatch[1].trim();
    const portalNumber = addressMatch[2];

    // Capitalize street name properly
    const capitalizedStreetName = streetName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Build standardized address
    const standardizedAddress = streetType
      ? `${streetType} ${capitalizedStreetName}, ${portalNumber}`
      : `Calle ${capitalizedStreetName}, ${portalNumber}`;

    return standardizedAddress;
  }

  // If pattern doesn't match, try to at least standardize the street type
  if (streetTypeMatch) {
    const streetName = restOfAddress.trim();
    const capitalizedStreetName = streetName
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return `${streetType} ${capitalizedStreetName}`;
  }

  // If nothing else works, return cleaned address with proper capitalization
  return cleanAddress
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Properties table field mappings
export const PROPERTY_FIELD_MAPPINGS: FieldMapping[] = [
  // Basic Information
  {
    dbColumn: "title",
    dbTable: "properties",
    aliases: ["título", "titulo", "nombre", "denominación", "denominacion"],
    dataType: "string",
    category: "basic",
  },
  {
    dbColumn: "description",
    dbTable: "properties",
    aliases: ["descripción", "descripcion", "detalles", "observaciones"],
    dataType: "string",
    category: "basic",
  },
  {
    dbColumn: "propertyType",
    dbTable: "properties",
    aliases: ["tipo", "tipo de vivienda", "tipo propiedad", "clase"],
    dataType: "string",
    examples: ["piso", "casa", "chalet", "apartamento", "local", "garaje"],
    category: "basic",
  },
  {
    dbColumn: "propertySubtype",
    dbTable: "properties",
    aliases: ["subtipo", "subtipo de vivienda", "especialidad"],
    dataType: "string",
    category: "basic",
  },

  // Property Specifications
  {
    dbColumn: "bedrooms",
    dbTable: "properties",
    aliases: [
      "dormitorios",
      "habitaciones",
      "cuartos",
      "dorm",
      "hab",
      "alcobas",
    ],
    dataType: "number",
    validation: isBedroomCount,
    converter: toNumber,
    examples: ["1", "2", "3", "4", "5"],
    category: "specifications",
  },
  {
    dbColumn: "bathrooms",
    dbTable: "properties",
    aliases: ["baños", "aseos", "servicios", "wc", "cuartos de baño"],
    dataType: "decimal",
    validation: isBathroomCount,
    converter: toNumber,
    examples: ["1", "1.5", "2", "2.5"],
    category: "specifications",
  },
  {
    dbColumn: "squareMeter",
    dbTable: "properties",
    aliases: [
      "superficie",
      "metros",
      "m2",
      "m²",
      "metros cuadrados",
      "superficie útil",
      "superficie construida",
    ],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    examples: ["80", "120", "150"],
    category: "specifications",
  },
  {
    dbColumn: "yearBuilt",
    dbTable: "properties",
    aliases: [
      "año",
      "año construcción",
      "año edificación",
      "construccion",
      "edificacion",
      "construido",
    ],
    dataType: "number",
    validation: isYear,
    converter: toNumber,
    examples: ["1990", "2005", "2020"],
    category: "specifications",
  },
  {
    dbColumn: "cadastralReference",
    dbTable: "properties",
    aliases: [
      "referencia catastral",
      "ref catastral",
      "catastro",
      "codigo catastral",
    ],
    dataType: "string",
    category: "specifications",
  },
  {
    dbColumn: "builtSurfaceArea",
    dbTable: "properties",
    aliases: [
      "superficie construida",
      "superficie total",
      "metros construidos",
      "m2 construidos",
    ],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "specifications",
  },
  {
    dbColumn: "conservationStatus",
    dbTable: "properties",
    aliases: ["estado conservación", "estado", "conservacion", "condicion"],
    dataType: "number",
    validation: isConservationStatus,
    converter: toNumber,
    examples: ["1", "2", "3", "4", "6"],
    category: "specifications",
  },

  // Location Information
  {
    dbColumn: "street",
    dbTable: "properties",
    aliases: [
      "dirección",
      "direccion",
      "calle",
      "avenida",
      "paseo",
      "plaza",
      "domicilio",
    ],
    dataType: "string",
    converter: standardizeSpanishAddress,
    category: "location",
  },
  {
    dbColumn: "addressDetails",
    dbTable: "properties",
    aliases: ["piso", "puerta", "escalera", "portal", "detalles dirección"],
    dataType: "string",
    category: "location",
  },
  {
    dbColumn: "postalCode",
    dbTable: "properties",
    aliases: ["código postal", "codigo postal", "cp", "postal"],
    dataType: "string",
    category: "location",
  },
  // Temporary location fields - extracted but handled specially in database saver
  {
    dbColumn: "extractedCity",
    dbTable: "properties", // Temporary - will be processed via findOrCreateLocation
    aliases: ["ciudad", "localidad", "localización", "ubicación"],
    dataType: "string",
    converter: toUpperCase,
    category: "location",
  },
  {
    dbColumn: "extractedProvince",
    dbTable: "properties", // Temporary - will be processed via findOrCreateLocation
    aliases: ["provincia", "prov"],
    dataType: "string",
    converter: toUpperCase,
    category: "location",
  },
  {
    dbColumn: "extractedMunicipality",
    dbTable: "properties", // Temporary - will be processed via findOrCreateLocation
    aliases: ["municipio", "ayuntamiento"],
    dataType: "string",
    converter: toUpperCase,
    category: "location",
  },

  // Energy and Heating
  {
    dbColumn: "energyCertificateStatus",
    dbTable: "properties",
    aliases: [
      "certificado energético",
      "certificado energia",
      "energia",
      "eficiencia energética",
    ],
    dataType: "string",
    examples: ["uploaded", "en_tramite", "exento"],
    category: "energy",
  },
  {
    dbColumn: "energyConsumptionScale",
    dbTable: "properties",
    aliases: [
      "escala energética",
      "letra energética",
      "calificación energética",
    ],
    dataType: "string",
    validation: isEnergyScale,
    converter: toUpperCase,
    examples: ["A", "B", "C", "D", "E", "F", "G"],
    category: "energy",
  },
  {
    dbColumn: "energyConsumptionValue",
    dbTable: "properties",
    aliases: ["consumo energético", "kwh", "consumo"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "energy",
  },
  {
    dbColumn: "emissionsScale",
    dbTable: "properties",
    aliases: ["emisiones", "escala emisiones", "co2"],
    dataType: "string",
    validation: isEnergyScale,
    converter: toUpperCase,
    category: "energy",
  },
  {
    dbColumn: "emissionsValue",
    dbTable: "properties",
    aliases: ["valor emisiones", "kg co2"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "energy",
  },
  {
    dbColumn: "hasHeating",
    dbTable: "properties",
    aliases: ["calefacción", "calefaccion", "climatización", "climatizacion"],
    dataType: "boolean",
    converter: toBoolean,
    category: "energy",
  },
  {
    dbColumn: "heatingType",
    dbTable: "properties",
    aliases: ["tipo calefacción", "tipo calefaccion", "sistema calefacción"],
    dataType: "string",
    examples: [
      "gas individual",
      "gas colectivo",
      "eléctrica",
      "suelo radiante",
    ],
    category: "energy",
  },

  // Basic Amenities
  {
    dbColumn: "hasElevator",
    dbTable: "properties",
    aliases: ["ascensor", "elevador"],
    dataType: "boolean",
    converter: toBoolean,
    category: "amenities",
  },
  {
    dbColumn: "hasGarage",
    dbTable: "properties",
    aliases: ["garaje", "aparcamiento", "parking", "plaza garaje"],
    dataType: "boolean",
    converter: toBoolean,
    category: "amenities",
  },
  {
    dbColumn: "hasStorageRoom",
    dbTable: "properties",
    aliases: ["trastero", "almacén", "almacen", "cuarto trastero"],
    dataType: "boolean",
    converter: toBoolean,
    category: "amenities",
  },

  // Property Features (Garage)
  {
    dbColumn: "garageType",
    dbTable: "properties",
    aliases: ["tipo garaje", "clase garaje"],
    dataType: "string",
    examples: ["individual", "doble", "cubierto", "descubierto"],
    category: "garage",
  },
  {
    dbColumn: "garageSpaces",
    dbTable: "properties",
    aliases: ["plazas garaje", "espacios garaje", "coches"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "garage",
  },
  {
    dbColumn: "garageInBuilding",
    dbTable: "properties",
    aliases: ["garaje en edificio", "garaje incluido"],
    dataType: "boolean",
    converter: toBoolean,
    category: "garage",
  },
  {
    dbColumn: "elevatorToGarage",
    dbTable: "properties",
    aliases: ["ascensor al garaje", "elevador garaje"],
    dataType: "boolean",
    converter: toBoolean,
    category: "garage",
  },
  {
    dbColumn: "garageNumber",
    dbTable: "properties",
    aliases: ["número garaje", "numero garaje", "plaza número"],
    dataType: "string",
    category: "garage",
  },

  // Community and Recreational Amenities
  {
    dbColumn: "gym",
    dbTable: "properties",
    aliases: ["gimnasio", "gym", "fitness"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "sportsArea",
    dbTable: "properties",
    aliases: ["zona deportiva", "área deportiva", "deportes", "polideportivo"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "childrenArea",
    dbTable: "properties",
    aliases: ["zona infantil", "área niños", "parque infantil", "zona juegos"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "suiteBathroom",
    dbTable: "properties",
    aliases: ["baño suite", "baño principal", "suite"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "nearbyPublicTransport",
    dbTable: "properties",
    aliases: ["transporte público", "metro", "autobús", "cercanías"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "communityPool",
    dbTable: "properties",
    aliases: ["piscina comunitaria", "piscina común", "alberca comunitaria"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "privatePool",
    dbTable: "properties",
    aliases: ["piscina privada", "alberca privada", "piscina propia"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "tennisCourt",
    dbTable: "properties",
    aliases: ["pista tenis", "cancha tenis", "tenis"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },

  // Property Characteristics
  {
    dbColumn: "disabledAccessible",
    dbTable: "properties",
    aliases: [
      "accesible",
      "minusválidos",
      "discapacitados",
      "acceso minusválidos",
    ],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "vpo",
    dbTable: "properties",
    aliases: ["vpo", "vivienda protección oficial", "protección oficial"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "videoIntercom",
    dbTable: "properties",
    aliases: ["videoportero", "portero automático", "interfono"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "conciergeService",
    dbTable: "properties",
    aliases: ["conserje", "portero", "servicio portería"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "securityGuard",
    dbTable: "properties",
    aliases: ["vigilancia", "seguridad", "vigilante"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "satelliteDish",
    dbTable: "properties",
    aliases: ["antena parabólica", "parabólica", "antena satélite"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "doubleGlazing",
    dbTable: "properties",
    aliases: ["doble acristalamiento", "climalit", "doble cristal"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "alarm",
    dbTable: "properties",
    aliases: ["alarma", "sistema alarma", "seguridad alarma"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },
  {
    dbColumn: "securityDoor",
    dbTable: "properties",
    aliases: ["puerta blindada", "puerta acorazada", "puerta seguridad"],
    dataType: "boolean",
    converter: toBoolean,
    category: "characteristics",
  },

  // Property Condition
  {
    dbColumn: "brandNew",
    dbTable: "properties",
    aliases: ["a estrenar", "estrenar", "nuevo"],
    dataType: "boolean",
    converter: toBoolean,
    category: "condition",
  },
  {
    dbColumn: "newConstruction",
    dbTable: "properties",
    aliases: ["obra nueva", "construcción nueva", "nuevo desarrollo"],
    dataType: "boolean",
    converter: toBoolean,
    category: "condition",
  },
  {
    dbColumn: "underConstruction",
    dbTable: "properties",
    aliases: ["en construcción", "en obra", "sobre plano"],
    dataType: "boolean",
    converter: toBoolean,
    category: "condition",
  },
  {
    dbColumn: "needsRenovation",
    dbTable: "properties",
    aliases: ["para reformar", "necesita reforma", "reforma"],
    dataType: "boolean",
    converter: toBoolean,
    category: "condition",
  },
  {
    dbColumn: "lastRenovationYear",
    dbTable: "properties",
    aliases: ["año reforma", "última reforma", "reformado en"],
    dataType: "number",
    validation: isYear,
    converter: toNumber,
    category: "condition",
  },

  // Kitchen Features
  {
    dbColumn: "kitchenType",
    dbTable: "properties",
    aliases: ["tipo cocina", "cocina"],
    dataType: "string",
    examples: ["americana", "independiente", "office", "integral"],
    category: "kitchen",
  },
  {
    dbColumn: "hotWaterType",
    dbTable: "properties",
    aliases: ["agua caliente", "tipo agua caliente", "calentador"],
    dataType: "string",
    examples: ["gas", "eléctrico", "termo", "caldera"],
    category: "kitchen",
  },
  {
    dbColumn: "openKitchen",
    dbTable: "properties",
    aliases: ["cocina americana", "cocina abierta", "open kitchen"],
    dataType: "boolean",
    converter: toBoolean,
    category: "kitchen",
  },
  {
    dbColumn: "frenchKitchen",
    dbTable: "properties",
    aliases: ["cocina francesa", "cocina office"],
    dataType: "boolean",
    converter: toBoolean,
    category: "kitchen",
  },
  {
    dbColumn: "furnishedKitchen",
    dbTable: "properties",
    aliases: ["cocina amueblada", "cocina equipada", "muebles cocina"],
    dataType: "boolean",
    converter: toBoolean,
    category: "kitchen",
  },
  {
    dbColumn: "pantry",
    dbTable: "properties",
    aliases: ["despensa", "office"],
    dataType: "boolean",
    converter: toBoolean,
    category: "kitchen",
  },

  // Storage and Additional Spaces
  {
    dbColumn: "storageRoomSize",
    dbTable: "properties",
    aliases: ["tamaño trastero", "metros trastero", "m2 trastero"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "storageRoomNumber",
    dbTable: "properties",
    aliases: ["número trastero", "trastero número"],
    dataType: "string",
    category: "storage",
  },
  {
    dbColumn: "terrace",
    dbTable: "properties",
    aliases: ["terraza", "balcón", "balcon"],
    dataType: "boolean",
    converter: toBoolean,
    category: "storage",
  },
  {
    dbColumn: "terraceSize",
    dbTable: "properties",
    aliases: ["tamaño terraza", "metros terraza", "m2 terraza"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "wineCellar",
    dbTable: "properties",
    aliases: ["bodega", "vinoteca"],
    dataType: "boolean",
    converter: toBoolean,
    category: "storage",
  },
  {
    dbColumn: "wineCellarSize",
    dbTable: "properties",
    aliases: ["tamaño bodega", "metros bodega"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "livingRoomSize",
    dbTable: "properties",
    aliases: ["tamaño salón", "metros salón", "salón comedor"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "balconyCount",
    dbTable: "properties",
    aliases: ["número balcones", "balcones"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "galleryCount",
    dbTable: "properties",
    aliases: ["galerías", "numero galerias"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },
  {
    dbColumn: "buildingFloors",
    dbTable: "properties",
    aliases: ["plantas edificio", "alturas", "pisos edificio"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "storage",
  },

  // Interior Features
  {
    dbColumn: "builtInWardrobes",
    dbTable: "properties",
    aliases: ["armarios empotrados", "armarios", "vestidores"],
    dataType: "string",
    category: "interior",
  },
  {
    dbColumn: "mainFloorType",
    dbTable: "properties",
    aliases: ["tipo suelo", "suelo", "pavimento"],
    dataType: "string",
    examples: ["parquet", "gres", "mármol", "tarima"],
    category: "interior",
  },
  {
    dbColumn: "shutterType",
    dbTable: "properties",
    aliases: ["tipo persiana", "persianas"],
    dataType: "string",
    examples: ["eléctricas", "manuales", "aluminio"],
    category: "interior",
  },
  {
    dbColumn: "carpentryType",
    dbTable: "properties",
    aliases: ["tipo carpintería", "carpinteria", "ventanas"],
    dataType: "string",
    examples: ["aluminio", "pvc", "madera"],
    category: "interior",
  },
  {
    dbColumn: "orientation",
    dbTable: "properties",
    aliases: ["orientación", "orientacion", "orientado"],
    dataType: "string",
    examples: ["norte", "sur", "este", "oeste", "noreste", "sureste"],
    category: "interior",
  },
  {
    dbColumn: "airConditioningType",
    dbTable: "properties",
    aliases: ["aire acondicionado", "climatización", "aa", "split"],
    dataType: "string",
    examples: ["central", "split", "conductos", "cassette"],
    category: "interior",
  },
  {
    dbColumn: "windowType",
    dbTable: "properties",
    aliases: ["tipo ventanas", "ventanas"],
    dataType: "string",
    examples: ["aluminio", "pvc", "madera", "corredera"],
    category: "interior",
  },

  // Views and Location Features
  {
    dbColumn: "exterior",
    dbTable: "properties",
    aliases: ["exterior", "fachada exterior"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },
  {
    dbColumn: "bright",
    dbTable: "properties",
    aliases: ["luminoso", "luminosa", "mucha luz"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },
  {
    dbColumn: "views",
    dbTable: "properties",
    aliases: ["vistas", "con vistas"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },
  {
    dbColumn: "mountainViews",
    dbTable: "properties",
    aliases: ["vistas montaña", "vistas sierra", "vistas monte"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },
  {
    dbColumn: "seaViews",
    dbTable: "properties",
    aliases: ["vistas mar", "vistas océano", "vista marina"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },
  {
    dbColumn: "beachfront",
    dbTable: "properties",
    aliases: ["primera línea", "frente mar", "primera linea playa"],
    dataType: "boolean",
    converter: toBoolean,
    category: "views",
  },

  // Luxury Amenities
  {
    dbColumn: "jacuzzi",
    dbTable: "properties",
    aliases: ["jacuzzi", "bañera hidromasaje"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "hydromassage",
    dbTable: "properties",
    aliases: ["hidromasaje", "hidro"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "garden",
    dbTable: "properties",
    aliases: ["jardín", "jardin", "zona verde"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "pool",
    dbTable: "properties",
    aliases: ["piscina", "alberca"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "homeAutomation",
    dbTable: "properties",
    aliases: ["domótica", "domotica", "casa inteligente"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "musicSystem",
    dbTable: "properties",
    aliases: ["hilo musical", "sistema audio", "música"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "laundryRoom",
    dbTable: "properties",
    aliases: ["lavadero", "cuarto lavado", "zona lavado"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "coveredClothesline",
    dbTable: "properties",
    aliases: ["tendedero cubierto", "galería tendido"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "fireplace",
    dbTable: "properties",
    aliases: ["chimenea", "hogar"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },

  // Additional Amenities
  {
    dbColumn: "sauna",
    dbTable: "properties",
    aliases: ["sauna"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "patio",
    dbTable: "properties",
    aliases: ["patio", "patio interior"],
    dataType: "boolean",
    converter: toBoolean,
    category: "luxury",
  },
  {
    dbColumn: "suiteBathroom",
    dbTable: "properties",
    aliases: ["baño en suite", "baño principal", "suite bathroom"],
    dataType: "boolean",
    converter: toBoolean,
    category: "amenities",
  },
  {
    dbColumn: "communityArea",
    dbTable: "properties",
    aliases: ["zona comunitaria", "área común", "zonas comunes"],
    dataType: "boolean",
    converter: toBoolean,
    category: "community",
  },
  {
    dbColumn: "satelliteDish",
    dbTable: "properties",
    aliases: ["antena parabólica", "parabólica", "satelite"],
    dataType: "boolean",
    converter: toBoolean,
    category: "amenities",
  },
  {
    dbColumn: "streetType",
    dbTable: "properties",
    aliases: ["tipo calle", "tránsito calle", "intensidad tráfico"],
    dataType: "string",
    examples: ["muy transitada", "transitada", "moderada", "poco transitada"],
    category: "location",
  },

  // Expenses and Taxes
  {
    dbColumn: "ibi",
    dbTable: "properties",
    aliases: ["ibi", "impuesto bienes inmuebles", "contribución"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "garbageTax",
    dbTable: "properties",
    aliases: ["tasa basuras", "basuras", "recogida basuras"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "communityFees",
    dbTable: "properties",
    aliases: ["comunidad", "cuota comunidad", "gastos comunidad", "hoa"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "derrama",
    dbTable: "properties",
    aliases: ["derrama", "derrama comunidad", "cuota extraordinaria"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "vadoPermanente",
    dbTable: "properties",
    aliases: ["vado permanente", "vado", "entrada garaje"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "electricityEstimate",
    dbTable: "properties",
    aliases: ["luz estimada", "electricidad", "gasto luz"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "gasEstimate",
    dbTable: "properties",
    aliases: ["gas estimado", "gasto gas"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "waterEstimate",
    dbTable: "properties",
    aliases: ["agua estimada", "gasto agua"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "centralHeatingFee",
    dbTable: "properties",
    aliases: ["calefacción central", "cuota calefacción"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "internetEstimate",
    dbTable: "properties",
    aliases: ["internet estimado", "gasto internet", "fibra"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },
  {
    dbColumn: "homeInsurance",
    dbTable: "properties",
    aliases: ["seguro hogar", "seguro vivienda", "seguro casa"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "expenses",
  },

  // Commercial/Industrial
  {
    dbColumn: "isDiafano",
    dbTable: "properties",
    aliases: ["diáfano", "diafano", "espacio abierto", "open plan"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "hasEscaparate",
    dbTable: "properties",
    aliases: ["escaparate", "vitrina", "cristalera"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "locatedAtCorner",
    dbTable: "properties",
    aliases: ["esquina", "en esquina", "hace esquina"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "ubication",
    dbTable: "properties",
    aliases: ["ubicación local", "situación local"],
    dataType: "string",
    examples: ["a pie de calle", "centro comercial", "entreplanta", "sótano"],
    category: "commercial",
  },
  {
    dbColumn: "facadeArea",
    dbTable: "properties",
    aliases: ["metros fachada", "fachada", "frente local"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "commercial",
  },
  {
    dbColumn: "windowsNumber",
    dbTable: "properties",
    aliases: ["número escaparates", "escaparates", "vitrinas"],
    dataType: "number",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "commercial",
  },
  {
    dbColumn: "bridgeCrane",
    dbTable: "properties",
    aliases: ["puente grúa", "grúa puente"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "smokeExtraction",
    dbTable: "properties",
    aliases: ["extracción humos", "salida humos", "campana extractora"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "loadingArea",
    dbTable: "properties",
    aliases: ["zona carga", "muelle carga", "carga descarga"],
    dataType: "boolean",
    converter: toBoolean,
    category: "commercial",
  },
  {
    dbColumn: "allowedUse",
    dbTable: "properties",
    aliases: ["uso permitido", "actividad permitida"],
    dataType: "number",
    category: "commercial",
  },

  // Land/Finca
  {
    dbColumn: "finca",
    dbTable: "properties",
    aliases: ["finca", "terreno", "parcela"],
    dataType: "boolean",
    converter: toBoolean,
    category: "land",
  },
  {
    dbColumn: "superficieFinca",
    dbTable: "properties",
    aliases: ["superficie finca", "metros parcela", "m2 terreno"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "land",
  },
  {
    dbColumn: "hasRoadAccess",
    dbTable: "properties",
    aliases: ["acceso carretera", "acceso rodado"],
    dataType: "boolean",
    converter: toBoolean,
    category: "land",
  },
  {
    dbColumn: "hasSewerage",
    dbTable: "properties",
    aliases: ["alcantarillado", "saneamiento"],
    dataType: "boolean",
    converter: toBoolean,
    category: "land",
  },
  {
    dbColumn: "hasSidewalk",
    dbTable: "properties",
    aliases: ["acera", "acerado"],
    dataType: "boolean",
    converter: toBoolean,
    category: "land",
  },
  {
    dbColumn: "hasStreetLighting",
    dbTable: "properties",
    aliases: ["alumbrado público", "farolas", "iluminación calle"],
    dataType: "boolean",
    converter: toBoolean,
    category: "land",
  },

  // Infrastructure
  {
    dbColumn: "electricityType",
    dbTable: "properties",
    aliases: ["tipo electricidad", "instalación eléctrica", "monofásica", "trifásica"],
    dataType: "string",
    examples: ["monofásica", "trifásica", "mixta"],
    category: "infrastructure",
  },
  {
    dbColumn: "electricityStatus",
    dbTable: "properties",
    aliases: ["estado electricidad", "estado instalación eléctrica"],
    dataType: "string",
    examples: ["nuevo", "buen estado", "necesita actualización"],
    category: "infrastructure",
  },
  {
    dbColumn: "plumbingType",
    dbTable: "properties",
    aliases: ["tipo fontanería", "tuberías", "cañerías"],
    dataType: "string",
    examples: ["cobre", "pvc", "multicapa", "galvanizado"],
    category: "infrastructure",
  },
  {
    dbColumn: "plumbingStatus",
    dbTable: "properties",
    aliases: ["estado fontanería", "estado tuberías"],
    dataType: "string",
    examples: ["nuevo", "buen estado", "tiene fugas"],
    category: "infrastructure",
  },
  {
    dbColumn: "garageNumber",
    dbTable: "properties",
    aliases: ["número plaza", "plaza garaje", "plaza parking"],
    dataType: "string",
    category: "garage",
  },
  {
    dbColumn: "storageRoomNumber",
    dbTable: "properties",
    aliases: ["número trastero", "trastero número"],
    dataType: "string",
    category: "storage",
  },
];

// Listings table field mappings
export const LISTING_FIELD_MAPPINGS: FieldMapping[] = [
  // Listing Details
  {
    dbColumn: "listingType",
    dbTable: "listings",
    aliases: [
      "tipo operación",
      "operacion",
      "venta",
      "alquiler",
      "rent",
      "sale",
    ],
    dataType: "string",
    examples: ["Sale", "Rent"],
    category: "listing",
  },
  {
    dbColumn: "price",
    dbTable: "listings",
    aliases: ["precio", "valor", "importe", "coste", "costo"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "listing",
  },
  {
    dbColumn: "isFurnished",
    dbTable: "listings",
    aliases: ["amueblado", "amueblada", "muebles", "mobiliario"],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },
  {
    dbColumn: "furnitureQuality",
    dbTable: "listings",
    aliases: ["calidad muebles", "tipo mobiliario"],
    dataType: "string",
    examples: ["basic", "standard", "high", "luxury"],
    category: "listing",
  },
  {
    dbColumn: "hasKeys",
    dbTable: "listings",
    aliases: ["llaves", "con llaves", "disponibilidad"],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },
  {
    dbColumn: "studentFriendly",
    dbTable: "listings",
    aliases: ["estudiantes", "para estudiantes", "universitarios"],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },
  {
    dbColumn: "petsAllowed",
    dbTable: "listings",
    aliases: ["mascotas", "animales", "perros", "gatos"],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },
  {
    dbColumn: "appliancesIncluded",
    dbTable: "listings",
    aliases: [
      "electrodomésticos",
      "electrodomesticos",
      "incluye electrodomésticos",
    ],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },

  // Appliances and Amenities
  {
    dbColumn: "internet",
    dbTable: "listings",
    aliases: ["internet", "wifi", "fibra"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "oven",
    dbTable: "listings",
    aliases: ["horno"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "microwave",
    dbTable: "listings",
    aliases: ["microondas"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "washingMachine",
    dbTable: "listings",
    aliases: ["lavadora"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "fridge",
    dbTable: "listings",
    aliases: ["frigorífico", "nevera", "refrigerador"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "tv",
    dbTable: "listings",
    aliases: ["televisión", "television", "tv"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },
  {
    dbColumn: "stoneware",
    dbTable: "listings",
    aliases: ["vajilla", "menaje"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },

  // Optional Features
  {
    dbColumn: "optionalGarage",
    dbTable: "listings",
    aliases: ["garaje opcional", "parking opcional"],
    dataType: "boolean",
    converter: toBoolean,
    category: "optional",
  },
  {
    dbColumn: "optionalGaragePrice",
    dbTable: "listings",
    aliases: ["precio garaje", "coste garaje", "garaje adicional"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "optional",
  },
  {
    dbColumn: "optionalStorageRoom",
    dbTable: "listings",
    aliases: ["trastero opcional"],
    dataType: "boolean",
    converter: toBoolean,
    category: "optional",
  },
  {
    dbColumn: "optionalStorageRoomPrice",
    dbTable: "listings",
    aliases: ["precio trastero", "coste trastero"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "optional",
  },

  // Additional listing fields
  {
    dbColumn: "encargo",
    dbTable: "listings",
    aliases: ["encargo", "exclusiva", "contrato exclusividad"],
    dataType: "boolean",
    converter: toBoolean,
    category: "listing",
  },
  {
    dbColumn: "secadora",
    dbTable: "listings",
    aliases: ["secadora"],
    dataType: "boolean",
    converter: toBoolean,
    category: "appliances",
  },

  // Rental details
  {
    dbColumn: "rentalType",
    dbTable: "listings",
    aliases: ["tipo alquiler", "modalidad alquiler"],
    dataType: "string",
    examples: ["residencial", "temporada", "turístico"],
    category: "rental",
  },
  {
    dbColumn: "securityDeposit",
    dbTable: "listings",
    aliases: ["fianza", "depósito", "garantía"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "rental",
  },
  {
    dbColumn: "additionalGuarantee",
    dbTable: "listings",
    aliases: ["garantía adicional", "aval adicional"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "rental",
  },
  {
    dbColumn: "bankGuaranteeRequired",
    dbTable: "listings",
    aliases: ["aval bancario", "requiere aval"],
    dataType: "boolean",
    converter: toBoolean,
    category: "rental",
  },
  {
    dbColumn: "managementFees",
    dbTable: "listings",
    aliases: ["gastos gestión", "honorarios gestión"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "rental",
  },
  {
    dbColumn: "nonPaymentInsurance",
    dbTable: "listings",
    aliases: ["seguro impago", "seguro alquiler"],
    dataType: "boolean",
    converter: toBoolean,
    category: "rental",
  },
  {
    dbColumn: "nonPaymentInsuranceAmount",
    dbTable: "listings",
    aliases: ["coste seguro impago", "precio seguro impago"],
    dataType: "decimal",
    validation: isPrice,
    converter: toPrice,
    category: "rental",
  },
  {
    dbColumn: "occupationStatus",
    dbTable: "listings",
    aliases: ["estado ocupación", "ocupación", "situación ocupacional"],
    dataType: "string",
    examples: ["libre", "alquilado", "ocupado"],
    category: "listing",
  },
  {
    dbColumn: "priceReferenceIndex",
    dbTable: "listings",
    aliases: ["índice referencia", "índice precio cataluña"],
    dataType: "decimal",
    validation: isPositiveNumber,
    converter: toNumber,
    category: "rental",
  },
  {
    dbColumn: "shortTermLicense",
    dbTable: "listings",
    aliases: ["licencia turística", "licencia alquiler turístico", "número licencia"],
    dataType: "string",
    category: "rental",
  },
];

// Contact field mappings for property owners and related contacts
export const CONTACT_FIELD_MAPPINGS: FieldMapping[] = [
  // Owner/Contact Information
  {
    dbColumn: "firstName",
    dbTable: "contacts",
    aliases: ["propietario", "nombre", "titular", "contacto", "cliente"],
    dataType: "string",
    category: "contact",
  },
  {
    dbColumn: "lastName",
    dbTable: "contacts",
    aliases: ["apellidos", "apellido", "surname"],
    dataType: "string",
    category: "contact",
  },
  {
    dbColumn: "email",
    dbTable: "contacts",
    aliases: ["e-mail", "email", "correo", "correo electrónico", "mail"],
    dataType: "string",
    category: "contact",
  },
  {
    dbColumn: "phone",
    dbTable: "contacts",
    aliases: ["teléfono", "telefono", "móvil", "movil", "celular", "tel"],
    dataType: "string",
    category: "contact",
  },
];

// Combined field mappings
export const ALL_FIELD_MAPPINGS: FieldMapping[] = [
  ...PROPERTY_FIELD_MAPPINGS,
  ...LISTING_FIELD_MAPPINGS,
  ...CONTACT_FIELD_MAPPINGS,
];

// Helper function to get field mapping by database column
export function getFieldMappingByColumn(
  dbColumn: string,
): FieldMapping | undefined {
  return ALL_FIELD_MAPPINGS.find((mapping) => mapping.dbColumn === dbColumn);
}

// Helper function to get all aliases for a specific field
export function getFieldAliases(dbColumn: string): string[] {
  const mapping = getFieldMappingByColumn(dbColumn);
  return mapping?.aliases ?? [];
}

// Helper function to get mappings by category
export function getFieldMappingsByCategory(category: string): FieldMapping[] {
  return ALL_FIELD_MAPPINGS.filter((mapping) => mapping.category === category);
}

// Helper function to get all property field mappings
export function getPropertyFieldMappings(): FieldMapping[] {
  return PROPERTY_FIELD_MAPPINGS;
}

// Helper function to get all listing field mappings
export function getListingFieldMappings(): FieldMapping[] {
  return LISTING_FIELD_MAPPINGS;
}

// Helper function to get all contact field mappings
export function getContactFieldMappings(): FieldMapping[] {
  return CONTACT_FIELD_MAPPINGS;
}
