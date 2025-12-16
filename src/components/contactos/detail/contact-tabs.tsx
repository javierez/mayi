"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { canEditContacts } from "~/app/actions/permissions/check-permissions";
import { ContactInformationTab } from "./tabs/contact-information-tab";
import { ContactTareasTab } from "./tabs/contact-tareas-tab";
import { ContactPropiedadesTab } from "./tabs/contact-propiedades-tab";
import { ContactInteresesTab } from "./tabs/contact-intereses-tab";
import { ContactSolicitudesTab } from "./tabs/contact-solicitudes-tab";
import { ContactActividadTab } from "./tabs/contact-actividad-tab";
import { ContactDocumentsManager } from "./contact-documents-manager";

interface ContactTabsProps {
  contact: {
    contactId: bigint;
    firstName: string;
    lastName: string;
    nif?: string;
    source?: string;
    email?: string;
    phone?: string;
    phoneNotes?: string;
    secondaryPhone?: string;
    secondaryPhoneNotes?: string;
    // contactType can be missing; we will derive from flags/counts if so
    contactType?:
      | "demandante"
      | "propietario"
      | "banco"
      | "agencia"
      | "interesado";
    isActive: boolean;
    // Flags and counts provided by the server helper; optional for safety
    isOwner?: boolean;
    isBuyer?: boolean;
    isInteresado?: boolean;
    ownerCount?: number;
    buyerCount?: number;
    prospectCount?: number;
    additionalInfo?: {
      demandType?: string;
      propertyTypes?: string[];
      minPrice?: number;
      maxPrice?: number;
      preferredArea?: string;
      minBedrooms?: number;
      minBathrooms?: number;
      urgencyLevel?: number;
      fundingReady?: boolean;
      moveInBy?: string;
      notes?: string;
      extras?: Record<string, boolean>;
    };
  };
}

export function ContactTabs({ contact }: ContactTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Permission states
  const [canEditContact, setCanEditContact] = useState(true);

  // Derive role flags using actual data (flags/counts) and fall back to contactType if present
  const isBuyer =
    contact.isBuyer === true ||
    (contact.buyerCount ?? 0) > 0 ||
    contact.contactType === "demandante";
  const isInteresado =
    contact.isInteresado === true ||
    (contact.prospectCount ?? 0) > 0 ||
    contact.contactType === "interesado";
  const isOwner =
    contact.isOwner === true ||
    (contact.ownerCount ?? 0) > 0 ||
    contact.contactType === "propietario";

  // Determine which tabs to show based on derived flags
  const showPropiedades = isOwner; // Show for property owners
  const showIntereses = isBuyer; // Show for buyers
  const showSolicitudes = isBuyer || isInteresado || isOwner;
  const showActividad = true; // Show activity timeline for all contacts
  const showArchivos = true; // Show archivos tab for all contacts

  // Active tab state with URL parameter support
  const [activeTab, setActiveTab] = useState(tabParam ?? "informacion");

  // Build tabs array based on contact type
  // Order: Información, Tareas, Propiedades, Intereses, Solicitudes, Actividad, Archivos
  const tabs = [
    { value: "informacion", label: "Información" },
    { value: "tareas", label: "Tareas" },
    ...(showPropiedades ? [{ value: "propiedades", label: "Propiedades" }] : []),
    ...(showIntereses ? [{ value: "intereses", label: "Intereses" }] : []),
    ...(showSolicitudes ? [{ value: "solicitudes", label: "Solicitudes" }] : []),
    ...(showActividad ? [{ value: "actividad", label: "Actividad" }] : []),
    ...(showArchivos ? [{ value: "archivos", label: "Archivos" }] : []),
  ];

  // Calculate grid columns based on number of tabs
  const tabCount = tabs.length;
  const gridColsClass =
    tabCount <= 4
      ? "md:grid-cols-4"
      : tabCount <= 5
        ? "md:grid-cols-5"
        : tabCount <= 6
          ? "md:grid-cols-6"
          : "md:grid-cols-7";

  // Function to handle tab changes with URL persistence
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with tab parameter
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?tab=${value}`, { scroll: false });
  };

  // Fetch user permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const editPerm = await canEditContacts();
        setCanEditContact(editPerm);
      } catch (error) {
        console.error("Error fetching contact permissions:", error);
        setCanEditContact(false);
      }
    };

    void fetchPermissions();
  }, []);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList
        className={`grid h-auto w-full grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 md:h-10 md:gap-0 ${gridColsClass}`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-8 rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="informacion" className="mt-6">
        <ContactInformationTab contact={contact} canEdit={canEditContact} />
      </TabsContent>

      <TabsContent value="tareas" className="mt-6">
        <ContactTareasTab contactId={contact.contactId} />
      </TabsContent>

      {/* Propiedades Tab - Show for property owners */}
      {showPropiedades && (
        <TabsContent value="propiedades" className="mt-6">
          <ContactPropiedadesTab contactId={contact.contactId} />
        </TabsContent>
      )}

      {/* Intereses Tab - Show for buyers */}
      {showIntereses && (
        <TabsContent value="intereses" className="mt-6">
          <ContactInteresesTab contactId={contact.contactId} />
        </TabsContent>
      )}

      {/* Solicitudes Tab - Show for demandante, interesado, and propietario */}
      {showSolicitudes && (
        <TabsContent value="solicitudes" className="mt-6">
          <ContactSolicitudesTab contactId={contact.contactId} />
        </TabsContent>
      )}

      {/* Actividad Tab - Show activity timeline for all contacts */}
      {showActividad && (
        <TabsContent value="actividad" className="mt-6">
          <ContactActividadTab contactId={contact.contactId} />
        </TabsContent>
      )}

      {/* Archivos Tab - Show for all contacts */}
      {showArchivos && (
        <TabsContent value="archivos" className="mt-6">
          <ContactDocumentsManager
            contactId={contact.contactId}
            isOwner={isOwner}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
