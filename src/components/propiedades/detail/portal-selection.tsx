"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCcw, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { updateListingWithAuth } from "~/server/queries/listing";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import {
  publishToFotocasa,
  deleteFromFotocasa,
  updateFotocasa,
} from "~/server/portals/fotocasa";
import { savePortalChangesWithActivity } from "~/server/actions/portal-activity";
import {
  type AdevintaPortalId,
  ADEVINTA_PORTAL_IDS,
} from "~/lib/constants/adevinta-portals";
import { triggerIdealistaExport } from "~/app/actions/listing-actions";

interface Platform {
  id: string;
  name: string;
  logo: string;
  isActive: boolean;
  lastSync?: Date;
  status: "active" | "pending" | "error" | "inactive";
  description?: string;
  isDefault?: boolean; // Whether this platform is enabled by default
  visibilityMode?: number; // For Fotocasa visibility mode (1=Exact, 2=Street, 3=Zone)
  hidePrice?: boolean; // For Fotocasa hide price option
}

interface PortalSelectionProps {
  listingId: string;
  onPlatformsChange?: (platforms: Platform[]) => void;
  // Portal fields from getListingDetails
  fotocasa?: boolean;
  idealista?: boolean;
  habitaclia?: boolean;
  milanuncios?: boolean;
  pisoscom?: boolean;
  yaencontre?: boolean;
  enalquiler?: boolean;
  kyero?: boolean;
  spainhouses?: boolean;
  thinkspain?: boolean;
  listglobally?: boolean;
  // Additional listing fields
  publishToWebsite?: boolean;
  hasCartel?: boolean;
  enEscaparate?: boolean;
  hasKeys?: boolean;
  // Fotocasa & Idealista visibility settings (shared - explicit fields from database)
  fcLocationVisibility?: number; // 1=Exact, 2=Street, 3=Zone (used by both Fotocasa and Idealista)
  fcPriceVisibility?: boolean; // true=hidden, false=shown (Fotocasa only)
  // Idealista-specific settings
  idCoordinatesPrecision?: "exact" | "moved";
  // Portal props from database (JSON columns) - Legacy support
  fotocasaProps?: unknown;
  idealistaProps?: unknown;
  habitacliaProps?: unknown;
  milanunciosProps?: unknown;
  pisoscomProps?: unknown;
  yaencontreProps?: unknown;
  enalquilerProps?: unknown;
  kyeroProps?: unknown;
  // Initial state from parent for persistence across tab switches
  initialPlatformStates?: Record<string, boolean>;
  initialVisibilityModes?: Record<string, number>;
  initialHidePriceModes?: Record<string, boolean>;
  onPortalStateChange?: (
    platformStates: Record<string, boolean>,
    visibilityModes: Record<string, number>,
    hidePriceModes: Record<string, boolean>,
  ) => void;
  // Callback when portals are successfully saved to database
  onPortalsSaved?: (updatedPortalValues: {
    fotocasa?: boolean;
    idealista?: boolean;
    habitaclia?: boolean;
    milanuncios?: boolean;
    pisoscom?: boolean;
    yaencontre?: boolean;
    enalquiler?: boolean;
    kyero?: boolean;
    spainhouses?: boolean;
    thinkspain?: boolean;
    listglobally?: boolean;
    publishToWebsite?: boolean;
    hasCartel?: boolean;
    enEscaparate?: boolean;
    hasKeys?: boolean;
    fcLocationVisibility?: number;
    fcPriceVisibility?: boolean;
  }) => void;
}

// Mock default settings - in real app this would come from configuration
const defaultPortalSettings = {
  fotocasa: true, // Fotocasa is enabled by default
  idealista: true, // Idealista is enabled by default
  habitaclia: false, // Habitaclia is disabled by default
  milanuncios: false, // Milanuncios is disabled by default
};

const platformConfig = [
  // Portals Row 1: Main portals (indices 0-3)
  {
    id: "idealista",
    name: "Idealista",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-idealista.png",
    description: "El portal inmobiliario más visitado de España",
    isDefault: defaultPortalSettings.idealista,
  },
  {
    id: "fotocasa",
    name: "Fotocasa",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-fotocasa-min.png",
    description: "Encuentra tu casa ideal con millones de anuncios",
    isDefault: defaultPortalSettings.fotocasa,
    isAdevintaPortal: true,
  },
  {
    id: "habitaclia",
    name: "Habitaclia",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-habitaclia.png",
    description: "Portal especializado en alquiler y venta",
    isDefault: defaultPortalSettings.habitaclia,
  },
  {
    id: "milanuncios",
    name: "Milanuncios",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-milanuncios.png",
    description: "Portal de anuncios clasificados líder en España",
    isDefault: defaultPortalSettings.milanuncios,
  },
  // Portals Row 2: Secondary portals (indices 4-7)
  {
    id: "pisoscom",
    name: "Pisos.com",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo_pisos.png",
    description: "Tu portal inmobiliario de confianza",
    isDefault: false,
    isAdevintaPortal: true,
  },
  {
    id: "yaencontre",
    name: "Yaencontre",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-yaencontre.png",
    description: "Encuentra tu hogar ideal",
    isDefault: false,
  },
  {
    id: "enalquiler",
    name: "EnAlquiler",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-ena.svg",
    description: "Especialistas en alquiler de viviendas",
    isDefault: false,
  },
  {
    id: "kyero",
    name: "Kyero",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/kyerologo.webp",
    description: "Portal inmobiliario internacional",
    isDefault: false,
    isAdevintaPortal: true,
  },
  // Portals Row 3: International Adevinta portals (indices 8-10)
  {
    id: "listglobally",
    name: "ListGlobally",
    logo: "https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo-listglobally.png",
    description: "Distribución global de propiedades",
    isDefault: false,
    isAdevintaPortal: true,
  },
  {
    id: "thinkspain",
    name: "Think Spain",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-thinkspain.png",
    description: "Portal para compradores británicos",
    isDefault: false,
    isAdevintaPortal: true,
  },
  {
    id: "spainhouses",
    name: "Spainhouses",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-spainhouses.png",
    description: "Portal internacional para compradores extranjeros",
    isDefault: false,
    isAdevintaPortal: true,
  },
  // Utility toggles (indices 11-14) - rendered in first row
  {
    id: "publishToWebsite",
    name: "Publicar en Web",
    logo: "/vestazoomin.jpeg",
    description: "Publicar propiedad en el sitio web",
    isDefault: false,
  },
  {
    id: "hasCartel",
    name: "Cartel Colocado",
    logo: "",
    description: "Propiedad con cartel físico",
    isDefault: false,
  },
  {
    id: "enEscaparate",
    name: "En Escaparate",
    logo: "",
    description: "Destacar propiedad en escaparate",
    isDefault: false,
  },
  {
    id: "hasKeys",
    name: "Tiene Llaves",
    logo: "",
    description: "Tenemos las llaves de la propiedad",
    isDefault: false,
  },
];

export function PortalSelection({
  listingId,
  onPlatformsChange,
  fotocasa = false,
  idealista = false,
  habitaclia = false,
  milanuncios = false,
  pisoscom = false,
  yaencontre = false,
  enalquiler = false,
  kyero = false,
  spainhouses = false,
  thinkspain = false,
  listglobally = false,
  publishToWebsite = false,
  hasCartel = false,
  enEscaparate = false,
  hasKeys = false,
  fcLocationVisibility = 1,
  fcPriceVisibility = false,
  idCoordinatesPrecision = "exact",
  fotocasaProps: _fotocasaProps,
  idealistaProps: _idealistaProps,
  habitacliaProps: _habitacliaProps,
  milanunciosProps: _milanunciosProps,
  pisoscomProps: _pisoscomProps,
  yaencontreProps: _yaencontreProps,
  enalquilerProps: _enalquilerProps,
  kyeroProps: _kyeroProps,
  initialPlatformStates,
  initialVisibilityModes,
  initialHidePriceModes,
  onPortalStateChange,
  onPortalsSaved,
}: PortalSelectionProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedPlatformStates, setSavedPlatformStates] = useState<
    Record<string, boolean>
  >({});

  // Use server-side fields directly, with fallback to legacy fotocasaProps if needed
  const [visibilityModes, setVisibilityModes] = useState<
    Record<string, number>
  >(
    initialVisibilityModes ?? {
      fotocasa: fcLocationVisibility ?? 1, // Use database field directly
    },
  );
  const [hidePriceModes, setHidePriceModes] = useState<Record<string, boolean>>(
    initialHidePriceModes ?? {
      fotocasa: fcPriceVisibility ?? false, // Use database field directly
    },
  );
  const [refreshingPlatforms, setRefreshingPlatforms] = useState<
    Record<string, boolean>
  >({});
  const [fotocasaSettingsExpanded, setFotocasaSettingsExpanded] =
    useState(false);
  const [idealistaSettingsExpanded, setIdealistaSettingsExpanded] =
    useState(false);
  const [publishToWebsiteSettingsExpanded, setPublishToWebsiteSettingsExpanded] =
    useState(false);

  // Track failed image loads for debugging and fallback rendering
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(
    new Set(),
  );

  // Idealista-specific settings state (address visibility uses shared fcLocationVisibility)
  // Use explicit database field with fallback to idealistaProps JSON (same pattern as Fotocasa)
  const [idealistaCoordinatesPrecision, setIdealistaCoordinatesPrecision] = useState<
    "exact" | "moved"
  >(
    idCoordinatesPrecision ??
    ((_idealistaProps as { coordinatesPrecision?: "exact" | "moved" })?.coordinatesPrecision) ??
    "exact",
  );

  // Initialize platforms based on portal fields and defaults
  useEffect(() => {
    const initializePlatforms = () => {
      const portalValues = {
        fotocasa,
        idealista,
        habitaclia,
        milanuncios,
        pisoscom,
        yaencontre,
        enalquiler,
        kyero,
        spainhouses,
        thinkspain,
        listglobally,
        publishToWebsite,
        hasCartel,
        enEscaparate,
        hasKeys,
      };

      const initializedPlatforms = platformConfig.map((config) => {
        // Check if we have cached platform state from parent first
        const hasCachedState =
          initialPlatformStates && config.id in initialPlatformStates;
        const isActive = hasCachedState
          ? (initialPlatformStates[config.id] ?? false)
          : (portalValues[config.id as keyof typeof portalValues] ?? false);

        // Use actual database values to determine initial state
        const status: Platform["status"] = isActive ? "active" : "inactive";

        return {
          ...config,
          isActive,
          status,
          lastSync: isActive ? new Date() : undefined,
          visibilityMode:
            config.id === "fotocasa" ? visibilityModes.fotocasa : undefined,
          hidePrice:
            config.id === "fotocasa" ? hidePriceModes.fotocasa : undefined,
        };
      });

      setPlatforms(initializedPlatforms);

      // Only set savedPlatformStates if we don't have cached states from parent
      if (!initialPlatformStates) {
        setSavedPlatformStates(
          initializedPlatforms.reduce(
            (acc, platform) => ({
              ...acc,
              [platform.id]: platform.isActive,
            }),
            {} as Record<string, boolean>,
          ),
        );
      } else {
        // Use the parent's cached states
        setSavedPlatformStates(initialPlatformStates);
      }
    };

    initializePlatforms();
  }, [
    fotocasa,
    idealista,
    habitaclia,
    milanuncios,
    pisoscom,
    yaencontre,
    enalquiler,
    kyero,
    spainhouses,
    thinkspain,
    listglobally,
    publishToWebsite,
    hasCartel,
    enEscaparate,
    hasKeys,
    hidePriceModes.fotocasa,
    visibilityModes.fotocasa,
    initialPlatformStates,
  ]);

  const handlePlatformToggle = (platformId: string, isActive: boolean) => {
    // Group: fotocasa, habitaclia, milanuncios should toggle together
    const groupedPortals = ["fotocasa", "habitaclia", "milanuncios"];
    const isGroupedPortal = groupedPortals.includes(platformId);

    const updatedPlatforms = platforms.map((platform) => {
      // Check if this platform should be updated
      const shouldUpdate = isGroupedPortal
        ? groupedPortals.includes(platform.id) // Update all grouped portals
        : platform.id === platformId; // Update only the clicked platform

      if (shouldUpdate) {
        const status: Platform["status"] = isActive ? "pending" : "inactive";

        return {
          ...platform,
          isActive,
          status,
          lastSync: isActive ? new Date() : undefined,
        };
      }
      return platform;
    });

    setPlatforms(updatedPlatforms);
    onPlatformsChange?.(updatedPlatforms);

    // Set unsaved changes for all portal toggles (enabling or disabling)
    setHasUnsavedChanges(true);

    // Notify parent component to persist platform toggle states
    const platformStates = updatedPlatforms.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.isActive }),
      {} as Record<string, boolean>,
    );
    onPortalStateChange?.(platformStates, visibilityModes, hidePriceModes);
  };

  const handleConfirmChanges = async () => {
    setIsLoading(true);

    try {
      // === ADEVINTA MULTI-PORTAL LOGIC ===
      // Collect ALL enabled Adevinta portals from UI toggles
      const enabledAdevintaPortals = ADEVINTA_PORTAL_IDS.filter((portalId) =>
        platforms.find((p) => p.id === portalId)?.isActive,
      );

      // Previous Adevinta portal states from database
      const previousAdevintaPortals: AdevintaPortalId[] = [];
      if (fotocasa) previousAdevintaPortals.push("fotocasa");
      if (pisoscom) previousAdevintaPortals.push("pisoscom");
      if (kyero) previousAdevintaPortals.push("kyero");
      if (spainhouses) previousAdevintaPortals.push("spainhouses");
      if (thinkspain) previousAdevintaPortals.push("thinkspain");
      if (listglobally) previousAdevintaPortals.push("listglobally");

      // Check if any Adevinta portal changed
      const adevintaPortalsChanged =
        enabledAdevintaPortals.length !== previousAdevintaPortals.length ||
        enabledAdevintaPortals.some((p) => !previousAdevintaPortals.includes(p)) ||
        previousAdevintaPortals.some((p) => !enabledAdevintaPortals.includes(p));

      // Is the listing currently published to Adevinta? (fotocasa=1 in DB means listing exists on API)
      const isPublishedToAdevinta = fotocasa;

      // Debug logging
      console.log("=== handleConfirmChanges DEBUG (Multi-Portal) ===");
      console.log("Enabled Adevinta portals (from UI):", enabledAdevintaPortals);
      console.log("Previous Adevinta portals (from DB):", previousAdevintaPortals);
      console.log("Is published to Adevinta (fotocasa DB):", isPublishedToAdevinta);
      console.log("Adevinta portals changed:", adevintaPortalsChanged);

      // Track if Adevinta API call was successful
      let adevintaApiSuccess = true;

      // Determine operation based on state
      if (enabledAdevintaPortals.length > 0 && !isPublishedToAdevinta) {
        // CASE 1: Not on Adevinta, enabling portals → POST
        console.log("✅ Publishing to Adevinta portals (POST)...", enabledAdevintaPortals);
        try {
          const result = await publishToFotocasa(
            Number(listingId),
            undefined, // visibilityMode - will read from database
            undefined, // hidePrice - will read from database
            enabledAdevintaPortals,
          );
          if (result.success) {
            console.log("Successfully published to Adevinta portals:", result.portals);
            const portalNames = enabledAdevintaPortals
              .map((id) => platformConfig.find((p) => p.id === id)?.name ?? id)
              .join(", ");
            toast.success(`Correctamente subido a: ${portalNames}`);
          } else {
            console.error("Failed to publish to Adevinta:", result.error);
            toast.error(`Error al publicar: ${result.error}`);
            adevintaApiSuccess = false;
          }
        } catch (error) {
          console.error("Error calling Adevinta API:", error);
          toast.error("Error al conectar con Adevinta");
          adevintaApiSuccess = false;
        }
      } else if (enabledAdevintaPortals.length > 0 && isPublishedToAdevinta && adevintaPortalsChanged) {
        // CASE 2: Already on Adevinta, portal selection changed → PUT
        console.log("✅ Updating Adevinta portals (PUT)...", enabledAdevintaPortals);
        try {
          const result = await updateFotocasa(
            Number(listingId),
            undefined, // visibilityMode - will read from database
            undefined, // hidePrice - will read from database
            enabledAdevintaPortals,
          );
          if (result.success) {
            console.log("Successfully updated Adevinta portals:", result.portals);
            const portalNames = enabledAdevintaPortals
              .map((id) => platformConfig.find((p) => p.id === id)?.name ?? id)
              .join(", ");
            toast.success(`Portales actualizados: ${portalNames}`);
          } else {
            console.error("Failed to update Adevinta:", result.error);
            toast.error(`Error al actualizar: ${result.error}`);
            adevintaApiSuccess = false;
          }
        } catch (error) {
          console.error("Error calling Adevinta update API:", error);
          toast.error("Error al conectar con Adevinta");
          adevintaApiSuccess = false;
        }
      } else if (enabledAdevintaPortals.length === 0 && isPublishedToAdevinta) {
        // CASE 3: On Adevinta, all portals disabled → DELETE
        console.log("Deleting from all Adevinta portals (DELETE)...");
        try {
          const result = await deleteFromFotocasa(Number(listingId));
          if (result.success) {
            console.log("Successfully deleted from all Adevinta portals");
            toast.success("Borrado correctamente de todos los portales Adevinta");
          } else {
            console.error("Failed to delete from Adevinta:", result.error);
            toast.error(`Error al eliminar: ${result.error}`);
            adevintaApiSuccess = false;
          }
        } catch (error) {
          console.error("Error calling Adevinta delete API:", error);
          toast.error("Error al conectar con Adevinta para eliminar");
          adevintaApiSuccess = false;
        }
      }

      // Legacy variable for backward compatibility with rest of function
      const fotocasaApiSuccess = adevintaApiSuccess;

      // Update database with portal configuration (excluding fotocasa status - handled by API)
      const portalUpdates = {
        idealista:
          platforms.find((p) => p.id === "idealista")?.isActive ?? false,
        habitaclia:
          platforms.find((p) => p.id === "habitaclia")?.isActive ?? false,
        milanuncios:
          platforms.find((p) => p.id === "milanuncios")?.isActive ?? false,
        pisoscom:
          platforms.find((p) => p.id === "pisoscom")?.isActive ?? false,
        yaencontre:
          platforms.find((p) => p.id === "yaencontre")?.isActive ?? false,
        enalquiler:
          platforms.find((p) => p.id === "enalquiler")?.isActive ?? false,
        kyero:
          platforms.find((p) => p.id === "kyero")?.isActive ?? false,
        spainhouses:
          platforms.find((p) => p.id === "spainhouses")?.isActive ?? false,
        thinkspain:
          platforms.find((p) => p.id === "thinkspain")?.isActive ?? false,
        listglobally:
          platforms.find((p) => p.id === "listglobally")?.isActive ?? false,
        publishToWebsite:
          platforms.find((p) => p.id === "publishToWebsite")?.isActive ?? false,
        hasCartel:
          platforms.find((p) => p.id === "hasCartel")?.isActive ?? false,
        enEscaparate:
          platforms.find((p) => p.id === "enEscaparate")?.isActive ?? false,
        hasKeys:
          platforms.find((p) => p.id === "hasKeys")?.isActive ?? false,
        // Save Fotocasa visibility settings as explicit fields (preferred approach)
        fcLocationVisibility: visibilityModes.fotocasa ?? 1,
        fcPriceVisibility: hidePriceModes.fotocasa ?? false,
        // Legacy support: Also update fotocasaProps JSON for backward compatibility
        fotocasaProps: {
          visibilityMode: visibilityModes.fotocasa ?? 1,
          hidePrice: hidePriceModes.fotocasa ?? false,
        },
        // Idealista visibility settings (address visibility uses shared fcLocationVisibility)
        idCoordinatesPrecision: idealistaCoordinatesPrecision,
        idealistaProps: {
          coordinatesPrecision: idealistaCoordinatesPrecision,
        },
        habitacliaProps: {}, // Placeholder for future Habitaclia settings
        milanunciosProps: {}, // Placeholder for future Milanuncios settings
        pisoscomProps: {}, // Placeholder for future Pisos.com settings
        yaencontreProps: {}, // Placeholder for future Yaencontre settings
        enalquilerProps: {}, // Placeholder for future EnAlquiler settings
        kyeroProps: {}, // Placeholder for future Kyero settings
        spainhousesProps: {}, // Placeholder for future Spainhouses settings
        thinkspainProps: {}, // Placeholder for future Think Spain settings
        listgloballyProps: {}, // Placeholder for future ListGlobally settings
      };

      // Update the listing with the new portal values (except fotocasa, handled by API)
      await updateListingWithAuth(Number(listingId), portalUpdates);

      // Log activity for toggle changes (direction-aware)
      // Only log if there were actual changes to the toggles
      const toggleChanges = {
        publishToWebsite:
          portalUpdates.publishToWebsite !== publishToWebsite
            ? { old: publishToWebsite, new: portalUpdates.publishToWebsite }
            : undefined,
        hasKeys:
          portalUpdates.hasKeys !== hasKeys
            ? { old: hasKeys, new: portalUpdates.hasKeys }
            : undefined,
        hasCartel:
          portalUpdates.hasCartel !== hasCartel
            ? { old: hasCartel, new: portalUpdates.hasCartel }
            : undefined,
        enEscaparate:
          portalUpdates.enEscaparate !== enEscaparate
            ? { old: enEscaparate, new: portalUpdates.enEscaparate }
            : undefined,
      };

      // Only call activity logging if at least one toggle changed
      const hasToggleChanges = Object.values(toggleChanges).some(
        (change) => change !== undefined,
      );
      if (hasToggleChanges) {
        try {
          await savePortalChangesWithActivity(BigInt(listingId), toggleChanges);
        } catch (activityError) {
          // Log error but don't fail the operation - activity logging is secondary
          console.error("Error logging portal activity:", activityError);
        }
      }

      // Show success toast for general portal updates (non-Fotocasa)
      // Only include user-facing portal toggles, not internal fields
      const portalNameMap: Record<string, string> = {
        idealista: "Idealista",
        habitaclia: "Habitaclia",
        milanuncios: "Milanuncios",
        pisoscom: "Pisos.com",
        yaencontre: "Yaencontre",
        enalquiler: "EnAlquiler",
        kyero: "Kyero",
        spainhouses: "Spainhouses",
        thinkspain: "Think Spain",
        listglobally: "ListGlobally",
        publishToWebsite: "Publicar en Web",
        hasCartel: "Cartel Colocado",
        enEscaparate: "En Escaparate",
        hasKeys: "Tiene Llaves",
      };

      const originalValueMap: Record<string, boolean> = {
        idealista,
        habitaclia,
        milanuncios,
        pisoscom,
        yaencontre,
        enalquiler,
        kyero,
        spainhouses,
        thinkspain,
        listglobally,
        publishToWebsite,
        hasCartel,
        enEscaparate,
        hasKeys,
      };

      const changedPortals = Object.entries(portalUpdates)
        .filter(([key, value]) => {
          // Only include known portal toggles (skip internal fields like fcLocationVisibility, idCoordinatesPrecision, etc.)
          if (!(key in portalNameMap)) return false;
          const originalValue = originalValueMap[key] ?? false;
          return value !== originalValue;
        })
        .map(([key]) => portalNameMap[key] ?? key);

      if (changedPortals.length > 0) {
        // Check if Idealista changed
        const idealistaEnabled =
          portalUpdates.idealista === true && idealista === false;
        const idealistaDisabled =
          portalUpdates.idealista === false && idealista === true;

        // Trigger Idealista export when toggle changes (either enabled or disabled)
        if (idealistaEnabled || idealistaDisabled) {
          // Export runs in background - don't await to avoid blocking UI
          triggerIdealistaExport()
            .then((result) => {
              if (result.success) {
                console.log(
                  `Idealista export completed: ${result.propertyCount} properties`,
                  result.s3Url,
                );
              } else {
                console.error("Idealista export failed:", result.error);
              }
            })
            .catch((err) => console.error("Idealista export error:", err));

          // Show user-friendly toast
          if (idealistaEnabled) {
            toast.success(
              "Anuncio publicado en Idealista. Espera 15 minutos para ver los resultados.",
              { duration: 5000 },
            );
          } else {
            toast.success("Anuncio eliminado de Idealista.");
          }
        }

        // Show generic message for other portals (excluding Idealista)
        const otherPortals = changedPortals.filter((p) => p !== "Idealista");
        if (otherPortals.length > 0) {
          toast.success(`Actualizado: ${otherPortals.join(", ")}`);
        }
      }

      // Update local state to reflect the confirmed changes
      const updatedPlatforms: Platform[] = platforms.map((platform) => {
        if (platform.id === "fotocasa" && !fotocasaApiSuccess) {
          // Revert Fotocasa to previous state on failure
          return {
            ...platform,
            isActive: fotocasa,
            status: fotocasa ? ("active" as const) : ("inactive" as const),
          };
        }
        return {
          ...platform,
          status: platform.isActive
            ? ("active" as const)
            : ("inactive" as const),
        };
      });

      setPlatforms(updatedPlatforms);
      setHasUnsavedChanges(false);
      setSavedPlatformStates(
        updatedPlatforms.reduce(
          (acc, platform) => ({
            ...acc,
            [platform.id]: platform.isActive,
          }),
          {} as Record<string, boolean>,
        ),
      );

      // Don't show generic success message - already shown specific operation message above
      if (!fotocasaApiSuccess) {
        toast.warning("Configuración guardada con errores en Fotocasa");
      }

      // Notify parent component of successfully saved portal values
      if (onPortalsSaved) {
        // fotocasa DB field is true if any Adevinta portal is enabled
        const newFotocasaState = adevintaApiSuccess
          ? enabledAdevintaPortals.length > 0
          : fotocasa; // Fallback to previous on API failure

        const updatedPortalValues = {
          fotocasa: newFotocasaState,
          idealista: portalUpdates.idealista,
          habitaclia: portalUpdates.habitaclia,
          milanuncios: portalUpdates.milanuncios,
          pisoscom: portalUpdates.pisoscom,
          yaencontre: portalUpdates.yaencontre,
          enalquiler: portalUpdates.enalquiler,
          kyero: portalUpdates.kyero,
          spainhouses: portalUpdates.spainhouses,
          thinkspain: portalUpdates.thinkspain,
          listglobally: portalUpdates.listglobally,
          publishToWebsite: portalUpdates.publishToWebsite,
          hasCartel: portalUpdates.hasCartel,
          enEscaparate: portalUpdates.enEscaparate,
          hasKeys: portalUpdates.hasKeys,
          fcLocationVisibility: portalUpdates.fcLocationVisibility,
          fcPriceVisibility: portalUpdates.fcPriceVisibility,
        };
        onPortalsSaved(updatedPortalValues);
      }
    } catch (error) {
      console.error("Error updating portal configuration:", error);
      toast.error("Error al actualizar la configuración de portales");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityModeChange = (platformId: string, mode: number) => {
    const updatedVisibilityModes = {
      ...visibilityModes,
      [platformId]: mode,
    };
    setVisibilityModes(updatedVisibilityModes);

    const updatedPlatforms = platforms.map((platform) =>
      platform.id === platformId
        ? { ...platform, visibilityMode: mode }
        : platform,
    );
    setPlatforms(updatedPlatforms);

    // Don't set unsaved changes - settings changes are handled via refresh button

    // Notify parent component to persist state
    const platformStates = updatedPlatforms.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.isActive }),
      {} as Record<string, boolean>,
    );
    onPortalStateChange?.(
      platformStates,
      updatedVisibilityModes,
      hidePriceModes,
    );
  };

  const handleHidePriceChange = (platformId: string, hidePrice: boolean) => {
    const updatedHidePriceModes = {
      ...hidePriceModes,
      [platformId]: hidePrice,
    };
    setHidePriceModes(updatedHidePriceModes);

    const updatedPlatforms = platforms.map((platform) =>
      platform.id === platformId ? { ...platform, hidePrice } : platform,
    );
    setPlatforms(updatedPlatforms);

    // Don't set unsaved changes - settings changes are handled via refresh button

    // Notify parent component to persist state
    const platformStates = updatedPlatforms.reduce(
      (acc, p) => ({ ...acc, [p.id]: p.isActive }),
      {} as Record<string, boolean>,
    );
    onPortalStateChange?.(
      platformStates,
      visibilityModes,
      updatedHidePriceModes,
    );
  };

  const handleRefresh = async (platformId: string) => {
    // Only allow refresh for published Fotocasa listings (fotocasa = 1)
    const platform = platforms.find((p) => p.id === platformId);

    if (platformId === "fotocasa" && !fotocasa) {
      toast.error(
        "Fotocasa no está publicado. Usa el botón Confirmar para publicar.",
      );
      return;
    }

    if (!platform?.isActive) {
      toast.error(`${platform?.name} no está activo`);
      return;
    }

    setRefreshingPlatforms((prev) => ({ ...prev, [platformId]: true }));

    try {
      if (platformId === "fotocasa") {
        console.log(
          `Updating Fotocasa with current settings (PUT operation)...`,
        );
        const result = await updateFotocasa(
          Number(listingId),
          // Parameters now optional - will read from database fields
        );

        if (result.success) {
          console.log(`Successfully updated ${platformId}`);
          toast.success("Visibilidad y precio actualizados");

          // Update platform status to active
          const updatedPlatforms = platforms.map((p) =>
            p.id === platformId
              ? { ...p, status: "active" as const, lastSync: new Date() }
              : p,
          );
          setPlatforms(updatedPlatforms);

          // Update Fotocasa settings in database with new settings
          await updateListingWithAuth(Number(listingId), {
            fcLocationVisibility: visibilityModes.fotocasa ?? 1,
            fcPriceVisibility: hidePriceModes.fotocasa ?? false,
            // Legacy support: also update fotocasaProps for backward compatibility
            fotocasaProps: {
              visibilityMode: visibilityModes.fotocasa ?? 1,
              hidePrice: hidePriceModes.fotocasa ?? false,
            },
          } as Parameters<typeof updateListingWithAuth>[1]);
        } else {
          console.error(`Failed to update ${platformId}:`, result.error);
          toast.error(`Error al actualizar ${platform.name}: ${result.error}`);

          // Update platform status to error
          const updatedPlatforms = platforms.map((p) =>
            p.id === platformId ? { ...p, status: "error" as const } : p,
          );
          setPlatforms(updatedPlatforms);
        }
      } else if (platformId === "idealista") {
        // Re-export all Idealista-enabled properties with current data
        try {
          const result = await triggerIdealistaExport();
          if (result.success) {
            console.log("Idealista export triggered successfully");
            toast.success(
              "Exportación a Idealista iniciada. Los cambios se reflejarán en ~15 minutos.",
            );
            // Update platform status to active with new sync time
            const updatedPlatforms = platforms.map((p) =>
              p.id === platformId
                ? { ...p, status: "active" as const, lastSync: new Date() }
                : p,
            );
            setPlatforms(updatedPlatforms);

            // Update Idealista settings in database with current settings
            await updateListingWithAuth(Number(listingId), {
              idCoordinatesPrecision: idealistaCoordinatesPrecision,
              // Legacy support: also update idealistaProps for backward compatibility
              idealistaProps: {
                coordinatesPrecision: idealistaCoordinatesPrecision,
              },
            } as Parameters<typeof updateListingWithAuth>[1]);
          } else {
            console.error("Idealista export failed:", result.error);
            toast.error(`Error al exportar a Idealista: ${result.error}`);
            // Update platform status to error
            const updatedPlatforms = platforms.map((p) =>
              p.id === platformId ? { ...p, status: "error" as const } : p,
            );
            setPlatforms(updatedPlatforms);
          }
        } catch (error) {
          console.error("Idealista export error:", error);
          toast.error("Error al conectar con Idealista");
          // Update platform status to error
          const updatedPlatforms = platforms.map((p) =>
            p.id === platformId ? { ...p, status: "error" as const } : p,
          );
          setPlatforms(updatedPlatforms);
        }
      } else {
        // For other platforms, show not implemented message
        toast.info(`Actualización de ${platform.name} no implementada aún`);
      }
    } catch (error) {
      console.error(`Error refreshing ${platformId}:`, error);
      toast.error(`Error al conectar con ${platform?.name}`);

      // Update platform status to error
      const updatedPlatforms = platforms.map((p) =>
        p.id === platformId ? { ...p, status: "error" as const } : p,
      );
      setPlatforms(updatedPlatforms);
    } finally {
      setRefreshingPlatforms((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const getCardStyles = (platform: Platform) => {
    const initialActive = savedPlatformStates[platform.id];
    const currentActive = platform.isActive;
    if (currentActive) {
      if (initialActive) {
        // Was active and is still active (even if toggled off and on again before saving)
        return "bg-white shadow-lg";
      } else {
        // Was inactive, now active (pending save)
        return "bg-white shadow-sm";
      }
    } else {
      // Inactive
      return "bg-transparent shadow-sm hover:border-gray-300";
    }
  };

  // Helper function to render platform icon or logo
  const renderPlatformIcon = (platform: Platform) => {
    // Special handling for platforms without logos - use uppercase text
    if (platform.id === "publishToWebsite") {
      return (
        <div className="flex h-full w-full items-center justify-center px-2 text-center">
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-gray-700">
            Publicar en Web
          </span>
        </div>
      );
    }
    if (platform.id === "hasCartel") {
      return (
        <div className="flex h-full w-full items-center justify-center px-2 text-center">
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-gray-700">
            Cartel Colocado
          </span>
        </div>
      );
    }
    if (platform.id === "enEscaparate") {
      return (
        <div className="flex h-full w-full items-center justify-center px-2 text-center">
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-gray-700">
            En Escaparate
          </span>
        </div>
      );
    }
    if (platform.id === "hasKeys") {
      return (
        <div className="flex h-full w-full items-center justify-center px-2 text-center">
          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-gray-700">
            Tiene Llaves
          </span>
        </div>
      );
    }

    // For platforms with logos (portals)
    if (platform.logo) {
      // Check if this image has failed to load
      const hasFailed = failedImageLoads.has(platform.id);
      
      if (hasFailed) {
        // Show fallback text if image failed to load
        return (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
            {platform.name}
          </div>
        );
      }

      // Use Next.js Image component with proper error handling
      return (
        <Image
          src={platform.logo}
          alt={platform.name}
          width={72}
          height={72}
          className="h-full w-full object-contain"
          unoptimized
          onError={(e) => {
            // Log error for debugging (always log in production too)
            console.error(
              `[PortalSelection] Failed to load logo for ${platform.name}`,
              {
                platformId: platform.id,
                logoUrl: platform.logo,
                error: e,
              },
            );
            // Mark this image as failed so we can show fallback
            setFailedImageLoads((prev) => new Set(prev).add(platform.id));
          }}
          onLoad={() => {
            // Log successful loads in development
            if (process.env.NODE_ENV === "development") {
              console.log(
                `[PortalSelection] Successfully loaded logo for ${platform.name}`,
              );
            }
          }}
          loading="lazy"
        />
      );
    }

    // Default fallback
    return (
      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-500">
        {platform.name}
      </div>
    );
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="space-y-6"
      >
        {/* Save Button Row */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Button
                onClick={handleConfirmChanges}
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:from-amber-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Confirmando..." : "Confirmar Cambios"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* First Row - Icon-based Options (responsive grid) */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {platforms.slice(11, 15).map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              <Card
                className={cn(
                  "group relative cursor-pointer transition-all duration-300",
                  getCardStyles(platform),
                )}
                onClick={(e) => {
                  // Prevent card click when clicking settings panel
                  if (
                    (e.target as HTMLElement).closest(".settings-panel")
                  ) {
                    return;
                  }
                  handlePlatformToggle(platform.id, !platform.isActive);
                }}
              >
                {/* Orange Dot for Pending State */}
                {platform.isActive && !savedPlatformStates[platform.id] && (
                  <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-orange-400"></div>
                )}

                <CardContent className="flex flex-col items-center justify-center p-4">
                  {/* Platform Icon */}
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="relative">{renderPlatformIcon(platform)}</div>
                  </div>

                  {/* Chevron Button and Settings Panel - Only for Publicar en Web */}
                  {platform.isActive && platform.id === "publishToWebsite" && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishToWebsiteSettingsExpanded(!publishToWebsiteSettingsExpanded);
                        }}
                        className="settings-panel absolute bottom-2 right-2 z-10 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            publishToWebsiteSettingsExpanded && "rotate-180",
                          )}
                        />
                      </button>

                      {/* Collapsible Content */}
                      <AnimatePresence>
                        {publishToWebsiteSettingsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="settings-panel w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mt-4 space-y-3 border-t pb-6 pt-3">
                              {/* Visibility Mode - Tile Selection */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">
                                  Visibilidad
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: 1, label: "Exacta" },
                                    { value: 2, label: "Calle" },
                                    { value: 3, label: "Zona" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVisibilityModeChange(
                                          "fotocasa",
                                          option.value,
                                        );
                                      }}
                                      className={cn(
                                        "flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                                        visibilityModes.fotocasa === option.value
                                          ? "border-gray-700 bg-gray-700 text-white shadow-sm"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Portal Cards Grid - Responsive columns */}
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {platforms.slice(0, 11).map((platform, index) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              <Card
                className={cn(
                  "group relative cursor-pointer transition-all duration-300",
                  getCardStyles(platform),
                )}
                onClick={(e) => {
                  // Prevent card click when clicking refresh button or settings
                  if (
                    (e.target as HTMLElement).closest(".refresh-button") ||
                    (e.target as HTMLElement).closest(".settings-panel")
                  ) {
                    return;
                  }
                  handlePlatformToggle(platform.id, !platform.isActive);
                }}
              >
                {/* Orange Dot for Pending State */}
                {platform.isActive && !savedPlatformStates[platform.id] && (
                  <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-orange-400"></div>
                )}

                {/* Refresh Button - Top Right Corner, visible on hover or when refreshing */}
                <div className={cn(
                  "refresh-button absolute right-2 top-2 z-10 transition-opacity duration-200 group-hover:opacity-100",
                  refreshingPlatforms[platform.id] ? "opacity-100" : "opacity-0"
                )}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    aria-label={`Refrescar ${platform.name}`}
                    tabIndex={-1}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRefresh(platform.id);
                    }}
                    disabled={refreshingPlatforms[platform.id]}
                  >
                    <RefreshCcw
                      className={cn(
                        "h-3 w-3 text-gray-600",
                        refreshingPlatforms[platform.id] && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                <CardContent className="flex flex-col p-4 sm:p-6">
                  <div className="flex h-16 flex-col items-center justify-center sm:h-20">
                    {/* Platform Logo */}
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="relative h-full w-full">{renderPlatformIcon(platform)}</div>
                    </div>
                  </div>

                  {/* Chevron Button - Bottom Right Corner (Idealista) */}
                  {platform.isActive && platform.id === "idealista" && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdealistaSettingsExpanded(!idealistaSettingsExpanded);
                        }}
                        className="settings-panel absolute bottom-2 right-2 z-10 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            idealistaSettingsExpanded && "rotate-180",
                          )}
                        />
                      </button>

                      {/* Collapsible Content */}
                      <AnimatePresence>
                        {idealistaSettingsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="settings-panel overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mt-4 space-y-3 border-t pb-6 pt-3">
                              {/* Coordinates Precision */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">
                                  Precisión mapa
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: "exact" as const, label: "Exacta" },
                                    { value: "moved" as const, label: "Aproximada" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIdealistaCoordinatesPrecision(option.value);
                                      }}
                                      className={cn(
                                        "flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                                        idealistaCoordinatesPrecision === option.value
                                          ? "border-gray-700 bg-gray-700 text-white shadow-sm"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Info Note */}
                              <p className="text-xs text-gray-500">
                                Nota: Idealista no permite ocultar el precio en España.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* Chevron Button - Bottom Right Corner (Fotocasa) */}
                  {platform.isActive && platform.id === "fotocasa" && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFotocasaSettingsExpanded(!fotocasaSettingsExpanded);
                        }}
                        className="settings-panel absolute bottom-2 right-2 z-10 rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            fotocasaSettingsExpanded && "rotate-180",
                          )}
                        />
                      </button>

                      {/* Collapsible Content */}
                      <AnimatePresence>
                        {fotocasaSettingsExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="settings-panel overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mt-4 space-y-3 border-t pb-6 pt-3">
                              {/* Visibility Mode - Tile Selection */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-700">
                                  Visibilidad
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: 1, label: "Exacta" },
                                    { value: 2, label: "Calle" },
                                    { value: 3, label: "Zona" },
                                  ].map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVisibilityModeChange(
                                          "fotocasa",
                                          option.value,
                                        );
                                      }}
                                      className={cn(
                                        "flex flex-1 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                                        visibilityModes.fotocasa === option.value
                                          ? "border-gray-700 bg-gray-700 text-white shadow-sm"
                                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Hide Price Toggle */}
                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor={`${platform.id}-hide-price`}
                                  className="cursor-pointer text-xs font-medium text-gray-700"
                                >
                                  Ocultar precio
                                </Label>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={hidePriceModes.fotocasa ?? false}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHidePriceChange(
                                      "fotocasa",
                                      !(hidePriceModes.fotocasa ?? false),
                                    );
                                  }}
                                  className={cn(
                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 focus-visible:ring-offset-1",
                                    hidePriceModes.fotocasa
                                      ? "border-gray-400 bg-gray-400"
                                      : "border-gray-200 bg-gray-100",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                                      hidePriceModes.fotocasa
                                        ? "translate-x-4"
                                        : "translate-x-0.5",
                                    )}
                                  />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
