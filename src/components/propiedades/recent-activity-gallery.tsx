"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useEffect, useTransition, useRef } from "react";
import { GalleryPropertyCard } from "./gallery-property-card";
import { GalleryContactCard } from "./gallery-contact-card";
import { GalleryAgentCard } from "./gallery-agent-card";
import { HistoryFilter } from "./detail/history/history-filter";
import { Input } from "~/components/ui/input";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "~/components/hooks/use-debounce";
import { searchGalleryItems } from "~/server/queries/listing";

interface GalleryListing {
  listingId: bigint;
  propertyId: bigint;
  price: string;
  status: string;
  listingType: string;
  isBankOwned: boolean | null;
  referenceNumber: string | null;
  propertyType: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  agentName: string | null;
  imageUrl: string | null;
  imageUrl2: string | null;
}

interface ContactRole {
  role: "owner" | "buyer";
  listingId: bigint;
  referenceNumber: string | null;
}

interface GalleryContact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  roles: ContactRole[];
  updatedAt: Date;
}

interface GalleryAgent {
  userId: string;
  name: string;
  firstName: string;
  lastName: string | null;
  image: string | null;
  updatedAt: Date;
}

type GalleryItemType = "property" | "contact" | "agent";

interface GalleryItem {
  type: GalleryItemType;
  id: string;
  updatedAt: Date;
  data: GalleryListing | GalleryContact | GalleryAgent;
}

interface RecentActivityGalleryProps {
  listings: GalleryListing[];
  contacts: GalleryContact[];
  agents: GalleryAgent[];
  filterAgents?: Array<{ id: string; name: string }>;
}

export function RecentActivityGallery({
  listings,
  contacts,
  agents,
  filterAgents = [],
}: RecentActivityGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedListingId = searchParams.get("listingId");
  const selectedContactId = searchParams.get("contactId");
  const selectedAgentId = searchParams.get("agentId");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Search state (local only, not persisted in URL)
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<{
    listings: GalleryListing[];
    contacts: GalleryContact[];
    agents: GalleryAgent[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch search results when debounced search changes
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults(null);
      return;
    }

    startTransition(async () => {
      const results = await searchGalleryItems(debouncedSearch);
      setSearchResults(results);
    });
  }, [debouncedSearch]);

  // Use search results if active, otherwise use props
  const activeListings = searchResults?.listings ?? listings;
  const activeContacts = searchResults?.contacts ?? contacts;
  const activeAgents = searchResults?.agents ?? agents;

  // Merge and sort items by recent activity
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const propertyItems: GalleryItem[] = activeListings.map((listing) => ({
      type: "property" as const,
      id: `property-${listing.listingId.toString()}`,
      updatedAt: new Date(), // Properties don't have updatedAt in current data, use now
      data: listing,
    }));

    const contactItems: GalleryItem[] = activeContacts.map((contact) => ({
      type: "contact" as const,
      id: `contact-${contact.contactId.toString()}`,
      updatedAt: contact.updatedAt,
      data: contact,
    }));

    const agentItems: GalleryItem[] = activeAgents.map((agent) => ({
      type: "agent" as const,
      id: `agent-${agent.userId}`,
      updatedAt: agent.updatedAt,
      data: agent,
    }));

    // Combine and sort by updatedAt (most recent first)
    return [...propertyItems, ...contactItems, ...agentItems].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }, [activeListings, activeContacts, activeAgents]);

  // Get ALL listing IDs for the selected contact (both owner and buyer roles)
  const selectedContactAllListingIds = useMemo(() => {
    if (!selectedContactId) return new Set<string>();
    const selectedContact = contacts.find(
      (c) => c.contactId.toString() === selectedContactId,
    );
    return new Set(
      selectedContact?.roles.map((r) => r.listingId.toString()) ?? [],
    );
  }, [contacts, selectedContactId]);

  const handlePropertyClick = useCallback(
    (listingId: string, event: React.MouseEvent) => {
      const params = new URLSearchParams(searchParams.toString());
      const isModifierClick = event.ctrlKey || event.metaKey;

      // On touch devices, treat tap on related listing as multi-select
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isRelatedListing = selectedContactAllListingIds.has(listingId);
      const shouldKeepBoth = isModifierClick || (isTouchDevice && isRelatedListing);

      // Ctrl/Cmd+click (desktop) or tap on related listing (mobile) keeps both selected
      if (selectedContactId && shouldKeepBoth) {
        if (selectedListingId === listingId) {
          // Toggle off listing filter, keep contact
          params.delete("listingId");
        } else {
          params.set("listingId", listingId);
          params.set("page", "1");
        }
        // Keep contactId intact
      } else {
        // Normal click - clear contact and agent, select only listing
        params.delete("contactId");
        params.delete("agentId");
        if (selectedListingId === listingId) {
          params.delete("listingId");
        } else {
          params.set("listingId", listingId);
          params.set("page", "1");
        }
      }

      router.push(`/historial?${params.toString()}`);
    },
    [router, searchParams, selectedListingId, selectedContactId, selectedContactAllListingIds],
  );

  const handleContactClick = useCallback(
    (contactId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Clear other filters when selecting contact
      params.delete("listingId");
      params.delete("agentId");

      // Toggle selection
      if (selectedContactId === contactId) {
        params.delete("contactId");
      } else {
        params.set("contactId", contactId);
        params.set("page", "1");
      }

      router.push(`/historial?${params.toString()}`);
    },
    [router, searchParams, selectedContactId],
  );

  const handleAgentClick = useCallback(
    (agentId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Clear other filters when selecting agent
      params.delete("listingId");
      params.delete("contactId");

      // Toggle selection
      if (selectedAgentId === agentId) {
        params.delete("agentId");
      } else {
        params.set("agentId", agentId);
        params.set("page", "1");
      }

      router.push(`/historial?${params.toString()}`);
    },
    [router, searchParams, selectedAgentId],
  );

  const handleClearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("listingId");
    params.delete("contactId");
    params.delete("agentId");
    router.push(`/historial?${params.toString()}`);
  }, [router, searchParams]);

  const hasActiveFilter = Boolean(selectedListingId) || Boolean(selectedContactId) || Boolean(selectedAgentId);

  // Display items based on filter state
  // Exclusive visibility: only show the selected type, hide others
  const displayItems = useMemo(() => {
    const noFilters = !selectedListingId && !selectedContactId && !selectedAgentId;

    // No filters - show all items
    if (noFilters) {
      return galleryItems;
    }

    // Agent filter active - only show selected agent
    if (selectedAgentId) {
      return galleryItems.filter((item) => {
        if (item.type === "agent") {
          const agent = item.data as GalleryAgent;
          return agent.userId === selectedAgentId;
        }
        return false;
      });
    }

    // Both contact AND listing selected (via Ctrl/Cmd+click) - show contact + that listing
    if (selectedContactId && selectedListingId) {
      const filteredItems = galleryItems.filter((item) => {
        if (item.type === "contact") {
          const contact = item.data as GalleryContact;
          return contact.contactId.toString() === selectedContactId;
        }
        if (item.type === "property") {
          const listing = item.data as GalleryListing;
          return listing.listingId.toString() === selectedListingId;
        }
        return false;
      });

      // Sort: contact card first, then property
      return filteredItems.sort((a, b) => {
        if (a.type === "contact" && b.type === "property") return -1;
        if (a.type === "property" && b.type === "contact") return 1;
        return 0;
      });
    }

    // Only listing filter active - only show selected listing
    if (selectedListingId) {
      return galleryItems.filter((item) => {
        if (item.type === "property") {
          const listing = item.data as GalleryListing;
          return listing.listingId.toString() === selectedListingId;
        }
        return false;
      });
    }

    // Only contact filter active - show contact + ALL related listings (owner + buyer)
    if (selectedContactId) {
      const filteredItems = galleryItems.filter((item) => {
        // Always show the selected contact
        if (item.type === "contact") {
          const contact = item.data as GalleryContact;
          return contact.contactId.toString() === selectedContactId;
        }
        // Show ALL listings related to this contact (owner OR buyer)
        if (item.type === "property") {
          const listing = item.data as GalleryListing;
          return selectedContactAllListingIds.has(listing.listingId.toString());
        }
        return false;
      });

      // Sort: contact card first, then properties
      return filteredItems.sort((a, b) => {
        if (a.type === "contact" && b.type === "property") return -1;
        if (a.type === "property" && b.type === "contact") return 1;
        return 0;
      });
    }

    return galleryItems;
  }, [galleryItems, selectedContactId, selectedListingId, selectedAgentId, selectedContactAllListingIds]);

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
  }, [updateScrollButtons, displayItems]);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  // Early return if no items AND no search active
  // (We still want to show the search UI when search is active but has no results)
  const hasInitialData = listings.length > 0 || contacts.length > 0 || agents.length > 0;
  if (!hasInitialData && !searchInput) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Header row with search and filters - using grid for filter panel to span full width */}
      <div className="mb-2">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar propiedades, contactos, agentes..."
              className="h-8 border-0 pl-8 pr-8 text-sm shadow-md"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Hint for Ctrl/Cmd+click when contact is selected */}
          {selectedContactId && !selectedListingId && selectedContactAllListingIds.size > 0 ? (
            <p className="hidden text-[10px] text-muted-foreground/60 sm:block">
              <span className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">
                ⌘/Ctrl
              </span>
              {" + clic en propiedad para filtrar"}
            </p>
          ) : null}

          {/* Filters - renders button inline, content expands below */}
          <HistoryFilter agents={filterAgents} inline />
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <p className="mb-2 text-xs text-muted-foreground">Buscando...</p>
      )}

      {/* Empty search results */}
      {searchInput && !isPending && displayItems.length === 0 && (
        <p className="mb-2 text-sm text-muted-foreground">
          No se encontraron resultados para &quot;{searchInput}&quot;
        </p>
      )}
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
          <div className="flex items-center gap-3 px-4 pb-6 pt-1 sm:px-6 lg:px-8">
            {displayItems.map((item) => {
              if (item.type === "property") {
                const listing = item.data as GalleryListing;
                const listingIdStr = listing.listingId.toString();
                // Property is "related" if shown due to contact filter but not directly selected
                const isRelated =
                  Boolean(selectedContactId) &&
                  selectedContactAllListingIds.has(listingIdStr) &&
                  selectedListingId !== listingIdStr;
                return (
                  <GalleryPropertyCard
                    key={item.id}
                    listing={listing}
                    isSelected={selectedListingId === listingIdStr}
                    isRelated={isRelated}
                    onClick={handlePropertyClick}
                  />
                );
              } else if (item.type === "contact") {
                const contact = item.data as GalleryContact;
                return (
                  <GalleryContactCard
                    key={item.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.contactId.toString()}
                    onClick={handleContactClick}
                  />
                );
              } else {
                const agent = item.data as GalleryAgent;
                return (
                  <GalleryAgentCard
                    key={item.id}
                    agent={agent}
                    isSelected={selectedAgentId === agent.userId}
                    onClick={handleAgentClick}
                  />
                );
              }
            })}
            {/* Clear filter button - inline with cards */}
            {hasActiveFilter && (
              <button
                onClick={handleClearFilter}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-muted"
                title="Quitar filtros"
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

      {/* Separator */}
      <div className="border-t border-border" />
    </div>
  );
}
