"use client";

import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ProspectMatch } from "~/types/connection-matches";

interface ContactMatchGroupProps {
  contactId: string;
  contactName: string;
  matches: ProspectMatch[];
  children: React.ReactNode;
}

export function ContactMatchGroup({
  contactName,
  matches,
  children,
}: ContactMatchGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div>
        <CollapsibleTrigger className="group flex w-full items-center gap-2 py-2 hover:opacity-70 transition-opacity">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
          <h3 className="text-sm font-medium text-gray-700">
            {contactName}
          </h3>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="space-y-6">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
