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

export function ParaTiFeed({ initialItems }: ParaTiFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFetchingRef = useRef(false);

  // Fetch more items when approaching end of list
  const fetchMoreItems = useCallback(() => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;

    const excludeIds = items.map((item) => item.memory.id.toString());

    startTransition(async () => {
      const result = await fetchMoreFeedAction(excludeIds, FETCH_BATCH_SIZE);

      if (result.success && result.data) {
        if (result.data.length === 0) {
          setHasMore(false);
        } else {
          setItems((prev) => [...prev, ...result.data!]);
        }
      }
      isFetchingRef.current = false;
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

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, isMuted, items]);

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

  // Preload next 3 items for smoother scrolling
  const shouldPreload = (index: number) => {
    return index >= currentIndex - 1 && index <= currentIndex + 3;
  };

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
          shouldPreload={shouldPreload(index)}
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
