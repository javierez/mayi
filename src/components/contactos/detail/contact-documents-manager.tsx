"use client";

import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { useRouter } from "next/navigation";
import { FolderIcon, ZapIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface Folder {
  id: string;
  name: string;
  description?: string;
}

interface ContactDocumentsManagerProps {
  contactId: bigint;
  isOwner?: boolean;
  className?: string;
}

export function ContactDocumentsManager({
  contactId,
  isOwner = false,
  className = "",
}: ContactDocumentsManagerProps) {
  const router = useRouter();

  // Personal documents folder - always available for all contacts
  const personalDocumentsFolder: Folder = {
    id: "documentos-personales",
    name: "Documentos Personales",
    description: "DNI, NIF, documentos personales",
  };

  // Owner-specific folders - only show if contact is owner
  const ownerFolders: Folder[] = isOwner
    ? [
        {
          id: "documentacion-inicial",
          name: "Inicial",
          description: "Hoja de encargo, valoración.",
        },
        {
          id: "visitas",
          name: "Visitas",
          description: "Reportes de visitas.",
        },
        {
          id: "planos",
          name: "Planos",
          description: "Planos de la propiedad",
        },
        {
          id: "certificado-energetico",
          name: "Certificado Energético",
          description: "Certificado y consumos",
        },
        {
          id: "escrituras",
          name: "Escrituras",
          description: "Nota simple y escrituras",
        },
        {
          id: "carteles",
          name: "Carteles",
          description: "Carteles de la propiedad",
        },
        {
          id: "otros",
          name: "Otros",
          description: "Otros documentos",
        },
      ]
    : [];

  const handleFolderClick = (folderId: string) => {
    router.push(`/contactos/${contactId.toString()}/${folderId}`);
  };

  // Render folder card component
  const renderFolderCard = (folder: Folder) => {
    const isEnergyFolder = folder.id === "certificado-energetico";
    return (
      <Card
        key={folder.id}
        className="relative cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
        onClick={() => handleFolderClick(folder.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <FolderIcon className="h-6 w-6 fill-current text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-gray-900">
                {folder.name}
              </h4>
              <p className="mt-0.5 text-xs text-gray-500">
                {folder.description}
              </p>
            </div>
          </div>
          {isEnergyFolder && (
            <ZapIcon className="absolute right-2 top-2 h-3.5 w-3.5 fill-current text-green-600 opacity-60" />
          )}
        </CardContent>
      </Card>
    );
  };

  // Show folders view
  return (
    <div className={cn("space-y-8", className)}>
      {/* Personal Documents Section - Separate from property documents */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium text-gray-900">
            Documentos Personales
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderFolderCard(personalDocumentsFolder)}
        </div>
      </div>

      {/* Property Documents Section - Only show if contact is owner */}
      {isOwner && ownerFolders.length > 0 && (
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <div>
            <h4 className="text-base font-medium text-gray-900">
              Documentos de Propiedades
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ownerFolders.map((folder) => renderFolderCard(folder))}
          </div>
        </div>
      )}
    </div>
  );
}

