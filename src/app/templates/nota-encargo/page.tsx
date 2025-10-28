"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { NotaEncargoDocument } from "~/components/documents/nota-encargo-document";

interface NotaEncargoData {
  documentNumber: string;
  agency: {
    agentName: string;
    collegiateNumber: string;
    agentNIF: string;
    website: string;
    email: string;
    logo?: string;
    offices: Array<{
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    }>;
  };
  client: {
    fullName: string;
    nif: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  property: {
    description: string;
    allowSignage: string;
    energyCertificate: string;
    keyDelivery: string;
    allowVisits: string;
  };
  operation: {
    type: string;
    price: string;
  };
  commission: {
    percentage: number;
    minimum: string;
  };
  duration: {
    months: number;
  };
  signatures: {
    location: string;
    date: string;
  };
  jurisdiction: {
    city: string;
  };
  observations: string;
  hasOtherAgency?: boolean;
  gdprConsent?: boolean;
}

export default function NotaEncargoTemplate() {
  const searchParams = useSearchParams();

  // Get data from URL parameters
  const dataParam = searchParams.get("data");
  let data: NotaEncargoData | null = null;

  try {
    data = dataParam ? (JSON.parse(dataParam) as NotaEncargoData) : null;
  } catch (error) {
    console.error("Failed to parse nota encargo data:", error);
  }

  // Signal to Puppeteer that the template is ready - always call hooks before early returns
  useEffect(() => {
    if (data) {
      // Set a flag that Puppeteer can check
      (window as unknown as Record<string, unknown>).notaEncargoReady = true;
      console.log("Nota encargo template ready signal set");
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">No data provided</div>
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

          .nota-encargo-document {
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

      <NotaEncargoDocument data={data} />
    </div>
  );
}
