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
  Copy,
  FileText,
  Check,
  Home,
  Percent,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { sendSMS, openWhatsApp, copyToClipboard } from "~/lib/share-utils";

interface ShareHojaEncargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  contractData: {
    ownerName: string;
    ownerPhone?: string;
    ownerEmail?: string;
    propertyAddress: string;
    commissionPercentage: string;
    durationMonths: string;
  };
}

export function ShareHojaEncargoModal({
  open,
  onOpenChange,
  documentUrl,
  contractData,
}: ShareHojaEncargoModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const {
    ownerName,
    ownerPhone,
    ownerEmail,
    propertyAddress,
    commissionPercentage,
    durationMonths,
  } = contractData;

  const shareMessage = `Hola ${ownerName},

Te envio la hoja de encargo firmada para la propiedad:

📍 ${propertyAddress}
📊 Comision: ${commissionPercentage}%
📅 Duracion: ${durationMonths} meses

Puedes descargar el documento aqui:
${documentUrl}

Saludos cordiales`;

  const emailSubject = `Hoja de Encargo - ${propertyAddress}`;

  const handleEmailShare = () => {
    if (!ownerEmail) {
      toast.error("El propietario no tiene email registrado");
      return;
    }

    const mailtoLink = `mailto:${ownerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;
    window.location.href = mailtoLink;
    toast.success("Se ha abierto tu cliente de email");
  };

  const handleSMSShare = () => {
    if (!ownerPhone) {
      toast.error("El propietario no tiene numero de telefono registrado");
      return;
    }

    sendSMS(ownerPhone, shareMessage);
    toast.success("Se ha abierto tu aplicacion de mensajes");
  };

  const handleWhatsAppShare = () => {
    if (!ownerPhone) {
      toast.error("El propietario no tiene numero de telefono registrado");
      return;
    }

    openWhatsApp(ownerPhone, shareMessage);
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
          <DialogTitle>Compartir Hoja de Encargo</DialogTitle>
          <DialogDescription>
            Comparte la hoja de encargo con el propietario
          </DialogDescription>
        </DialogHeader>

        {/* Contract Summary */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Resumen del documento
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>{propertyAddress || "Propiedad"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span>Comision: {commissionPercentage}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Duracion: {durationMonths} meses</span>
            </div>
          </div>
        </div>

        {/* Owner info */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Propietario: {ownerName}
          </h4>
          <div className="space-y-1 text-sm text-gray-500">
            {ownerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{ownerEmail}</span>
              </div>
            )}
            {ownerPhone && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{ownerPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleEmailShare}
            disabled={!ownerEmail}
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSMSShare}
            disabled={!ownerPhone}
          >
            <MessageSquare className="h-4 w-4" />
            SMS
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100"
            onClick={handleWhatsAppShare}
            disabled={!ownerPhone}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCopyInfo}
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
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
