/**
 * Sanitize a string for use in filenames
 * Removes special characters and replaces spaces with hyphens
 */
function sanitizeFilename(text: string): string {
  return text
    .normalize("NFD") // Normalize accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Convert signature data URL to File object for document upload
 * @param signatureDataUrl - Base64 data URL from signature canvas
 * @param signatureType - Type of signature (agent or visitor)
 * @param referenceNumber - Property reference number
 * @param contactFirstName - Contact first name
 * @param contactLastName - Contact last name
 * @param visitDate - Visit date
 * @returns File object ready for document upload
 */
export async function convertSignatureToFile(
  signatureDataUrl: string,
  signatureType: "agent" | "visitor",
  referenceNumber: string,
  contactFirstName: string,
  contactLastName: string,
  visitDate: Date,
): Promise<File> {
  try {
    console.log(`🔄 Converting ${signatureType} signature:`, {
      dataUrlLength: signatureDataUrl.length,
      dataUrlPrefix: signatureDataUrl.substring(0, 50),
      referenceNumber,
    });

    // Validate data URL format
    if (!signatureDataUrl.startsWith("data:image/")) {
      throw new Error(`Invalid signature data URL format for ${signatureType}`);
    }

    // Convert data URL to File object
    const response = await fetch(signatureDataUrl);
    const blob = await response.blob();

    // Generate descriptive filename matching PDF naming convention
    const ref = sanitizeFilename(referenceNumber);
    const firstName = sanitizeFilename(contactFirstName);
    const lastName = sanitizeFilename(contactLastName);
    const dateStr = visitDate.toISOString().split("T")[0];
    const signatureLabel = signatureType === "agent" ? "agente" : "visitante";

    const filename = `firma-${signatureLabel}-${dateStr}-${ref}-${firstName}-${lastName}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    console.log(`✅ ${signatureType} signature converted:`, {
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
