"use client";

import Link from "next/link";

interface ArrasBreadcrumbProps {
  listingId: string;
  propertyRef?: string;
}

export function ArrasBreadcrumb({ listingId, propertyRef }: ArrasBreadcrumbProps) {
  return (
    <nav className="py-4" aria-label="Breadcrumb">
      <ol className="flex items-center text-sm">
        <li>
          <Link
            href="/propiedades"
            className="text-muted-foreground hover:text-primary"
          >
            Propiedades
          </Link>
        </li>
        <li className="mx-2 text-muted-foreground">/</li>
        <li>
          <Link
            href={`/propiedades/${listingId}`}
            className="text-muted-foreground hover:text-primary"
          >
            {propertyRef ?? `Propiedad ${listingId}`}
          </Link>
        </li>
        <li className="mx-2 text-muted-foreground">/</li>
        <li className="font-medium" aria-current="page">
          Contrato de Arras
        </li>
      </ol>
    </nav>
  );
}
