import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { env } from "~/env";

let isLoaded = false;
let loadPromise: Promise<google.maps.PlacesLibrary> | null = null;

/**
 * Loads the Google Maps JavaScript API with the Places library.
 * This function ensures the API is loaded only once globally.
 *
 * @returns Promise that resolves when the API is loaded
 */
export async function loadGoogleMapsApi(): Promise<google.maps.PlacesLibrary> {
  console.log("📍 [GoogleMapsLoader] loadGoogleMapsApi called");
  console.log("📍 [GoogleMapsLoader] isLoaded:", isLoaded);
  console.log("📍 [GoogleMapsLoader] typeof google:", typeof google);

  // If already loaded and google.maps is available, return immediately
  if (isLoaded && typeof google !== "undefined" && google.maps) {
    console.log("✅ [GoogleMapsLoader] API already loaded, returning existing");
    return Promise.resolve(google.maps.places);
  }

  // If currently loading, return the existing promise
  if (loadPromise) {
    console.log(
      "⏳ [GoogleMapsLoader] Already loading, returning existing promise",
    );
    return loadPromise;
  }

  console.log("🚀 [GoogleMapsLoader] Starting to load Google Maps API...");

  // Start loading
  loadPromise = (async () => {
    try {
      // Set API options first
      setOptions({
        key: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        v: "weekly",
        libraries: ["places"],
      });

      console.log(
        "📦 [GoogleMapsLoader] Options set, importing places library...",
      );

      // Import the places library
      const placesLibrary = await importLibrary("places");

      console.log("✅ [GoogleMapsLoader] Places library imported successfully");

      isLoaded = true;
      return placesLibrary;
    } catch (error) {
      console.error("❌ [GoogleMapsLoader] Failed to load Google Maps:", error);
      loadPromise = null; // Reset so it can be retried
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Checks if the Google Maps API is loaded
 */
export function isGoogleMapsApiLoaded(): boolean {
  const loaded = isLoaded && typeof google !== "undefined" && !!google.maps;
  console.log("🔍 [GoogleMapsLoader] isGoogleMapsApiLoaded:", loaded);
  return loaded;
}
