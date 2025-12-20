"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { ArrasDocument } from "~/components/documents/arras-document";
import { ToriParkDocument } from "~/components/documents/toripark-document";
import { getArrasDocumentDataAction } from "~/server/actions/arras";
import type { ArrasDocumentData } from "~/types/arras";

// ToriPark account ID for rent contract template
const TORIPARK_ACCOUNT_ID = "1125899906842626";

export default function ArrasTemplatePage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const deal_id = params?.deal_id as string | undefined;
  const [data, setData] = useState<ArrasDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      // Mode 1: Data from query params (for PDF generation, no auth needed)
      const dataParam = searchParams.get("data");
      if (dataParam) {
        try {
          const parsedData = JSON.parse(dataParam) as ArrasDocumentData & {
            deal: {
              signingDate: string;
              deedDeadline: string;
              financingDeadline?: string;
            };
          };
          // Convert ISO date strings back to Date objects
          const dataWithDates: ArrasDocumentData = {
            ...parsedData,
            deal: {
              ...parsedData.deal,
              signingDate: new Date(parsedData.deal.signingDate),
              deedDeadline: new Date(parsedData.deal.deedDeadline),
              financingDeadline: parsedData.deal.financingDeadline
                ? new Date(parsedData.deal.financingDeadline)
                : undefined,
            },
          };
          setData(dataWithDates);
          setLoading(false);
          return;
        } catch (err) {
          console.error("Failed to parse arras data:", err);
          setError("Error al parsear los datos del contrato de arras");
          setLoading(false);
          return;
        }
      }

      // Mode 2: Fetch by deal_id (for preview, requires auth)
      if (deal_id) {
        const dealId = parseInt(deal_id);
        if (isNaN(dealId)) {
          setError("ID de deal no válido");
          setLoading(false);
          return;
        }

        try {
          const result = await getArrasDocumentDataAction(dealId);
          if (result.success && result.data) {
            setData(result.data);
          } else {
            setError(
              result.error ?? "No se pudo cargar la información del contrato",
            );
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Error al cargar los datos",
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      // No data source found
      setError("No se proporcionaron datos");
      setLoading(false);
    };

    void loadData();
  }, [searchParams, deal_id]);

  // Signal that template is ready (for Puppeteer)
  useEffect(() => {
    if (data) {
      (window as unknown as Record<string, unknown>).arrasDocumentReady = true;
    }
  }, [data]);

  // Calculate scale for mobile PDF-like viewing
  useEffect(() => {
    const calculateScale = () => {
      // A4 width at 96dpi = 794px
      const a4Width = 794;
      const viewportWidth = window.innerWidth;
      const padding = 16; // 1rem = 16px
      const availableWidth = viewportWidth - padding;

      // Only scale on mobile/tablet
      if (viewportWidth <= 768) {
        const calculatedScale = availableWidth / a4Width;
        setScale(Math.min(calculatedScale, 1)); // Don't scale up, only down
      } else {
        setScale(1);
      }
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">{error ?? "No data provided"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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

          .document-viewer-container {
            background: white !important;
            padding: 0 !important;
          }

          .arras-document,
          .toripark-document {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            transform: none !important;
            max-width: none !important;
            background: white !important;
            background-image: none !important;
          }

          /* Ensure sections don't break awkwardly */
          .page-section {
            page-break-inside: avoid !important;
          }

          .signature-section {
            page-break-inside: avoid !important;
            orphans: 3;
            widows: 3;
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
          background: #f3f4f6;
        }

        /* Mobile/PDF viewer style */
        @media screen {
          .document-viewer-container {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 1rem;
            background: #f3f4f6;
            overflow-x: auto;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .arras-document {
            width: 210mm;
            min-width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow:
              0 8px 16px rgba(0, 0, 0, 0.15),
              0 2px 4px rgba(0, 0, 0, 0.1);
            margin: 2rem auto;
            transform-origin: top center;
            border: 1px solid rgba(0, 0, 0, 0.1);
            position: relative;
            background-image:
              repeating-linear-gradient(
                to bottom,
                transparent,
                transparent calc(297mm - 2px),
                rgba(0, 0, 0, 0.08) calc(297mm - 2px),
                rgba(0, 0, 0, 0.08) 297mm
              ),
              linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
              linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.03) 1px,
                transparent 1px
              );
            background-size:
              100% 297mm,
              20mm 20mm,
              20mm 20mm;
          }

          .arras-document::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid rgba(0, 0, 0, 0.08);
            pointer-events: none;
            box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.02);
            border-radius: 2px;
          }

          @media (max-width: 768px) {
            .document-viewer-container {
              padding: 0.5rem;
            }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .arras-document {
              transform-origin: top center;
            }
          }
        }
      `}</style>

      <div className="document-viewer-container">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: "fit-content",
            margin: "0 auto",
          }}
        >
          {data.accountId === TORIPARK_ACCOUNT_ID ? (
            <ToriParkDocument data={data} />
          ) : (
            <ArrasDocument data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
