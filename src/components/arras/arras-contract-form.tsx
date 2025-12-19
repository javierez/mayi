"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SignaturePad } from "~/components/visits/signature-pad";
import { ArrasBreadcrumb } from "./arras-breadcrumb";
import { ShareArrasPdfModal } from "./share-arras-pdf-modal";
import { toast } from "sonner";
import { createArrasContractAction } from "~/server/actions/arras";
import { Save, Loader, Eye, Download, Share2, AlertCircle } from "lucide-react";
import type { ArrasContractPageData, ArrasType, PaymentMethod } from "~/types/arras";

// ToriPark account ID for rental contract form
const TORIPARK_ACCOUNT_ID = "1125899906842626";

interface ValidationErrors {
  sellerName?: string;
  sellerNif?: string;
  sellerAddress?: string;
  buyerName?: string;
  buyerNif?: string;
  buyerAddress?: string;
  totalPrice?: string;
  arrasAmount?: string;
  signingLocation?: string;
  deedDeadline?: string;
  sellerSignature?: string;
  buyerSignature?: string;
}

interface ArrasContractFormProps {
  data: ArrasContractPageData;
}

// ============================================================================
// ToriPark Rental Contract Form (Simplified)
// ============================================================================
function ToriParkRentalForm({ data }: ArrasContractFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Landlord (Arrendador) - same as seller
  const [landlordName, setLandlordName] = useState(
    data.seller
      ? `${data.seller.firstName} ${data.seller.lastName ?? ""}`.trim()
      : "",
  );
  const [landlordNif, setLandlordNif] = useState(data.seller?.nif ?? "");
  const [landlordAddress, setLandlordAddress] = useState(
    data.seller
      ? [data.seller.address, data.seller.postalCode, data.seller.city]
          .filter(Boolean)
          .join(", ")
      : "",
  );
  const [landlordPhone, setLandlordPhone] = useState(data.seller?.phone ?? "");
  const [landlordEmail, setLandlordEmail] = useState(data.seller?.email ?? "");

  // Tenant (Arrendatario) - same as buyer
  const [tenantName, setTenantName] = useState(
    `${data.buyer.firstName} ${data.buyer.lastName ?? ""}`.trim(),
  );
  const [tenantNif, setTenantNif] = useState(data.buyer.nif ?? "");
  const [tenantAddress, setTenantAddress] = useState(
    [data.buyer.address, data.buyer.postalCode, data.buyer.city]
      .filter(Boolean)
      .join(", "),
  );
  const [tenantPhone, setTenantPhone] = useState(data.buyer.phone ?? "");
  const [tenantEmail, setTenantEmail] = useState(data.buyer.email ?? "");

  // Rental specific fields
  // Price from listing_contacts.offer, not listing.price
  const offerPrice = data.deal.offer ?? 0;
  const [rentalPrice, setRentalPrice] = useState(offerPrice);
  const [deposit, setDeposit] = useState(100); // Default 100 €

  // Check-in date/time
  const [checkInDate, setCheckInDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0]!;
  });
  const [checkInTime, setCheckInTime] = useState("17:00");

  // Check-out date/time
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0]!;
  });
  const [checkOutTime, setCheckOutTime] = useState("21:00");

  // Signatures
  const [landlordSignature, setLandlordSignature] = useState<string | null>(null);
  const [tenantSignature, setTenantSignature] = useState<string | null>(null);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!landlordName.trim()) errors.landlordName = "Nombre del arrendador requerido";
    if (!landlordNif.trim()) errors.landlordNif = "NIF del arrendador requerido";
    if (!landlordAddress.trim()) errors.landlordAddress = "Dirección del arrendador requerida";
    if (!tenantName.trim()) errors.tenantName = "Nombre del arrendatario requerido";
    if (!tenantNif.trim()) errors.tenantNif = "NIF del arrendatario requerido";
    if (!tenantAddress.trim()) errors.tenantAddress = "Dirección del arrendatario requerida";
    if (rentalPrice <= 0) errors.rentalPrice = "Precio de alquiler debe ser mayor a 0";
    if (!checkInDate) errors.checkInDate = "Fecha de entrada requerida";
    if (!checkInTime) errors.checkInTime = "Hora de entrada requerida";
    if (!checkOutDate) errors.checkOutDate = "Fecha de salida requerida";
    if (!checkOutTime) errors.checkOutTime = "Hora de salida requerida";
    if (!landlordSignature) errors.landlordSignature = "Firma del arrendador requerida";
    if (!tenantSignature) errors.tenantSignature = "Firma del arrendatario requerida";

    return errors;
  }, [
    landlordName, landlordNif, landlordAddress,
    tenantName, tenantNif, tenantAddress,
    rentalPrice, checkInDate, checkInTime, checkOutDate, checkOutTime,
    landlordSignature, tenantSignature,
  ]);

  const isFormValid = Object.keys(validationErrors).length === 0;
  const errorCount = Object.keys(validationErrors).length;

  const handleBack = () => {
    router.push(`/propiedades/${data.listing.listingId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(`Faltan ${errorCount} campos obligatorios`);
      return;
    }

    setIsLoading(true);
    try {
      // For now, use the existing createArrasContractAction
      // This would need to be updated to handle rental contracts differently
      const result = await createArrasContractAction({
        dealId: data.deal.dealId,
        listingId: data.deal.listingId,
        sellerName: landlordName,
        sellerNif: landlordNif,
        sellerAddress: landlordAddress,
        sellerPhone: landlordPhone ?? undefined,
        sellerEmail: landlordEmail ?? undefined,
        buyerName: tenantName,
        buyerNif: tenantNif,
        buyerAddress: tenantAddress,
        buyerPhone: tenantPhone ?? undefined,
        buyerEmail: tenantEmail ?? undefined,
        totalPrice: rentalPrice,
        arrasAmount: deposit,
        arrasType: "penitenciales",
        paymentMethod: "transferencia",
        signingDate: new Date(),
        signingLocation: data.property.city ?? "",
        deedDeadline: new Date(checkOutDate),
        hasFinancingCondition: false,
        specialConditions: `Entrada: ${checkInDate} ${checkInTime} / Salida: ${checkOutDate} ${checkOutTime}`,
        sellerSignature: landlordSignature!,
        buyerSignature: tenantSignature!,
        gdprConsent: true,
      });

      if (result.success) {
        toast.success("Contrato de alquiler creado correctamente");
        router.push(`/propiedades/${data.listing.listingId}`);
      } else {
        toast.error(result.error ?? "Error al crear el contrato");
      }
    } catch (error) {
      console.error("Error creating rental contract:", error);
      toast.error("Error al crear el contrato de alquiler");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch("/api/contrato-arras/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: data.deal.dealId.toString(),
          saveToS3: false,
          formData: {
            sellerName: landlordName,
            sellerNif: landlordNif,
            sellerAddress: landlordAddress,
            buyerName: tenantName,
            buyerNif: tenantNif,
            buyerAddress: tenantAddress,
            totalPrice: rentalPrice,
            arrasAmount: deposit,
            arrasType: "penitenciales",
            paymentMethod: "transferencia",
            signingDate: new Date(),
            signingLocation: data.property.city ?? "",
            deedDeadline: new Date(checkOutDate),
            hasFinancingCondition: false,
            specialConditions: `Entrada: ${checkInDate} ${checkInTime} / Salida: ${checkOutDate} ${checkOutTime}`,
            gdprConsent: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar el PDF");
      }

      const pdfBlob = await response.blob();
      const filename = `contrato-alquiler-${data.property.referenceNumber ?? data.deal.dealId}.pdf`;
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ArrasBreadcrumb
          listingId={data.listing.listingId.toString()}
          propertyRef={data.property.referenceNumber ?? undefined}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Contrato de Alquiler
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            {data.property.street ?? "Propiedad"} - Ref: {data.property.referenceNumber}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-8">
          {/* Parties Section */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Partes del Contrato
            </h2>

            {/* Landlord (Arrendador) */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Parte Arrendadora
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="landlordName">Nombre completo *</Label>
                  <Input
                    id="landlordName"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="landlordNif">NIF/DNI/NIE *</Label>
                  <Input
                    id="landlordNif"
                    value={landlordNif}
                    onChange={(e) => setLandlordNif(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="landlordAddress">Dirección completa *</Label>
                  <Input
                    id="landlordAddress"
                    value={landlordAddress}
                    onChange={(e) => setLandlordAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="landlordPhone">Teléfono</Label>
                  <Input
                    id="landlordPhone"
                    value={landlordPhone}
                    onChange={(e) => setLandlordPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="landlordEmail">Email</Label>
                  <Input
                    id="landlordEmail"
                    type="email"
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tenant (Arrendatario) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Parte Arrendataria
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tenantName">Nombre completo *</Label>
                  <Input
                    id="tenantName"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tenantNif">NIF/DNI/NIE *</Label>
                  <Input
                    id="tenantNif"
                    value={tenantNif}
                    onChange={(e) => setTenantNif(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="tenantAddress">Dirección completa *</Label>
                  <Input
                    id="tenantAddress"
                    value={tenantAddress}
                    onChange={(e) => setTenantAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tenantPhone">Teléfono</Label>
                  <Input
                    id="tenantPhone"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenantEmail">Email</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Detalles del Alquiler
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="rentalPrice">Precio Alquiler (EUR) *</Label>
                <Input
                  id="rentalPrice"
                  type="number"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deposit">Fianza (EUR) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Check-in / Check-out */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Fechas y Horarios
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="checkInDate">Fecha de Entrada *</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkInTime">Hora de Entrada *</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkOutDate">Fecha de Salida *</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Hora de Salida *</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Firmas</h2>
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <SignaturePad
                label="Firma del Arrendador"
                onSignatureChange={setLandlordSignature}
                required
              />
              <SignaturePad
                label="Firma del Arrendatario"
                onSignatureChange={setTenantSignature}
                required
              />
            </div>
            <p className="text-center text-xs text-gray-600">
              Ambas partes deben firmar para completar el contrato.
            </p>
          </div>

          {/* Validation Warning */}
          {!isFormValid && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">
                  Faltan {errorCount} campo{errorCount > 1 ? "s" : ""} obligatorio{errorCount > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="mt-2 list-inside list-disc text-xs text-amber-700">
                {Object.values(validationErrors).slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {errorCount > 5 && <li>...y {errorCount - 5} más</li>}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-4 flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-lg sm:flex-row sm:flex-wrap sm:gap-3">
            <div className="flex flex-col gap-3 sm:order-2 sm:ml-auto sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={() => {
                  window.open(
                    `/templates/contrato-arras/${data.deal.dealId}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                disabled={isGeneratingPdf || isLoading}
              >
                <Eye className="h-4 w-4" />
                <span>Vista Previa</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || isLoading}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:order-1 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full sm:w-auto sm:min-w-[150px]"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Firmar Contrato
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Main Export - Conditionally renders ToriPark or standard Arras form
// ============================================================================
export function ArrasContractForm({ data }: ArrasContractFormProps) {
  // Check if this is ToriPark account - show simplified rental form
  if (data.accountId === TORIPARK_ACCOUNT_ID) {
    return <ToriParkRentalForm data={data} />;
  }

  // Standard Arras Contract Form for all other accounts
  return <StandardArrasContractForm data={data} />;
}

// ============================================================================
// Standard Arras Contract Form (Original)
// ============================================================================
function StandardArrasContractForm({ data }: ArrasContractFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Form state
  const [sellerName, setSellerName] = useState(
    data.seller
      ? `${data.seller.firstName} ${data.seller.lastName ?? ""}`.trim()
      : "",
  );
  const [sellerNif, setSellerNif] = useState(data.seller?.nif ?? "");
  const [sellerAddress, setSellerAddress] = useState(
    data.seller
      ? [data.seller.address, data.seller.postalCode, data.seller.city]
          .filter(Boolean)
          .join(", ")
      : "",
  );
  const [sellerPhone, setSellerPhone] = useState(data.seller?.phone ?? "");
  const [sellerEmail, setSellerEmail] = useState(data.seller?.email ?? "");

  const [buyerName, setBuyerName] = useState(
    `${data.buyer.firstName} ${data.buyer.lastName ?? ""}`.trim(),
  );
  const [buyerNif, setBuyerNif] = useState(data.buyer.nif ?? "");
  const [buyerAddress, setBuyerAddress] = useState(
    [data.buyer.address, data.buyer.postalCode, data.buyer.city]
      .filter(Boolean)
      .join(", "),
  );
  const [buyerPhone, setBuyerPhone] = useState(data.buyer.phone ?? "");
  const [buyerEmail, setBuyerEmail] = useState(data.buyer.email ?? "");

  // Calculate default price from deal or listing
  const defaultPrice = parseFloat(
    data.deal.finalPrice ?? data.listing.price ?? "0",
  );
  const [totalPrice, setTotalPrice] = useState(defaultPrice);
  const [arrasAmount, setArrasAmount] = useState(
    data.deal.arrasAmount ? parseFloat(data.deal.arrasAmount) : defaultPrice * 0.1,
  );
  const [arrasType, setArrasType] = useState<ArrasType>(
    data.deal.arrasType ?? "penitenciales",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia");
  const [bankAccountIban, setBankAccountIban] = useState("");

  // Timeline
  const [signingDate] = useState(new Date());
  const [signingLocation, setSigningLocation] = useState(
    data.property.city ?? "",
  );
  const [deedDeadline, setDeedDeadline] = useState(() => {
    if (data.deal.expectedDeedDate) {
      return data.deal.expectedDeedDate.toISOString().split("T")[0]!;
    }
    // Default to 90 days from now
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split("T")[0]!;
  });
  const [hasFinancingCondition, setHasFinancingCondition] = useState(false);
  const [financingDeadline, setFinancingDeadline] = useState("");

  // Special conditions
  const [specialConditions, setSpecialConditions] = useState(
    data.deal.specialConditions ?? "",
  );

  // Consent
  const [gdprConsent, setGdprConsent] = useState(false);

  // Signatures
  const [sellerSignature, setSellerSignature] = useState<string | null>(null);
  const [buyerSignature, setBuyerSignature] = useState<string | null>(null);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDocumentUrl, setShareDocumentUrl] = useState<string | null>(null);

  // Validation logic for full form (including signatures)
  const validationErrors = useMemo((): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!sellerName.trim()) {
      errors.sellerName = "Nombre del vendedor requerido";
    }
    if (!sellerNif.trim()) {
      errors.sellerNif = "NIF del vendedor requerido";
    }
    if (!sellerAddress.trim()) {
      errors.sellerAddress = "Direccion del vendedor requerida";
    }
    if (!buyerName.trim()) {
      errors.buyerName = "Nombre del comprador requerido";
    }
    if (!buyerNif.trim()) {
      errors.buyerNif = "NIF del comprador requerido";
    }
    if (!buyerAddress.trim()) {
      errors.buyerAddress = "Direccion del comprador requerida";
    }
    if (totalPrice <= 0) {
      errors.totalPrice = "Precio total debe ser mayor a 0";
    }
    if (arrasAmount <= 0) {
      errors.arrasAmount = "Importe de arras debe ser mayor a 0";
    }
    if (!signingLocation.trim()) {
      errors.signingLocation = "Lugar de firma requerido";
    }
    if (!deedDeadline) {
      errors.deedDeadline = "Fecha limite de escritura requerida";
    }
    if (!sellerSignature) {
      errors.sellerSignature = "Firma del vendedor requerida";
    }
    if (!buyerSignature) {
      errors.buyerSignature = "Firma del comprador requerida";
    }

    return errors;
  }, [
    sellerName,
    sellerNif,
    sellerAddress,
    buyerName,
    buyerNif,
    buyerAddress,
    totalPrice,
    arrasAmount,
    signingLocation,
    deedDeadline,
    sellerSignature,
    buyerSignature,
  ]);

  // Validation for download (without signatures)
  const downloadValidationErrors = useMemo((): Omit<ValidationErrors, "sellerSignature" | "buyerSignature"> => {
    const errors: Omit<ValidationErrors, "sellerSignature" | "buyerSignature"> = {};

    if (!sellerName.trim()) {
      errors.sellerName = "Nombre del vendedor requerido";
    }
    if (!sellerNif.trim()) {
      errors.sellerNif = "NIF del vendedor requerido";
    }
    if (!sellerAddress.trim()) {
      errors.sellerAddress = "Direccion del vendedor requerida";
    }
    if (!buyerName.trim()) {
      errors.buyerName = "Nombre del comprador requerido";
    }
    if (!buyerNif.trim()) {
      errors.buyerNif = "NIF del comprador requerido";
    }
    if (!buyerAddress.trim()) {
      errors.buyerAddress = "Direccion del comprador requerida";
    }
    if (totalPrice <= 0) {
      errors.totalPrice = "Precio total debe ser mayor a 0";
    }
    if (arrasAmount <= 0) {
      errors.arrasAmount = "Importe de arras debe ser mayor a 0";
    }
    if (!signingLocation.trim()) {
      errors.signingLocation = "Lugar de firma requerido";
    }
    if (!deedDeadline) {
      errors.deedDeadline = "Fecha limite de escritura requerida";
    }

    return errors;
  }, [
    sellerName,
    sellerNif,
    sellerAddress,
    buyerName,
    buyerNif,
    buyerAddress,
    totalPrice,
    arrasAmount,
    signingLocation,
    deedDeadline,
  ]);

  const isFormValid = Object.keys(validationErrors).length === 0;
  const isDownloadValid = Object.keys(downloadValidationErrors).length === 0;
  const errorCount = Object.keys(validationErrors).length;
  const downloadErrorCount = Object.keys(downloadValidationErrors).length;

  // Log validation errors for debugging
  const logValidationErrors = () => {
    if (!isFormValid) {
      console.error("📋 [ArrasContract] Validation errors:", validationErrors);
      const errorMessages = Object.values(validationErrors).join(", ");
      toast.error(`Faltan campos obligatorios: ${errorMessages}`);
    }
  };

  // Log download validation errors
  const logDownloadValidationErrors = () => {
    if (!isDownloadValid) {
      console.error("📋 [ArrasContract] Download validation errors:", downloadValidationErrors);
      const errorMessages = Object.values(downloadValidationErrors).join(", ");
      toast.error(`Faltan campos obligatorios: ${errorMessages}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("📝 [ArrasContract] Submit initiated", {
      dealId: data.deal.dealId.toString(),
      isFormValid,
      errorCount,
    });

    if (!isFormValid) {
      logValidationErrors();
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 [ArrasContract] Calling createArrasContractAction...");
      const result = await createArrasContractAction({
        dealId: data.deal.dealId,
        listingId: data.deal.listingId,
        sellerName,
        sellerNif,
        sellerAddress,
        sellerPhone: sellerPhone ?? undefined,
        sellerEmail: sellerEmail ?? undefined,
        buyerName,
        buyerNif,
        buyerAddress,
        buyerPhone: buyerPhone ?? undefined,
        buyerEmail: buyerEmail ?? undefined,
        totalPrice,
        arrasAmount,
        arrasType,
        paymentMethod,
        bankAccountIban: bankAccountIban ?? undefined,
        signingDate,
        signingLocation,
        deedDeadline: new Date(deedDeadline),
        hasFinancingCondition,
        financingDeadline: financingDeadline ? new Date(financingDeadline) : undefined,
        specialConditions: specialConditions ?? undefined,
        sellerSignature: sellerSignature!, // Validated in isFormValid
        buyerSignature: buyerSignature!, // Validated in isFormValid
        gdprConsent,
      });

      if (result.success) {
        console.log("✅ [ArrasContract] Contract created successfully", {
          dealId: result.dealId?.toString(),
        });
        toast.success("Contrato de arras creado correctamente");

        // Generate PDF
        try {
          console.log("📄 [ArrasContract] Generating PDF...");
          const response = await fetch("/api/contrato-arras/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dealId: data.deal.dealId.toString(),
              saveToS3: true,
            }),
          });

          if (response.ok) {
            const pdfData = (await response.json()) as {
              success: boolean;
              documentUrl: string;
            };

            if (pdfData.success && pdfData.documentUrl) {
              setShareDocumentUrl(pdfData.documentUrl);
              setShareModalOpen(true);
              toast.success("Documento generado. Puedes compartirlo.");
            } else {
              router.push(`/propiedades/${data.listing.listingId}`);
            }
          } else {
            toast.info("Contrato guardado, pero no se pudo generar el PDF");
            router.push(`/propiedades/${data.listing.listingId}`);
          }
        } catch (pdfError) {
          console.error("❌ [ArrasContract] PDF generation error:", pdfError);
          toast.info("Contrato guardado, pero no se pudo generar el PDF");
          router.push(`/propiedades/${data.listing.listingId}`);
        }
      } else {
        console.error("❌ [ArrasContract] Contract creation failed:", result.error);
        toast.error(result.error ?? "Error al crear el contrato");
      }
    } catch (error) {
      console.error("❌ [ArrasContract] Error submitting arras contract:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error("Error al crear el contrato de arras");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/propiedades/${data.listing.listingId}`);
  };

  const handleGeneratePdf = async () => {
    console.log("📄 [ArrasContract] Generate PDF initiated", { isDownloadValid, downloadErrorCount });

    if (!isDownloadValid) {
      logDownloadValidationErrors();
      return;
    }

    setIsGeneratingPdf(true);
    try {
      console.log("📤 [ArrasContract] Fetching PDF from API...");
      const response = await fetch("/api/contrato-arras/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: data.deal.dealId.toString(),
          saveToS3: false,
          formData: {
            sellerName,
            sellerNif,
            sellerAddress,
            buyerName,
            buyerNif,
            buyerAddress,
            totalPrice,
            arrasAmount,
            arrasType,
            paymentMethod,
            bankAccountIban,
            signingDate,
            signingLocation,
            deedDeadline: new Date(deedDeadline),
            hasFinancingCondition,
            financingDeadline: financingDeadline ? new Date(financingDeadline) : undefined,
            specialConditions,
            gdprConsent,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Error al generar el PDF");
      }

      const pdfBlob = await response.blob();
      const filename = `contrato-arras-${data.property.referenceNumber ?? data.deal.dealId}.pdf`;
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);

      console.log("✅ [ArrasContract] PDF generated successfully");
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("❌ [ArrasContract] PDF generation error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error(
        `Error al generar el PDF: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    console.log("📤 [ArrasContract] Share initiated", { isFormValid, errorCount });

    if (!isFormValid) {
      logValidationErrors();
      return;
    }

    setIsSharing(true);
    try {
      console.log("📄 [ArrasContract] Generating PDF for sharing...");
      const response = await fetch("/api/contrato-arras/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: data.deal.dealId.toString(),
          saveToS3: true,
          formData: {
            sellerName,
            sellerNif,
            sellerAddress,
            buyerName,
            buyerNif,
            buyerAddress,
            totalPrice,
            arrasAmount,
            arrasType,
            paymentMethod,
            bankAccountIban,
            signingDate,
            signingLocation,
            deedDeadline: new Date(deedDeadline),
            hasFinancingCondition,
            financingDeadline: financingDeadline ? new Date(financingDeadline) : undefined,
            specialConditions,
            gdprConsent,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Error al generar el PDF");
      }

      const pdfData = (await response.json()) as {
        success: boolean;
        documentUrl: string;
      };

      if (!pdfData.success || !pdfData.documentUrl) {
        throw new Error("No se pudo obtener la URL del documento");
      }

      setShareDocumentUrl(pdfData.documentUrl);
      setShareModalOpen(true);
      console.log("✅ [ArrasContract] PDF generated for sharing, URL:", pdfData.documentUrl);
      toast.success("PDF generado. Selecciona como compartirlo.");
    } catch (error) {
      console.error("❌ [ArrasContract] Share PDF generation error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error(
        `Error al generar el PDF: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ArrasBreadcrumb
          listingId={data.listing.listingId.toString()}
          propertyRef={data.property.referenceNumber ?? undefined}
        />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Contrato de Arras
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            {data.property.street ?? "Propiedad"} - Ref: {data.property.referenceNumber}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-8">
          {/* Parties Section */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Partes del Contrato
            </h2>

            {/* Seller */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Vendedor (Parte Vendedora)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sellerName">Nombre completo *</Label>
                  <Input
                    id="sellerName"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellerNif">NIF/DNI/NIE *</Label>
                  <Input
                    id="sellerNif"
                    value={sellerNif}
                    onChange={(e) => setSellerNif(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="sellerAddress">Direccion completa *</Label>
                  <Input
                    id="sellerAddress"
                    value={sellerAddress}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellerPhone">Telefono</Label>
                  <Input
                    id="sellerPhone"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sellerEmail">Email</Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Comprador (Parte Compradora)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="buyerName">Nombre completo *</Label>
                  <Input
                    id="buyerName"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="buyerNif">NIF/DNI/NIE *</Label>
                  <Input
                    id="buyerNif"
                    value={buyerNif}
                    onChange={(e) => setBuyerNif(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="buyerAddress">Direccion completa *</Label>
                  <Input
                    id="buyerAddress"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="buyerPhone">Telefono</Label>
                  <Input
                    id="buyerPhone"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="buyerEmail">Email</Label>
                  <Input
                    id="buyerEmail"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Section (read-only) */}
          <div className="space-y-3 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Inmueble</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-gray-500">Direccion</Label>
                <p className="rounded bg-gray-50 p-2 text-sm">
                  {[
                    data.property.street,
                    data.property.addressDetails,
                    data.property.postalCode,
                    data.property.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Referencia Catastral</Label>
                <p className="rounded bg-gray-50 p-2 text-sm">
                  {data.property.cadastralReference ?? "No especificada"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Superficie</Label>
                <p className="rounded bg-gray-50 p-2 text-sm">
                  {data.property.builtSurfaceArea ??
                    data.property.squareMeters?.toString() ??
                    "No especificada"}{" "}
                  m2
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Tipo</Label>
                <p className="rounded bg-gray-50 p-2 text-sm">
                  {data.property.propertyType ?? "No especificado"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Section */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Condiciones Economicas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="totalPrice">Precio total (EUR) *</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  value={totalPrice}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setTotalPrice(price);
                    setArrasAmount(price * 0.1);
                  }}
                  min="0"
                  step="1000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="arrasAmount">Importe arras (EUR) *</Label>
                <Input
                  id="arrasAmount"
                  type="number"
                  value={arrasAmount}
                  onChange={(e) => setArrasAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="100"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {totalPrice > 0
                    ? `${((arrasAmount / totalPrice) * 100).toFixed(1)}% del precio`
                    : ""}
                </p>
              </div>
              <div>
                <Label htmlFor="arrasType">Tipo de arras *</Label>
                <Select value={arrasType} onValueChange={(v) => setArrasType(v as ArrasType)}>
                  <SelectTrigger id="arrasType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penitenciales">
                      Penitenciales (mas comunes)
                    </SelectItem>
                    <SelectItem value="confirmatorias">
                      Confirmatorias
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">
                  {arrasType === "penitenciales"
                    ? "Permite desistimiento con penalizacion"
                    : "Vinculante - requiere cumplimiento"}
                </p>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Forma de pago *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                    <SelectItem value="cheque">Cheque nominativo</SelectItem>
                    <SelectItem value="cheque_bancario">Cheque bancario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bankAccountIban">IBAN cuenta destino</Label>
                <Input
                  id="bankAccountIban"
                  value={bankAccountIban}
                  onChange={(e) => setBankAccountIban(e.target.value)}
                  placeholder="ES00 0000 0000 0000 0000 0000"
                />
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Plazos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="signingLocation">Lugar de firma *</Label>
                <Input
                  id="signingLocation"
                  value={signingLocation}
                  onChange={(e) => setSigningLocation(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deedDeadline">Fecha limite escritura *</Label>
                <Input
                  id="deedDeadline"
                  type="date"
                  value={deedDeadline}
                  onChange={(e) => setDeedDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasFinancingCondition"
                    checked={hasFinancingCondition}
                    onCheckedChange={(checked) =>
                      setHasFinancingCondition(checked === true)
                    }
                  />
                  <Label htmlFor="hasFinancingCondition" className="text-sm">
                    Condicion suspensiva de financiacion hipotecaria
                  </Label>
                </div>
              </div>
              {hasFinancingCondition && (
                <div className="sm:col-span-2">
                  <Label htmlFor="financingDeadline">
                    Fecha limite para obtener financiacion
                  </Label>
                  <Input
                    id="financingDeadline"
                    type="date"
                    value={financingDeadline}
                    onChange={(e) => setFinancingDeadline(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Special Conditions */}
          <div className="space-y-3 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Condiciones Especiales
            </h2>
            <Textarea
              value={specialConditions}
              onChange={(e) => setSpecialConditions(e.target.value)}
              placeholder="Condiciones adicionales del contrato..."
              rows={3}
            />
          </div>

          {/* GDPR Consent */}
          <div className="space-y-3 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">
              Proteccion de Datos
            </h2>
            <p className="text-xs text-gray-600">
              De conformidad con el REGLAMENTO (UE) 2016/679, los datos facilitados
              seran tratados para gestionar la presente operacion inmobiliaria.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gdprConsent"
                checked={gdprConsent}
                onCheckedChange={(checked) => setGdprConsent(checked === true)}
              />
              <Label htmlFor="gdprConsent" className="text-sm">
                Autorizo comunicaciones comerciales
              </Label>
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-5">
            <h2 className="text-base font-semibold text-gray-900">Firmas</h2>
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <SignaturePad
                label="Firma del Vendedor"
                onSignatureChange={setSellerSignature}
                required
              />
              <SignaturePad
                label="Firma del Comprador"
                onSignatureChange={setBuyerSignature}
                required
              />
            </div>
            <p className="text-center text-xs text-gray-600">
              Ambas partes deben firmar para completar el contrato.
            </p>
          </div>

          {/* Validation Warning */}
          {!isFormValid && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">
                  Faltan {errorCount} campo{errorCount > 1 ? "s" : ""} obligatorio{errorCount > 1 ? "s" : ""}
                </p>
              </div>
              <ul className="mt-2 list-inside list-disc text-xs text-amber-700">
                {Object.values(validationErrors).slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {errorCount > 5 && (
                  <li>...y {errorCount - 5} mas</li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-4 flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-lg sm:flex-row sm:flex-wrap sm:gap-3">
            <div className="flex flex-col gap-3 sm:order-2 sm:ml-auto sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={() => {
                  window.open(
                    `/templates/contrato-arras/${data.deal.dealId}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                disabled={isGeneratingPdf || isLoading || isSharing}
              >
                <Eye className="h-4 w-4" />
                <span>Vista Previa</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={handleGeneratePdf}
                disabled={!isDownloadValid || isGeneratingPdf || isLoading || isSharing}
                title={!isDownloadValid ? "Completa los campos obligatorios (sin firmas)" : undefined}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                onClick={handleShare}
                disabled={!isFormValid || isSharing || isLoading || isGeneratingPdf}
                title={!isFormValid ? "Completa todos los campos obligatorios" : undefined}
              >
                {isSharing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Compartiendo...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Compartir</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:order-1 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full sm:w-auto sm:min-w-[150px]"
                title={!isFormValid ? "Completa todos los campos obligatorios" : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Firmar Contrato
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Share Modal */}
        {shareDocumentUrl && (
          <ShareArrasPdfModal
            open={shareModalOpen}
            onOpenChange={(open) => {
              setShareModalOpen(open);
              if (!open) {
                router.push(`/propiedades/${data.listing.listingId}`);
              }
            }}
            documentUrl={shareDocumentUrl}
            contractData={{
              sellerName,
              sellerPhone,
              sellerEmail,
              buyerName,
              buyerPhone,
              buyerEmail,
              propertyAddress: data.property.street ?? "Propiedad",
              arrasAmount: arrasAmount.toString(),
              totalPrice: totalPrice.toString(),
            }}
          />
        )}
      </div>
    </div>
  );
}
