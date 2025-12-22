"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NotaEncargoDocument } from "~/components/documents/nota-encargo-document";
import { getHojaEncargoDocumentDataAction } from "~/server/actions/hoja-encargo";
import type { HojaEncargoDocumentData } from "~/types/hoja-encargo";

export default function NotaEncargoTemplate() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<HojaEncargoDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from URL parameters or fetch from server
  const dataParam = searchParams.get("data");
  const listingIdParam = searchParams.get("listingId");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Mode 1: Data passed as URL parameter (for PDF generation via Puppeteer)
        if (dataParam) {
          const parsedData = JSON.parse(dataParam) as HojaEncargoDocumentData;
          setData(parsedData);
          console.log("📄 Loaded hoja encargo data from URL parameter");
          console.log("📝 Template received signature:", {
            agentSignatureUrl: parsedData.signatures?.agentSignatureUrl ?? "MISSING",
            ownerSignatureUrl: parsedData.signatures?.ownerSignatureUrl ?? "MISSING",
          });
        }
        // Mode 2: Fetch from server using listingId (for preview)
        else if (listingIdParam) {
          const result = await getHojaEncargoDocumentDataAction(
            parseInt(listingIdParam),
          );

          if (result.success && result.data) {
            setData(result.data);
            console.log("📄 Loaded hoja encargo data from server");
            console.log("📝 Template received signature (from server):", {
              agentSignatureUrl: result.data.signatures?.agentSignatureUrl ?? "MISSING",
              ownerSignatureUrl: result.data.signatures?.ownerSignatureUrl ?? "MISSING",
            });
          } else {
            setError(result.error ?? "Failed to load data");
          }
        } else {
          setError("No data or listingId provided");
        }
      } catch (err) {
        console.error("Failed to load nota encargo data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [dataParam, listingIdParam]);

  // Signal to Puppeteer that the template is ready
  useEffect(() => {
    if (data && !loading) {
      // Set a flag that Puppeteer can check
      (window as unknown as Record<string, unknown>).notaEncargoReady = true;
      console.log("Nota encargo template ready signal set");
    }
  }, [data, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Cargando documento...</div>
      </div>
    );
  }

  if (error ?? !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">{error ?? "No data provided"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .nota-encargo-document {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-sizing: border-box !important;
            transform: none !important;
            max-width: none !important;
          }

          /* Ensure sections don't break awkwardly */
          .page-section {
            page-break-inside: avoid !important;
          }

          .page-break {
            page-break-before: always !important;
          }

          .no-print {
            display: none !important;
          }
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
        }
      `}</style>

      <NotaEncargoDocument data={data} />
    </div>
  );
}
