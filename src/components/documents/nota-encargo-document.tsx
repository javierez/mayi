"use client";

import React, { useState, useEffect } from "react";
import { getBrandAsset } from "~/app/actions/brand-upload";
import {
  formatPercentageWithText,
  formatCurrencyWithText,
  formatNumberWithText,
} from "~/lib/number-to-spanish";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";
import { useSession } from "~/lib/auth-client";
import type { HojaEncargoDocumentData } from "~/types/hoja-encargo";

interface Props {
  data: HojaEncargoDocumentData;
}

export function NotaEncargoDocument({ data }: Props) {
  // Set ready signal for Puppeteer PDF generation
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (window as any).notaEncargoReady = true;
  }, []);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>(data.agency.agentName);
  const [collegiateNumber, setCollegiateNumber] = useState<string>(
    data.agency.collegiateNumber,
  );
  const [accountType, setAccountType] = useState<string | null>(null);
  const [taxId, setTaxId] = useState<string>(data.agency.agentNIF);
  const [offices, setOffices] = useState<
    Array<{ address: string; city: string; postalCode: string; phone: string }>
  >(data.agency.offices);
  const [website, setWebsite] = useState<string>(data.agency.website);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        if (data.agency?.logo) {
          setBrandLogo(data.agency.logo);
          return;
        }

        if (session?.user?.id) {
          const userAccountId = await getCurrentUserAccountIdAction();

          if (userAccountId) {
            const accountIdStr = userAccountId.toString();
            const brandAsset = await getBrandAsset(accountIdStr);

            if (brandAsset?.logoTransparentUrl && brandAsset.logoTransparentUrl.trim() !== "") {
              setBrandLogo(brandAsset.logoTransparentUrl);
            } else if (brandAsset?.logoOriginalUrl && brandAsset.logoOriginalUrl.trim() !== "") {
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
  }, [session?.user?.id, data.agency.logo]);

  return (
    <>
      <style jsx>{`
        /* Print-specific styles for page break handling */
        @media print {
          .nota-encargo-document {
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
          .nota-encargo-document > * {
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
        <div className="nota-encargo-document mx-auto min-h-[1123px] max-w-[794px] px-10 py-8 font-sans text-[11pt] leading-[1.4] print:mx-0 print:min-h-0 print:max-w-none print:px-10 print:py-6">
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
        <div className="my-6 text-center print:my-4">
          <div className="mb-2 text-[20pt] font-bold">NOTA DE ENCARGO</div>
          <div className="font-mono text-[8pt] uppercase tracking-widest text-gray-500">
            {data.documentNumber}
          </div>
        </div>

        {/* Client Data Section */}
        <div className="my-6">
          <div className="mb-4 border-b border-gray-300 pb-2 text-[13pt] font-bold">
            DATOS DEL CLIENTE Y OPERACIÓN:
          </div>

          <div className="space-y-3">
            <div className="flex">
              <span className="min-w-[140px] font-bold">Nombre Completo:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.fullName}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Vecino/a de:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.city}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Domicilio:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.address}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Distrito Postal:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.postalCode}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">N.I.F.:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.nif}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Teléfono:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.client.phone}
              </span>
            </div>
          </div>
        </div>

        <div className="my-8 border-t border-dashed border-black"></div>

        {/* Power Section */}
        <div className="my-6 text-justify">
          D/ª <strong>{data.client.fullName}</strong>, mayor de edad, que en lo
          sucesivo se denominará &ldquo;EL CLIENTE&rdquo;, cuyas demás
          circunstancias figuran en el encabezamiento, confiere a la AGENTE DE
          LA PROPIEDAD INMOBILIARIA (A.P.I),{" "}
          {accountType === "company" ? "" : "D/ª "}
          <strong>{agentName}</strong>, con{" "}
          {accountType === "company" ? "C.I.F" : "N.I.F"}:{" "}
          <strong>{taxId}</strong>, con domicilio en las direcciones reseñadas,
          ENCARGO DE INTERVENCIÓN, de la operación que a continuación se
          expresa.
        </div>

        {/* Operation Section */}
        <div className="my-6">
          <div className="space-y-3">
            <div className="flex">
              <span className="min-w-[140px] font-bold">Operación:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.operation.type}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">Descripciones:</span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.property.description}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Condiciones / Precio:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.operation.price}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Autorización colocación de cartel:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.terms.allowSignage ? "Sí" : "No"}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Certificación eficiencia energética:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.property.energyCertificate}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Llaves entregadas por propietario/representante:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.property.hasKeys ? "Sí" : "No"}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Autorización entrega de llaves:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.terms.allowKeyDelivery ? "Sí" : "No"}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Autorización para realizar visitas:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.terms.allowVisits ? "Sí" : "No"}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Autorización publicación en portales:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.terms.allowPortalPublication ? "Sí" : "No"}
              </span>
            </div>
          </div>

          <div className="mt-4 border-l-4 border-gray-400 bg-gray-50 p-3 text-justify italic">
            El autorizante permitirá el acceso a la finca al personal de{" "}
            <strong>{agentName}</strong> y a todas las personas que les
            acompañen, con el fin de poder realizar las oportunas visitas a la
            finca objeto de la venta.
          </div>
        </div>

        {/* Clauses Section */}
        <div className="mt-8">
          <div className="mb-6 border-b border-gray-300 pb-2 text-[13pt] font-bold">
            CLÁUSULAS PRINCIPALES:
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">1º - AUTORIZACIÓN AL AGENTE</div>
            <div className="mb-3 text-justify leading-relaxed">
              &ldquo;EL CLIENTE&rdquo;, que actúa como propietario, autoriza de
              manera expresa a {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong>, a percibir cantidades a cuenta,
              sobre el precio de la operación anteriormente reseñada. De igual
              modo también autoriza a firmar contratos de compromiso, con
              posibles demandantes del inmueble descrito.
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              En el caso de que la presente NOTA DE ENCARGO, no la pudiese
              firmar el titular del Inmueble objeto de la operación descrita, la
              persona que firme la presente nota, se hace responsable solidario,
              junto con la persona física o jurídica a la que representa, de las
              obligaciones que para &ldquo;EL CLIENTE&rdquo;, se refleja en este
              contrato.
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">2º - COMISIONES Y PAGOS</div>
            <div className="mb-3 text-justify leading-relaxed">
              <strong>A)</strong> De las cantidades recibidas, sobre el precio
              de la operación, &ldquo;EL CLIENTE&rdquo;, abonará el{" "}
              <strong>{formatPercentageWithText(data.terms.commissionPercentage)} + I.V.A.</strong> con un
              mínimo de <strong>{formatCurrencyWithText(data.terms.minimumCommission)}</strong>, como
              honorarios a {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong>, siendo autorizada expresamente a que
              sean satisfechos reteniéndolos de las cantidades recibidas a
              cuenta del precio en el momento de otorgarse el contrato de
              compraventa.
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              <strong>B)</strong> La cantidad o cantidades recibidas como señal
              a cuenta por la compraventa, quedarán en depósito de{" "}
              {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong> hasta la firma de las Escrituras
              públicas de Compraventa.
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              <strong>C)</strong> En el supuesto de que{" "}
              {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong>, intervenga o redacte contratos de
              compra venta u otra documentación, sobre la compra venta del / los
              inmueble/s descrito/s en esta nota de encargo, llegándose a
              señalizar la compra y si finalmente no se llevara a cabo la venta
              por incumplimiento de cualquiera de las partes, &ldquo;EL
              CLIENTE&rdquo;, estará obligado a abonar a{" "}
              {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong> la cantidad del 100% de la comisión,
              más IVA, como intermediación, gastos de gestión, redacción de
              contratos, etc.
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">3º - DURACIÓN</div>
            <div className="mb-3 text-justify leading-relaxed">
              <strong>A)</strong> El encargo de esta operación tiene una
              duración de{" "}
              <strong>
                {formatNumberWithText(data.terms.durationMonths)} meses
              </strong>{" "}
              prorrogables, por el mismo período de tiempo, por ambas partes,
              transcurrido este plazo sin haberse llevado a cabo, de no mediar
              denuncia expresa, a no ser que &ldquo;EL CLIENTE&rdquo;
              anteriormente reseñado, con anterioridad a la finalización del
              plazo comunique por escrito a este despacho su finalización.
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              <strong>B)</strong> No obstante: si con posterioridad a la
              finalización del plazo estipulado para este encargo, se llegase a
              realizar la operación encomendada con alguna persona física o
              jurídica a la que la agencia de{" "}
              {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong>, le hubiera enseñado o informado del
              inmueble descrito durante el tiempo vigente de esta Nota de
              Encargo y se hicieran gestiones en beneficio de la citada
              operación, &ldquo;EL CLIENTE&rdquo; estará obligado a abonar los
              honorarios descritos en la cláusula segunda, apartado A), de la
              presente NOTA DE ENCARGO a{" "}
              {accountType === "company" ? "" : "D/ª "}
              <strong>{agentName}</strong>.
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">4º - OTRAS AGENCIAS</div>
            <div className="mb-3 text-justify leading-relaxed">
              &ldquo;EL CLIENTE&rdquo;,{" "}
              <span className="font-bold">
                {data.terms.exclusivity ? "[NO]" : "[SÍ]"}
              </span>
              , tiene encomendada, la venta del mencionado inmueble a otra
              Agencia de la Propiedad Inmobiliaria.
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">
              5º - CARGAS, GRAVÁMENES Y LIMITACIONES
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              El autorizante se compromete a otorgar la Escritura Pública de
              Compraventa libre de cargas, gravámenes, limitaciones, censos,
              arrendamientos y ocupantes.
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">6º - PROTECCIÓN DE DATOS</div>
            <div className="mb-3 text-justify leading-relaxed">
              &ldquo;De conformidad con lo establecido en el REGLAMENTO (UE)
              2016/679 de protección de datos de carácter personal, le
              informamos que los datos que usted nos facilite serán incorporados
              al sistema de tratamiento titularidad de {agentName} con{" "}
              {accountType === "company" ? "C.I.F" : "N.I.F"} {taxId}, con
              domicilio en las direcciones reseñadas, correo electrónico:{" "}
              {data.agency.email}, con el fin de prestarle el servicio
              solicitado. Los datos proporcionados se conservarán mientras se
              mantenga la relación comercial durante los años necesarios para
              cumplir con las obligaciones legales. Los datos no se cederán a
              terceros, salvo en los casos que exista una obligación legal.
              Usted tiene derecho a obtener confirmación sobre si en {agentName}{" "}
              estamos tratando sus datos personales, por tanto tiene derecho a
              acceder a sus datos personales, rectificar los datos inexactos o
              solicitar su supresión cuando los datos no sean necesarios.&rdquo;
            </div>
            <div className="mb-3 text-justify leading-relaxed">
              Así mismo solicito su autorización para ofrecerle productos y
              servicios relacionados con los solicitados y fidelizarle como
              cliente.{" "}
              <span className="font-bold">
                {data.gdprConsent ? "[SÍ]" : "[NO]"}
              </span>
              .
            </div>
          </div>

          <div className="my-6">
            <div className="mb-3 font-bold">7º - JURISDICCIÓN</div>
            <div className="mb-3 text-justify leading-relaxed">
              Las partes, para dirimir cualquier conflicto o controversia que
              pudiera suscitarse en relación a la interpretación y aplicación de
              la presente Nota de Encargo, acuerdan someterse al Fuero y
              Jurisdicción de los Tribunales de{" "}
              <strong>{data.jurisdiction.city}</strong>, con renuncia a su
              propio fuero si lo tuvieran.
            </div>
          </div>
        </div>

        {/* Agency Acceptance Clause */}
        <div className="my-8 border-l-4 border-gray-400 bg-gray-50 p-4 text-justify italic leading-relaxed">
          La Agencia que suscribe acepta el encargo que recibe y se obliga a
          realizarlo con toda eficacia, honorabilidad, reserva y legalidad.
        </div>

        {/* Observations Section */}
        <div className="my-8">
          <div className="border-b border-gray-300 pb-2 text-[13pt] font-bold">
            OBSERVACIONES:
          </div>
          <div className="mb-3 min-h-[80px] border-b border-black pb-2">
            {data.observations}
          </div>
          <div className="mb-3 h-5 border-b border-black"></div>
          <div className="mb-6 h-5 border-b border-black"></div>
        </div>

        {/* Signature Section */}
        <div className="mt-16 border-t border-gray-300 pt-6">
          <div className="mb-12 text-center font-medium">
            Y para que conste y surta efecto, se firma en{" "}
            <strong>{data.signatures.location}</strong>, a{" "}
            <strong>{data.signatures.date}</strong>
          </div>

          <div className="mt-16 flex justify-between px-8">
            <div className="w-56 text-center">
              <div className="mb-4 text-[12pt] font-bold">EL CLIENTE</div>
              {data.signatures.ownerSignatureUrl ? (
                <div className="mb-2 flex h-24 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.signatures.ownerSignatureUrl}
                    alt="Firma del cliente"
                    className="max-h-20 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="mb-2 h-24"></div>
              )}
              <div className="mb-2 h-px w-full border-b-2 border-black"></div>
              <div className="text-sm text-gray-600">Firma</div>
            </div>

            <div className="w-56 text-center">
              <div className="mb-4 text-[12pt] font-bold">
                {accountType === "company" ? agentName : "Dª. " + agentName}
              </div>
              {data.signatures.agentSignatureUrl ? (
                <div className="mb-2 flex h-24 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.signatures.agentSignatureUrl}
                    alt="Firma del agente"
                    className="max-h-20 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="mb-2 h-24"></div>
              )}
              <div className="mb-2 h-px w-full border-b-2 border-black"></div>
              <div className="text-sm text-gray-600">Firma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
