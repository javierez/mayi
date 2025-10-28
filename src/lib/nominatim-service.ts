/**
 * Nominatim API client service
 * Makes requests through our Next.js API route to avoid CORS issues
 */

export interface FormattedNeighborhood {
  neighborhood: string;
  city: string;
  municipality: string;
  province: string;
}

/**
 * Map country codes to full country names for Overpass API
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  es: "Spain",
  fr: "France",
  de: "Germany",
  it: "Italy",
  pt: "Portugal",
  uk: "United Kingdom",
  us: "United States",
};

/**
 * Fetches neighborhoods (suburbs/districts) for a given city using our API route
 * @param cityName - Name of the city to fetch neighborhoods for
 * @param country - Country code (e.g., 'es' for Spain) or full country name
 * @returns Array of neighborhoods in the specified city
 */
export async function fetchNeighborhoodsByCity(
  cityName: string,
  country = "es"
): Promise<FormattedNeighborhood[]> {
  if (!cityName || cityName.trim().length === 0) {
    return [];
  }

  try {
    // Convert country code to full name if needed
    const countryName = COUNTRY_CODE_MAP[country.toLowerCase()] ?? country;

    const searchParams = new URLSearchParams({
      city: cityName,
      country: countryName,
    });

    const url = `/api/nominatim/neighborhoods?${searchParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { neighborhoods: FormattedNeighborhood[] };

    return data.neighborhoods;
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return [];
  }
}

