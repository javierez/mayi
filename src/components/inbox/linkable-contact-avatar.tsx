"use client";

import { Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { InboxContact } from "./inbox-types";

interface LinkableContactAvatarProps {
  contact: InboxContact;
  size?: "sm" | "md" | "lg";
  onLinkClick?: (contact: InboxContact) => void;
  className?: string;
  useGroupHover?: boolean; // Use parent's group-hover for showing '+' button
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function LinkableContactAvatar({
  contact,
  size = "md",
  onLinkClick,
  className,
  useGroupHover = false,
}: LinkableContactAvatarProps) {
  const isUnlinked = !contact.isLinked;

  const handleClick = (e: React.MouseEvent) => {
    if (isUnlinked && onLinkClick) {
      e.stopPropagation();
      onLinkClick(contact);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          isUnlinked && "border-2 border-dashed border-rose-400/60",
        )}
      >
        {contact.avatar ? (
          <AvatarImage src={contact.avatar} alt={contact.name} />
        ) : null}
        <AvatarFallback className="bg-muted text-xs text-muted-foreground">
          {getInitials(contact.name)}
        </AvatarFallback>
      </Avatar>

      {/* '+' overlay for unlinked contacts - shows on parent group hover */}
      {isUnlinked && onLinkClick ? (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "rounded-full bg-rose-500/90 text-white",
            "transition-opacity duration-150",
            "hover:bg-rose-600",
            // Hide by default, show on hover (group-hover or self-hover)
            useGroupHover
              ? "opacity-0 group-hover:opacity-100"
              : "opacity-0 hover:opacity-100",
          )}
          title="Crear contacto"
        >
          <Plus className={iconSizeClasses[size]} />
        </button>
      ) : null}
    </div>
  );
}
