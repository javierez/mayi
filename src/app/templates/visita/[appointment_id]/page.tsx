"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { VisitDocument } from "~/components/documents/visit-document";
import { getVisitDocumentDataAction } from "~/server/actions/visits";
import type { VisitDocumentData } from "~/types/visits";

export default function VisitTemplatePage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const appointment_id = params?.appointment_id as string | undefined;
  const [data, setData] = useState<VisitDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      // Mode 1: Data from query params (for PDF generation, no auth needed)
      const dataParam = searchParams.get("data");
      if (dataParam) {
        try {
          const parsedData = JSON.parse(dataParam) as VisitDocumentData & {
            appointment: { datetimeStart: string; datetimeEnd: string };
          };
          // Convert ISO date strings back to Date objects
          const dataWithDates: VisitDocumentData = {
            ...parsedData,
            appointment: {
              ...parsedData.appointment,
              datetimeStart: new Date(parsedData.appointment.datetimeStart),
              datetimeEnd: new Date(parsedData.appointment.datetimeEnd),
            },
          };
          setData(dataWithDates);
          setLoading(false);
          return;
        } catch (err) {
          console.error("Failed to parse visit data:", err);
          setError("Error al parsear los datos de la visita");
          setLoading(false);
          return;
        }
      }

      // Mode 2: Fetch by appointment_id (for preview, requires auth)
      if (appointment_id) {
        const appointmentId = parseInt(appointment_id);
        if (isNaN(appointmentId)) {
          setError("ID de cita no válido");
          setLoading(false);
          return;
        }

        try {
          const result = await getVisitDocumentDataAction(BigInt(appointmentId));
          if (result.success && result.data) {
            setData(result.data);
          } else {
            setError(result.error ?? "No se pudo cargar la información de la visita");
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
  }, [searchParams, appointment_id]);

  // Signal that template is ready (for Puppeteer if needed)
  useEffect(() => {
    if (data) {
      (window as unknown as Record<string, unknown>).visitDocumentReady = true;
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

          .visit-document {
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

          .signature-section {
            page-break-inside: avoid !important;
            /* Try to keep signatures on same page, but allow break if needed */
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

          .visit-document {
            width: 210mm;
            min-width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15),
              0 2px 4px rgba(0, 0, 0, 0.1);
            margin: 2rem auto;
            transform-origin: top center;
            border: 1px solid rgba(0, 0, 0, 0.1);
            position: relative;
            /* Create visual page effect with borders and page dividers */
            background-image: 
              /* Page dividers - horizontal lines every 297mm */
              repeating-linear-gradient(
                to bottom,
                transparent,
                transparent calc(297mm - 2px),
                rgba(0, 0, 0, 0.08) calc(297mm - 2px),
                rgba(0, 0, 0, 0.08) 297mm
              ),
              /* Grid pattern */
              linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
            background-size: 
              100% 297mm,
              20mm 20mm,
              20mm 20mm;
          }

          .visit-document::before {
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

          /* Scale handled by JavaScript for better mobile support */
          @media (max-width: 768px) {
            .document-viewer-container {
              padding: 0.5rem;
            }
          }

          /* Tablet: slightly scaled */
          @media (min-width: 769px) and (max-width: 1024px) {
            .visit-document {
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
          <VisitDocument data={data} />
        </div>
      </div>
    </div>
  );
}

