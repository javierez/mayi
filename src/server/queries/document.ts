import { db } from "../db";
import { documents, listings, listingContacts, properties, locations, contacts } from "../db/schema";
import { eq, and, like, desc, asc } from "drizzle-orm";
import type { Document } from "../../lib/data";
import { getCurrentUserAccountId } from "../../lib/dal";

// Helper function to serialize document with BigInt values
export function serializeDocument(document: Document | null | undefined) {
  if (!document) return null;

  return {
    ...document,
    docId: document.docId.toString(),
    propertyId: document.propertyId?.toString(),
    contactId: document.contactId?.toString(),
    listingId: document.listingId?.toString(),
    listingContactId: document.listingContactId?.toString(),
    dealId: document.dealId?.toString(),
    appointmentId: document.appointmentId?.toString(),
    prospectId: document.prospectId?.toString(),
    documentTimestamp: document.documentTimestamp?.toISOString(),
  };
}

// Create a new document
export async function createDocument(
  data: Omit<Document, "docId" | "createdAt" | "updatedAt" | "uploadedAt">,
) {
  try {
    const [result] = await db
      .insert(documents)
      .values({
        ...data,
        s3key: data.s3key, // make sure this exists in your data
        documentKey: data.documentKey, // make sure this exists in your data
        uploadedAt: new Date(),
        isActive: true,
      })
      .returning();
    if (!result) throw new Error("Failed to create document");
    return result;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

// Get document by ID
export async function getDocumentById(docId: number) {
  try {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.docId, BigInt(docId)));
    return document;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
}

// Get documents by reference number
export async function getDocumentsByReference(
  referenceNumber: string,
  isActive = true,
) {
  try {
    const conditions = [like(documents.documentKey, `${referenceNumber}%`)];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error getting documents by reference:", error);
    throw error;
  }
}

// Get documents by user ID
export async function getUserDocuments(userId: string, isActive = true) {
  try {
    const conditions = [eq(documents.userId, userId)]; // userId is now string
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
}

// Get documents by contact ID
export async function getContactDocuments(
  contactId: number,
  isActive = true,
  orderBy: "uploadedAt" | "documentOrder" = "documentOrder",
) {
  try {
    const conditions = [eq(documents.contactId, BigInt(contactId))];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    const orderByClause =
      orderBy === "uploadedAt"
        ? desc(documents.uploadedAt)
        : asc(documents.documentOrder);

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(orderByClause);
  } catch (error) {
    console.error("Error fetching contact documents:", error);
    throw error;
  }
}

// Get documents by listing ID
export async function getListingDocuments(listingId: number, isActive = true) {
  try {
    const conditions = [eq(documents.listingId, BigInt(listingId))];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching listing documents:", error);
    throw error;
  }
}

// Get documents by lead ID
export async function getLeadDocuments(
  listingContactId: number,
  isActive = true,
) {
  try {
    const conditions = [
      eq(documents.listingContactId, BigInt(listingContactId)),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching lead documents:", error);
    throw error;
  }
}

// Get documents by deal ID
export async function getDealDocuments(dealId: number, isActive = true) {
  try {
    const conditions = [eq(documents.dealId, BigInt(dealId))];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching deal documents:", error);
    throw error;
  }
}

// Get documents by appointment ID
export async function getAppointmentDocuments(
  appointmentId: number,
  isActive = true,
) {
  try {
    const conditions = [eq(documents.appointmentId, BigInt(appointmentId))];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching appointment documents:", error);
    throw error;
  }
}

// Get documents by prospect ID
export async function getProspectDocuments(
  prospectId: number,
  isActive = true,
) {
  try {
    const conditions = [eq(documents.prospectId, BigInt(prospectId))];
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching prospect documents:", error);
    throw error;
  }
}

// Get documents by property ID
export async function getPropertyDocuments(
  propertyId: bigint,
  documentTag?: string,
  isActive = true,
) {
  try {
    const conditions = [eq(documents.propertyId, propertyId)];
    if (documentTag) {
      conditions.push(eq(documents.documentTag, documentTag));
    }
    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(asc(documents.documentOrder));
  } catch (error) {
    console.error("Error fetching property documents:", error);
    throw error;
  }
}

// Update document
export async function updateDocument(docId: bigint, data: Partial<Document>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.docId, docId));

    return await getDocumentById(Number(docId));
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
}

// Delete document (soft delete by setting isActive to false)
export async function deleteDocument(docId: bigint) {
  try {
    const document = await getDocumentById(Number(docId));
    await db
      .update(documents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documents.docId, docId));
    return document;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}

// Hard delete document (use with caution)
export async function hardDeleteDocument(docId: bigint) {
  try {
    const document = await getDocumentById(Number(docId));
    await db.delete(documents).where(eq(documents.docId, docId));
    return document;
  } catch (error) {
    console.error("Error hard deleting document:", error);
    throw error;
  }
}

// Update document orders
export async function updateDocumentOrders(
  updates: Array<{ docId: bigint; documentOrder: number }>,
): Promise<void> {
  try {
    await Promise.all(
      updates.map(({ docId, documentOrder }) =>
        updateDocument(docId, { documentOrder }),
      ),
    );
  } catch (error) {
    console.error("Error updating document orders:", error);
    throw error;
  }
}

// List all documents (with pagination and optional filters)
export async function listDocuments(
  page = 1,
  limit = 10,
  filters?: {
    userId?: string; // Changed to string for BetterAuth compatibility
    contactId?: number;
    listingId?: number;
    listingContactId?: number;
    dealId?: number;
    appointmentId?: number;
    prospectId?: number;
    fileType?: string;
    documentTag?: string;
    isActive?: boolean;
  },
) {
  try {
    const offset = (page - 1) * limit;

    // Build the where conditions array
    const whereConditions = [];
    if (filters) {
      if (filters.userId) {
        whereConditions.push(eq(documents.userId, filters.userId)); // userId is now string
      }
      if (filters.contactId) {
        whereConditions.push(
          eq(documents.contactId, BigInt(filters.contactId)),
        );
      }
      if (filters.listingId) {
        whereConditions.push(
          eq(documents.listingId, BigInt(filters.listingId)),
        );
      }
      if (filters.listingContactId) {
        whereConditions.push(
          eq(documents.listingContactId, BigInt(filters.listingContactId)),
        );
      }
      if (filters.dealId) {
        whereConditions.push(eq(documents.dealId, BigInt(filters.dealId)));
      }
      if (filters.appointmentId) {
        whereConditions.push(
          eq(documents.appointmentId, BigInt(filters.appointmentId)),
        );
      }
      if (filters.prospectId) {
        whereConditions.push(
          eq(documents.prospectId, BigInt(filters.prospectId)),
        );
      }
      if (filters.fileType) {
        whereConditions.push(eq(documents.fileType, filters.fileType));
      }
      if (filters.documentTag) {
        whereConditions.push(eq(documents.documentTag, filters.documentTag));
      }
      if (filters.isActive !== undefined) {
        whereConditions.push(eq(documents.isActive, filters.isActive));
      }
    } else {
      // By default, only show active documents
      whereConditions.push(eq(documents.isActive, true));
    }

    // Create the base query
    const query = db.select().from(documents);

    // Apply all where conditions at once
    const filteredQuery =
      whereConditions.length > 0 ? query.where(and(...whereConditions)) : query;

    // Apply pagination and ordering
    const allDocuments = await filteredQuery
      .orderBy(desc(documents.uploadedAt))
      .limit(limit)
      .offset(offset);

    return allDocuments;
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
}

// Get energy certificate document by listing ID
export async function getEnergyCertificate(propertyId: number) {
  try {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.propertyId, BigInt(propertyId)),
          eq(documents.documentTag, "energy_certificate"),
          eq(documents.isActive, true),
        ),
      )
      .orderBy(desc(documents.uploadedAt));
    return document ?? null;
  } catch (error) {
    console.error("Error fetching energy certificate document:", error);
    throw error;
  }
}

// Get documents by property ID and folder type (document tag)
export async function getDocumentsByFolderType(
  propertyId: bigint,
  documentTag: string,
  isActive = true,
) {
  try {
    const conditions = [
      eq(documents.propertyId, propertyId),
      eq(documents.documentTag, documentTag),
    ];

    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));
  } catch (error) {
    console.error("Error fetching documents by folder type:", error);
    throw error;
  }
}

// Get contact documents data for route pages (server-side)
// Returns contact info needed for document pages
export async function getContactDocumentsData(contactId: number) {
  try {
    const accountId = await getCurrentUserAccountId();

    const [contact] = await db
      .select({
        contactId: contacts.contactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.contactId, BigInt(contactId)),
          eq(contacts.accountId, BigInt(accountId)),
          eq(contacts.isActive, true),
        ),
      );

    if (!contact) {
      return null;
    }

    return {
      contactId: contact.contactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
    };
  } catch (error) {
    console.error("Error fetching contact documents data:", error);
    throw error;
  }
}

// Get documents from listings where contact is owner, grouped by listingId
// Returns documents with listing information (title, street, propertyType)
export async function getContactOwnerDocumentsGroupedByListing(
  contactId: number,
  documentTag: string,
  isActive = true,
) {
  try {
    const accountId = await getCurrentUserAccountId();

    // Conditions for where clause (join conditions are in the join itself)
    const conditions = [
      eq(listings.isActive, true),
      eq(listings.accountId, BigInt(accountId)),
      eq(documents.documentTag, documentTag),
    ];

    if (isActive !== undefined) {
      conditions.push(eq(documents.isActive, isActive));
    }

    // Join documents -> listings -> listingContacts -> properties -> locations
    const documentsWithListings = await db
      .select({
        // Document fields
        docId: documents.docId,
        filename: documents.filename,
        fileType: documents.fileType,
        fileUrl: documents.fileUrl,
        userId: documents.userId,
        contactId: documents.contactId,
        listingId: documents.listingId,
        listingContactId: documents.listingContactId,
        dealId: documents.dealId,
        appointmentId: documents.appointmentId,
        propertyId: documents.propertyId,
        prospectId: documents.prospectId,
        documentKey: documents.documentKey,
        s3key: documents.s3key,
        documentTag: documents.documentTag,
        documentOrder: documents.documentOrder,
        documentHash: documents.documentHash,
        documentTimestamp: documents.documentTimestamp,
        uploadedAt: documents.uploadedAt,
        isActive: documents.isActive,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        // Listing info for grouping
        listingTitle: properties.title,
        listingStreet: properties.street,
        listingPropertyType: properties.propertyType,
        listingCity: locations.city,
        listingReferenceNumber: properties.referenceNumber,
      })
      .from(documents)
      .innerJoin(listings, eq(documents.listingId, listings.listingId))
      .innerJoin(
        listingContacts,
        and(
          eq(listings.listingId, listingContacts.listingId),
          eq(listingContacts.contactId, BigInt(contactId)),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));

    return documentsWithListings;
  } catch (error) {
    console.error(
      "Error fetching contact owner documents grouped by listing:",
      error,
    );
    throw error;
  }
}
