"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import type { ListingActivityRecord } from "~/server/queries/listing-history";
import {
  getActivityActionLabel,
  formatAbsoluteTime,
} from "~/lib/formatters/activity-formatter";
import { PriceHistoryChart } from "./price-history-chart";
import { getListingPriceHistory } from "~/server/queries/listing-history";

interface ActivityDetailModalProps {
  activity: ListingActivityRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailModal({
  activity,
  open,
  onOpenChange,
}: ActivityDetailModalProps) {
  const [priceHistory, setPriceHistory] = useState<
    Array<{
      date: Date;
      price: number;
      percentChange: number;
      changeType: "reduction" | "increase" | "correction";
      updatedBy: string;
    }>
  >([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);

  // Fetch price history when modal opens for price_changed action
  useEffect(() => {
    if (open && activity?.action === "price_changed") {
      setLoadingPriceHistory(true);
      getListingPriceHistory(Number(activity.listingId))
        .then((history) => setPriceHistory(history))
        .catch((error) => {
          console.error("Failed to load price history:", error);
          setPriceHistory([]);
        })
        .finally(() => setLoadingPriceHistory(false));
    }
  }, [open, activity]);

  if (!activity) return null;

  const actionLabel = getActivityActionLabel(activity.action);
  const absoluteTime = formatAbsoluteTime(activity.createdAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>{absoluteTime}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* User information */}
            <div>
              <h4 className="text-xs text-muted-foreground mb-1.5">Realizado por</h4>
              <div className="rounded-lg shadow-sm bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium">{activity.user?.name ?? "Usuario desconocido"}</p>
                <p className="text-xs text-muted-foreground">{activity.user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Action-specific content */}
            {activity.action === "price_changed" && (
              <div>
                <h4 className="text-sm font-medium mb-3">Historial de precios</h4>
                {loadingPriceHistory ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Cargando historial...</p>
                  </div>
                ) : (
                  <PriceHistoryChart priceHistory={priceHistory} />
                )}
                <Separator className="my-4" />
                <PriceChangeDetails details={activity.details} />
              </div>
            )}

            {activity.action === "status_changed" && (
              <StatusChangeDetails details={activity.details} />
            )}

            {activity.action === "agent_reassigned" && (
              <AgentReassignedDetails details={activity.details} />
            )}

            {activity.action === "portal_published" && (
              <PortalPublishedDetails details={activity.details} />
            )}

            {activity.action === "images_updated" && (
              <ImagesUpdatedDetails details={activity.details} />
            )}

            {/* Generic details for other actions */}
            {!["price_changed", "status_changed", "agent_reassigned", "portal_published", "images_updated"].includes(
              activity.action,
            ) && <GenericDetails details={activity.details} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Detail components for specific action types

function PriceChangeDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <DetailField label="Precio anterior" value={`€${(details.oldValue as number).toLocaleString("es-ES")}`} />
      <DetailField label="Precio nuevo" value={`€${(details.newValue as number).toLocaleString("es-ES")}`} />
      <DetailField label="Cambio porcentual" value={`${(details.percentChange as number).toFixed(2)}%`} />
      <DetailField label="Tipo de cambio" value={details.changeType as string} />
      {details.daysActive ? (
        <DetailField label="Días activo" value={`${Number(details.daysActive)} días`} />
      ) : null}
      {details.reason ? <DetailField label="Razón" value={details.reason as string} className="col-span-2" /> : null}
    </div>
  );
}

function StatusChangeDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Detalles del cambio de estado</h4>
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Estado anterior" value={details.oldStatus as string} />
        <DetailField label="Estado nuevo" value={details.newStatus as string} />
        {details.reason ? <DetailField label="Razón" value={details.reason as string} className="col-span-2" /> : null}
        {details.dealId ? <DetailField label="ID de operación" value={String(details.dealId as number | bigint)} /> : null}
        {details.salePrice ? (
          <DetailField label="Precio de venta" value={`€${(details.salePrice as number).toLocaleString("es-ES")}`} />
        ) : null}
      </div>
    </div>
  );
}

function AgentReassignedDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Detalles de reasignación</h4>
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Agente anterior" value={details.oldAgentName as string} />
        <DetailField label="Nuevo agente" value={details.newAgentName as string} />
        {details.reason ? <DetailField label="Razón" value={details.reason as string} className="col-span-2" /> : null}
        {details.commissionImpact ? (
          <DetailField label="Impacto en comisión" value={details.commissionImpact as string} className="col-span-2" />
        ) : null}
      </div>
    </div>
  );
}

function PortalPublishedDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Detalles de publicación</h4>
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Portal" value={(details.portal as string).toUpperCase()} />
        <DetailField label="Estado" value={details.published ? "Publicado" : "Despublicado"} />
        {details.portalListingId ? <DetailField label="ID en portal" value={details.portalListingId as string} /> : null}
        {details.publicationDate ? (
          <DetailField label="Fecha de publicación" value={new Date(details.publicationDate as string).toLocaleDateString("es-ES")} />
        ) : null}
        {details.cost ? <DetailField label="Coste" value={`€${Number(details.cost)}`} /> : null}
      </div>
    </div>
  );
}

function ImagesUpdatedDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Detalles de actualización de imágenes</h4>
      <div className="grid grid-cols-2 gap-4">
        <DetailField label="Operación" value={details.operation as string} />
        <DetailField label="Cantidad" value={String(details.count)} />
        <DetailField label="Total de imágenes" value={String(details.totalImages)} />
      </div>
    </div>
  );
}

function GenericDetails({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Detalles</h4>
      <div className="space-y-2">
        {Object.entries(details).map(([key, value]) => (
          <DetailField key={key} label={key} value={JSON.stringify(value)} />
        ))}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
