"use client";

import { Mail, Phone, Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";

interface ContactoProps {
  email?: string;
  phone?: string;
  isActive: boolean;
  contactId: bigint;
}

export function Contacto({ email, phone, isActive, contactId }: ContactoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const openEmail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const openPhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, "_blank");
  };

  const openWhatsApp = (phone: string) => {
    // Remove any non-digit characters and ensure it starts with country code
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!email && !phone) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      <div className="rounded-md p-1">
        <div className="space-y-0.5">
          {email && (
            <div className="group flex items-center text-sm">
              <div className="mr-2 flex items-center">
                <button
                  className={cn(
                    "rounded p-1 transition-colors hover:bg-gray-100",
                    isActive ? "hover:bg-gray-100" : "hover:bg-gray-200",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEmail(email);
                  }}
                  title="Enviar email"
                >
                  <Mail
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-muted-foreground" : "text-gray-300",
                    )}
                  />
                </button>
                <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:w-auto group-hover:opacity-100">
                  <button
                    className={cn(
                      "duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100",
                      isActive ? "hover:bg-gray-100" : "hover:bg-gray-200",
                    )}
                    style={{ transitionDelay: "200ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(email, `email-${contactId}`);
                    }}
                    title="Copiar email"
                  >
                    {copiedField === `email-${contactId}` ? (
                      <Check className="h-4 w-4 text-green-900" />
                    ) : (
                      <Copy
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-muted-foreground" : "text-gray-300",
                        )}
                      />
                    )}
                  </button>
                </div>
              </div>
              <span
                className={cn(
                  "truncate transition-all group-hover:font-bold",
                  isActive ? "" : "text-gray-400",
                )}
              >
                {email}
              </span>
            </div>
          )}
          {phone && (
            <div className="group flex items-center text-sm">
              <div className="mr-2 flex items-center">
                <button
                  className={cn(
                    "rounded p-1 transition-colors hover:bg-gray-100",
                    isActive ? "hover:bg-gray-100" : "hover:bg-gray-200",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhoneCall(phone);
                  }}
                  title="Llamar"
                >
                  <Phone
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-muted-foreground" : "text-gray-300",
                    )}
                  />
                </button>
                <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:w-auto group-hover:opacity-100">
                  <button
                    className={cn(
                      "duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100",
                      isActive ? "hover:bg-gray-100" : "hover:bg-gray-200",
                    )}
                    style={{ transitionDelay: "200ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(phone);
                    }}
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-muted-foreground" : "text-gray-300",
                      )}
                    />
                  </button>
                  <button
                    className={cn(
                      "duration-400 ml-1 scale-0 transform rounded p-1 transition-all hover:bg-gray-100 group-hover:scale-100",
                      isActive ? "hover:bg-gray-100" : "hover:bg-gray-200",
                    )}
                    style={{ transitionDelay: "300ms" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(phone, `phone-${contactId}`);
                    }}
                    title="Copiar teléfono"
                  >
                    {copiedField === `phone-${contactId}` ? (
                      <Check className="h-4 w-4 text-green-900" />
                    ) : (
                      <Copy
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-muted-foreground" : "text-gray-300",
                        )}
                      />
                    )}
                  </button>
                </div>
              </div>
              <span
                className={cn(
                  "truncate transition-all group-hover:font-bold",
                  isActive ? "" : "text-gray-400",
                )}
              >
                {phone}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
