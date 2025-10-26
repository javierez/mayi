"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ChevronDown } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { ModernSaveIndicator } from "../common/modern-save-indicator";
import type { SaveState } from "~/types/save-state";
import { navigateToPage } from "~/lib/navigation";

interface Agent {
  id: string;
  name: string;
}

interface Owner {
  id: number;
  name: string;
}

interface ContactInfoCardProps {
  selectedOwnerIds: string[];
  owners: Owner[];
  filteredOwners: Owner[];
  ownerSearch: string;
  selectedAgentId: string;
  agents: Agent[];
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  setSelectedOwnerIds: (value: string[]) => void;
  setOwnerSearch: (value: string) => void;
  setSelectedAgentId: (value: string) => void;
  getCardStyles: (moduleName: string) => string;
}

export const ContactInfoCard = React.forwardRef<HTMLDivElement, ContactInfoCardProps>(
  ({
    selectedOwnerIds,
    owners,
    filteredOwners,
    ownerSearch,
    selectedAgentId,
    agents,
    collapsedSections,
    saveState,
    canEdit = true,
    onToggleSection,
    onSave,
    onUpdateModule,
    setSelectedOwnerIds,
    setOwnerSearch,
    setSelectedAgentId,
    getCardStyles,
  }, ref) => {
    const router = useRouter();
    return (
      <Card
        ref={ref}
        className={cn(
          "relative p-4 transition-all duration-500 ease-out",
          getCardStyles("contactInfo"),
        )}
      >
      <ModernSaveIndicator
        state={saveState}
        onSave={onSave}
      />
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onToggleSection("contactInfo")}
          className="group flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              DATOS DE CONTACTO
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              collapsedSections.contactInfo && "rotate-180",
            )}
          />
        </button>
      </div>
      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          collapsedSections.contactInfo ? "max-h-0" : "max-h-[1000px]",
        )}
      >
        <div className="space-y-1.5">
          <Label htmlFor="owners" className="text-sm">
            Propietarios
          </Label>
          <div className="flex gap-2">
            <Select
              value={selectedOwnerIds[0]} // We'll handle multiple selection differently
              onValueChange={(value) => {
                if (!selectedOwnerIds.includes(value)) {
                  setSelectedOwnerIds([...selectedOwnerIds, value]);
                  onUpdateModule(true);
                }
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 flex-1 text-gray-500">
                <SelectValue placeholder="Añadir propietario" />
              </SelectTrigger>
              <SelectContent>
                <div className="flex items-center px-3 pb-2">
                  <input
                    className="flex h-9 w-full rounded-md bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Buscar propietario..."
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                  />
                </div>
                <Separator className="mb-2" />
                {filteredOwners.map((owner) => (
                  <SelectItem
                    key={owner.id}
                    value={owner.id.toString()}
                    disabled={selectedOwnerIds.includes(owner.id.toString())}
                  >
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Display selected owners */}
          {selectedOwnerIds.length > 0 && (
            <div className="mt-2 space-y-1">
              {selectedOwnerIds.map((ownerId) => {
                const owner = owners.find((o) => o.id.toString() === ownerId);
                return owner ? (
                  <div
                    key={ownerId}
                    className="flex cursor-pointer items-center justify-between rounded-md bg-gradient-to-r from-amber-50/50 to-rose-50/50 px-2 py-1 shadow-md transition-all duration-200 hover:from-amber-50/40 hover:to-rose-50/40"
                    onClick={() => navigateToPage(`/contactos/${owner.id}`, router)}
                  >
                    <span className="text-sm">{owner.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        setSelectedOwnerIds(
                          selectedOwnerIds.filter((id) => id !== ownerId),
                        );
                        onUpdateModule(true);
                      }}
                      disabled={!canEdit}
                    >
                      ×
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agent" className="text-sm">
            Agente
          </Label>
          <div className="flex gap-2">
            <Select
              value={selectedAgentId}
              onValueChange={(value) => {
                setSelectedAgentId(value);
                onUpdateModule(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-8 flex-1 text-gray-500">
                <SelectValue placeholder="Seleccionar agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
});

ContactInfoCard.displayName = "ContactInfoCard";