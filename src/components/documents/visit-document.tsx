"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getBrandAsset } from "~/app/actions/brand-upload";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";
import { useSession } from "~/lib/auth-client";

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

interface Props {
  data: VisitDocumentData;
}

export function VisitDocument({ data }: Props) {
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>(
    data.appointment.agentName ??
      (data.appointment.agentFirstName || data.appointment.agentLastName
        ? `${data.appointment.agentFirstName ?? ""} ${data.appointment.agentLastName ?? ""}`.trim()
        : "Agente"),
  );
  const [collegiateNumber, setCollegiateNumber] = useState<string>("");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [taxId, setTaxId] = useState<string>("");
  const [offices, setOffices] = useState<
    Array<{ address: string; city: string; postalCode: string; phone: string }>
  >([]);
  const [website, setWebsite] = useState<string>("");
  const { data: session } = useSession();

  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        if (session?.user?.id) {
          const userAccountId = await getCurrentUserAccountIdAction();

          if (userAccountId) {
            const accountIdStr = userAccountId.toString();
            const brandAsset = await getBrandAsset(accountIdStr);

            // Use transparent logo if available, otherwise fall back to original logo
            if (brandAsset?.logoTransparentUrl) {
              setBrandLogo(brandAsset.logoTransparentUrl);
            } else if (brandAsset?.logoOriginalUrl) {
              setBrandLogo(brandAsset.logoOriginalUrl);
            }

            const agentNameResult = await getAgentNameAction(
              BigInt(userAccountId),
            );

            if (agentNameResult.success && agentNameResult.agentName) {
              setAgentName(agentNameResult.agentName);

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
  }, [session?.user?.id]);

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
    <div className="bg-white font-sans text-black print:m-0 print:h-[297mm] print:w-[210mm] print:p-0 print:text-[11pt] print:leading-[1.4]">
      <div className="visit-document mx-auto min-h-[1123px] max-w-[794px] px-10 py-8 font-sans text-[11pt] leading-[1.4] print:mx-0 print:min-h-0 print:max-w-none print:px-[10mm] print:pb-[10mm] print:pt-[2mm]">
        {/* Header Section */}
        <div className="mb-6 text-center print:mb-2">
          {/* Logo Section */}
          <div className="mb-6 flex items-center justify-center gap-6 p-2 print:mb-2 print:p-0">
            {brandLogo && (
              <div className="flex-shrink-0">
                <Image
                  src={brandLogo}
                  alt="Logo de la agencia"
                  width={80}
                  height={80}
                  className="h-20 w-auto drop-shadow-sm"
                />
              </div>
            )}
            <div className="flex-shrink-0">
              <Image
                src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/logo_api.png"
                alt="API Logo"
                width={48}
                height={48}
                className="h-12 w-auto drop-shadow-sm"
              />
            </div>
          </div>

          {/* Agency Title */}
          <div className="mb-4 border-b border-gray-200 pb-3 print:mb-3 print:pb-2">
            <div className="mb-3 text-[16pt] font-bold tracking-wide text-gray-800">
              AGENCIA DE LA PROPIEDAD INMOBILIARIA
            </div>
            <div className="mb-2 text-[13pt] font-semibold text-gray-700">
              {agentName}
            </div>
            {collegiateNumber && accountType !== "company" && (
              <div className="mb-1 text-[11pt] text-gray-600">
                Nº Colegiado: {collegiateNumber}
              </div>
            )}
            {taxId && (
              <div className="text-[11pt] text-gray-600">
                {accountType === "company" ? "C.I.F" : "N.I.F"}: {taxId}
              </div>
            )}
          </div>

          {/* Services Section */}
          <div className="mb-4 print:mb-3">
            <div className="space-y-1 text-[10pt] leading-relaxed text-gray-600">
              <div>Compra • Venta • Alquiler • Permutas</div>
              <div>
                Pisos • Chalets • Garajes • Locales • Terrenos y solares
              </div>
              <div>Valoraciones y tasaciones</div>
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

          {/* Website */}
          {website && (
            <div className="text-[11pt] font-medium text-blue-700">{website}</div>
          )}
        </div>

        <div className="my-4 border-t-2 border-black print:my-3"></div>

        {/* Document Title */}
        <div className="my-6 border-y-2 border-gray-300 py-2 text-center print:my-4 print:py-1">
          <div className="mb-2 text-[16pt] font-bold">CONTROL DE VISITAS</div>
          <div className="text-[12pt] font-medium">
            Registro de Visita a Propiedad
          </div>
        </div>

        <div className="my-4 border-t-2 border-black print:my-3"></div>

        {/* Visit Details Section */}
        <div className="my-6">
          <div className="mb-4 border-b border-gray-300 pb-2 text-[13pt] font-bold">
            DATOS DE LA VISITA:
          </div>

          <div className="space-y-3">
            <div className="flex">
              <span className="min-w-[140px] font-bold">Visitante:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.appointment.contactFirstName}{" "}
                {data.appointment.contactLastName}
              </span>
            </div>

            {data.appointment.contactNif && (
              <div className="flex">
                <span className="min-w-[140px] font-bold">D.N.I. / N.I.F.:</span>
                <span className="ml-2 flex-1 border-b border-black pb-0.5">
                  {data.appointment.contactNif}
                </span>
              </div>
            )}

            <div className="flex">
              <span className="min-w-[140px] font-bold">Agente:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.appointment.agentName ??
                  `${data.appointment.agentFirstName ?? ""} ${data.appointment.agentLastName ?? ""}`.trim()}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Propiedad:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.appointment.propertyStreet ?? "No especificada"}
                {data.appointment.propertyAddressDetails &&
                  ` - ${data.appointment.propertyAddressDetails}`}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Fecha y Hora:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {formatDateTime(data.appointment.datetimeStart)}
              </span>
            </div>
          </div>
        </div>

        <div className="my-8 border-t border-dashed border-black"></div>

        {/* Visit Description */}
        <div className="my-6 text-justify">
          <p className="mb-4 leading-relaxed">
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
          <div className="my-6">
            <div className="mb-3 border-b border-gray-300 pb-2 text-[13pt] font-bold">
              OBSERVACIONES:
            </div>
            <div className="min-h-[80px] border-b border-black pb-2 text-justify leading-relaxed">
              {data.appointment.notes}
            </div>
          </div>
        )}

        {/* GDPR Consent Section */}
        <div className="my-6">
          <div className="mb-3 border-b border-gray-300 pb-2 text-[13pt] font-bold">
            PROTECCIÓN DE DATOS:
          </div>
          <div className="space-y-3 text-justify text-xs leading-relaxed text-gray-700 sm:text-sm">
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

            <div className="space-y-2 pt-2">
              <p className="text-sm text-gray-800">
                Así mismo solicito su autorización para ofrecerle productos y
                servicios relacionados con los solicitados y fidelizarle como
                cliente:
              </p>
              <div className="flex items-center gap-4">
                <span className="font-bold">
                  {data.marketingConsent ? "[SÍ]" : "[NO]"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="my-6 rounded-md bg-amber-50 p-4 print:bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">NOTA:</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800">
            Con la firma de este documento ambas partes reconocen la mediación
            de la Agencia de la Propiedad Inmobiliaria y subsistirá el derecho
            a sus honorarios, aunque el contrato de Compra-Venta o Alquiler sea
            perfeccionado por las mismas, sin intervención de Agencia.
          </p>
        </div>

        {/* Signature Section */}
        <div className="mt-16 border-t border-gray-300 pt-6">
          <div className="mb-12 text-center font-medium">
            Y para que conste y surta efecto, se firma en{" "}
            <strong>{data.location}</strong>, a <strong>{data.date}</strong>
          </div>

          <div className="mt-16 flex justify-between px-8">
            {/* Agent Signature */}
            <div className="w-56 text-center">
              <div className="mb-4 text-[12pt] font-bold">
                {accountType === "company" ? agentName : `D/ª ${agentName}`}
                <br />
                <span className="text-sm font-normal">(Agente)</span>
              </div>
              {data.signatures.agentSignatureUrl ? (
                <div className="mb-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.signatures.agentSignatureUrl}
                    alt="Firma del Agente"
                    className="max-h-20 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="mb-2 h-20 border-b-2 border-black"></div>
              )}
              <div className="text-sm text-gray-600">Firma</div>
            </div>

            {/* Visitor Signature */}
            <div className="w-56 text-center">
              <div className="mb-4 text-[12pt] font-bold">
                {data.appointment.contactFirstName}{" "}
                {data.appointment.contactLastName}
                <br />
                <span className="text-sm font-normal">(Visitante)</span>
              </div>
              {data.signatures.visitorSignatureUrl ? (
                <div className="mb-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.signatures.visitorSignatureUrl}
                    alt="Firma del Visitante"
                    className="max-h-20 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="mb-2 h-20 border-b-2 border-black"></div>
              )}
              <div className="text-sm text-gray-600">Firma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

