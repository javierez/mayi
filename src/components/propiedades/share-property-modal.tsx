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
  Home,
  Euro,
  MapPin,
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
  };
  accountWebsite?: string | null;
}

type MessageFormat = "simple" | "medium" | "detailed";

export function SharePropertyModal({
  open,
  onOpenChange,
  property,
  accountWebsite,
}: SharePropertyModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [messageFormat, setMessageFormat] =
    useState<MessageFormat>("medium");

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
    const sqm = Math.round(
      Number(property.squareMeter ?? property.builtSurfaceArea ?? 0),
    );

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Propiedad</DialogTitle>
          <DialogDescription>
            Selecciona el formato del mensaje y cómo compartirlo
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            {property.title ?? "Propiedad"}
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-gray-500" />
              <span>{property.referenceNumber ?? "Sin referencia"}</span>
            </div>
            {property.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-gray-500" />
                <span>{property.city}</span>
              </div>
            )}
            {property.price && (
              <div className="flex items-center gap-2">
                <Euro className="h-3.5 w-3.5 text-gray-500" />
                <span>{formatPrice(Number(property.price))}€</span>
              </div>
            )}
          </div>
        </div>

        {/* Message Format Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Formato del mensaje
          </label>
          <Select
            value={messageFormat}
            onValueChange={(value) => setMessageFormat(value as MessageFormat)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Simple</span>
                  <span className="text-xs text-muted-foreground">
                    Solo el enlace
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Medio</span>
                  <span className="text-xs text-muted-foreground">
                    Referencia, ciudad y precio
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="detailed">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Detallado</span>
                  <span className="text-xs text-muted-foreground">
                    Información completa con emojis
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-700">Vista previa:</p>
          <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
            {generateMessage(messageFormat)}
          </p>
        </div>

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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
