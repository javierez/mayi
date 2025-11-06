import crypto from "crypto";
import { PDFDocument } from "pdf-lib";

/**
 * Calculate SHA-256 hash of a PDF buffer
 * @param pdfBuffer - The PDF file as a Buffer
 * @returns SHA-256 hash as hexadecimal string (64 characters)
 */
export function calculateDocumentHash(pdfBuffer: Buffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(pdfBuffer);
  return hash.digest("hex");
}

/**
 * Embed document hash and timestamp in PDF metadata
 * @param pdfBuffer - The PDF file as a Buffer
 * @param hash - SHA-256 hash of the document
 * @param timestamp - ISO timestamp string
 * @returns Modified PDF buffer with embedded metadata
 */
export async function embedDocumentMetadata(
  pdfBuffer: Buffer,
  hash: string,
  timestamp: string,
): Promise<Buffer> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Set custom metadata properties
    pdfDoc.setTitle("Control de Visitas");
    pdfDoc.setSubject("Documento de Control de Visitas");
    pdfDoc.setCreator("Vesta CRM");
    pdfDoc.setProducer("Vesta CRM - Sistema de Gestión Inmobiliaria");

    // Embed hash and timestamp in custom metadata
    // Using author field as a workaround for custom metadata (more reliable than custom properties)
    const metadataString = `Hash: ${hash}|Timestamp: ${timestamp}`;
    pdfDoc.setAuthor(metadataString);

    // Note: pdf-lib doesn't directly support custom metadata at this time
    // For now, we use the author field as a reliable method to embed metadata
    // The hash and timestamp are also stored in the database for verification

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("Error embedding PDF metadata:", error);
    // If embedding fails, return original buffer
    // Hash and timestamp are still stored in database
    return pdfBuffer;
  }
}

/**
 * Verify document integrity by comparing stored hash with current hash
 * @param pdfBuffer - The PDF file as a Buffer
 * @param storedHash - The hash stored in the database
 * @returns true if hash matches, false otherwise
 */
export function verifyDocumentIntegrity(
  pdfBuffer: Buffer,
  storedHash: string,
): boolean {
  const currentHash = calculateDocumentHash(pdfBuffer);
  return currentHash === storedHash;
}

