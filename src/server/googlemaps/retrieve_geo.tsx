"use server";

import { findOrCreateLocation } from "../queries/locations";

// Types for OpenStreetMap Nominatim API response
interface NominatimResponse {
  lat: string;
  lon: string;
  address: {
    neighbourhood?: string; // British spelling - most specific
    borough?: string; // District level
    suburb?: string; // Suburb level
    city?: string;
    province?: string;
    state?: string;
  };
}

// Reverse geocode to get neighborhood from coordinates
export async function getNeighborhoodFromCoordinates(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`;
    console.log(
      "🌍 [NOMINATIM] ========== REVERSE GEOCODE REQUEST ==========",
    );
    console.log("🌍 [NOMINATIM] Fetching neighborhood from coordinates:", {
      lat,
      lng,
    });
    console.log("🌍 [NOMINATIM] API URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0)",
      },
    });

    console.log(
      "🌍 [NOMINATIM] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [NOMINATIM] HTTP error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(
      "📄 [NOMINATIM] ========== RAW API RESPONSE ==========",
    );
    console.log("📄 [NOMINATIM] Response length:", responseText.length, "chars");
    console.log("📄 [NOMINATIM] Full response:", responseText);
    console.log(
      "📄 [NOMINATIM] ========================================",
    );

    const data = JSON.parse(responseText) as NominatimResponse;

    console.log("📋 [NOMINATIM] Parsed address object:", data.address);
    console.log("📋 [NOMINATIM] Available address fields:", {
      neighbourhood: data.address?.neighbourhood,
      borough: data.address?.borough,
      suburb: data.address?.suburb,
      city: data.address?.city,
      province: data.address?.province,
      state: data.address?.state,
    });

    // Priority: neighbourhood (most specific) > borough > suburb > null
    let neighborhood: string | null = null;
    if (data.address?.neighbourhood) {
      neighborhood = data.address.neighbourhood;
      console.log("🏘️ [NOMINATIM] Using neighbourhood:", neighborhood);
    } else if (data.address?.borough) {
      neighborhood = data.address.borough;
      console.log("🏘️ [NOMINATIM] Using borough:", neighborhood);
    } else if (data.address?.suburb) {
      neighborhood = data.address.suburb;
      console.log("🏘️ [NOMINATIM] Using suburb:", neighborhood);
    } else {
      console.log("🏘️ [NOMINATIM] No neighborhood data available");
    }

    console.log("🏘️ [NOMINATIM] Final selected neighborhood:", neighborhood);
    console.log(
      "🌍 [NOMINATIM] ========================================",
    );

    return neighborhood;
  } catch (error) {
    console.error("❌ [NOMINATIM] Error fetching neighborhood:", error);
    return null;
  }
}

// Formatted geocoding data
interface FormattedGeoData {
  latitude: string;
  longitude: string;
  neighborhood?: string;
  neighborhoodId?: number;
  city?: string;
  municipality?: string;
  province?: string;
}

// Retrieve geocoding data from OpenStreetMap Nominatim API
export async function retrieveGeocodingData(
  address: string,
): Promise<FormattedGeoData | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
    console.log(url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RealEstateApp/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as NominatimResponse[];

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    if (!result) {
      return null;
    }

    const addressData = result.address;
    // Priority: neighbourhood > borough > suburb > undefined
    const neighborhood =
      addressData.neighbourhood ?? addressData.borough ?? addressData.suburb;

    let neighborhoodId: number | undefined;
    if (neighborhood) {
      try {
        const municipality = addressData.city ?? "Unknown";
        const province = addressData.province ?? addressData.state ?? "Unknown";

        neighborhoodId = await findOrCreateLocation({
          city: municipality,
          province: province,
          municipality: municipality,
          neighborhood: neighborhood,
          latitude: result.lat,
          longitude: result.lon,
        });
      } catch {
        // Continue without neighborhood ID if there's an error
      }
    }

    const formattedData: FormattedGeoData = {
      latitude: result.lat,
      longitude: result.lon,
      neighborhood,
      neighborhoodId,
      city: addressData.city,
      municipality: addressData.city,
      province: addressData.province ?? addressData.state,
    };

    return formattedData;
  } catch {
    return null;
  }
}
