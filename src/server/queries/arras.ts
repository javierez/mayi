"use server";

import { db } from "../db";
import {
  deals,
  listings,
  properties,
  listingContacts,
  contacts,
  documents,
  users,
  locations,
} from "../db/schema";
import { eq, and, aliasedTable, desc } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";
import type { ArrasContractPageData } from "../../types/arras";

/**
 * Get all data needed for the arras contract form
 * Fetches deal, buyer, seller, property, listing, and agent information
 */
export async function getArrasContractData(
  dealId: number,
): Promise<ArrasContractPageData | null> {
  const accountId = await getCurrentUserAccountId();

  try {
    // Create aliases for buyer and owner contacts
    const buyerListingContacts = aliasedTable(
      listingContacts,
      "buyerListingContacts",
    );
    const buyerContacts = aliasedTable(contacts, "buyerContacts");
    const ownerListingContacts = aliasedTable(
      listingContacts,
      "ownerListingContacts",
    );
    const ownerContacts = aliasedTable(contacts, "ownerContacts");

    // Main query with all joins
    const [result] = await db
      .select({
        // Deal data
        deal: {
          dealId: deals.dealId,
          listingId: deals.listingId,
          listingContactId: deals.listingContactId,
          status: deals.status,
          finalPrice: deals.finalPrice,
          arrasAmount: deals.arrasAmount,
          arrasType: deals.arrasType,
          arrasSigningDate: deals.arrasSigningDate,
          expectedDeedDate: deals.expectedDeedDate,
          specialConditions: deals.specialConditions,
        },
        // Buyer listing contact offer
        buyerOffer: {
          offer: buyerListingContacts.offer,
        },
        // Property data
        property: {
          propertyId: properties.propertyId,
          referenceNumber: properties.referenceNumber,
          street: properties.street,
          addressDetails: properties.addressDetails,
          postalCode: properties.postalCode,
          cadastralReference: properties.cadastralReference,
          squareMeters: properties.squareMeter,
          builtSurfaceArea: properties.builtSurfaceArea,
          propertyType: properties.propertyType,
        },
        // Location data for city and province
        locationData: {
          city: locations.city,
          province: locations.province,
        },
        // Listing data
        listing: {
          listingId: listings.listingId,
          price: listings.price,
          listingType: listings.listingType,
        },
        // Buyer data (from the listingContact linked to the deal)
        buyer: {
          contactId: buyerContacts.contactId,
          firstName: buyerContacts.firstName,
          lastName: buyerContacts.lastName,
          nif: buyerContacts.nif,
          email: buyerContacts.email,
          phone: buyerContacts.phone,
          address: buyerContacts.address,
        },
        // Owner/Seller data (from listing_contacts with contactType="owner")
        seller: {
          contactId: ownerContacts.contactId,
          firstName: ownerContacts.firstName,
          lastName: ownerContacts.lastName,
          nif: ownerContacts.nif,
          email: ownerContacts.email,
          phone: ownerContacts.phone,
          address: ownerContacts.address,
        },
        // Agent data
        agent: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      // Join buyer via deal.listingContactId
      .leftJoin(
        buyerListingContacts,
        eq(deals.listingContactId, buyerListingContacts.listingContactId),
      )
      .leftJoin(
        buyerContacts,
        eq(buyerListingContacts.contactId, buyerContacts.contactId),
      )
      // Join owner via listing_contacts with contactType="owner"
      .leftJoin(
        ownerListingContacts,
        and(
          eq(listings.listingId, ownerListingContacts.listingId),
          eq(ownerListingContacts.contactType, "owner"),
        ),
      )
      .leftJoin(
        ownerContacts,
        eq(ownerListingContacts.contactId, ownerContacts.contactId),
      )
      // Join agent
      .leftJoin(users, eq(listings.agentId, users.id))
      // Join locations for city and province
      .leftJoin(locations, eq(properties.neighborhoodId, locations.neighborhoodId))
      .where(
        and(
          eq(deals.dealId, BigInt(dealId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    if (!result) {
      return null;
    }

    // Check for existing arras contract document
    const existingContract = await checkExistingArrasContract(dealId);

    return {
      accountId: accountId.toString(),
      deal: {
        dealId: result.deal.dealId,
        listingId: result.deal.listingId,
        listingContactId: result.deal.listingContactId,
        status: result.deal.status,
        finalPrice: result.deal.finalPrice,
        arrasAmount: result.deal.arrasAmount,
        arrasType: result.deal.arrasType as "penitenciales" | "confirmatorias" | null,
        arrasSigningDate: result.deal.arrasSigningDate,
        expectedDeedDate: result.deal.expectedDeedDate,
        specialConditions: result.deal.specialConditions,
        offer: result.buyerOffer?.offer ?? null,
      },
      buyer: {
        contactId: result.buyer?.contactId ?? BigInt(0),
        firstName: result.buyer?.firstName ?? "",
        lastName: result.buyer?.lastName ?? null,
        nif: result.buyer?.nif ?? null,
        email: result.buyer?.email ?? null,
        phone: result.buyer?.phone ?? null,
        address: result.buyer?.address ?? null,
        city: null as string | null,
        postalCode: null as string | null,
      },
      seller: result.seller?.contactId
        ? {
            contactId: result.seller.contactId,
            firstName: result.seller.firstName ?? "",
            lastName: result.seller.lastName ?? null,
            nif: result.seller.nif ?? null,
            email: result.seller.email ?? null,
            phone: result.seller.phone ?? null,
            address: result.seller.address ?? null,
            city: null as string | null,
            postalCode: null as string | null,
          }
        : null,
      property: {
        propertyId: result.property.propertyId,
        referenceNumber: result.property.referenceNumber,
        street: result.property.street,
        addressDetails: result.property.addressDetails,
        postalCode: result.property.postalCode,
        city: result.locationData?.city ?? null,
        province: result.locationData?.province ?? null,
        cadastralReference: result.property.cadastralReference,
        squareMeters: result.property.squareMeters,
        builtSurfaceArea: result.property.builtSurfaceArea,
        propertyType: result.property.propertyType,
      },
      listing: {
        listingId: result.listing.listingId,
        price: result.listing.price,
        listingType: result.listing.listingType,
      },
      agent: {
        id: result.agent?.id ?? "",
        name: result.agent?.name ?? null,
        firstName: result.agent?.firstName ?? null,
        lastName: result.agent?.lastName ?? null,
      },
      existingContract,
    };
  } catch (error) {
    console.error("Error fetching arras contract data:", error);
    throw error;
  }
}

/**
 * Check if an arras contract already exists for a deal
 */
export async function checkExistingArrasContract(
  dealId: number,
): Promise<{ docId: bigint; filename: string; fileUrl: string; createdAt: Date } | null> {
  try {
    const [existing] = await db
      .select({
        docId: documents.docId,
        filename: documents.filename,
        fileUrl: documents.fileUrl,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.dealId, BigInt(dealId)),
          eq(documents.documentTag, "contrato-arras"),
          eq(documents.isActive, true),
        ),
      )
      .orderBy(desc(documents.createdAt))
      .limit(1);

    return existing ?? null;
  } catch (error) {
    console.error("Error checking existing arras contract:", error);
    return null;
  }
}

/**
 * Get deal by listingId and listingContactId for navigation from activity tab
 */
export async function getDealByListingAndListingContactId(
  listingId: number,
  listingContactId: number,
): Promise<{ dealId: bigint } | null> {
  const accountId = await getCurrentUserAccountId();

  try {
    const [deal] = await db
      .select({
        dealId: deals.dealId,
      })
      .from(deals)
      .innerJoin(listings, eq(deals.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(
        and(
          eq(deals.listingId, BigInt(listingId)),
          eq(deals.listingContactId, BigInt(listingContactId)),
          eq(properties.accountId, BigInt(accountId)),
        ),
      )
      .orderBy(desc(deals.createdAt))
      .limit(1);

    return deal ?? null;
  } catch (error) {
    console.error("Error fetching deal by listing and contact:", error);
    return null;
  }
}

/**
 * Get arras signature documents for a deal
 */
export async function getArrasSignatures(
  dealId: number,
): Promise<{
  sellerSignatureUrl: string | null;
  buyerSignatureUrl: string | null;
}> {
  try {
    const signatures = await db
      .select({
        fileUrl: documents.fileUrl,
        documentTag: documents.documentTag,
      })
      .from(documents)
      .where(
        and(
          eq(documents.dealId, BigInt(dealId)),
          eq(documents.isActive, true),
        ),
      );

    let sellerSignatureUrl: string | null = null;
    let buyerSignatureUrl: string | null = null;

    for (const sig of signatures) {
      if (sig.documentTag === "firma-arras-vendedor") {
        sellerSignatureUrl = sig.fileUrl;
      } else if (sig.documentTag === "firma-arras-comprador") {
        buyerSignatureUrl = sig.fileUrl;
      }
    }

    return { sellerSignatureUrl, buyerSignatureUrl };
  } catch (error) {
    console.error("Error fetching arras signatures:", error);
    return { sellerSignatureUrl: null, buyerSignatureUrl: null };
  }
}
