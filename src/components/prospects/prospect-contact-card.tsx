"use client";

import { Mail, Phone, MessageCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProspectContactCardProps {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  onNameClick?: () => void;
  className?: string;
}

export function ProspectContactCard({
  contactId: _contactId,
  firstName,
  lastName,
  email,
  phone,
  onNameClick,
  className,
}: ProspectContactCardProps) {
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div className={cn("rounded-md px-3 py-2 shadow-md", className)}>
      {/* Contact Name - Clickable */}
      <button
        onClick={onNameClick}
        className="mb-1.5 text-left text-sm font-medium text-gray-800 underline decoration-dotted underline-offset-2 transition-colors hover:decoration-solid"
      >
        {fullName}
      </button>

      {/* Contact Methods */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* Email */}
        {email && (
          <button
            onClick={() => window.open(`mailto:${email}`, "_blank")}
            className="flex items-center gap-1.5 text-xs text-gray-500 transition-opacity hover:opacity-70"
            title="Enviar email"
          >
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </button>
        )}

        {/* Phone */}
        {phone && (
          <>
            <button
              onClick={() => window.open(`tel:${phone}`, "_blank")}
              className="flex items-center gap-1.5 text-xs text-gray-500 transition-opacity hover:opacity-70"
              title="Llamar"
            >
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </button>
            <button
              onClick={() => {
                const cleanPhone = phone.replace(/\D/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
              }}
              className="flex items-center gap-1 text-xs text-gray-500 transition-opacity hover:opacity-70"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-3 w-3 flex-shrink-0" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
