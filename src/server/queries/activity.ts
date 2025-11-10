"use server";

import { db } from "../db";
import {
  appointments,
  contacts,
  listingContacts,
  users,
  documents,
  listings,
  properties,
  locations,
  propertyImages,
} from "../db/schema";
import { eq, and, or, sql, desc, inArray, isNull } from "drizzle-orm";
import { getCurrentUserAccountId } from "../../lib/dal";

/**
 * Get visits summary for a listing
 * Returns all appointments with type 'Visita' including contact, agent, and signature info
 */
export async function getListingVisitsSummary(listingId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get all visit appointments for this listing
    const allVisits = await db
      .select({
        appointmentId: appointments.appointmentId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        tripTimeMinutes: appointments.tripTimeMinutes,
        notes: appointments.notes,
        type: appointments.type,
        contactId: contacts.contactId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
        agentName: users.name,
        googleEventId: appointments.googleEventId,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.listingId, listingId),
          eq(appointments.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(eq(appointments.type, "Visita"), isNull(appointments.type)),
        ),
      )
      .orderBy(desc(appointments.datetimeStart));

    // Get appointment IDs for signature check
    const appointmentIds = allVisits.map((v) => v.appointmentId);

    // Check for signatures for each appointment
    let signatures: Array<{ appointmentId: bigint; count: number }> = [];
    if (appointmentIds.length > 0) {
      const signatureResults = await db
        .select({
          appointmentId: documents.appointmentId,
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(documents)
        .where(
          and(
            inArray(documents.appointmentId, appointmentIds),
            eq(documents.documentTag, "firma-visita"),
            eq(documents.isActive, true),
          ),
        )
        .groupBy(documents.appointmentId);

      signatures = signatureResults
        .filter(
          (s): s is { appointmentId: bigint; count: number } =>
            s.appointmentId !== null,
        )
        .map((s) => ({
          appointmentId: s.appointmentId,
          count: Number(s.count),
        }));
    }

    const signatureMap = new Map(
      signatures.map((s) => [s.appointmentId.toString(), s.count]),
    );

    return allVisits.map((visit) => ({
      ...visit,
      hasSignatures:
        (signatureMap.get(visit.appointmentId.toString()) ?? 0) >= 2,
    }));
  } catch (error) {
    console.error("Error fetching listing visits summary:", error);
    throw error;
  }
}

/**
 * Get contacts summary for a listing
 * Returns contacts interested in this listing with visit counts
 */
export async function getListingContactsSummary(listingId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all contacts for this listing (buyers and viewers)
    const allContacts = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        contactType: listingContacts.contactType,
        source: listingContacts.source,
        status: listingContacts.status,
        createdAt: listingContacts.createdAt,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.contactType, "viewer"),
          ),
        ),
      )
      .orderBy(desc(listingContacts.createdAt));

    // Get visit counts for each contact
    const contactIds = allContacts.map((c) => c.contactId);
    let visitCounts: Array<{
      contactId: bigint;
      totalVisits: number;
      upcomingVisits: number;
      missedVisits: number;
      completedVisits: number;
      cancelledVisits: number;
    }> = [];

    if (contactIds.length > 0) {
      const visitCountResults = await db
        .select({
          contactId: appointments.contactId,
          totalVisits: sql<number>`COUNT(*)`.as("totalVisits"),
          upcomingVisits:
            sql<number>`SUM(CASE WHEN ${appointments.datetimeStart} > NOW() AND ${appointments.status} = 'Scheduled' THEN 1 ELSE 0 END)`.as(
              "upcomingVisits",
            ),
          missedVisits:
            sql<number>`SUM(CASE WHEN (${appointments.datetimeStart} < NOW() AND ${appointments.status} = 'Scheduled') OR ${appointments.status} = 'NoShow' THEN 1 ELSE 0 END)`.as(
              "missedVisits",
            ),
          completedVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Completed' THEN 1 ELSE 0 END)`.as(
              "completedVisits",
            ),
          cancelledVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Cancelled' THEN 1 ELSE 0 END)`.as(
              "cancelledVisits",
            ),
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            eq(appointments.listingId, listingId),
            eq(appointments.isActive, true),
          ),
        )
        .groupBy(appointments.contactId);

      visitCounts = visitCountResults
        .filter(
          (
            v,
          ): v is {
            contactId: bigint;
            totalVisits: number;
            upcomingVisits: number;
            missedVisits: number;
            completedVisits: number;
            cancelledVisits: number;
          } => v.contactId !== null,
        )
        .map((v) => ({
          contactId: v.contactId,
          totalVisits: Number(v.totalVisits),
          upcomingVisits: Number(v.upcomingVisits),
          missedVisits: Number(v.missedVisits),
          completedVisits: Number(v.completedVisits),
          cancelledVisits: Number(v.cancelledVisits),
        }));
    }

    const visitMap = new Map(
      visitCounts.map((v) => [v.contactId.toString(), v]),
    );

    // Get the latest past visit status for each contact (excluding upcoming visits)
    let latestPastVisits: Array<{
      contactId: bigint;
      status: string | null;
      datetimeStart: Date;
    }> = [];

    if (contactIds.length > 0) {
      const latestPastVisitResults = await db
        .select({
          contactId: appointments.contactId,
          status: appointments.status,
          datetimeStart: appointments.datetimeStart,
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            eq(appointments.listingId, listingId),
            sql`${appointments.datetimeStart} <= NOW()`,
            eq(appointments.isActive, true),
          ),
        )
        .orderBy(desc(appointments.datetimeStart));

      // Group by contactId and take the first (most recent) past visit
      const latestByContact = new Map<string, { status: string | null; datetimeStart: Date }>();
      for (const visit of latestPastVisitResults) {
        if (visit.contactId) {
          const contactIdStr = visit.contactId.toString();
          if (!latestByContact.has(contactIdStr)) {
            latestByContact.set(contactIdStr, {
              status: visit.status,
              datetimeStart: visit.datetimeStart,
            });
          }
        }
      }

      latestPastVisits = Array.from(latestByContact.entries()).map(
        ([contactIdStr, visitData]) => ({
          contactId: BigInt(contactIdStr),
          status: visitData.status,
          datetimeStart: visitData.datetimeStart,
        }),
      );
    }

    const latestPastVisitMap = new Map(
      latestPastVisits.map((v) => [v.contactId.toString(), v.status]),
    );

    // Get the earliest upcoming appointment for each contact
    let upcomingAppointments: Array<{
      contactId: bigint;
      appointmentId: bigint;
    }> = [];

    if (contactIds.length > 0) {
      const upcomingAppointmentResults = await db
        .select({
          contactId: appointments.contactId,
          appointmentId: appointments.appointmentId,
          datetimeStart: appointments.datetimeStart,
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            eq(appointments.listingId, listingId),
            sql`${appointments.datetimeStart} > NOW()`,
            eq(appointments.status, "Scheduled"),
            eq(appointments.isActive, true),
          ),
        )
        .orderBy(appointments.datetimeStart);

      // Group by contactId and take the first (earliest) appointment
      const appointmentsByContact = new Map<string, bigint>();
      for (const apt of upcomingAppointmentResults) {
        if (apt.contactId) {
          const contactIdStr = apt.contactId.toString();
          if (!appointmentsByContact.has(contactIdStr)) {
            appointmentsByContact.set(contactIdStr, apt.appointmentId);
          }
        }
      }

      upcomingAppointments = Array.from(appointmentsByContact.entries()).map(
        ([contactIdStr, appointmentId]) => ({
          contactId: BigInt(contactIdStr),
          appointmentId,
        }),
      );
    }

    const upcomingAppointmentMap = new Map(
      upcomingAppointments.map((a) => [a.contactId.toString(), a.appointmentId]),
    );

    console.log(
      `🔍 [getListingContactsSummary] Found ${upcomingAppointments.length} upcoming appointments for listingId: ${listingId}`,
    );
    upcomingAppointments.forEach((apt) => {
      console.log(
        `  - ContactId: ${apt.contactId.toString()}, AppointmentId: ${apt.appointmentId.toString()}`,
      );
    });

    const contactsWithVisitStatus = allContacts.map((contact) => {
      const visitStats = visitMap.get(contact.contactId.toString());
      const hasUpcomingVisit = (visitStats?.upcomingVisits ?? 0) > 0;
      const hasOffer = contact.offer !== null && contact.offer !== undefined;
      const upcomingAppointmentId = upcomingAppointmentMap.get(
        contact.contactId.toString(),
      );

      // Get the latest past visit status (if any)
      const latestPastVisitStatus = latestPastVisitMap.get(
        contact.contactId.toString(),
      );

      // Determine visit status flags based on the LATEST past visit (not counts)
      let hasMissedVisit = false;
      let hasCompletedVisit = false;
      let hasCancelledVisit = false;

      if (latestPastVisitStatus) {
        if (latestPastVisitStatus === "Completed") {
          hasCompletedVisit = true;
        } else if (latestPastVisitStatus === "Cancelled") {
          hasCancelledVisit = true;
        } else if (
          latestPastVisitStatus === "NoShow" ||
          latestPastVisitStatus === "Scheduled"
        ) {
          // Past scheduled visits that weren't completed or cancelled are missed
          hasMissedVisit = true;
        }
      }

      if (hasUpcomingVisit) {
        console.log(
          `📅 [Contact: ${contact.firstName} ${contact.lastName ?? ""}] hasUpcomingVisit: true, upcomingAppointmentId: ${upcomingAppointmentId?.toString() ?? "undefined"}`,
        );
      }

      // Priority for sorting: 1=upcoming, 2=offer made, 3=completed, 4=cancelled, 5=missed, 6=crear visita
      let sortPriority = 6;
      if (hasUpcomingVisit) {
        sortPriority = 1; // Upcoming visit (highest priority)
      } else if (hasOffer) {
        sortPriority = 2; // Offer made (regardless of visit status)
      } else if (hasCompletedVisit) {
        sortPriority = 3; // Completed visit (most recent positive outcome)
      } else if (hasCancelledVisit) {
        sortPriority = 4; // Cancelled visit
      } else if (hasMissedVisit) {
        sortPriority = 5; // Missed visit
      }

      return {
        ...contact,
        visitCount: visitStats?.totalVisits ?? 0,
        hasUpcomingVisit,
        upcomingAppointmentId,
        hasMissedVisit,
        hasCompletedVisit,
        hasCancelledVisit,
        hasOffer,
        isNew: contact.createdAt >= thirtyDaysAgo,
        sortPriority,
      };
    });

    // Sort by priority, then by creation date
    return contactsWithVisitStatus.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("Error fetching listing contacts summary:", error);
    throw error;
  }
}

/**
 * Get owner contact information for a listing
 * Returns the owner's contact details (email, phone) for the property
 */
export async function getListingOwnerContact(listingId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    const ownerContact = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    return ownerContact[0] ?? null;
  } catch (error) {
    console.error("Error fetching listing owner contact:", error);
    throw error;
  }
}

/**
 * Get visits summary for a contact as buyer/viewer
 * Returns all appointments where this contact is viewing properties
 * Grouped by property for display
 */
export async function getContactVisitsSummaryAsBuyer(contactId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get all visit appointments for properties where this contact is buyer/viewer
    const allVisits = await db
      .select({
        appointmentId: appointments.appointmentId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        tripTimeMinutes: appointments.tripTimeMinutes,
        notes: appointments.notes,
        type: appointments.type,
        contactId: contacts.contactId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
        agentName: users.name,
        googleEventId: appointments.googleEventId,
        listingId: appointments.listingId,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.contactId, contactId),
          eq(appointments.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(eq(appointments.type, "Visita"), isNull(appointments.type)),
        ),
      )
      .orderBy(desc(appointments.datetimeStart));

    // Get appointment IDs for signature check
    const appointmentIds = allVisits.map((v) => v.appointmentId);

    // Check for signatures for each appointment
    let signatures: Array<{ appointmentId: bigint; count: number }> = [];
    if (appointmentIds.length > 0) {
      const signatureResults = await db
        .select({
          appointmentId: documents.appointmentId,
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(documents)
        .where(
          and(
            inArray(documents.appointmentId, appointmentIds),
            eq(documents.documentTag, "firma-visita"),
            eq(documents.isActive, true),
          ),
        )
        .groupBy(documents.appointmentId);

      signatures = signatureResults
        .filter(
          (s): s is { appointmentId: bigint; count: number } =>
            s.appointmentId !== null,
        )
        .map((s) => ({
          appointmentId: s.appointmentId,
          count: Number(s.count),
        }));
    }

    const signatureMap = new Map(
      signatures.map((s) => [s.appointmentId.toString(), s.count]),
    );

    const visitsWithSignatures = allVisits.map((visit) => ({
      ...visit,
      hasSignatures:
        (signatureMap.get(visit.appointmentId.toString()) ?? 0) >= 2,
    }));

    return visitsWithSignatures;
  } catch (error) {
    console.error(
      "❌ [Activity] Error fetching contact visits summary as buyer:",
      error,
    );
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get contacts interested in the same properties as this contact
 * Returns other buyers/viewers for properties this contact is interested in
 */
export async function getContactRelatedContactsForBuyerListings(
  contactId: bigint,
) {
  try {
    const accountId = await getCurrentUserAccountId();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First, get all properties this contact is interested in (as buyer/viewer)
    const interestedListings = await db
      .select({
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          or(
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.contactType, "viewer"),
          ),
          eq(listingContacts.isActive, true),
        ),
      );

    const listingIds = interestedListings
      .map((l) => l.listingId)
      .filter((id): id is bigint => id !== null);

    // If no interested listings, return empty array
    if (listingIds.length === 0) {
      return [];
    }

    // Get all OTHER contacts interested in these same properties
    const allContacts = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        contactType: listingContacts.contactType,
        source: listingContacts.source,
        status: listingContacts.status,
        createdAt: listingContacts.createdAt,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          inArray(listingContacts.listingId, listingIds),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.contactType, "viewer"),
          ),
          // Exclude the current contact
          sql`${contacts.contactId} != ${contactId}`,
        ),
      )
      .orderBy(desc(listingContacts.createdAt));

    // Get visit counts for each contact across all listings
    const contactIds = allContacts.map((c) => c.contactId);
    let visitCounts: Array<{
      contactId: bigint;
      totalVisits: number;
      upcomingVisits: number;
      missedVisits: number;
      completedVisits: number;
      cancelledVisits: number;
    }> = [];

    if (contactIds.length > 0) {
      const visitCountResults = await db
        .select({
          contactId: appointments.contactId,
          totalVisits: sql<number>`COUNT(*)`.as("totalVisits"),
          upcomingVisits:
            sql<number>`SUM(CASE WHEN ${appointments.datetimeStart} > NOW() AND ${appointments.status} = 'Scheduled' THEN 1 ELSE 0 END)`.as(
              "upcomingVisits",
            ),
          missedVisits:
            sql<number>`SUM(CASE WHEN (${appointments.datetimeStart} < NOW() AND ${appointments.status} = 'Scheduled') OR ${appointments.status} = 'NoShow' THEN 1 ELSE 0 END)`.as(
              "missedVisits",
            ),
          completedVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Completed' THEN 1 ELSE 0 END)`.as(
              "completedVisits",
            ),
          cancelledVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Cancelled' THEN 1 ELSE 0 END)`.as(
              "cancelledVisits",
            ),
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            inArray(appointments.listingId, listingIds),
            eq(appointments.isActive, true),
          ),
        )
        .groupBy(appointments.contactId);

      visitCounts = visitCountResults
        .filter(
          (
            v,
          ): v is {
            contactId: bigint;
            totalVisits: number;
            upcomingVisits: number;
            missedVisits: number;
            completedVisits: number;
            cancelledVisits: number;
          } => v.contactId !== null,
        )
        .map((v) => ({
          contactId: v.contactId,
          totalVisits: Number(v.totalVisits),
          upcomingVisits: Number(v.upcomingVisits),
          missedVisits: Number(v.missedVisits),
          completedVisits: Number(v.completedVisits),
          cancelledVisits: Number(v.cancelledVisits),
        }));
    }

    const visitMap = new Map(
      visitCounts.map((v) => [v.contactId.toString(), v]),
    );

    // Get the latest past visit status for each contact (excluding upcoming visits)
    let latestPastVisits: Array<{
      contactId: bigint;
      status: string | null;
    }> = [];

    if (contactIds.length > 0) {
      const latestPastVisitResults = await db
        .select({
          contactId: appointments.contactId,
          status: appointments.status,
          datetimeStart: appointments.datetimeStart,
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            inArray(appointments.listingId, listingIds),
            sql`${appointments.datetimeStart} <= NOW()`,
            eq(appointments.isActive, true),
          ),
        )
        .orderBy(desc(appointments.datetimeStart));

      // Group by contactId and take the first (most recent) past visit
      const latestByContact = new Map<string, string | null>();
      for (const visit of latestPastVisitResults) {
        if (visit.contactId) {
          const contactIdStr = visit.contactId.toString();
          if (!latestByContact.has(contactIdStr)) {
            latestByContact.set(contactIdStr, visit.status);
          }
        }
      }

      latestPastVisits = Array.from(latestByContact.entries()).map(
        ([contactIdStr, status]) => ({
          contactId: BigInt(contactIdStr),
          status,
        }),
      );
    }

    const latestPastVisitMap = new Map(
      latestPastVisits.map((v) => [v.contactId.toString(), v.status]),
    );

    const contactsWithVisitStatus = allContacts.map((contact) => {
      const visitStats = visitMap.get(contact.contactId.toString());
      const hasUpcomingVisit = (visitStats?.upcomingVisits ?? 0) > 0;
      const hasOffer = contact.offer !== null && contact.offer !== undefined;

      // Get the latest past visit status (if any)
      const latestPastVisitStatus = latestPastVisitMap.get(
        contact.contactId.toString(),
      );

      // Determine visit status flags based on the LATEST past visit (not counts)
      let hasMissedVisit = false;
      let hasCompletedVisit = false;
      let hasCancelledVisit = false;

      if (latestPastVisitStatus) {
        if (latestPastVisitStatus === "Completed") {
          hasCompletedVisit = true;
        } else if (latestPastVisitStatus === "Cancelled") {
          hasCancelledVisit = true;
        } else if (
          latestPastVisitStatus === "NoShow" ||
          latestPastVisitStatus === "Scheduled"
        ) {
          hasMissedVisit = true;
        }
      }

      // Priority for sorting: 1=upcoming, 2=offer made, 3=completed, 4=cancelled, 5=missed, 6=crear visita
      let sortPriority = 6;
      if (hasUpcomingVisit) {
        sortPriority = 1;
      } else if (hasOffer) {
        sortPriority = 2;
      } else if (hasCompletedVisit) {
        sortPriority = 3;
      } else if (hasCancelledVisit) {
        sortPriority = 4;
      } else if (hasMissedVisit) {
        sortPriority = 5;
      }

      return {
        ...contact,
        visitCount: visitStats?.totalVisits ?? 0,
        hasUpcomingVisit,
        hasMissedVisit,
        hasCompletedVisit,
        hasCancelledVisit,
        hasOffer,
        isNew: contact.createdAt >= thirtyDaysAgo,
        sortPriority,
      };
    });

    // Sort by priority, then by creation date
    const sortedContacts = contactsWithVisitStatus.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return sortedContacts;
  } catch (error) {
    console.error(
      "❌ [Activity] Error fetching related contacts for buyer listings:",
      error,
    );
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get complete activity data grouped by listing for a contact
 * Returns listings with their visits and related contacts
 */
export async function getContactActivityByListing(contactId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get all listings this contact is interested in (as buyer/viewer)
    // Fetch complete listing data for PropertyCard display
    const listingsDataRaw = await db
      .select({
        // Listing fields
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        price: listings.price,
        status: listings.status,
        listingType: listings.listingType,
        isActive: listings.isActive,
        isFeatured: listings.isFeatured,
        isBankOwned: listings.isBankOwned,
        viewCount: listings.viewCount,
        inquiryCount: listings.inquiryCount,

        // Property fields
        referenceNumber: properties.referenceNumber,
        title: properties.title,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        street: properties.street,
        addressDetails: properties.addressDetails,
        postalCode: properties.postalCode,
        latitude: properties.latitude,
        longitude: properties.longitude,

        // Location fields
        city: locations.city,
        province: locations.province,
        municipality: locations.municipality,
        neighborhood: locations.neighborhood,

        // Agent info
        agentName: users.name,
      })
      .from(listingContacts)
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          or(
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.contactType, "viewer"),
          ),
          eq(listingContacts.isActive, true),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // Get property IDs for image fetching
    const propertyIds = listingsDataRaw.map((l) => l.propertyId);

    // Fetch first 2 images for each property (excluding videos, YouTube links, and tours)
    const imagesData =
      propertyIds.length > 0
        ? await db
            .select({
              propertyId: propertyImages.propertyId,
              imageUrl: propertyImages.imageUrl,
              s3key: propertyImages.s3key,
              imageOrder: propertyImages.imageOrder,
            })
            .from(propertyImages)
            .where(
              and(
                inArray(propertyImages.propertyId, propertyIds),
                eq(propertyImages.isActive, true),
                // Only get actual images, not videos, YouTube links, or virtual tours
                sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
              ),
            )
            .orderBy(propertyImages.imageOrder)
        : [];

    // Group images by property
    const imagesByProperty = new Map<
      string,
      Array<{ imageUrl: string; s3key: string }>
    >();
    for (const img of imagesData) {
      const propertyIdStr = img.propertyId.toString();
      if (!imagesByProperty.has(propertyIdStr)) {
        imagesByProperty.set(propertyIdStr, []);
      }
      const imgs = imagesByProperty.get(propertyIdStr)!;
      if (imgs.length < 2) {
        imgs.push({ imageUrl: img.imageUrl, s3key: img.s3key });
      }
    }

    // Convert price to string and add images to each listing
    const formattedListings = listingsDataRaw.map((listing) => {
      // Convert decimal price to string - handle both string and Decimal object
      let priceStr = "0";
      if (listing.price != null) {
        priceStr = String(listing.price);
      }

      // Convert bathrooms decimal to string
      let bathroomsStr: string | null = null;
      if (listing.bathrooms != null) {
        bathroomsStr = String(listing.bathrooms);
      }

      // Convert latitude/longitude decimals to strings
      const latStr = listing.latitude != null ? String(listing.latitude) : null;
      const lngStr =
        listing.longitude != null ? String(listing.longitude) : null;

      // Get images for this property
      const propertyImgs =
        imagesByProperty.get(listing.propertyId.toString()) ?? [];

      return {
        // Listing fields
        listingId: listing.listingId,
        propertyId: listing.propertyId,
        price: priceStr,
        status: listing.status ?? "",
        listingType: listing.listingType ?? "",
        isActive: listing.isActive,
        isFeatured: listing.isFeatured,
        isBankOwned: listing.isBankOwned,
        viewCount: listing.viewCount,
        inquiryCount: listing.inquiryCount,
        agentName: listing.agentName,

        // Property fields
        referenceNumber: listing.referenceNumber,
        title: listing.title,
        propertyType: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: bathroomsStr,
        squareMeter: listing.squareMeter,
        street: listing.street,
        addressDetails: listing.addressDetails,
        postalCode: listing.postalCode,
        latitude: latStr,
        longitude: lngStr,

        // Location fields
        city: listing.city,
        province: listing.province,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,

        // Image fields
        imageUrl: propertyImgs[0]?.imageUrl ?? null,
        s3key: propertyImgs[0]?.s3key ?? null,
        imageUrl2: propertyImgs[1]?.imageUrl ?? null,
        s3key2: propertyImgs[1]?.s3key ?? null,
      };
    });

    return formattedListings;
  } catch (error) {
    console.error(
      "❌ [Activity] Error fetching contact activity by listing:",
      error,
    );
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get complete activity data grouped by listing for a contact as owner
 * Returns listings owned by the contact with their visits and related contacts
 */
export async function getContactActivityByListingAsOwner(contactId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Get all listings this contact owns
    // Fetch complete listing data for PropertyCard display
    const listingsDataRaw = await db
      .select({
        // Listing fields
        listingId: listings.listingId,
        propertyId: listings.propertyId,
        price: listings.price,
        status: listings.status,
        listingType: listings.listingType,
        isActive: listings.isActive,
        isFeatured: listings.isFeatured,
        isBankOwned: listings.isBankOwned,
        viewCount: listings.viewCount,
        inquiryCount: listings.inquiryCount,

        // Property fields
        referenceNumber: properties.referenceNumber,
        title: properties.title,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        street: properties.street,
        addressDetails: properties.addressDetails,
        postalCode: properties.postalCode,
        latitude: properties.latitude,
        longitude: properties.longitude,

        // Location fields
        city: locations.city,
        province: locations.province,
        municipality: locations.municipality,
        neighborhood: locations.neighborhood,

        // Agent info
        agentName: users.name,
      })
      .from(listingContacts)
      .innerJoin(listings, eq(listingContacts.listingId, listings.listingId))
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(users, eq(listings.agentId, users.id))
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    // Get property IDs for image fetching
    const propertyIds = listingsDataRaw.map((l) => l.propertyId);

    // Fetch first 2 images for each property (excluding videos, YouTube links, and tours)
    const imagesData =
      propertyIds.length > 0
        ? await db
            .select({
              propertyId: propertyImages.propertyId,
              imageUrl: propertyImages.imageUrl,
              s3key: propertyImages.s3key,
              imageOrder: propertyImages.imageOrder,
            })
            .from(propertyImages)
            .where(
              and(
                inArray(propertyImages.propertyId, propertyIds),
                eq(propertyImages.isActive, true),
                // Only get actual images, not videos, YouTube links, or virtual tours
                sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
              ),
            )
            .orderBy(propertyImages.imageOrder)
        : [];

    // Group images by property
    const imagesByProperty = new Map<
      string,
      Array<{ imageUrl: string; s3key: string }>
    >();
    for (const img of imagesData) {
      const propertyIdStr = img.propertyId.toString();
      if (!imagesByProperty.has(propertyIdStr)) {
        imagesByProperty.set(propertyIdStr, []);
      }
      const imgs = imagesByProperty.get(propertyIdStr)!;
      if (imgs.length < 2) {
        imgs.push({ imageUrl: img.imageUrl, s3key: img.s3key });
      }
    }

    // Convert price to string and add images to each listing
    const formattedListings = listingsDataRaw.map((listing) => {
      // Convert decimal price to string - handle both string and Decimal object
      let priceStr = "0";
      if (listing.price != null) {
        priceStr = String(listing.price);
      }

      // Convert bathrooms decimal to string
      let bathroomsStr: string | null = null;
      if (listing.bathrooms != null) {
        bathroomsStr = String(listing.bathrooms);
      }

      // Convert latitude/longitude decimals to strings
      const latStr = listing.latitude != null ? String(listing.latitude) : null;
      const lngStr =
        listing.longitude != null ? String(listing.longitude) : null;

      // Get images for this property
      const propertyImgs =
        imagesByProperty.get(listing.propertyId.toString()) ?? [];

      return {
        // Listing fields
        listingId: listing.listingId,
        propertyId: listing.propertyId,
        price: priceStr,
        status: listing.status ?? "",
        listingType: listing.listingType ?? "",
        isActive: listing.isActive,
        isFeatured: listing.isFeatured,
        isBankOwned: listing.isBankOwned,
        viewCount: listing.viewCount,
        inquiryCount: listing.inquiryCount,
        agentName: listing.agentName,

        // Property fields
        referenceNumber: listing.referenceNumber,
        title: listing.title,
        propertyType: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: bathroomsStr,
        squareMeter: listing.squareMeter,
        street: listing.street,
        addressDetails: listing.addressDetails,
        postalCode: listing.postalCode,
        latitude: latStr,
        longitude: lngStr,

        // Location fields
        city: listing.city,
        province: listing.province,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,

        // Image fields
        imageUrl: propertyImgs[0]?.imageUrl ?? null,
        s3key: propertyImgs[0]?.s3key ?? null,
        imageUrl2: propertyImgs[1]?.imageUrl ?? null,
        s3key2: propertyImgs[1]?.s3key ?? null,
      };
    });

    return formattedListings;
  } catch (error) {
    console.error(
      "❌ [Activity] Error fetching contact activity by listing as owner:",
      error,
    );
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get visits summary for properties owned by a contact
 * Returns all appointments for properties this contact owns
 */
export async function getContactVisitsSummaryAsOwner(contactId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();

    // First, get all listing IDs owned by this contact
    const ownedListings = await db
      .select({
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      );

    const ownedListingIds = ownedListings
      .map((l) => l.listingId)
      .filter((id): id is bigint => id !== null);

    // If no owned listings, return empty array
    if (ownedListingIds.length === 0) {
      return [];
    }

    // Get all visit appointments for owned properties
    const allVisits = await db
      .select({
        appointmentId: appointments.appointmentId,
        datetimeStart: appointments.datetimeStart,
        datetimeEnd: appointments.datetimeEnd,
        status: appointments.status,
        tripTimeMinutes: appointments.tripTimeMinutes,
        notes: appointments.notes,
        type: appointments.type,
        contactId: contacts.contactId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
        agentName: users.name,
        googleEventId: appointments.googleEventId,
        listingId: appointments.listingId,
      })
      .from(appointments)
      .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          inArray(appointments.listingId, ownedListingIds),
          eq(appointments.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(eq(appointments.type, "Visita"), isNull(appointments.type)),
        ),
      )
      .orderBy(desc(appointments.datetimeStart));

    // Get appointment IDs for signature check
    const appointmentIds = allVisits.map((v) => v.appointmentId);

    // Check for signatures for each appointment
    let signatures: Array<{ appointmentId: bigint; count: number }> = [];
    if (appointmentIds.length > 0) {
      const signatureResults = await db
        .select({
          appointmentId: documents.appointmentId,
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(documents)
        .where(
          and(
            inArray(documents.appointmentId, appointmentIds),
            eq(documents.documentTag, "firma-visita"),
            eq(documents.isActive, true),
          ),
        )
        .groupBy(documents.appointmentId);

      signatures = signatureResults
        .filter(
          (s): s is { appointmentId: bigint; count: number } =>
            s.appointmentId !== null,
        )
        .map((s) => ({
          appointmentId: s.appointmentId,
          count: Number(s.count),
        }));
    }

    const signatureMap = new Map(
      signatures.map((s) => [s.appointmentId.toString(), s.count]),
    );

    const visitsWithSignatures = allVisits.map((visit) => ({
      ...visit,
      hasSignatures:
        (signatureMap.get(visit.appointmentId.toString()) ?? 0) >= 2,
    }));

    return visitsWithSignatures;
  } catch (error) {
    console.error(
      "❌ [Activity] Error fetching contact visits summary as owner:",
      error,
    );
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get related contacts for properties owned by this contact
 * Returns contacts (buyers/viewers) interested in properties owned by this contact
 */
export async function getContactRelatedContactsAsOwner(contactId: bigint) {
  try {
    const accountId = await getCurrentUserAccountId();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // First, get all properties owned by this contact
    const ownedProperties = await db
      .select({
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.contactId, contactId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      );

    const ownedListingIds = ownedProperties
      .map((p) => p.listingId)
      .filter((id): id is bigint => id !== null);

    // If no owned properties, return empty array
    if (ownedListingIds.length === 0) {
      return [];
    }

    // Get all contacts interested in these properties (buyers and viewers)
    const allContacts = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        contactType: listingContacts.contactType,
        source: listingContacts.source,
        status: listingContacts.status,
        createdAt: listingContacts.createdAt,
        offer: listingContacts.offer,
        offerAccepted: listingContacts.offerAccepted,
        listingId: listingContacts.listingId,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          inArray(listingContacts.listingId, ownedListingIds),
          eq(listingContacts.isActive, true),
          eq(contacts.accountId, BigInt(accountId)),
          or(
            eq(listingContacts.contactType, "buyer"),
            eq(listingContacts.contactType, "viewer"),
          ),
        ),
      )
      .orderBy(desc(listingContacts.createdAt));

    // Get visit counts for each contact across all listings
    const contactIds = allContacts.map((c) => c.contactId);
    let visitCounts: Array<{
      contactId: bigint;
      totalVisits: number;
      upcomingVisits: number;
      missedVisits: number;
      completedVisits: number;
      cancelledVisits: number;
    }> = [];

    if (contactIds.length > 0) {
      const visitCountResults = await db
        .select({
          contactId: appointments.contactId,
          totalVisits: sql<number>`COUNT(*)`.as("totalVisits"),
          upcomingVisits:
            sql<number>`SUM(CASE WHEN ${appointments.datetimeStart} > NOW() AND ${appointments.status} = 'Scheduled' THEN 1 ELSE 0 END)`.as(
              "upcomingVisits",
            ),
          missedVisits:
            sql<number>`SUM(CASE WHEN (${appointments.datetimeStart} < NOW() AND ${appointments.status} = 'Scheduled') OR ${appointments.status} = 'NoShow' THEN 1 ELSE 0 END)`.as(
              "missedVisits",
            ),
          completedVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Completed' THEN 1 ELSE 0 END)`.as(
              "completedVisits",
            ),
          cancelledVisits:
            sql<number>`SUM(CASE WHEN ${appointments.status} = 'Cancelled' THEN 1 ELSE 0 END)`.as(
              "cancelledVisits",
            ),
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            inArray(appointments.listingId, ownedListingIds),
            eq(appointments.isActive, true),
          ),
        )
        .groupBy(appointments.contactId);

      visitCounts = visitCountResults
        .filter(
          (
            v,
          ): v is {
            contactId: bigint;
            totalVisits: number;
            upcomingVisits: number;
            missedVisits: number;
            completedVisits: number;
            cancelledVisits: number;
          } => v.contactId !== null,
        )
        .map((v) => ({
          contactId: v.contactId,
          totalVisits: Number(v.totalVisits),
          upcomingVisits: Number(v.upcomingVisits),
          missedVisits: Number(v.missedVisits),
          completedVisits: Number(v.completedVisits),
          cancelledVisits: Number(v.cancelledVisits),
        }));
    }

    const visitMap = new Map(
      visitCounts.map((v) => [v.contactId.toString(), v]),
    );

    // Get the latest past visit status for each contact (excluding upcoming visits)
    let latestPastVisits: Array<{
      contactId: bigint;
      status: string | null;
    }> = [];

    if (contactIds.length > 0) {
      const latestPastVisitResults = await db
        .select({
          contactId: appointments.contactId,
          status: appointments.status,
          datetimeStart: appointments.datetimeStart,
        })
        .from(appointments)
        .where(
          and(
            inArray(appointments.contactId, contactIds),
            inArray(appointments.listingId, ownedListingIds),
            sql`${appointments.datetimeStart} <= NOW()`,
            eq(appointments.isActive, true),
          ),
        )
        .orderBy(desc(appointments.datetimeStart));

      // Group by contactId and take the first (most recent) past visit
      const latestByContact = new Map<string, string | null>();
      for (const visit of latestPastVisitResults) {
        if (visit.contactId) {
          const contactIdStr = visit.contactId.toString();
          if (!latestByContact.has(contactIdStr)) {
            latestByContact.set(contactIdStr, visit.status);
          }
        }
      }

      latestPastVisits = Array.from(latestByContact.entries()).map(
        ([contactIdStr, status]) => ({
          contactId: BigInt(contactIdStr),
          status,
        }),
      );
    }

    const latestPastVisitMap = new Map(
      latestPastVisits.map((v) => [v.contactId.toString(), v.status]),
    );

    const contactsWithVisitStatus = allContacts.map((contact) => {
      const visitStats = visitMap.get(contact.contactId.toString());
      const hasUpcomingVisit = (visitStats?.upcomingVisits ?? 0) > 0;
      const hasOffer = contact.offer !== null && contact.offer !== undefined;

      // Get the latest past visit status (if any)
      const latestPastVisitStatus = latestPastVisitMap.get(
        contact.contactId.toString(),
      );

      // Determine visit status flags based on the LATEST past visit (not counts)
      let hasMissedVisit = false;
      let hasCompletedVisit = false;
      let hasCancelledVisit = false;

      if (latestPastVisitStatus) {
        if (latestPastVisitStatus === "Completed") {
          hasCompletedVisit = true;
        } else if (latestPastVisitStatus === "Cancelled") {
          hasCancelledVisit = true;
        } else if (
          latestPastVisitStatus === "NoShow" ||
          latestPastVisitStatus === "Scheduled"
        ) {
          hasMissedVisit = true;
        }
      }

      // Priority for sorting: 1=upcoming, 2=offer made, 3=completed, 4=cancelled, 5=missed, 6=crear visita
      let sortPriority = 6;
      if (hasUpcomingVisit) {
        sortPriority = 1; // Upcoming visit (highest priority)
      } else if (hasOffer) {
        sortPriority = 2; // Offer made (regardless of visit status)
      } else if (hasCompletedVisit) {
        sortPriority = 3; // Completed visit
      } else if (hasCancelledVisit) {
        sortPriority = 4; // Cancelled visit
      } else if (hasMissedVisit) {
        sortPriority = 5; // Missed visit
      }

      return {
        ...contact,
        visitCount: visitStats?.totalVisits ?? 0,
        hasUpcomingVisit,
        hasMissedVisit,
        hasCompletedVisit,
        hasCancelledVisit,
        hasOffer,
        isNew: contact.createdAt >= thirtyDaysAgo,
        sortPriority,
      };
    });

    // Sort by priority, then by creation date
    return contactsWithVisitStatus.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("Error fetching related contacts as owner:", error);
    throw error;
  }
}
