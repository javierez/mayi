"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { canEditContacts } from "~/app/actions/permissions/check-permissions";
import { ContactInformationTab } from "./tabs/contact-information-tab";
import { ContactTareasTab } from "./tabs/contact-tareas-tab";
import { ContactSolicitudesTab } from "./tabs/contact-solicitudes-tab";
import { ContactPropiedadesTab } from "./tabs/contact-propiedades-tab";
import { ContactActividadTab } from "./tabs/contact-actividad-tab";

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
  const isOwner =
    contact.isOwner === true ||
    (contact.ownerCount ?? 0) > 0 ||
    contact.contactType === "propietario";
  const isBuyer =
    contact.isBuyer === true ||
    (contact.buyerCount ?? 0) > 0 ||
    contact.contactType === "demandante";
  const isInteresado =
    contact.isInteresado === true ||
    (contact.prospectCount ?? 0) > 0 ||
    contact.contactType === "interesado";

  // Determine which tabs to show based on derived flags
  const showSolicitudes = isBuyer || isInteresado || isOwner;
  const showPropiedades = isOwner || isBuyer;
  const showActividad = isBuyer; // Show activity tab for buyers (they have visits)

  // Active tab state with URL parameter support
  const [activeTab, setActiveTab] = useState(tabParam ?? "informacion");

  // Build tabs array based on contact type
  const tabs = [
    { value: "informacion", label: "Información" },
    { value: "tareas", label: "Tareas" },
    ...(showSolicitudes
      ? [{ value: "solicitudes", label: "Solicitudes" }]
      : []),
    ...(showPropiedades
      ? [{ value: "propiedades", label: "Propiedades" }]
      : []),
    ...(showActividad
      ? [{ value: "actividad", label: "Actividad" }]
      : []),
  ];

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
        console.error("❌ Error fetching contact permissions:", error);
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
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 md:gap-0 p-1 h-auto md:h-10 bg-gray-100 rounded-lg">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md h-8 text-sm"
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

      {/* Solicitudes Tab - Show for demandante, interesado, and propietario */}
      {showSolicitudes && (
        <TabsContent value="solicitudes" className="mt-6">
          <ContactSolicitudesTab contactId={contact.contactId} />
        </TabsContent>
      )}

      {/* Propiedades Tab - Show for propietario and demandante */}
      {showPropiedades && (
        <TabsContent value="propiedades" className="mt-6">
          <ContactPropiedadesTab contact={contact} canEdit={canEditContact} />
        </TabsContent>
      )}

      {/* Actividad Tab - Show for demandante (buyers with visits) */}
      {showActividad && (
        <TabsContent value="actividad" className="mt-6">
          <ContactActividadTab contactId={contact.contactId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
