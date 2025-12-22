import { notFound } from "next/navigation";
import {
  getHojaEncargoFormDataAction,
  checkExistingHojaEncargoAction,
} from "~/server/actions/hoja-encargo";
import { HojaEncargoForm } from "~/components/hoja-encargo/hoja-encargo-form";
import { PropertyBreadcrumb } from "~/components/propiedades/detail/property-breadcrump";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AlertCircle, FileCheck, Download } from "lucide-react";
import Link from "next/link";

interface HojaEncargoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HojaEncargoPage({ params }: HojaEncargoPageProps) {
  const { id: listingId } = await params;

  // Validate ID is a valid number
  const parsedListingId = parseInt(listingId);

  if (isNaN(parsedListingId)) {
    notFound();
  }

  // Fetch form data
  const result = await getHojaEncargoFormDataAction(parsedListingId);

  console.log("🔍 Hoja encargo form data:", {
    listingId: parsedListingId,
    success: result.success,
    hasOwner: !!result.data?.owner,
    hasProperty: !!result.data?.property,
    hasAgency: !!result.data?.agency,
  });

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <PropertyBreadcrumb
              propertyType=""
              street=""
              referenceNumber=""
              documentFolder={{
                name: "Hoja de Encargo",
                propertyId: listingId,
              }}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-900">Error</CardTitle>
              </div>
              <CardDescription>
                {result.error ?? "No se pudo cargar la información de la propiedad"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/propiedades/${listingId}`}>
                <Button variant="outline">Volver a la propiedad</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if hoja encargo already exists
  const existingDocument = await checkExistingHojaEncargoAction(parsedListingId);

  if (existingDocument.success && existingDocument.exists && existingDocument.document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <PropertyBreadcrumb
              propertyType={result.data.property.propertyType ?? ""}
              street={result.data.property.street ?? ""}
              referenceNumber={result.data.property.referenceNumber ?? ""}
              documentFolder={{
                name: "Hoja de Encargo",
                propertyId: listingId,
              }}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-500" />
                <CardTitle className="text-green-900">
                  Hoja de Encargo existente
                </CardTitle>
              </div>
              <CardDescription>
                Ya existe una hoja de encargo para esta propiedad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                  <p>
                    <strong>Propietario:</strong>{" "}
                    {result.data.owner?.firstName ?? "No especificado"}{" "}
                    {result.data.owner?.lastName ?? ""}
                  </p>
                  <p>
                    <strong>Propiedad:</strong>{" "}
                    {result.data.property.street ?? "No especificada"},{" "}
                    {result.data.property.city ?? ""}
                  </p>
                  <p>
                    <strong>Fecha de creación:</strong>{" "}
                    {existingDocument.document.createdAt
                      ? new Intl.DateTimeFormat("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(existingDocument.document.createdAt)
                      : "No especificada"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={existingDocument.document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar documento
                    </Button>
                  </a>
                  <Link href={`/propiedades/${listingId}/documentacion-inicial`}>
                    <Button variant="outline">Volver a documentación</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <HojaEncargoForm data={result.data} />;
}
