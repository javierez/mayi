"use client";

import type { CompleteFormData, ListingDetails } from "./form-context";
import type { Listing } from "~/lib/data";
import {
  updateProperty,
  updatePropertyLocation,
} from "~/server/queries/properties";
import { updateListingWithAuth } from "~/server/queries/listing";
import { updateListingOwnersWithAuth } from "~/server/queries/contact";

export interface SaveOptions {
  showLoading?: boolean;
  markAsCompleted?: boolean;
}

export class FormSaveService {
  static async saveAllFormData(
    listingId: string,
    formData: CompleteFormData,
    listingDetails: ListingDetails,
    options: SaveOptions = {},
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("=== FormSaveService.saveAllFormData CALLED ===");
      console.log("listingId:", listingId);
      console.log("formData received:", formData);
      console.log("listingDetails received:", listingDetails);
      console.log("options:", options);

      const promises: Promise<unknown>[] = [];

      // 1. Update property if we have propertyId
      console.log("=== CHECKING PROPERTY UPDATE ELIGIBILITY ===");
      console.log("listingDetails.propertyId:", listingDetails.propertyId);
      console.log(
        "Is propertyId defined?",
        listingDetails.propertyId !== undefined,
      );

      if (
        listingDetails.propertyId &&
        !isNaN(Number(listingDetails.propertyId))
      ) {
        const propertyUpdateData: Record<string, unknown> = {
          // Basic info from first page
          propertyType: formData.propertyType,
          propertySubtype: formData.propertySubtype ?? null,

          // Basic info
          title: formData.title,

          // Details from second page
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          squareMeter: formData.usefulSurface, // Map usefulSurface to squareMeter (living area)
          builtSurfaceArea: formData.totalSurface, // Map totalSurface to builtSurfaceArea (total built area)
          // plotSurface: formData.plotSurface, // No DB column exists
          // floor: formData.floor, // No DB column exists
          buildingFloors: formData.totalFloors, // Map totalFloors to buildingFloors
          yearBuilt: formData.buildYear, // Map buildYear to yearBuilt
          lastRenovationYear: formData.renovationYear, // Map renovationYear to lastRenovationYear
          needsRenovation: formData.isRenovated ? false : true, // Invert logic: isRenovated -> needsRenovation
          conservationStatus: formData.conservationStatus,
          // condition: formData.condition, // No DB column exists (different from conservationStatus)
          energyConsumptionScale: formData.energyCertificate, // Map energyCertificate to energyConsumptionScale
          emissionsScale: formData.emissions, // Map emissions to emissionsScale
          cadastralReference: formData.cadastralReference,

          // Address from third page
          street: formData.address, // Map address to street
          // addressDetails: undefined, // Additional address details if needed - not in form interface
          // city: formData.city, // City is in locations table via neighborhoodId
          // province: formData.province, // Province is in locations table via neighborhoodId
          postalCode: formData.postalCode,
          // neighborhood: formData.neighborhood, // Should be neighborhoodId (FK to locations)
          latitude: formData.latitude,
          longitude: formData.longitude,

          // Equipment from fourth page
          heatingType: formData.heating, // Map heating to heatingType
          airConditioningType: Array.isArray(formData.airConditioning)
            ? formData.airConditioning.join(", ")
            : formData.airConditioning, // Convert array to string
          hasElevator: formData.hasElevator,
          hasGarage: formData.hasGarage,
          hasStorageRoom: formData.hasStorageRoom,
          terrace: formData.hasTerrace, // Map hasTerrace to terrace
          // balconyCount mapped below from formData.balconyCount

          // Orientation from fifth page
          orientation: formData.orientation,
          // Use individual boolean fields directly
          bright: formData.bright ?? false,
          exterior: formData.exterior ?? false,

          // Additional from sixth page
          disabledAccessible: formData.accessibility ?? false, // Map accessibility to disabledAccessible
          alarm: formData.securitySystem ?? false, // Map securitySystem to alarm
          securityDoor: formData.securitySystem ?? false, // Also map to securityDoor
          conciergeService: formData.doorman ?? false, // Map doorman to conciergeService
          videoIntercom: formData.videoIntercom ?? false, // Map videoIntercom to video_intercom
          securityGuard: formData.securityGuard ?? false, // Map securityGuard to security_guard
          vpo: formData.vpo ?? false, // Map vpo to vpo
          satelliteDish: formData.satelliteDish ?? false, // Map satelliteDish to satellite_dish
          doubleGlazing: formData.doubleGlazing ?? false, // Map doubleGlazing to double_glazing
          openKitchen: formData.openKitchen ?? false, // Map openKitchen to open_kitchen
          frenchKitchen: formData.frenchKitchen ?? false, // Map frenchKitchen to french_kitchen
          furnishedKitchen: formData.designerKitchen ?? false, // Map designerKitchen to furnished_kitchen
          pantry: formData.pantry ?? false, // Map pantry to pantry
          builtInWardrobes: formData.builtInWardrobes ?? false,

          // Luxury from seventh page
          // luxuryFeatures: formData.luxuryFeatures, // No DB column - would need JSON field
          // highEndFinishes: formData.highEndFinishes, // No DB column
          // designerKitchen: formData.designerKitchen, // No DB column
          homeAutomation: formData.smartHome ?? false, // Map smartHome to homeAutomation
          views: Boolean(formData.views) === true ? true : false, // Force boolean conversion
          mountainViews: formData.mountainViews ?? false,
          seaViews: formData.seaViews ?? false,
          beachfront: formData.beachfront ?? false,
          jacuzzi: formData.jacuzzi ?? false, // Map jacuzzi to jacuzzi
          hydromassage: formData.hydromassage ?? false, // Map hydromassage to hydromassage
          fireplace: formData.fireplace ?? false,
          garden: formData.hasGarden ?? false, // Map hasGarden to garden
          pool: formData.hasSwimmingPool ?? false, // Map hasSwimmingPool to pool
          musicSystem: formData.musicSystem ?? false,
          gym: formData.gym ?? false,
          sportsArea: formData.sportsArea ?? false,
          childrenArea: formData.childrenArea ?? false,
          suiteBathroom: formData.suiteBathroom ?? false,
          nearbyPublicTransport: formData.nearbyPublicTransport ?? false,
          communityPool: formData.communityPool ?? false,
          privatePool: formData.privatePool ?? false,
          tennisCourt: formData.tennisCourt ?? false,
          coveredClothesline: formData.coveredClothesline ?? false,

          // Spaces from eighth page
          // hasAttic: formData.hasAttic, // No DB column
          // hasBasement: formData.hasBasement, // No DB column
          laundryRoom: formData.hasLaundryRoom ?? false, // Map hasLaundryRoom to laundryRoom
          // hasOffice: formData.hasOffice, // No DB column
          // hasDressingRoom: formData.hasDressingRoom, // No DB column
          terraceSize: formData.terraceSize,
          balconyCount: formData.balconyCount, // Map balconyCount to balcony_count
          galleryCount: formData.galleryCount,
          wineCellar: formData.wineCellar ?? false,
          wineCellarSize: formData.wineCellarSize,
          livingRoomSize: formData.livingRoomSize,

          // Materials from nineth page
          mainFloorType: formData.mainFloorType, // Database column matches form field
          // wallMaterial: formData.wallMaterial, // No DB column
          kitchenType: formData.kitchenMaterial, // Map kitchenMaterial to kitchenType (though it's more about appliance type)
          // bathroomMaterial: formData.bathroomMaterial, // No DB column
          shutterType: formData.shutterType,
          carpentryType: formData.carpentryType,
          windowType: formData.windowType,

          // Description from description page
          description: formData.description,
          // highlights: formData.highlights, // No DB column - would need JSON field

          // Mark as completed if requested
          ...(options.markAsCompleted && { formPosition: 12 }),

          // Set property as active
          isActive: true,
        };

        console.log("=== PROPERTY UPDATE DATA ===");
        console.log("propertyId:", listingDetails.propertyId);
        console.log("propertyUpdateData:", propertyUpdateData);
        console.log(
          "Property update data keys:",
          Object.keys(propertyUpdateData),
        );

        // Update property data
        promises.push(
          updateProperty(Number(listingDetails.propertyId), propertyUpdateData),
        );

        // Update property location data to resolve neighborhoodId if we have complete location info
        if (
          formData.address &&
          formData.city &&
          formData.province &&
          formData.municipality &&
          formData.neighborhood
        ) {
          promises.push(
            updatePropertyLocation(Number(listingDetails.propertyId), {
              street: formData.address,
              addressDetails: formData.addressDetails ?? "",
              city: formData.city,
              province: formData.province,
              municipality: formData.municipality,
              neighborhood: formData.neighborhood,
              postalCode: formData.postalCode ?? "",
            }),
          );
        }
      } else {
        console.log("=== SKIPPING PROPERTY UPDATES ===");
        console.log("Reason: No valid propertyId available");
        console.log(
          "Property updates will be skipped, but listing updates will proceed",
        );
      }

      // 2. Update listing if we have listingId
      if (listingId) {
        const listingUpdateData: Partial<
          Pick<
            Listing,
            | "price"
            | "listingType"
            | "agentId"
            | "studentFriendly"
            | "petsAllowed"
            | "appliancesIncluded"
            | "internet"
            | "hasKeys"
            | "isFurnished"
            | "furnitureQuality"
            | "optionalGaragePrice"
            | "optionalStorageRoomPrice"
            | "status"
          >
        > = {};

        // Basic listing data
        if (formData.price) listingUpdateData.price = formData.price.toString();
        if (formData.listingType) {
          listingUpdateData.listingType =
            formData.listingType as Listing["listingType"];
        }
        if (formData.agentId) listingUpdateData.agentId = formData.agentId;

        // Rent-specific data
        if (formData.studentFriendly !== undefined)
          listingUpdateData.studentFriendly = formData.studentFriendly;
        if (formData.petsAllowed !== undefined)
          listingUpdateData.petsAllowed = formData.petsAllowed;
        if (formData.appliancesIncluded !== undefined)
          listingUpdateData.appliancesIncluded = formData.appliancesIncluded;
        if (formData.internet !== undefined)
          listingUpdateData.internet = formData.internet;
        if (formData.hasKeys !== undefined)
          listingUpdateData.hasKeys = formData.hasKeys;
        if (formData.isFurnished !== undefined)
          listingUpdateData.isFurnished = formData.isFurnished;
        if (formData.furnitureQuality)
          listingUpdateData.furnitureQuality = formData.furnitureQuality;
        if (formData.optionalGaragePrice !== undefined)
          listingUpdateData.optionalGaragePrice =
            formData.optionalGaragePrice.toString();
        if (formData.optionalStorageRoomPrice !== undefined)
          listingUpdateData.optionalStorageRoomPrice =
            formData.optionalStorageRoomPrice.toString();

        // Handle rentalPrice (can be same as price field, but also separate if needed)
        if (
          formData.rentalPrice !== undefined &&
          formData.listingType === "Rent"
        ) {
          listingUpdateData.price = formData.rentalPrice.toString();
        }

        // Note: duplicateForRent doesn't have a DB column - would need to be added to listings table if needed

        // Mark as active if completed - use Spanish status values
        if (options.markAsCompleted) {
          // Determine correct Spanish status based on listing type
          const listingType =
            formData.listingType ?? listingDetails.listingType;
          if (listingType === "Sale") {
            listingUpdateData.status = "En Venta";
          } else if (
            listingType === "Rent" ||
            listingType === "RentWithOption" ||
            listingType === "RoomSharing"
          ) {
            listingUpdateData.status = "En Alquiler";
          } else {
            // Default fallback
            listingUpdateData.status = "En Venta";
          }
        }

        console.log("=== LISTING UPDATE DATA ===");
        console.log("listingId:", listingId);
        console.log("listingUpdateData:", listingUpdateData);
        console.log(
          "Listing update data keys:",
          Object.keys(listingUpdateData),
        );

        promises.push(
          updateListingWithAuth(Number(listingId), listingUpdateData),
        );
      }

      // 3. Update listing contacts if we have valid contacts
      if (
        listingId &&
        formData.selectedContactIds &&
        formData.selectedContactIds.length > 0
      ) {
        const validContactIds = formData.selectedContactIds
          .filter((id) => id && !isNaN(Number(id)))
          .map((id) => Number(id));

        console.log("=== CONTACT UPDATE DATA ===");
        console.log(
          "Original selectedContactIds:",
          formData.selectedContactIds,
        );
        console.log("Valid contact IDs:", validContactIds);

        if (validContactIds.length > 0) {
          promises.push(
            updateListingOwnersWithAuth(Number(listingId), validContactIds),
          );
        }
      }

      // Execute all save operations
      console.log("=== EXECUTING SAVE OPERATIONS ===");
      console.log("Total promises to execute:", promises.length);

      await Promise.all(promises);

      console.log("=== ALL SAVE OPERATIONS COMPLETED SUCCESSFULLY ===");
      return { success: true };
    } catch (error) {
      console.error("Error saving form data:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al guardar los datos",
      };
    }
  }
}
