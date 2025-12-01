"use client";

import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Mail,
  Phone,
  Calendar,
  User,
  Copy,
  Check,
  Star,
  Ban,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import {
  CONTACT_PALETTE,
  getContactBadgeColor,
} from "../table-components/color/contact-colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ContactFormHeaderProps {
  contact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    contactType: string;
    isActive: boolean | null;
    createdAt: Date;
    updatedAt?: Date | null;
    rating?: number | null;
    // Role counts and flags for badge display
    ownerCount?: number;
    buyerCount?: number;
    prospectCount?: number;
    isOwner?: boolean;
    isBuyer?: boolean;
    isInteresado?: boolean;
  };
  onRatingChange?: (rating: number | null) => void;
}

export function ContactFormHeader({
  contact,
  onRatingChange,
}: ContactFormHeaderProps) {
  const [copied, setCopied] = useState<{
    field: "email" | "phone" | null;
    value: string;
  }>({ field: null, value: "" });
  const [showDates, setShowDates] = useState(false);

  function handleCopy(field: "email" | "phone", value: string) {
    void navigator.clipboard.writeText(value);
    setCopied({ field, value });
    setTimeout(() => setCopied({ field: null, value: "" }), 1200);
  }

  return (
    <div className="mb-6 sm:mb-8">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0 sm:h-16 sm:w-16">
              <AvatarFallback className="bg-gray-100 text-gray-600">
                <User className="h-6 w-6 sm:h-8 sm:w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                {contact.firstName} {contact.lastName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* Propietario badge - always show if contact is owner */}
                {contact.isOwner === true && (
                  <Badge
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 text-sm font-medium shadow-md",
                      getContactBadgeColor("owner", contact.isActive ?? true),
                    )}
                    style={{ background: CONTACT_PALETTE.earth }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1 h-4 w-4"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                    Propietario
                    {contact.ownerCount && contact.ownerCount > 1
                      ? ` (${contact.ownerCount})`
                      : ""}
                  </Badge>
                )}

                {/* Demandante badge - always show if contact is buyer */}
                {contact.isBuyer === true && (
                  <Badge
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 text-sm font-medium shadow-md",
                      getContactBadgeColor("buyer", contact.isActive ?? true),
                    )}
                    style={{ background: CONTACT_PALETTE.moss }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1 h-4 w-4"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    Demandante
                    {contact.buyerCount && contact.buyerCount > 1
                      ? ` (${contact.buyerCount})`
                      : ""}
                  </Badge>
                )}

                {/* Interesado badge - always show if contact has interests */}
                {contact.isInteresado === true && (
                  <Badge
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 text-sm font-medium shadow-md",
                      getContactBadgeColor(
                        "interested",
                        contact.isActive ?? true,
                      ),
                    )}
                    style={{ background: CONTACT_PALETTE.sage }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1 h-4 w-4"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    Interesado
                    {contact.prospectCount && contact.prospectCount > 1
                      ? ` (${contact.prospectCount})`
                      : ""}
                  </Badge>
                )}

                {/* Fallback badge - only show if ALL flags are false/undefined */}
                {contact.isOwner !== true &&
                  contact.isBuyer !== true &&
                  contact.isInteresado !== true && (
                    <Badge
                      className={cn(
                        "whitespace-nowrap rounded-full px-3 text-sm font-medium shadow-md",
                        getContactBadgeColor(
                          "unclassified",
                          contact.isActive ?? true,
                        ),
                      )}
                      style={{ background: CONTACT_PALETTE.sand }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 h-4 w-4"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      Sin clasificar
                    </Badge>
                  )}

                {!contact.isActive && (
                  <Badge variant="secondary" className="bg-red-50 text-red-600">
                    Inactivo
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 md:gap-6">
                {contact.email && (
                  <div className="group flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="min-w-0 truncate transition-all duration-200 group-hover:font-semibold">
                      {contact.email}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1 sm:w-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-300 sm:ease-out sm:group-hover:w-auto sm:group-hover:opacity-100">
                      <button
                        onClick={() => handleCopy("email", contact.email!)}
                        className="rounded p-1 transition-all duration-200 hover:bg-gray-100 sm:scale-0 sm:transform sm:group-hover:scale-100"
                        title="Copiar email"
                      >
                        {copied.field === "email" &&
                        copied.value === contact.email ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                        )}
                      </button>
                      <a
                        href={`mailto:${contact.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 transition-all duration-200 hover:bg-gray-100 sm:scale-0 sm:transform sm:group-hover:scale-100"
                        style={{ transitionDelay: "100ms" }}
                        title="Enviar email"
                      >
                        <Mail className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                      </a>
                    </div>
                  </div>
                )}
                {contact.phone && (
                  <div className="group flex min-w-0 items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="min-w-0 truncate transition-all duration-200 group-hover:font-semibold">
                      {contact.phone}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1 sm:w-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-300 sm:ease-out sm:group-hover:w-auto sm:group-hover:opacity-100">
                      <button
                        onClick={() => handleCopy("phone", contact.phone!)}
                        className="rounded p-1 transition-all duration-200 hover:bg-gray-100 sm:scale-0 sm:transform sm:group-hover:scale-100"
                        title="Copiar teléfono"
                      >
                        {copied.field === "phone" &&
                        copied.value === contact.phone ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                        )}
                      </button>
                      <a
                        href={`tel:${contact.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 transition-all duration-200 hover:bg-gray-100 sm:scale-0 sm:transform sm:group-hover:scale-100"
                        style={{ transitionDelay: "100ms" }}
                        title="Llamar"
                      >
                        <Phone className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                      </a>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowDates(!showDates)}
                  className="flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showDates ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <span>{showDates ? "Ver menos" : "Ver más"}</span>
                </button>
              </div>
              {showDates && (
                <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      Creado:{" "}
                      {new Date(contact.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                  {contact.updatedAt && (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        Actualizado:{" "}
                        {new Date(contact.updatedAt).toLocaleDateString(
                          "es-ES",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rating display and editor in top right corner */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1.5 text-sm transition-all hover:opacity-70">
                {contact.rating ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: contact.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gray-400 text-gray-400"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-gray-300" />
                    <span className="text-xs text-gray-400">Sin valorar</span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[1, 2, 3, 4, 5].map((rating) => (
                <DropdownMenuItem
                  key={rating}
                  onClick={() => onRatingChange?.(rating)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-gray-400 text-gray-400"
                        />
                      ))}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {contact.rating !== null && contact.rating !== undefined && (
                <>
                  <div className="my-1 h-px bg-gray-200" />
                  <DropdownMenuItem
                    onClick={() => onRatingChange?.(null)}
                    className="cursor-pointer text-gray-500"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        <Ban className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  );
}
