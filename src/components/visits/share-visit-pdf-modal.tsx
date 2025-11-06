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
  Calendar,
  User,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { sendSMS, openWhatsApp, copyToClipboard } from "~/lib/share-utils";

interface ShareVisitPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  messageType: "draft" | "signed";
  visitData: {
    contactName: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    propertyAddress: string;
    visitDate: string;
    visitTime: string;
    agentName: string;
  };
}

export function ShareVisitPdfModal({
  open,
  onOpenChange,
  documentUrl,
  messageType,
  visitData,
}: ShareVisitPdfModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const {
    contactName,
    contactPhone,
    contactEmail,
    propertyAddress,
    visitDate,
    visitTime,
    agentName,
  } = visitData;

  // Generate share message based on message type
  const shareMessage =
    messageType === "draft"
      ? `Hola ${contactName},

Te comparto la hoja de visita de la propiedad:

📍 ${propertyAddress}
📅 Visita programada: ${visitDate} a las ${visitTime}
👤 Agente: ${agentName}

Puedes ver el documento aquí:
${documentUrl}

Saludos,
${agentName}`
      : `Hola ${contactName},

Te envío el documento firmado de la visita realizada el día ${visitDate}:

📍 Propiedad: ${propertyAddress}
📅 Fecha de visita: ${visitDate} a las ${visitTime}
👤 Agente: ${agentName}

Documento oficial:
${documentUrl}

Gracias por tu confianza.

Saludos cordiales,
${agentName}`;

  const emailSubject =
    messageType === "draft"
      ? `Hoja de visita - ${propertyAddress}`
      : `Documento firmado de visita - ${propertyAddress}`;

  const handleEmailShare = () => {
    if (!contactEmail) {
      toast.error("Este contacto no tiene email registrado");
      return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;

    // Open email client
    window.location.href = mailtoLink;

    toast.success("Se ha abierto tu cliente de email");
  };

  const handleSMSShare = () => {
    if (!contactPhone) {
      toast.error("Este contacto no tiene número de teléfono registrado");
      return;
    }

    sendSMS(contactPhone, shareMessage);
    toast.success("Se ha abierto tu aplicación de mensajes");
  };

  const handleWhatsAppShare = () => {
    if (!contactPhone) {
      toast.error("Este contacto no tiene número de teléfono registrado");
      return;
    }

    openWhatsApp(contactPhone, shareMessage);
    toast.success("Se ha abierto WhatsApp con el mensaje preparado");
  };

  const handleCopyInfo = async () => {
    try {
      await copyToClipboard(shareMessage);
      setIsCopied(true);
      toast.success("Información del documento copiada al portapapeles");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("No se pudo copiar la información");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Documento de Visita</DialogTitle>
          <DialogDescription>
            {messageType === "draft"
              ? "Comparte la hoja de visita con el contacto"
              : "Comparte el documento firmado con el contacto"}
          </DialogDescription>
        </DialogHeader>

        {/* Visit Summary */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            {messageType === "draft"
              ? "Hoja de Visita"
              : "Documento de Visita Firmado"}
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-gray-500" />
              <span>{propertyAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              <span>
                {visitDate} a las {visitTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span>{agentName}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">{contactName}</p>
          {contactEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{contactEmail}</p>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{contactPhone}</p>
            </div>
          )}
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Email */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleEmailShare}
            disabled={!contactEmail}
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">Email</span>
          </Button>

          {/* SMS */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleSMSShare}
            disabled={!contactPhone}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">SMS</span>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleWhatsAppShare}
            disabled={!contactPhone}
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">WhatsApp</span>
          </Button>

          {/* Copy Info */}
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
