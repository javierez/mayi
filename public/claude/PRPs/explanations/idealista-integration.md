# Idealista Portal Integration - Technical Implementation Plan (v3 - ENHANCED)

## Table of Contents
1. [Overview](#overview)
2. [Architecture Comparison: Fotocasa vs Idealista](#architecture-comparison)
3. [Idealista JSON Schema Structure](#idealista-json-schema-structure)
4. [Database Changes](#database-changes)
5. [File Structure](#file-structure)
6. [Implementation Details](#implementation-details)
7. [Property Type Mappings](#property-type-mappings)
8. [Feature Mappings](#feature-mappings)
9. [Activity Logging](#activity-logging)
10. [UI Components](#ui-components)
11. [FTP Upload System](#ftp-upload-system)
12. [Virtual Tours & Videos](#virtual-tours--videos)
13. [Data Quality & Validation](#data-quality--validation)

---

## Overview

Implement Idealista portal integration for Vesta, enabling real estate agencies to publish their property listings on Idealista.com, one of Spain's two major real estate portals (alongside Fotocasa).

### Key Differences from Fotocasa

| Aspect | Fotocasa | Idealista |
|--------|----------|-----------|
| **Delivery Method** | REST API (HTTP POST/PUT/DELETE) | FTP file upload (JSON) |
| **Granularity** | Single property per API call | ALL properties in one JSON file |
| **Updates** | Individual property updates | Full file replacement |
| **Deletions** | DELETE endpoint per property | Omit property from file = auto-deactivate |
| **Frequency** | Real-time on user action | Batch (Idealista checks FTP every 15 min) |
| **Price Hiding** | Available for Spain | **NOT available for Spain** (only Italy) |
| **Virtual Tours** | Limited | Matterport, Floorfy, 20+ providers |
| **Videos** | Not supported | Up to 6 videos (750MB max each) |

### User-Confirmed Requirements
- **Delivery**: FTP file upload as per Idealista documentation
- **Watermarking**: Same as Fotocasa (apply account watermark to images)
- **Languages**: Spanish-only descriptions
- **Credentials**: Customer code already available (43-char `ilc...` code)

---

## Architecture Comparison

### Fotocasa Flow (Current)
```
User clicks "Publish to Fotocasa"
    ↓
buildFotocasaPayload(listingId)
    ↓
HTTP POST to Fotocasa API
    ↓
Update listing.fotocasa = true
    ↓
Log activity
```

### Idealista Flow (New)
```
User clicks "Enable for Idealista"
    ↓
Update listing.idealista = true (DB only, no API call)
    ↓
Log activity (idealista_published)
    ↓
[Later - Manual or Scheduled]
    ↓
User clicks "Export to Idealista" OR Cron job triggers
    ↓
buildIdealistaExportFile(accountId)
    ↓
Generate JSON with ALL idealista-enabled listings
    ↓
Upload to FTP server
    ↓
Log activity (idealista_exported)
```

---

## Idealista JSON Schema Structure

### Top-Level Structure (customer.json)
```json
{
  "customerCode": "ilc0000000000000000000000000000000000000000",
  "customerCountry": "Spain",
  "customerReference": "Agency Internal Ref",
  "customerSendDate": "2024/01/15 10:30:00",
  "customerContact": {
    "contactName": "Inmobiliaria XYZ",
    "contactEmail": "info@agency.com",
    "contactPrimaryPhonePrefix": "34",
    "contactPrimaryPhoneNumber": "912345678",
    "contactSecondaryPhonePrefix": "34",
    "contactSecondaryPhoneNumber": "600123456"
  },
  "customerProperties": [
    { /* property 1 */ },
    { /* property 2 */ }
  ]
}
```

**IMPORTANT**:
- `customerCountry` must be `"Spain"`, `"Italy"`, or `"Portugal"` (NOT `"es"`, `"it"`, `"pt"`)
- `customerCode` must match pattern `^ilc([a-z]|[0-9]){40}$`

### Property Structure (property.json)
```json
{
  "propertyCode": "REF-001",
  "propertyReference": "Agency Ref",
  "propertyVisibility": "idealista",
  "propertyUrl": "https://agency.com/property/REF-001",
  "propertyOperation": {
    "operationType": "sale",
    "operationPrice": 350000,
    "operationPriceCommunity": 150,
    "operationPriceParking": 25000
  },
  "propertyAddress": {
    "addressVisibility": "street",
    "addressStreetName": "Calle Mayor",
    "addressStreetNumber": "15",
    "addressBlock": "B",
    "addressStair": "1",
    "addressFloor": "3",
    "addressDoor": "A",
    "addressUrbanization": "Urbanización Los Pinos",
    "addressPostalCode": "28001",
    "addressNsiCode": "280796",
    "addressTown": "Madrid",
    "addressCountry": "Spain",
    "addressCoordinatesPrecision": "exact",
    "addressCoordinatesLatitude": 40.4168,
    "addressCoordinatesLongitude": -3.7038
  },
  "propertyFeatures": {
    "featuresType": "flat",
    "featuresAreaConstructed": 85,
    "featuresAreaUsable": 75,
    "featuresBathroomNumber": 2,
    "featuresBedroomNumber": 3,
    "featuresRooms": 5
  },
  "propertyDescriptions": [
    {
      "descriptionLanguage": "spanish",
      "descriptionText": "Piso luminoso en el centro..."
    }
  ],
  "propertyImages": [
    {
      "imageUrl": "https://...",
      "imageOrder": 1,
      "imageLabel": "living"
    }
  ],
  "propertyVideos": [
    {
      "videoUrl": "https://...",
      "videoOrder": 1
    }
  ],
  "propertyVirtualTours": {
    "virtualTour3D": {
      "virtualTour3DType": "matterport",
      "virtualTourUrl": "https://..."
    }
  },
  "propertyContact": {
    "contactName": "Agente Juan",
    "contactEmail": "juan@agency.com",
    "contactPrimaryPhonePrefix": "34",
    "contactPrimaryPhoneNumber": "612345678"
  }
}
```

**CRITICAL NOTES**:
- `propertyOperation` is a **singular object**, NOT an array
- `addressCountry` must be `"Spain"`, `"Italy"`, or `"Portugal"`
- `descriptionLanguage` must be `"spanish"` (NOT `"es"`)
- Coordinates use `addressCoordinatesLatitude` (with 's')

---

## Database Changes

### File: `src/server/db/schema.ts`

#### Add to `listings` table:
```typescript
// Idealista-specific settings
idAddressVisibility: varchar("id_address_visibility", { length: 10 }), // "full" | "street" | "hidden"
idCoordinatesPrecision: varchar("id_coordinates_precision", { length: 10 }), // "exact" | "moved"

// Rental-specific fields (only for rent operations)
rentalType: varchar("rental_type", { length: 20 }), // "residential" | "seasonal" | "short_term" - MUTUALLY EXCLUSIVE
shortTermLicense: varchar("short_term_license", { length: 100 }), // Required if rentalType = "short_term"

// Sale-specific fields (only for sale operations)
occupationStatus: varchar("occupation_status", { length: 20 }), // "free" | "tenanted" | "bare_ownership" | "illegally_occupied"

// Catalonia-specific (mandatory for rentals in Catalonia)
priceReferenceIndex: decimal("price_reference_index", { precision: 10, scale: 2 }), // 0.01-10000, mandatory for Catalonia rentals
```

**Note**:
- The `idealista` boolean already exists in the schema
- The `idealistaProps` JSONB field already exists for additional settings
- **NO `idPriceVisibility`** - Price hiding is NOT available for Spain per Idealista docs

**Rental Type Exclusivity Rule**:
- Only ONE of these can be true: `featuresResidential`, `featuresSeasonalRental`, `featuresShortTerm`
- If `featuresShortTerm: true`, then `featuresShortTermLicense` is REQUIRED

**Catalonia Price Reference Index**:
- MANDATORY for all rentals in Catalonia
- Detected by postal code: 08XXX, 17XXX, 25XXX, 43XXX

### Visibility Options (Verified from Idealista Documentation)

#### Address Visibility (`addressVisibility`)
- `"full"` - Show complete address with street number
- `"street"` - Show street name only (no number) - **DEFAULT**
- `"hidden"` - Hide address, show only zone/area

#### Coordinates Precision (`addressCoordinatesPrecision`)
- `"exact"` - Exact location on map
- `"moved"` - Slightly offset location for privacy

#### Property Visibility (`propertyVisibility`)
- `"idealista"` - Property visible on Idealista search engine - **DEFAULT**
- `"microsite"` - Property only on real estate agency microsite
- `"private"` - Property not published, only customer can see it

---

## File Structure

```
src/server/portals/
├── fotocasa.tsx              # Existing Fotocasa integration
├── idealista.tsx             # NEW - Main Idealista service (~800-1000 lines)
└── idealista-mappings.ts     # NEW - Type and feature mappings (~500 lines)

src/types/
└── listing-activity-details.ts  # MODIFY - Add Idealista activity types

src/lib/constants/
└── listing-activity-actions.ts  # MODIFY - Add Idealista action constants

src/lib/formatters/
└── activity-formatter.ts        # MODIFY - Add Idealista activity labels

src/server/queries/
└── log-activity.ts              # MODIFY - Add Idealista logging functions

src/server/utils/
└── ftp-client.ts                # NEW - FTP upload utility

src/components/propiedades/detail/
└── portal-selection.tsx         # MODIFY - Add Idealista settings panel
```

---

## Implementation Details

### File 1: `src/server/portals/idealista-mappings.ts`

```typescript
// ============================================
// COUNTRY & LANGUAGE CONSTANTS
// ============================================

/**
 * Idealista country codes - MUST use full names
 */
export const IDEALISTA_COUNTRIES = {
  es: "Spain",
  pt: "Portugal",
  it: "Italy",
} as const;

export type IdealistaCountry = "Spain" | "Italy" | "Portugal";

/**
 * Idealista description languages - MUST use full names
 */
export const DESCRIPTION_LANGUAGES = {
  es: "spanish",
  ca: "catalan",
  en: "english",
  de: "german",
  fr: "french",
  it: "italian",
  pt: "portuguese",
  ru: "russian",
  zh: "chinese",
  fi: "finnish",
  nl: "dutch",
  pl: "polish",
  ro: "romanian",
  sv: "swedish",
  da: "danish",
  no: "norway",
  el: "greek",
  uk: "ukrainian",
} as const;

export type IdealistaDescriptionLanguage =
  | "spanish" | "catalan" | "english" | "german" | "french"
  | "italian" | "portuguese" | "russian" | "chinese"
  | "finnish" | "dutch" | "polish" | "romanian" | "swedish"
  | "danish" | "norway" | "greek" | "ukrainian";

// ============================================
// PROPERTY TYPE MAPPINGS
// ============================================

/**
 * Vesta property types to Idealista featuresType mapping
 * Source: idealista/homes.json, premises.json, land.json, etc.
 */
export const PROPERTY_TYPE_MAPPING: Record<string, string> = {
  // Housing types (homes.json)
  piso: "flat",
  casa: "house",
  chalet: "house_independent",

  // Commercial types (premises.json)
  local: "premises_commercial",
  "local comercial": "premises_commercial",
  nave: "premises_industrial",

  // Office types (offices.json)
  oficina: "office",

  // Land types (land.json)
  solar: "land_urban",
  terreno: "land",
  finca: "land_countrybuildable",

  // Garage types (garage.json)
  garaje: "garage",
  parking: "garage",

  // Storage types (storage.json)
  trastero: "storage",

  // Building type (building.json)
  edificio: "building",
};

/**
 * Vesta property subtypes to Idealista featuresType
 * More specific mappings based on propertySubtype
 */
export const PROPERTY_SUBTYPE_MAPPING: Record<string, string> = {
  // Flat subtypes
  "Piso": "flat",
  "Apartamento": "flat",
  "Ático": "flat",  // Set featuresPenthouse: true
  "Dúplex": "flat", // Set featuresDuplex: true
  "Estudio": "flat", // Set featuresStudio: true
  "Bajo": "flat",
  "Loft": "flat",

  // House subtypes
  "Casa": "house",
  "Casa adosada": "house_terraced",
  "Casa pareada": "house_semidetached",
  "Chalet": "house_independent",
  "Chalet independiente": "house_independent",
  "Villa": "house_villa", // Italy only
  "Casa rústica": "rustic_house",
  "Finca rústica": "rustic",
  "Bungalow": "house",

  // Spain-specific rustic types
  "Masía": "rustic_masia",
  "Cortijo": "rustic_cortijo",
  "Casa de pueblo": "rustic_village",
  "Palacio": "rustic_palace",
  "Castillo": "rustic_castle",
  "Torre": "rustic_torre",
  "Caserón": "rustic_caseron",
  "Terrera": "rustic_terrera",
  "Casa rural": "rustic_rural",

  // Land subtypes
  "Suelo urbano": "land_urban",
  "Suelo residencial": "land_urban",
  "Suelo industrial": "land_urban",
  "Suelo rústico": "land_countrynonbuildable",
  "Suelo urbanizable": "land_countrybuildable",

  // Premises subtypes
  "Local comercial": "premises_commercial",
  "Nave industrial": "premises_industrial",
  "Local": "premises",

  // Room rental
  "Habitación": "room_shared_flat",
};

/**
 * Special property flags based on subtype
 */
export function getPropertyFlags(subtype: string | null): Record<string, boolean> {
  if (!subtype) return {};

  const flags: Record<string, boolean> = {};
  const lower = subtype.toLowerCase();

  if (lower.includes("ático") || lower.includes("penthouse")) {
    flags.featuresPenthouse = true;
  }
  if (lower.includes("dúplex") || lower.includes("duplex")) {
    flags.featuresDuplex = true;
  }
  if (lower.includes("estudio") || lower.includes("studio")) {
    flags.featuresStudio = true;
  }

  return flags;
}

// ============================================
// OPERATION TYPE MAPPING
// ============================================

/**
 * Vesta listingType to Idealista operationType
 * Source: idealista/rules.json enumOperationType
 */
export const OPERATION_TYPE_MAPPING: Record<string, "sale" | "rent" | "rentToOwn"> = {
  Sale: "sale",
  Rent: "rent",
  RentWithOption: "rentToOwn",
  // Note: Transfer and RoomSharing don't have direct Idealista equivalents
};

// ============================================
// CONSERVATION STATUS MAPPING
// ============================================

/**
 * Vesta conservationStatus to Idealista featuresConservation
 * Source: idealista/features.json featuresConservation
 *
 * Vesta values (smallint):
 * 1='Bueno' | 2='Muy bueno' | 3='Como nuevo' | 4='A reformar' | 6='Reformado'
 *
 * Idealista values (string enum):
 * "new" | "good" | "toRestore" | "fully_reformed"
 *
 * NOTES:
 * - "new" only for NEW DEVELOPMENT properties, not secondhand
 * - "fully_reformed" only for ITALY (for Casa.it integration)
 * - "new_development_in_construction" and "new_development_finished" only for Italy
 */
export const CONSERVATION_STATUS_MAPPING: Record<number, string> = {
  1: "good",        // Bueno → good
  2: "good",        // Muy bueno → good
  3: "good",        // Como nuevo → good (can't use "new" for secondhand)
  4: "toRestore",   // A reformar → toRestore
  6: "good",        // Reformado → good (can't use "fully_reformed" for Spain)
};

// ============================================
// ENERGY CERTIFICATE RATING MAPPING
// ============================================

/**
 * Idealista energy certificate ratings
 * Source: idealista/features.json featuresEnergyCertificateRating
 */
export const ENERGY_RATING_VALUES = [
  "A", "A+", "A1", "A2", "A3", "A4",
  "B", "B-",
  "C", "D", "E", "F", "G",
  "exempt", "inProcess", "unknown"
] as const;

export type IdealistaEnergyRating = typeof ENERGY_RATING_VALUES[number];

/**
 * Vesta energyConsumptionScale to Idealista featuresEnergyCertificateRating
 */
export const ENERGY_RATING_MAPPING: Record<string, IdealistaEnergyRating> = {
  "A+": "A+",
  "A": "A",
  "B": "B",
  "C": "C",
  "D": "D",
  "E": "E",
  "F": "F",
  "G": "G",
};

/**
 * Vesta energyCertificateStatus to Idealista featuresEnergyCertificateRating
 */
export const ENERGY_STATUS_MAPPING: Record<string, IdealistaEnergyRating> = {
  disponible: "A",      // Will use actual scale if available
  en_tramite: "inProcess",
  pendiente: "unknown",
  no_indicado: "unknown",
  exento: "exempt",
};

// ============================================
// HEATING TYPE MAPPING
// ============================================

/**
 * Idealista heating types
 * Source: idealista/features.json featuresHeatingType
 */
export const HEATING_TYPE_VALUES = [
  "centralGas",
  "centralFuelOil",
  "centralOther",
  "individualGas",
  "individualPropaneButane",
  "individualElectric",
  "individualAirConditioningHeatPump",
  "individualOther",
  "noHeating"
] as const;

export type IdealistaHeatingType = typeof HEATING_TYPE_VALUES[number];

/**
 * Vesta heatingType to Idealista featuresHeatingType
 */
export const HEATING_TYPE_MAPPING: Record<string, IdealistaHeatingType> = {
  "gas natural": "centralGas",
  "Gas natural": "centralGas",
  "gas ciudad": "centralGas",
  "calefacción central": "centralOther",
  "Calefacción central": "centralOther",
  "central": "centralOther",
  "gasoil": "centralFuelOil",
  "gasóleo": "centralFuelOil",
  "eléctrica": "individualElectric",
  "Eléctrica": "individualElectric",
  "electrico": "individualElectric",
  "radiadores eléctricos": "individualElectric",
  "gas": "individualGas",
  "gas individual": "individualGas",
  "propano": "individualPropaneButane",
  "butano": "individualPropaneButane",
  "bomba de calor": "individualAirConditioningHeatPump",
  "aerotermia": "individualAirConditioningHeatPump",
  "suelo radiante": "individualOther",
  "sin calefacción": "noHeating",
  "no tiene": "noHeating",
};

// ============================================
// ORIENTATION MAPPING
// ============================================

/**
 * Vesta orientation to Idealista orientation booleans
 * Idealista uses separate boolean flags for each direction
 */
export function mapOrientation(orientation: string | null): {
  featuresOrientationNorth?: boolean;
  featuresOrientationSouth?: boolean;
  featuresOrientationEast?: boolean;
  featuresOrientationWest?: boolean;
} {
  if (!orientation) return {};

  const lower = orientation.toLowerCase();
  const result: Record<string, boolean> = {};

  if (lower.includes("norte") || lower.includes("north") || lower === "n") {
    result.featuresOrientationNorth = true;
  }
  if (lower.includes("sur") || lower.includes("south") || lower === "s") {
    result.featuresOrientationSouth = true;
  }
  if (lower.includes("este") || lower.includes("east") || lower === "e") {
    result.featuresOrientationEast = true;
  }
  if (lower.includes("oeste") || lower.includes("west") || lower === "o" || lower === "w") {
    result.featuresOrientationWest = true;
  }

  return result;
}

// ============================================
// ADDRESS VISIBILITY MAPPING
// ============================================

/**
 * Idealista address visibility options
 * Source: idealista/example.json
 */
export type IdealistaAddressVisibility = "full" | "street" | "hidden";

/**
 * Idealista coordinates precision
 */
export type IdealistaCoordinatesPrecision = "exact" | "moved";

/**
 * Idealista property visibility options
 * Source: idealista/rules.json enumPropertyVisibility
 */
export type IdealistaPropertyVisibility = "idealista" | "microsite" | "private";

// ============================================
// IMAGE LABEL MAPPING
// ============================================

/**
 * Complete Idealista image labels
 * Source: idealista/images.json
 *
 * NOTE: Field is called "imageLabel", NOT "imageTag"!
 */
export const IDEALISTA_IMAGE_LABELS = [
  "appraisalplan",
  "archive",
  "atmosphere",
  "balcony",
  "basement",
  "bathroom",
  "bedroom",
  "buildingwork",
  "cellar",
  "communalareas",
  "corridor",
  "details",
  "dining_room",
  "energycertificate",
  "facade",
  "garage",
  "garden",
  "gateway",
  "hall",
  "kitchen",
  "land",
  "lifts",
  "living",
  "loft",
  "mates",
  "meeting_room",
  "office",
  "open_plan",
  "patio",
  "penthouse",
  "plan",
  "pool",
  "porch",
  "pressphoto",
  "reception",
  "room",
  "shop_window",
  "staircase",
  "storage",
  "storage_space",
  "studio",
  "surroundings",
  "terrace",
  "unknown",
  "views",
  "waitingroom",
  "walk_in_wardrobe"
] as const;

export type IdealistaImageLabel = typeof IDEALISTA_IMAGE_LABELS[number];

/**
 * Vesta image tags to Idealista imageLabel
 */
export const IMAGE_LABEL_MAPPING: Record<string, IdealistaImageLabel> = {
  // Spanish to Idealista
  salon: "living",
  salón: "living",
  living: "living",
  comedor: "dining_room",
  habitacion: "bedroom",
  habitación: "bedroom",
  dormitorio: "bedroom",
  cocina: "kitchen",
  bano: "bathroom",
  baño: "bathroom",
  aseo: "bathroom",
  terraza: "terrace",
  balcon: "balcony",
  balcón: "balcony",
  exterior: "facade",
  fachada: "facade",
  jardin: "garden",
  jardín: "garden",
  piscina: "pool",
  garaje: "garage",
  parking: "garage",
  plano: "plan",
  vistas: "views",
  vista: "views",
  entrada: "hall",
  recibidor: "hall",
  pasillo: "corridor",
  escalera: "staircase",
  ascensor: "lifts",
  zonas_comunes: "communalareas",
  trastero: "storage",
  sotano: "basement",
  sótano: "basement",
  bodega: "cellar",
  atico: "penthouse",
  ático: "penthouse",
  despacho: "office",
  oficina: "office",
  patio: "patio",
  porche: "porch",
  certificado_energetico: "energycertificate",
  detalles: "details",
  ambiente: "atmosphere",
  alrededores: "surroundings",
  vestidor: "walk_in_wardrobe",
  loft: "loft",
  estudio: "studio",
  recepcion: "reception",
  recepción: "reception",
  sala_reuniones: "meeting_room",
  escaparate: "shop_window",
  terreno: "land",
  archivo: "archive",
  obra: "buildingwork",
  portal: "gateway",
  sala_espera: "waitingroom",

  // English fallbacks
  livingroom: "living",
  bedroom: "bedroom",
  kitchen: "kitchen",
  bathroom: "bathroom",
  terrace: "terrace",
  garden: "garden",
  pool: "pool",
  garage: "garage",
  blueprint: "plan",
  floorplan: "plan",
  views: "views",
  facade: "facade",
  hall: "hall",
  corridor: "corridor",
  storage: "storage",
  basement: "basement",
  office: "office",
  patio: "patio",
  details: "details",
};

/**
 * Map Vesta image tag to Idealista label with fallback
 */
export function mapImageLabel(tag: string | null | undefined): IdealistaImageLabel {
  if (!tag) return "unknown";
  const lower = tag.toLowerCase().replace(/\s+/g, "_");
  return IMAGE_LABEL_MAPPING[lower] ?? "unknown";
}

// ============================================
// VIRTUAL TOUR TYPES
// ============================================

/**
 * Idealista 3D virtual tour types (Matterport, etc.)
 * Source: idealista/instructions.md
 */
export const VIRTUAL_TOUR_3D_TYPES = [
  "matterport",
  "vistaplayer3d"
] as const;

/**
 * Other virtual tour types
 */
export const VIRTUAL_TOUR_TYPES = [
  "immoviewer",
  "spectando",
  "floorplanner",
  "realisti_co",
  "goldmark",
  "floorfy",
  "fastout",
  "panotour",
  "everpano",
  "toursvirtuales360",
  "keepeyeonball",
  "inmovilla",
  "abitarepn",
  "pano2vr",
  "plushglobalmedia",
  "vizor.io",
  "nodalview",
  "gothru",
  "guru360",
  "creotour",
  "habiteo",
  "vitrio",
  "plug-in.studio",
  "ppgstudios",
  "360forcurious",
  "roundme",
  "virtualitour",
  "sircase",
  "divein.studio",
  "casagest24",
  "spherical",
  "gizmo-3d",
  "kuula",
  "emporda360",
  "vista360",
  "clicktours",
  "espaciosvirtuales.es",
  "cloudpano",
  "bizionar",
  "casatour",
  "casa360.net",
  "marzipano",
  "iguide",
  "realtourvision",
  "matterport360"
] as const;

// ============================================
// CURRENT OCCUPATION MAPPING
// ============================================

/**
 * Property occupation status
 * Source: idealista/features.json featuresCurrentOccupation
 *
 * Only for flat, house, country house in Spain/Portugal
 * Only for SALE operation
 */
export const CURRENT_OCCUPATION_VALUES = [
  "free",              // Libre
  "tenanted",          // Alquilado
  "bare_ownership",    // Nuda propiedad (Spain & Italy only)
  "illegally_occupied", // Ocupado ilegalmente (Spain only)
  "not_free",          // No libre (Italy only)
] as const;

export type IdealistaCurrentOccupation = typeof CURRENT_OCCUPATION_VALUES[number];
```

### File 2: `src/server/portals/idealista.tsx`

```typescript
"use server";

import { db } from "~/server/db";
import { listings, properties } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getListingDetailsWithAuth } from "../queries/listing";
import { getPropertyImages } from "../queries/property_images";
import { getAccountWatermarkConfig, getAccountIdForListing } from "../queries/accounts";
import { processAndUploadWatermarkedImages } from "../utils/watermarked-upload";
import { getCurrentUser } from "~/lib/dal";
import {
  IDEALISTA_COUNTRIES,
  DESCRIPTION_LANGUAGES,
  PROPERTY_TYPE_MAPPING,
  PROPERTY_SUBTYPE_MAPPING,
  getPropertyFlags,
  OPERATION_TYPE_MAPPING,
  CONSERVATION_STATUS_MAPPING,
  ENERGY_RATING_MAPPING,
  ENERGY_STATUS_MAPPING,
  HEATING_TYPE_MAPPING,
  mapOrientation,
  mapImageLabel,
  type IdealistaAddressVisibility,
  type IdealistaCoordinatesPrecision,
  type IdealistaCountry,
  type IdealistaDescriptionLanguage,
} from "./idealista-mappings";
import {
  logIdealistaPublished,
  logIdealistaUpdated,
  logIdealistaDeleted,
  logIdealistaExported,
} from "../queries/log-activity";

// ============================================
// TYPE DEFINITIONS
// ============================================

interface IdealistaCustomer {
  customerCode: string;
  customerCountry: IdealistaCountry;
  customerReference?: string;
  customerSendDate?: string;
  customerContact?: IdealistaContact;
  customerProperties: IdealistaProperty[];
}

interface IdealistaProperty {
  propertyCode: string;
  propertyReference?: string;
  propertyVisibility?: "idealista" | "microsite" | "private";
  propertyUrl?: string;
  propertyOperation: IdealistaOperation; // SINGULAR, not array!
  propertyAddress: IdealistaAddress;
  propertyFeatures: IdealistaFeatures;
  propertyDescriptions?: IdealistaDescription[];
  propertyImages?: IdealistaImage[];
  propertyVideos?: IdealistaVideo[];
  propertyVirtualTours?: IdealistaVirtualTours;
  propertyContact?: IdealistaContact;
}

interface IdealistaAddress {
  addressVisibility?: IdealistaAddressVisibility;
  addressStreetName?: string;
  addressStreetNumber?: string;
  addressBlock?: string;
  addressStair?: string;
  addressFloor?: string;
  addressDoor?: string;
  addressUrbanization?: string;
  addressPostalCode?: string;
  addressNsiCode?: string;
  addressTown?: string;
  addressCountry: IdealistaCountry; // "Spain", not "es"!
  addressCoordinatesPrecision?: IdealistaCoordinatesPrecision;
  addressCoordinatesLatitude?: number;
  addressCoordinatesLongitude?: number;
}

interface IdealistaOperation {
  operationType: "sale" | "rent" | "rentToOwn";
  operationPrice: number;
  operationPriceCommunity?: number;
  operationPriceParking?: number;
  operationDepositMonths?: number; // For rentals
  operationPriceTransfer?: number; // For commercial transfers
}

interface IdealistaFeatures {
  featuresType: string;
  featuresAreaConstructed?: number;
  featuresAreaUsable?: number;
  featuresAreaPlot?: number;
  featuresBathroomNumber?: number;
  featuresBedroomNumber?: number;
  featuresRooms?: number;
  featuresBuiltYear?: number;
  // ... many more feature fields
  [key: string]: unknown;
}

interface IdealistaDescription {
  descriptionLanguage: IdealistaDescriptionLanguage; // "spanish", not "es"!
  descriptionText: string;
}

interface IdealistaImage {
  imageUrl: string;
  imageOrder: number;
  imageLabel?: string; // "imageLabel", not "imageTag"!
}

interface IdealistaVideo {
  videoUrl: string;
  videoOrder: number;
}

interface IdealistaVirtualTours {
  virtualTour3D?: {
    virtualTour3DType: "matterport" | "vistaplayer3d";
    virtualTourUrl: string;
  };
  virtualTour?: {
    virtualTourType: string;
    virtualTourUrl: string;
  };
}

interface IdealistaContact {
  contactName?: string;
  contactEmail?: string;
  contactPrimaryPhonePrefix?: string;
  contactPrimaryPhoneNumber?: string;
  contactSecondaryPhonePrefix?: string;
  contactSecondaryPhoneNumber?: string;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Format date for Idealista (YYYY/MM/DD HH:MM:SS)
 */
function formatIdealistaDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Build Idealista property payload for a single listing
 */
export async function buildIdealistaPropertyPayload(
  listingId: number,
  options?: {
    addressVisibility?: IdealistaAddressVisibility;
    coordinatesPrecision?: IdealistaCoordinatesPrecision;
  },
): Promise<IdealistaProperty> {
  const listing = await getListingDetailsWithAuth(listingId);

  // Get and process images with watermarking
  const images = await getPropertyImages(BigInt(listing.propertyId));
  const accountId = await getAccountIdForListing(listingId);
  let processedImages = images;

  if (accountId) {
    const watermarkConfig = await getAccountWatermarkConfig(accountId);
    if (watermarkConfig.watermarkEnabled && watermarkConfig.logoTransparent) {
      // Apply watermarking (same logic as Fotocasa)
      // processedImages = await processAndUploadWatermarkedImages(...)
    }
  }

  // Determine property type and flags
  const propertyType = listing.propertySubtype
    ? PROPERTY_SUBTYPE_MAPPING[listing.propertySubtype] ??
      PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"]
    : PROPERTY_TYPE_MAPPING[listing.propertyType ?? "piso"];

  const propertyFlags = getPropertyFlags(listing.propertySubtype);

  // Build address - Use FULL country name!
  const propertyAddress: IdealistaAddress = {
    addressVisibility: options?.addressVisibility ?? listing.idAddressVisibility ?? "street",
    addressStreetName: listing.street?.split(",")[0]?.trim(),
    addressStreetNumber: extractStreetNumber(listing.street, listing.addressDetails),
    addressFloor: extractFloor(listing.addressDetails),
    addressDoor: extractDoor(listing.addressDetails),
    addressPostalCode: listing.postalCode ?? undefined,
    addressTown: listing.city ?? undefined,
    addressCountry: "Spain", // MUST be "Spain", NOT "es"
    addressCoordinatesPrecision: options?.coordinatesPrecision ?? "exact",
    addressCoordinatesLatitude: listing.latitude ? Number(listing.latitude) : undefined,
    addressCoordinatesLongitude: listing.longitude ? Number(listing.longitude) : undefined,
  };

  // Build operation - SINGULAR object, not array!
  const operationType = OPERATION_TYPE_MAPPING[listing.listingType ?? "Sale"] ?? "sale";
  const propertyOperation: IdealistaOperation = {
    operationType,
    operationPrice: Math.round(Number(listing.price ?? 0)),
    ...(listing.communityFees && { operationPriceCommunity: Math.round(Number(listing.communityFees)) }),
    ...(operationType === "rent" && listing.depositMonths && {
      operationDepositMonths: listing.depositMonths
    }),
  };

  // Build features
  const propertyFeatures: IdealistaFeatures = {
    featuresType: propertyType ?? "flat",
    featuresAreaConstructed: listing.squareMeter ?? undefined,
    featuresAreaUsable: listing.usableArea ?? undefined,
    featuresAreaPlot: listing.plotArea ?? undefined,
    featuresBathroomNumber: listing.bathrooms ? Math.round(Number(listing.bathrooms)) : undefined,
    featuresBedroomNumber: listing.bedrooms ?? undefined,
    featuresRooms: listing.rooms ?? undefined,

    // Property type flags
    ...propertyFlags,

    // Boolean features
    featuresLiftAvailable: listing.hasElevator ?? undefined,
    featuresParkingAvailable: listing.hasGarage ?? undefined,
    featuresStorage: listing.hasStorageRoom ?? undefined,
    featuresGarden: listing.garden ?? undefined,
    featuresPool: listing.pool ?? listing.communityPool ?? listing.privatePool ?? undefined,
    featuresTerrace: listing.terrace ?? undefined,
    featuresBalcony: listing.balcony ?? undefined,
    featuresWardrobes: listing.builtInWardrobes ?? undefined,
    featuresChimney: listing.fireplace ?? undefined,
    featuresConditionedAir: Boolean(listing.airConditioningType) ?? undefined,
    featuresAllowPets: listing.petsAllowed ?? undefined,
    featuresHandicapAdaptedAccess: listing.accessibleAccess ?? undefined,
    featuresHandicapAdaptedUse: listing.accessibleUse ?? undefined,

    // Conservation status
    ...(listing.conservationStatus && {
      featuresConservation: CONSERVATION_STATUS_MAPPING[listing.conservationStatus],
    }),

    // Energy certificate
    ...(listing.energyConsumptionScale && {
      featuresEnergyCertificateRating: ENERGY_RATING_MAPPING[listing.energyConsumptionScale] ??
        ENERGY_STATUS_MAPPING[listing.energyCertificateStatus ?? ""] ?? "unknown",
    }),
    ...(listing.emissionsScale && {
      featuresEnergyCertificateEmissionsRating: listing.emissionsScale,
    }),
    ...(listing.energyConsumptionValue && {
      featuresEnergyCertificatePerformance: listing.energyConsumptionValue,
    }),
    ...(listing.emissionsValue && {
      featuresEnergyCertificateEmissionsValue: listing.emissionsValue,
    }),

    // Heating
    ...(listing.heatingType && {
      featuresHeatingType: HEATING_TYPE_MAPPING[listing.heatingType],
    }),

    // Orientation
    ...mapOrientation(listing.orientation ?? null),

    // Year built (must be 4 digits: 1000-2999)
    ...(listing.yearBuilt && listing.yearBuilt >= 1000 && listing.yearBuilt <= 2999 && {
      featuresBuiltYear: listing.yearBuilt
    }),

    // Furnished (only for rent)
    ...(operationType === "rent" && listing.isFurnished !== null && {
      featuresEquippedKitchen: listing.furnishedKitchen ?? listing.isFurnished,
      // Note: featuresEquippedWithFurniture only processed if featuresEquippedKitchen is true
      ...(listing.isFurnished && { featuresEquippedWithFurniture: true }),
    }),

    // Windows location (only for Spain)
    ...(listing.windowsLocation && {
      featuresWindowsLocation: listing.windowsLocation === "exterior" ? "exterior" : "interior",
    }),

    // Current occupation (only for sale, housing types)
    ...(operationType === "sale" && listing.occupationStatus && {
      featuresCurrentOccupation: listing.occupationStatus,
    }),

    // Price reference index (mandatory for Catalonia rentals)
    ...(operationType === "rent" && listing.priceReferenceIndex && {
      featuresPriceReferenceIndex: listing.priceReferenceIndex,
    }),
  };

  // Build descriptions - Use FULL language name!
  const propertyDescriptions: IdealistaDescription[] = listing.description
    ? [{
        descriptionLanguage: "spanish", // MUST be "spanish", NOT "es"
        descriptionText: listing.description.substring(0, 4000) // Max 4000 chars
      }]
    : [];

  // Build images - Use "imageLabel", NOT "imageTag"!
  const propertyImages: IdealistaImage[] = processedImages
    .filter((img) => img.isActive)
    .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0))
    .slice(0, 200) // Max 200 images
    .map((img, index) => ({
      imageUrl: img.imageUrl,
      imageOrder: index + 1,
      imageLabel: mapImageLabel(img.imageTag), // Use "imageLabel"!
    }));

  // Build videos (if available)
  const propertyVideos: IdealistaVideo[] | undefined = listing.videos?.length
    ? listing.videos
        .slice(0, 6) // Max 6 videos
        .map((video, index) => ({
          videoUrl: video.url,
          videoOrder: index + 1,
        }))
    : undefined;

  // Build virtual tours (if available)
  let propertyVirtualTours: IdealistaVirtualTours | undefined;
  if (listing.virtualTourUrl) {
    const isMatterport = listing.virtualTourUrl.includes("matterport");
    if (isMatterport) {
      propertyVirtualTours = {
        virtualTour3D: {
          virtualTour3DType: "matterport",
          virtualTourUrl: listing.virtualTourUrl,
        },
      };
    } else {
      // Detect tour type from URL
      const tourType = detectVirtualTourType(listing.virtualTourUrl);
      if (tourType) {
        propertyVirtualTours = {
          virtualTour: {
            virtualTourType: tourType,
            virtualTourUrl: listing.virtualTourUrl,
          },
        };
      }
    }
  }

  // Build contact
  const propertyContact: IdealistaContact = {
    contactEmail: listing.agent?.email ?? undefined,
    contactPrimaryPhoneNumber: listing.agent?.phone?.replace(/\D/g, "").slice(0, 12) ?? undefined,
    contactPrimaryPhonePrefix: "34",
  };

  return {
    propertyCode: listing.referenceNumber ?? listingId.toString(),
    propertyReference: listing.referenceNumber ?? undefined,
    propertyVisibility: "idealista",
    propertyUrl: listing.externalUrl ?? undefined,
    propertyOperation, // Singular object
    propertyAddress,
    propertyFeatures,
    propertyDescriptions,
    propertyImages,
    ...(propertyVideos && { propertyVideos }),
    ...(propertyVirtualTours && { propertyVirtualTours }),
    propertyContact,
  };
}

/**
 * Build complete Idealista export file for an account
 */
export async function buildIdealistaExportFile(
  accountId: number,
  customerCode: string,
  options?: {
    customerReference?: string;
  },
): Promise<IdealistaCustomer> {
  // Validate customer code format
  if (!/^ilc([a-z]|[0-9]){40}$/.test(customerCode)) {
    throw new Error(`Invalid customer code format: ${customerCode}`);
  }

  // Get all listings enabled for Idealista
  const idealistaListings = await db
    .select({ listingId: listings.listingId })
    .from(listings)
    .where(
      and(
        eq(listings.accountId, BigInt(accountId)),
        eq(listings.idealista, true),
        eq(listings.isActive, true),
      ),
    );

  // Build property payloads for each listing
  const customerProperties: IdealistaProperty[] = [];

  for (const { listingId } of idealistaListings) {
    try {
      const property = await buildIdealistaPropertyPayload(Number(listingId));
      customerProperties.push(property);
    } catch (error) {
      console.error(`Error building Idealista payload for listing ${listingId}:`, error);
      // Continue with other listings
    }
  }

  return {
    customerCode,
    customerCountry: "Spain", // MUST be "Spain"
    customerReference: options?.customerReference,
    customerSendDate: formatIdealistaDate(new Date()),
    customerProperties,
  };
}

/**
 * Toggle Idealista publication for a listing
 */
export async function toggleIdealistaListing(
  listingId: number,
  enabled: boolean,
  options?: {
    addressVisibility?: IdealistaAddressVisibility;
    coordinatesPrecision?: IdealistaCoordinatesPrecision;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getAccountIdForListing(listingId);
    if (!accountId) {
      throw new Error(`No account found for listing ${listingId}`);
    }

    await db
      .update(listings)
      .set({
        idealista: enabled,
        idAddressVisibility: options?.addressVisibility ?? "street",
        idCoordinatesPrecision: options?.coordinatesPrecision ?? "exact",
        updatedAt: new Date(),
      })
      .where(eq(listings.listingId, BigInt(listingId)));

    const currentUser = await getCurrentUser();
    if (enabled) {
      await logIdealistaPublished({
        listingId: BigInt(listingId),
        userId: currentUser.id,
        addressVisibility: options?.addressVisibility ?? "street",
      });
    } else {
      await logIdealistaDeleted({
        listingId: BigInt(listingId),
        userId: currentUser.id,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling Idealista listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export all Idealista-enabled listings to JSON
 */
export async function exportToIdealista(
  accountId: number,
  customerCode: string,
  uploadToFtp = false,
): Promise<{
  success: boolean;
  jsonContent?: string;
  propertyCount?: number;
  error?: string;
}> {
  try {
    const exportData = await buildIdealistaExportFile(accountId, customerCode);
    const jsonContent = JSON.stringify(exportData, null, 2);

    const currentUser = await getCurrentUser();
    await logIdealistaExported({
      accountId: BigInt(accountId),
      userId: currentUser.id,
      propertyCount: exportData.customerProperties.length,
      uploadedToFtp: uploadToFtp,
    });

    // TODO: If uploadToFtp is true, upload to FTP server

    return {
      success: true,
      jsonContent,
      propertyCount: exportData.customerProperties.length,
    };
  } catch (error) {
    console.error("Error exporting to Idealista:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractStreetNumber(street: string | null, addressDetails: string | null): string | undefined {
  const fullAddress = `${street ?? ""} ${addressDetails ?? ""}`.trim();
  const match = fullAddress.match(/,?\s*(\d+[A-Za-z]?)\s*[,\-]?/);
  return match?.[1];
}

function extractFloor(addressDetails: string | null): string | undefined {
  if (!addressDetails) return undefined;
  const floorMatch = addressDetails.match(/(\d+|bajo|bj|ent|entresuelo|principal)[ºª]?\s*(piso|planta|º)?/i);
  if (floorMatch) {
    const floor = floorMatch[1].toLowerCase();
    if (floor === "bajo" || floor === "bj") return "bj";
    if (floor === "ent" || floor === "entresuelo") return "en";
    if (floor === "principal") return "pr";
    return floorMatch[1];
  }
  return undefined;
}

function extractDoor(addressDetails: string | null): string | undefined {
  if (!addressDetails) return undefined;
  const doorMatch = addressDetails.match(/(?:puerta|pta\.?|letra)\s*([A-Za-z0-9]+)/i);
  return doorMatch?.[1];
}

function detectVirtualTourType(url: string): string | null {
  const urlLower = url.toLowerCase();

  const providers = [
    "matterport", "floorfy", "immoviewer", "nodalview", "kuula",
    "cloudpano", "roundme", "virtualtour", "iguide", "floorplanner"
  ];

  for (const provider of providers) {
    if (urlLower.includes(provider)) {
      return provider;
    }
  }

  return null;
}

/**
 * Detect if a property is in Catalonia based on postal code
 *
 * Catalonia postal codes:
 * - 08XXX: Barcelona province
 * - 17XXX: Girona province
 * - 25XXX: Lleida province
 * - 43XXX: Tarragona province
 *
 * IMPORTANT: For rentals in Catalonia, the Price Reference Index
 * (featuresPriceReferenceIndex) is MANDATORY per Idealista requirements.
 */
function isCataloniaProperty(postalCode: string | null | undefined): boolean {
  if (!postalCode) return false;

  // Normalize: remove spaces and ensure 5 digits
  const normalized = postalCode.replace(/\s/g, "").padStart(5, "0");

  // Catalonia postal code prefixes
  const cataloniaPrefixes = ["08", "17", "25", "43"];
  const prefix = normalized.substring(0, 2);

  return cataloniaPrefixes.includes(prefix);
}

/**
 * Validate that Catalonia rentals have price reference index
 */
function validateCataloniaRental(
  postalCode: string | null | undefined,
  operationType: string,
  priceReferenceIndex: number | null | undefined,
): { valid: boolean; error?: string } {
  if (!isCataloniaProperty(postalCode)) {
    return { valid: true };
  }

  if (operationType !== "rent") {
    return { valid: true };
  }

  if (!priceReferenceIndex || priceReferenceIndex <= 0) {
    return {
      valid: false,
      error: "El Índice de Referencia de Precios es obligatorio para alquileres en Cataluña",
    };
  }

  if (priceReferenceIndex < 0.01 || priceReferenceIndex > 10000) {
    return {
      valid: false,
      error: "El Índice de Referencia de Precios debe estar entre 0.01 y 10000",
    };
  }

  return { valid: true };
}
```

---

## Property Type Mappings

### Homes (homes.json)

| Vesta Type | Vesta Subtype | Idealista Type | Extra Flags |
|------------|---------------|----------------|-------------|
| piso | Piso | `flat` | - |
| piso | Apartamento | `flat` | - |
| piso | Ático | `flat` | `featuresPenthouse: true` |
| piso | Dúplex | `flat` | `featuresDuplex: true` |
| piso | Estudio | `flat` | `featuresStudio: true` |
| piso | Bajo | `flat` | - |
| piso | Loft | `flat` | - |
| casa | Casa | `house` | - |
| casa | Chalet | `house_independent` | - |
| casa | Casa adosada | `house_terraced` | - |
| casa | Casa pareada | `house_semidetached` | - |
| casa | Villa | `house_villa` | Italy only |
| casa | Casa rústica | `rustic_house` | - |
| casa | Finca rústica | `rustic` | - |

### Spain-Specific Rustic Types (homes.json)
Only available for Spain:
- `rustic_rural` - Casa rural
- `rustic_masia` - Masía
- `rustic_cortijo` - Cortijo
- `rustic_terrera` - Terrera
- `rustic_torre` - Torre
- `rustic_caseron` - Caserón
- `rustic_village` - Casa de pueblo
- `rustic_palace` - Palacio (Spain & Portugal)
- `rustic_castle` - Castillo

### Premises (premises.json)

| Vesta Type | Idealista Type |
|------------|----------------|
| local | `premises` |
| local comercial | `premises_commercial` |
| nave industrial | `premises_industrial` |

### Land (land.json)

| Vesta Type | Idealista Type |
|------------|----------------|
| terreno | `land` |
| solar | `land_urban` |
| suelo urbanizable | `land_countrybuildable` |
| suelo rústico | `land_countrynonbuildable` |

### Other Property Types

| Vesta Type | Idealista Type | Schema File |
|------------|----------------|-------------|
| garaje | `garage` | garage.json |
| oficina | `office` | offices.json |
| trastero | `storage` | storage.json |
| edificio | `building` | building.json |
| habitación | `room_shared_flat` | room.json |

---

## Feature Mappings

### Required Features by Property Type

| Property Type | Required Fields |
|---------------|-----------------|
| Homes (flat, house) | `featuresType`, `featuresAreaConstructed`, `featuresBathroomNumber`, `featuresBedroomNumber` OR `featuresRooms` |
| Premises | `featuresType`, `featuresAreaConstructed` |
| Land | `featuresType`, `featuresAreaPlot` |
| Garage | `featuresType` |
| Storage | `featuresType`, `featuresAreaConstructed` |
| Office | `featuresType`, `featuresAreaConstructed` |

### Boolean Features (homes.json)

| Vesta Field | Idealista Field | Notes |
|-------------|-----------------|-------|
| hasElevator | `featuresLiftAvailable` | Only for flat type |
| hasGarage | `featuresParkingAvailable` | |
| hasStorageRoom | `featuresStorage` | |
| garden | `featuresGarden` | |
| pool/communityPool/privatePool | `featuresPool` | |
| terrace | `featuresTerrace` | |
| balcony | `featuresBalcony` | |
| builtInWardrobes | `featuresWardrobes` | |
| fireplace | `featuresChimney` | For rustic houses |
| airConditioningType | `featuresConditionedAir` | |
| petsAllowed | `featuresAllowPets` | |
| accessibleAccess | `featuresHandicapAdaptedAccess` | |
| accessibleUse | `featuresHandicapAdaptedUse` | |
| recommendedForChildren | `featuresRecommendedForChildren` | |

### Rent-Only Features

| Idealista Field | Notes |
|-----------------|-------|
| `featuresEquippedKitchen` | Only for rent operation |
| `featuresEquippedWithFurniture` | Only if `featuresEquippedKitchen: true` |
| `operationDepositMonths` | Deposit in months (0-12) |
| `featuresPriceReferenceIndex` | MANDATORY for Catalonia |
| `featuresResidential` | Regular residential rental |
| `featuresSeasonalRental` | Seasonal rental |
| `featuresShortTerm` | Short-term/vacation rental |
| `featuresShortTermLicense` | Required if `featuresShortTerm: true` |

### Conservation Status Mapping

| Vesta Value | Spanish Label | Idealista Value | Notes |
|-------------|---------------|-----------------|-------|
| 1 | Bueno | `good` | |
| 2 | Muy bueno | `good` | |
| 3 | Como nuevo | `good` | Can't use "new" for secondhand |
| 4 | A reformar | `toRestore` | |
| 6 | Reformado | `good` | Can't use "fully_reformed" for Spain |

**Special values:**
- `"new"` - Only for NEW DEVELOPMENT properties
- `"fully_reformed"` - Only for Italy (Casa.it)
- `"new_development_in_construction"` - Only for Italy
- `"new_development_finished"` - Only for Italy

### Energy Certificate

| Vesta Field | Idealista Field | Notes |
|-------------|-----------------|-------|
| energyConsumptionScale | `featuresEnergyCertificateRating` | A, A+, A1-A4, B, B-, C-G, exempt, inProcess, unknown |
| emissionsScale | `featuresEnergyCertificateEmissionsRating` | Spain only, A-G |
| energyConsumptionValue | `featuresEnergyCertificatePerformance` | 0.01-9999.99 |
| emissionsValue | `featuresEnergyCertificateEmissionsValue` | Spain only, only if rating present |

### Heating Type Mapping

| Vesta Value | Idealista Value |
|-------------|-----------------|
| gas natural | `centralGas` |
| calefacción central | `centralOther` |
| gasoil/gasóleo | `centralFuelOil` |
| eléctrica | `individualElectric` |
| gas individual | `individualGas` |
| propano/butano | `individualPropaneButane` |
| bomba de calor | `individualAirConditioningHeatPump` |
| suelo radiante | `individualOther` |
| sin calefacción | `noHeating` |

### Orientation Mapping

Idealista uses separate boolean flags:

| Vesta orientation | Idealista Fields |
|-------------------|------------------|
| "norte" | `featuresOrientationNorth: true` |
| "sur" | `featuresOrientationSouth: true` |
| "este" | `featuresOrientationEast: true` |
| "oeste" | `featuresOrientationWest: true` |
| "noreste" | `North: true, East: true` |
| "suroeste" | `South: true, West: true` |

### Rental Type Mapping (MUTUALLY EXCLUSIVE)

**IMPORTANT**: Only ONE of these can be true per listing. The database field `rentalType` controls which one is set.

| rentalType Value | Idealista Field | Description |
|------------------|-----------------|-------------|
| `residential` | `featuresResidential: true` | Standard long-term residential rental |
| `seasonal` | `featuresSeasonalRental: true` | Seasonal rental (summer, winter, etc.) |
| `short_term` | `featuresShortTerm: true` | Short-term/vacation rental |

**Short-Term License Requirement**:
- When `featuresShortTerm: true`, the field `featuresShortTermLicense` is REQUIRED
- This is the vacation rental license number (VUT, HUT, etc.)
- For national registries: use `featuresShortTermLicenseNational`

```typescript
// Example mapping
if (listing.rentalType === "short_term") {
  features.featuresShortTerm = true;
  features.featuresShortTermLicense = listing.shortTermLicense; // REQUIRED!
}
```

### Current Occupation Status (Sale Only)

Only for housing types (`flat`, `house`, etc.) in SALE operations:

| Vesta Value | Idealista Value | Description |
|-------------|-----------------|-------------|
| `libre` | `free` | Property is vacant |
| `alquilado` | `tenanted` | Property is currently rented |
| `nuda_propiedad` | `bare_ownership` | Bare ownership (Spain & Italy only) |
| `ocupado_ilegalmente` | `illegally_occupied` | Illegally occupied (Spain only) |

### Garden Type Mapping

| Idealista Value | Description |
|-----------------|-------------|
| `private` | Private garden (exclusive use) |
| `community` | Community/shared garden |

### Parking Space Features

| Idealista Field | Type | Description |
|-----------------|------|-------------|
| `featuresParkingAvailable` | boolean | Has parking included |
| `featuresParkingSpaceCapacity` | integer (1-999) | Number of parking spaces |
| `featuresParkingSpaceArea` | number (1-999) | Area in m² |
| `featuresOutdoorParkingSpace` | boolean | Has outdoor parking |
| `featuresOutdoorParkingSpaceType` | string | `public_parking` or `private_parking` |
| `featuresOutdoorParkingSpaceNumber` | integer (1-99) | Number of outdoor spaces |

### Windows Location (Spain Only)

| Vesta Value | Idealista Value | Description |
|-------------|-----------------|-------------|
| `exterior` | `exterior` | Windows facing outside/street |
| `interior` | `interior` | Windows facing interior patio |

### Energy Certificate Law (Spain Only)

```typescript
// featuresEnergyCertificateLaw
type EnergyCertificateLaw =
  | "law2007"  // RD 47/2007 (pre-2013)
  | "law2013"; // RD 235/2013 (current)
```

### Energy Certificate Type

```typescript
// featuresEnergyCertificateType
type EnergyCertificateType =
  | "project"   // Certificate from project
  | "completed" // Certificate from completed building
  | "both";     // Both certificates
```

---

## Activity Logging

### New Activity Actions

Add to `src/lib/constants/listing-activity-actions.ts`:

```typescript
export const LISTING_ACTIVITY_ACTIONS = {
  // ... existing actions

  // Idealista portal actions
  idealista_published: "idealista_published",
  idealista_updated: "idealista_updated",
  idealista_deleted: "idealista_deleted",
  idealista_exported: "idealista_exported",
} as const;
```

### New Activity Detail Types

Add to `src/types/listing-activity-details.ts`:

```typescript
// Idealista portal activity types
export interface IdealistaPublishedDetails {
  portal: "idealista";
  addressVisibility: "full" | "street" | "hidden";
  coordinatesPrecision?: "exact" | "moved";
}

export interface IdealistaUpdatedDetails {
  portal: "idealista";
  addressVisibility: "full" | "street" | "hidden";
  changes?: string[];
}

export interface IdealistaDeletedDetails {
  portal: "idealista";
  reason?: string;
}

export interface IdealistaExportedDetails {
  portal: "idealista";
  propertyCount: number;
  uploadedToFtp: boolean;
  filename?: string;
}
```

### Activity Formatter Labels

Add to `src/lib/formatters/activity-formatter.ts`:

```typescript
const ACTION_LABELS: Record<string, string> = {
  // ... existing labels

  idealista_published: "Publicado en Idealista",
  idealista_updated: "Actualizado en Idealista",
  idealista_deleted: "Eliminado de Idealista",
  idealista_exported: "Exportado a Idealista",
};
```

---

## UI Components

### Portal Selection Updates

Add Idealista panel to `src/components/propiedades/detail/portal-selection.tsx`:

```tsx
// Idealista Settings Panel
<AccordionItem value="idealista">
  <AccordionTrigger>
    <div className="flex items-center gap-2">
      <span>Idealista</span>
      {listing.idealista && <Badge variant="success">Activo</Badge>}
    </div>
  </AccordionTrigger>
  <AccordionContent>
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <Label>Publicar en Idealista</Label>
        <Switch
          checked={listing.idealista}
          onCheckedChange={handleIdealistaToggle}
        />
      </div>

      {listing.idealista && (
        <>
          {/* Address Visibility */}
          <div className="space-y-2">
            <Label>Visibilidad de dirección</Label>
            <Select
              value={addressVisibility}
              onValueChange={setAddressVisibility}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Dirección completa</SelectItem>
                <SelectItem value="street">Solo calle (sin número)</SelectItem>
                <SelectItem value="hidden">Oculta (solo zona)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coordinates Precision */}
          <div className="space-y-2">
            <Label>Precisión del mapa</Label>
            <Select
              value={coordinatesPrecision}
              onValueChange={setCoordinatesPrecision}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Ubicación exacta</SelectItem>
                <SelectItem value="moved">Ubicación aproximada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info: No price hiding for Spain */}
          <p className="text-sm text-muted-foreground">
            Nota: Idealista no permite ocultar el precio en España.
          </p>

          {/* Rental Type Selection (only for rent operations) */}
          {operationType === "rent" && (
            <div className="space-y-2">
              <Label>Tipo de alquiler</Label>
              <Select
                value={rentalType}
                onValueChange={setRentalType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residencial (largo plazo)</SelectItem>
                  <SelectItem value="seasonal">Temporada</SelectItem>
                  <SelectItem value="short_term">Vacacional / Corta estancia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Short-Term License (required if short_term) */}
          {operationType === "rent" && rentalType === "short_term" && (
            <div className="space-y-2">
              <Label>
                Licencia turística <span className="text-red-500">*</span>
              </Label>
              <Input
                value={shortTermLicense}
                onChange={(e) => setShortTermLicense(e.target.value)}
                placeholder="Ej: VUT-12345, HUT-67890"
              />
              <p className="text-xs text-muted-foreground">
                Obligatorio para alquileres vacacionales
              </p>
            </div>
          )}

          {/* Catalonia Price Reference Index */}
          {isCataloniaProperty && operationType === "rent" && (
            <div className="space-y-2">
              <Label>
                Índice de Referencia de Precios <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={priceReferenceIndex}
                onChange={(e) => setPriceReferenceIndex(parseFloat(e.target.value))}
                placeholder="Ej: 12.50"
              />
              <p className="text-xs text-muted-foreground">
                Obligatorio para alquileres en Cataluña (€/m²/mes)
              </p>
            </div>
          )}

          {/* Occupation Status (only for sale operations) */}
          {operationType === "sale" && (
            <div className="space-y-2">
              <Label>Estado de ocupación</Label>
              <Select
                value={occupationStatus}
                onValueChange={setOccupationStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Libre</SelectItem>
                  <SelectItem value="tenanted">Alquilado</SelectItem>
                  <SelectItem value="bare_ownership">Nuda propiedad</SelectItem>
                  <SelectItem value="illegally_occupied">Ocupado ilegalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Catalonia Warning (without fields visible) */}
          {isCataloniaProperty && operationType === "rent" && !priceReferenceIndex && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              <strong>Atención:</strong> Para alquileres en Cataluña es obligatorio
              indicar el Índice de Referencia de Precios.
            </div>
          )}
        </>
      )}
    </div>
  </AccordionContent>
</AccordionItem>
```

### State Variables Required

```typescript
// In the portal-selection component
const [rentalType, setRentalType] = useState<string | null>(listing.rentalType);
const [shortTermLicense, setShortTermLicense] = useState<string>(listing.shortTermLicense ?? "");
const [priceReferenceIndex, setPriceReferenceIndex] = useState<number | null>(
  listing.priceReferenceIndex ? Number(listing.priceReferenceIndex) : null
);
const [occupationStatus, setOccupationStatus] = useState<string | null>(listing.occupationStatus);

// Derived state
const isCataloniaProperty = useMemo(
  () => isCataloniaPostalCode(listing.postalCode),
  [listing.postalCode]
);

// Helper function
function isCataloniaPostalCode(postalCode: string | null): boolean {
  if (!postalCode) return false;
  const prefix = postalCode.substring(0, 2);
  return ["08", "17", "25", "43"].includes(prefix);
}
```

---

## FTP Upload System

### Package Required
```bash
pnpm add basic-ftp
```

### FTP Client Utility

Create `src/server/utils/ftp-client.ts`:

```typescript
import { Client } from "basic-ftp";

interface FtpConfig {
  host: string;
  user: string;
  password: string;
  secure?: boolean;
}

export async function uploadToIdealistaFtp(
  jsonContent: string,
  customerCode: string,
  ftpConfig: FtpConfig,
): Promise<{ success: boolean; filename: string; error?: string }> {
  const client = new Client();

  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: ftpConfig.secure ?? true,
    });

    // File naming: customerCode must be in filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);
    const filename = `${customerCode}_${timestamp}.json`;

    // Use binary transfer mode as required
    await client.uploadFrom(Buffer.from(jsonContent, "utf-8"), filename);

    return { success: true, filename };
  } catch (error) {
    console.error("FTP upload error:", error);
    return {
      success: false,
      filename: "",
      error: error instanceof Error ? error.message : "Unknown FTP error",
    };
  } finally {
    client.close();
  }
}
```

---

## Virtual Tours & Videos

### Supported Virtual Tour Providers

**3D Tours (virtualTour3D):**
| Provider | Type Value | URL Pattern |
|----------|------------|-------------|
| Matterport | `matterport` | `my.matterport.com`, `matterport.com` |
| VistaPlayer3d | `vistaplayer3d` | `vistaplayer3d.com` |

**Standard Virtual Tours (virtualTour):**
| Provider | Type Value | URL Pattern |
|----------|------------|-------------|
| Floorfy | `floorfy` | `floorfy.com`, `floorfy.es` |
| Nodalview | `nodalview` | `nodalview.com` |
| Kuula | `kuula` | `kuula.co` |
| Cloudpano | `cloudpano` | `cloudpano.com` |
| Roundme | `roundme` | `roundme.com` |
| iGuide | `iguide` | `youriguide.com` |
| Immoviewer | `immoviewer` | `immoviewer.com` |
| Floorplanner | `floorplanner` | `floorplanner.com` |
| Everpano | `everpano` | `everpano.com` |
| Vizor.io | `vizor.io` | `vizor.io` |
| Gothru | `gothru` | `gothru.co` |
| Virtualtour | `virtualitour` | `virtualitour.it` |
| Marzipano | `marzipano` | `marzipano.net` |

**Full Provider Detection Function:**
```typescript
interface VirtualTourDetection {
  is3D: boolean;
  type: string | null;
  supported: boolean;
}

const VIRTUAL_TOUR_3D_PATTERNS: Record<string, RegExp> = {
  matterport: /matterport\.com|my\.matterport/i,
  vistaplayer3d: /vistaplayer3d\.com/i,
};

const VIRTUAL_TOUR_PATTERNS: Record<string, RegExp> = {
  floorfy: /floorfy\.(com|es)/i,
  nodalview: /nodalview\.com/i,
  kuula: /kuula\.co/i,
  cloudpano: /cloudpano\.com/i,
  roundme: /roundme\.com/i,
  iguide: /youriguide\.com/i,
  immoviewer: /immoviewer\.com/i,
  floorplanner: /floorplanner\.com/i,
  everpano: /everpano\.com/i,
  vizor: /vizor\.io/i,
  gothru: /gothru\.co/i,
  virtualitour: /virtualitour\.it/i,
  marzipano: /marzipano\.net/i,
  spectando: /spectando\.com/i,
  habiteo: /habiteo\.com/i,
  realisti_co: /realisti\.co/i,
  panotour: /panotour\./i,
  guru360: /guru360\./i,
  sircase: /sircase\./i,
  spherical: /spherical\./i,
  emporda360: /emporda360\./i,
  vista360: /vista360\./i,
  clicktours: /clicktours\./i,
  casa360: /casa360\.net/i,
  casatour: /casatour\./i,
  bizionar: /bizionar\./i,
  realtourvision: /realtourvision\.com/i,
};

function detectVirtualTourProvider(url: string): VirtualTourDetection {
  // Check 3D tours first (higher priority)
  for (const [type, pattern] of Object.entries(VIRTUAL_TOUR_3D_PATTERNS)) {
    if (pattern.test(url)) {
      return { is3D: true, type, supported: true };
    }
  }

  // Check standard virtual tours
  for (const [type, pattern] of Object.entries(VIRTUAL_TOUR_PATTERNS)) {
    if (pattern.test(url)) {
      return { is3D: false, type, supported: true };
    }
  }

  // Unsupported platforms
  if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i.test(url)) {
    return { is3D: false, type: null, supported: false };
  }

  // Unknown provider - still try to use it
  return { is3D: false, type: null, supported: true };
}
```

**NOT supported (will be rejected):**
- YouTube (`youtube.com`, `youtu.be`)
- Vimeo (`vimeo.com`)
- Dailymotion
- Any streaming platform

### Video Support

- **Formats:** AVI, MOV, WMV, MPEG, RM, MP4, FLV, M2T, 3GP
- **Max per property:** 6 videos
- **Max file size:** 750 MB each
- **URL requirement:** Direct link to video file (not embedded player)

---

## Data Quality & Validation

### Mandatory Fields (Idealista will reject without these)

1. **Price** - Always required
2. **Area** - `featuresAreaConstructed` OR `featuresAreaPlot` (at least one)
3. **Bedrooms** - `featuresBedroomNumber` OR `featuresRooms` (Spain/Portugal)
   - Exception: Not required if `featuresStudio: true` or `featuresConservation: "toRestore"`
4. **Bathrooms** - `featuresBathroomNumber` (for housing types)
5. **Address** - At least one of:
   - Street name + postal code/locality
   - Coordinates (latitude + longitude)

### Automatic Coherence Adjustments by Idealista

Idealista will auto-fill missing data:

| Missing Field | Condition | Auto-filled Value |
|---------------|-----------|-------------------|
| `featuresBathroomNumber` | `featuresAreaConstructed <= 75` | 1 |
| `featuresBathroomNumber` | `featuresAreaConstructed > 75` | 2 |
| `featuresRooms` | `featuresAreaConstructed <= 70` | 2 |
| `featuresRooms` | `featuresAreaConstructed > 70` | 3 |
| `featuresLiftAvailable` | `addressFloor >= 6` | true |
| `featuresAreaConstructed` | Has `featuresAreaUsable` | usable + 20% (Spain/Italy) or +15% (Portugal) |
| `propertyVisibility` | Not sent | "idealista" |
| `addressVisibility` | Not sent | "street" |

### Validation Rules (from rules.json)

#### Customer & Contact Validation
| Field | Pattern/Rule | Notes |
|-------|--------------|-------|
| `customerCode` | `^ilc([a-z]|[0-9]){40}$` | 43 chars total, starts with "ilc" |
| `contactPrimaryPhoneNumber` | `^[0-9]{5,12}$` | Digits only, 5-12 chars |
| `contactPrimaryPhonePrefix` | `^[1-9][0-9]{0,2}$` | Country code, 1-3 digits |
| `contactEmail` | Standard email format | `^(([a-zA-Z0-9-_\\.]))+@...` |

#### Date Format Validation
| Field | Pattern | Example |
|-------|---------|---------|
| `customerSendDate` | `YYYY/MM/DD HH:MM:SS` | `2024/01/15 10:30:00` |
| `featuresAuctionDate` | `YYYY/MM/DD` | `2024/01/15` |
| `availableFrom` | `YYYY-MM` | `2024-03` |

#### Numeric Field Ranges
| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| `operationPrice` | 1 | 999,999,999 | |
| `featuresBuiltYear` | 1000 | 2999 | 4 digits exactly |
| `featuresAreaConstructed` | 1 | 99,999 | m² |
| `featuresAreaPlot` | 1 | 99,999,999 | m² |
| `featuresBathroomNumber` | 1 | 9 | |
| `featuresBedroomNumber` | 0 | 99 | |
| `featuresRooms` | 1 | 99 | |
| `operationDepositMonths` | 0 | 12 | Only for rent |
| `featuresPriceReferenceIndex` | 0.01 | 10,000 | Catalonia only |

#### String Length Limits
| Field | Max Length | Notes |
|-------|------------|-------|
| `descriptionText` | 4,000 chars | Multiline allowed |
| `propertyCode` | 25 chars | Internal reference |
| `propertyReference` | 50 chars | Agency reference |
| `addressStreetName` | 150 chars | |
| `addressStreetNumber` | 10 chars | |
| `addressFloor` | 4 chars | e.g., "bj", "en", "1", "10" |
| `addressDoor` | 4 chars | e.g., "A", "B", "1º" |
| `addressUrbanization` | 100 chars | |
| `contactName` | 100 chars | |
| `imageUrl` | 392 chars | After protocol (http://) |

#### Image Validation
- **Max images per property**: 200
- **URL format**: Must start with `http://` or `https://`
- **URL max length**: 392 characters after protocol
- **Supported formats**: JPG, PNG, GIF (implied by Idealista)

#### Required Fields by Property Type (homes.json)
For `flat`, `house`, and all housing types:
- `featuresType` - REQUIRED
- `featuresAreaConstructed` - REQUIRED
- `featuresBathroomNumber` - REQUIRED
- Either `featuresRooms` OR `featuresBedroomNumber` - REQUIRED

### Dual Listing (Sale + Rent)

To list the same property for both sale AND rent:
- Send the property TWICE in the same file
- Use the SAME `propertyCode`
- Change only `operationType` and `operationPrice`
- This consumes only ONE publication slot

---

## Estimated Implementation Effort

| Component | Lines | Complexity |
|-----------|-------|------------|
| `idealista-mappings.ts` | ~500 | Low |
| `idealista.tsx` | ~800-1000 | Medium |
| Schema updates | ~15 | Low |
| Activity types/constants | ~60 | Low |
| Activity logging functions | ~100 | Low |
| Activity formatter | ~15 | Low |
| Portal selection UI | ~150 | Medium |
| FTP client utility | ~60 | Low |

**Total**: ~1,700-1,900 lines across 8 files

---

## Testing Checklist

### Schema & Format Compliance
- [ ] Country format uses "Spain" (not "es")
- [ ] Description language uses "spanish" (not "es")
- [ ] Coordinates use `addressCoordinatesLatitude` (with 's')
- [ ] `propertyOperation` is singular object (not array)
- [ ] Images use `imageLabel` field (not `imageTag`)
- [ ] Contact uses `contactPrimaryPhoneNumber` (not `contactPhone`)
- [ ] Customer code matches pattern `^ilc([a-z]|[0-9]){40}$`
- [ ] Date format is `YYYY/MM/DD HH:MM:SS`
- [ ] Phone numbers are 5-12 digits only

### Property Mappings
- [ ] Property type mapping for all Vesta types
- [ ] Subtype mapping with flags (ático → penthouse, dúplex → duplex, estudio → studio)
- [ ] Operation type mapping (sale, rent, rentToOwn)
- [ ] Feature mapping (all boolean and numeric fields)
- [ ] Heating type mapping (9 types)
- [ ] Energy certificate rating mapping (A-G, exempt, inProcess, unknown)
- [ ] Orientation mapping (separate boolean flags)

### Required Fields Validation
- [ ] Housing types require: `featuresType`, `featuresAreaConstructed`, `featuresBathroomNumber`
- [ ] Housing types require: `featuresBedroomNumber` OR `featuresRooms`
- [ ] Exception: Not required if `featuresStudio: true` or `featuresConservation: "toRestore"`

### Rental-Specific
- [ ] Rental type exclusivity (only one of: residential, seasonal, short_term)
- [ ] Short-term license required when `rentalType: "short_term"`
- [ ] Catalonia detection by postal code (08XXX, 17XXX, 25XXX, 43XXX)
- [ ] Price reference index required for Catalonia rentals
- [ ] Price reference index validation (0.01-10000)

### Sale-Specific
- [ ] Occupation status mapping (free, tenanted, bare_ownership, illegally_occupied)

### Media
- [ ] Address extraction and visibility
- [ ] Image watermarking (reuse Fotocasa logic)
- [ ] Image URL max 392 chars after protocol
- [ ] Max 200 images per property
- [ ] Virtual tour detection (Matterport as 3D, 40+ other providers)
- [ ] Unsupported platform rejection (YouTube, Vimeo)
- [ ] Video support (max 6, max 750MB)

### UI & UX
- [ ] UI toggle and settings panel
- [ ] Rental type selector (only for rent)
- [ ] Short-term license input (only when short_term selected)
- [ ] Catalonia price reference index input (only for Catalonia rentals)
- [ ] Occupation status selector (only for sale)
- [ ] Catalonia warning displayed when required

### System
- [ ] Activity logging for publish/update/delete/export
- [ ] Export file generation with customerSendDate
- [ ] JSON schema validation against Idealista schemas
- [ ] FTP upload with binary mode
- [ ] Dual listing support (same property, sale + rent)

---

## Changelog

### v3 (2024-11-29) - ENHANCED
- Added 4 new database fields: `rentalType`, `shortTermLicense`, `occupationStatus`, `priceReferenceIndex`
- Added comprehensive validation rules section with patterns from rules.json
- Added rental type exclusivity documentation (residential/seasonal/short_term)
- Added current occupation status mapping for sale properties
- Added Catalonia detection by postal code (08XXX, 17XXX, 25XXX, 43XXX)
- Added comprehensive virtual tour provider detection with URL patterns (40+ providers)
- Enhanced UI Components with rental type selector, short-term license input, occupation status
- Added Catalonia price reference index input component
- Added helper functions: `isCataloniaProperty()`, `validateCataloniaRental()`
- Enhanced testing checklist with categorized sections
- Added garden type mapping (private/community)
- Added parking space features documentation
- Added window location mapping (Spain only)
- Added energy certificate law and type enums

### v2 (2024-01-XX) - CORRECTED
- Fixed `customerCountry` to use "Spain" instead of "es"
- Fixed `descriptionLanguage` to use "spanish" instead of "es"
- Fixed coordinates field names (added 's')
- Fixed `propertyOperation` to be singular object
- Fixed `imageLabel` field name (was `imageTag`)
- Fixed contact phone field names
- Added complete image label mapping (47 labels)
- Added virtual tour support (Matterport, 40+ providers)
- Added video support (6 videos, 750MB max)
- Added missing address fields (block, stair, urbanization, nsiCode, precision)
- Added missing operation fields (depositMonths, priceParking, priceTransfer)
- Added complete energy rating values (A+, A1-A4, B-)
- Added complete heating type values
- Added missing property types (building, room_shared_flat, etc.)
- Added missing home features (balcony, handicap access, etc.)
- Added rent-only features documentation
- Added Catalonia price reference index requirement
- Added data quality coherence rules
- Added dual listing documentation
- Added validation rules and limits



  Summary of what was implemented:

  1. Database schema (src/server/db/schema.ts): Added Idealista-specific fields:
    - idAddressVisibility, idCoordinatesPrecision
    - rentalType, shortTermLicense, occupationStatus
    - priceReferenceIndex (for Catalonia rentals)
  2. Mapping file (src/server/portals/idealista-mappings.ts): ~530 lines with:
    - Property type/subtype mappings
    - Conservation status, energy ratings, heating types
    - Image label mappings (47 labels)
    - Virtual tour provider detection
    - Catalonia postal code validation
  3. Main service file (src/server/portals/idealista.tsx): ~900 lines with:
    - buildIdealistaPropertyPayload() - builds JSON for single property
    - buildIdealistaExportFile() - complete export with all enabled listings
    - toggleIdealistaListing() - enable/disable listings
    - validateListingForIdealista() - validation before export
    - getIdealistaEnabledListings() - get enabled listings
  4. Activity tracking: Added types, constants, labels, and logging functions for Idealista actions
  5. FTP client (src/server/utils/ftp-client.ts): Upload utility with basic-ftp package
  6. Portal selection UI (src/components/propiedades/detail/portal-selection.tsx): Added Idealista panel with address visibility and coordinates precision
  settings
  7. Query updates (src/server/queries/listing.ts): Added Idealista fields to getListingDetails queries