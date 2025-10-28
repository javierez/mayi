"use server";

import { db } from "../db";
import {
  listings,
  properties,
  locations,
  listingContacts,
  contacts,
  accounts,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

export interface NotaEncargoRawData {
  // Listing data
  listingId: bigint;
  listingType: string;
  price: number;
  shortDescription: string | null;
  description: string | null;
  hasKeys: boolean;

  // Property data
  propertyId: bigint;
  energyConsumptionScale: string | null;
  energyConsumptionValue: number | null;

  // Property address data
  street: string | null;
  addressDetails: string | null;
  postalCode: string | null;

  // Location data
  city: string | null;

  // Contact (owner) data
  contactFirstName: string | null;
  contactLastName: string | null;
  contactNif: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAdditionalInfo: Record<string, unknown> | null;

  // Account data
  accountType: string;
  accountName: string;
  accountEmail: string | null;
  accountPhone: string | null;
  accountWebsite: string | null;
  accountAddress: string | null;
  accountTaxId: string | null;
  accountCollegiateNumber: string | null;
}

/**
 * Fetch all necessary data for generating a Nota de Encargo
 * @param listingId - The listing ID to fetch data for
 * @returns Complete data needed for PDF generation
 */
export async function getNotaEncargoData(
  listingId: bigint,
): Promise<NotaEncargoRawData | null> {
  try {
    const accountId = await getCurrentUserAccountId();

    console.log(
      "🔍 Fetching nota encargo data for listing:",
      listingId,
      "account:",
      accountId,
    );

    // Single optimized query joining all necessary tables
    const result = await db
      .select({
        // Listing data
        listingId: listings.listingId,
        listingType: listings.listingType,
        price: listings.price,
        shortDescription: listings.shortDescription,
        description: listings.description,
        hasKeys: listings.hasKeys,

        // Property data
        propertyId: properties.propertyId,
        energyConsumptionScale: properties.energyConsumptionScale,
        energyConsumptionValue: properties.energyConsumptionValue,

        // Property address data
        street: properties.street,
        addressDetails: properties.addressDetails,
        postalCode: properties.postalCode,

        // Location data
        city: locations.city,

        // Contact (owner) data
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactNif: contacts.nif,
        contactPhone: contacts.phone,
        contactEmail: contacts.email,
        contactAdditionalInfo: contacts.additionalInfo,

        // Account data
        accountType: accounts.accountType,
        accountName: accounts.name,
        accountEmail: accounts.email,
        accountPhone: accounts.phone,
        accountWebsite: accounts.website,
        accountAddress: accounts.address,
        accountTaxId: accounts.taxId,
        accountCollegiateNumber: accounts.collegiateNumber,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(
        listingContacts,
        and(
          eq(listingContacts.listingId, listings.listingId),
          eq(listingContacts.contactType, "owner"),
        ),
      )
      .leftJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .innerJoin(accounts, eq(listings.accountId, accounts.accountId))
      .where(
        and(
          eq(listings.listingId, listingId),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    if (result.length === 0) {
      console.warn("❌ No data found for listing:", listingId);
      return null;
    }

    const data = result[0];
    if (!data) {
      console.warn("❌ No data found for listing:", listingId);
      return null;
    }

    console.log("✅ Successfully fetched nota encargo data");

    return {
      listingId: data.listingId,
      listingType: data.listingType,
      price: Number(data.price),
      shortDescription: data.shortDescription,
      description: data.description,
      hasKeys: data.hasKeys ?? false,

      propertyId: data.propertyId,
      energyConsumptionScale: data.energyConsumptionScale,
      energyConsumptionValue: data.energyConsumptionValue
        ? Number(data.energyConsumptionValue)
        : null,

      street: data.street,
      addressDetails: data.addressDetails,
      postalCode: data.postalCode,

      city: data.city,

      contactFirstName: data.contactFirstName,
      contactLastName: data.contactLastName,
      contactNif: data.contactNif,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      contactAdditionalInfo:
        (data.contactAdditionalInfo as Record<string, unknown>) || {},

      accountType: data.accountType ?? "company",
      accountName: data.accountName,
      accountEmail: data.accountEmail,
      accountPhone: data.accountPhone,
      accountWebsite: data.accountWebsite,
      accountAddress: data.accountAddress,
      accountTaxId: data.accountTaxId,
      accountCollegiateNumber: data.accountCollegiateNumber,
    };
  } catch (error) {
    console.error("❌ Error fetching nota encargo data:", error);
    throw new Error("Failed to fetch nota encargo data");
  }
}
