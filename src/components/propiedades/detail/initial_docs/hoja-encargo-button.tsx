"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { FileText } from "lucide-react";
import { TermsModal } from "./terms-modal";
import { getNotaEncargoData } from "~/server/queries/nota-encargo";
import {
  transformToNotaEncargoPDF,
  extractListingIdFromPathname,
} from "~/lib/nota-encargo-helpers";

interface DocumentRecord {
  docId: bigint;
  filename: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  documentKey: string;
}

interface HojaEncargoButtonProps {
  propertyId: bigint;
  onDocumentGenerated?: (documents: DocumentRecord[]) => void;
  className?: string;
}

export function HojaEncargoButton({
  propertyId,
  onDocumentGenerated,
  className,
}: HojaEncargoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("🚀 HojaEncargoButton render - isModalOpen:", isModalOpen);
  console.log("🚀 propertyId:", propertyId);

  const handleCreateHojaEncargo = async (terms: {
    commission: number;
    min_commission: number;
    duration: number;
    exclusivity: boolean;
    communications: boolean;
    allowSignage: boolean;
    allowVisits: boolean;
    allowKeyDelivery: boolean;
    allowPortalPublication: boolean;
  }) => {
    try {
      console.log("🚀 Starting Nota de Encargo generation...");
      console.log("Property ID:", propertyId);
      console.log("Terms:", terms);

      // Extract listing ID from the current URL
      const pathname = window.location.pathname;
      const listingId = extractListingIdFromPathname(pathname);

      if (!listingId) {
        throw new Error(
          "No se pudo obtener el ID de la propiedad desde la URL",
        );
      }

      console.log("📋 Extracted listing ID:", listingId);

      // Fetch nota encargo data
      const rawData = await getNotaEncargoData(listingId);

      if (!rawData) {
        throw new Error("No se pudieron obtener los datos de la propiedad");
      }

      console.log("📊 Raw data fetched:", rawData);

      // Transform data for PDF generation
      const pdfData = transformToNotaEncargoPDF(rawData, terms);

      console.log("📄 PDF data prepared:", pdfData);

      // Generate PDF using existing API
      const response = await fetch("/api/nota-encargo/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: pdfData,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Error al generar el PDF");
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create a File object from the blob for upload
      const filename = `${pdfData.documentNumber}.pdf`;
      const pdfFile = new File([pdfBlob], filename, {
        type: "application/pdf",
      });

      console.log("📤 Uploading PDF to document management system...");

      // Upload to document management system (S3 + Database)
      const uploadResponse = await fetch(
        `/api/properties/${listingId}/documents`,
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();
            formData.append("file", pdfFile);
            formData.append("folderType", "initial-docs");
            return formData;
          })(),
        },
      );

      if (!uploadResponse.ok) {
        throw new Error("Error al guardar el documento en el sistema");
      }

      const uploadedDocument = (await uploadResponse.json()) as {
        docId: string | number;
        filename: string;
        fileType: string;
        fileUrl: string;
        uploadedAt: string;
        documentKey: string;
      };
      console.log("✅ Document uploaded successfully:", uploadedDocument);

      // Convert the response to the expected DocumentRecord format
      const documentRecord: DocumentRecord = {
        docId: BigInt(uploadedDocument.docId),
        filename: uploadedDocument.filename,
        fileType: uploadedDocument.fileType,
        fileUrl: uploadedDocument.fileUrl,
        uploadedAt: new Date(uploadedDocument.uploadedAt),
        documentKey: uploadedDocument.documentKey,
      };

      // Trigger documents list refresh
      onDocumentGenerated?.([documentRecord]);

      // Also provide download option
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(
        "✅ Nota de Encargo PDF generated, uploaded, and downloaded successfully",
      );

      // Show success message
      alert(
        `Hoja de encargo generada y guardada exitosamente para ${pdfData.client.fullName}`,
      );
    } catch (error) {
      console.error("❌ Error generating Nota de Encargo:", error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error al generar la hoja de encargo: ${errorMessage}`);

      throw error; // Re-throw to trigger modal error handling
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex h-[200px] flex-col justify-center rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center transition-colors hover:bg-gray-100/50">
        {/* Beta label */}
        <div className="absolute right-2 top-2 rounded-md bg-gray-200 px-2 py-0.5 font-mono text-xs font-medium tracking-wider text-gray-600">
          BETA
        </div>

        {/* Icon container */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-rose-100">
          <FileText className="h-6 w-6 text-amber-600" />
        </div>

        {/* Text content */}
        <div className="mb-4">
          <p className="mb-4 text-sm text-gray-600">
            Crea la{" "}
            <span className="rounded bg-amber-50 px-1 py-0.5 text-sm font-semibold text-amber-600">
              hoja de encargo
            </span>{" "}
            con toda la información aportada.
          </p>
        </div>

        {/* Button */}
        <button
          disabled
          className={cn(
            "w-full rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500",
            "cursor-not-allowed opacity-60",
          )}
        >
          Generar ahora
        </button>
      </div>

      <TermsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContinue={handleCreateHojaEncargo}
      />
    </div>
  );
}
