"use client";

import React, { useState, useEffect } from "react";
import { getBrandAsset } from "~/app/actions/brand-upload";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";
import { useSession } from "~/lib/auth-client";
import type { ArrasDocumentData } from "~/types/arras";

interface Props {
  data: ArrasDocumentData;
}

export function ArrasDocument({ data }: Props) {
  const [brandLogo, setBrandLogo] = useState<string | null>(
    data.branding?.logoUrl ?? null,
  );
  const [agentName, setAgentName] = useState<string>(
    data.branding?.agentName ?? "Agente Inmobiliario",
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
  const [website, setWebsite] = useState<string>(data.branding?.website ?? "");
  const { data: session } = useSession();

  useEffect(() => {
    if (data.branding?.logoUrl) {
      console.log("Using branding from props (PDF mode)");
      return;
    }

    const fetchBrandData = async () => {
      try {
        if (session?.user?.id) {
          console.log("Fetching branding client-side (preview mode)");
          const userAccountId = await getCurrentUserAccountIdAction();

          if (userAccountId) {
            const accountIdStr = userAccountId.toString();
            const brandAsset = await getBrandAsset(accountIdStr);

            if (brandAsset?.logoTransparentUrl && brandAsset.logoTransparentUrl.trim() !== "") {
              setBrandLogo(brandAsset.logoTransparentUrl);
            } else if (brandAsset?.logoOriginalUrl && brandAsset.logoOriginalUrl.trim() !== "") {
              setBrandLogo(brandAsset.logoOriginalUrl);
            }

            const agentNameResult = await getAgentNameAction(BigInt(userAccountId));

            if (agentNameResult.success) {
              if (agentNameResult.agentName) {
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

            const officeInfoResult = await getOfficeInfoAction(BigInt(userAccountId));
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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const arrasTypeLabel =
    data.deal.arrasType === "penitenciales" ? "PENITENCIALES" : "CONFIRMATORIAS";

  return (
    <>
      <style jsx>{`
        @media print {
          .arras-document {
            orphans: 2;
            widows: 2;
          }
          .section-header {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 1em;
          }
          .clause {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>

      <div className="bg-white font-sans text-black print:m-0 print:text-[10pt] print:leading-[1.3]">
        <div className="arras-document mx-auto max-w-[794px] px-8 py-6 font-sans text-[10pt] leading-[1.3] print:mx-0 print:max-w-none print:px-8 print:py-4">
          {/* Header Section */}
          <div className="mb-4 print:mb-3">
            <div className="mb-3 flex items-center justify-between gap-6 print:mb-2">
              {brandLogo && (
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brandLogo}
                    alt="Logo de la agencia"
                    className="h-16 w-auto"
                    style={{ width: "auto", height: "64px" }}
                  />
                </div>
              )}

              <div className="flex-1 space-y-0.5 text-right text-[8pt] leading-tight text-gray-600">
                <div className="font-semibold text-gray-800">{agentName}</div>
                {collegiateNumber && accountType !== "company" && (
                  <div>Colegiado: {collegiateNumber}</div>
                )}
                {taxId && (
                  <div>{accountType === "company" ? "C.I.F" : "N.I.F"}: {taxId}</div>
                )}
                {website && <div className="text-blue-600">{website}</div>}
              </div>
            </div>

            {offices.length > 0 && (
              <div className="border-t border-gray-200 pt-2 text-[8pt] text-gray-600">
                {offices.map((office, index) => (
                  <span key={index}>
                    {index > 0 && " | "}
                    {office.address}, {office.postalCode} {office.city} (Tel: {office.phone})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Document Title */}
          <div className="my-4 border-y-2 border-gray-800 py-2 text-center print:my-3 print:py-1">
            <div className="text-[14pt] font-bold">
              CONTRATO DE ARRAS {arrasTypeLabel}
            </div>
          </div>

          {/* Location and Date */}
          <div className="my-4 text-center print:my-3">
            <p>
              En <strong>{data.location}</strong>, a <strong>{data.date}</strong>
            </p>
          </div>

          {/* REUNIDOS Section */}
          <div className="my-4 print:my-3">
            <div className="section-header mb-2 text-[11pt] font-bold">REUNIDOS</div>
            <div className="space-y-3 text-justify">
              <p>
                <strong>De una parte</strong>, D./Da.{" "}
                <strong>{data.seller.name}</strong>, mayor de edad, con{" "}
                {data.seller.nif.length === 9 && data.seller.nif[0]?.match(/[XYZ]/i)
                  ? "N.I.E."
                  : "N.I.F."}{" "}
                <strong>{data.seller.nif}</strong>, y domicilio en{" "}
                <strong>{data.seller.address}</strong>, en adelante{" "}
                <strong>&quot;LA PARTE VENDEDORA&quot;</strong>.
              </p>
              <p>
                <strong>De otra parte</strong>, D./Da.{" "}
                <strong>{data.buyer.name}</strong>, mayor de edad, con{" "}
                {data.buyer.nif.length === 9 && data.buyer.nif[0]?.match(/[XYZ]/i)
                  ? "N.I.E."
                  : "N.I.F."}{" "}
                <strong>{data.buyer.nif}</strong>, y domicilio en{" "}
                <strong>{data.buyer.address}</strong>, en adelante{" "}
                <strong>&quot;LA PARTE COMPRADORA&quot;</strong>.
              </p>
            </div>
          </div>

          {/* INTERVIENEN Section */}
          <div className="my-4 print:my-3">
            <div className="section-header mb-2 text-[11pt] font-bold">INTERVIENEN</div>
            <p className="text-justify">
              Ambas partes intervienen en su propio nombre y derecho, reconociendose
              mutuamente la capacidad legal necesaria para otorgar el presente contrato
              de arras {data.deal.arrasType}, y a tal efecto:
            </p>
          </div>

          {/* EXPONEN Section */}
          <div className="my-4 print:my-3">
            <div className="section-header mb-2 text-[11pt] font-bold">EXPONEN</div>
            <div className="space-y-2 text-justify">
              <p>
                <strong>PRIMERO.-</strong> Que LA PARTE VENDEDORA es propietaria de pleno
                dominio del siguiente inmueble:
              </p>
              <div className="my-2 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2 text-[9pt]">
                  <div>
                    <span className="font-medium">Direccion:</span>{" "}
                    {data.property.fullAddress}
                  </div>
                  {data.property.cadastralReference && (
                    <div>
                      <span className="font-medium">Ref. Catastral:</span>{" "}
                      {data.property.cadastralReference}
                    </div>
                  )}
                  {data.property.surfaceArea && (
                    <div>
                      <span className="font-medium">Superficie:</span>{" "}
                      {data.property.surfaceArea} m2
                    </div>
                  )}
                  {data.property.propertyType && (
                    <div>
                      <span className="font-medium">Tipo:</span>{" "}
                      {data.property.propertyType}
                    </div>
                  )}
                </div>
              </div>
              <p>
                <strong>SEGUNDO.-</strong> Que LA PARTE COMPRADORA esta interesada en la
                adquisicion del citado inmueble, y ambas partes han acordado formalizar
                el presente contrato de arras con arreglo a las siguientes:
              </p>
            </div>
          </div>

          {/* CLAUSULAS Section */}
          <div className="my-4 print:my-3">
            <div className="section-header mb-3 border-b border-gray-300 pb-1 text-[11pt] font-bold">
              CLAUSULAS
            </div>

            {/* PRIMERA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">PRIMERA.- OBJETO DEL CONTRATO</p>
              <p className="text-justify">
                LA PARTE VENDEDORA vende a LA PARTE COMPRADORA, que acepta y adquiere,
                el inmueble descrito en el expositivo primero, libre de cargas,
                gravamenes, arrendamientos y ocupantes.
              </p>
            </div>

            {/* SEGUNDA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">SEGUNDA.- PRECIO</p>
              <p className="text-justify">
                El precio de la compraventa se fija en la cantidad de{" "}
                <strong>{formatCurrency(data.deal.finalPrice)}</strong> (
                {data.deal.finalPrice} EUROS), que LA PARTE COMPRADORA pagara de la
                siguiente forma:
              </p>
              <ul className="my-2 ml-4 list-disc space-y-1">
                <li>
                  En concepto de arras: <strong>{formatCurrency(data.deal.arrasAmount)}</strong>,
                  mediante {data.deal.paymentMethod === "transferencia"
                    ? "transferencia bancaria"
                    : data.deal.paymentMethod === "cheque"
                    ? "cheque nominativo"
                    : "cheque bancario"}
                  {data.deal.bankAccountIban && (
                    <> a la cuenta <strong>{data.deal.bankAccountIban}</strong></>
                  )}
                  .
                </li>
                <li>
                  El resto,{" "}
                  <strong>
                    {formatCurrency(
                      parseFloat(data.deal.finalPrice) -
                        parseFloat(data.deal.arrasAmount),
                    )}
                  </strong>
                  , en el momento de otorgamiento de la escritura publica de
                  compraventa.
                </li>
              </ul>
            </div>

            {/* TERCERA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">TERCERA.- ARRAS {arrasTypeLabel}</p>
              <p className="text-justify">
                La cantidad de <strong>{formatCurrency(data.deal.arrasAmount)}</strong>{" "}
                se entrega en concepto de arras {data.deal.arrasType}, conforme a lo
                establecido en el articulo 1.454 del Codigo Civil.
              </p>
            </div>

            {/* CUARTA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">CUARTA.- DESISTIMIENTO</p>
              {data.deal.arrasType === "penitenciales" ? (
                <div className="space-y-2 text-justify">
                  <p>
                    Si LA PARTE COMPRADORA desistiere del contrato, perdera la cantidad
                    entregada en concepto de arras.
                  </p>
                  <p>
                    Si LA PARTE VENDEDORA desistiere del contrato, debera devolver a LA
                    PARTE COMPRADORA el duplo de la cantidad recibida en concepto de
                    arras, es decir, <strong>{formatCurrency(parseFloat(data.deal.arrasAmount) * 2)}</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-justify">
                  Las presentes arras tienen caracter confirmatorio, por lo que
                  cualquier incumplimiento de las obligaciones contraidas dara derecho a
                  la parte cumplidora a exigir el cumplimiento del contrato o a
                  resolverlo con indemnizacion de danos y perjuicios.
                </p>
              )}
            </div>

            {/* QUINTA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">QUINTA.- PLAZO PARA ESCRITURA PUBLICA</p>
              <p className="text-justify">
                Ambas partes se comprometen a otorgar escritura publica de compraventa
                ante Notario, a eleccion de LA PARTE COMPRADORA, antes del dia{" "}
                <strong>{formatDate(data.deal.deedDeadline)}</strong>.
              </p>
            </div>

            {/* SEXTA */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">SEXTA.- GASTOS E IMPUESTOS</p>
              <p className="text-justify">
                Los gastos de la compraventa se distribuiran conforme a la ley: LA
                PARTE VENDEDORA abonara la plusvalia municipal, y LA PARTE COMPRADORA
                los gastos de notaria, registro e impuestos (ITP o IVA segun
                corresponda).
              </p>
            </div>

            {/* SEPTIMA - Condiciones Especiales */}
            {data.deal.specialConditions && (
              <div className="clause my-3">
                <p className="mb-1 font-bold">SEPTIMA.- CONDICIONES ESPECIALES</p>
                <p className="text-justify">{data.deal.specialConditions}</p>
              </div>
            )}

            {/* OCTAVA - Condicion Financiacion */}
            {data.deal.hasFinancingCondition && (
              <div className="clause my-3">
                <p className="mb-1 font-bold">
                  {data.deal.specialConditions ? "OCTAVA" : "SEPTIMA"}.- CONDICION DE
                  FINANCIACION
                </p>
                <p className="text-justify">
                  El presente contrato queda sujeto a la condicion suspensiva de que LA
                  PARTE COMPRADORA obtenga financiacion hipotecaria. Si antes del{" "}
                  <strong>
                    {data.deal.financingDeadline
                      ? formatDate(data.deal.financingDeadline)
                      : formatDate(data.deal.deedDeadline)}
                  </strong>{" "}
                  LA PARTE COMPRADORA acredita la denegacion de la financiacion, tendra
                  derecho a la devolucion integra de las arras entregadas.
                </p>
              </div>
            )}

            {/* NOVENA - GDPR */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">
                {data.deal.specialConditions
                  ? data.deal.hasFinancingCondition
                    ? "NOVENA"
                    : "OCTAVA"
                  : data.deal.hasFinancingCondition
                  ? "OCTAVA"
                  : "SEPTIMA"}
                .- PROTECCION DE DATOS
              </p>
              <p className="text-justify text-[9pt]">
                De conformidad con el REGLAMENTO (UE) 2016/679 de proteccion de datos,
                se informa a las partes que sus datos seran tratados con la finalidad
                de gestionar la presente operacion inmobiliaria. Los datos se
                conservaran mientras se mantenga la relacion comercial y durante los
                anos necesarios para cumplir con las obligaciones legales. Ambas
                partes tienen derecho a acceder, rectificar y suprimir sus datos.
              </p>
              <p className="mt-1 text-[9pt]">
                Consentimiento para comunicaciones comerciales:{" "}
                <strong>{data.gdprConsent ? "[SI]" : "[NO]"}</strong>
              </p>
            </div>

            {/* DECIMA - Jurisdiccion */}
            <div className="clause my-3">
              <p className="mb-1 font-bold">
                {data.deal.specialConditions
                  ? data.deal.hasFinancingCondition
                    ? "DECIMA"
                    : "NOVENA"
                  : data.deal.hasFinancingCondition
                  ? "NOVENA"
                  : "OCTAVA"}
                .- JURISDICCION
              </p>
              <p className="text-justify">
                Para cualquier controversia que pudiera derivarse del presente
                contrato, las partes se someten a los Juzgados y Tribunales de{" "}
                <strong>{data.location}</strong>, con renuncia a cualquier otro fuero
                que pudiera corresponderles.
              </p>
            </div>
          </div>

          {/* Firma Section */}
          <div className="signatures-section mt-6 print:mt-4">
            <p className="mb-4 text-center">
              Y en prueba de conformidad, firman el presente contrato por duplicado y a
              un solo efecto, en el lugar y fecha indicados.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-8 print:mt-4 print:gap-6">
              {/* Seller Signature */}
              <div className="flex flex-col">
                <div className="mb-1 text-center text-[9pt] font-semibold text-gray-700">
                  LA PARTE VENDEDORA
                </div>
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="absolute right-2 top-2 text-[6pt] text-gray-400">
                    {new Intl.DateTimeFormat("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date())}
                  </div>
                  {data.signatures.sellerSignatureUrl ? (
                    <div className="mb-2 flex h-20 items-center justify-center print:h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={data.signatures.sellerSignatureUrl}
                        alt="Firma del Vendedor"
                        className="max-h-20 max-w-full object-contain print:max-h-16"
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                  ) : (
                    <div className="mb-2 h-20 border-b border-gray-400 print:h-16"></div>
                  )}
                  <div className="text-center text-[9pt] font-medium">
                    {data.seller.name}
                  </div>
                  <div className="text-center text-[8pt] text-gray-600">
                    NIF: {data.seller.nif}
                  </div>
                </div>
              </div>

              {/* Buyer Signature */}
              <div className="flex flex-col">
                <div className="mb-1 text-center text-[9pt] font-semibold text-gray-700">
                  LA PARTE COMPRADORA
                </div>
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="absolute right-2 top-2 text-[6pt] text-gray-400">
                    {new Intl.DateTimeFormat("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date())}
                  </div>
                  {data.signatures.buyerSignatureUrl ? (
                    <div className="mb-2 flex h-20 items-center justify-center print:h-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={data.signatures.buyerSignatureUrl}
                        alt="Firma del Comprador"
                        className="max-h-20 max-w-full object-contain print:max-h-16"
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                  ) : (
                    <div className="mb-2 h-20 border-b border-gray-400 print:h-16"></div>
                  )}
                  <div className="text-center text-[9pt] font-medium">
                    {data.buyer.name}
                  </div>
                  <div className="text-center text-[8pt] text-gray-600">
                    NIF: {data.buyer.nif}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Mediator Signature */}
          {data.branding?.signatureUrl && (
            <div className="mt-6 border-t border-gray-200 pt-4 print:mt-4 print:pt-3">
              <div className="mx-auto max-w-xs">
                <div className="mb-1 text-center text-[9pt] font-semibold text-gray-700">
                  MEDIACIÓN INMOBILIARIA
                </div>
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex h-16 items-center justify-center print:h-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.branding.signatureUrl}
                      alt="Firma del Agente"
                      className="max-h-16 max-w-full object-contain print:max-h-14"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                  <div className="text-center text-[9pt] font-medium">
                    {agentName}
                  </div>
                  {collegiateNumber && accountType !== "company" && (
                    <div className="text-center text-[8pt] text-gray-600">
                      Colegiado: {collegiateNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Agency Mediation Notice */}
          <div className="mt-6 border-t border-gray-200 pt-3 print:mt-4 print:pt-2">
            <p className="text-center text-[8pt] italic text-gray-600">
              Contrato formalizado con la mediacion de {agentName}
              {collegiateNumber && accountType !== "company" && (
                <>, Agente de la Propiedad Inmobiliaria colegiado n.o {collegiateNumber}</>
              )}
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
