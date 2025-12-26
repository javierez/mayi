"use client";

import { Plus, Link2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { InboxContact } from "./inbox-types";

interface LinkableContactAvatarProps {
  contact: InboxContact;
  size?: "sm" | "md" | "lg";
  onClick?: (contact: InboxContact) => void;
  className?: string;
  useGroupHover?: boolean; // Use parent's group-hover for showing overlay
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
  onClick,
  className,
  useGroupHover = false,
}: LinkableContactAvatarProps) {
  const isLinked = contact.isLinked ?? false;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(contact);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          !isLinked && "border-2 border-dashed border-rose-400/60",
          isLinked && "border-2 border-solid border-primary/40",
        )}
      >
        {contact.avatar ? (
          <AvatarImage src={contact.avatar} alt={contact.name} />
        ) : null}
        <AvatarFallback
          className={cn(
            "text-xs",
            isLinked
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {getInitials(contact.name)}
        </AvatarFallback>
      </Avatar>

      {/* Clickable overlay - always available, different appearance for linked/unlinked */}
      {onClick ? (
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "rounded-full text-white",
            "transition-opacity duration-150",
            // Different colors for linked vs unlinked
            isLinked
              ? "bg-primary/90 hover:bg-primary"
              : "bg-rose-500/90 hover:bg-rose-600",
            // Hide by default, show on hover
            useGroupHover
              ? "opacity-0 group-hover:opacity-100"
              : "opacity-0 hover:opacity-100",
          )}
          title={isLinked ? "Vincular propiedad" : "Crear contacto"}
        >
          {isLinked ? (
            <Link2 className={iconSizeClasses[size]} />
          ) : (
            <Plus className={iconSizeClasses[size]} />
          )}
        </button>
      ) : null}
    </div>
  );
}
