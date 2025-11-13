"use server";

import { db } from "../db";
import {
  listings,
  properties,
  locations,
  listingContacts,
  contacts,
} from "../db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

// Type for listing with all related data for operations page
export type ListingWithDetails = {
  listings: {
    id: bigint;
    listingType: string;
    price: string;
    status: string;
    prospectStatus: string | null;
    publishToWebsite?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  };
  properties: {
    id: bigint;
    propertyType: string | null;
    title: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    squareMeter: number | null;
  };
  locations: {
    neighborhood: string;
  };
  ownerContact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

// Get all listings with property details, location, and owner contact information
export async function getAllListingsWithAuth(): Promise<ListingWithDetails[]> {
  try {
    const accountId = await getCurrentUserAccountId();

    const listingsWithDetails = await db
      .select({
        // Listing fields
        listingId: listings.listingId,
        listingType: listings.listingType,
        price: listings.price,
        status: listings.status,
        prospectStatus: listings.prospectStatus,
        listingCreatedAt: listings.createdAt,
        listingUpdatedAt: listings.updatedAt,

        // Property fields
        propertyId: properties.propertyId,
        propertyType: properties.propertyType,
        propertyTitle: properties.title,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,

        // Location fields
        neighborhood: locations.neighborhood,

        // Owner contact fields
        ownerContactId: contacts.contactId,
        ownerFirstName: contacts.firstName,
        ownerLastName: contacts.lastName,
        ownerEmail: contacts.email,
        ownerPhone: contacts.phone,
      })
      .from(listings)
      .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .leftJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
          ne(listings.status, "Draft"),
        ),
      )
      .orderBy(listings.createdAt);

    // Transform the flat result into the expected nested structure
    // Filter out listings without property data
    return listingsWithDetails
      .filter((item) => item.propertyId !== null)
      .map((item) => ({
        listings: {
          id: item.listingId,
          listingType: item.listingType,
          price: item.price,
          status: item.status,
          prospectStatus: item.prospectStatus,
          createdAt: item.listingCreatedAt,
          updatedAt: item.listingUpdatedAt,
        },
        properties: {
          id: item.propertyId!,
          propertyType: item.propertyType,
          title: item.propertyTitle,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms ? Number(item.bathrooms) : null,
          squareMeter: item.squareMeter,
        },
        locations: {
          neighborhood: item.neighborhood ?? "Sin especificar",
        },
        ownerContact: item.ownerContactId
          ? {
              contactId: item.ownerContactId,
              firstName: item.ownerFirstName!,
              lastName: item.ownerLastName!,
              email: item.ownerEmail,
              phone: item.ownerPhone,
            }
          : null,
      }));
  } catch (error) {
    console.error("Error fetching listings with details:", error);
    throw error;
  }
}

// Update listing status (similar to prospects)
export async function updateListingWithAuth(
  listingId: bigint,
  data: { status?: string; prospectStatus?: string },
) {
  try {
    const accountId = await getCurrentUserAccountId();

    await db
      .update(listings)
      .set(data)
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
}
