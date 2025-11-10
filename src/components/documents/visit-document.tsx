"use client";

import React, { useState, useEffect } from "react";
import { getBrandAsset } from "~/app/actions/brand-upload";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";
import { useSession } from "~/lib/auth-client";
import type { VisitDocumentData } from "~/types/visits";

interface Props {
  data: VisitDocumentData;
}

export function VisitDocument({ data }: Props) {
  // Initialize state from props if branding data is available (PDF mode)
  const [brandLogo, setBrandLogo] = useState<string | null>(
    data.branding?.logoUrl ?? null,
  );
  const [agentName, setAgentName] = useState<string>(
    data.branding?.agentName ??
      data.appointment.agentName ??
      (data.appointment.agentFirstName || data.appointment.agentLastName
        ? `${data.appointment.agentFirstName ?? ""} ${data.appointment.agentLastName ?? ""}`.trim()
        : "Agente"),
  );
  const [collegiateNumber, setCollegiateNumber] = useState<string>(
    data.branding?.collegiateNumber ?? "",
  );
  const [accountType, setAccountType] = useState<string | null>(
    data.branding?.accountType ?? null,
  );
  const [taxId, setTaxId] = useState<string>(data.branding?.taxId ?? "");
  const [offices, setOffices] = useState<
    Array<{ address: string; city: string; postalCode: string; phone: string }>
  >(data.branding?.offices ?? []);
  const [website, setWebsite] = useState<string>(
    data.branding?.website ?? "",
  );
  const { data: session } = useSession();

  useEffect(() => {
    // Skip client-side fetch if branding is provided in props (PDF mode)
    if (data.branding?.logoUrl) {
      console.log("Using branding from props (PDF mode)");
      return;
    }

    // Client-side fetch for preview mode (when branding not in props)
    const fetchBrandData = async () => {
      try {
        if (session?.user?.id) {
          console.log("Fetching branding client-side (preview mode)");
          const userAccountId = await getCurrentUserAccountIdAction();

          if (userAccountId) {
            const accountIdStr = userAccountId.toString();
            const brandAsset = await getBrandAsset(accountIdStr);

            // Use transparent logo if available, otherwise fall back to original logo
            if (brandAsset?.logoTransparentUrl && brandAsset.logoTransparentUrl.trim() !== "") {
              setBrandLogo(brandAsset.logoTransparentUrl);
            } else if (brandAsset?.logoOriginalUrl && brandAsset.logoOriginalUrl.trim() !== "") {
              setBrandLogo(brandAsset.logoOriginalUrl);
            }

            const agentNameResult = await getAgentNameAction(
              BigInt(userAccountId),
            );

            if (agentNameResult.success) {
              // Only update agentName if account type is "person"
              // For company accounts, keep the agent name from appointment data
              if (
                agentNameResult.accountType === "person" &&
                agentNameResult.agentName
              ) {
                setAgentName(agentNameResult.agentName);
              }

              if (agentNameResult.accountType) {
                setAccountType(agentNameResult.accountType);
              }

              if (agentNameResult.collegiateNumber) {
                setCollegiateNumber(agentNameResult.collegiateNumber);
              }

              if (agentNameResult.taxId) {
                setTaxId(agentNameResult.taxId);
              }

              if (agentNameResult.website) {
                setWebsite(agentNameResult.website);
              }
            }

            const officeInfoResult = await getOfficeInfoAction(
              BigInt(userAccountId),
            );

            if (officeInfoResult.success && officeInfoResult.offices) {
              setOffices(officeInfoResult.offices);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching brand data:", error);
      }
    };

    void fetchBrandData();
  }, [session?.user?.id, data.branding]);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <>
      <style jsx>{`
        /* Print-specific styles for page break handling */
        @media print {
          .visit-document {
            /* Allow natural text flow, prevent only bad orphans/widows */
            orphans: 2;
            widows: 2;
          }

          /* Prevent only section headers from being orphaned at bottom of page */
          .section-header {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 1em;
          }

          /* Add spacing at top of pages for continuation content */
          .visit-document > * {
            margin-top: 0;
          }

          /* Ensure proper spacing after page breaks */
          * {
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
          }
        }

        /* Add visual margin at page breaks for multi-page documents */
        @page {
          margin: 0;
        }
      `}</style>

      <div className="bg-white font-sans text-black print:m-0 print:h-[297mm] print:w-[210mm] print:p-0 print:text-[11pt] print:leading-[1.4]">
        <div className="visit-document mx-auto min-h-[1123px] max-w-[794px] px-10 py-8 font-sans text-[11pt] leading-[1.4] print:mx-0 print:min-h-0 print:max-w-none print:px-10 print:py-6">
        {/* Header Section */}
        <div className="mb-6 print:mb-2">
          {/* Logo and Services Section */}
          <div className="mb-4 flex items-center justify-between gap-8 pb-3 print:mb-3 print:pb-2">
            {/* Logo */}
            {brandLogo && (
              <div className="flex flex-shrink-0 items-center justify-center p-2 print:p-0">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandLogo}
                    alt="Logo de la agencia"
                    className="h-20 w-auto"
                    style={{ width: "auto", height: "80px" }}
                  />
                </div>
              </div>
            )}

            {/* Services */}
            <div className="flex-1 space-y-0.5 text-center text-[8pt] leading-tight text-gray-600">
              <div className="flex flex-wrap justify-center gap-x-1.5">
                <span>Compra</span>
                <span className="text-gray-400">•</span>
                <span>Venta</span>
                <span className="text-gray-400">•</span>
                <span>Alquiler</span>
                <span className="text-gray-400">•</span>
                <span>Permutas</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-1.5">
                <span>Pisos</span>
                <span className="text-gray-400">•</span>
                <span>Chalets</span>
                <span className="text-gray-400">•</span>
                <span>Garajes</span>
                <span className="text-gray-400">•</span>
                <span>Locales</span>
                <span className="text-gray-400">•</span>
                <span>Terrenos y solares</span>
              </div>
              <div>Valoraciones y tasaciones</div>
              {(website ?? taxId ?? (collegiateNumber && accountType !== "company")) && (
                <div className="mt-1 flex flex-col items-center pt-1">
                  <div className="w-2/3 border-t border-gray-300"></div>
                  <div className="mt-1 flex flex-wrap justify-center gap-x-1.5 text-[7pt]">
                    {website && (
                      <span className="font-medium text-blue-600">{website}</span>
                    )}
                    {website && taxId && (
                      <span className="text-gray-400">•</span>
                    )}
                    {taxId && (
                      <span className="text-gray-600">
                        {accountType === "company" ? "C.I.F" : "N.I.F"}: {taxId}
                      </span>
                    )}
                    {(website ?? taxId) && collegiateNumber && accountType !== "company" && (
                      <span className="text-gray-400">•</span>
                    )}
                    {collegiateNumber && accountType !== "company" && (
                      <span className="text-gray-600">
                        Nº Colegiado: {collegiateNumber}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Offices Section */}
          {offices.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 print:mb-3 print:p-2">
              <div className="mb-3 text-[11pt] font-semibold text-gray-800">
                OFICINAS
              </div>
              <div className="space-y-1">
                {offices.map((office, index) => (
                  <div key={index} className="text-[10pt] text-gray-700">
                    {office.address}, {office.postalCode} {office.city}{" "}
                    <span className="font-medium">(Tel: {office.phone})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spacer before title */}
        <div className="h-8 print:h-6"></div>

        {/* Document Title */}
        <div className="mb-4 text-center print:mb-3">
          <div className="text-[16pt] font-bold">CONTROL DE VISITAS</div>
        </div>

        {/* Visit Details Section */}
        <div className="property-details page-section my-4">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {/* Visitante */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">Visitante</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.contactFirstName}{" "}
                  {data.appointment.contactLastName}
                </div>
              </div>

              {/* NIF */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">NIF</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.contactNif ?? "—"}
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">Teléfono</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.contactPhone ?? "—"}
                </div>
              </div>

              {/* Oferta */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">Oferta</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.offer
                    ? `${new Intl.NumberFormat("es-ES").format(data.appointment.offer)} €`
                    : "—"}
                </div>
              </div>

              {/* Agente */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">Agente</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.agentName ??
                    `${data.appointment.agentFirstName ?? ""} ${data.appointment.agentLastName ?? ""}`.trim()}
                </div>
              </div>

              {/* Fecha y Hora */}
              <div>
                <div className="text-[9pt] font-medium text-gray-600">Fecha y Hora</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {formatDateTime(data.appointment.datetimeStart)}
                </div>
              </div>

              {/* Propiedad - Full width */}
              <div className="col-span-2 border-t border-gray-300 pt-2 mt-1">
                <div className="text-[9pt] font-medium text-gray-600">Propiedad</div>
                <div className="mt-0.5 text-[11pt] font-medium">
                  {data.appointment.propertyStreet ?? "No especificada"}
                  {data.appointment.propertyAddressDetails &&
                    ` - ${data.appointment.propertyAddressDetails}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visit Description */}
        <div className="mb-4 mt-8 text-justify print:mb-4 print:mt-6">
          <p className="leading-relaxed">
            El inmueble arriba indicado ha sido visitado por el cliente en el
            día de hoy en compañía de{" "}
            <strong>
              {data.appointment.agentName ??
                `${data.appointment.agentFirstName ?? ""} ${data.appointment.agentLastName ?? ""}`.trim()}
            </strong>
            , en representación de la agencia de la propiedad inmobiliaria.
          </p>
        </div>

        {/* Notes Section */}
        {data.appointment.notes && (
          <div className="notes-section my-4">
            <div className="section-header mb-2 border-b border-gray-300 pb-1 text-[11pt] font-bold">
              OBSERVACIONES:
            </div>
            <div className="min-h-[60px] border-b border-black pb-2 text-justify leading-relaxed">
              {data.appointment.notes}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="signatures-section mt-4 mb-2 print:mt-3 print:mb-2">
          <div className="mb-6 text-justify leading-relaxed print:mb-5">
            Y para que conste y surta efecto, se firma en{" "}
            <strong>{data.location}</strong>, a <strong>{data.date}</strong>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-8 print:mt-3 print:gap-6">
            {/* Agent Signature */}
            <div className="flex flex-col">
              <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 print:p-3">
                {/* Timestamp - top right */}
                <div className="absolute right-2 top-2 text-[6pt] text-gray-400 print:right-1 print:top-1">
                  {new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date())}
                </div>
                {data.signatures.agentSignatureUrl ? (
                  <div className="mb-4 flex h-28 items-center justify-center print:mb-4 print:h-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.signatures.agentSignatureUrl}
                      alt="Firma del Agente"
                      className="max-h-28 max-w-full object-contain print:max-h-24"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                ) : (
                  <div className="mb-4 h-28 border-b border-gray-400 print:mb-4 print:h-24"></div>
                )}
                <div className="-mt-[6px] print:mt-[-4px]">
                  <div className="text-[10pt] font-semibold text-gray-900">
                    {agentName}
                  </div>
                </div>
              </div>
            </div>

            {/* Visitor Signature */}
            <div className="flex flex-col">
              <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-4 print:p-3">
                {/* Timestamp - top right */}
                <div className="absolute right-2 top-2 text-[6pt] text-gray-400 print:right-1 print:top-1">
                  {new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date())}
                </div>
                {data.signatures.visitorSignatureUrl ? (
                  <div className="mb-4 flex h-28 items-center justify-center print:mb-4 print:h-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.signatures.visitorSignatureUrl}
                      alt="Firma del Visitante"
                      className="max-h-28 max-w-full object-contain print:max-h-24"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                ) : (
                  <div className="mb-4 h-28 border-b border-gray-400 print:mb-4 print:h-24"></div>
                )}
                <div className="-mt-[6px] print:mt-[-4px]">
                  <div className="text-[10pt] font-semibold text-gray-900">
                    {data.appointment.contactFirstName}{" "}
                    {data.appointment.contactLastName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer - ensures proper spacing between signatures and disclaimer */}
        <div className="h-6 print:h-6"></div>

        {/* Disclaimer */}
        <div className="mt-0 mb-3 print:mt-0 print:mb-2">
          <p className="text-[8pt] leading-snug text-gray-600">
            Con la firma de este documento ambas partes reconocen la mediación
            de la Agencia de la Propiedad Inmobiliaria y subsistirá el derecho
            a sus honorarios, aunque el contrato de Compra-Venta o Alquiler sea
            perfeccionado por las mismas, sin intervención de Agencia.
          </p>
        </div>

        {/* GDPR Consent Section - Moved to end */}
        <div className="gdpr-section page-section mt-3 mb-3 print:mt-2 print:mb-2">
          <div className="mb-2 text-[9pt] font-medium italic text-gray-600">
            Protección de Datos
          </div>
          <div className="space-y-2 text-justify text-[8pt] leading-snug text-gray-700">
            <p>
              De conformidad con lo establecido en el REGLAMENTO (UE) 2016/679
              de protección de datos de carácter personal, le informamos que
              los datos que usted nos facilite serán incorporados al sistema de
              tratamiento titularidad de su agencia inmobiliaria. Los datos
              proporcionados se conservarán mientras se mantenga la relación
              comercial durante los años necesarios para cumplir con las
              obligaciones legales. Los datos no se cederán a terceros, salvo en
              los casos que exista una obligación legal. Usted tiene derecho a
              obtener confirmación sobre si estamos tratando sus datos
              personales, por tanto tiene derecho a acceder a sus datos
              personales, rectificar los datos inexactos o solicitar su
              supresión cuando los datos no sean necesarios.
            </p>

            <p className="pt-1 text-[8pt] text-gray-800">
              Así mismo solicito su autorización para ofrecerle productos y
              servicios relacionados con los solicitados y fidelizarle como
              cliente:{" "}
              <span className="font-bold">
                {data.marketingConsent ? "[SÍ]" : "[NO]"}
              </span>
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

