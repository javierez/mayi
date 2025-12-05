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
import { sendSMS, openWhatsApp, copyToClipboard } from "~/lib/share-utils";
import type { ProspectMatch } from "~/types/connection-matches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ConfirmPublishDialog } from "../propiedades/confirm-publish-dialog";
import { getSquareMeter } from "~/lib/properties/area-utils";

interface ShareListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: ProspectMatch;
  accountWebsite?: string | null;
  onPublishToggled?: () => void;
}

export function ShareListingModal({
  open,
  onOpenChange,
  match,
  accountWebsite,
  onPublishToggled,
}: ShareListingModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [messageFormat, setMessageFormat] = useState<
    "simple" | "medium" | "detailed"
  >("detailed");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(
    Boolean(match.listing.listings.publishToWebsite),
  );

  useEffect(() => {
    if (open && !isPublished) {
      setShowConfirmDialog(true);
      onOpenChange(false);
    }
  }, [open, isPublished, onOpenChange]);

  const handlePublishConfirmed = () => {
    setIsPublished(true);
    onPublishToggled?.();
    onOpenChange(true);
  };

  const { listing, prospect } = match;
  const contact = prospect.contacts;
  const property = listing.properties;
  const listingType =
    listing.listings.listingType === "Sale" ? "Venta" : "Alquiler";
  const price = parseFloat(listing.listings.price);

  // Property summary for share message
  const propertyTitle = property.title ?? "Propiedad sin título";
  const propertyLocation =
    listing.locations.neighborhood ?? "Ubicación no especificada";
  const propertyPrice =
    listingType === "Venta"
      ? `${Math.round(price / 1000)}k €`
      : `${price.toLocaleString()} €/mes`;

  const propertyDetails = `${listingType} de ${propertyTitle}`;
  const propertyInfo = `${property.bedrooms ?? "-"} hab, ${property.bathrooms ? Math.floor(Number(property.bathrooms)) : "-"} baños, ${getSquareMeter(property) ?? "-"}m²`;

  // Generate property URL using account website
  const baseUrl = accountWebsite ?? window.location.origin;
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const propertyUrl = `${cleanBaseUrl}/propiedades/${listing.listings.id.toString()}`;

  // Generate message based on format
  const generateMessage = (format: "simple" | "medium" | "detailed"): string => {
    const firstName = contact.firstName ?? "Cliente";

    switch (format) {
      case "simple":
        return `Hola ${firstName}, échale un vistazo: ${propertyUrl}`;

      case "medium":
        return `Hola ${firstName}, te comparto esta propiedad:\n\n${propertyDetails}\n${propertyLocation} - ${propertyPrice}\n\n${propertyUrl}`;

      case "detailed":
        return `Hola ${firstName}, te comparto esta propiedad que podría interesarte:\n\n${propertyDetails}\n📍 Ubicación: ${propertyLocation}\n💰 Precio: ${propertyPrice}\n🏠 Características: ${propertyInfo}\n\nMás información: ${propertyUrl}`;

      default:
        return `Hola ${firstName}, échale un vistazo: ${propertyUrl}`;
    }
  };

  const handleEmailShare = () => {
    if (!contact.email) {
      toast.error("Este contacto no tiene email registrado");
      return;
    }

    // Construct email subject and body
    const subject = `Propiedad que podría interesarte: ${propertyDetails}`;
    const body = generateMessage(messageFormat);

    // Create mailto link
    const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    toast.success("Se ha abierto tu cliente de email");
  };

  const handleSMSShare = () => {
    if (!contact.phone) {
      toast.error("Este contacto no tiene número de teléfono registrado");
      return;
    }

    const message = generateMessage(messageFormat);
    sendSMS(contact.phone, message);
    toast.success("Se ha abierto tu aplicación de mensajes");
  };

  const handleWhatsAppShare = () => {
    if (!contact.phone) {
      toast.error("Este contacto no tiene número de teléfono registrado");
      return;
    }

    const message = generateMessage(messageFormat);
    openWhatsApp(contact.phone, message);
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
        listingId={Number(listing.listings.id)}
        onConfirm={handlePublishConfirmed}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Propiedad</DialogTitle>
          <DialogDescription>
            Comparte esta propiedad con {contact.firstName} {contact.lastName}
          </DialogDescription>
        </DialogHeader>

        {/* Contact Info */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{contact.email}</p>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-xs text-gray-600">{contact.phone}</p>
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
            disabled={!contact.email}
          >
            <Mail className="h-5 w-5" />
            <span className="text-xs">Email</span>
          </Button>

          {/* SMS */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleSMSShare}
            disabled={!contact.phone}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">SMS</span>
          </Button>

          {/* WhatsApp */}
          <Button
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
            onClick={handleWhatsAppShare}
            disabled={!contact.phone}
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
            onValueChange={(value) =>
              setMessageFormat(value as "simple" | "medium" | "detailed")
            }
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
