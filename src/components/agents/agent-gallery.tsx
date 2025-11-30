"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  GalleryAgentCard,
  type GalleryAgent,
} from "~/components/propiedades/gallery-agent-card";
import { Separator } from "~/components/ui/separator";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type { GalleryAgent };

interface AgentGalleryProps {
  agents: GalleryAgent[];
  currentUserId: string;
}

export function AgentGallery({ agents, currentUserId }: AgentGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAgentId = searchParams.get("agentId") ?? currentUserId;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // When an agent is selected, only show that agent
  const displayAgents = useMemo(() => {
    // If selected agent is different from current user, only show selected
    if (selectedAgentId && selectedAgentId !== currentUserId) {
      const selected = agents.find((a) => a.userId === selectedAgentId);
      return selected ? [selected] : agents;
    }
    return agents;
  }, [agents, selectedAgentId, currentUserId]);

  // Check scroll position to show/hide navigation buttons
  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", updateScrollButtons);
      }
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, displayAgents]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const handleAgentClick = useCallback(
    (agentId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Toggle selection - if clicking current selection, go back to current user
      if (selectedAgentId === agentId && agentId !== currentUserId) {
        params.delete("agentId");
      } else if (agentId !== currentUserId) {
        params.set("agentId", agentId);
      } else {
        // Clicking current user - remove param to use default
        params.delete("agentId");
      }

      router.push(`/agents?${params.toString()}`);
    },
    [router, searchParams, selectedAgentId, currentUserId],
  );

  const handleClearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("agentId");
    router.push(`/agents?${params.toString()}`);
  }, [router, searchParams]);

  // Check if a non-default agent is selected
  const hasActiveFilter = selectedAgentId !== currentUserId;

  // Early return if no agents
  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 mt-4">
      <div className="relative">
        {/* Left navigation button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="-mx-4 overflow-x-hidden sm:-mx-6 lg:-mx-8"
        >
          <div className="flex items-center gap-3 px-4 pb-5 pt-1 sm:px-6 lg:px-8">
            {displayAgents.map((agent) => (
              <GalleryAgentCard
                key={agent.userId}
                agent={agent}
                isSelected={selectedAgentId === agent.userId}
                onClick={handleAgentClick}
              />
            ))}
            {/* Show restore button inline when agent is selected */}
            {hasActiveFilter && (
              <button
                onClick={handleClearFilter}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-muted"
                title="Ver todos"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Right navigation button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <Separator className="mt-2" />
    </div>
  );
}
