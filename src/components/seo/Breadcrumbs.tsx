"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BreadcrumbSchema } from './BreadcrumbSchema';

export function Breadcrumbs() {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs = [
    { name: 'Inicio', href: '/' },
    ...pathSegments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + pathSegments.slice(0, index + 1).join('/'),
    })),
  ];

  // Don't show breadcrumbs on homepage or templates page (used for PDF generation)
  if (pathname === '/' || pathname.startsWith('/templates')) {
    return null;
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="container mx-auto py-4">
        <ol className="flex space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-muted-foreground">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="hover:underline">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <BreadcrumbSchema breadcrumbs={breadcrumbs} />
    </>
  );
}
