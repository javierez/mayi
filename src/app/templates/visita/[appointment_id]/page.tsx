"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getVisitDocumentDataAction } from "~/server/actions/visits";
import { VisitDocument } from "~/components/documents/visit-document";

interface VisitDocumentData {
  appointment: {
    appointmentId: bigint;
    contactFirstName: string;
    contactLastName: string;
    contactNif?: string | null;
    propertyStreet?: string | null;
    propertyAddressDetails?: string | null;
    agentName?: string | null;
    agentFirstName?: string | null;
    agentLastName?: string | null;
    datetimeStart: Date;
    datetimeEnd: Date;
    notes?: string | null;
  };
  signatures: {
    agentSignatureUrl?: string | null;
    visitorSignatureUrl?: string | null;
  };
  location: string;
  date: string;
  marketingConsent?: boolean;
}

export default function VisitTemplatePage() {
  const params = useParams();
  const appointment_id = params?.appointment_id as string;
  const [data, setData] = useState<VisitDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!appointment_id) {
        setError("ID de cita no válido");
        setLoading(false);
        return;
      }

      const appointmentId = parseInt(appointment_id);
      if (isNaN(appointmentId)) {
        setError("ID de cita no válido");
        setLoading(false);
        return;
      }

      try {
        const result = await getVisitDocumentDataAction(BigInt(appointmentId));
        if (result.success && result.data) {
          // Convert date strings back to Date objects
          const dataWithDates = {
            ...result.data,
            appointment: {
              ...result.data.appointment,
              datetimeStart: new Date(result.data.appointment.datetimeStart),
              datetimeEnd: new Date(result.data.appointment.datetimeEnd),
            },
          };
          setData(dataWithDates);
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
    };

    void fetchData();
  }, [appointment_id]);

  // Signal that template is ready (for Puppeteer if needed)
  useEffect(() => {
    if (data) {
      (window as unknown as Record<string, unknown>).visitDocumentReady = true;
    }
  }, [data]);

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
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .visit-document {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-sizing: border-box !important;
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

      <VisitDocument data={data} />
    </div>
  );
}

