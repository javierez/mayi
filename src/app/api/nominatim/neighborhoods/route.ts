import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  tags?: {
    name?: string;
    "name:es"?: string;
    place?: string;
    boundary?: string;
    admin_level?: string;
    population?: string;
    wikidata?: string;
    wikipedia?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface NominatimGeocodeResult {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

// Rate limiting - simple in-memory tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds to avoid Overpass API rate limiting

// Cache for neighborhood results (5 minute TTL)
const neighborhoodCache = new Map<
  string,
  { data: OverpassResponse; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function respectRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

function getCachedResult(cacheKey: string): OverpassResponse | null {
  const cached = neighborhoodCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  // Clean up expired cache entry
  if (cached) {
    neighborhoodCache.delete(cacheKey);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");
    const country = searchParams.get("country") ?? "Spain";

    if (!city) {
      return NextResponse.json(
        { error: "City parameter is required" },
        { status: 400 },
      );
    }

    // Step 1: Get city's OSM relation ID from Nominatim
    console.log(`[Neighborhoods API] Geocoding ${city}, ${country}...`);

    const nominatimUrl =
      `${NOMINATIM_API_URL}/search?` +
      `q=${encodeURIComponent(city)},${encodeURIComponent(country)}` +
      `&format=json&limit=1&featuretype=settlement&addressdetails=0`;

    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Vesta Real Estate Platform (Contact: support@vesta.com)",
      },
    });

    if (!nominatimResponse.ok) {
      throw new Error(`Nominatim API error: ${nominatimResponse.statusText}`);
    }

    const nominatimData =
      (await nominatimResponse.json()) as NominatimGeocodeResult[];

    if (!nominatimData[0]?.osm_id) {
      console.log(`[Neighborhoods API] City not found: ${city}, ${country}`);
      return NextResponse.json({ neighborhoods: [] });
    }

    const osmId = nominatimData[0].osm_id;
    const osmType = nominatimData[0].osm_type;

    // Convert OSM ID to Overpass area ID
    // Relations: +3600000000, Ways: +2400000000, Nodes: not supported as areas
    let areaId: number;
    if (osmType === "relation") {
      areaId = osmId + 3600000000;
    } else if (osmType === "way") {
      areaId = osmId + 2400000000;
    } else {
      console.log(`[Neighborhoods API] City is a node (no area): ${city}`);
      return NextResponse.json({ neighborhoods: [] });
    }

    console.log(
      `[Neighborhoods API] Found OSM ${osmType} ${osmId} -> area ${areaId}`,
    );

    // Check cache with area ID to ensure accuracy
    const cacheKey = `${city}-${country}-${areaId}`;
    const cachedData = getCachedResult(cacheKey);

    let data: OverpassResponse;

    if (cachedData) {
      console.log(`[Neighborhoods API] Using cached data for ${city}`);
      // Use cached data
      data = cachedData;
    } else {
      // Rate limit to respect Overpass API's usage policy
      await respectRateLimit();

      // Build Overpass query using area ID from Nominatim
      // Includes: place tags (suburb, neighbourhood, quarter, borough) + admin boundaries (levels 9-10 for Spain)
      const overpassQuery = `
        [out:json][timeout:25];
        area(${areaId})->.city;
        (
          node(area.city)["place"~"^(suburb|neighbourhood|quarter|borough)$"];
          way(area.city)["place"~"^(suburb|neighbourhood|quarter|borough)$"];
          relation(area.city)["boundary"="administrative"]["admin_level"~"^(9|10)$"];
        );
        out body;
      `;

      const response = await fetch(OVERPASS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Vesta Real Estate Platform (Contact: support@vesta.com)",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          return NextResponse.json(
            {
              error:
                "Demasiadas solicitudes. Por favor, espera unos segundos e intenta de nuevo.",
              retryAfter: 5,
            },
            { status: 429 },
          );
        }
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      data = (await response.json()) as OverpassResponse;

      // Cache the result
      neighborhoodCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    // Filter and format neighborhoods
    const uniqueNeighborhoods = new Map<
      string,
      {
        neighborhood: string;
        city: string;
        municipality: string;
        province: string;
      }
    >();

    data.elements.forEach((element) => {
      const neighborhoodName = element.tags?.["name:es"] ?? element.tags?.name;

      if (neighborhoodName) {
        const key = neighborhoodName.toLowerCase();

        if (!uniqueNeighborhoods.has(key)) {
          // Log what type of element we found for debugging
          const elementType = element.tags?.place
            ? `place=${element.tags.place}`
            : element.tags?.admin_level
              ? `admin_level=${element.tags.admin_level}`
              : "unknown";

          console.log(`  - Found: ${neighborhoodName} (${elementType})`);

          uniqueNeighborhoods.set(key, {
            neighborhood: neighborhoodName,
            city: city,
            municipality: city,
            province: "", // Overpass doesn't provide province directly
          });
        }
      }
    });

    const formattedNeighborhoods = Array.from(
      uniqueNeighborhoods.values(),
    ).sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));

    // Log the response for debugging
    console.log(
      `[Neighborhoods API] Found ${formattedNeighborhoods.length} neighborhoods for ${city}, ${country}`,
    );
    console.log(
      "[Neighborhoods API] Response:",
      JSON.stringify(formattedNeighborhoods, null, 2),
    );

    return NextResponse.json({ neighborhoods: formattedNeighborhoods });
  } catch (error) {
    console.error("Error fetching neighborhoods from Overpass API:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods" },
      { status: 500 },
    );
  }
}
