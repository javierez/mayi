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

interface NotaEncargoData {
  documentNumber: string;
  agency: {
    agentName: string;
    collegiateNumber: string;
    agentNIF: string;
    website: string;
    email: string;
    logo?: string;
    accountId?: string;
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

interface Props {
  data: NotaEncargoData;
}

export function NotaEncargoDocument({ data }: Props) {
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

            if (brandAsset?.logoTransparentUrl) {
              setBrandLogo(brandAsset.logoTransparentUrl);
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
    <div className="bg-white font-sans text-black print:m-0 print:h-[297mm] print:w-[210mm] print:p-0 print:text-[11pt] print:leading-[1.4]">
      <div className="nota-encargo-document mx-auto min-h-[1123px] max-w-[794px] px-10 py-8 font-sans text-[11pt] leading-[1.4] print:mx-0 print:min-h-0 print:max-w-none print:px-[10mm] print:pb-[10mm] print:pt-[2mm]">
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
            <div className="text-[11pt] text-gray-600">
              {accountType === "company" ? "C.I.F" : "N.I.F"}: {taxId}
            </div>
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

          {/* Website */}
          <div className="text-[11pt] font-medium text-blue-700">{website}</div>
        </div>

        <div className="my-4 border-t-2 border-black print:my-3"></div>

        {/* Document Title */}
        <div className="my-6 border-y-2 border-gray-300 py-2 text-center print:my-4 print:py-1">
          <div className="mb-2 text-[16pt] font-bold">NOTA DE ENCARGO</div>
          <div className="text-[12pt] font-medium">
            Nº Nota: {data.documentNumber}
          </div>
        </div>

        <div className="my-4 border-t-2 border-black print:my-3"></div>

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
                {data.property.allowSignage}
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
                El propietario/a o representante de la parte vendedora, entrega
                las llaves de la finca descrita:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.property.keyDelivery}
              </span>
            </div>

            <div className="flex">
              <span className="min-w-[140px] font-bold">
                Autorización para realizar visitas:
              </span>
              <span className="ml-2 flex-1 border-b border-black pb-0.5">
                {data.property.allowVisits}
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
              <strong>{data.commission.percentage}% + I.V.A.</strong> con un
              mínimo de <strong>{data.commission.minimum} €</strong>, como
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
                {data.duration.months === 12 ? "doce" : data.duration.months}{" "}
                meses
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
                {data.hasOtherAgency ? "[SÍ]" : "[NO]"}
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
              <div className="mb-20 text-[12pt] font-bold">EL CLIENTE</div>
              <div className="mb-2 h-px w-full border-b-2 border-black"></div>
              <div className="text-sm text-gray-600">Firma</div>
            </div>

            <div className="w-56 text-center">
              <div className="mb-20 text-[12pt] font-bold">
                {accountType === "company" ? agentName : "Dª. " + agentName}
                <br />
                <span className="text-sm font-normal">(Agente)</span>
              </div>
              <div className="mb-2 h-px w-full border-b-2 border-black"></div>
              <div className="text-sm text-gray-600">Firma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
