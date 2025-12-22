"use server";

import { eq } from "drizzle-orm";
import { getCurrentUser, getSecureDb } from "~/lib/dal";
import { deals } from "~/server/db/schema";
import {
  getArrasContractData,
  checkExistingArrasContract,
  getArrasSignatures,
} from "~/server/queries/arras";
import { updateContactWithAuth } from "~/server/queries/contact";
import { uploadDocument } from "~/app/actions/upload";
import { logArrasSigned } from "~/server/queries/log-activity";
import type {
  ArrasContractFormData,
  ArrasContractPageData,
  ArrasDocumentData,
} from "~/types/arras";
import { getBrandAsset } from "~/app/actions/brand-upload";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";

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
 * Convert arras signature data URL to File object for document upload
 */
async function convertArrasSignatureToFile(
  signatureDataUrl: string,
  signatureType: "seller" | "buyer",
  referenceNumber: string,
  signerName: string,
  signingDate: Date,
): Promise<File> {
  try {
    console.log(`🔄 Converting ${signatureType} arras signature:`, {
      dataUrlLength: signatureDataUrl.length,
      dataUrlPrefix: signatureDataUrl.substring(0, 50),
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
    const signatureLabel = signatureType === "seller" ? "vendedor" : "comprador";

    const filename = `firma-arras-${signatureLabel}-${dateStr}-${ref}-${name}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    console.log(`✅ ${signatureType} arras signature converted:`, {
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    return file;
  } catch (error) {
    console.error(
      `❌ Error converting ${signatureType} arras signature to file:`,
      error,
    );
    throw new Error(
      `Failed to convert ${signatureType} signature: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get arras contract data for the form page
 */
export async function getArrasContractDataAction(
  dealId: number,
): Promise<{
  success: boolean;
  data?: ArrasContractPageData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const data = await getArrasContractData(dealId);
    if (!data) {
      throw new Error("Deal not found or you don't have access to it");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching arras contract data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch arras contract data",
    };
  }
}

/**
 * Create arras contract - uploads signatures and updates deal
 */
export async function createArrasContractAction(
  formData: ArrasContractFormData,
): Promise<{
  success: boolean;
  dealId?: bigint;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }
    const { db: secureDb } = await getSecureDb();

    // Validate required fields
    if (!formData.sellerSignature || !formData.buyerSignature) {
      throw new Error("Both seller and buyer signatures are required");
    }

    if (!formData.sellerNif || !formData.buyerNif) {
      throw new Error("NIF/DNI is required for both parties");
    }

    if (!formData.sellerAddress || !formData.buyerAddress) {
      throw new Error("Address is required for both parties");
    }

    // Get the deal data for reference number
    const dealData = await getArrasContractData(Number(formData.dealId));
    if (!dealData) {
      throw new Error("Deal not found or access denied");
    }

    const referenceNumber =
      dealData.property.referenceNumber ?? `ARRAS_${formData.dealId}`;

    console.log(`📂 Creating arras contract for deal ${formData.dealId}`);
    console.log(`📂 Using reference number: ${referenceNumber}`);

    // Upload seller signature
    const sellerSignatureFile = await convertArrasSignatureToFile(
      formData.sellerSignature,
      "seller",
      referenceNumber,
      formData.sellerName,
      formData.signingDate,
    );

    const sellerDocument = await uploadDocument(
      sellerSignatureFile,
      currentUser.id,
      referenceNumber,
      1,
      "firma-arras-vendedor",
      undefined, // contactId
      dealData.listing.listingId,
      undefined, // listingContactId
      formData.dealId,
      undefined, // appointmentId
      dealData.property.propertyId,
      "others",
    );

    console.log(`✅ Seller signature stored:
      - Document ID: ${sellerDocument.docId}
      - S3 URL: ${sellerDocument.fileUrl}
      - Tag: firma-arras-vendedor`);

    // Upload buyer signature
    const buyerSignatureFile = await convertArrasSignatureToFile(
      formData.buyerSignature,
      "buyer",
      referenceNumber,
      formData.buyerName,
      formData.signingDate,
    );

    const buyerDocument = await uploadDocument(
      buyerSignatureFile,
      currentUser.id,
      referenceNumber,
      2,
      "firma-arras-comprador",
      undefined, // contactId
      dealData.listing.listingId,
      undefined, // listingContactId
      formData.dealId,
      undefined, // appointmentId
      dealData.property.propertyId,
      "others",
    );

    console.log(`✅ Buyer signature stored:
      - Document ID: ${buyerDocument.docId}
      - S3 URL: ${buyerDocument.fileUrl}
      - Tag: firma-arras-comprador`);

    // Update deal with arras information
    await secureDb
      .update(deals)
      .set({
        arrasAmount: formData.arrasAmount.toString(),
        arrasType: formData.arrasType,
        arrasSigningDate: formData.signingDate,
        expectedDeedDate: formData.deedDeadline,
        specialConditions: formData.specialConditions ?? null,
        finalPrice: formData.totalPrice.toString(),
        updatedAt: new Date(),
      })
      .where(eq(deals.dealId, formData.dealId));

    console.log(`✅ Deal ${formData.dealId} updated with arras information`);

    // Log the arras signing activity
    try {
      await logArrasSigned({
        listingId: dealData.listing.listingId,
        userId: currentUser.id,
        dealId: formData.dealId,
      });
      console.log("📝 Logged arras_signed activity");
    } catch (logError) {
      console.error("⚠️ Failed to log arras_signed activity:", logError);
      // Don't fail the contract creation if activity logging fails
    }

    return {
      success: true,
      dealId: formData.dealId,
    };
  } catch (error) {
    console.error("Error creating arras contract:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create arras contract",
    };
  }
}

/**
 * Get arras document data for PDF generation/preview
 */
export async function getArrasDocumentDataAction(
  dealId: number,
  formData?: Partial<ArrasContractFormData>,
): Promise<{
  success: boolean;
  data?: ArrasDocumentData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const contractData = await getArrasContractData(dealId);
    if (!contractData) {
      throw new Error("Deal not found or you don't have access to it");
    }

    // Get signatures if they exist
    const signatures = await getArrasSignatures(dealId);

    // Format date and location
    // Note: signingDate may be a string when coming from JSON, so we need to convert it
    const signingDate = formData?.signingDate
      ? new Date(formData.signingDate)
      : new Date();
    const date = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(signingDate);

    const location =
      formData?.signingLocation ??
      contractData.property.city ??
      "Oficina";

    // Fetch branding data
    let brandLogoUrl: string | null = null;
    let brandingAgentName: string | null = null;
    let collegiateNumber: string | null = null;
    let accountType: string | null = null;
    let accountName: string | null = null;
    let taxId: string | null = null;
    let offices: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }> = [];
    let website: string | null = null;
    const email: string | null = null;
    let signatureUrl: string | null = null;
    let userAccountId: number | null = null;

    try {
      userAccountId = await getCurrentUserAccountIdAction();

      if (userAccountId) {
        const accountIdStr = userAccountId.toString();

        const brandAsset = await getBrandAsset(accountIdStr);
        brandLogoUrl =
          brandAsset?.logoTransparentUrl && brandAsset.logoTransparentUrl.trim() !== ""
            ? brandAsset.logoTransparentUrl
            : brandAsset?.logoOriginalUrl ?? null;

        const agentNameResult = await getAgentNameAction(BigInt(userAccountId));
        if (agentNameResult.success) {
          brandingAgentName = agentNameResult.agentName ?? null;
          accountType = agentNameResult.accountType ?? null;
          accountName = agentNameResult.accountName ?? null;
          collegiateNumber = agentNameResult.collegiateNumber ?? null;
          taxId = agentNameResult.taxId ?? null;
          website = agentNameResult.website ?? null;
        }

        const officeInfoResult = await getOfficeInfoAction(BigInt(userAccountId));
        if (officeInfoResult.success && officeInfoResult.offices) {
          offices = officeInfoResult.offices;
        }
      }
    } catch (brandError) {
      console.error("Failed to fetch branding data:", brandError);
    }

    // Build the full address
    const fullAddress = [
      contractData.property.street,
      contractData.property.addressDetails,
      contractData.property.postalCode,
      contractData.property.city,
      contractData.property.province,
    ]
      .filter(Boolean)
      .join(", ");

    // Use form data if provided, otherwise use stored data
    const arrasAmount =
      formData?.arrasAmount?.toString() ??
      contractData.deal.arrasAmount ??
      "0";
    const arrasType =
      formData?.arrasType ?? contractData.deal.arrasType ?? "penitenciales";
    const finalPrice =
      formData?.totalPrice?.toString() ??
      contractData.deal.finalPrice ??
      contractData.listing.price ??
      "0";

    const documentData: ArrasDocumentData = {
      accountId: userAccountId?.toString(),
      deal: {
        dealId: contractData.deal.dealId,
        finalPrice,
        arrasAmount,
        arrasType,
        paymentMethod: formData?.paymentMethod ?? "transferencia",
        bankAccountIban: formData?.bankAccountIban,
        signingDate,
        deedDeadline: formData?.deedDeadline
          ? new Date(formData.deedDeadline)
          : (contractData.deal.expectedDeedDate ?? new Date()),
        hasFinancingCondition: formData?.hasFinancingCondition ?? false,
        financingDeadline: formData?.financingDeadline
          ? new Date(formData.financingDeadline)
          : undefined,
        specialConditions:
          formData?.specialConditions ?? contractData.deal.specialConditions ?? undefined,
      },
      seller: {
        name:
          formData?.sellerName ??
          `${contractData.seller?.firstName ?? ""} ${contractData.seller?.lastName ?? ""}`.trim(),
        nif: formData?.sellerNif ?? contractData.seller?.nif ?? "",
        address:
          formData?.sellerAddress ??
          [
            contractData.seller?.address,
            contractData.seller?.postalCode,
            contractData.seller?.city,
          ]
            .filter(Boolean)
            .join(", "),
        phone: formData?.sellerPhone ?? contractData.seller?.phone ?? undefined,
        email: formData?.sellerEmail ?? contractData.seller?.email ?? undefined,
      },
      buyer: {
        name:
          formData?.buyerName ??
          `${contractData.buyer.firstName} ${contractData.buyer.lastName ?? ""}`.trim(),
        nif: formData?.buyerNif ?? contractData.buyer.nif ?? "",
        address:
          formData?.buyerAddress ??
          [
            contractData.buyer.address,
            contractData.buyer.postalCode,
            contractData.buyer.city,
          ]
            .filter(Boolean)
            .join(", "),
        phone: formData?.buyerPhone ?? contractData.buyer.phone ?? undefined,
        email: formData?.buyerEmail ?? contractData.buyer.email ?? undefined,
      },
      property: {
        propertyId: contractData.property.propertyId,
        referenceNumber: contractData.property.referenceNumber ?? "",
        fullAddress,
        cadastralReference: contractData.property.cadastralReference ?? undefined,
        surfaceArea: contractData.property.builtSurfaceArea ?? contractData.property.squareMeters?.toString(),
        propertyType: contractData.property.propertyType ?? undefined,
      },
      signatures: {
        sellerSignatureUrl: signatures.sellerSignatureUrl ?? undefined,
        buyerSignatureUrl: signatures.buyerSignatureUrl ?? undefined,
      },
      branding: {
        logoUrl: brandLogoUrl ?? undefined,
        agentName: brandingAgentName ?? undefined,
        collegiateNumber: collegiateNumber ?? undefined,
        accountType: accountType ?? undefined,
        accountName: accountName ?? undefined,
        taxId: taxId ?? undefined,
        offices,
        website: website ?? undefined,
        email: email ?? undefined,
      },
      location,
      date,
      gdprConsent: formData?.gdprConsent ?? false,
    };

    return { success: true, data: documentData };
  } catch (error) {
    console.error("Error fetching arras document data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch arras document data",
    };
  }
}

/**
 * Create ToriPark rental contract - simplified version without signatures
 */
export async function createToriParkRentalContractAction(
  formData: Omit<ArrasContractFormData, "sellerSignature" | "buyerSignature">,
): Promise<{
  success: boolean;
  dealId?: bigint;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }
    const { db: secureDb } = await getSecureDb();

    // Validate required fields (no signatures required for ToriPark)
    if (!formData.sellerNif || !formData.buyerNif) {
      throw new Error("NIF/DNI is required for both parties");
    }

    if (!formData.sellerAddress || !formData.buyerAddress) {
      throw new Error("Address is required for both parties");
    }

    // Get the deal data for reference number
    const dealData = await getArrasContractData(Number(formData.dealId));
    if (!dealData) {
      throw new Error("Deal not found or access denied");
    }

    console.log(`📂 Creating ToriPark rental contract for deal ${formData.dealId}`);

    // Update deal with rental information (no signatures to upload)
    await secureDb
      .update(deals)
      .set({
        arrasAmount: formData.arrasAmount.toString(),
        arrasType: formData.arrasType,
        arrasSigningDate: formData.signingDate,
        expectedDeedDate: formData.deedDeadline,
        specialConditions: formData.specialConditions ?? null,
        finalPrice: formData.totalPrice.toString(),
        updatedAt: new Date(),
      })
      .where(eq(deals.dealId, formData.dealId));

    console.log(`✅ Deal ${formData.dealId} updated with rental information`);

    // Log the activity
    try {
      await logArrasSigned({
        listingId: dealData.listing.listingId,
        userId: currentUser.id,
        dealId: formData.dealId,
      });
      console.log("📝 Logged rental contract activity");
    } catch (logError) {
      console.error("⚠️ Failed to log rental contract activity:", logError);
    }

    return {
      success: true,
      dealId: formData.dealId,
    };
  } catch (error) {
    console.error("Error creating ToriPark rental contract:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create rental contract",
    };
  }
}

/**
 * Check if arras contract already exists for a deal
 */
export async function checkExistingArrasContractAction(
  dealId: number,
): Promise<{
  success: boolean;
  exists: boolean;
  contract?: { docId: bigint; filename: string; fileUrl: string; createdAt: Date };
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const contract = await checkExistingArrasContract(dealId);

    return {
      success: true,
      exists: !!contract,
      contract: contract ?? undefined,
    };
  } catch (error) {
    console.error("Error checking existing arras contract:", error);
    return {
      success: false,
      exists: false,
      error:
        error instanceof Error ? error.message : "Failed to check contract status",
    };
  }
}

/**
 * Get deal ID by listing and listing contact for navigation
 */
export async function getDealIdAction(
  listingId: number,
  listingContactId: number,
): Promise<{
  success: boolean;
  dealId?: string;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    const { getDealByListingAndListingContactId } = await import(
      "~/server/queries/arras"
    );
    const deal = await getDealByListingAndListingContactId(
      listingId,
      listingContactId,
    );

    if (!deal) {
      return {
        success: false,
        error: "No se encontró un deal para este contacto. Asegúrate de que la oferta haya sido aceptada.",
      };
    }

    return {
      success: true,
      dealId: deal.dealId.toString(),
    };
  } catch (error) {
    console.error("Error getting deal ID:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get deal ID",
    };
  }
}

/**
 * Update contact fields from arras contract form
 * Used to save newly filled or modified contact data back to the contacts table
 */
export async function updateContactFieldsFromArrasAction(input: {
  updates: Array<{
    contactId: string;
    fields: Partial<{
      nif: string;
      address: string;
      phone: string;
      email: string;
    }>;
  }>;
}): Promise<{
  success: boolean;
  updatedCount: number;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    let updatedCount = 0;

    for (const update of input.updates) {
      if (Object.keys(update.fields).length === 0) {
        continue;
      }

      try {
        await updateContactWithAuth(Number(update.contactId), update.fields);
        updatedCount++;
      } catch (updateError) {
        console.error(`Failed to update contact ${update.contactId}:`, updateError);
      }
    }

    return {
      success: true,
      updatedCount,
    };
  } catch (error) {
    console.error("Error updating contact fields from arras:", error);
    return {
      success: false,
      updatedCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update contact fields",
    };
  }
}
