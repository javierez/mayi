"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  openWhatsAppGeneric,
  sendSMSGeneric,
  openEmailGeneric,
  copyToClipboard,
} from "~/lib/share-utils";
import { formatPrice } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ConfirmPublishDialog } from "./confirm-publish-dialog";
import { getSquareMeter } from "~/lib/properties/area-utils";

interface SharePropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    listingId: bigint;
    title?: string | null;
    referenceNumber?: string | null;
    city?: string | null;
    price: string;
    bedrooms: number | null;
    bathrooms: string | null;
    squareMeter: number | null;
    builtSurfaceArea?: number | null;
    publishToWebsite?: boolean | null;
  };
  accountWebsite?: string | null;
  onPublishToggled?: () => void;
}

type MessageFormat = "simple" | "medium" | "detailed";

export function SharePropertyModal({
  open,
  onOpenChange,
  property,
  accountWebsite,
  onPublishToggled,
}: SharePropertyModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [messageFormat, setMessageFormat] =
    useState<MessageFormat>("medium");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Derive isPublished from props to avoid state staleness
  const isPublished = property.publishToWebsite ?? false;

  useEffect(() => {
    if (open && !isPublished) {
      setShowConfirmDialog(true);
      onOpenChange(false);
    }
  }, [open, isPublished, onOpenChange]);

  const handlePublishConfirmed = () => {
    if (onPublishToggled) {
      onPublishToggled();
    }
    onOpenChange(true);
  };

  // Build property URL
  const baseUrl = accountWebsite ?? window.location.origin;
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const propertyUrl = `${cleanBaseUrl}/propiedades/${property.listingId}`;

  // Generate share messages based on format
  const generateMessage = (format: MessageFormat): string => {
    const ref = property.referenceNumber ?? "REF";
    const title = property.title ?? "Propiedad";
    const city = property.city ?? "";
    const price = property.price ? `${formatPrice(Number(property.price))}€` : "";
    const beds = property.bedrooms ?? 0;
    const baths = property.bathrooms
      ? Math.floor(Number(property.bathrooms))
      : 0;
    const sqm = getSquareMeter(property) ?? 0;

    switch (format) {
      case "simple":
        return `Échale un vistazo: ${propertyUrl}`;

      case "medium":
        return `${ref} - ${city ? `${city} - ` : ""}${price}\n\n${propertyUrl}`;

      case "detailed":
        return `🏡 ${title}\n${city ? `📍 ${city}\n` : ""}${price ? `💰 ${price}\n` : ""}${beds > 0 ? `🛏️ ${beds} dorm` : ""}${beds > 0 && baths > 0 ? " • " : ""}${baths > 0 ? `🚿 ${baths} baños` : ""}${sqm > 0 ? ` • 📐 ${sqm}m²` : ""}\n\n${propertyUrl}`;

      default:
        return `Échale un vistazo: ${propertyUrl}`;
    }
  };

  const emailSubject = `${property.referenceNumber ?? "Propiedad"} - ${property.city ?? ""}`;

  const handleEmailShare = () => {
    const message = generateMessage(messageFormat);
    openEmailGeneric(emailSubject, message);
    toast.success("Se ha abierto tu cliente de email");
  };

  const handleSMSShare = () => {
    const message = generateMessage(messageFormat);
    sendSMSGeneric(message);
    toast.success("Se ha abierto tu aplicación de mensajes");
  };

  const handleWhatsAppShare = () => {
    const message = generateMessage(messageFormat);
    openWhatsAppGeneric(message);
    toast.success("Se ha abierto WhatsApp con el mensaje preparado");
  };

  const handleCopyInfo = async () => {
    try {
      const message = generateMessage(messageFormat);
      await copyToClipboard(message);
      setIsCopied(true);
      toast.success("Información copiada al portapapeles");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("No se pudo copiar la información");
    }
  };

  return (
    <>
      <ConfirmPublishDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        listingId={Number(property.listingId)}
        onConfirm={handlePublishConfirmed}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Propiedad</DialogTitle>
          <DialogDescription>
            Selecciona el formato del mensaje y cómo compartirlo
          </DialogDescription>
        </DialogHeader>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Email */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleEmailShare}
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">Email</span>
          </Button>

          {/* SMS */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleSMSShare}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">SMS</span>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleWhatsAppShare}
          >
            <MessageSquare className="h-5 w-5" />
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

        {/* Message Format Selector */}
        <div className="space-y-2">
          <Select
            value={messageFormat}
            onValueChange={(value) => setMessageFormat(value as MessageFormat)}
          >
            <SelectTrigger className="h-9 border-gray-300">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="medium">Medio</SelectItem>
              <SelectItem value="detailed">Detallado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message Preview */}
        <div className="rounded-2xl bg-green-50 p-3 shadow-md">
          <p className="whitespace-pre-wrap text-xs text-gray-900">
            {generateMessage(messageFormat)}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
