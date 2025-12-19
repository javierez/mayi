"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Trash2, ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "~/components/hooks/use-toast";
import ContactDraftsSkeleton from "~/components/contactos/contact-drafts-skeleton";

// Type for draft contact
interface DraftContact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  additionalInfo?: Record<string, unknown> | null;
  source?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerCount: number;
  buyerCount: number;
  prospectCount: number;
  isOwner: boolean;
  isBuyer: boolean;
  isInteresado: boolean;
}

export default function ContactDraftsPage() {
  const [draftContacts, setDraftContacts] = useState<DraftContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch draft contacts
  useEffect(() => {
    const fetchDraftContacts = async () => {
      try {
        setLoading(true);
        const { getDraftContactsWithAuth } = await import(
          "~/server/queries/contact"
        );
        const contacts = await getDraftContactsWithAuth();
        setDraftContacts(
          contacts.map((contact) => ({
            ...contact,
            additionalInfo: contact.additionalInfo as
              | Record<string, unknown>
              | null
              | undefined,
            isActive: contact.isActive ?? false,
          })),
        );
      } catch (error) {
        console.error("Error fetching draft contacts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch draft contacts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchDraftContacts();
  }, [toast]);

  const handleDelete = async (contactId: bigint) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(contactId);
      const { deleteDraftContactWithAuth } = await import(
        "~/server/queries/contact"
      );
      await deleteDraftContactWithAuth(Number(contactId));

      // Remove the deleted contact from state
      setDraftContacts((prev) =>
        prev.filter((contact) => contact.contactId !== contactId),
      );

      toast({
        title: "Success",
        description: "Draft contact deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting draft contact:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete draft contact",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatContactInfo = (contact: DraftContact) => {
    const info = [];
    if (contact.email) info.push(contact.email);
    if (contact.phone) info.push(contact.phone);
    return info.join(" • ");
  };

  // Check if contact is an unidentified CALL_TRACKING contact
  const isUnidentifiedCallTracking = (contact: DraftContact): boolean => {
    // Check if source is from Fotocasa
    const fotocasaSources = ['fotocasa', 'habitaclia', 'milanuncios'];
    if (!contact.source || !fotocasaSources.includes(contact.source.toLowerCase())) {
      return false;
    }

    // Check if it's a CALL_TRACKING lead type
    const fotocasaType = contact.additionalInfo?.fotocasaType as string | undefined;
    if (fotocasaType !== 'CALL_TRACKING') {
      return false;
    }

    // Check if it has no listing_contacts (already filtered by query, but double-check)
    if (contact.buyerCount > 0 || contact.ownerCount > 0) {
      return false;
    }

    return true;
  };

  if (loading) {
    return <ContactDraftsSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contactos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold sm:text-2xl">Contactos Inactivos</h1>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        {draftContacts.length === 0 ? (
          <div className="py-12 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No hay contactos borradores
            </h3>
            <p className="mb-4 text-muted-foreground">
              Los contactos sin clasificación aparecerán aquí
            </p>
            <Button asChild>
              <Link href="/contactos/crear">Crear contacto</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nombre</TableHead>
                  <TableHead className="hidden min-w-[180px] sm:table-cell">Información de contacto</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead className="hidden min-w-[140px] md:table-cell">Creado</TableHead>
                  <TableHead className="w-[60px] sm:w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftContacts.map((contact) => {
                  const isUnidentified = isUnidentifiedCallTracking(contact);
                  return (
                  <TableRow
                    key={contact.contactId.toString()}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isUnidentified ? "border-l-4 border-l-rose-400/60" : ""
                    }`}
                    onClick={() =>
                      router.push(`/contactos/${contact.contactId}`)
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <div className="truncate">{contact.firstName} {contact.lastName}</div>
                        <div className="truncate text-xs text-muted-foreground sm:hidden">
                          {formatContactInfo(contact) || "Sin info"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="min-w-0 truncate text-sm text-muted-foreground">
                        {formatContactInfo(contact) ||
                          "Sin información de contacto"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="whitespace-nowrap text-xs">Sin clasificar</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(contact.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(contact.contactId);
                        }}
                        disabled={deletingId === contact.contactId}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
