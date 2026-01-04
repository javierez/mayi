"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MemoriaLocationCard } from "./MemoriaLocationCard";
import { getLocationMemoriesAction } from "~/server/actions/memoria/memories";
import type { LocationMemoryForMap } from "~/types/memoria";
import { MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { env } from "~/env";

export function MemoriaLocationMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationMemoryForMap[]>([]);
  const [isPending, startTransition] = useTransition();

  // Fetch location memories
  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getLocationMemoriesAction();
        if (result.success && result.data) {
          setLocations(result.data);
        } else if (result.error) {
          console.error("Error fetching locations:", result.error);
        }
      } catch (err) {
        console.error("Error in fetch:", err);
      } finally {
        setIsDataLoaded(true);
      }
    });
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        // Set API options
        setOptions({
          key: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          v: "weekly",
        });

        // Load the maps and marker libraries
        await importLibrary("maps");
        await importLibrary("marker");

        if (!mapRef.current) return;

        // Create map centered on Spain
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setIsMapLoaded(true);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Error al cargar el mapa");
      }
    };

    void initMap();
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (locations.length === 0) return;

    // Filter locations with valid coordinates
    const validLocations = locations.filter(
      (loc) =>
        loc.locationData.lat &&
        loc.locationData.lng &&
        !isNaN(loc.locationData.lat) &&
        !isNaN(loc.locationData.lng)
    );

    if (validLocations.length === 0) return;

    // Create markers
    const bounds = new google.maps.LatLngBounds();
    const markers = validLocations.map((location) => {
      const position = {
        lat: location.locationData.lat,
        lng: location.locationData.lng,
      };

      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        title: location.locationData.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ec4899",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listener for info window
      marker.addListener("click", () => {
        if (!infoWindowRef.current) return;

        const content = MemoriaLocationCard({ location });
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      return marker;
    });

    markersRef.current = markers;

    // Create marker clusterer
    clustererRef.current = new MarkerClusterer({
      map: mapInstanceRef.current,
      markers,
    });

    // Fit map to show all markers
    mapInstanceRef.current.fitBounds(bounds);

    // Ensure minimum zoom level
    const listener = google.maps.event.addListener(
      mapInstanceRef.current,
      "idle",
      () => {
        if (mapInstanceRef.current) {
          const zoom = mapInstanceRef.current.getZoom();
          if (zoom && zoom > 15) {
            mapInstanceRef.current.setZoom(15);
          }
        }
        google.maps.event.removeListener(listener);
      }
    );
  }, [isMapLoaded, locations]);

  // Error state
  if (error) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-2xl bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="rounded-full bg-red-100 p-3">
            <MapPin className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      {/* Map container - always rendered */}
      <div
        ref={mapRef}
        className="h-[calc(100vh-12rem)] w-full rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#e5e3df" }}
      />

      {/* Loading overlay */}
      {(!isMapLoaded || isPending) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-b from-pink-50/90 via-rose-50/90 to-amber-50/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-pink-400 border-r-rose-400" />
              <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-amber-400 border-l-rose-300" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-sm text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Empty state overlay */}
      {isMapLoaded && isDataLoaded && locations.length === 0 && !isPending && (
        <div className="absolute inset-x-0 bottom-20 flex justify-center">
          <div className="mx-4 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-b from-pink-50/95 via-rose-50/95 to-amber-50/95 px-6 py-5 shadow-lg backdrop-blur-sm border border-pink-100/50">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="rounded-full bg-gradient-to-br from-pink-200/60 to-amber-200/60 p-3">
                <MapPin className="h-6 w-6 text-pink-400" />
              </div>
              <h3 className="text-base font-medium text-gray-700">Tu mapa de recuerdos</h3>
              <p className="text-sm text-gray-500">
                Agrega ubicaciones a tus recuerdos para verlas aqui
              </p>
            </div>
            <Link
              href="/memoria"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-amber-400 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Agregar recuerdo
            </Link>
          </div>
        </div>
      )}

      {/* Location count */}
      {isDataLoaded && locations.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {locations.length} {locations.length === 1 ? "lugar" : "lugares"} guardados
        </p>
      )}
    </div>
  );
}
