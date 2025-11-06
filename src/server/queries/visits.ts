import { eq, and } from "drizzle-orm";
import { getSecureDb } from "~/lib/dal";
import {
  appointments,
  contacts,
  listings,
  properties,
  users,
  documents,
} from "~/server/db/schema";
import { updateAppointment } from "~/server/queries/appointment";
import type {
  AppointmentWithDetails,
  VisitSignatureDocument,
} from "~/types/visits";

/**
 * Get appointment details with related data for visit form
 */
export async function getAppointmentWithDetails(
  appointmentId: bigint,
): Promise<AppointmentWithDetails | null> {
  const { db, accountId } = await getSecureDb();

  const [appointment] = await db
    .select({
      appointmentId: appointments.appointmentId,
      listingId: appointments.listingId,
      listingContactId: appointments.listingContactId, // For lead status progression
      contactId: appointments.contactId,
      userId: appointments.userId,
      datetimeStart: appointments.datetimeStart,
      datetimeEnd: appointments.datetimeEnd,
      type: appointments.type,
      notes: appointments.notes,
      status: appointments.status,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactNif: contacts.nif,
      contactPhone: contacts.phone,
      contactEmail: contacts.email,
      propertyStreet: properties.street,
      propertyAddressDetails: properties.addressDetails,
      agentName: users.name,
      agentFirstName: users.firstName,
      agentLastName: users.lastName,
      // Debug fields to see what we're getting
      listingPropertyId: listings.propertyId,
      propertyId: properties.propertyId,
    })
    .from(appointments)
    .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
    .leftJoin(listings, eq(appointments.listingId, listings.listingId))
    .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
    .leftJoin(users, eq(appointments.userId, users.id))
    .where(
      and(
        eq(appointments.appointmentId, appointmentId),
        eq(contacts.accountId, BigInt(accountId)),
        eq(appointments.isActive, true),
      ),
    );

  console.log("📋 Raw appointment query result:", {
    appointmentId: appointmentId.toString(),
    found: !!appointment,
    listingId: appointment?.listingId?.toString(),
    listingPropertyId: appointment?.listingPropertyId?.toString(),
    propertyId: appointment?.propertyId?.toString(),
    propertyStreet: appointment?.propertyStreet,
    contactFirstName: appointment?.contactFirstName,
    contactLastName: appointment?.contactLastName,
    fullAppointment: appointment,
  });

  return appointment ?? null;
}

/**
 * Update appointment status to mark visit as completed
 */
export async function markAppointmentAsCompleted(
  appointmentId: bigint,
  notes?: string,
): Promise<boolean> {
  try {
    // First verify the appointment belongs to this account
    const appointment = await getAppointmentWithDetails(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found or access denied");
    }

    // Use the existing updateAppointment function for consistency
    await updateAppointment(Number(appointmentId), {
      status: "Completed",
      notes: notes ?? appointment.notes ?? undefined,
    });

    return true;
  } catch (error) {
    console.error("Error marking appointment as completed:", error);
    return false;
  }
}

/**
 * Check if appointment already has visit signatures
 */
export async function hasVisitSignatures(
  appointmentId: bigint,
): Promise<boolean> {
  const { db } = await getSecureDb();

  const signatures = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.appointmentId, appointmentId),
        eq(documents.documentTag, "firma-visita"),
        eq(documents.isActive, true),
      ),
    );

  // Check if we have both agent and visitor signatures
  const hasAgentSignature = signatures.some((doc) =>
    doc.filename.includes("firma-agent"),
  );
  const hasVisitorSignature = signatures.some((doc) =>
    doc.filename.includes("firma-visitor"),
  );

  return hasAgentSignature && hasVisitorSignature;
}

/**
 * Get visit signatures for an appointment
 */
export async function getVisitSignatures(
  appointmentId: bigint,
): Promise<VisitSignatureDocument[]> {
  const { db } = await getSecureDb();

  const signatures = await db
    .select({
      docId: documents.docId,
      filename: documents.filename,
      fileUrl: documents.fileUrl,
      appointmentId: documents.appointmentId,
    })
    .from(documents)
    .where(
      and(
        eq(documents.appointmentId, appointmentId),
        eq(documents.documentTag, "firma-visita"),
        eq(documents.isActive, true),
      ),
    );

  return signatures.map((sig) => ({
    ...sig,
    signatureType: sig.filename.includes("firma-agent")
      ? ("agent" as const)
      : ("visitor" as const),
    appointmentId: sig.appointmentId!,
  }));
}

/**
 * Get appointments that have been marked as completed (have visit data)
 */
export async function getCompletedVisitAppointments(
  userId?: string,
): Promise<AppointmentWithDetails[]> {
  const { db, accountId } = await getSecureDb();

  let whereConditions = and(
    eq(appointments.status, "Completed"),
    eq(appointments.type, "Visita"),
    eq(contacts.accountId, BigInt(accountId)),
    eq(appointments.isActive, true),
  );

  if (userId) {
    whereConditions = and(whereConditions, eq(appointments.userId, userId));
  }

  const completedVisits = await db
    .select({
      appointmentId: appointments.appointmentId,
      listingId: appointments.listingId,
      listingContactId: appointments.listingContactId,
      contactId: appointments.contactId,
      userId: appointments.userId,
      datetimeStart: appointments.datetimeStart,
      datetimeEnd: appointments.datetimeEnd,
      type: appointments.type,
      notes: appointments.notes,
      status: appointments.status,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactNif: contacts.nif,
      propertyStreet: properties.street,
      propertyAddressDetails: properties.addressDetails,
      agentName: users.name,
      agentFirstName: users.firstName,
      agentLastName: users.lastName,
    })
    .from(appointments)
    .leftJoin(contacts, eq(appointments.contactId, contacts.contactId))
    .leftJoin(listings, eq(appointments.listingId, listings.listingId))
    .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
    .leftJoin(users, eq(appointments.userId, users.id))
    .where(whereConditions)
    .orderBy(appointments.datetimeStart);

  return completedVisits;
}
