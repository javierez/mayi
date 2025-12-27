import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { db } from "~/server/db";
import { contacts } from "~/server/db/schema";
import { and, eq, or, like, sql } from "drizzle-orm";

/**
 * GET /api/contacts/search
 * Search for contacts by name, email, phone, or NIF
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    // Build search conditions
    const searchConditions = search
      ? or(
          like(contacts.firstName, `%${search}%`),
          like(contacts.lastName, `%${search}%`),
          like(contacts.email, `%${search}%`),
          like(contacts.phone, `%${search}%`),
          like(contacts.nif, `%${search}%`),
          // Full name search
          sql`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName}) LIKE ${`%${search}%`}`
        )
      : undefined;

    const results = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        nif: contacts.nif,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.isActive, true),
          searchConditions
        )
      )
      .orderBy(contacts.firstName, contacts.lastName)
      .limit(limit);

    // Convert BigInt to number for JSON serialization
    const contactList = results.map((c) => ({
      contactId: Number(c.contactId),
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      nif: c.nif,
    }));

    return NextResponse.json({
      contacts: contactList,
    });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return NextResponse.json(
      { error: "Error al buscar contactos" },
      { status: 500 }
    );
  }
}
