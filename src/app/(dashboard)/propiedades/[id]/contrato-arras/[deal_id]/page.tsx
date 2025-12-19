import { notFound } from "next/navigation";
import {
  getArrasContractDataAction,
  checkExistingArrasContractAction,
} from "~/server/actions/arras";
import { ArrasContractForm } from "~/components/arras/arras-contract-form";
import { ArrasBreadcrumb } from "~/components/arras/arras-breadcrumb";
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

interface ArrasContractPageProps {
  params: Promise<{
    id: string;
    deal_id: string;
  }>;
}

export default async function ArrasContractPage({
  params,
}: ArrasContractPageProps) {
  const { id: listingId, deal_id: dealId } = await params;

  // Validate IDs are valid numbers
  const parsedListingId = parseInt(listingId);
  const parsedDealId = parseInt(dealId);

  if (isNaN(parsedListingId) || isNaN(parsedDealId)) {
    notFound();
  }

  // Fetch contract data
  const result = await getArrasContractDataAction(parsedDealId);

  console.log("🔍 Arras contract data:", {
    dealId: parsedDealId,
    listingId: parsedListingId,
    success: result.success,
    hasSeller: !!result.data?.seller,
    hasBuyer: !!result.data?.buyer,
    hasProperty: !!result.data?.property,
  });

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <ArrasBreadcrumb listingId={listingId} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-900">Error</CardTitle>
              </div>
              <CardDescription>
                {result.error ?? "No se pudo cargar la información del deal"}
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

  // Check if arras contract already exists
  const existingContract = await checkExistingArrasContractAction(parsedDealId);

  if (existingContract.success && existingContract.exists && existingContract.contract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <ArrasBreadcrumb
            listingId={listingId}
            propertyRef={result.data.property.referenceNumber ?? undefined}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-500" />
                <CardTitle className="text-green-900">
                  Contrato de Arras existente
                </CardTitle>
              </div>
              <CardDescription>
                Ya existe un contrato de arras firmado para este deal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded bg-gray-50 p-3 text-sm text-gray-600">
                  <p>
                    <strong>Comprador:</strong>{" "}
                    {result.data.buyer.firstName} {result.data.buyer.lastName}
                  </p>
                  <p>
                    <strong>Vendedor:</strong>{" "}
                    {result.data.seller?.firstName ?? "No especificado"}{" "}
                    {result.data.seller?.lastName ?? ""}
                  </p>
                  <p>
                    <strong>Propiedad:</strong>{" "}
                    {result.data.property.street ?? "No especificada"},{" "}
                    {result.data.property.city ?? ""}
                  </p>
                  <p>
                    <strong>Fecha de firma:</strong>{" "}
                    {existingContract.contract.createdAt
                      ? new Intl.DateTimeFormat("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }).format(existingContract.contract.createdAt)
                      : "No especificada"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={existingContract.contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar contrato
                    </Button>
                  </a>
                  <Link href={`/propiedades/${listingId}`}>
                    <Button variant="outline">Volver a la propiedad</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ArrasContractForm data={result.data} />;
}
