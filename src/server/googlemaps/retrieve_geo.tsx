"use server";

import { findOrCreateLocation } from "../queries/locations";

// Types for OpenStreetMap Nominatim API response
interface NominatimResponse {
  lat: string;
  lon: string;
  address: {
    suburb?: string;
    quarter?: string;
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
    console.log("🌍 [NOMINATIM] Fetching neighborhood from coordinates:", { lat, lng });

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

    const data = (await response.json()) as NominatimResponse;

    const neighborhood = data.address?.suburb ?? data.address?.quarter ?? null;
    console.log("🏘️ [NOMINATIM] Neighborhood found:", neighborhood);

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
    const neighborhood = addressData.suburb;

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
