import type { ContactOffice } from "./types";

// Static description generator that works during initialization
export const generateStaticDescription = (
  propertyType: string,
  neighborhood: string,
  city: string,
  bedrooms: number,
  bathrooms: number,
  squareMeters: number,
) => {
  const parts: string[] = [];

  // Start with property type and location
  parts.push(
    `${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} en ${neighborhood}, ${city}`,
  );

  // Add basic specs
  const specs: string[] = [];
  if (bedrooms || bathrooms) {
    const roomSpecs: string[] = [];
    if (bedrooms) {
      roomSpecs.push(
        bedrooms === 1 ? "una habitación" : `${bedrooms} habitaciones`,
      );
    }
    if (bathrooms) {
      roomSpecs.push(bathrooms === 1 ? "un baño" : `${bathrooms} baños`);
    }
    specs.push(`Cuenta con ${roomSpecs.join(" y ")}`);
  }
  specs.push(`${squareMeters} metros cuadrados`);

  if (specs.length > 0) {
    parts.push(specs.join(", "));
  }

  // Join all parts into one continuous text
  let fullText = parts.join(". ");
  fullText += ".";

  return fullText;
};

// Database to UI value mapping
export const mapDatabaseListingType = (
  dbType?: "Sale" | "Rent",
): "venta" | "alquiler" | null => {
  if (!dbType) return null;
  return dbType === "Sale" ? "venta" : "alquiler";
};

// Map database property types to UI values
export const mapDatabasePropertyType = (
  dbType?: string,
): "piso" | "casa" | "local" | "garaje" | "solar" | null => {
  if (!dbType) return null;

  const mappings: Record<
    string,
    "piso" | "casa" | "local" | "garaje" | "solar"
  > = {
    Piso: "piso",
    Casa: "casa",
    Chalet: "casa",
    Villa: "casa",
    "Local comercial": "local",
    Local: "local",
    Oficina: "local",
    Garaje: "garaje",
    "Plaza de garaje": "garaje",
    Solar: "solar",
    Terreno: "solar",
  };

  return mappings[dbType] ?? "piso"; // Default to piso if not found
};

// Parse contact data with error handling
export const parseContactData = (
  databaseContactProps?: string,
): ContactOffice[] => {
  console.log("🎯 [parseContactData] Input:", {
    hasData: !!databaseContactProps,
    type: typeof databaseContactProps,
    length: databaseContactProps?.length,
    first200Chars: databaseContactProps?.substring?.(0, 200),
  });

  if (!databaseContactProps) {
    console.log(
      "⚠️ [parseContactData] No contact props provided, returning empty array",
    );
    return [];
  }

  try {
    // First try to parse directly (most common case)
    console.log("🔄 [parseContactData] Attempting direct parse");
    const parsed = JSON.parse(databaseContactProps) as {
      offices?: ContactOffice[];
    };
    console.log("✅ [parseContactData] Successfully parsed:", {
      hasOffices: !!parsed.offices,
      officeCount: parsed.offices?.length ?? 0,
      firstOffice: parsed.offices?.[0],
    });
    return parsed.offices ?? [];
  } catch (firstError) {
    console.log(
      "⚠️ [parseContactData] Direct parse failed, trying to handle escaped JSON",
    );

    try {
      // If direct parse fails, try handling escaped JSON
      // This handles cases where the JSON might be double-escaped from the database
      const unescaped = JSON.parse(databaseContactProps) as string;
      console.log(
        "🔧 [parseContactData] Unescaped to:",
        unescaped.substring(0, 200),
      );

      const parsed = JSON.parse(unescaped) as { offices?: ContactOffice[] };
      console.log(
        "✅ [parseContactData] Successfully parsed after unescaping:",
        {
          hasOffices: !!parsed.offices,
          officeCount: parsed.offices?.length ?? 0,
          firstOffice: parsed.offices?.[0],
        },
      );
      return parsed.offices ?? [];
    } catch (secondError) {
      console.error("❌ [parseContactData] All parsing attempts failed");
      console.error("First error:", firstError);
      console.error("Second error:", secondError);
      console.error("Raw contact props that failed:", databaseContactProps);
      return [];
    }
  }
};
