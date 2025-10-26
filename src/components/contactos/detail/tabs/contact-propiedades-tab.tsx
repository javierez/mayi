"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Building, Plus, Home } from "lucide-react";
import {
  getOwnerListingsWithAuth,
  getBuyerListingsWithAuth,
  removeListingContactRelationshipWithAuth,
} from "~/server/queries/contact";
import { toast } from "sonner";
import { PropertyCard } from "~/components/property-card";
import type { PropertyListing } from "~/types/property-listing";
import { AddPropertyDialog } from "../add-property-dialog";
import { RemovePropertyDialog } from "../remove-property-dialog";
import { cn } from "~/lib/utils";

// Create a type alias for the PropertyCard's expected Listing type
type PropertyCardListing = {
  listingId: bigint;
  propertyId: bigint;
  price: string;
  status: string;
  listingType: string;
  isActive: boolean | null;
  isFeatured: boolean | null;
  isBankOwned: boolean | null;
  viewCount: number | null;
  inquiryCount: number | null;
  agentName: string | null;
  referenceNumber: string | null;
  title: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  street: string | null;
  addressDetails: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  city: string | null;
  province: string | null;
  municipality: string | null;
  neighborhood: string | null;
  imageUrl: string | null;
  s3key: string | null;
  imageUrl2: string | null;
  s3key2: string | null;
};

interface ContactPropiedadesTabProps {
  contact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    isOwner?: boolean;
    isBuyer?: boolean;
    isInteresado?: boolean;
    ownerCount?: number;
    buyerCount?: number;
    prospectCount?: number;
    contactType?:
      | "demandante"
      | "propietario"
      | "banco"
      | "agencia"
      | "interesado";
  };
  canEdit?: boolean;
}

export function ContactPropiedadesTab({ contact, canEdit = true }: ContactPropiedadesTabProps) {
  // Derive role flags using actual data (flags/counts) and fall back to contactType if present
  const isOwner =
    contact.isOwner === true ||
    (contact.ownerCount ?? 0) > 0 ||
    contact.contactType === "propietario";
  const isBuyer =
    contact.isBuyer === true ||
    (contact.buyerCount ?? 0) > 0 ||
    contact.contactType === "demandante";

  // Property listings for propietario and demandante
  const [contactListings, setContactListings] = useState<PropertyListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Role selection for dual-role contacts (owner + buyer)
  const [selectedRole, setSelectedRole] = useState<"owner" | "buyer">("owner");

  // Add property dialog state
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);

  // Remove property dialog state
  const [showRemovePropertyDialog, setShowRemovePropertyDialog] =
    useState(false);
  const [propertyToRemove, setPropertyToRemove] = useState<{
    listingId: bigint;
    title: string | null;
    street: string | null;
    city: string | null;
    province: string | null;
    price: string;
    propertyType: string | null;
  } | null>(null);
  const [isRemovingProperty, setIsRemovingProperty] = useState(false);

  // Load contact listings if owner or buyer
  useEffect(() => {
    if (isOwner || isBuyer) {
      const loadContactListings = async () => {
        setIsLoadingListings(true);
        try {
          let allListings: unknown[];
          // Use selectedRole to determine which listings to load
          if (selectedRole === "owner" && isOwner) {
            allListings = await getOwnerListingsWithAuth(
              Number(contact.contactId),
            );
          } else if (selectedRole === "buyer" && isBuyer) {
            // For buyer (demandante), get listings where they are the buyer
            allListings = await getBuyerListingsWithAuth(
              Number(contact.contactId),
            );
          } else {
            allListings = [];
          }

          // Show all listings; server already filters by isActive
          setContactListings(allListings as unknown as PropertyListing[]);
        } catch (error) {
          console.error("Error loading contact listings:", error);
          toast.error("Error al cargar las propiedades del contacto");
        } finally {
          setIsLoadingListings(false);
        }
      };
      void loadContactListings();
    }
  }, [contact.contactId, isBuyer, isOwner, selectedRole]);

  // Function to reload contact listings after adding properties
  const reloadContactListings = async () => {
    if (isOwner || isBuyer) {
      setIsLoadingListings(true);
      try {
        let allListings: unknown[];
        // Use selectedRole to determine which listings to reload
        if (selectedRole === "owner" && isOwner) {
          allListings = await getOwnerListingsWithAuth(
            Number(contact.contactId),
          );
        } else if (selectedRole === "buyer" && isBuyer) {
          // For buyer (demandante), get listings where they are the buyer
          allListings = await getBuyerListingsWithAuth(
            Number(contact.contactId),
          );
        } else {
          allListings = [];
        }

        // Show all listings; server already filters by isActive
        setContactListings(allListings as unknown as PropertyListing[]);
      } catch (error) {
        console.error("Error loading contact listings:", error);
        toast.error("Error al cargar las propiedades del contacto");
      } finally {
        setIsLoadingListings(false);
      }
    }
  };

  // Function to handle property removal request
  const handleRemoveProperty = async (listingId: bigint) => {
    // Find the property to show in confirmation dialog
    const property = contactListings.find(
      (listing) => listing.listingId?.toString() === listingId.toString(),
    );

    if (property?.listingId) {
      setPropertyToRemove({
        listingId: BigInt(property.listingId),
        title: property.street ?? null, // Using street as title since PropertyListing doesn't have title
        street: property.street ?? null,
        city: property.city ?? null,
        province: property.province ?? null,
        price: property.price?.toString() ?? "0",
        propertyType: property.propertyType ?? null,
      });
      setShowRemovePropertyDialog(true);
    }
  };

  // Function to confirm property removal
  const handleConfirmRemoveProperty = async () => {
    if (!propertyToRemove) return;

    setIsRemovingProperty(true);
    try {
      await removeListingContactRelationshipWithAuth(
        Number(contact.contactId),
        Number(propertyToRemove.listingId),
        selectedRole,
      );

      // Update the listings state optimistically
      setContactListings((prev) =>
        prev.filter(
          (listing) =>
            listing.listingId?.toString() !==
            propertyToRemove.listingId.toString(),
        ),
      );

      toast.success("Propiedad quitada del contacto correctamente");
      setShowRemovePropertyDialog(false);
      setPropertyToRemove(null);
    } catch (error) {
      console.error("Error removing property from contact:", error);
      toast.error("Error al quitar la propiedad del contacto");
    } finally {
      setIsRemovingProperty(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Role Toggle for dual-role contacts */}
      {isOwner && isBuyer && (
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-50 p-1">
            <button
              onClick={() => setSelectedRole("owner")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                selectedRole === "owner"
                  ? "bg-white shadow-md text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Building className="inline-block h-4 w-4 mr-2" />
              Propiedades
            </button>
            <button
              onClick={() => setSelectedRole("buyer")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                selectedRole === "buyer"
                  ? "bg-white shadow-md text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Home className="inline-block h-4 w-4 mr-2" />
              Intereses
            </button>
          </div>
        </div>
      )}

      <Card className="relative p-4 transition-all duration-500 ease-out">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">
            {selectedRole === "owner" ? "PROPIEDADES ASOCIADAS" : "PROPIEDADES DE INTERÉS"}
          </h3>
          {selectedRole === "buyer" && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowAddPropertyDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Añadir Propiedad
            </Button>
          )}
        </div>

        {isLoadingListings ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-3 aspect-[4/3] rounded-lg bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : contactListings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contactListings.map((listing) => (
              <PropertyCard
                key={listing.listingId?.toString() ?? "unknown"}
                listing={listing as unknown as PropertyCardListing}
                showDeleteButton={selectedRole === "buyer" && canEdit} // Only show delete button for buyers with edit permission
                contactId={contact.contactId}
                contactType={selectedRole}
                onRemove={(listingId) => handleRemoveProperty(listingId)}
                isRemoving={
                  isRemovingProperty &&
                  propertyToRemove?.listingId.toString() ===
                    listing.listingId?.toString()
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Building className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm">
              {selectedRole === "owner"
                ? "No hay propiedades asociadas a este contacto"
                : "No hay propiedades de interés asociadas a este contacto"}
            </p>
          </div>
        )}
      </Card>

      {/* Add Property Dialog */}
      <AddPropertyDialog
        open={showAddPropertyDialog}
        onOpenChange={setShowAddPropertyDialog}
        contactId={contact.contactId}
        onSuccess={reloadContactListings}
      />

      {/* Remove Property Dialog */}
      <RemovePropertyDialog
        open={showRemovePropertyDialog}
        onOpenChange={setShowRemovePropertyDialog}
        property={propertyToRemove}
        contactName={`${contact.firstName} ${contact.lastName}`}
        isRemoving={isRemovingProperty}
        onConfirm={handleConfirmRemoveProperty}
      />
    </div>
  );
}
