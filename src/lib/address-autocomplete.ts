"use server";

interface NominatimResult {
  address?: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    state?: string;
    suburb?: string;
    quarter?: string;
  };
  lat?: string;
  lon?: string;
}

export interface AddressAutoCompleteResult {
  street?: string;
  addressDetails?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  municipality?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  success: boolean;
  error?: string;
}

export async function autoCompleteAddress(
  street: string,
  city?: string,
  country = "España",
): Promise<AddressAutoCompleteResult> {
  try {
    if (!street || street.trim() === "") {
      return {
        success: false,
        error: "Street address is required",
      };
    }

    // Build full address string
    const addressParts = [street.trim()];
    if (city?.trim()) {
      addressParts.push(city.trim());
    }
    addressParts.push(country);
    const fullAddress = addressParts.join(", ");

    console.log(`🌍 [ADDRESS] Auto-completing address: ${fullAddress}`);

    // Query Nominatim for address details
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      fullAddress,
    )}&limit=1&countrycodes=es&addressdetails=1`;

    const response = await fetch(nominatimUrl);
    const nominatimResults = (await response.json()) as NominatimResult[];

    if (!nominatimResults || nominatimResults.length === 0) {
      console.warn(`⚠️ [ADDRESS] No results found for: ${fullAddress}`);
      return {
        success: false,
        error: "Address not found",
      };
    }

    const result = nominatimResults[0];
    if (!result?.address) {
      return {
        success: false,
        error: "Invalid address data",
      };
    }

    console.log(`✅ [ADDRESS] Nominatim auto-completion successful`);
    console.log(`   └─ Road: ${result.address.road}`);
    console.log(`   └─ City: ${result.address.city ?? result.address.town}`);
    console.log(`   └─ State: ${result.address.state}`);
    console.log(`   └─ Postcode: ${result.address.postcode}`);
    console.log(
      `   └─ Suburb: ${result.address.suburb ?? result.address.quarter}`,
    );

    // Build enriched address data
    const enrichedData: AddressAutoCompleteResult = {
      street: result.address.road ?? street,
      addressDetails: result.address.house_number ?? undefined,
      postalCode: result.address.postcode ?? undefined,
      city: result.address.city ?? result.address.town ?? city,
      province: result.address.state ?? undefined,
      municipality: result.address.city ?? result.address.town ?? city,
      neighborhood:
        result.address.suburb ?? result.address.quarter ?? undefined,
      success: true,
    };

    // Add coordinates if available
    if (result.lat && result.lon) {
      enrichedData.latitude = parseFloat(result.lat);
      enrichedData.longitude = parseFloat(result.lon);
      console.log(`   └─ Coordinates: ${result.lat}, ${result.lon}`);
    }

    return enrichedData;
  } catch (error) {
    console.error(`❌ [ADDRESS] Error auto-completing address:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
