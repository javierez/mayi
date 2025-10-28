"use server";

import { db } from "~/server/db";
import {
  listings,
  properties,
  contacts,
  locations,
  accounts,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUserAccountId } from "~/lib/dal";
import { sendEmail } from "~/lib/email";

export async function shareListingViaEmailWithAuth(
  listingId: bigint,
  contactId: bigint,
  prospectId: bigint,
) {
  console.log("📧 Sharing listing via email:", {
    listingId,
    contactId,
    prospectId,
  });
  const accountId = await getCurrentUserAccountId();

  try {
    // Verify the contact belongs to this account and fetch account website
    const [result] = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        accountWebsite: accounts.website,
      })
      .from(contacts)
      .innerJoin(accounts, eq(contacts.accountId, accounts.accountId))
      .where(
        and(
          eq(contacts.contactId, contactId),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!result) {
      return {
        success: false,
        message: "Contacto no encontrado o acceso denegado",
      };
    }

    if (!result.email) {
      return {
        success: false,
        message: "El contacto no tiene email registrado",
      };
    }

    const contact = {
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
    };

    const accountWebsite = result.accountWebsite;

    // Fetch listing details
    const [listingData] = await db
      .select({
        listingId: listings.listingId,
        listingType: listings.listingType,
        price: listings.price,
        propertyId: properties.propertyId,
        title: properties.title,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        street: properties.street,
        postalCode: properties.postalCode,
        neighborhood: locations.neighborhood,
        city: locations.city,
        province: locations.province,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(eq(listings.listingId, listingId));

    if (!listingData) {
      return {
        success: false,
        message: "Propiedad no encontrada",
      };
    }

    // Generate email content
    const { html, text } = generatePropertyShareEmail(
      listingData,
      contact,
      accountWebsite,
    );

    // Send email
    await sendEmail({
      to: contact.email,
      subject: `Te compartimos una propiedad que podría interesarte`,
      html,
      text,
    });

    console.log(`✅ Listing ${listingId} shared with ${contact.email}`);
    return {
      success: true,
      message: "Propiedad compartida exitosamente",
    };
  } catch (error) {
    console.error("❌ Error sharing listing:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al compartir propiedad",
    };
  }
}

// Generate property share email HTML
function generatePropertyShareEmail(
  listing: {
    listingId: bigint;
    listingType: string;
    price: string;
    title: string | null;
    propertyType: string | null;
    bedrooms: number | null;
    bathrooms: string | null;
    squareMeter: number | null;
    street: string | null;
    postalCode: string | null;
    neighborhood: string | null;
    city: string | null;
    province: string | null;
  },
  contact: {
    firstName: string;
    lastName: string;
  },
  accountWebsite: string | null,
): { html: string; text: string } {
  const listingTypeText = listing.listingType === "Sale" ? "Venta" : "Alquiler";
  const propertyTypeText = listing.propertyType
    ? listing.propertyType.charAt(0).toUpperCase() +
      listing.propertyType.slice(1)
    : "Propiedad";
  const price = parseFloat(listing.price);
  const priceText =
    listing.listingType === "Sale"
      ? `€${Math.round(price / 1000)}k`
      : `€${price.toLocaleString()}/mes`;

  const propertyTitle =
    listing.title ??
    `${propertyTypeText} en ${listing.neighborhood ?? listing.city ?? ""}`;
  const location = [listing.neighborhood, listing.city, listing.province]
    .filter(Boolean)
    .join(", ");

  // Use account website or fallback to current origin
  const baseUrl =
    accountWebsite ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const propertyUrl = `${cleanBaseUrl}/propiedades/${listing.listingId.toString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Propiedad Compartida - Vesta CRM</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin-bottom: 10px;">
            Vesta <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CRM</span>
          </h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Propiedad que podría interesarte</h2>

          <p style="margin-bottom: 20px;">
            Hola ${contact.firstName},
          </p>

          <p style="margin-bottom: 20px;">
            Te compartimos esta propiedad que creemos que podría interesarte:
          </p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">${propertyTitle}</h3>

            <div style="margin-bottom: 10px;">
              <span style="background: linear-gradient(to right, #f59e0b, #f43f5e); color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${listingTypeText}
              </span>
            </div>

            <p style="color: #374151; font-size: 16px; margin: 15px 0;">
              <strong style="color: #1f2937; font-size: 20px;">${priceText}</strong>
            </p>

            <div style="color: #6b7280; font-size: 14px; margin: 15px 0;">
              ${location ? `<p style="margin: 5px 0;">📍 ${location}</p>` : ""}
              ${listing.bedrooms ? `<p style="margin: 5px 0;">🛏️ ${listing.bedrooms} habitaciones</p>` : ""}
              ${listing.bathrooms ? `<p style="margin: 5px 0;">🚿 ${Math.floor(Number(listing.bathrooms))} baños</p>` : ""}
              ${listing.squareMeter ? `<p style="margin: 5px 0;">📐 ${listing.squareMeter}m²</p>` : ""}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${propertyUrl}"
               style="background: linear-gradient(to right, #f59e0b, #f43f5e);
                      color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                      display: inline-block;">
              Ver Detalles Completos
            </a>
          </div>

          <p style="margin-bottom: 20px; color: #6b7280; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>

          <p style="margin-bottom: 30px; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
            ${propertyUrl}
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Este email fue enviado por Vesta CRM</p>
          <p>© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Propiedad que podría interesarte - Vesta CRM

Hola ${contact.firstName},

Te compartimos esta propiedad que creemos que podría interesarte:

${propertyTitle}
${listingTypeText} - ${priceText}

${location ? `📍 Ubicación: ${location}` : ""}
${listing.bedrooms ? `🛏️ Habitaciones: ${listing.bedrooms}` : ""}
${listing.bathrooms ? `🚿 Baños: ${Math.floor(Number(listing.bathrooms))}` : ""}
${listing.squareMeter ? `📐 Superficie: ${listing.squareMeter}m²` : ""}

Ver detalles completos:
${propertyUrl}

Este email fue enviado por Vesta CRM
© ${new Date().getFullYear()} Vesta CRM. Todos los derechos reservados.
  `;

  return { html, text };
}
