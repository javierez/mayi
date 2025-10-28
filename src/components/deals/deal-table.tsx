"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { MapPin, Building2, Users } from "lucide-react";
import { PaginationControls } from "~/components/ui/pagination-controls";
import {
  DEAL_STATUS_LABELS,
  DEAL_STATUS_COLORS,
  type DealStatus,
} from "~/lib/constants/deal-statuses";

// Deal type with joined data (based on what we expect from queries)
export type DealWithDetails = {
  dealId: bigint;
  listingId: bigint;
  listingContactId?: bigint | null;
  status: DealStatus;
  closeDate?: Date | null;
  finalPrice?: number | null;
  commissionPercentage?: number | null;
  commissionAmount?: number | null;
  arrasAmount?: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined listing/property data
  listing?: {
    listingId: bigint;
    referenceNumber?: string | null;
    title?: string | null;
    street?: string | null;
    price: string;
    listingType?: string | null;
    propertyType?: string | null;
    bedrooms?: number | null;
    squareMeter?: number | null;
    neighborhood?: bigint | null;
  } | null;
  // Joined buyer data
  buyer?: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  // Joined owner data
  owner?: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  // Joined agent data
  agent?: {
    id: string;
    name: string;
  } | null;
  // Participants
  participants?: Array<{
    contactId: bigint;
    firstName: string;
    lastName: string;
    role: string;
  }>;
};

interface DealTableProps {
  deals: DealWithDetails[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function DealTable({
  deals,
  currentPage,
  totalPages,
  onPageChange,
}: DealTableProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined) return "";
    return `${percentage}%`;
  };

  const getStatusBadge = (status: DealStatus) => {
    return (
      <Badge
        variant="outline"
        className={`${DEAL_STATUS_COLORS[status]} text-xs`}
      >
        {DEAL_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getPropertyTypeLabel = (type: string | null | undefined) => {
    if (!type) return "";
    const labels: Record<string, string> = {
      piso: "Piso",
      casa: "Casa",
      local: "Local",
      garaje: "Garaje",
      solar: "Solar",
    };
    return labels[type] ?? type;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Propiedad</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[180px]">Comprador</TableHead>
              <TableHead className="w-[180px]">Propietario</TableHead>
              <TableHead className="w-[120px] text-right">
                Precio Final
              </TableHead>
              <TableHead className="w-[140px] text-right">Comisión</TableHead>
              <TableHead className="w-[120px]">Fecha Cierre</TableHead>
              <TableHead className="w-[100px]">Participantes</TableHead>
              <TableHead className="w-[100px]">Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-muted-foreground"
                >
                  No se encontraron acuerdos
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.dealId.toString()} className="group">
                  {/* Propiedad */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {deal.listing?.referenceNumber && (
                          <span className="text-xs font-medium text-muted-foreground">
                            #{deal.listing.referenceNumber}
                          </span>
                        )}
                      </div>
                      {deal.listing?.title && (
                        <p className="text-sm font-medium line-clamp-1">
                          {deal.listing.title}
                        </p>
                      )}
                      {deal.listing?.street && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {deal.listing.street}
                          </span>
                        </div>
                      )}
                      {deal.listing && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {deal.listing.propertyType && (
                            <span>
                              {getPropertyTypeLabel(deal.listing.propertyType)}
                            </span>
                          )}
                          {deal.listing.bedrooms && (
                            <span>{deal.listing.bedrooms} hab.</span>
                          )}
                          {deal.listing.squareMeter && (
                            <span>{deal.listing.squareMeter} m²</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>

                  {/* Comprador */}
                  <TableCell>
                    {deal.buyer ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {deal.buyer.firstName} {deal.buyer.lastName}
                        </p>
                        {deal.buyer.email && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {deal.buyer.email}
                          </p>
                        )}
                        {deal.buyer.phone && (
                          <p className="text-xs text-muted-foreground">
                            {deal.buyer.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Propietario */}
                  <TableCell>
                    {deal.owner ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {deal.owner.firstName} {deal.owner.lastName}
                        </p>
                        {deal.owner.phone && (
                          <p className="text-xs text-muted-foreground">
                            {deal.owner.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Precio Final */}
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        deal.finalPrice ??
                          (deal.listing?.price
                            ? parseFloat(deal.listing.price)
                            : null),
                      )}
                    </span>
                  </TableCell>

                  {/* Comisión */}
                  <TableCell className="text-right">
                    {deal.commissionAmount ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {formatCurrency(deal.commissionAmount)}
                        </p>
                        {deal.commissionPercentage && (
                          <p className="text-xs text-muted-foreground">
                            {formatPercentage(deal.commissionPercentage)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Fecha Cierre */}
                  <TableCell>
                    <span className="text-sm">
                      {formatDate(deal.closeDate)}
                    </span>
                  </TableCell>

                  {/* Participantes */}
                  <TableCell>
                    {deal.participants && deal.participants.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {deal.participants.length}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Creado */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(deal.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
