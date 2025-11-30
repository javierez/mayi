"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { UserCog } from "lucide-react";
import Image from "next/image";

export interface GalleryAgent {
  userId: string;
  name: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
  updatedAt: Date;
}

interface GalleryAgentCardProps {
  agent: GalleryAgent;
  isSelected?: boolean;
  onClick?: (agentId: string) => void;
}

// Get initials from name (e.g., "Juan Pérez" -> "JP")
function getInitials(firstName: string, lastName: string | null): string {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName?.charAt(0).toUpperCase() ?? "";
  return `${firstInitial}${lastInitial}`;
}

// Agent-specific color palette - warm tones to complement avatar images
function getAgentCardColor(): React.CSSProperties {
  return {
    background: "linear-gradient(135deg, rgba(251, 207, 162, 0.4) 0%, rgba(255, 182, 140, 0.35) 50%, rgba(240, 165, 130, 0.3) 100%)",
    borderColor: "rgba(240, 165, 130, 0.3)",
  };
}

export const GalleryAgentCard = React.memo(function GalleryAgentCard({
  agent,
  isSelected = false,
  onClick,
}: GalleryAgentCardProps) {
  const handleClick = () => {
    onClick?.(agent.userId);
  };

  // Get display name
  const displayName = agent.lastName
    ? `${agent.firstName} ${agent.lastName}`
    : agent.firstName;

  // Get initials for fallback
  const initials = getInitials(agent.firstName, agent.lastName);

  const colorStyle = getAgentCardColor();

  return (
    <div className="block flex-shrink-0 cursor-pointer" onClick={handleClick}>
      <Card
        className={cn(
          "group w-48 overflow-hidden transition-all hover:shadow-lg",
          isSelected && "ring-2 ring-primary ring-offset-2",
        )}
      >
        {/* Top color area - same aspect ratio as property image */}
        <div
          className="relative flex aspect-[3/2] items-center justify-center"
          style={colorStyle}
        >
          {/* Avatar with image or initials fallback */}
          <div
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-full bg-white/80 shadow-sm",
              agent.image ? "h-24 w-24" : "h-20 w-20"
            )}
          >
            {agent.image ? (
              <Image
                src={agent.image}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-amber-800">
                {initials}
              </span>
            )}
          </div>

          {/* Agent badge - positioned like role badges on contact cards */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            <Badge
              variant="outline"
              className="flex items-center gap-0.5 border-amber-300 bg-white/80 px-1.5 py-0 text-[10px] text-amber-800"
            >
              <UserCog className="h-2.5 w-2.5" />
              Agente
            </Badge>
          </div>
        </div>

        <CardContent className="p-2">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 flex-1 text-xs font-medium">
              {displayName}
            </h3>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/40 p-2 pt-1.5">
          <p className="line-clamp-1 text-[10px] text-muted-foreground/80">
            Equipo
          </p>
        </CardFooter>
      </Card>
    </div>
  );
});
