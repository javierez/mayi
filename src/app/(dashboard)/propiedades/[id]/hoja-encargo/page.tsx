import { notFound } from "next/navigation";
import { getHojaEncargoFormDataAction } from "~/server/actions/hoja-encargo";
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
import { AlertCircle } from "lucide-react";
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

  // Always show the form - allows regenerating hoja encargo
  return <HojaEncargoForm data={result.data} />;
}
