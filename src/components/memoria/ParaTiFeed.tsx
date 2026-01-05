"use client";

import { useRef, useEffect, useState, useCallback, useTransition } from "react";
import { FeedItem } from "./FeedItem";
import { fetchMoreFeedAction } from "~/server/actions/memoria/feed";
import type { FeedItem as FeedItemType } from "~/server/queries/memoria/feed";

interface ParaTiFeedProps {
  initialItems: FeedItemType[];
}

const FETCH_THRESHOLD = 3; // Fetch more when 3 items from end
const FETCH_BATCH_SIZE = 10; // Fetch 10 more items at a time
const FETCH_DEBOUNCE_MS = 1000; // Minimum time between fetches
const PRELOAD_AHEAD = 3; // Preload next N items

export function ParaTiFeed({ initialItems }: ParaTiFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  // Track items that started loading - never unload them
  const loadingStartedRef = useRef<Set<string>>(new Set());

  // Fetch more items when approaching end of list (debounced)
  const fetchMoreItems = useCallback(() => {
    const now = Date.now();

    // Debounce: don't fetch if we fetched recently
    if (now - lastFetchTimeRef.current < FETCH_DEBOUNCE_MS) return;
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    const excludeIds = items.map((item) => item.memory.id.toString());

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
        // Don't set hasMore to false on error, allow retry
      } finally {
        isFetchingRef.current = false;
      }
    });
  }, [items, hasMore]);

  // Handle scroll to detect current visible item
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
        setCurrentIndex(newIndex);

        // Check if we should fetch more items
        if (newIndex >= items.length - FETCH_THRESHOLD && hasMore && !isFetchingRef.current) {
          fetchMoreItems();
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, items.length, hasMore, fetchMoreItems]);

  // Handle audio playback when current item changes
  useEffect(() => {
    const currentItem = items[currentIndex];
    const previewUrl = currentItem?.song?.previewUrl;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Play new audio if available and not muted
    if (previewUrl && !isMuted) {
      const audio = new Audio(previewUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Auto-play was prevented, user needs to interact
      });
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

  // Mark items in preload window as started (effect, not during render)
  // MUST be before any conditional returns - React hooks order matters
  useEffect(() => {
    items.forEach((item, index) => {
      const inWindow = index >= currentIndex - 1 && index <= currentIndex + PRELOAD_AHEAD;
      if (inWindow) {
        loadingStartedRef.current.add(item.memory.id.toString());
      }
    });
  }, [currentIndex, items]);

  // Check if item should preload - pure function, no side effects
  const shouldPreload = useCallback((index: number, memoryId: string) => {
    // Already started loading? Keep it loaded
    if (loadingStartedRef.current.has(memoryId)) {
      return true;
    }
    // Within preload window
    return index >= currentIndex - 1 && index <= currentIndex + PRELOAD_AHEAD;
  }, [currentIndex]);

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
        // Start playing current song
        const currentItem = items[currentIndex];
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
  }, [currentIndex, items]);

  // Empty state - after all hooks
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
        <FeedItem
          key={item.memory.id.toString()}
          item={item}
          isActive={index === currentIndex}
          shouldPreload={shouldPreload(index, item.memory.id.toString())}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      ))}
      {/* Loading indicator */}
      {isPending && (
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
