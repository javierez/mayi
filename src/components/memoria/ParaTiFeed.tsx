"use client";

import { useRef, useEffect, useState, useCallback, useTransition } from "react";
import { FeedItem } from "./FeedItem";
import { fetchMoreFeedAction } from "~/server/actions/memoria/feed";
import type { FeedItem as FeedItemType } from "~/server/queries/memoria/feed";

interface ParaTiFeedProps {
  initialItems: FeedItemType[];
}

const FETCH_THRESHOLD = 3;
const FETCH_BATCH_SIZE = 5;
const FETCH_DEBOUNCE_MS = 1000;
const PRELOAD_AHEAD = 5;

export function ParaTiFeed({ initialItems }: ParaTiFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs for stable closures
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const currentIndexRef = useRef(0);
  const itemsRef = useRef(items);
  const hasMoreRef = useRef(hasMore);
  const loadingStartedRef = useRef<Set<string>>(new Set());

  // Keep refs in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Stable fetch function using refs
  const fetchMoreItems = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_DEBOUNCE_MS) return;
    if (isFetchingRef.current || !hasMoreRef.current) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    const currentItems = itemsRef.current;
    const excludeIds = currentItems.map((item) => item.memory.id.toString());

    startTransition(async () => {
      try {
        const result = await fetchMoreFeedAction(excludeIds, FETCH_BATCH_SIZE);

        if (result.success && result.data) {
          if (result.data.length === 0) {
            setHasMore(false);
          } else {
            setItems((prev) => [...prev, ...result.data!]);
          }
        }
      } catch (error) {
        console.error("Error fetching more items:", error);
      } finally {
        isFetchingRef.current = false;
      }
    });
  }, []);

  // Setup IntersectionObserver for detecting current visible item
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible entry
        let maxRatio = 0;
        let mostVisibleIndex = currentIndexRef.current;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const index = parseInt(entry.target.getAttribute("data-index") ?? "0", 10);
            mostVisibleIndex = index;
          }
        });

        // Only update if visibility is significant (>50%)
        if (maxRatio > 0.5 && mostVisibleIndex !== currentIndexRef.current) {
          setCurrentIndex(mostVisibleIndex);

          // Check if we should fetch more items
          const currentItems = itemsRef.current;
          if (mostVisibleIndex >= currentItems.length - FETCH_THRESHOLD && hasMoreRef.current && !isFetchingRef.current) {
            fetchMoreItems();
          }
        }
      },
      {
        root: container,
        threshold: [0.5, 0.75, 1.0], // Trigger at 50%, 75%, 100% visibility
        rootMargin: "0px",
      }
    );

    // Observe all item elements
    itemRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [items.length, fetchMoreItems]);

  // Handle audio playback when current item changes
  useEffect(() => {
    const currentItem = items[currentIndex];
    const previewUrl = currentItem?.song?.previewUrl;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (previewUrl && !isMuted) {
      const audio = new Audio(previewUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, [currentIndex, isMuted, items]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Track items that started loading
  useEffect(() => {
    items.forEach((item, index) => {
      const inWindow = index >= currentIndex - 1 && index <= currentIndex + PRELOAD_AHEAD;
      if (inWindow) {
        loadingStartedRef.current.add(item.memory.id.toString());
      }
    });
  }, [currentIndex, items]);

  // Stable shouldPreload function using refs
  const shouldPreload = useCallback((index: number, memoryId: string) => {
    if (loadingStartedRef.current.has(memoryId)) {
      return true;
    }
    const current = currentIndexRef.current;
    return index >= current - 1 && index <= current + PRELOAD_AHEAD;
  }, []);

  // Stable toggleMute function
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      if (audioRef.current) {
        if (newMuted) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      } else if (!newMuted) {
        const currentItem = itemsRef.current[currentIndexRef.current];
        const previewUrl = currentItem?.song?.previewUrl;
        if (previewUrl) {
          const audio = new Audio(previewUrl);
          audio.loop = true;
          audio.volume = 0.5;
          audio.play().catch(() => {});
          audioRef.current = audio;
        }
      }

      return newMuted;
    });
  }, []);

  // Register item ref callback
  const setItemRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-lg">No hay recuerdos aún</p>
          <p className="mt-2 text-sm text-gray-400">
            Añade fotos y videos en el calendario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll bg-black"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {items.map((item, index) => (
        <div
          key={item.memory.id.toString()}
          ref={(el) => setItemRef(item.memory.id.toString(), el)}
          data-index={index}
        >
          <FeedItem
            item={item}
            isActive={index === currentIndex}
            shouldPreload={shouldPreload(index, item.memory.id.toString())}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>
      ))}
      {isPending && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
