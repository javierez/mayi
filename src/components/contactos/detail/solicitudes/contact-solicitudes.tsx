"use client";

import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { type InterestFormData } from "../forms/contact-interest-form";
import { getProspectsByContactWithAuth } from "~/server/queries/prospect";
import { getLocationByNeighborhoodId } from "~/server/queries/locations";
import {
  type ProspectData,
  convertProspectToFormData,
} from "~/lib/prospect-utils";
import { ProspectList } from "./prospect-list";
import { ProspectEmptyState } from "./prospect-empty-state";
import { SolicitudesSkeleton } from "~/components/ui/skeletons";
import { ContactSolicitudModal } from "./contact-solicitud-modal";

interface ContactSolicitudesProps {
  contactId: bigint;
}

export function ContactSolicitudes({ contactId }: ContactSolicitudesProps) {
  // Prospects state for tracking existing prospects
  const [prospects, setProspects] = useState<ProspectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [selectedProspectData, setSelectedProspectData] = useState<
    InterestFormData | undefined
  >(undefined);

  // Load existing prospects for this contact
  useEffect(() => {
    const loadProspects = async () => {
      setIsLoading(true);
      try {
        const existingProspects =
          await getProspectsByContactWithAuth(contactId);
        setProspects(
          existingProspects.map((item) => item.prospects) as ProspectData[],
        );
      } catch (error) {
        console.error("Error loading prospects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProspects();
  }, [contactId]);

  // Function to handle editing a prospect
  const handleEditProspect = async (prospect: ProspectData) => {
    const convertedForm = await convertProspectToFormData(
      prospect,
      getLocationByNeighborhoodId,
    );

    setSelectedProspectData(convertedForm);
    setShowSolicitudModal(true);
  };

  // Function to handle modal success (save/delete)
  const handleModalSuccess = () => {
    setShowSolicitudModal(false);
    setSelectedProspectData(undefined);
    // Reload prospects
    const loadProspects = async () => {
      try {
        const existingProspects =
          await getProspectsByContactWithAuth(contactId);
        setProspects(
          existingProspects.map((item) => item.prospects) as ProspectData[],
        );
      } catch (error) {
        console.error("Error loading prospects:", error);
      }
    };
    void loadProspects();
  };

  // Function to create new solicitud
  const createNewForm = () => {
    setSelectedProspectData(undefined);
    setShowSolicitudModal(true);
  };

  // Show skeleton while loading
  if (isLoading) {
    return <SolicitudesSkeleton />;
  }

  return (
    <>
      <Card className="relative p-4 transition-all duration-500 ease-out">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">
            SOLICITUDES DE BÚSQUEDA
          </h3>
          <Button
            onClick={createNewForm}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir solicitud
          </Button>
        </div>

        {/* Show saved prospects in compact view - Always visible */}
        <ProspectList prospects={prospects} onEdit={handleEditProspect} />

        {/* Empty state */}
        {prospects.length === 0 && <ProspectEmptyState />}
      </Card>

      {/* Contact Solicitud Modal */}
      <ContactSolicitudModal
        open={showSolicitudModal}
        onOpenChange={setShowSolicitudModal}
        contactId={contactId}
        initialData={selectedProspectData}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
