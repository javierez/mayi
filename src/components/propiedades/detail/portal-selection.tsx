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
  },
  {
    id: "habitaclia",
    name: "Habitaclia",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-habitaclia.png",
    description: "Portal especializado en alquiler y venta",
    isDefault: defaultPortalSettings.habitaclia,
  },
  {
    id: "milanuncios",
    name: "Milanuncios",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-milanuncios.png",
    description: "Portal de anuncios clasificados líder en España",
    isDefault: defaultPortalSettings.milanuncios,
  },
  {
    id: "pisoscom",
    name: "Pisos.com",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-pisos.png",
    description: "Tu portal inmobiliario de confianza",
    isDefault: false,
  },
  {
    id: "yaencontre",
    name: "Yaencontre",
    logo: "https://vesta-configuration-files.s3.amazonaws.com/logos/logo-yaencontre.png",
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
  },
  {
    id: "publishToWebsite",
    name: "Publicar en Web",
    logo: "/vestazoomin.jpeg", // Vesta logo from dashboard
    description: "Publicar propiedad en el sitio web",
    isDefault: false,
  },
  {
    id: "hasCartel",
    name: "Cartel Colocado",
    logo: "", // Will use FileImage icon instead
    description: "Propiedad con cartel físico",
    isDefault: false,
  },
  {
    id: "enEscaparate",
    name: "En Escaparate",
    logo: "", // Will use Store icon instead
    description: "Destacar propiedad en escaparate",
    isDefault: false,
  },
  {
    id: "hasKeys",
    name: "Tiene Llaves",
    logo: "", // Will use icon instead
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

  // Idealista-specific settings state (address visibility uses shared fcLocationVisibility)
  const [idealistaCoordinatesPrecision, setIdealistaCoordinatesPrecision] = useState<
    "exact" | "moved"
  >(idCoordinatesPrecision);

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
    publishToWebsite,
    hasCartel,
    enEscaparate,
    hasKeys,
    hidePriceModes.fotocasa,
    visibilityModes.fotocasa,
    initialPlatformStates,
  ]);

  const handlePlatformToggle = (platformId: string, isActive: boolean) => {
    const updatedPlatforms = platforms.map((platform) => {
      if (platform.id === platformId) {
        let status: Platform["status"] = "inactive";

        if (isActive) {
          // If enabling, set to pending (needs confirmation)
          status = "pending";
        } else {
          // If disabling, set to inactive
          status = "inactive";
        }

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
      const currentFotocasaState =
        platforms.find((p) => p.id === "fotocasa")?.isActive ?? false;

      // Debug logging
      console.log("=== handleConfirmChanges DEBUG ===");
      console.log(
        "currentFotocasaState (from UI toggle):",
        currentFotocasaState,
      );
      console.log("fotocasa prop (from database):", fotocasa);
      console.log(
        "Condition for POST (currentFotocasaState && !fotocasa):",
        currentFotocasaState && !fotocasa,
      );
      console.log(
        "Condition for DELETE (!currentFotocasaState && fotocasa):",
        !currentFotocasaState && fotocasa,
      );

      // Track if Fotocasa API call was successful
      let fotocasaApiSuccess = true;

      // Determine the operation based on current vs previous state
      if (currentFotocasaState && !fotocasa) {
        // fotocasa = 0, toggled ON → POST (publish)
        console.log("✅ Publishing to Fotocasa (POST)...");
        try {
          const fotocasaResult = await publishToFotocasa(
            Number(listingId),
            // Parameters now optional - will read from database fields
          );
          if (fotocasaResult.success) {
            console.log("Successfully published to Fotocasa");
            toast.success("Correctamente subido a Fotocasa");
          } else {
            console.error(
              "Failed to publish to Fotocasa:",
              fotocasaResult.error,
            );
            toast.error(
              `Error al publicar en Fotocasa: ${fotocasaResult.error}`,
            );
            fotocasaApiSuccess = false;
          }
        } catch (error) {
          console.error("Error calling Fotocasa API:", error);
          toast.error("Error al conectar con Fotocasa");
          fotocasaApiSuccess = false;
        }
      } else if (!currentFotocasaState && fotocasa) {
        // fotocasa = 1, toggled OFF → DELETE (unpublish)
        console.log("Deleting from Fotocasa (DELETE)...");
        try {
          const fotocasaResult = await deleteFromFotocasa(Number(listingId));
          if (fotocasaResult.success) {
            console.log("Successfully deleted from Fotocasa");
            toast.success("Borrado correctamente de Fotocasa");
          } else {
            console.error(
              "Failed to delete from Fotocasa:",
              fotocasaResult.error,
            );
            toast.error(
              `Error al eliminar de Fotocasa: ${fotocasaResult.error}`,
            );
            fotocasaApiSuccess = false;
          }
        } catch (error) {
          console.error("Error calling Fotocasa delete API:", error);
          toast.error("Error al conectar con Fotocasa para eliminar");
          fotocasaApiSuccess = false;
        }
      }

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
      const changedPortals = Object.entries(portalUpdates)
        .filter(([key, value]) => {
          // Skip props fields and fotocasa (handled separately)
          if (key.includes("Props")) return false;

          // Get the original value for comparison
          const originalValueMap: Record<string, boolean> = {
            idealista,
            habitaclia,
            milanuncios,
            pisoscom,
            yaencontre,
            enalquiler,
            kyero,
            publishToWebsite,
            hasCartel,
            enEscaparate,
            hasKeys,
          };

          const originalValue = originalValueMap[key] ?? false;
          return value !== originalValue;
        })
        .map(([key]) => {
          // Map to readable names
          const nameMap: Record<string, string> = {
            idealista: "Idealista",
            habitaclia: "Habitaclia",
            milanuncios: "Milanuncios",
            pisoscom: "Pisos.com",
            yaencontre: "Yaencontre",
            enalquiler: "EnAlquiler",
            kyero: "Kyero",
            publishToWebsite: "Publicar en Web",
            hasCartel: "Cartel Colocado",
            enEscaparate: "En Escaparate",
            hasKeys: "Tiene Llaves",
          };
          return nameMap[key] ?? key;
        });

      if (changedPortals.length > 0) {
        // Check if Idealista was enabled - show specific message
        const idealistaEnabled =
          portalUpdates.idealista === true && idealista === false;
        const idealistaDisabled =
          portalUpdates.idealista === false && idealista === true;

        if (idealistaEnabled) {
          toast.success(
            "Anuncio publicado en Idealista. Espera 15 minutos para ver los resultados.",
            { duration: 5000 },
          );
        } else if (idealistaDisabled) {
          toast.success("Anuncio eliminado de Idealista.");
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
        const updatedPortalValues = {
          fotocasa: fotocasaApiSuccess
            ? currentFotocasaState
            : fotocasa, // Use API result or fallback to previous
          idealista: portalUpdates.idealista,
          habitaclia: portalUpdates.habitaclia,
          milanuncios: portalUpdates.milanuncios,
          pisoscom: portalUpdates.pisoscom,
          yaencontre: portalUpdates.yaencontre,
          enalquiler: portalUpdates.enalquiler,
          kyero: portalUpdates.kyero,
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
      return (
        <Image
          src={platform.logo}
          alt={platform.name}
          width={72}
          height={72}
          className="h-full w-full object-contain"
          onError={(e) => {
            // Fallback for missing logos
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement!.innerHTML = `<div class="text-sm font-medium text-gray-500 h-full w-full flex items-center justify-center">${platform.name}</div>`;
          }}
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

        {/* First Row - Icon-based Options (4 columns) */}
        <motion.div
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {platforms.slice(8, 12).map((platform, index) => (
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
                                <div className="grid grid-cols-3 gap-2">
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
                                        "flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
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

        {/* Portal Cards Grid - 2 Rows of 4 Columns */}
        <motion.div
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {platforms.slice(0, 8).map((platform, index) => (
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

                {/* Refresh Button - Top Right Corner, Only on Hover */}
                <div className="refresh-button absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

                <CardContent className="flex flex-col p-6">
                  <div className="flex h-20 flex-col items-center justify-center">
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
                                <div className="grid grid-cols-2 gap-2">
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
                                        "flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
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
                                <div className="grid grid-cols-3 gap-2">
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
                                        "flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
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
