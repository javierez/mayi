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
    <div className={cn("rounded-lg border bg-gray-50/50 p-4", className)}>
      {/* Contact Name - Clickable */}
      <button
        onClick={onNameClick}
        className="mb-3 text-left text-base font-semibold text-gray-900 underline decoration-dotted underline-offset-2 transition-colors hover:text-gray-600 hover:decoration-solid"
      >
        {fullName}
      </button>

      {/* Contact Methods */}
      <div className="space-y-2">
        {/* Email */}
        {email && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`mailto:${email}`, "_blank")}
              className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Enviar email"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {email}
              </span>
            </button>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`tel:${phone}`, "_blank")}
              className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gray-900"
              title="Llamar"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate underline decoration-dotted underline-offset-2 hover:decoration-solid">
                {phone}
              </span>
            </button>
            <button
              onClick={() => {
                const cleanPhone = phone.replace(/\D/g, "");
                window.open(`https://wa.me/${cleanPhone}`, "_blank");
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-green-600"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
