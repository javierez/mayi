"use client";

import Link from "next/link";

interface ContactBreadcrumbProps {
  firstName: string;
  lastName: string;
  contactId: string;
  documentFolder?: {
    name: string;
    contactId: string;
  };
}

export function ContactBreadcrumb({
  firstName,
  lastName,
  contactId: _contactId,
  documentFolder,
}: ContactBreadcrumbProps) {
  const contactName = `${firstName} ${lastName}`;

  return (
    <nav className="py-4" aria-label="Breadcrumb">
      {/* Mobile: Simple back link */}
      <div className="md:hidden">
        <Link
          href="/contactos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Contactos
        </Link>
      </div>

      {/* Desktop: Full breadcrumb */}
      <ol className="hidden items-center text-sm md:flex">
        <li>
          <Link
            href="/contactos"
            className="text-muted-foreground hover:text-primary"
          >
            Contactos
          </Link>
        </li>
        <li className="mx-2">/</li>
        <li
          className={
            documentFolder
              ? "truncate text-muted-foreground"
              : "truncate font-medium"
          }
        >
          {documentFolder ? (
            <Link
              href={`/contactos/${documentFolder.contactId}`}
              className="hover:text-primary"
            >
              <span className="truncate">{contactName}</span>
            </Link>
          ) : (
            <span className="truncate">{contactName}</span>
          )}
        </li>
        {documentFolder && (
          <>
            <li className="mx-2 flex-shrink-0">/</li>
            <li className="truncate font-medium" aria-current="page">
              {documentFolder.name}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
