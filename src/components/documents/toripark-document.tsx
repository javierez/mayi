"use client";

import React, { useState, useEffect } from "react";
import { getBrandAsset } from "~/app/actions/brand-upload";
import { getCurrentUserAccountIdAction } from "~/app/actions/settings";
import {
  getAgentNameAction,
  getOfficeInfoAction,
} from "~/app/actions/agent-info";
import { getAllPropertyImages } from "~/app/actions/property-images";
import { useSession } from "~/lib/auth-client";
import type { ArrasDocumentData } from "~/types/arras";

interface Props {
  data: ArrasDocumentData;
}

/**
 * ToriPark Party Venue Rental Contract Document
 * Simple rental contract for party facilities - account 1125899906842626
 */
export function ToriParkDocument({ data }: Props) {
  const [brandLogo, setBrandLogo] = useState<string | null>(
    data.branding?.logoUrl ?? null,
  );
  const [agentName, setAgentName] = useState<string>(
    data.branding?.agentName ?? "ToriPark",
  );
  const [, setTaxId] = useState<string>(data.branding?.taxId ?? "");
  const [offices, setOffices] = useState<
    Array<{ address: string; city: string; postalCode: string; phone: string }>
  >(data.branding?.offices ?? []);
  const [, setWebsite] = useState<string>(data.branding?.website ?? "");
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [imageOrientations, setImageOrientations] = useState<Record<string, "portrait" | "landscape">>({});
  const { data: session } = useSession();

  // Detect image orientation on load
  const handleImageLoad = (url: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const orientation = img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
    setImageOrientations((prev) => ({ ...prev, [url]: orientation }));
  };

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

  // Fetch property images using propertyId
  useEffect(() => {
    const fetchPropertyImages = async () => {
      try {
        if (data.property.propertyId) {
          const images = await getAllPropertyImages(data.property.propertyId);
          setPropertyImages(images);
        }
      } catch (error) {
        console.error("Error fetching property images:", error);
      }
    };

    void fetchPropertyImages();
  }, [data.property.propertyId]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Get rental price from finalPrice (the form sends totalPrice which becomes finalPrice)
  const rentalPrice = parseFloat(data.deal.finalPrice);
  // Get security deposit from arrasAmount (the form sends deposit as arrasAmount)
  const securityDeposit = parseFloat(data.deal.arrasAmount);

  // Get landlord info from seller data
  const landlordName = data.seller.name;
  const landlordNif = data.seller.nif;
  const landlordAddress = data.seller.address;

  // Get tenant info from buyer data
  const tenantName = data.buyer.name;
  const tenantNif = data.buyer.nif;
  const tenantAddress = data.buyer.address;

  // Parse check-in/check-out from specialConditions
  // Format: "Entrada: YYYY-MM-DD HH:MM / Salida: YYYY-MM-DD HH:MM"
  const parseCheckInOut = (specialConditions?: string) => {
    const defaults = {
      checkInDate: data.date,
      checkInTime: "17:00",
      checkOutDate: data.date,
      checkOutTime: "21:00",
    };

    if (!specialConditions) return defaults;

    const entradaMatch = /Entrada:\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/.exec(specialConditions);
    const salidaMatch = /Salida:\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/.exec(specialConditions);

    return {
      checkInDate: entradaMatch?.[1] ?? defaults.checkInDate,
      checkInTime: entradaMatch?.[2] ?? defaults.checkInTime,
      checkOutDate: salidaMatch?.[1] ?? defaults.checkOutDate,
      checkOutTime: salidaMatch?.[2] ?? defaults.checkOutTime,
    };
  };

  const { checkInDate, checkInTime, checkOutDate, checkOutTime } = parseCheckInOut(
    data.deal.specialConditions,
  );

  // Format date for display (YYYY-MM-DD to DD/MM/YYYY)
  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <>
      <style jsx>{`
        @media print {
          .toripark-document {
            orphans: 2;
            widows: 2;
          }
          .section-header {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 1em;
          }
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .anexo-section {
            page-break-before: always;
          }
          @page {
            margin: 12mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      <div className="bg-white font-sans text-black print:m-0 print:h-[297mm] print:w-[210mm] print:p-0 print:text-[10pt] print:leading-[1.3]">
        <div className="toripark-document mx-auto min-h-[1123px] max-w-[794px] px-10 py-6 font-sans text-[10pt] leading-[1.3] print:mx-0 print:min-h-0 print:max-w-none print:px-10 print:py-4">
          {/* Header Section */}
          <div className="mb-4 print:mb-2">
            <div className="mb-3 flex items-center justify-between gap-8 pb-2 print:mb-2 print:pb-1">
              {brandLogo && (
                <div className="flex flex-shrink-0 items-center justify-center p-1 print:p-0">
                  <div className="flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandLogo}
                      alt="Logo"
                      className="h-16 w-auto"
                      style={{ width: "auto", height: "64px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {offices.length > 0 && (
              <div className="border-t border-black pt-1 text-[8pt] text-black">
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
          <div className="mb-4 text-center print:mb-3">
            <div className="text-[14pt] font-bold">Normativa - Contrato</div>
          </div>

          {/* Section 1: Introduction / Responsibility */}
          <div className="mb-4 text-justify text-[9.5pt] leading-[1.5] print:mb-3">
            <p className="mb-3">
              El cliente se compromete al uso de las instalaciones de <span className="font-bold uppercase underline">{agentName}</span> de
              conformidad con la ley y el sentido común; así como con lo dispuesto en los presentes
              Términos y Condiciones Generales de contratación. En consecuencia, queda obligado
              a no utilizar dichas instalaciones con fines ilícitos, lesivos para terceros o que, de
              cualquier forma, que puedan causar daño a las mismas, así como a la imagen de <span className="font-bold uppercase underline">{agentName}</span>.
            </p>
            <p>
              Asimismo, el cliente abajo firmante se hace directa y exclusivamente
              responsable y exime de toda responsabilidad a <span className="font-bold uppercase underline">{agentName}</span>, de los daños
              sufridos por cualquiera de los invitados que se ocasionen por el uso indebido de las
              mismas, así como de las infracciones y sanciones que su comportamiento, el de las
              personas a su cargo, el del resto de asistentes mayores de edad, así como el de las
              personas que estén a cargo de estos últimos pueda ocasionar, en particular, por
              infracciones de la normativa municipal, autonómica o estatal.
            </p>
          </div>

          {/* Section 2: QUEDA TOTALMENTE PROHIBIDO */}
          <div className="mb-4 print:mb-3">
            <div className="mb-2 border-b border-gray-300 pb-1 text-[10.5pt] font-bold">QUEDA TOTALMENTE <strong className="underline">PROHIBIDO</strong>:</div>
            <ul className="list-disc space-y-1.5 pl-5 text-[9.5pt] leading-[1.45]">
              <li><strong>Salir a la calle con bebidas.</strong> No se pueden sacar vasos ni copas del local. En caso de sanción de cualquier tipo debida al comportamiento de cualquiera de los asistentes al evento, la responsabilidad íntegra será asumida por la persona firmante de este contrato, así como el pago de dicha sanción.</li>
              <li>Mantener las puertas del local abiertas durante la fiesta o utilizar la acera o vía pública frente al local, así como cualquier recinto que pertenezca a la comunidad de propietarios para prolongar la celebración del evento, pudiendo causar molestias a la vecindad o a otros usuarios del local. Prohibido sentarse en los muros de los escaparates.</li>
              <li>Consumir bebidas alcohólicas o drogas las personas menores de 18 años. No puede haber menores en el local sin el control y presencia de sus responsables legales y de la persona firmante del contrato durante TODO el evento.</li>
              <li><strong>Fumar en todo el recinto.</strong></li>
              <li>Consumir comida o bebida en las zonas de juego infantiles, y poner comida o bebida encima de las mismas.</li>
              <li>En la zona de Juegos y en los parques de bolas, está totalmente prohibido la utilización de calzado y estar descalzos (sin calcetines), los usuarios <strong>deben llevar obligatoriamente calcetines.</strong></li>
              <li>Que los mayores de 15 años utilicen las zonas de juego infantiles. El mal uso de estos conllevará la no devolución de la fianza, así como si se observan indicios de uso indebido de las instalaciones.</li>
              <li><strong>COMER DENTRO DE LOS PARQUES DE BOLAS</strong></li>
              <li>Pegar cualquier adhesivo en las paredes, cristales de las ventanas y suelo, o clavar chinchetas, grapas, etc. así como tirar confeti, spray de serpentina o similar. Únicamente se podrá utilizar <strong>CINTA CARROCERA</strong>, despegándolo al quitar la decoración y antes de abandonar el local.</li>
              <li>Traer cualquier tipo de mascota.</li>
              <li>Subir y saltar sobre las mesas, sillas, mostrador del office.</li>
            </ul>
          </div>

          {/* Section 3: Consequences and commitments */}
          <div className="mb-4 text-justify text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-3">
              El no cumplimiento de cualquiera de estas observaciones provocará la no devolución
              de la fianza, y si la empresa lo considera oportuno, la finalización de la fiesta, sin tener
              derecho a ninguna devolución del importe cobrado tanto por el alquiler como por los
              servicios contratados, aunque no se hayan realizado. Además, los clientes se
              comprometen en concreto a:
            </p>
          </div>

          {/* Section 4: Room conditions */}
          <div className="mb-4 print:mb-3">
            <div className="mb-2 border-b border-gray-200 pb-0.5 text-[9.5pt] font-semibold">Dejar la sala vacía y recogida tal y como se entrega:</div>
            <ul className="list-disc space-y-1 pl-5 text-[9.5pt] leading-[1.45]">
              <li>Sin basura ni restos de bebida o comida (se facilita bolsa de basura ubicada en el office).</li>
              <li>Sin serpentinas, ni confeti, ni globos por el suelo, ya sean hinchados o explotados.</li>
              <li>Si se decora la pared con guirnaldas, estas se quitarán al finalizar el evento, con cuidado de no dañar las paredes.</li>
              <li>A no romper ni llevarse ninguno de los objetos que forman parte del mobiliario y decoración de la sala, así como menaje o juguetes.</li>
              <li>Asegurarse de que todas las luces quedan apagadas.</li>
              <li>Asegurarse de que las puertas quedan cerradas al abandonar <span className="font-bold uppercase underline">{agentName}</span>.</li>
              <li><strong className="underline">DEJAR EL MOBILIARIO COLOCADO TAL CUAL SE ENCUENTRA A LA ENTRADA DE LA FIESTA.</strong></li>
            </ul>
          </div>

          {/* Section 5: Inventory */}
          <div className="mb-4 text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-2">El cliente abajo firmante se hará responsable de cualquier desperfecto del mobiliario, paredes, suelo, baños, etc. de <span className="font-bold uppercase underline">{agentName}</span>:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>En el office:</strong> un microondas marca SIMPLE, frigorífico marca PHILIPS, calentador de agua marca COINTRA, armario blanco despensero, muebles bajos y altos, dos mesas azules, una mesa cocina extensible, un extintor, cubo basura y varios cepillos, cubo y fregona.</li>
              <li><strong>En la sala juegos:</strong> cinco mesas grandes, dos mesas bajas blancas, una mesa baja azul, veinticuatro sillas, una trona niños pequeños, dos bancos de madera, cinco taburetes altos en la barra, dos percheros (parabanes), para el normal uso de disfrute, un botellero marca Pepsi, dos mesas pequeñas rojas, cinco sillas pequeñas rojas, un secador pelo, dos parques grandes de bolas unidos entre sí.</li>
              <li><strong>ARRENDATARIO/A</strong> de este contrato deberá de llevar productos de limpieza para dejar en perfectas condiciones de limpieza las instalaciones utilizadas.</li>
            </ul>
          </div>

          {/* Section 6: Additional rules */}
          <div className="mb-4 text-justify text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-2">
              El <span className="font-bold uppercase underline">{agentName}</span> tiene que permanecer con las puertas cerradas durante toda la
              fiesta. La sala está insonorizada, pero no sirve de nada si se dejan las puertas abiertas.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>No nos hacemos responsables de posibles robos durante el evento derivados de dejar las puertas abiertas.</li>
              <li>A que durante toda la fiesta haya un adulto responsable, con capacidad para controlar el normal funcionamiento de la fiesta y el cumplimiento de estas normas, así como del cuidado de los niños en todos los espacios del <span className="font-bold uppercase underline">{agentName}</span>, en especial, en la zona infantil y baños.</li>
              <li>No se proporciona ningún utensilio de cocina, se recomienda la utilización de platos, vasos y copas desechables, ya que, si se rompe la cristalería o la vajilla, se pueden lastimar los usuarios de dichas zonas al estar sin calzado, siendo responsabilidad del cliente lo que ocurra por este motivo.</li>
            </ul>
          </div>

          {/* Section 7: Schedule */}
          <div className="mb-4 text-justify text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-2">
              El horario de disfrute del <span className="font-bold uppercase underline">{agentName}</span> será el comprendido entre la hora de entrada y la hora de salida estipulada en el presente contrato.
            </p>
            <p className="mb-2">
              Una persona de nuestro equipo estará pendiente de la apertura y del cierre de puertas,
              es por este motivo que pedimos por favor puntualidad; dentro de este período de
              tiempo se incluye el tiempo para decorar local y desmontar decoración que se instale y
              la limpieza local, que se deberá entregar en perfectas condiciones, como lo reciben.
            </p>
            <p>
              <strong className="underline">El tiempo que exceda de la hora de salida, se cobrará como hora extra a 20
              euros la hora. A partir de una hora de retraso en la salida podrá perderse la
              fianza.</strong>
            </p>
          </div>

          {/* Section 8: Cancellation Policy */}
          <div className="mb-4 text-justify text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-2 border-b border-gray-200 pb-1 font-semibold">*POLÍTICA DE CANCELACIÓN O CAMBIOS DE FECHA</p>
            <p>
              Una vez reservada la fecha de alquiler de <span className="font-bold uppercase underline">{agentName}</span> y abonada la señal en
              concepto de reserva-fianza, <strong>no se devuelve el importe</strong>. Ver condiciones de pago en
              anexo informativo &quot;Como funcionamos&quot;.
            </p>
            <p className="mt-2">
              El equipo del <span className="font-bold uppercase underline">{agentName}</span> te agradece tu colaboración y te desea una feliz estancia.
            </p>
          </div>

          {/* Section 9: Parties */}
          <div className="mb-4 text-[9.5pt] leading-[1.45] print:mb-3">
            <p className="mb-3">
              **El contratante deberá ser mayor de edad. La persona adulta firmante se compromete
              a hacerse responsable del evento y de lo que allí suceda, eximiendo de dicha
              responsabilidad a <span className="font-bold uppercase underline">{agentName}</span> y se compromete a estar presente durante
              TODO el transcurso del evento.
            </p>

            {/* Landlord */}
            <div className="mb-3 rounded border border-gray-400 bg-gray-50 p-2.5 print:bg-transparent">
              <p><strong>Como ARRENDADORA:</strong> {landlordName}, con D.N.I {landlordNif}, domicilio en {landlordAddress}, mayor de edad, con plena capacidad para contratar.</p>
            </div>

            {/* Tenant */}
            <div className="rounded border border-gray-400 bg-gray-50 p-2.5 print:bg-transparent">
              <p><strong>Como ARRENDATARIO/A:</strong> {tenantName}, con D.N.I / N.I.E.: {tenantNif}, con domicilio en {tenantAddress}, mayor de edad, con plena capacidad legal para contratar, actuando en su propio nombre.</p>
            </div>
          </div>

          {/* Section 10: Event Details */}
          <div className="no-break mb-4 rounded border-2 border-gray-600 bg-gray-50 p-3 text-[9.5pt] print:mb-3 print:bg-transparent">
            <p className="mb-3 font-semibold">Mediante mi firma y como responsable doy mi conformidad y me comprometo al cumplimiento del presente contrato</p>

            <div className="grid grid-cols-2 gap-2.5">
              <div><strong>Fecha del evento:</strong> {formatDateDisplay(checkInDate)}</div>
              <div></div>
              <div><strong>Día de entrada:</strong> {formatDateDisplay(checkInDate)}</div>
              <div><strong>Hora de Entrada:</strong> {checkInTime}</div>
              <div><strong>Día de salida:</strong> {formatDateDisplay(checkOutDate)}</div>
              <div><strong>Hora de Salida:</strong> {checkOutTime}</div>
            </div>

            <div className="mt-3 border-t border-gray-400 pt-2.5">
              <div className="mb-1"><strong>IMPORTE ALQUILER:</strong> {formatCurrency(rentalPrice)}</div>
              <div><strong>FIANZA:</strong> {formatCurrency(securityDeposit)}</div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-gray-400 pt-2.5">
              <div className="flex flex-col">
                <span className="mb-1 text-[9pt] font-semibold">Fianza entregada</span>
                <div className="h-12 border-b border-black"></div>
                <div className="mt-1 text-[8pt]">Fecha:</div>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-[9pt] font-semibold">Alquiler pagado</span>
                <div className="h-12 border-b border-black"></div>
                <div className="mt-1 text-[8pt]">Fecha:</div>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-[9pt] font-semibold">Fianza devuelta</span>
                <div className="h-12 border-b border-black"></div>
                <div className="mt-1 text-[8pt]">Fecha:</div>
              </div>
            </div>
          </div>

          {/* Section 11: Legal Notice (ADVERTENCIA LEGAL) */}
          <div className="mb-4 text-justify text-[8.5pt] leading-[1.4] print:mb-3">
            <p className="mb-2 border-b border-gray-200 pb-1 text-[9.5pt] font-semibold">ADVERTENCIA LEGAL</p>
            <p className="mb-1.5">
              En virtud de las Leyes y Reglamentos vigentes y de aplicación a la Protección de
              Datos Personales, le informamos que en <span className="font-bold uppercase underline">{agentName}</span>, tratamos la información que nos
              facilita con el fin de gestionar, prestar y administrar los servicios ofrecidos fruto de
              nuestra actividad profesional. Sus datos serán conservados siempre que sea
              imprescindible o legítimo para la finalidad que se captaron y en los plazos marcados
              por las obligaciones legales.
            </p>
            <p className="mb-1.5">
              Basamos este tratamiento de sus datos personales en su necesidad para la ejecución
              de nuestros trabajos y/o en el cumplimiento de una obligación legal.
              No se prevé ceder sus datos a terceros salvo en el ejercicio de las obligaciones legales.
            </p>
            <p className="mb-1.5">
              Usted tiene derecho a obtener confirmación sobre si en <span className="font-bold uppercase underline">{agentName}</span> estamos
              tratando sus datos personales, por tanto, tiene derecho a acceder, rectificar, suprimir,
              limitar, oponerse o a ejercer la portabilidad de sus datos. Para ejercer estos derechos puede dirigirse: toriparkmerendero@gmail.com.
            </p>
            <p>
              Asimismo, se solicita su autorización para ofrecerle promociones relacionadas con los
              servicios solicitados.
            </p>
            <p className="mt-1">
              <strong>SI ________ NO ________</strong> (táchese lo que no proceda)
            </p>
          </div>

          {/* Section 12: Document return notice */}
          <div className="mb-4 text-center text-[9.5pt] font-semibold print:mb-3">
            ** Este documento deberá devolverse firmado en todas las hojas antes del
            evento, en formato físico o electrónico (vía WhatsApp o E-mail).
            <br />¡Muchas gracias!
          </div>

          {/* Signature Section */}
          <div className="signatures-section mt-5 print:mt-4">
            <div className="mb-4 text-justify text-[9.5pt] leading-relaxed print:mb-3">
              Y para que conste y surta efecto, se firma en{" "}
              <strong>{data.location}</strong>, a <strong>{data.date}</strong>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-6 print:mt-2 print:gap-4">
              {/* Landlord Signature - Hardcoded for ToriPark */}
              <div className="flex flex-col">
                <div className="relative rounded border border-black p-3 print:p-2">
                  <div className="mb-3 flex h-20 items-center justify-center print:mb-2 print:h-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://toripark.s3.us-east-1.amazonaws.com/branding/firma+azu.png"
                      alt="Firma Arrendadora"
                      className="max-h-20 max-w-full object-contain print:max-h-16"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                  <div className="-mt-[4px] print:mt-[-2px]">
                    <div className="text-[9.5pt] font-semibold">
                      Fdo: {landlordName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenant Signature - Empty for manual signing */}
              <div className="flex flex-col">
                <div className="relative rounded border border-black p-3 print:p-2">
                  <div className="mb-3 h-20 print:mb-2 print:h-16"></div>
                  <div className="-mt-[4px] print:mt-[-2px]">
                    <div className="text-[9.5pt] font-semibold">
                      Fdo: {tenantName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observations Section */}
          <div className="mt-5 print:mt-4">
            <p className="font-bold text-[10.5pt]">OBSERVACIONES:</p>
            <div className="mt-2 h-12 border-b border-dashed border-black"></div>
          </div>
        </div>

        {/* ANEXO - Property Images */}
        {propertyImages.length > 0 && (() => {
          // Group images by orientation
          const portraitImages = propertyImages.filter((url) => imageOrientations[url] === "portrait");
          const landscapeImages = propertyImages.filter((url) => imageOrientations[url] === "landscape");
          const unknownImages = propertyImages.filter((url) => !imageOrientations[url]);

          return (
            <div className="anexo-section mx-auto max-w-[794px] px-10 py-6 font-sans text-[10pt] leading-[1.3] print:mx-0 print:max-w-none print:px-10 print:py-4">
              <div className="mb-4 text-center print:mb-3">
                <div className="text-[14pt] font-bold">ANEXO - FOTOGRAFÍAS</div>
              </div>

              {/* Landscape images: 2 per row with 16:10 aspect ratio */}
              {landscapeImages.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2 print:gap-1">
                  {landscapeImages.map((imageUrl, index) => (
                    <div key={`landscape-${index}`} className="relative overflow-hidden rounded border border-black" style={{ aspectRatio: "16/10" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Fotografía ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onLoad={(e) => handleImageLoad(imageUrl, e)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Portrait images: 3 per row with 3:4 aspect ratio */}
              {portraitImages.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2 print:gap-1">
                  {portraitImages.map((imageUrl, index) => (
                    <div key={`portrait-${index}`} className="relative overflow-hidden rounded border border-black" style={{ aspectRatio: "3/4" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Fotografía ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onLoad={(e) => handleImageLoad(imageUrl, e)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Unknown orientation (loading): show in 2-col grid with onLoad detection */}
              {unknownImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 print:gap-1">
                  {unknownImages.map((imageUrl, index) => (
                    <div key={`unknown-${index}`} className="relative overflow-hidden rounded border border-black" style={{ aspectRatio: "16/10" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`Fotografía ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onLoad={(e) => handleImageLoad(imageUrl, e)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}
