"use server";

import { db } from "../db";
import { contacts, listings } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Activity action type for task title generation
 * Accepts any string to match the database schema's varchar field
 */
export type ActivityActionType = string;

/**
 * Generate task title from activity using simple templates
 *
 * @param action - The activity action type
 * @param contactName - Full name of the contact
 * @param listingTitle - Title of the listing (optional)
 * @returns Formatted task title
 */
export async function generateTaskTitleFromActivity(
  action: ActivityActionType,
  contactName: string,
  listingTitle?: string | null,
): Promise<string> {
  // If we have a listing, include it in the title
  if (listingTitle) {
    switch (action) {
      case "call_logged":
        return `Llamar a ${contactName} por ${listingTitle}`;
      case "email_sent":
        return `Enviar email a ${contactName} por ${listingTitle}`;
      case "whatsapp_sent":
        return `Enviar WhatsApp a ${contactName} por ${listingTitle}`;
      case "viewing_completed":
        return `Seguimiento de visita con ${contactName} - ${listingTitle}`;
      case "offer_received":
        return `Revisar oferta de ${contactName} por ${listingTitle}`;
      case "notes_added":
        return `Seguimiento con ${contactName} - ${listingTitle}`;
      case "appointment_scheduled":
        return `Preparar cita con ${contactName} - ${listingTitle}`;
      case "message_received":
        return `Responder mensaje de ${contactName} - ${listingTitle}`;
      default:
        return `Seguimiento con ${contactName} - ${listingTitle}`;
    }
  }

  // Contact activity (no listing)
  switch (action) {
    case "call_logged":
      return `Llamar a ${contactName}`;
    case "email_sent":
      return `Enviar email a ${contactName}`;
    case "whatsapp_sent":
      return `Enviar WhatsApp a ${contactName}`;
    case "viewing_completed":
      return `Hacer seguimiento con ${contactName}`;
    case "notes_added":
      return `Seguimiento: ${contactName}`;
    case "message_received":
      return `Responder mensaje de ${contactName}`;
    default:
      return `Seguimiento con ${contactName}`;
  }
}

/**
 * Fetch contact name from database
 *
 * @param contactId - The contact ID
 * @returns Full name of the contact or "Contacto"
 */
export async function fetchContactName(contactId: bigint): Promise<string> {
  try {
    const [contact] = await db
      .select({
        firstName: contacts.firstName,
        lastName: contacts.lastName,
      })
      .from(contacts)
      .where(eq(contacts.contactId, contactId))
      .limit(1);

    if (!contact) {
      return "Contacto";
    }

    return `${contact.firstName} ${contact.lastName ?? ""}`.trim();
  } catch (error) {
    console.error("Error fetching contact name:", error);
    return "Contacto";
  }
}

/**
 * Fetch listing title from database
 *
 * @param listingId - The listing ID
 * @returns Title of the listing or null
 */
export async function fetchListingTitle(
  listingId: bigint,
): Promise<string | null> {
  try {
    const { properties } = await import("../db/schema");

    const [result] = await db
      .select({
        title: properties.title,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(eq(listings.listingId, listingId))
      .limit(1);

    return result?.title ?? null;
  } catch (error) {
    console.error("Error fetching listing title:", error);
    return null;
  }
}
