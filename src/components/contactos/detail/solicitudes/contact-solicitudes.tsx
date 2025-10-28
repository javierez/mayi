"use client";

import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  ContactInterestForm,
  type InterestFormData,
} from "../forms/contact-interest-form";
import { getProspectsByContactWithAuth } from "~/server/queries/prospect";
import { getLocationByNeighborhoodId } from "~/server/queries/locations";
import {
  type ProspectData,
  convertProspectToFormData,
  createNewInterestFormData,
} from "~/lib/prospect-utils";
import { ProspectList } from "./prospect-list";
import { ProspectEmptyState } from "./prospect-empty-state";
import { SolicitudesSkeleton } from "~/components/ui/skeletons";

interface ContactSolicitudesProps {
  contactId: bigint;
}

export function ContactSolicitudes({ contactId }: ContactSolicitudesProps) {
  // Interest forms state - Start empty, only show when explicitly creating/editing
  const [interestForms, setInterestForms] = useState<InterestFormData[]>([]);

  // Prospects state for tracking existing prospects
  const [prospects, setProspects] = useState<ProspectData[]>([]);
  const [, setEditingProspectId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing prospects for this contact
  useEffect(() => {
    const loadProspects = async () => {
      setIsLoading(true);
      try {
        const existingProspects = await getProspectsByContactWithAuth(contactId);
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

    setInterestForms([convertedForm]);
    setEditingProspectId(prospect.id.toString());
    setShowNewForm(false);
  };

  // Function to handle saving and returning to compact view
  const handleFormSaved = () => {
    setShowNewForm(false);
    setEditingProspectId(null);
    setInterestForms([]);
    // Reload prospects
    const loadProspects = async () => {
      try {
        const existingProspects = await getProspectsByContactWithAuth(contactId);
        setProspects(
          existingProspects.map((item) => item.prospects) as ProspectData[],
        );
      } catch (error) {
        console.error("Error loading prospects:", error);
      }
    };
    void loadProspects();
  };

  // Function to create new form
  const createNewForm = () => {
    const newForm = createNewInterestFormData();
    setInterestForms([newForm]);
    setShowNewForm(true);
    setEditingProspectId(null);
  };

  // Function to update interest form
  const updateInterestForm = (id: string, data: InterestFormData) => {
    setInterestForms(
      interestForms.map((form) => (form.id === id ? data : form)),
    );
  };

  // Show skeleton while loading
  if (isLoading) {
    return <SolicitudesSkeleton />;
  }

  return (
    <Card className="relative p-4 transition-all duration-500 ease-out">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          SOLICITUDES DE BÚSQUEDA
        </h3>
        {!showNewForm && interestForms.length === 0 && (
          <Button
            onClick={createNewForm}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir solicitud
          </Button>
        )}
      </div>

      {/* Show saved prospects in compact view - Always visible */}
      <ProspectList prospects={prospects} onEdit={handleEditProspect} />

      {/* Show edit form when editing or creating new */}
      {(showNewForm || interestForms.length > 0) && (
        <div className="space-y-6">
          {interestForms.map((form, index) => (
            <div key={form.id} className="space-y-4">
              <ContactInterestForm
                data={form}
                onUpdate={(data) => updateInterestForm(form.id, data)}
                onRemove={() => {
                  setInterestForms([]);
                  setShowNewForm(false);
                  setEditingProspectId(null);
                }}
                isRemovable={true}
                index={index}
                contactId={contactId}
                onSaved={handleFormSaved}
                onDeleted={handleFormSaved}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {prospects.length === 0 && !showNewForm && interestForms.length === 0 && (
        <ProspectEmptyState />
      )}
    </Card>
  );
}
