"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { generatePropertyTitle } from "~/lib/property-title";

interface PropertyTitleProps {
  propertyType: string;
  street?: string;
  neighborhood?: string;
  overrideTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  editable?: boolean;
}

export function PropertyTitle({
  propertyType,
  street = "",
  neighborhood = "",
  overrideTitle,
  onTitleChange,
  editable = false,
}: PropertyTitleProps) {
  const titleValue =
    overrideTitle ?? generatePropertyTitle(propertyType, street, neighborhood);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="title" className="text-sm">
        Título
      </Label>
      <Input
        id="title"
        value={titleValue}
        onChange={(e) => onTitleChange?.(e.target.value)}
        className={editable ? "h-8 text-gray-500" : "h-8 bg-muted"}
        disabled={!editable}
      />
    </div>
  );
}
