"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Mail,
  MessageSquare,
  Phone,
  Copy,
  FileText,
  Euro,
  Calendar,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { sendSMS, openWhatsApp, copyToClipboard } from "~/lib/share-utils";

interface ShareToriParkPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  contractData: {
    landlordName: string;
    landlordPhone?: string;
    landlordEmail?: string;
    tenantName: string;
    tenantPhone?: string;
    tenantEmail?: string;
    propertyAddress: string;
    rentalPrice: string;
    deposit: string;
    checkInDate: string;
    checkInTime: string;
    checkOutDate: string;
    checkOutTime: string;
  };
}

export function ShareToriParkPdfModal({
  open,
  onOpenChange,
  documentUrl,
  contractData,
}: ShareToriParkPdfModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [shareTarget, setShareTarget] = useState<"landlord" | "tenant">("tenant");

  const {
    landlordName,
    landlordPhone,
    landlordEmail,
    tenantName,
    tenantPhone,
    tenantEmail,
    propertyAddress,
    rentalPrice,
    deposit,
    checkInDate,
    checkInTime,
    checkOutDate,
    checkOutTime,
  } = contractData;

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const currentName = shareTarget === "landlord" ? landlordName : tenantName;
  const currentPhone = shareTarget === "landlord" ? landlordPhone : tenantPhone;
  const currentEmail = shareTarget === "landlord" ? landlordEmail : tenantEmail;

  const shareMessage = `Hola ${currentName},

Te envio el contrato de alquiler para:

📍 ${propertyAddress}
📅 Entrada: ${formatDate(checkInDate)} a las ${checkInTime}
📅 Salida: ${formatDate(checkOutDate)} a las ${checkOutTime}
💶 Alquiler: ${formatCurrency(rentalPrice)}
💰 Fianza: ${formatCurrency(deposit)}

Puedes descargar el documento aqui:
${documentUrl}

Saludos cordiales`;

  const emailSubject = `Contrato de Alquiler - ${propertyAddress}`;

  const handleEmailShare = () => {
    if (!currentEmail) {
      toast.error("Este contacto no tiene email registrado");
      return;
    }

    const mailtoLink = `mailto:${currentEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;
    window.location.href = mailtoLink;
    toast.success("Se ha abierto tu cliente de email");
  };

  const handleSMSShare = () => {
    if (!currentPhone) {
      toast.error("Este contacto no tiene numero de telefono registrado");
      return;
    }

    sendSMS(currentPhone, shareMessage);
    toast.success("Se ha abierto tu aplicacion de mensajes");
  };

  const handleWhatsAppShare = () => {
    if (!currentPhone) {
      toast.error("Este contacto no tiene numero de telefono registrado");
      return;
    }

    openWhatsApp(currentPhone, shareMessage);
    toast.success("Se ha abierto WhatsApp con el mensaje preparado");
  };

  const handleCopyInfo = async () => {
    try {
      await copyToClipboard(shareMessage);
      setIsCopied(true);
      toast.success("Informacion del documento copiada al portapapeles");

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("No se pudo copiar la informacion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Contrato de Alquiler</DialogTitle>
          <DialogDescription>
            Comparte el contrato firmado con las partes
          </DialogDescription>
        </DialogHeader>

        {/* Contract Summary */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Contrato de Alquiler
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-gray-500" />
              <span>{propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              <span>
                {formatDate(checkInDate)} {checkInTime} - {formatDate(checkOutDate)} {checkOutTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="h-3.5 w-3.5 text-gray-500" />
              <span>
                Alquiler: {formatCurrency(rentalPrice)} / Fianza: {formatCurrency(deposit)}
              </span>
            </div>
          </div>
        </div>

        {/* Share Target Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Enviar a:</p>
          <div className="flex gap-2">
            <Button
              variant={shareTarget === "tenant" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareTarget("tenant")}
              className="flex-1"
            >
              Arrendatario
            </Button>
            <Button
              variant={shareTarget === "landlord" ? "default" : "outline"}
              size="sm"
              onClick={() => setShareTarget("landlord")}
              className="flex-1"
            >
              Arrendador
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">{currentName}</p>
          {currentEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{currentEmail}</p>
            </div>
          )}
          {currentPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{currentPhone}</p>
            </div>
          )}
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleEmailShare}
            disabled={!currentEmail}
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">Email</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleSMSShare}
            disabled={!currentPhone}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">SMS</span>
          </Button>

          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleWhatsAppShare}
            disabled={!currentPhone}
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            className={`flex h-20 flex-col items-center justify-center gap-2 transition-all ${
              isCopied ? "border-green-500 bg-green-50 text-green-700" : ""
            }`}
            onClick={handleCopyInfo}
          >
            {isCopied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-xs">
              {isCopied ? "Copiado!" : "Copiar Info"}
            </span>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Ver documento
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
