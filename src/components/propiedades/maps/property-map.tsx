"use client";

import React, { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMapsApi } from "~/lib/google-maps-loader";
import type { ListingOverview } from "~/types/listing";
import { PropertyMapCard } from "~/components/propiedades/maps/property-map-card";

interface PropertyMapProps {
  listings: ListingOverview[];
  accountWebsite?: string | null;
}

export const PropertyMap = React.memo(function PropertyMap({
  listings,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!mapRef.current) return;

        // Create map centered on Spain
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
          zoom: 6,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Error al cargar el mapa");
      }
    };

    void initMap();
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Filter listings with valid coordinates
    const validListings = listings.filter(
      (listing) =>
        listing.latitude &&
        listing.longitude &&
        !isNaN(parseFloat(listing.latitude)) &&
        !isNaN(parseFloat(listing.longitude)),
    );

    if (validListings.length === 0) {
      return;
    }

    // Create markers
    const bounds = new google.maps.LatLngBounds();
    const markers = validListings.map((listing) => {
      const lat = parseFloat(listing.latitude!);
      const lng = parseFloat(listing.longitude!);
      const position = { lat, lng };

      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        title: listing.title ?? `${listing.propertyType} - ${listing.city}`,
      });

      // Add click listener for info window
      marker.addListener("click", () => {
        if (!infoWindowRef.current) return;

        const content = PropertyMapCard({ listing });
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
      },
    );
  }, [isLoaded, listings]);

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const validListingsCount = listings.filter(
    (listing) =>
      listing.latitude &&
      listing.longitude &&
      !isNaN(parseFloat(listing.latitude)) &&
      !isNaN(parseFloat(listing.longitude)),
  ).length;

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="h-[600px] w-full rounded-lg border border-border"
        style={{ backgroundColor: "#e5e3df" }}
      />
      <p className="text-sm text-muted-foreground">
        Mostrando {validListingsCount} propiedades en el mapa
        {validListingsCount < listings.length &&
          ` (${listings.length - validListingsCount} sin coordenadas)`}
      </p>
    </div>
  );
});
