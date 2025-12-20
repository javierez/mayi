"use client";

import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { useRouter } from "next/navigation";
import { FolderIcon, ZapIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface Document {
  id: string;
  name: string;
  url: string;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  documents: Document[];
}

interface DocumentsManagerProps {
  propertyId: bigint;
  listingId: bigint;
  referenceNumber: string;
  className?: string;
}

export function DocumentsManager({
  propertyId: _propertyId,
  listingId,
  referenceNumber: _referenceNumber,
  className = "",
}: DocumentsManagerProps) {
  const router = useRouter();

  // Folder configurations for compraventa documentation
  const folders: Folder[] = [
    {
      id: "documentacion-inicial",
      name: "Inicial",
      description: "Hoja de encargo, valoración, DNI/NIE propietario.",
      documents: [],
    },
    {
      id: "documentacion-legal",
      name: "Documentación Legal",
      description: "Escritura, Nota Simple, Catastro.",
      documents: [],
    },
    {
      id: "certificados",
      name: "Certificados",
      description: "CEE, Cédula habitabilidad, ITE, Comunidad.",
      documents: [],
    },
    {
      id: "impuestos-pagos",
      name: "Impuestos y Pagos",
      description: "IBI, ITP, Plusvalía Municipal.",
      documents: [],
    },
    {
      id: "contratos",
      name: "Contratos",
      description: "Arras, Escritura de compraventa.",
      documents: [],
    },
    {
      id: "hipoteca",
      name: "Hipoteca",
      description: "Deuda pendiente, cancelación registral.",
      documents: [],
    },
    {
      id: "planos",
      name: "Planos",
      description: "Planos de la propiedad.",
      documents: [],
    },
    {
      id: "visitas",
      name: "Visitas",
      description: "Reportes de visitas.",
      documents: [],
    },
    {
      id: "otros",
      name: "Otros",
      description: "Otros documentos.",
      documents: [],
    },
  ];

  const handleFolderClick = (folderId: string) => {
    router.push(`/propiedades/${listingId}/${folderId}`);
  };

  // Show folders view
  return (
    <div className={cn("space-y-6", className)}>
      {/* Folders grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {folders.map((folder) => {
          const isCertificatesFolder = folder.id === "certificados";
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
                {isCertificatesFolder && (
                  <ZapIcon className="absolute right-2 top-2 h-3.5 w-3.5 fill-current text-green-600 opacity-60" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
