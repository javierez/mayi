"use client";

import type { ProspectData } from "~/lib/prospect-utils";
import { ContactProspectCompact } from "../forms/contact-prospect-compact";

interface ProspectListProps {
  prospects: ProspectData[];
  onEdit: (prospect: ProspectData) => void;
}

/**
 * Displays a grid of saved prospect cards in compact view
 */
export function ProspectList({ prospects, onEdit }: ProspectListProps) {
  if (prospects.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {prospects.map((prospect) => (
          <ContactProspectCompact
            key={prospect.id.toString()}
            prospect={prospect}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
