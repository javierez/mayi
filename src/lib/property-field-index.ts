/**
 * Property Field Index for Command Palette
 *
 * This file contains a searchable index of all fields in the property form.
 * Used by the Vesta command palette to navigate to specific fields.
 */

export interface FieldDefinition {
  /** Spanish label displayed in search results */
  label: string;
  /** Additional search terms (lowercase, no accents for easier matching) */
  keywords: string[];
  /** Section key for expanding collapsed sections */
  sectionKey: string;
  /** DOM element ID to focus */
  inputId: string;
  /** Card display name for grouping results */
  cardName: string;
}

export const PROPERTY_FIELDS: FieldDefinition[] = [
  // ============================================
  // INFORMACIÓN BÁSICA (basicInfo)
  // ============================================
  {
    label: "Título",
    keywords: ["titulo", "nombre", "title"],
    sectionKey: "basicInfo",
    inputId: "title",
    cardName: "Información Básica",
  },
  {
    label: "Precio",
    keywords: ["precio", "coste", "euros", "€", "price", "importe"],
    sectionKey: "basicInfo",
    inputId: "price",
    cardName: "Información Básica",
  },
  {
    label: "Tipo de Propiedad",
    keywords: ["tipo", "piso", "casa", "local", "solar", "garaje", "property type"],
    sectionKey: "basicInfo",
    inputId: "propertyType",
    cardName: "Información Básica",
  },
  {
    label: "Licencia Turística",
    keywords: ["licencia", "turistica", "vacacional", "license"],
    sectionKey: "basicInfo",
    inputId: "shortTermLicense",
    cardName: "Información Básica",
  },

  // ============================================
  // DISTRIBUCIÓN Y SUPERFICIE (propertyDetails)
  // ============================================
  {
    label: "Habitaciones",
    keywords: ["habitaciones", "dormitorios", "cuartos", "bedrooms", "estancias"],
    sectionKey: "propertyDetails",
    inputId: "bedrooms",
    cardName: "Distribución",
  },
  {
    label: "Baños",
    keywords: ["banos", "aseos", "wc", "bathrooms", "lavabos"],
    sectionKey: "propertyDetails",
    inputId: "bathrooms",
    cardName: "Distribución",
  },
  {
    label: "Superficie",
    keywords: ["metros", "m2", "superficie", "tamano", "area", "medidas"],
    sectionKey: "propertyDetails",
    inputId: "squareMeter",
    cardName: "Distribución",
  },
  {
    label: "Superficie Construida",
    keywords: ["construida", "built", "edificable"],
    sectionKey: "propertyDetails",
    inputId: "builtSurfaceArea",
    cardName: "Distribución",
  },
  {
    label: "Año de Construcción",
    keywords: ["ano", "construccion", "built", "year", "antiguedad"],
    sectionKey: "propertyDetails",
    inputId: "yearBuilt",
    cardName: "Distribución",
  },
  {
    label: "Año Última Reforma",
    keywords: ["reforma", "renovacion", "renovation", "rehabilitacion"],
    sectionKey: "propertyDetails",
    inputId: "lastRenovationYear",
    cardName: "Distribución",
  },
  {
    label: "Plantas del Edificio",
    keywords: ["plantas", "pisos", "floors", "alturas"],
    sectionKey: "propertyDetails",
    inputId: "buildingFloors",
    cardName: "Distribución",
  },
  {
    label: "Estado de Conservación",
    keywords: ["estado", "conservacion", "condition"],
    sectionKey: "propertyDetails",
    inputId: "conservationStatus",
    cardName: "Distribución",
  },
  {
    label: "Finca",
    keywords: ["finca", "terreno", "parcela", "estate", "land"],
    sectionKey: "propertyDetails",
    inputId: "finca",
    cardName: "Distribución",
  },
  {
    label: "Superficie Finca",
    keywords: [
      "superficie finca",
      "metros finca",
      "tamano finca",
      "estate area",
      "area finca",
    ],
    sectionKey: "propertyDetails",
    inputId: "superficieFinca",
    cardName: "Distribución",
  },

  // ============================================
  // UBICACIÓN (location)
  // ============================================
  {
    label: "Calle",
    keywords: ["calle", "direccion", "via", "street", "address"],
    sectionKey: "location",
    inputId: "street",
    cardName: "Ubicación",
  },
  {
    label: "Detalles de Dirección",
    keywords: ["detalles", "piso", "puerta", "escalera", "portal"],
    sectionKey: "location",
    inputId: "addressDetails",
    cardName: "Ubicación",
  },
  {
    label: "Código Postal",
    keywords: ["cp", "codigo postal", "zip", "postal"],
    sectionKey: "location",
    inputId: "postalCode",
    cardName: "Ubicación",
  },
  {
    label: "Barrio",
    keywords: ["barrio", "zona", "distrito", "neighborhood"],
    sectionKey: "location",
    inputId: "neighborhood",
    cardName: "Ubicación",
  },
  {
    label: "Ciudad",
    keywords: ["ciudad", "localidad", "pueblo", "city"],
    sectionKey: "location",
    inputId: "city",
    cardName: "Ubicación",
  },
  {
    label: "Municipio",
    keywords: ["municipio", "ayuntamiento", "municipality"],
    sectionKey: "location",
    inputId: "municipality",
    cardName: "Ubicación",
  },
  {
    label: "Provincia",
    keywords: ["provincia", "province", "region"],
    sectionKey: "location",
    inputId: "province",
    cardName: "Ubicación",
  },
  {
    label: "Referencia Catastral",
    keywords: ["catastro", "catastral", "referencia", "cadastral"],
    sectionKey: "location",
    inputId: "cadastralReference",
    cardName: "Ubicación",
  },

  // ============================================
  // EQUIPAMIENTO Y SUMINISTROS (features)
  // ============================================
  {
    label: "Ascensor",
    keywords: ["ascensor", "elevador", "elevator", "lift"],
    sectionKey: "features",
    inputId: "hasElevator",
    cardName: "Equipamiento",
  },
  {
    label: "Garaje",
    keywords: ["garaje", "parking", "aparcamiento", "plaza", "garage"],
    sectionKey: "features",
    inputId: "hasGarage",
    cardName: "Equipamiento",
  },
  {
    label: "Tipo de Garaje",
    keywords: ["tipo garaje", "abierto", "cerrado"],
    sectionKey: "features",
    inputId: "garageType",
    cardName: "Equipamiento",
  },
  {
    label: "Plazas de Garaje",
    keywords: ["plazas", "parking spaces"],
    sectionKey: "features",
    inputId: "garageSpaces",
    cardName: "Equipamiento",
  },
  {
    label: "Precio Garaje Opcional",
    keywords: ["precio garaje", "garage price"],
    sectionKey: "features",
    inputId: "optionalGaragePrice",
    cardName: "Equipamiento",
  },
  {
    label: "Trastero",
    keywords: ["trastero", "almacen", "storage", "bodega"],
    sectionKey: "features",
    inputId: "hasStorageRoom",
    cardName: "Equipamiento",
  },
  {
    label: "Tamaño Trastero",
    keywords: ["tamano trastero", "metros trastero"],
    sectionKey: "features",
    inputId: "storageRoomSize",
    cardName: "Equipamiento",
  },
  {
    label: "Precio Trastero Opcional",
    keywords: ["precio trastero", "storage price"],
    sectionKey: "features",
    inputId: "optionalStorageRoomPrice",
    cardName: "Equipamiento",
  },
  {
    label: "Calefacción",
    keywords: ["calefaccion", "heating", "radiadores"],
    sectionKey: "features",
    inputId: "hasHeating",
    cardName: "Equipamiento",
  },
  {
    label: "Tipo de Calefacción",
    keywords: ["tipo calefaccion", "gas", "electrica"],
    sectionKey: "features",
    inputId: "heatingType",
    cardName: "Equipamiento",
  },
  {
    label: "Agua Caliente",
    keywords: ["agua caliente", "hot water", "acs"],
    sectionKey: "features",
    inputId: "hotWaterType",
    cardName: "Equipamiento",
  },
  {
    label: "Aire Acondicionado",
    keywords: ["aire", "ac", "climatizacion", "air conditioning", "frio"],
    sectionKey: "features",
    inputId: "hasAirConditioning",
    cardName: "Equipamiento",
  },
  {
    label: "Tipo Aire Acondicionado",
    keywords: ["tipo aire", "split", "conductos", "central"],
    sectionKey: "features",
    inputId: "airConditioningType",
    cardName: "Equipamiento",
  },
  {
    label: "Amueblado",
    keywords: ["amueblado", "muebles", "furnished", "mobiliario"],
    sectionKey: "features",
    inputId: "isFurnished",
    cardName: "Equipamiento",
  },
  {
    label: "Calidad Mobiliario",
    keywords: ["calidad muebles", "furniture quality", "lujo"],
    sectionKey: "features",
    inputId: "furnitureQuality",
    cardName: "Equipamiento",
  },

  // ============================================
  // ORIENTACIÓN (orientation)
  // ============================================
  {
    label: "Exterior",
    keywords: ["exterior", "outside", "vistas"],
    sectionKey: "orientation",
    inputId: "isExterior",
    cardName: "Orientación",
  },
  {
    label: "Luminoso",
    keywords: ["luminoso", "luz", "bright", "soleado"],
    sectionKey: "orientation",
    inputId: "isBright",
    cardName: "Orientación",
  },
  {
    label: "Orientación",
    keywords: ["orientacion", "norte", "sur", "este", "oeste"],
    sectionKey: "orientation",
    inputId: "orientation",
    cardName: "Orientación",
  },
  {
    label: "Escaparate",
    keywords: ["escaparate", "vitrina", "showcase"],
    sectionKey: "orientation",
    inputId: "hasEscaparate",
    cardName: "Orientación",
  },

  // ============================================
  // CARACTERÍSTICAS ADICIONALES (additionalCharacteristics)
  // ============================================
  {
    label: "Accesible",
    keywords: ["accesible", "accesibilidad", "discapacitados", "accessible", "minusvalidos"],
    sectionKey: "additionalCharacteristics",
    inputId: "disabledAccessible",
    cardName: "Características",
  },
  {
    label: "VPO",
    keywords: ["vpo", "proteccion oficial", "vivienda protegida"],
    sectionKey: "additionalCharacteristics",
    inputId: "vpo",
    cardName: "Características",
  },
  {
    label: "Videoportero",
    keywords: ["videoportero", "portero", "intercom"],
    sectionKey: "additionalCharacteristics",
    inputId: "videoIntercom",
    cardName: "Características",
  },
  {
    label: "Conserje",
    keywords: ["conserje", "portero", "concierge"],
    sectionKey: "additionalCharacteristics",
    inputId: "conciergeService",
    cardName: "Características",
  },
  {
    label: "Vigilancia 24h",
    keywords: ["vigilancia", "seguridad", "security", "guardia"],
    sectionKey: "additionalCharacteristics",
    inputId: "securityGuard",
    cardName: "Características",
  },
  {
    label: "Antena Parabólica",
    keywords: ["antena", "parabolica", "satellite"],
    sectionKey: "additionalCharacteristics",
    inputId: "satelliteDish",
    cardName: "Características",
  },
  {
    label: "Doble Acristalamiento",
    keywords: ["doble cristal", "acristalamiento", "double glazing"],
    sectionKey: "additionalCharacteristics",
    inputId: "doubleGlazing",
    cardName: "Características",
  },
  {
    label: "Alarma",
    keywords: ["alarma", "alarm", "seguridad"],
    sectionKey: "additionalCharacteristics",
    inputId: "alarm",
    cardName: "Características",
  },
  {
    label: "Puerta Blindada",
    keywords: ["puerta blindada", "seguridad", "security door"],
    sectionKey: "additionalCharacteristics",
    inputId: "securityDoor",
    cardName: "Características",
  },
  {
    label: "Zona de Carga",
    keywords: ["carga", "descarga", "loading"],
    sectionKey: "additionalCharacteristics",
    inputId: "loadingArea",
    cardName: "Características",
  },
  {
    label: "Tipo de Cocina",
    keywords: ["cocina", "kitchen", "tipo cocina"],
    sectionKey: "additionalCharacteristics",
    inputId: "kitchenType",
    cardName: "Características",
  },
  {
    label: "Cocina Abierta",
    keywords: ["cocina abierta", "americana", "open kitchen"],
    sectionKey: "additionalCharacteristics",
    inputId: "openKitchen",
    cardName: "Características",
  },
  {
    label: "Cocina Amueblada",
    keywords: ["cocina amueblada", "equipada"],
    sectionKey: "additionalCharacteristics",
    inputId: "furnishedKitchen",
    cardName: "Características",
  },
  {
    label: "Despensa",
    keywords: ["despensa", "pantry", "almacen"],
    sectionKey: "additionalCharacteristics",
    inputId: "pantry",
    cardName: "Características",
  },

  // ============================================
  // EXTRAS DE LUJO (premiumFeatures)
  // ============================================
  {
    label: "Vistas",
    keywords: ["vistas", "views", "panoramica"],
    sectionKey: "premiumFeatures",
    inputId: "views",
    cardName: "Extras Premium",
  },
  {
    label: "Vistas a Montaña",
    keywords: ["montana", "mountain", "sierra"],
    sectionKey: "premiumFeatures",
    inputId: "mountainViews",
    cardName: "Extras Premium",
  },
  {
    label: "Vistas al Mar",
    keywords: ["mar", "sea", "playa", "ocean"],
    sectionKey: "premiumFeatures",
    inputId: "seaViews",
    cardName: "Extras Premium",
  },
  {
    label: "Primera Línea de Playa",
    keywords: ["playa", "beach", "frente mar", "beachfront"],
    sectionKey: "premiumFeatures",
    inputId: "beachfront",
    cardName: "Extras Premium",
  },
  {
    label: "Jacuzzi",
    keywords: ["jacuzzi", "spa", "banera"],
    sectionKey: "premiumFeatures",
    inputId: "jacuzzi",
    cardName: "Extras Premium",
  },
  {
    label: "Hidromasaje",
    keywords: ["hidromasaje", "hydromassage"],
    sectionKey: "premiumFeatures",
    inputId: "hydromassage",
    cardName: "Extras Premium",
  },
  {
    label: "Jardín",
    keywords: ["jardin", "garden", "verde"],
    sectionKey: "premiumFeatures",
    inputId: "garden",
    cardName: "Extras Premium",
  },
  {
    label: "Piscina",
    keywords: ["piscina", "pool", "swimming"],
    sectionKey: "premiumFeatures",
    inputId: "pool",
    cardName: "Extras Premium",
  },
  {
    label: "Piscina Privada",
    keywords: ["piscina privada", "private pool"],
    sectionKey: "premiumFeatures",
    inputId: "privatePool",
    cardName: "Extras Premium",
  },
  {
    label: "Piscina Comunitaria",
    keywords: ["piscina comunitaria", "community pool"],
    sectionKey: "premiumFeatures",
    inputId: "communityPool",
    cardName: "Extras Premium",
  },
  {
    label: "Domótica",
    keywords: ["domotica", "smart home", "automatizacion"],
    sectionKey: "premiumFeatures",
    inputId: "homeAutomation",
    cardName: "Extras Premium",
  },
  {
    label: "Sistema de Música",
    keywords: ["musica", "sonido", "music system"],
    sectionKey: "premiumFeatures",
    inputId: "musicSystem",
    cardName: "Extras Premium",
  },
  {
    label: "Lavadero",
    keywords: ["lavadero", "laundry"],
    sectionKey: "premiumFeatures",
    inputId: "laundryRoom",
    cardName: "Extras Premium",
  },
  {
    label: "Chimenea",
    keywords: ["chimenea", "fireplace", "hogar"],
    sectionKey: "premiumFeatures",
    inputId: "fireplace",
    cardName: "Extras Premium",
  },
  {
    label: "Sauna",
    keywords: ["sauna", "spa"],
    sectionKey: "premiumFeatures",
    inputId: "sauna",
    cardName: "Extras Premium",
  },
  {
    label: "Patio",
    keywords: ["patio", "terraza", "courtyard"],
    sectionKey: "premiumFeatures",
    inputId: "patio",
    cardName: "Extras Premium",
  },
  {
    label: "Gimnasio",
    keywords: ["gimnasio", "gym", "fitness"],
    sectionKey: "premiumFeatures",
    inputId: "gym",
    cardName: "Extras Premium",
  },
  {
    label: "Zona Deportiva",
    keywords: ["deportes", "sports", "padel", "tenis"],
    sectionKey: "premiumFeatures",
    inputId: "sportsArea",
    cardName: "Extras Premium",
  },
  {
    label: "Zona Infantil",
    keywords: ["infantil", "ninos", "children", "parque"],
    sectionKey: "premiumFeatures",
    inputId: "childrenArea",
    cardName: "Extras Premium",
  },
  {
    label: "Transporte Público",
    keywords: ["transporte", "metro", "bus", "cercano"],
    sectionKey: "premiumFeatures",
    inputId: "nearbyPublicTransport",
    cardName: "Extras Premium",
  },
  {
    label: "Pista de Tenis",
    keywords: ["tenis", "tennis", "pista"],
    sectionKey: "premiumFeatures",
    inputId: "tennisCourt",
    cardName: "Extras Premium",
  },

  // ============================================
  // ESPACIOS ADICIONALES (additionalSpaces)
  // ============================================
  {
    label: "Terraza",
    keywords: ["terraza", "balcon", "terrace"],
    sectionKey: "additionalSpaces",
    inputId: "terrace",
    cardName: "Espacios",
  },
  {
    label: "Tamaño Terraza",
    keywords: ["metros terraza", "tamano terraza"],
    sectionKey: "additionalSpaces",
    inputId: "terraceSize",
    cardName: "Espacios",
  },
  {
    label: "Bodega",
    keywords: ["bodega", "wine cellar", "vino"],
    sectionKey: "additionalSpaces",
    inputId: "wineCellar",
    cardName: "Espacios",
  },
  {
    label: "Tamaño Salón",
    keywords: ["salon", "living room", "estar"],
    sectionKey: "additionalSpaces",
    inputId: "livingRoomSize",
    cardName: "Espacios",
  },
  {
    label: "Número de Balcones",
    keywords: ["balcones", "balcony"],
    sectionKey: "additionalSpaces",
    inputId: "balconyCount",
    cardName: "Espacios",
  },
  {
    label: "Armarios Empotrados",
    keywords: ["armarios", "empotrados", "closets", "wardrobes"],
    sectionKey: "additionalSpaces",
    inputId: "builtInWardrobes",
    cardName: "Espacios",
  },

  // ============================================
  // MATERIALES (materials)
  // ============================================
  {
    label: "Tipo de Suelo",
    keywords: ["suelo", "floor", "parquet", "tarima", "baldosa"],
    sectionKey: "materials",
    inputId: "mainFloorType",
    cardName: "Materiales",
  },
  {
    label: "Persianas",
    keywords: ["persianas", "shutters", "estores"],
    sectionKey: "materials",
    inputId: "shutterType",
    cardName: "Materiales",
  },
  {
    label: "Carpintería",
    keywords: ["carpinteria", "madera", "pvc", "aluminio"],
    sectionKey: "materials",
    inputId: "carpentryType",
    cardName: "Materiales",
  },
  {
    label: "Tipo de Ventanas",
    keywords: ["ventanas", "windows", "cristales"],
    sectionKey: "materials",
    inputId: "windowType",
    cardName: "Materiales",
  },
  {
    label: "Instalación Eléctrica",
    keywords: ["electricidad", "electrica", "electrical"],
    sectionKey: "materials",
    inputId: "electricityType",
    cardName: "Materiales",
  },
  {
    label: "Estado Electricidad",
    keywords: ["estado electricidad", "electrical status"],
    sectionKey: "materials",
    inputId: "electricityStatus",
    cardName: "Materiales",
  },
  {
    label: "Fontanería",
    keywords: ["fontaneria", "plumbing", "tuberias"],
    sectionKey: "materials",
    inputId: "plumbingType",
    cardName: "Materiales",
  },
  {
    label: "Estado Fontanería",
    keywords: ["estado fontaneria", "plumbing status"],
    sectionKey: "materials",
    inputId: "plumbingStatus",
    cardName: "Materiales",
  },

  // ============================================
  // CONTACTO (contactInfo)
  // ============================================
  {
    label: "Propietarios",
    keywords: ["propietario", "owner", "dueno", "contacto"],
    sectionKey: "contactInfo",
    inputId: "owners",
    cardName: "Contacto",
  },
  {
    label: "Agente",
    keywords: ["agente", "agent", "comercial", "asesor"],
    sectionKey: "contactInfo",
    inputId: "agent",
    cardName: "Contacto",
  },

  // ============================================
  // DESCRIPCIÓN (description)
  // ============================================
  {
    label: "Descripción",
    keywords: ["descripcion", "description", "texto", "detalle"],
    sectionKey: "description",
    inputId: "description",
    cardName: "Descripción",
  },
  {
    label: "Descripción Corta",
    keywords: ["descripcion corta", "resumen", "short description"],
    sectionKey: "description",
    inputId: "shortDescription",
    cardName: "Descripción",
  },

  // ============================================
  // GASTOS (propertyExpenses)
  // ============================================
  {
    label: "IBI",
    keywords: ["ibi", "impuesto", "bienes inmuebles", "tax"],
    sectionKey: "propertyExpenses",
    inputId: "ibi",
    cardName: "Gastos",
  },
  {
    label: "Tasa de Basuras",
    keywords: ["basuras", "garbage", "residuos"],
    sectionKey: "propertyExpenses",
    inputId: "garbageTax",
    cardName: "Gastos",
  },
  {
    label: "Comunidad",
    keywords: ["comunidad", "community", "gastos comunes"],
    sectionKey: "propertyExpenses",
    inputId: "communityFees",
    cardName: "Gastos",
  },
  {
    label: "Derrama",
    keywords: ["derrama", "special assessment"],
    sectionKey: "propertyExpenses",
    inputId: "derrama",
    cardName: "Gastos",
  },
  {
    label: "Electricidad Estimada",
    keywords: ["electricidad", "luz", "electricity"],
    sectionKey: "propertyExpenses",
    inputId: "electricityEstimate",
    cardName: "Gastos",
  },
  {
    label: "Gas Estimado",
    keywords: ["gas", "calefaccion"],
    sectionKey: "propertyExpenses",
    inputId: "gasEstimate",
    cardName: "Gastos",
  },
  {
    label: "Agua Estimada",
    keywords: ["agua", "water"],
    sectionKey: "propertyExpenses",
    inputId: "waterEstimate",
    cardName: "Gastos",
  },
  {
    label: "Seguro de Hogar",
    keywords: ["seguro", "insurance", "hogar"],
    sectionKey: "propertyExpenses",
    inputId: "homeInsurance",
    cardName: "Gastos",
  },

  // ============================================
  // CONDICIONES ALQUILER (rentalTerms)
  // ============================================
  {
    label: "Fianza",
    keywords: ["fianza", "deposit", "deposito"],
    sectionKey: "rentalTerms",
    inputId: "securityDeposit",
    cardName: "Alquiler",
  },
  {
    label: "Garantía Adicional",
    keywords: ["garantia", "aval", "guarantee"],
    sectionKey: "rentalTerms",
    inputId: "additionalGuarantee",
    cardName: "Alquiler",
  },
  {
    label: "Aval Bancario",
    keywords: ["aval bancario", "bank guarantee"],
    sectionKey: "rentalTerms",
    inputId: "bankGuaranteeRequired",
    cardName: "Alquiler",
  },
  {
    label: "Gastos de Gestión",
    keywords: ["gestion", "management", "honorarios"],
    sectionKey: "rentalTerms",
    inputId: "managementFees",
    cardName: "Alquiler",
  },
  {
    label: "Seguro de Impago",
    keywords: ["impago", "non-payment", "seguro alquiler"],
    sectionKey: "rentalTerms",
    inputId: "nonPaymentInsurance",
    cardName: "Alquiler",
  },

  // ============================================
  // PROPIEDADES DE ALQUILER (rentalProperties)
  // ============================================
  {
    label: "Internet",
    keywords: ["internet", "wifi", "fibra"],
    sectionKey: "rentalProperties",
    inputId: "internet",
    cardName: "Alquiler",
  },
  {
    label: "Apto para Estudiantes",
    keywords: ["estudiantes", "students", "universitarios"],
    sectionKey: "rentalProperties",
    inputId: "studentFriendly",
    cardName: "Alquiler",
  },
  {
    label: "Mascotas Permitidas",
    keywords: ["mascotas", "pets", "animales", "perros", "gatos"],
    sectionKey: "rentalProperties",
    inputId: "petsAllowed",
    cardName: "Alquiler",
  },
];

/**
 * Search fields by query
 * Returns fields where label or any keyword contains the search term
 */
export function searchFields(query: string): FieldDefinition[] {
  if (!query.trim()) {
    return PROPERTY_FIELDS;
  }

  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents

  return PROPERTY_FIELDS.filter((field) => {
    const normalizedLabel = field.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalizedLabel.includes(normalizedQuery)) {
      return true;
    }

    return field.keywords.some((keyword) => keyword.includes(normalizedQuery));
  });
}

/**
 * Group fields by card name for display
 */
export function groupFieldsByCard(
  fields: FieldDefinition[],
): Record<string, FieldDefinition[]> {
  return fields.reduce<Record<string, FieldDefinition[]>>((acc, field) => {
    const existing = acc[field.cardName];
    if (existing) {
      existing.push(field);
    } else {
      acc[field.cardName] = [field];
    }
    return acc;
  }, {});
}
