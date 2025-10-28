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
  MapPin,
  Euro,
  Home,
  Check,
} from "lucide-react";
import { toast } from "~/components/hooks/use-toast";
import { sendSMS, openWhatsApp, copyToClipboard } from "~/lib/share-utils";
import type { ProspectMatch } from "~/types/connection-matches";

interface ShareListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: ProspectMatch;
  accountWebsite?: string | null;
}

export function ShareListingModal({
  open,
  onOpenChange,
  match,
  accountWebsite,
}: ShareListingModalProps) {
  const [isCopied, setIsCopied] = useState(false);

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
  const propertyInfo = `${property.bedrooms ?? "-"} hab, ${property.bathrooms ? Math.floor(Number(property.bathrooms)) : "-"} baños, ${property.squareMeter ?? "-"}m²`;

  // Generate property URL using account website
  const baseUrl = accountWebsite ?? window.location.origin;
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const propertyUrl = `${cleanBaseUrl}/propiedades/${listing.listings.id.toString()}`;

  // Construct share message for SMS/WhatsApp
  const shareMessage = `Hola ${contact.firstName}, te comparto esta propiedad que podría interesarte:\n\n${propertyDetails}\nUbicación: ${propertyLocation}\nPrecio: ${propertyPrice}\nCaracterísticas: ${propertyInfo}\n\nMás información: ${propertyUrl}`;

  const handleEmailShare = () => {
    if (!contact.email) {
      toast({
        title: "Sin email",
        description: "Este contacto no tiene email registrado",
        variant: "destructive",
      });
      return;
    }

    // Construct email subject and body
    const subject = `Propiedad que podría interesarte: ${propertyDetails}`;
    const body = `Hola ${contact.firstName},

Te comparto esta propiedad que podría interesarte:

${propertyDetails}
Ubicación: ${propertyLocation}
Precio: ${propertyPrice}
Características: ${propertyInfo}

Más información: ${propertyUrl}

Saludos`;

    // Create mailto link
    const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    toast({
      title: "Email preparado",
      description: "Se ha abierto tu cliente de email",
    });
  };

  const handleSMSShare = () => {
    if (!contact.phone) {
      toast({
        title: "Sin teléfono",
        description: "Este contacto no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    sendSMS(contact.phone, shareMessage);
    toast({
      title: "SMS preparado",
      description: "Se ha abierto tu aplicación de mensajes",
    });
  };

  const handleWhatsAppShare = () => {
    if (!contact.phone) {
      toast({
        title: "Sin teléfono",
        description: "Este contacto no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    openWhatsApp(contact.phone, shareMessage);
    toast({
      title: "WhatsApp abierto",
      description: "Se ha abierto WhatsApp con el mensaje preparado",
    });
  };

  const handleCopyInfo = async () => {
    try {
      await copyToClipboard(shareMessage);
      setIsCopied(true);
      toast({
        title: "Información copiada",
        description: "Información de la propiedad copiada al portapapeles",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar la información",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compartir Propiedad</DialogTitle>
          <DialogDescription>
            Comparte esta propiedad con {contact.firstName} {contact.lastName}
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            {propertyDetails}
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-500" />
              <span>{propertyLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="h-3.5 w-3.5 text-gray-500" />
              <span>{propertyPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 text-gray-500" />
              <span>{propertyInfo}</span>
            </div>
          </div>
        </div>

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
              <Phone className="h-3.5 w-3.5 text-gray-500" />
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
