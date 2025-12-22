"use server";

import { db } from "../db";
import {
  listings,
  properties,
  listingContacts,
  contacts,
  documents,
  accounts,
  locations,
  users,
} from "../db/schema";
import { eq, and, desc, like, asc } from "drizzle-orm";
import { getCurrentUser, getCurrentUserAccountId } from "~/lib/dal";
import { updateContactWithAuth } from "~/server/queries/contact";
import { uploadDocument } from "~/app/actions/upload";
import type {
  HojaEncargoFormData,
  HojaEncargoPageData,
  HojaEncargoDocumentData,
} from "~/types/hoja-encargo";
import { getBrandAsset } from "~/app/actions/brand-upload";

/**
 * Sanitize a string for use in filenames
 */
function sanitizeFilename(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Convert signature data URL to File object for document upload
 */
async function convertSignatureToFile(
  signatureDataUrl: string,
  signatureType: "owner" | "agent",
  referenceNumber: string,
  signerName: string,
  signingDate: Date,
): Promise<File> {
  try {
    console.log(`🔄 Converting ${signatureType} hoja encargo signature:`, {
      dataUrlLength: signatureDataUrl.length,
      referenceNumber,
    });

    if (!signatureDataUrl.startsWith("data:image/")) {
      throw new Error(`Invalid signature data URL format for ${signatureType}`);
    }

    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();

    const ref = sanitizeFilename(referenceNumber);
    const name = sanitizeFilename(signerName);
    const dateStr = signingDate.toISOString().split("T")[0];
    const signatureLabel = signatureType === "owner" ? "propietario" : "agente";

    const filename = `firma-encargo-${signatureLabel}-${dateStr}-${ref}-${name}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    console.log(`✅ ${signatureType} hoja encargo signature converted:`, {
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    return file;
  } catch (error) {
    console.error(
      `❌ Error converting ${signatureType} signature to file:`,
      error,
    );
    throw new Error(
      `Failed to convert ${signatureType} signature: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get hoja encargo form data for the page
 */
export async function getHojaEncargoFormDataAction(
  listingId: number,
): Promise<{
  success: boolean;
  data?: HojaEncargoPageData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const accountId = await getCurrentUserAccountId();

    // Get listing, property, location data
    const [listingData] = await db
      .select({
        listing: {
          listingId: listings.listingId,
          price: listings.price,
          listingType: listings.listingType,
          shortDescription: listings.shortDescription,
          description: listings.description,
          hasKeys: listings.hasKeys,
          allowSignage: listings.allowSignage,
          allowVisits: listings.allowVisits,
          allowKeyDelivery: listings.allowKeyDelivery,
          allowPortalPublication: listings.allowPortalPublication,
        },
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
          energyConsumptionScale: properties.energyConsumptionScale,
          energyConsumptionValue: properties.energyConsumptionValue,
        },
        location: {
          city: locations.city,
          province: locations.province,
        },
        account: {
          accountId: accounts.accountId,
          accountType: accounts.accountType,
          name: accounts.name,
          email: accounts.email,
          phone: accounts.phone,
          website: accounts.website,
          address: accounts.address,
          taxId: accounts.taxId,
          collegiateNumber: accounts.collegiateNumber,
          logo: accounts.logo,
          signatureUrl: accounts.signatureUrl,
          terms: accounts.terms,
        },
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .innerJoin(accounts, eq(listings.accountId, accounts.accountId))
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      )
      .limit(1);

    if (!listingData) {
      throw new Error("Listing not found or you don't have access to it");
    }

    console.log("📋 getHojaEncargoFormDataAction - Account signature:", {
      signatureUrl: listingData.account.signatureUrl ?? "NULL",
      accountId: listingData.account.accountId.toString(),
    });

    // Get owner contact
    const [ownerData] = await db
      .select({
        contactId: contacts.contactId,
        listingContactId: listingContacts.listingContactId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        nif: contacts.nif,
        email: contacts.email,
        phone: contacts.phone,
        address: contacts.address,
        gdprConsent: contacts.gdprConsent,
      })
      .from(listingContacts)
      .innerJoin(contacts, eq(listingContacts.contactId, contacts.contactId))
      .where(
        and(
          eq(listingContacts.listingId, BigInt(listingId)),
          eq(listingContacts.contactType, "owner"),
        ),
      )
      .limit(1);

    // Check for existing hoja encargo document
    const existingDocument = await checkExistingHojaEncargo(listingId);

    // For non-company accounts, fetch the earliest created user's name
    let agentPersonName: string | null = null;
    if (listingData.account.accountType !== "company") {
      const [earliestUser] = await db
        .select({
          name: users.name,
        })
        .from(users)
        .where(eq(users.accountId, listingData.account.accountId))
        .orderBy(asc(users.createdAt))
        .limit(1);

      agentPersonName = earliestUser?.name ?? null;
    }

    // Parse account terms (used as defaults)
    const accountTerms = listingData.account.terms as Record<string, unknown> | null;
    // Prioritize database values over account defaults
    const terms = {
      commission: (accountTerms?.commission as number) ?? 3,
      minCommission: (accountTerms?.min_commission as number) ?? 1500,
      duration: (accountTerms?.duration as number) ?? 12,
      exclusivity: (accountTerms?.exclusivity as boolean) ?? false,
      // Use listing-specific values if set, otherwise fall back to account defaults
      allowSignage: listingData.listing.allowSignage ?? (accountTerms?.allowSignage as boolean) ?? true,
      allowVisits: listingData.listing.allowVisits ?? (accountTerms?.allowVisits as boolean) ?? true,
      allowKeyDelivery: listingData.listing.allowKeyDelivery ?? (accountTerms?.allowKeyDelivery as boolean) ?? true,
      allowPortalPublication: listingData.listing.allowPortalPublication ?? (accountTerms?.allowPortalPublication as boolean) ?? true,
      // Use contact-specific value if set, otherwise fall back to account defaults
      communications: ownerData?.gdprConsent ?? (accountTerms?.communications as boolean) ?? false,
    };

    return {
      success: true,
      data: {
        accountId: accountId.toString(),
        listing: {
          listingId: listingData.listing.listingId,
          price: listingData.listing.price,
          listingType: listingData.listing.listingType,
          shortDescription: listingData.listing.shortDescription,
          description: listingData.listing.description,
          hasKeys: listingData.listing.hasKeys ?? false,
        },
        property: {
          propertyId: listingData.property.propertyId,
          referenceNumber: listingData.property.referenceNumber,
          street: listingData.property.street,
          addressDetails: listingData.property.addressDetails,
          postalCode: listingData.property.postalCode,
          city: listingData.location?.city ?? null,
          province: listingData.location?.province ?? null,
          cadastralReference: listingData.property.cadastralReference,
          squareMeters: listingData.property.squareMeters,
          builtSurfaceArea: listingData.property.builtSurfaceArea,
          propertyType: listingData.property.propertyType,
          energyConsumptionScale: listingData.property.energyConsumptionScale,
          energyConsumptionValue: listingData.property.energyConsumptionValue
            ? Number(listingData.property.energyConsumptionValue)
            : null,
        },
        owner: ownerData
          ? {
              contactId: ownerData.contactId,
              listingContactId: ownerData.listingContactId,
              firstName: ownerData.firstName,
              lastName: ownerData.lastName,
              nif: ownerData.nif,
              email: ownerData.email,
              phone: ownerData.phone,
              address: ownerData.address,
              gdprConsent: ownerData.gdprConsent,
            }
          : null,
        agency: {
          accountId: listingData.account.accountId,
          accountType: listingData.account.accountType ?? "company",
          name: listingData.account.name,
          agentPersonName,
          email: listingData.account.email,
          phone: listingData.account.phone,
          website: listingData.account.website,
          address: listingData.account.address,
          taxId: listingData.account.taxId,
          collegiateNumber: listingData.account.collegiateNumber,
          logo: listingData.account.logo,
          signatureUrl: listingData.account.signatureUrl,
        },
        terms,
        existingDocument,
      },
    };
  } catch (error) {
    console.error("Error fetching hoja encargo form data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch hoja encargo form data",
    };
  }
}

/**
 * Check if hoja encargo document already exists for a listing
 */
async function checkExistingHojaEncargo(
  listingId: number,
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
          eq(documents.listingId, BigInt(listingId)),
          like(documents.filename, "Hoja-Encargo-%"),
          eq(documents.isActive, true),
        ),
      )
      .orderBy(desc(documents.createdAt))
      .limit(1);

    return existing ?? null;
  } catch (error) {
    console.error("Error checking existing hoja encargo:", error);
    return null;
  }
}

/**
 * Check if hoja encargo already exists (public action)
 */
export async function checkExistingHojaEncargoAction(
  listingId: number,
): Promise<{
  success: boolean;
  exists: boolean;
  document?: { docId: bigint; filename: string; fileUrl: string; createdAt: Date };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const document = await checkExistingHojaEncargo(listingId);

    return {
      success: true,
      exists: !!document,
      document: document ?? undefined,
    };
  } catch (error) {
    console.error("Error checking existing hoja encargo:", error);
    return {
      success: false,
      exists: false,
      error:
        error instanceof Error ? error.message : "Failed to check document status",
    };
  }
}

/**
 * Create hoja encargo - uploads signatures (if provided)
 */
export async function createHojaEncargoAction(
  formData: HojaEncargoFormData,
): Promise<{
  success: boolean;
  listingId?: bigint;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // Validate required fields
    if (!formData.ownerNif) {
      throw new Error("El NIF del propietario es obligatorio");
    }

    if (!formData.ownerAddress) {
      throw new Error("La dirección del propietario es obligatoria");
    }

    // Get listing data for reference number
    const [listingData] = await db
      .select({
        referenceNumber: properties.referenceNumber,
        propertyId: properties.propertyId,
      })
      .from(listings)
      .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
      .where(eq(listings.listingId, formData.listingId))
      .limit(1);

    if (!listingData) {
      throw new Error("Listing not found");
    }

    const referenceNumber =
      listingData.referenceNumber ?? `ENCARGO_${formData.listingId}`;

    console.log(`📂 Creating hoja encargo for listing ${formData.listingId}`);
    console.log(`📂 Using reference number: ${referenceNumber}`);

    // Upload owner signature if provided
    if (formData.ownerSignature) {
      const ownerSignatureFile = await convertSignatureToFile(
        formData.ownerSignature,
        "owner",
        referenceNumber,
        formData.ownerName,
        formData.signingDate,
      );

      const ownerDocument = await uploadDocument(
        ownerSignatureFile,
        currentUser.id,
        referenceNumber,
        1,
        "firma-encargo-propietario",
        formData.ownerContactId,
        formData.listingId,
        undefined, // listingContactId
        undefined, // dealId
        undefined, // appointmentId
        listingData.propertyId,
        "initial-docs",
      );

      console.log(`✅ Owner signature stored:
        - Document ID: ${ownerDocument.docId}
        - S3 URL: ${ownerDocument.fileUrl}
        - Tag: firma-encargo-propietario`);
    }

    // Agent signature comes from account settings (signatureUrl), no upload needed

    // Update listing with authorization fields
    await db
      .update(listings)
      .set({
        allowSignage: formData.allowSignage,
        allowVisits: formData.allowVisits,
        allowKeyDelivery: formData.allowKeyDelivery,
        allowPortalPublication: formData.allowPortalPublication,
        updatedAt: new Date(),
      })
      .where(eq(listings.listingId, formData.listingId));

    console.log(`✅ Hoja encargo created for listing ${formData.listingId}`);

    return {
      success: true,
      listingId: formData.listingId,
    };
  } catch (error) {
    console.error("Error creating hoja encargo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create hoja encargo",
    };
  }
}

/**
 * Get hoja encargo document data for PDF generation/preview
 */
export async function getHojaEncargoDocumentDataAction(
  listingId: number,
  formData?: Partial<HojaEncargoFormData>,
): Promise<{
  success: boolean;
  data?: HojaEncargoDocumentData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const result = await getHojaEncargoFormDataAction(listingId);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Failed to fetch data");
    }

    const pageData = result.data;

    // Format date and location
    const signingDate = formData?.signingDate
      ? new Date(formData.signingDate)
      : new Date();
    const date = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(signingDate);

    const location =
      formData?.signingLocation ?? pageData.property.city ?? "Oficina";

    // Get branding logo
    let brandLogoUrl: string | null = null;
    try {
      const brandAsset = await getBrandAsset(pageData.accountId);
      brandLogoUrl =
        brandAsset?.logoTransparentUrl && brandAsset.logoTransparentUrl.trim() !== ""
          ? brandAsset.logoTransparentUrl
          : brandAsset?.logoOriginalUrl ?? null;
    } catch (brandError) {
      console.error("Failed to fetch branding data:", brandError);
    }

    // Build full address
    const fullAddress = [
      pageData.property.street,
      pageData.property.addressDetails,
      pageData.property.postalCode,
      pageData.property.city,
      pageData.property.province,
    ]
      .filter(Boolean)
      .join(", ");

    // Format energy certificate
    let energyCertificate = "Pendiente";
    if (pageData.property.energyConsumptionScale) {
      if (pageData.property.energyConsumptionValue) {
        energyCertificate = `Disponible - Certificación ${pageData.property.energyConsumptionScale} (${pageData.property.energyConsumptionValue} kWh/m² año)`;
      } else {
        energyCertificate = `Disponible - Certificación ${pageData.property.energyConsumptionScale}`;
      }
    }

    // Format price
    const price = pageData.listing.price
      ? new Intl.NumberFormat("es-ES").format(Number(pageData.listing.price)) + " €"
      : "No especificado";

    // Generate document number
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    const documentNumber = `Hoja-Encargo-${pageData.listing.listingId}-${month}${year}`;

    // Build owner address
    const ownerAddress = formData?.ownerAddress ?? pageData.owner?.address ?? "";

    // Get owner signature if exists (agent signature comes from account settings)
    const ownerSignature = await getHojaEncargoOwnerSignature(listingId);

    console.log("📝 Hoja Encargo Signatures:", {
      ownerSignature: ownerSignature ? "present" : "missing",
      agentSignatureUrl: pageData.agency.signatureUrl ?? "missing",
    });

    const documentData: HojaEncargoDocumentData = {
      documentNumber,
      agency: {
        agentName: pageData.agency.accountType === "company"
          ? pageData.agency.name
          : pageData.agency.agentPersonName ?? pageData.agency.name,
        collegiateNumber: pageData.agency.collegiateNumber ?? "",
        agentNIF: pageData.agency.taxId ?? "",
        website: pageData.agency.website ?? "",
        email: pageData.agency.email ?? "",
        logo: brandLogoUrl ?? pageData.agency.logo ?? undefined,
        offices: [
          {
            address: pageData.agency.address ?? "",
            city: pageData.property.city ?? "",
            postalCode: "",
            phone: pageData.agency.phone ?? "",
          },
        ],
      },
      client: {
        fullName:
          formData?.ownerName ??
          (`${pageData.owner?.firstName ?? ""} ${pageData.owner?.lastName ?? ""}`.trim() || "No especificado"),
        nif: formData?.ownerNif ?? pageData.owner?.nif ?? "",
        address: ownerAddress,
        city: formData?.ownerCity ?? "",
        postalCode: formData?.ownerPostalCode ?? "",
        phone: formData?.ownerPhone ?? pageData.owner?.phone ?? "",
        email: formData?.ownerEmail ?? pageData.owner?.email ?? "",
      },
      property: {
        description:
          formData?.propertyDescription ?? pageData.listing.shortDescription ?? pageData.listing.description ?? "No especificado",
        fullAddress,
        cadastralReference: pageData.property.cadastralReference ?? undefined,
        surfaceArea: pageData.property.builtSurfaceArea ?? pageData.property.squareMeters?.toString(),
        energyCertificate,
        hasKeys: pageData.listing.hasKeys,
      },
      operation: {
        type: pageData.listing.listingType === "Rent" ? "Alquiler" : "Venta",
        price,
      },
      terms: {
        commissionPercentage: formData?.commissionPercentage ?? pageData.terms?.commission ?? 3,
        minimumCommission: (formData?.minimumCommission ?? pageData.terms?.minCommission ?? 1500).toString(),
        durationMonths: formData?.durationMonths ?? pageData.terms?.duration ?? 12,
        exclusivity: formData?.exclusivity ?? pageData.terms?.exclusivity ?? false,
        allowSignage: formData?.allowSignage ?? pageData.terms?.allowSignage ?? true,
        allowVisits: formData?.allowVisits ?? pageData.terms?.allowVisits ?? true,
        allowKeyDelivery: formData?.allowKeyDelivery ?? pageData.terms?.allowKeyDelivery ?? true,
        allowPortalPublication: formData?.allowPortalPublication ?? pageData.terms?.allowPortalPublication ?? true,
      },
      signatures: {
        ownerSignatureUrl: ownerSignature ?? undefined,
        agentSignatureUrl: pageData.agency.signatureUrl ?? undefined,
        location,
        date,
      },
      jurisdiction: {
        city: pageData.property.city ?? "León",
      },
      observations: "",
      gdprConsent: formData?.gdprConsent ?? pageData.terms?.communications ?? false,
    };

    return { success: true, data: documentData };
  } catch (error) {
    console.error("Error fetching hoja encargo document data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch hoja encargo document data",
    };
  }
}

/**
 * Get owner signature document for a listing (agent signature comes from account settings)
 */
async function getHojaEncargoOwnerSignature(
  listingId: number,
): Promise<string | null> {
  try {
    const [signature] = await db
      .select({
        fileUrl: documents.fileUrl,
      })
      .from(documents)
      .where(
        and(
          eq(documents.listingId, BigInt(listingId)),
          eq(documents.documentTag, "firma-encargo-propietario"),
          eq(documents.isActive, true),
        ),
      )
      .limit(1);

    return signature?.fileUrl ?? null;
  } catch (error) {
    console.error("Error fetching owner signature:", error);
    return null;
  }
}

/**
 * Update owner contact fields from hoja encargo form
 */
export async function updateOwnerContactFromHojaEncargoAction(input: {
  contactId: string;
  fields: Partial<{
    nif: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    gdprConsent: boolean;
  }>;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    if (Object.keys(input.fields).length === 0) {
      return { success: true };
    }

    await updateContactWithAuth(Number(input.contactId), input.fields);

    return { success: true };
  } catch (error) {
    console.error("Error updating owner contact from hoja encargo:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update contact fields",
    };
  }
}

/**
 * Get hoja encargo share data for the share modal
 */
export async function getHojaEncargoShareDataAction(
  listingId: number,
): Promise<{
  success: boolean;
  data?: {
    ownerName: string;
    ownerPhone?: string;
    ownerEmail?: string;
    propertyAddress: string;
    commissionPercentage: string;
    durationMonths: string;
    documentUrl?: string;
  };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const result = await getHojaEncargoFormDataAction(listingId);
    if (!result.success || !result.data) {
      throw new Error(result.error ?? "Failed to fetch data");
    }

    const { owner, property, terms, existingDocument } = result.data;

    // Build owner name
    const ownerName = owner
      ? [owner.firstName, owner.lastName].filter(Boolean).join(" ")
      : "Propietario";

    // Build property address
    const propertyAddress = [
      property.street,
      property.addressDetails,
      property.postalCode,
      property.city,
      property.province,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      success: true,
      data: {
        ownerName,
        ownerPhone: owner?.phone ?? undefined,
        ownerEmail: owner?.email ?? undefined,
        propertyAddress,
        commissionPercentage: (terms?.commission ?? 3).toString(),
        durationMonths: (terms?.duration ?? 12).toString(),
        documentUrl: existingDocument?.fileUrl,
      },
    };
  } catch (error) {
    console.error("Error fetching hoja encargo share data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch share data",
    };
  }
}
