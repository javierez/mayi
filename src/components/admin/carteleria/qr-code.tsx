"use client";

import type { FC } from "react";
import QRCodeLibrary from "react-qr-code";
import { cn } from "~/lib/utils";

interface ContactInfo {
  phone?: string;
  email?: string;
  url?: string;
}

interface QRCodeComponentProps {
  contactInfo: ContactInfo;
  size?: number;
  className?: string;
  level?: "L" | "M" | "Q" | "H";
}

export const QRCode: FC<QRCodeComponentProps> = ({
  contactInfo,
  size = 80,
  className,
  level = "M",
}) => {
  // Generate QR code value from contact information
  const generateQRValue = (contact: ContactInfo): string => {
    // If URL is provided, use it directly (most common use case for QR codes)
    if (contact.url) {
      return contact.url;
    }

    // Fallback to contact info if no URL
    const parts: string[] = [];

    if (contact.phone) {
      parts.push(`Tel: ${contact.phone}`);
    }

    if (contact.email) {
      parts.push(`Email: ${contact.email}`);
    }

    if (parts.length === 0) {
      return "Contactar inmobiliaria";
    }

    return parts.join("\n");
  };

  // Handle cases where contact info is missing or invalid
  if (!contactInfo || (!contactInfo.phone && !contactInfo.email && !contactInfo.url)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded bg-gray-100 p-4",
          className,
        )}
        style={{ width: size + 32, height: size + 32 }}
      >
        <span className="text-xs text-gray-500">Sin contacto</span>
      </div>
    );
  }

  const qrValue = generateQRValue(contactInfo);

  try {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded p-2",
          className,
        )}
        style={{
          width: size + 16,
          height: size + 16,
          backgroundColor: "rgba(128, 128, 128, 0.7)",
          backdropFilter: "blur(4px)",
        }}
      >
        <QRCodeLibrary
          value={qrValue}
          size={size}
          level={level}
          className="h-full w-full"
          bgColor="#000000"
          fgColor="#FFFFFF"
        />
      </div>
    );
  } catch (error) {
    console.error("Error generating QR code:", error);

    // Fallback UI in case QR generation fails
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded bg-gray-100 p-4",
          className,
        )}
        style={{ width: size + 32, height: size + 32 }}
      >
        <span className="text-xs text-gray-500">QR no disponible</span>
      </div>
    );
  }
};

// Convenience component for property templates
interface PropertyQRCodeProps {
  phone?: string;
  email?: string;
  url?: string;
  size?: number;
  className?: string;
}

export const PropertyQRCode: FC<PropertyQRCodeProps> = ({
  phone,
  email,
  url,
  size,
  className,
}) => {
  return (
    <QRCode
      contactInfo={{ phone, email, url }}
      size={size}
      className={className}
      level="M"
    />
  );
};
