"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { getAllAgentsWithAuth } from "~/server/queries/listing";
import {
  getAllPotentialOwnersWithAuth,
  updateListingOwnersWithAuth,
} from "~/server/queries/contact";
import { findOrCreateLocation } from "~/server/queries/locations";
import { useRouter, useSearchParams } from "next/navigation";
import { updateProperty } from "~/server/queries/properties";
import {
  updateListingWithAuth,
} from "~/server/queries/listing";
import { toast } from "sonner";
import { PropertySummaryCard } from "./cards/property-summary-card";
import { PropertyStatusRow } from "./cards/property-status-row";
import { BasicInfoCard } from "./cards/basic-info-card";
import { PropertyDetailsCard } from "./cards/property-details-card";
import { LocationCard } from "./cards/location-card";
import { FeaturesCard } from "./cards/features-card";
import { PremiumFeaturesCard } from "./cards/premium-features-card";
import { OrientationCard } from "./cards/orientation-card";
import { AdditionalCharacteristicsCard } from "./cards/additional-characteristics-card";
import { AdditionalSpacesCard } from "./cards/additional-spaces-card";
import { MaterialsCard } from "./cards/materials-card";
import { RentalPropertiesCard } from "./cards/rental-properties-card";
import { DescriptionCard } from "./cards/description-card";
import { PropertyExpensesCard } from "./cards/property-expenses-card";
import { RentalTermsCard } from "./cards/rental-terms-card";
import { ContactInfoCard } from "./cards/contact-info-card";
import { Separator } from "~/components/ui/separator";
import {
  generatePropertyDescription,
  generateShortPropertyDescription,
} from "~/server/openai/property_descriptions";
import { ExternalLinkPopup } from "~/components/ui/external-link-popup";
import { generatePropertyTitle } from "~/lib/property-title";
import { DeleteConfirmationModal } from "~/components/ui/delete-confirmation-modal";
import {
  deletePropertyWithAuth,
  deleteListingWithAuth,
  discardListingWithAuth,
  recoverListingWithAuth,
} from "~/server/queries/listing";
import { getFirstImage } from "~/app/actions/property-images";
import { formFormatters } from "~/lib/utils";
import {
  canDeleteProperties,
  canEditProperties,
} from "~/app/actions/permissions/check-permissions";

import type { PropertyListing } from "~/types/property-listing";
import type { CommentWithUser } from "~/types/comments";

// Type definitions
interface Agent {
  id: string; // Changed from number to match users.id type
  name: string;
}

interface Owner {
  id: number;
  name: string;
}

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";

interface ModuleState {
  saveState: SaveState;
  hasChanges: boolean;
  lastSaved?: Date;
}

type ModuleName =
  | "basicInfo"
  | "propertyDetails"
  | "location"
  | "features"
  | "description"
  | "contactInfo"
  | "orientation"
  | "additionalCharacteristics"
  | "premiumFeatures"
  | "additionalSpaces"
  | "materials"
  | "rentalProperties"
  | "propertyExpenses"
  | "rentalTerms";

interface PropertyCharacteristicsFormProps {
  listing: PropertyListing;
  // Optional comment management props
  currentUserId?: string;
  currentUser?: {
    id: string;
    name?: string;
    image?: string;
  };
  comments?: CommentWithUser[];
  onAddComment?: (
    comment: CommentWithUser,
  ) => Promise<{ success: boolean; error?: string }>;
  onEditComment?: (
    commentId: bigint,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteComment?: (
    commentId: bigint,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function PropertyCharacteristicsForm({
  listing,
  currentUserId,
  currentUser,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: PropertyCharacteristicsFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyType =
    searchParams.get("type") ?? listing.propertyType ?? "piso";

  // Local state to track current property type
  const [propertyType, setPropertyType] = useState(initialPropertyType);

  // Local state to track the current title - initialize from database only
  const [currentTitle, setCurrentTitle] = useState(listing.title ?? "");

  // Check if property type has been changed from the original
  const hasPropertyTypeChanged =
    listing.propertyType &&
    propertyType &&
    listing.propertyType !== propertyType;

  // Module states
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(
    () => {
      // Initialize with property type change detection
      const initialState = {
        basicInfo: {
          saveState: "idle" as SaveState,
          hasChanges: Boolean(hasPropertyTypeChanged),
        },
        propertyDetails: { saveState: "idle" as SaveState, hasChanges: false },
        location: { saveState: "idle" as SaveState, hasChanges: false },
        features: { saveState: "idle" as SaveState, hasChanges: false },
        contactInfo: { saveState: "idle" as SaveState, hasChanges: false },
        orientation: { saveState: "idle" as SaveState, hasChanges: false },
        additionalCharacteristics: {
          saveState: "idle" as SaveState,
          hasChanges: false,
        },
        premiumFeatures: { saveState: "idle" as SaveState, hasChanges: false },
        additionalSpaces: { saveState: "idle" as SaveState, hasChanges: false },
        materials: { saveState: "idle" as SaveState, hasChanges: false },
        description: { saveState: "idle" as SaveState, hasChanges: false },
        rentalProperties: { saveState: "idle" as SaveState, hasChanges: false },
        propertyExpenses: { saveState: "idle" as SaveState, hasChanges: false },
        rentalTerms: { saveState: "idle" as SaveState, hasChanges: false },
      };

      // Set basicInfo to modified if property type changed
      if (hasPropertyTypeChanged) {
        initialState.basicInfo.saveState = "modified";
      }

      return initialState;
    },
  );

  // Update module states when property type change is detected
  useEffect(() => {
    if (hasPropertyTypeChanged) {
      setModuleStates((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          saveState: "modified",
          hasChanges: true,
        },
      }));
    }
  }, [hasPropertyTypeChanged]);

  // Title only updates when: 1) User edits it manually in BasicInfoCard, or 2) Location changes in LocationCard
  // No auto-generation on property type change

  // Function to update module state
  const updateModuleState = (moduleName: ModuleName, hasChanges: boolean) => {
    setModuleStates((prev) => {
      const currentState = prev[moduleName] ?? {
        saveState: "idle" as SaveState,
        hasChanges: false,
      };
      return {
        ...prev,
        [moduleName]: {
          ...currentState,
          saveState: hasChanges ? "modified" : "idle",
          hasChanges,
          lastSaved: currentState.lastSaved,
        },
      };
    });
  };

  // Handle manual title changes from BasicInfoCard
  const handleTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
  };

  // Function to save module data
  const saveModule = async (moduleName: ModuleName) => {
    setModuleStates((prev) => {
      const currentState = prev[moduleName] ?? {
        saveState: "idle" as SaveState,
        hasChanges: false,
      };
      return {
        ...prev,
        [moduleName]: {
          ...currentState,
          saveState: "saving",
          hasChanges: currentState.hasChanges,
        },
      };
    });

    try {
      const propertyId = Number(listing.propertyId);
      const listingId = Number(listing.listingId);

      let propertyData: Record<string, unknown> = {};
      let listingData: Record<string, unknown> = {};

      switch (moduleName) {
        case "basicInfo":
          // Use the current title from local state
          const priceInputValue =
            (document.getElementById("price") as HTMLInputElement)?.value ?? "";
          // Remove thousand separators and convert to numeric value
          const numericPrice = formFormatters.getNumericPrice(priceInputValue);

          listingData = {
            listingType: listingTypes[0],
            isBankOwned,
            price: numericPrice ? parseFloat(numericPrice) : 0,
            // Rental-specific fields
            rentalType: rentalType ?? null,
            shortTermLicense: shortTermLicense || null,
            // Sale-specific fields
            occupationStatus: occupationStatus ?? null,
          };
          propertyData = {
            propertyType,
            propertySubtype: listing.propertySubtype,
            newConstruction,
            title: currentTitle, // Use current title from local state
          };
          break;

        case "propertyDetails":
          propertyData = {
            bedrooms: Number(
              (document.getElementById("bedrooms") as HTMLInputElement)?.value,
            ),
            bathrooms: Number(
              (document.getElementById("bathrooms") as HTMLInputElement)?.value,
            ),
            squareMeter: Number(
              (document.getElementById("squareMeter") as HTMLInputElement)
                ?.value,
            ),
            builtSurfaceArea: Math.round(
              Number(
                (
                  document.getElementById(
                    "builtSurfaceArea",
                  ) as HTMLInputElement
                )?.value,
              ),
            ),
            yearBuilt: Number(
              (document.getElementById("yearBuilt") as HTMLInputElement)?.value,
            ),
            lastRenovationYear: lastRenovationYear || null,
            buildingFloors: buildingFloors,
            conservationStatus: listing.conservationStatus ?? 1,
            finca: finca,
            superficieFinca: superficieFinca,
          };
          break;

        case "location":
          // Handle location data with proper locations table integration
          const streetValue = (
            document.getElementById("street") as HTMLInputElement
          )?.value;
          const addressDetailsValue = (
            document.getElementById("addressDetails") as HTMLInputElement
          )?.value;
          const postalCodeValue = (
            document.getElementById("postalCode") as HTMLInputElement
          )?.value;
          const neighborhoodValue = (
            document.getElementById("neighborhood") as HTMLInputElement
          )?.value;

          // Get city, province, municipality from either state or inputs (for immediate save after auto-complete)
          const cityValue =
            city ||
            (document.getElementById("city") as HTMLInputElement)?.value;
          const provinceValue =
            province ||
            (document.getElementById("province") as HTMLInputElement)?.value;
          const municipalityValue =
            municipality ||
            (document.getElementById("municipality") as HTMLInputElement)
              ?.value;

          console.log("💾 [SAVE] Starting location save with values:", {
            street: streetValue,
            addressDetails: addressDetailsValue,
            postalCode: postalCodeValue,
            city: cityValue,
            province: provinceValue,
            municipality: municipalityValue,
            neighborhood: neighborhoodValue,
            nearbyPublicTransport: nearbyPublicTransport,
          });

          // Find or create location in locations table and get neighborhoodId
          // All 4 fields are required: city, province, municipality, and neighborhood
          let neighborhoodId: bigint | null = null;

          // Validate required location fields
          const missingFields: string[] = [];
          if (!cityValue) missingFields.push("Ciudad");
          if (!provinceValue) missingFields.push("Provincia");
          if (!municipalityValue) missingFields.push("Municipio");
          if (!neighborhoodValue) missingFields.push("Barrio");

          if (missingFields.length > 0) {
            console.warn(
              "⚠️ [SAVE] Missing required location fields:",
              missingFields,
            );
            toast.error(
              `Por favor, completa los siguientes campos: ${missingFields.join(", ")}`,
              {
                description:
                  "Usa el autocompletado de Google Maps o introduce el barrio manualmente.",
              },
            );
            return; // Stop save - don't proceed without required fields
          }

          console.log(
            "✅ [SAVE] All location fields present, calling findOrCreateLocation...",
            {
              city: cityValue,
              province: provinceValue,
              municipality: municipalityValue,
              neighborhood: neighborhoodValue,
            },
          );
          try {
            neighborhoodId = BigInt(
              await findOrCreateLocation({
                city: cityValue,
                province: provinceValue,
                municipality: municipalityValue,
                neighborhood: neighborhoodValue,
              }),
            );
            console.log(
              "🏘️ [SAVE] Created/found location with neighborhoodId:",
              neighborhoodId,
            );
          } catch (error) {
            console.error("❌ [SAVE] Error handling location:", error);
            toast.error("Error al guardar la ubicación. Inténtalo de nuevo.");
            return; // Stop save on error
          }

          // Get coordinates from hidden inputs
          const latitudeValue = (
            document.getElementById("latitude") as HTMLInputElement
          )?.value;
          const longitudeValue = (
            document.getElementById("longitude") as HTMLInputElement
          )?.value;

          // Generate new title based on updated location
          const newTitle = generatePropertyTitle(
            propertyType,
            streetValue ?? listing.street ?? "",
            neighborhoodValue ?? listing.neighborhood ?? "",
          );

          console.log(
            "🏷️ [SAVE] Generated new title based on location:",
            newTitle,
          );

          propertyData = {
            street: streetValue,
            addressDetails: addressDetailsValue,
            postalCode: postalCodeValue,
            cadastralReference:
              (
                document.getElementById(
                  "cadastralReference",
                ) as HTMLInputElement
              )?.value || null,
            ...(neighborhoodId && { neighborhoodId }),
            nearbyPublicTransport,
            latitude: latitudeValue || null,
            longitude: longitudeValue || null,
            title: newTitle, // Add generated title to property data
            streetType: streetType || null, // Only for 'local' property type
          };

          console.log("📝 [SAVE] Property data prepared for update:", {
            ...propertyData,
            neighborhoodId: neighborhoodId
              ? neighborhoodId.toString()
              : "NOT SET",
          });

          // Note: city, province, municipality, neighborhood are NOT in listings table
          // They are stored in locations table via neighborhoodId foreign key
          // No listingData needed for location module
          break;

        case "features":
          propertyData = {
            hasElevator,
            hasGarage,
            garageType,
            garageSpaces: !isNaN(garageSpaces) ? garageSpaces : 1,
            garageInBuilding,
            garageNumber,
            hasStorageRoom,
            storageRoomSize:
              storageRoomSize && !isNaN(storageRoomSize)
                ? storageRoomSize
                : null,
            storageRoomNumber,
            hasHeating: isHeating,
            heatingType,
            hotWaterType: isHotWater ? hotWaterType : null,
            airConditioningType: isAirConditioning ? airConditioningType : null,
          };
          listingData = {
            isFurnished,
            furnitureQuality: isFurnished ? furnitureQuality : null,
            optionalGaragePrice: (() => {
              const value = (
                document.getElementById(
                  "optionalGaragePrice",
                ) as HTMLInputElement
              )?.value;
              const num = Number(value);
              return value && !isNaN(num) ? Math.round(num) : null;
            })(),
            optionalStorageRoomPrice: (() => {
              const value = (
                document.getElementById(
                  "optionalStorageRoomPrice",
                ) as HTMLInputElement
              )?.value;
              const num = Number(value);
              return value && !isNaN(num) ? Math.round(num) : null;
            })(),
            oven,
            microwave,
            washingMachine,
            secadora,
            fridge,
            tv,
            stoneware,
          };
          break;

        case "contactInfo":
          if (!selectedAgentId || selectedAgentId === "") {
            throw new Error("Please select an agent");
          }
          if (selectedOwnerIds.length === 0) {
            throw new Error("Please select at least one owner");
          }

          // Update listing with agent
          listingData = {
            agentId: selectedAgentId,
          };

          // Update owner relationships separately
          await updateListingOwnersWithAuth(
            listingId,
            selectedOwnerIds.map((id) => Number(id)),
          );
          break;

        case "orientation":
          propertyData = {
            exterior: isExterior,
            bright: isBright,
            orientation,
            hasEscaparate,
          };
          break;

        case "additionalCharacteristics":
          propertyData = {
            disabledAccessible,
            vpo,
            videoIntercom,
            conciergeService,
            securityGuard,
            satelliteDish,
            doubleGlazing,
            alarm,
            securityDoor,
            loadingArea,
            allowedUse,
            kitchenType,
            openKitchen,
            frenchKitchen,
            furnishedKitchen,
            pantry,
          };
          break;

        case "premiumFeatures":
          propertyData = {
            views,
            mountainViews,
            seaViews,
            beachfront,
            jacuzzi,
            hydromassage,
            garden,
            pool,
            homeAutomation,
            musicSystem,
            laundryRoom,
            coveredClothesline,
            fireplace,
            sauna,
            patio,
            gym,
            sportsArea,
            childrenArea,
            suiteBathroom,
            nearbyPublicTransport,
            communityPool,
            privatePool,
            tennisCourt,
            communityArea,
          };
          break;

        case "additionalSpaces":
          propertyData = {
            terrace,
            terraceSize,
            wineCellar,
            wineCellarSize,
            livingRoomSize,
            balconyCount,
            galleryCount,
            buildingFloors,
            builtInWardrobes,
          };
          break;

        case "materials":
          propertyData = {
            mainFloorType: mainFloorType || null,
            shutterType: shutterType || null,
            carpentryType: carpentryType || null,
            windowType: windowType || null,
            electricityType: electricityType || null,
            electricityStatus: electricityStatus || null,
            plumbingType: plumbingType || null,
            plumbingStatus: plumbingStatus || null,
            doubleGlazing,
            securityDoor,
          };
          break;

        case "description":
          // Both description and short description go to listings table only
          listingData = {
            description: (
              document.getElementById("description") as HTMLTextAreaElement
            )?.value,
            shortDescription: // Use camelCase for TypeScript/Drizzle field name
            (document.getElementById("shortDescription") as HTMLTextAreaElement)
              ?.value,
          };
          // No propertyData for descriptions - they belong in listings only
          break;

        case "rentalProperties":
          // Only save rental characteristics for Rent listings
          // For Sale listings, duplicateForRent is just UI state, not saved to DB
          listingData = {
            internet,
            studentFriendly,
            petsAllowed,
            appliancesIncluded,
          };
          // No propertyData for rental properties - these are listing-specific
          break;

        case "propertyExpenses":
          // Property expenses go to properties table
          propertyData = {
            ibi,
            garbageTax,
            vadoPermanente,
            communityFees,
            derrama,
            electricityEstimate,
            gasEstimate,
            waterEstimate,
            centralHeatingFee,
            internetEstimate,
            homeInsurance,
          };
          break;

        case "rentalTerms":
          // Rental terms go to listings table
          listingData = {
            securityDeposit,
            additionalGuarantee,
            bankGuaranteeRequired,
            managementFees,
            nonPaymentInsurance,
            nonPaymentInsuranceAmount,
          };
          break;
      }

      // Update property if there's property data
      if (Object.keys(propertyData).length > 0) {
        await updateProperty(propertyId, propertyData);
      }

      // Update listing if there's listing data
      if (Object.keys(listingData).length > 0) {
        await updateListingWithAuth(listingId, listingData);
      }

      setModuleStates((prev) => {
        const currentState = prev[moduleName] ?? {
          saveState: "idle" as SaveState,
          hasChanges: false,
        };
        return {
          ...prev,
          [moduleName]: {
            ...currentState,
            saveState: "saved",
            hasChanges: false,
            lastSaved: new Date(),
          },
        };
      });

      // Update current title state if location was saved with a new title
      if (moduleName === "location" && propertyData.title) {
        setCurrentTitle(propertyData.title as string);
        console.log(
          "✅ [SAVE] Updated local title state to:",
          propertyData.title,
        );
        // Refresh server components to update PropertyHeader with new title
        router.refresh();
      }

      toast.success("Cambios guardados correctamente");

      // Reset to idle state after 2 seconds
      setTimeout(() => {
        setModuleStates((prev) => {
          const currentState = prev[moduleName] ?? {
            saveState: "idle" as SaveState,
            hasChanges: false,
          };
          return {
            ...prev,
            [moduleName]: {
              ...currentState,
              saveState: "idle",
              hasChanges: currentState.hasChanges,
            },
          };
        });
      }, 2000);
    } catch (error) {
      console.error(`Error saving ${moduleName}:`, error);

      setModuleStates((prev) => {
        const currentState = prev[moduleName] ?? {
          saveState: "idle" as SaveState,
          hasChanges: false,
        };
        return {
          ...prev,
          [moduleName]: {
            ...currentState,
            saveState: "error",
            hasChanges: currentState.hasChanges,
          },
        };
      });

      toast.error("Error al guardar los cambios");

      // Reset to modified state after 3 seconds if there are changes
      setTimeout(() => {
        setModuleStates((prev) => {
          const currentState = prev[moduleName] ?? {
            saveState: "idle" as SaveState,
            hasChanges: false,
          };
          return {
            ...prev,
            [moduleName]: {
              ...currentState,
              saveState: currentState.hasChanges ? "modified" : "idle",
              hasChanges: currentState.hasChanges,
            },
          };
        });
      }, 3000);
    }
  };

  const [listingTypes, setListingTypes] = useState<string[]>(
    listing.listingType ? [listing.listingType] : ["Sale"], // Default to 'Sale' if none selected
  );
  const [isBankOwned, setIsBankOwned] = useState(listing.isBankOwned ?? false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isFurnished, setIsFurnished] = useState(listing.isFurnished ?? false);
  const [isHeating, setIsHeating] = useState(listing.hasHeating ?? false);
  const [heatingType, setHeatingType] = useState(listing.heatingType ?? "");
  const [isHotWater, setIsHotWater] = useState(!!listing.hotWaterType);
  const [isAirConditioning, setIsAirConditioning] = useState(
    !!listing.airConditioningType,
  );
  const [airConditioningType, setAirConditioningType] = useState(
    listing.airConditioningType ?? "",
  );
  const [studentFriendly, setStudentFriendly] = useState(
    listing.studentFriendly ?? false,
  );
  const [petsAllowed, setPetsAllowed] = useState(listing.petsAllowed ?? false);
  const [appliancesIncluded, setAppliancesIncluded] = useState(
    listing.appliancesIncluded ?? false,
  );
  const [isExterior, setIsExterior] = useState(listing.exterior ?? false);
  const [orientation, setOrientation] = useState(listing.orientation ?? "");
  const [isBright, setIsBright] = useState(listing.bright ?? false);
  const [hasEscaparate, setHasEscaparate] = useState(listing.hasEscaparate ?? false);
  const [finca, setFinca] = useState(listing.finca ?? false); // For 'casa' - has estate/land
  const [superficieFinca, setSuperficieFinca] = useState<number | null>(
    listing.superficieFinca ?? null,
  ); // For 'casa' - estate surface area in m²
  const [garageType, setGarageType] = useState(listing.garageType ?? "");
  const [garageSpaces, setGarageSpaces] = useState(() => {
    const spaces = listing.garageSpaces;
    return spaces && !isNaN(Number(spaces)) ? Number(spaces) : 1;
  });
  const [garageInBuilding, setGarageInBuilding] = useState(
    listing.garageInBuilding ?? false,
  );
  const [garageNumber, setGarageNumber] = useState(listing.garageNumber ?? "");
  const [storageRoomSize, setStorageRoomSize] = useState(() => {
    const size = listing.storageRoomSize;
    return size && !isNaN(Number(size)) ? Number(size) : 0;
  });
  const [storageRoomNumber, setStorageRoomNumber] = useState(
    listing.storageRoomNumber ?? "",
  );
  const [hasElevator, setHasElevator] = useState(listing.hasElevator ?? false);
  const [hasGarage, setHasGarage] = useState(listing.hasGarage ?? false);
  const [hasStorageRoom, setHasStorageRoom] = useState(
    listing.hasStorageRoom ?? false,
  );
  const [disabledAccessible, setDisabledAccessible] = useState(
    listing.disabledAccessible ?? false,
  );
  const [vpo, setVpo] = useState(listing.vpo ?? false);
  const [videoIntercom, setVideoIntercom] = useState(
    listing.videoIntercom ?? false,
  );
  const [conciergeService, setConciergeService] = useState(
    listing.conciergeService ?? false,
  );
  const [securityGuard, setSecurityGuard] = useState(
    listing.securityGuard ?? false,
  );
  const [satelliteDish, setSatelliteDish] = useState(
    listing.satelliteDish ?? false,
  );
  const [doubleGlazing, setDoubleGlazing] = useState(
    listing.doubleGlazing ?? false,
  );
  const [alarm, setAlarm] = useState(listing.alarm ?? false);
  const [securityDoor, setSecurityDoor] = useState(
    listing.securityDoor ?? false,
  );
  const [lastRenovationYear, setLastRenovationYear] = useState(
    listing.lastRenovationYear ?? listing.yearBuilt ?? "",
  );
  const [kitchenType, setKitchenType] = useState(listing.kitchenType ?? "");
  const [hotWaterType, setHotWaterType] = useState(listing.hotWaterType ?? "");
  const [openKitchen, setOpenKitchen] = useState(listing.openKitchen ?? false);
  const [frenchKitchen, setFrenchKitchen] = useState(
    listing.frenchKitchen ?? false,
  );
  const [furnishedKitchen, setFurnishedKitchen] = useState(
    listing.furnishedKitchen ?? false,
  );
  const [pantry, setPantry] = useState(listing.pantry ?? false);
  const [terrace, setTerrace] = useState(listing.terrace ?? false);
  const [terraceSize, setTerraceSize] = useState<number | null>(
    listing.terraceSize ?? null,
  );
  const [wineCellar, setWineCellar] = useState(listing.wineCellar ?? false);
  const [wineCellarSize, setWineCellarSize] = useState<number | null>(
    listing.wineCellarSize ?? null,
  );
  const [livingRoomSize, setLivingRoomSize] = useState<number | null>(
    listing.livingRoomSize ?? null,
  );
  const [balconyCount, setBalconyCount] = useState<number | null>(
    listing.balconyCount ?? null,
  );
  const [galleryCount, setGalleryCount] = useState<number | null>(
    listing.galleryCount ?? null,
  );
  const [buildingFloors, setBuildingFloors] = useState(
    listing.buildingFloors ?? 0,
  );
  // State for builtSurfaceArea and yearBuilt (used for cadastral corrections sync)
  const [builtSurfaceArea, setBuiltSurfaceArea] = useState<number | undefined>(
    listing.builtSurfaceArea ? Math.round(listing.builtSurfaceArea) : undefined,
  );
  const [yearBuilt, setYearBuilt] = useState<number | undefined>(
    listing.yearBuilt ?? undefined,
  );
  const [builtInWardrobes, setBuiltInWardrobes] = useState<boolean>(
    Boolean(listing.builtInWardrobes) ?? false,
  );
  const [mainFloorType, setMainFloorType] = useState(
    listing.mainFloorType ?? "",
  );
  const [shutterType, setShutterType] = useState(listing.shutterType ?? "");
  const [carpentryType, setCarpentryType] = useState(
    listing.carpentryType ?? "",
  );
  const [windowType, setWindowType] = useState(listing.windowType ?? "");
  const [electricityType, setElectricityType] = useState(
    listing.electricityType ?? "",
  );
  const [electricityStatus, setElectricityStatus] = useState(
    listing.electricityStatus ?? "",
  );
  const [plumbingType, setPlumbingType] = useState(listing.plumbingType ?? "");
  const [plumbingStatus, setPlumbingStatus] = useState(
    listing.plumbingStatus ?? "",
  );
  const [views, setViews] = useState(listing.views ?? false);
  const [mountainViews, setMountainViews] = useState(
    listing.mountainViews ?? false,
  );
  const [seaViews, setSeaViews] = useState(listing.seaViews ?? false);
  const [beachfront, setBeachfront] = useState(listing.beachfront ?? false);
  const [jacuzzi, setJacuzzi] = useState(listing.jacuzzi ?? false);
  const [hydromassage, setHydromassage] = useState(
    listing.hydromassage ?? false,
  );
  const [garden, setGarden] = useState(listing.garden ?? false);
  const [pool, setPool] = useState(listing.pool ?? false);
  const [homeAutomation, setHomeAutomation] = useState(
    listing.homeAutomation ?? false,
  );
  const [musicSystem, setMusicSystem] = useState(listing.musicSystem ?? false);
  const [laundryRoom, setLaundryRoom] = useState(listing.laundryRoom ?? false);
  const [coveredClothesline, setCoveredClothesline] = useState(
    listing.coveredClothesline ?? false,
  );
  const [fireplace, setFireplace] = useState(listing.fireplace ?? false);
  const [sauna, setSauna] = useState(listing.sauna ?? false);
  const [loadingArea, setLoadingArea] = useState(listing.loadingArea ?? false);
  const [patio, setPatio] = useState(listing.patio ?? false);
  const [allowedUse, setAllowedUse] = useState(listing.allowedUse ?? 0);
  const [city, setCity] = useState(listing.city ?? "");
  const [province, setProvince] = useState(listing.province ?? "");
  const [municipality, setMunicipality] = useState(listing.municipality ?? "");
  const [streetType, setStreetType] = useState(listing.streetType ?? "");
  const [showAdditionalCharacteristics, setShowAdditionalCharacteristics] =
    useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [optionalGaragePrice, setOptionalGaragePrice] = useState(() => {
    const price = listing.optionalGaragePrice;
    return price && !isNaN(Number(price)) ? Number(price) : 0;
  });
  const [optionalStorageRoomPrice, setOptionalStorageRoomPrice] = useState(
    () => {
      const price = listing.optionalStorageRoomPrice;
      return price && !isNaN(Number(price)) ? Number(price) : 0;
    },
  );
  const [selectedAgentId, setSelectedAgentId] = useState(
    listing.agent?.id?.toString() ?? "",
  );
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [newConstruction, setNewConstruction] = useState(
    listing.newConstruction ?? false,
  );

  // Rental-specific fields (only for rent operations)
  const [rentalType, setRentalType] = useState<"residential" | "seasonal" | "short_term" | undefined>(
    listing.rentalType,
  );
  const [shortTermLicense, setShortTermLicense] = useState(
    listing.shortTermLicense ?? "",
  );

  // Sale-specific fields (only for sale operations)
  const [occupationStatus, setOccupationStatus] = useState<"free" | "tenanted" | "bare_ownership" | "illegally_occupied" | undefined>(
    listing.occupationStatus,
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [description, setDescription] = useState(listing.description ?? "");
  const [shortDescription, setShortDescription] = useState(
    listing.shortDescription ?? "",
  );
  const [isMapsPopupOpen, setIsMapsPopupOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteListingModalOpen, setIsDeleteListingModalOpen] =
    useState(false);
  const [isDeletingListing, setIsDeletingListing] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Ref for contact info card
  const contactInfoRef = useRef<HTMLDivElement>(null);

  // State for collapsible sections (all closed by default)
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({
    basicInfo: true,
    propertyDetails: true,
    location: true,
    features: true,
    contactInfo: true,
    orientation: true,
    additionalCharacteristics: true,
    premiumFeatures: true,
    additionalSpaces: true,
    materials: true,
    description: true,
    rentalProperties: true,
    propertyExpenses: true,
    rentalTerms: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handler to expand and scroll to contact info section
  const handleEditOwner = () => {
    // Expand the contact info section
    setCollapsedSections((prev) => ({
      ...prev,
      contactInfo: false,
    }));

    // Scroll to the contact info card after a short delay to allow the section to expand
    setTimeout(() => {
      contactInfoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // New community amenity states
  const [gym, setGym] = useState(listing.gym ?? false);
  const [sportsArea, setSportsArea] = useState(listing.sportsArea ?? false);
  const [childrenArea, setChildrenArea] = useState(
    listing.childrenArea ?? false,
  );
  const [suiteBathroom, setSuiteBathroom] = useState(
    listing.suiteBathroom ?? false,
  );
  const [nearbyPublicTransport, setNearbyPublicTransport] = useState(
    listing.nearbyPublicTransport ?? false,
  );
  const [communityPool, setCommunityPool] = useState(
    listing.communityPool ?? false,
  );
  const [privatePool, setPrivatePool] = useState(listing.privatePool ?? false);
  const [tennisCourt, setTennisCourt] = useState(listing.tennisCourt ?? false);
  const [communityArea, setCommunityArea] = useState(
    listing.communityArea ?? false,
  );

  // Appliance states from listings
  const [internet, setInternet] = useState(listing.internet ?? false);
  const [oven, setOven] = useState(listing.oven ?? false);
  const [microwave, setMicrowave] = useState(listing.microwave ?? false);
  const [washingMachine, setWashingMachine] = useState(
    listing.washingMachine ?? false,
  );
  const [secadora, setSecadora] = useState(listing.secadora ?? false);
  const [fridge, setFridge] = useState(listing.fridge ?? false);
  const [tv, setTv] = useState(listing.tv ?? false);
  const [stoneware, setStoneware] = useState(listing.stoneware ?? false);

  // Furniture quality state
  const [furnitureQuality, setFurnitureQuality] = useState(
    listing.furnitureQuality ?? "",
  );

  // Property Expenses - Taxes & Fees
  const [ibi, setIbi] = useState<number | null>(listing.ibi ?? null);
  const [garbageTax, setGarbageTax] = useState<number | null>(
    listing.garbageTax ?? null,
  );
  const [vadoPermanente, setVadoPermanente] = useState<number | null>(
    listing.vadoPermanente ?? null,
  );
  // Property Expenses - Community
  const [communityFees, setCommunityFees] = useState<number | null>(
    listing.communityFees ?? null,
  );
  const [derrama, setDerrama] = useState<number | null>(listing.derrama ?? null);
  // Property Expenses - Utilities
  const [electricityEstimate, setElectricityEstimate] = useState<number | null>(
    listing.electricityEstimate ?? null,
  );
  const [gasEstimate, setGasEstimate] = useState<number | null>(
    listing.gasEstimate ?? null,
  );
  const [waterEstimate, setWaterEstimate] = useState<number | null>(
    listing.waterEstimate ?? null,
  );
  const [centralHeatingFee, setCentralHeatingFee] = useState<number | null>(
    listing.centralHeatingFee ?? null,
  );
  const [internetEstimate, setInternetEstimate] = useState<number | null>(
    listing.internetEstimate ?? null,
  );
  // Property Expenses - Insurance
  const [homeInsurance, setHomeInsurance] = useState<number | null>(
    listing.homeInsurance ?? null,
  );

  // Rental Terms
  const [securityDeposit, setSecurityDeposit] = useState<number | null>(
    listing.securityDeposit ?? null,
  );
  const [additionalGuarantee, setAdditionalGuarantee] = useState<number | null>(
    listing.additionalGuarantee ?? null,
  );
  const [bankGuaranteeRequired, setBankGuaranteeRequired] = useState(
    listing.bankGuaranteeRequired ?? false,
  );
  const [managementFees, setManagementFees] = useState<number | null>(
    listing.managementFees ?? null,
  );
  const [nonPaymentInsurance, setNonPaymentInsurance] = useState(
    listing.nonPaymentInsurance ?? false,
  );
  const [nonPaymentInsuranceAmount, setNonPaymentInsuranceAmount] = useState<
    number | null
  >(listing.nonPaymentInsuranceAmount ?? null);

  // Rental duplicate state
  const [duplicateForRent, setDuplicateForRent] = useState(false);
  const [rentalPrice, setRentalPrice] = useState(0);

  // Toggle button states
  const [, setHasKeys] = useState<boolean>(false);
  // const [keysLoading, setKeysLoading] = useState(false);
  const [, setPublishToWebsite] = useState<boolean>(false);
  // const [websiteLoading, setWebsiteLoading] = useState(false);

  // First property image URL
  const [firstImageUrl, setFirstImageUrl] = useState<string | null>(null);

  // Permissions
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // Filter owners based on search
  const filteredOwners = owners.filter((owner) =>
    owner.name.toLowerCase().includes(ownerSearch.toLowerCase()),
  );

  // Set selectedAgentId and selectedOwnerIds from listing data
  useEffect(() => {
    if (listing.agent?.id) {
      setSelectedAgentId(listing.agent.id.toString());
    }
    if (listing.owners && listing.owners.length > 0) {
      setSelectedOwnerIds(listing.owners.map((owner) => owner.id.toString()));
    }
    // Set toggle states from listing data
    if (listing.hasKeys !== undefined) {
      setHasKeys(listing.hasKeys);
    }
    if (listing.publishToWebsite !== undefined) {
      setPublishToWebsite(listing.publishToWebsite);
    }
  }, [listing.agent?.id, listing.owners, listing.hasKeys, listing.publishToWebsite]);

  // Simplified data fetching - only fetch dropdown lists and permissions
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        console.log("Fetching dropdown lists and permissions...");

        // Only fetch what's needed for dropdowns and permissions
        const [
          agentsData,
          potentialOwnersData,
          firstImage,
          hasDeletePermission,
          hasEditPermission,
        ] = await Promise.all([
          getAllAgentsWithAuth(), // For agent dropdown in ContactInfoCard
          getAllPotentialOwnersWithAuth(), // For owner dropdown in ContactInfoCard
          listing.propertyId
            ? getFirstImage(Number(listing.propertyId))
            : Promise.resolve(null),
          canDeleteProperties(),
          canEditProperties(),
        ]);

        // Process agents data for dropdown
        setAgents(
          agentsData.map((agent) => ({
            id: agent.id,
            name: agent.name,
          })),
        );

        // Process owners data for dropdown
        setOwners(
          potentialOwnersData.map((owner) => ({
            id: Number(owner.id),
            name: owner.name,
          })),
        );

        // Set first image URL
        setFirstImageUrl(firstImage);

        // Set permissions
        setCanDelete(hasDeletePermission);
        setCanEdit(hasEditPermission);
        console.log("🔐 Permission Checks:", {
          hasDeletePermission,
          hasEditPermission,
          willShowDeleteButtons: hasDeletePermission ? "YES" : "NO",
          formMode: hasEditPermission ? "EDIT MODE" : "READ-ONLY MODE",
        });

        console.log(
          "✅ Dropdown lists and permissions loaded - Using listing data for display!",
        );
      } catch (error) {
        console.error("❌ Error fetching dropdown data:", error);
        // Set fallback values on error (but keep listing data)
        setAgents([]);
        setOwners([]);
        setFirstImageUrl(null);
        setCanDelete(false);
        setCanEdit(false);
      }
    };

    void fetchFormData();
  }, [listing.propertyId]); // Removed serverAgents, serverOwners, serverCurrentOwners - no longer needed

  // Listen for command palette navigation events
  useEffect(() => {
    const handleNavigateToField = (event: Event) => {
      const customEvent = event as CustomEvent<{
        sectionKey: string;
        inputId: string;
        label: string;
      }>;
      const { sectionKey, inputId } = customEvent.detail;

      // Expand the section if it's collapsed
      setCollapsedSections((prev) => ({
        ...prev,
        [sectionKey]: false,
      }));

      // Wait for DOM update then scroll and focus
      setTimeout(() => {
        const element = document.getElementById(inputId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Focus after scroll completes
          setTimeout(() => {
            element.focus();
          }, 300);
        }
      }, 100);
    };

    window.addEventListener("vesta:navigate-to-field", handleNavigateToField);
    return () => {
      window.removeEventListener(
        "vesta:navigate-to-field",
        handleNavigateToField,
      );
    };
  }, []);

  // Toggle handlers
  // const handleToggleKeys = async () => {
  //   if (keysLoading) return;

  //   setKeysLoading(true);
  //   const previousValue = hasKeys;

  //   // Optimistic update
  //   setHasKeys(!hasKeys);

  //   try {
  //     const result = await toggleListingKeysWithAuth(Number(listing.listingId));
  //     setHasKeys(result.hasKeys);

  //     // Show success toast
  //     if (result.hasKeys) {
  //       toast.success("Marcado: Tenemos las llaves");
  //     } else {
  //       toast.success("Desmarcado: No tenemos las llaves");
  //     }
  //   } catch (error) {
  //     console.error("Error toggling keys:", error);
  //     // Revert optimistic update on error
  //     setHasKeys(previousValue);
  //     toast.error("Error al actualizar el estado de las llaves");
  //   } finally {
  //     setKeysLoading(false);
  //   }
  // };

  // const handleToggleWebsite = async () => {
  //   if (websiteLoading) return;

  //   setWebsiteLoading(true);
  //   const previousValue = publishToWebsite;

  //   // Optimistic update
  //   setPublishToWebsite(!publishToWebsite);

  //   try {
  //     const result = await toggleListingPublishToWebsiteWithAuth(
  //       Number(listing.listingId),
  //     );
  //     setPublishToWebsite(result.publishToWebsite);

  //     // Show success toast
  //     if (result.publishToWebsite) {
  //       toast.success("Publicado en la web");
  //     } else {
  //       toast.success("Retirado de la web");
  //     }
  //   } catch (error) {
  //     console.error("Error toggling publishToWebsite:", error);
  //     // Revert optimistic update on error
  //     setPublishToWebsite(previousValue);
  //     toast.error("Error al actualizar el estado de publicación");
  //   } finally {
  //     setWebsiteLoading(false);
  //   }
  // };

  const toggleListingType = (type: string) => {
    setListingTypes([type]); // Replace the current type with the new one
    updateModuleState("basicInfo", true);
  };

  const handleSecondaryListingType = (
    type: "RentWithOption" | "RoomSharing" | "Transfer",
  ) => {
    if (type === "RentWithOption") {
      if (listingTypes[0] === "RentWithOption") {
        setListingTypes(["Rent"]);
      } else {
        setListingTypes(["RentWithOption"]);
      }
    } else if (type === "RoomSharing") {
      if (listingTypes[0] === "RoomSharing") {
        setListingTypes(["Rent"]);
      } else {
        setListingTypes(["RoomSharing"]);
      }
    } else if (type === "Transfer") {
      if (listingTypes[0] === "Transfer") {
        setListingTypes(["Sale"]);
      } else {
        setListingTypes(["Transfer"]);
      }
    }
    updateModuleState("basicInfo", true);
  };

  const handlePropertyTypeChange = async (newType: string) => {
    setPropertyType(newType); // Update local state only, don't change URL

    // Only update property type, NOT the title (title stays as-is)
    try {
      const propertyId = Number(listing.propertyId);
      if (!propertyId) {
        throw new Error("Property ID is required");
      }

      await updateProperty(propertyId, {
        propertyType: newType,
      });

      // Update local listing data
      listing.propertyType = newType;

      toast.success("Tipo de propiedad actualizado");
    } catch (error) {
      console.error("Error updating property type:", error);
      toast.error("Error al actualizar el tipo de propiedad");
    }
  };

  const handleGenerateDescription = async () => {
    try {
      setIsGenerating(true);
      const listingWithNumberTypes = {
        ...listing,
        lastRenovationYear: lastRenovationYear
          ? String(lastRenovationYear)
          : undefined,
      };
      const generatedDescription = await generatePropertyDescription(
        listingWithNumberTypes,
      );
      setDescription(generatedDescription);
      // Update the textarea value
      const descriptionTextarea = document.getElementById(
        "description",
      ) as HTMLTextAreaElement;
      if (descriptionTextarea) {
        descriptionTextarea.value = generatedDescription;
        // Trigger the change event to mark the module as modified
        updateModuleState("description", true);
      }
    } catch (error) {
      console.error("Error generating description:", error);
      // You might want to show a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateShortDescription = async () => {
    try {
      setIsGeneratingShort(true);

      let fullDescription = description;

      // Check if we have a full description to summarize
      if (!fullDescription || fullDescription.trim() === "") {
        // If no full description exists, generate it first without setting isGenerating state
        const listingWithNumberTypes = {
          ...listing,
          lastRenovationYear: lastRenovationYear
            ? String(lastRenovationYear)
            : undefined,
        };
        fullDescription = await generatePropertyDescription(
          listingWithNumberTypes,
        );
        setDescription(fullDescription);
      }

      // Now generate short description based on the full description
      if (fullDescription && fullDescription.trim() !== "") {
        const listingWithStringTypes = {
          ...listing,
          lastRenovationYear: lastRenovationYear
            ? String(lastRenovationYear)
            : undefined,
        };

        const generatedShortDescription =
          await generateShortPropertyDescription(
            fullDescription,
            listingWithStringTypes,
          );

        setShortDescription(generatedShortDescription);

        // Update the textarea value
        const shortDescTextarea = document.getElementById(
          "shortDescription",
        ) as HTMLTextAreaElement;
        if (shortDescTextarea) {
          shortDescTextarea.value = generatedShortDescription;
          // Trigger the change event to mark the module as modified
          updateModuleState("description", true);
        }
      } else {
        console.error("No full description available to summarize");
      }
    } catch (error) {
      console.error("Error generating short description:", error);
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!listing.propertyId) {
      toast.error("No se pudo encontrar la propiedad a eliminar");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deletePropertyWithAuth(Number(listing.propertyId));

      if (result.success) {
        toast.success(result.message);
        // Redirect to properties list after successful deletion
        router.push("/propiedades");
      } else {
        toast.error("Error al eliminar la propiedad");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Error al eliminar la propiedad");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing.listingId) {
      toast.error("No se pudo encontrar el anuncio a eliminar");
      return;
    }

    setIsDeletingListing(true);

    try {
      const result = await deleteListingWithAuth(Number(listing.listingId));

      if (result.success) {
        toast.success(result.message);
        // Redirect to properties list after successful deletion
        router.push("/propiedades");
      } else {
        toast.error("Error al eliminar el anuncio");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Error al eliminar el anuncio");
    } finally {
      setIsDeletingListing(false);
      setIsDeleteListingModalOpen(false);
    }
  };

  const handleDiscardListing = async () => {
    if (!listing.listingId) {
      toast.error("No se pudo encontrar el anuncio a descartar");
      return;
    }

    setIsDiscarding(true);

    try {
      const result = await discardListingWithAuth(Number(listing.listingId));

      if (result.success) {
        toast.success(result.message);
        // Reload the page to reflect the updated status
        window.location.reload();
      } else {
        toast.error("Error al descartar el anuncio");
      }
    } catch (error) {
      console.error("Error discarding listing:", error);
      toast.error("Error al descartar el anuncio");
    } finally {
      setIsDiscarding(false);
      setIsDiscardModalOpen(false);
    }
  };

  const handleRecoverListing = async () => {
    if (!listing.listingId) {
      toast.error("No se pudo encontrar el anuncio a recuperar");
      return;
    }

    setIsDiscarding(true);

    try {
      const result = await recoverListingWithAuth(Number(listing.listingId));

      if (result.success) {
        toast.success(result.message);
        // Reload the page to reflect the updated status
        window.location.reload();
      } else {
        toast.error("Error al recuperar el anuncio");
      }
    } catch (error) {
      console.error("Error recovering listing:", error);
      toast.error("Error al recuperar el anuncio");
    } finally {
      setIsDiscarding(false);
      setIsDiscardModalOpen(false);
    }
  };

  const getCardStyles = (moduleName: string) => {
    const state = moduleStates[moduleName]?.saveState;

    switch (state) {
      case "modified":
        return "ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 border-amber-500/20";
      case "saving":
        return "ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10 border-amber-500/20";
      case "saved":
        return "ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 border-emerald-500/20";
      case "error":
        return "ring-2 ring-red-500/20 shadow-lg shadow-red-500/10 border-red-500/20";
      default:
        return "hover:shadow-lg transition-all duration-300";
    }
  };

  // Add this near the top of the component, after listingTypes is defined
  const currentListingType = listingTypes[0] ?? "";

  // Debug logging for delete permission
  console.log("🔍 Render - Delete Permission State:", {
    canDelete,
    willRenderButtons: canDelete
      ? "YES - Buttons will be visible"
      : "NO - Buttons will be hidden",
  });

  return (
    <div className="space-y-4">
      {/* Read-Only Mode Banner */}
      {/* Top row - always full width */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {/* Property Summary */}
        <PropertySummaryCard
          listing={listing}
          propertyType={propertyType}
          selectedOwnerIds={selectedOwnerIds}
          owners={owners}
          selectedAgentId={selectedAgentId}
          agents={agents}
          canEdit={canEdit}
          onEditOwner={handleEditOwner}
        />

        {/* Property Status Row with Process Tracker and Image Preview */}
        <PropertyStatusRow
          firstImageUrl={firstImageUrl}
          oportunidadStatus={null}
          propertyType={propertyType}
          propertyId={listing.propertyId}
          createdAt={listing.createdAt ?? null}
          listing={listing as unknown as Record<string, unknown>}
          currentUserId={currentUserId}
          currentUser={currentUser}
          onAddComment={onAddComment}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          keysComments={
            comments
              ? comments.filter(
                  (c) => c.category === "keys" && (c.parentId === null || c.parentId === undefined),
                )
              : undefined
          }
          publishToWebsiteComments={
            comments
              ? comments.filter(
                  (c) =>
                    c.category === "publishToWebsite" && (c.parentId === null || c.parentId === undefined),
                )
              : undefined
          }
          cartelComments={
            comments
              ? comments.filter(
                  (c) => c.category === "cartel" && (c.parentId === null || c.parentId === undefined),
                )
              : undefined
          }
          portalsComments={
            comments
              ? comments.filter(
                  (c) =>
                    c.category === "portales" &&
                    (c.parentId === null || c.parentId === undefined),
                )
              : undefined
          }
          enEscaparateComments={
            comments
              ? comments.filter(
                  (c) => c.category === "enEscaparate" && (c.parentId === null || c.parentId === undefined),
                )
              : undefined
          }
        />
      </div>

      {/* Two independent columns */}
      <div className="flex flex-col items-start gap-4 lg:flex-row">
        {/* Left Column */}
        <div className="w-full flex-1 space-y-4">
          {/* Basic Information */}
          <BasicInfoCard
            listing={listing}
            propertyType={propertyType}
            hasPropertyTypeChanged={Boolean(hasPropertyTypeChanged)}
            listingTypes={listingTypes}
            isBankOwned={isBankOwned}
            newConstruction={newConstruction}
            collapsedSections={collapsedSections}
            saveState={moduleStates.basicInfo?.saveState ?? "idle"}
            currentTitle={currentTitle}
            allowedUse={allowedUse}
            canEdit={canEdit}
            rentalType={rentalType}
            shortTermLicense={shortTermLicense}
            occupationStatus={occupationStatus}
            onToggleSection={toggleSection}
            onSave={() => saveModule("basicInfo")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("basicInfo", hasChanges)
            }
            onToggleListingType={toggleListingType}
            onHandleSecondaryListingType={handleSecondaryListingType}
            onPropertyTypeChange={handlePropertyTypeChange}
            onTitleChange={handleTitleChange}
            setAllowedUse={setAllowedUse}
            setIsBankOwned={setIsBankOwned}
            setNewConstruction={setNewConstruction}
            setRentalType={setRentalType}
            setShortTermLicense={setShortTermLicense}
            setOccupationStatus={setOccupationStatus}
            getCardStyles={getCardStyles}
          />

          {/* Property Details */}
          <PropertyDetailsCard
            listing={listing}
            propertyType={propertyType}
            lastRenovationYear={lastRenovationYear.toString()}
            buildingFloors={buildingFloors}
            collapsedSections={collapsedSections}
            saveState={moduleStates.propertyDetails?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("propertyDetails")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("propertyDetails", hasChanges)
            }
            setLastRenovationYear={setLastRenovationYear}
            setBuildingFloors={setBuildingFloors}
            getCardStyles={getCardStyles}
            builtSurfaceArea={builtSurfaceArea}
            yearBuilt={yearBuilt}
            finca={finca}
            superficieFinca={superficieFinca}
            setFinca={setFinca}
            setSuperficieFinca={setSuperficieFinca}
          />

          {/* Features */}
          <FeaturesCard
            listing={listing}
            propertyType={propertyType}
            hasElevator={hasElevator}
            isFurnished={isFurnished}
            furnitureQuality={furnitureQuality}
            isHeating={isHeating}
            heatingType={heatingType}
            isHotWater={isHotWater}
            hotWaterType={hotWaterType}
            isAirConditioning={isAirConditioning}
            airConditioningType={airConditioningType}
            hasGarage={hasGarage}
            garageType={garageType}
            garageSpaces={garageSpaces}
            garageInBuilding={garageInBuilding}
            garageNumber={garageNumber}
            hasStorageRoom={hasStorageRoom}
            storageRoomSize={storageRoomSize}
            storageRoomNumber={storageRoomNumber}
            optionalGaragePrice={optionalGaragePrice}
            optionalStorageRoomPrice={optionalStorageRoomPrice}
            oven={oven}
            microwave={microwave}
            washingMachine={washingMachine}
            secadora={secadora}
            fridge={fridge}
            tv={tv}
            stoneware={stoneware}
            collapsedSections={collapsedSections}
            saveState={moduleStates.features?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("features")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("features", hasChanges)
            }
            setHasElevator={setHasElevator}
            setIsFurnished={setIsFurnished}
            setFurnitureQuality={setFurnitureQuality}
            setIsHeating={setIsHeating}
            setHeatingType={setHeatingType}
            setIsHotWater={setIsHotWater}
            setHotWaterType={setHotWaterType}
            setIsAirConditioning={setIsAirConditioning}
            setAirConditioningType={setAirConditioningType}
            setHasGarage={setHasGarage}
            setGarageType={setGarageType}
            setGarageSpaces={setGarageSpaces}
            setGarageInBuilding={setGarageInBuilding}
            setGarageNumber={setGarageNumber}
            setHasStorageRoom={setHasStorageRoom}
            setStorageRoomSize={setStorageRoomSize}
            setStorageRoomNumber={setStorageRoomNumber}
            setOptionalGaragePrice={setOptionalGaragePrice}
            setOptionalStorageRoomPrice={setOptionalStorageRoomPrice}
            setOven={setOven}
            setMicrowave={setMicrowave}
            setWashingMachine={setWashingMachine}
            setSecadora={setSecadora}
            setFridge={setFridge}
            setTv={setTv}
            setStoneware={setStoneware}
            getCardStyles={getCardStyles}
          />

          {/* Additional Characteristics */}
          <AdditionalCharacteristicsCard
            disabledAccessible={disabledAccessible}
            vpo={vpo}
            videoIntercom={videoIntercom}
            conciergeService={conciergeService}
            securityGuard={securityGuard}
            satelliteDish={satelliteDish}
            doubleGlazing={doubleGlazing}
            alarm={alarm}
            securityDoor={securityDoor}
            loadingArea={loadingArea}
            kitchenType={kitchenType}
            openKitchen={openKitchen}
            frenchKitchen={frenchKitchen}
            furnishedKitchen={furnishedKitchen}
            pantry={pantry}
            propertyType={propertyType}
            showAdditionalCharacteristics={showAdditionalCharacteristics}
            saveState={
              moduleStates.additionalCharacteristics?.saveState ?? "idle"
            }
            canEdit={canEdit}
            onSave={() => saveModule("additionalCharacteristics")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("additionalCharacteristics", hasChanges)
            }
            setDisabledAccessible={setDisabledAccessible}
            setVpo={setVpo}
            setVideoIntercom={setVideoIntercom}
            setConciergeService={setConciergeService}
            setSecurityGuard={setSecurityGuard}
            setSatelliteDish={setSatelliteDish}
            setDoubleGlazing={setDoubleGlazing}
            setAlarm={setAlarm}
            setSecurityDoor={setSecurityDoor}
            setLoadingArea={setLoadingArea}
            setKitchenType={setKitchenType}
            setOpenKitchen={setOpenKitchen}
            setFrenchKitchen={setFrenchKitchen}
            setFurnishedKitchen={setFurnishedKitchen}
            setPantry={setPantry}
            setShowAdditionalCharacteristics={setShowAdditionalCharacteristics}
            getCardStyles={getCardStyles}
          />

          {/* Additional Spaces */}
          <AdditionalSpacesCard
            terrace={terrace}
            terraceSize={terraceSize}
            wineCellar={wineCellar}
            wineCellarSize={wineCellarSize}
            livingRoomSize={livingRoomSize}
            balconyCount={balconyCount}
            galleryCount={galleryCount}
            builtInWardrobes={builtInWardrobes}
            propertyType={propertyType}
            collapsedSections={collapsedSections}
            saveState={moduleStates.additionalSpaces?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("additionalSpaces")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("additionalSpaces", hasChanges)
            }
            setTerrace={setTerrace}
            setTerraceSize={setTerraceSize}
            setWineCellar={setWineCellar}
            setWineCellarSize={setWineCellarSize}
            setLivingRoomSize={setLivingRoomSize}
            setBalconyCount={setBalconyCount}
            setGalleryCount={setGalleryCount}
            setBuiltInWardrobes={setBuiltInWardrobes}
            getCardStyles={getCardStyles}
          />

          {/* Rental Terms - Only shows for Rent listings */}
          <RentalTermsCard
            securityDeposit={securityDeposit}
            additionalGuarantee={additionalGuarantee}
            bankGuaranteeRequired={bankGuaranteeRequired}
            managementFees={managementFees}
            nonPaymentInsurance={nonPaymentInsurance}
            nonPaymentInsuranceAmount={nonPaymentInsuranceAmount}
            listingType={currentListingType}
            collapsedSections={collapsedSections}
            saveState={moduleStates.rentalTerms?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("rentalTerms")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("rentalTerms", hasChanges)
            }
            setSecurityDeposit={setSecurityDeposit}
            setAdditionalGuarantee={setAdditionalGuarantee}
            setBankGuaranteeRequired={setBankGuaranteeRequired}
            setManagementFees={setManagementFees}
            setNonPaymentInsurance={setNonPaymentInsurance}
            setNonPaymentInsuranceAmount={setNonPaymentInsuranceAmount}
            getCardStyles={getCardStyles}
          />
        </div>

        {/* Right Column */}
        <div className="w-full flex-1 space-y-4">
          {/* Contact Information */}
          <ContactInfoCard
            ref={contactInfoRef}
            selectedOwnerIds={selectedOwnerIds}
            owners={owners}
            filteredOwners={filteredOwners}
            ownerSearch={ownerSearch}
            selectedAgentId={selectedAgentId}
            agents={agents}
            collapsedSections={collapsedSections}
            saveState={moduleStates.contactInfo?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("contactInfo")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("contactInfo", hasChanges)
            }
            setSelectedOwnerIds={setSelectedOwnerIds}
            setOwnerSearch={setOwnerSearch}
            setSelectedAgentId={setSelectedAgentId}
            getCardStyles={getCardStyles}
          />

          {/* Location */}
          <LocationCard
            listing={listing}
            city={city}
            province={province}
            municipality={municipality}
            streetType={streetType}
            propertyType={propertyType}
            collapsedSections={collapsedSections}
            saveState={moduleStates.location?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("location")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("location", hasChanges)
            }
            setCity={setCity}
            setProvince={setProvince}
            setMunicipality={setMunicipality}
            setStreetType={setStreetType}
            setIsMapsPopupOpen={setIsMapsPopupOpen}
            getCardStyles={getCardStyles}
            setBuiltSurfaceArea={(value) => {
              setBuiltSurfaceArea(value);
              listing.builtSurfaceArea = value;
            }}
            setYearBuilt={(value) => {
              setYearBuilt(value);
              listing.yearBuilt = value;
            }}
            onPropertyDetailsChange={() =>
              updateModuleState("propertyDetails", true)
            }
          />

          {/* Orientation and Exposure */}
          <OrientationCard
            isExterior={isExterior}
            isBright={isBright}
            hasEscaparate={hasEscaparate}
            orientation={orientation}
            propertyType={propertyType}
            collapsedSections={collapsedSections}
            saveState={moduleStates.orientation?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("orientation")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("orientation", hasChanges)
            }
            setIsExterior={setIsExterior}
            setIsBright={setIsBright}
            setHasEscaparate={setHasEscaparate}
            setOrientation={setOrientation}
            getCardStyles={getCardStyles}
          />

          {/* Premium Features */}
          <PremiumFeaturesCard
            propertyType={propertyType}
            views={views}
            mountainViews={mountainViews}
            seaViews={seaViews}
            beachfront={beachfront}
            jacuzzi={jacuzzi}
            hydromassage={hydromassage}
            garden={garden}
            pool={pool}
            homeAutomation={homeAutomation}
            musicSystem={musicSystem}
            laundryRoom={laundryRoom}
            coveredClothesline={coveredClothesline}
            fireplace={fireplace}
            sauna={sauna}
            patio={patio}
            gym={gym}
            sportsArea={sportsArea}
            childrenArea={childrenArea}
            suiteBathroom={suiteBathroom}
            nearbyPublicTransport={nearbyPublicTransport}
            communityPool={communityPool}
            privatePool={privatePool}
            tennisCourt={tennisCourt}
            communityArea={communityArea}
            collapsedSections={collapsedSections}
            saveState={moduleStates.premiumFeatures?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("premiumFeatures")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("premiumFeatures", hasChanges)
            }
            setViews={setViews}
            setMountainViews={setMountainViews}
            setSeaViews={setSeaViews}
            setBeachfront={setBeachfront}
            setJacuzzi={setJacuzzi}
            setHydromassage={setHydromassage}
            setGarden={setGarden}
            setPool={setPool}
            setHomeAutomation={setHomeAutomation}
            setMusicSystem={setMusicSystem}
            setLaundryRoom={setLaundryRoom}
            setCoveredClothesline={setCoveredClothesline}
            setFireplace={setFireplace}
            setSauna={setSauna}
            setPatio={setPatio}
            setGym={setGym}
            setSportsArea={setSportsArea}
            setChildrenArea={setChildrenArea}
            setSuiteBathroom={setSuiteBathroom}
            setNearbyPublicTransport={setNearbyPublicTransport}
            setCommunityPool={setCommunityPool}
            setPrivatePool={setPrivatePool}
            setTennisCourt={setTennisCourt}
            setCommunityArea={setCommunityArea}
            getCardStyles={getCardStyles}
          />

          {/* Materials */}
          <MaterialsCard
            mainFloorType={mainFloorType}
            shutterType={shutterType}
            carpentryType={carpentryType}
            windowType={windowType}
            electricityType={electricityType}
            electricityStatus={electricityStatus}
            plumbingType={plumbingType}
            plumbingStatus={plumbingStatus}
            propertyType={propertyType}
            showMaterials={showMaterials}
            saveState={moduleStates.materials?.saveState ?? "idle"}
            canEdit={canEdit}
            onSave={() => saveModule("materials")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("materials", hasChanges)
            }
            setMainFloorType={setMainFloorType}
            setShutterType={setShutterType}
            setCarpentryType={setCarpentryType}
            setWindowType={setWindowType}
            setElectricityType={setElectricityType}
            setElectricityStatus={setElectricityStatus}
            setPlumbingType={setPlumbingType}
            setPlumbingStatus={setPlumbingStatus}
            setShowMaterials={setShowMaterials}
            getCardStyles={getCardStyles}
          />

          {/* Property Expenses */}
          <PropertyExpensesCard
            ibi={ibi}
            garbageTax={garbageTax}
            vadoPermanente={vadoPermanente}
            communityFees={communityFees}
            derrama={derrama}
            electricityEstimate={electricityEstimate}
            gasEstimate={gasEstimate}
            waterEstimate={waterEstimate}
            centralHeatingFee={centralHeatingFee}
            internetEstimate={internetEstimate}
            homeInsurance={homeInsurance}
            propertyType={propertyType}
            collapsedSections={collapsedSections}
            saveState={moduleStates.propertyExpenses?.saveState ?? "idle"}
            canEdit={canEdit}
            onToggleSection={toggleSection}
            onSave={() => saveModule("propertyExpenses")}
            onUpdateModule={(hasChanges) =>
              updateModuleState("propertyExpenses", hasChanges)
            }
            setIbi={setIbi}
            setGarbageTax={setGarbageTax}
            setVadoPermanente={setVadoPermanente}
            setCommunityFees={setCommunityFees}
            setDerrama={setDerrama}
            setElectricityEstimate={setElectricityEstimate}
            setGasEstimate={setGasEstimate}
            setWaterEstimate={setWaterEstimate}
            setCentralHeatingFee={setCentralHeatingFee}
            setInternetEstimate={setInternetEstimate}
            setHomeInsurance={setHomeInsurance}
            getCardStyles={getCardStyles}
          />
        </div>
      </div>

      {/* Separator before Rental/Description */}
      <Separator className="my-3 opacity-50" />

      {/* Rental Properties Module */}
      <RentalPropertiesCard
        listingType={currentListingType}
        propertyType={propertyType}
        internet={internet}
        studentFriendly={studentFriendly}
        petsAllowed={petsAllowed}
        appliancesIncluded={appliancesIncluded}
        duplicateForRent={duplicateForRent}
        rentalPrice={rentalPrice}
        collapsedSections={collapsedSections}
        saveState={moduleStates.rentalProperties?.saveState ?? "idle"}
        canEdit={canEdit}
        // Listing data for duplication
        propertyId={listing.propertyId}
        listingId={listing.listingId}
        agentId={listing.agent?.id}
        isFurnished={isFurnished}
        furnitureQuality={listing.furnitureQuality ?? ""}
        optionalGaragePrice={optionalGaragePrice}
        optionalStorageRoomPrice={optionalStorageRoomPrice}
        onToggleSection={toggleSection}
        onSave={() => saveModule("rentalProperties")}
        onUpdateModule={(hasChanges) =>
          updateModuleState("rentalProperties", hasChanges)
        }
        setInternet={setInternet}
        setStudentFriendly={setStudentFriendly}
        setPetsAllowed={setPetsAllowed}
        setAppliancesIncluded={setAppliancesIncluded}
        setDuplicateForRent={setDuplicateForRent}
        setRentalPrice={setRentalPrice}
        getCardStyles={getCardStyles}
      />

      {/* Description Module */}
      <DescriptionCard
        description={description}
        shortDescription={shortDescription}
        isGenerating={isGenerating}
        isGeneratingShort={isGeneratingShort}
        signature={signature}
        isSignatureDialogOpen={isSignatureDialogOpen}
        saveState={moduleStates.description?.saveState ?? "idle"}
        canEdit={canEdit}
        onSave={() => saveModule("description")}
        onUpdateModule={(hasChanges) =>
          updateModuleState("description", hasChanges)
        }
        onGenerateDescription={handleGenerateDescription}
        onGenerateShortDescription={handleGenerateShortDescription}
        setSignature={setSignature}
        setIsSignatureDialogOpen={setIsSignatureDialogOpen}
        setDescription={setDescription}
        setShortDescription={setShortDescription}
        getCardStyles={getCardStyles}
      />

      {/* Action Buttons - Discard, Delete Listing, and Delete Property */}
      {canDelete && (
        <div className="mt-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscardModalOpen(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              {listing.status === "Descartado"
                ? "Recuperar anuncio"
                : "Descartar anuncio"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteListingModalOpen(true)}
              className="border-2 border-dashed border-red-500 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Borrar anuncio
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Eliminar propiedad
            </Button>
          </div>
        </div>
      )}
      <ExternalLinkPopup
        isOpen={isMapsPopupOpen}
        onClose={() => setIsMapsPopupOpen(false)}
        url={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.street}, ${city}`)}`}
        title="Google Maps Location"
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProperty}
        title="¿Eliminar propiedad?"
        description="Esta acción eliminará permanentemente la propiedad, todos sus anuncios, imágenes y contactos asociados. No se puede deshacer."
        isDeleting={isDeleting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteListingModalOpen}
        onClose={() => setIsDeleteListingModalOpen(false)}
        onConfirm={handleDeleteListing}
        title="¿Eliminar anuncio?"
        description="Esta acción eliminará el anuncio y sus contactos asociados. La propiedad se mantendrá intacta y podrás crear nuevos anuncios para ella."
        isDeleting={isDeletingListing}
      />
      <DeleteConfirmationModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={
          listing.status === "Descartado"
            ? handleRecoverListing
            : handleDiscardListing
        }
        title={
          listing.status === "Descartado"
            ? "¿Recuperar anuncio?"
            : "¿Descartar anuncio?"
        }
        description={
          listing.status === "Descartado"
            ? "Esta acción reactivará el anuncio y lo volverá a hacer disponible."
            : "Esta acción marcará el anuncio como descartado. Podrás reactivarlo más tarde si es necesario. No se eliminarán datos."
        }
        confirmText={
          listing.status === "Descartado" ? "Recuperar" : "Descartar"
        }
        loadingText={
          listing.status === "Descartado" ? "Recuperando..." : "Descartando..."
        }
        variant={listing.status === "Descartado" ? "default" : "destructive"}
        isDeleting={isDiscarding}
      />
    </div>
  );
}
